import React, { useState } from 'react';
import { useApp } from '../MultiCompanyApp';

const FileUpload = ({ relatedToType, relatedToId, onUploadSuccess }) => {
  const { apiCall } = useApp();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('يرجى اختيار ملف');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (relatedToType) formData.append('related_to_type', relatedToType);
      if (relatedToId) formData.append('related_to_id', relatedToId);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('فشل رفع الملف');

      const result = await response.json();
      alert('تم رفع الملف بنجاح');
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess(result);
    } catch (error) {
      alert('خطأ في رفع الملف: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded p-4 mb-4" dir="rtl">
      <h3 className="text-lg font-semibold mb-2">رفع ملف</h3>
      <div className="flex gap-2 items-center">
        <input
          type="file"
          onChange={handleFileSelect}
          className="flex-1 border rounded px-3 py-2"
          disabled={uploading}
        />
        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? 'جاري الرفع...' : 'رفع'}
        </button>
      </div>
      {selectedFile && (
        <p className="text-sm text-gray-600 mt-2">
          الملف المحدد: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </p>
      )}
    </div>
  );
};

export default FileUpload;
