import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

const ComplianceItem = ({ title, items }) => (
  <div className="bg-white rounded-2xl border-2 p-6 shadow-sm">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-sm font-semibold">Document / المستند</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Number / الرقم</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Expiry / الانتهاء</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Status / الحالة</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-3">{item.name}</td>
              <td className="px-4 py-3 font-mono text-sm">{item.number}</td>
              <td className="px-4 py-3">{item.expiry}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  item.status === 'Valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Licenses = () => (
  <ComplianceItem
    title="الرخص / Licenses"
    items={[
      { name: 'Business License', number: 'BL-2024-001', expiry: '2025-12-31', status: 'Valid' },
      { name: 'Operating Permit', number: 'OP-2024-045', expiry: '2025-06-30', status: 'Valid' },
      { name: 'Environmental License', number: 'ENV-2024-023', expiry: '2025-03-15', status: 'Valid' }
    ]}
  />
);

const Insurance = () => (
  <ComplianceItem
    title="التأمين / Insurance"
    items={[
      { name: 'Equipment Insurance', number: 'INS-EQ-2024', expiry: '2025-08-31', status: 'Valid' },
      { name: 'Liability Insurance', number: 'INS-LI-2024', expiry: '2025-12-31', status: 'Valid' },
      { name: 'Workers Compensation', number: 'INS-WC-2024', expiry: '2025-10-15', status: 'Valid' }
    ]}
  />
);

const Certificates = () => (
  <ComplianceItem
    title="الشهادات / Company Certificates"
    items={[
      { name: 'Commercial Register / السجل التجاري', number: '1234567890', expiry: '2026-01-01', status: 'Valid' },
      { name: 'Classification Certificate / شهادة تصنيف', number: 'CLASS-2024-A', expiry: '2025-12-31', status: 'Valid' },
      { name: 'ISO Certificate / شهادة ايزو', number: 'ISO-9001-2024', expiry: '2026-06-30', status: 'Valid' },
      { name: 'Careers Certificate / رخصة مهن', number: 'CAR-2024-567', expiry: '2025-09-30', status: 'Valid' }
    ]}
  />
);

const CompliancePage = () => {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الامتثال / Compliance</h1>
        <p className="text-gray-600 mt-1">إدارة الرخص والتأمينات والشهادات</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link to="/compliance/licenses" className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium hover:bg-gray-50">Licenses / الرخص</Link>
        <Link to="/compliance/insurance" className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium hover:bg-gray-50">Insurance / التأمين</Link>
        <Link to="/compliance/certificates" className="px-4 py-2 bg-white border-2 rounded-lg text-sm font-medium hover:bg-gray-50">Certificates / الشهادات</Link>
      </div>

      <Routes>
        <Route path="licenses" element={<Licenses />} />
        <Route path="insurance" element={<Insurance />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="/" element={<Licenses />} />
      </Routes>
    </div>
  );
};

export default CompliancePage;