import React, { useState } from 'react';

const CSVImport = ({ moduleName, importEndpoint, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('يرجى اختيار ملف CSV');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('يرجى اختيار ملف CSV');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${importEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('فشل استيراد البيانات');

      const result = await response.json();
      
      if (result.success) {
        alert(`تم استيراد ${result.imported_count} سجل بنجاح`);
        if (result.errors && result.errors.length > 0) {
          console.log('Errors:', result.errors);
          alert(`تحذير: حدثت ${result.errors.length} أخطاء أثناء الاستيراد. تحقق من وحدة التحكم للحصول على التفاصيل`);
        }
        setSelectedFile(null);
        if (onImportSuccess) onImportSuccess(result);
      } else {
        throw new Error(result.error || 'فشل الاستيراد');
      }
    } catch (error) {
      alert('خطأ في استيراد البيانات: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="border rounded p-4" dir="rtl">
      <h3 className="text-lg font-semibold mb-2">استيراد من CSV</h3>
      <div className="flex gap-2 items-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="flex-1 border rounded px-3 py-2"
          disabled={importing}
        />
        <button
          onClick={handleImport}
          disabled={importing || !selectedFile}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {importing ? 'جاري الاستيراد...' : 'استيراد'}
        </button>
      </div>
      {selectedFile && (
        <p className="text-sm text-gray-600 mt-2">
          الملف المحدد: {selectedFile.name}
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        تأكد من أن ملف CSV يحتوي على الأعمدة المطلوبة في الصف الأول
      </p>
    </div>
  );
};

export default CSVImport;
