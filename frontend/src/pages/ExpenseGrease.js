import React, { useState } from 'react';

const ExpenseGrease = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grease Expenses</h1>
          <p className="text-gray-600 mt-1">مصاريف الشحم</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Expense'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-500">Grease expenses will be displayed here</p>
      </div>
    </div>
  );
};

export default ExpenseGrease;
