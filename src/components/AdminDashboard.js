// src/components/AdminDashboard.js
import React from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import { HiOutlineUsers, HiOutlineClipboardList, HiOutlineCog, HiOutlineSupport } from 'react-icons/hi';

// Placeholder components for each feature
const DataManagement = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-3">Data Management</h2>
    <p>Tools for managing student records, faculty information, and course data.</p>
    <p>Access control to ensure only authorized personnel can modify sensitive information.</p>
  </div>
);

const ReportingAnalytics = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-3">Reporting and Analytics</h2>
    <p>Generate comprehensive reports on student performance, course enrollments, and faculty evaluations.</p>
    <p>Visual dashboards to monitor overall system health and user engagement.</p>
  </div>
);

const SystemConfiguration = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-3">System Configuration</h2>
    <p>Ability to configure system settings, manage user roles, and control access levels.</p>
    <p>Integration with external systems for data import/export.</p>
  </div>
);

const UserSupport = () => (
  <div>
    <h2 className="text-2xl font-semibold mb-3">User Support</h2>
    <p>Tools for managing user support requests and feedback.</p>
    <p>Comprehensive logs for system usage and issues to inform future enhancements.</p>
  </div>
);

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
                to="/admin-dashboard/data-management"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineUsers className="mr-2 text-xl" />
                Data Management
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/reports-analytics"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineClipboardList className="mr-2 text-xl" />
                Reporting and Analytics
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/system-configuration"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineCog className="mr-2 text-xl" />
                System Configuration
              </Link>
            </li>
            <li>
              <Link
                to="/admin-dashboard/user-support"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineSupport className="mr-2 text-xl" />
                User Support
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5">
        <Routes>
          <Route path="/data-management" element={<DataManagement />} />
          <Route path="/reports-analytics" element={<ReportingAnalytics />} />
          <Route path="/system-configuration" element={<SystemConfiguration />} />
          <Route path="/user-support" element={<UserSupport />} />
          <Route path="/" element={
            <div className="max-w-2xl mx-auto bg-white p-5 border rounded-lg shadow-lg">
              <h1 className="text-3xl font-bold mb-5 text-center text-red-600">Welcome, Admin!</h1>
              <p className="text-center mb-5 text-gray-600">Here you can manage data, view reports, configure system settings, and provide user support.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
