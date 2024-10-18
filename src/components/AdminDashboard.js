// src/components/AdminDashboard.js
import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { HiOutlineUserAdd, HiOutlineAdjustments, HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';

// Import the components from their respective files
import CreateEvaluatorAccount from './CreateEvaluatorAccount';
import ContentCustomization from './ContentCustomization';
import Reports from './Reports';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="md:w-72 bg-white border-r shadow-md md:h-screen md:flex md:flex-col">
        <div className="p-5">
          <h2 className="text-2xl font-bold text-center text-red-600">Admin Dashboard</h2>
        </div>
        <nav className="mt-5 flex-grow">
          <ul className="space-y-2">
            <li>
              <Link
                to="/admin-dashboard/create-evaluator-account"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineUserAdd className="mr-2 text-xl" />
                Create Evaluator Account
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/content-customization"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineAdjustments className="mr-2 text-xl" />
                Content Customization
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/reports"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineClipboardList className="mr-2 text-xl" />
                Reports
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/system-settings"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineCog className="mr-2 text-xl" />
                System Settings
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5">
        <Routes>
          <Route path="/create-evaluator-account" element={<CreateEvaluatorAccount />} />
          <Route path="/content-customization" element={<ContentCustomization />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/system-settings" element={<SystemSettings />} />
          <Route path="/" element={
            <div className="max-w-2xl mx-auto bg-white p-5 border rounded-lg shadow-lg">
              <h1 className="text-3xl font-bold mb-5 text-center text-red-600">Welcome, Admin!</h1>
              <p className="text-center mb-5 text-gray-600">Use this dashboard to manage evaluator accounts, customize system content, generate reports, and adjust system settings.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
