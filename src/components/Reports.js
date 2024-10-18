// src/components/Reports.js
import React, { useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const firestore = getFirestore();

  const handleGenerateReports = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'students'));
      const reportData = querySnapshot.docs.map((doc) => doc.data());
      setReports(reportData);
    } catch (error) {
      console.error('Error generating reports:', error);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-5 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Reports</h2>
      <button
        onClick={handleGenerateReports}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mb-5"
      >
        Generate Reports
      </button>
      <div className="overflow-y-auto max-h-64">
        {reports.length > 0 ? (
          <ul className="space-y-2">
            {reports.map((report, index) => (
              <li key={index} className="bg-gray-100 p-2 rounded shadow">
                <p>{JSON.stringify(report)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reports available. Click "Generate Reports" to fetch data.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;
