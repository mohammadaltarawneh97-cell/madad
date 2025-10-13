"""
File Management API Routes
MinIO-based file upload, preview, and download functionality
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import uuid
import io
import os
from minio import Minio
from minio.error import S3Error

from server import get_current_user, db
from models import User, CompanyBaseModel
from pydantic import BaseModel

router = APIRouter(prefix="/api/files", tags=["files"])

# MinIO Configuration (using local MinIO)
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "khairit-files")

# Initialize MinIO client
try:
    minio_client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )
    
    # Ensure bucket exists
    if not minio_client.bucket_exists(MINIO_BUCKET):
        minio_client.make_bucket(MINIO_BUCKET)
        print(f"Created bucket: {MINIO_BUCKET}")
except Exception as e:
    print(f"MinIO initialization warning: {e}")
    print("File upload will use fallback method if MinIO is not available")
    minio_client = None


class FileMetadata(CompanyBaseModel):
    """File metadata stored in MongoDB"""
    file_id: str
    original_filename: str
    stored_filename: str
    file_size: int
    content_type: str
    upload_date: datetime
    uploaded_by: str
    uploaded_by_name: str
    
    # Related entity
    related_to_type: Optional[str] = None  # expense_claim, contract, etc.
    related_to_id: Optional[str] = None
    
    # MinIO path
    bucket: str
    object_path: str
    
    # Status
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    content_type: str
    url: str


# ============================================================================
# FILE UPLOAD
# ============================================================================

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    related_to_type: Optional[str] = None,
    related_to_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Upload a file to MinIO"""
    try:
        # Generate unique file ID and stored filename
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        stored_filename = f"{file_id}{file_extension}"
        object_path = f"{current_user.current_company_id}/{stored_filename}"
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Upload to MinIO if available
        if minio_client:
            try:
                minio_client.put_object(
                    MINIO_BUCKET,
                    object_path,
                    io.BytesIO(file_content),
                    file_size,
                    content_type=file.content_type or "application/octet-stream"
                )
            except S3Error as e:
                raise HTTPException(status_code=500, detail=f"MinIO upload failed: {str(e)}")
        else:
            # Fallback: store in local filesystem
            upload_dir = f"/app/uploads/{current_user.current_company_id}"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, stored_filename)
            with open(file_path, "wb") as f:
                f.write(file_content)
        
        # Save metadata to MongoDB
        file_metadata = FileMetadata(
            id=file_id,
            company_id=current_user.current_company_id,
            file_id=file_id,
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            upload_date=datetime.now(timezone.utc),
            uploaded_by=current_user.id,
            uploaded_by_name=current_user.full_name,
            related_to_type=related_to_type,
            related_to_id=related_to_id,
            bucket=MINIO_BUCKET,
            object_path=object_path,
            created_by=current_user.id,
            created_at=datetime.now(timezone.utc)
        )
        
        await db.file_metadata.insert_one(file_metadata.dict())
        
        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=file_size,
            content_type=file.content_type or "application/octet-stream",
            url=f"/api/files/{file_id}/download"
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


# ============================================================================
# FILE DOWNLOAD
# ============================================================================

@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file"""
    # Get file metadata
    file_meta = await db.file_metadata.find_one({
        "file_id": file_id,
        "company_id": current_user.current_company_id,
        "is_deleted": False
    })
    
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Try MinIO first
        if minio_client:
            try:
                response = minio_client.get_object(MINIO_BUCKET, file_meta['object_path'])
                file_content = response.read()
                response.close()
            except S3Error:
                # Fallback to local filesystem
                file_path = f"/app/uploads/{current_user.current_company_id}/{file_meta['stored_filename']}"
                with open(file_path, "rb") as f:
                    file_content = f.read()
        else:
            # Local filesystem
            file_path = f"/app/uploads/{current_user.current_company_id}/{file_meta['stored_filename']}"
            with open(file_path, "rb") as f:
                file_content = f.read()
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type=file_meta['content_type'],
            headers={
                "Content-Disposition": f"attachment; filename={file_meta['original_filename']}"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File download failed: {str(e)}")


# ============================================================================
# FILE LISTING
# ============================================================================

@router.get("/", response_model=List[FileMetadata])
async def list_files(
    related_to_type: Optional[str] = None,
    related_to_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List all files for the company"""
    query = {
        "company_id": current_user.current_company_id,
        "is_deleted": False
    }
    
    if related_to_type:
        query["related_to_type"] = related_to_type
    if related_to_id:
        query["related_to_id"] = related_to_id
    
    files = await db.file_metadata.find(query).to_list(length=None)
    
    return [FileMetadata(**file) for file in files]


@router.get("/{file_id}", response_model=FileMetadata)
async def get_file_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get file metadata"""
    file_meta = await db.file_metadata.find_one({
        "file_id": file_id,
        "company_id": current_user.current_company_id,
        "is_deleted": False
    })
    
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileMetadata(**file_meta)


# ============================================================================
# FILE DELETION
# ============================================================================

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark file as deleted (soft delete)"""
    result = await db.file_metadata.update_one(
        {
            "file_id": file_id,
            "company_id": current_user.current_company_id,
            "is_deleted": False
        },
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {"message": "File deleted successfully"}
