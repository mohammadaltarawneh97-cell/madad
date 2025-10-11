from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.conf import settings
import boto3
from botocore.exceptions import ClientError
import uuid
from datetime import datetime, timedelta

class S3PresignedUploadView(APIView):
    """Generate presigned URLs for S3 file uploads"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        if not settings.USE_S3:
            return Response(
                {'error': 'S3 uploads not configured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file_name = request.data.get('fileName')
        file_type = request.data.get('fileType', 'application/octet-stream')
        folder = request.data.get('folder', 'uploads')
        
        if not file_name:
            return Response(
                {'error': 'fileName is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create S3 client
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            # Generate unique file key
            file_extension = file_name.split('.')[-1] if '.' in file_name else ''
            unique_filename = f"{uuid.uuid4()}.{file_extension}" if file_extension else str(uuid.uuid4())
            object_key = f"{folder}/{unique_filename}"
            
            # Generate presigned POST
            presigned_post = s3_client.generate_presigned_post(
                Bucket=settings.AWS_STORAGE_BUCKET_NAME,
                Key=object_key,
                Fields={'Content-Type': file_type},
                Conditions=[
                    {'Content-Type': file_type},
                    ['content-length-range', 1, 10485760]  # 1 byte to 10MB
                ],
                ExpiresIn=3600  # 1 hour
            )
            
            # Build the final URL where the file will be accessible
            if settings.AWS_S3_ENDPOINT_URL:
                file_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{object_key}"
            else:
                file_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{object_key}"
            
            return Response({
                'presignedPost': presigned_post,
                'fileUrl': file_url,
                'objectKey': object_key
            })
            
        except ClientError as e:
            return Response(
                {'error': f'S3 error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return Response(
                {'error': f'Server error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )