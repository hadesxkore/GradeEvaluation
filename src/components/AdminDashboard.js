// src/components/AdminDashboard.js
import React from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

import { Link, Routes, Route, useNavigate } from 'react-router-dom';
import { HiOutlineUserAdd, HiOutlineAdjustments, HiOutlineClipboardList, HiOutlineCog, HiOutlineLogout, HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import Modal from 'react-modal';

// Import the components from their respective files
import CreateEvaluatorAccount from './CreateEvaluatorAccount';
import ContentCustomization from './ContentCustomization';
import Reports from './Reports';
import SystemSettings from './SystemSettings';
import { getFirestore, doc, getDoc } from 'firebase/firestore';





const AdminDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userDoc = doc(db, 'users', user.uid); // Assume db is initialized earlier
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData.role === 'Admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate('/unauthorized'); // Redirect to unauthorized page
          }
        } else {
          setIsAdmin(false);
          navigate('/unauthorized'); // Redirect to unauthorized page
        }
      } else {
        setIsAuthenticated(false);
        navigate('/login'); // Redirect to login page
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);


  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);


  if (!isAuthenticated || !isAdmin) {
    return null; // Optionally, you can show a loading state or a placeholder
  }
  return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {/* Sidebar */}
        <aside className="md:w-72 bg-white border-r border-gray-200 shadow-lg md:h-screen md:flex md:flex-col">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-center text-red-600">Admin Dashboard</h2>
          </div>
          <nav className="mt-5 flex-grow">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin-dashboard/create-evaluator-account"
                  className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                  <HiOutlineUserAdd className="mr-2 text-xl" />
                  Create Evaluator Account
                </Link>
              </li>
              <li>
                <Link
                  to="/admin-dashboard/content-customization"
                  className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                  <HiOutlineAdjustments className="mr-2 text-xl" />
                  Content Customization
                </Link>
              </li>
              <li>
                <Link
                  to="/admin-dashboard/reports"
                  className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                  <HiOutlineClipboardList className="mr-2 text-xl" />
                  Reports
                </Link>
              </li>
              
              <li>
                <Link
                  to="/admin-dashboard/system-settings"
                  className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-red-500 hover:text-white transition-colors duration-200"
                >
                  <HiOutlineCog className="mr-2 text-xl" />
                  System Settings
                </Link>
              </li>
            </ul>
          </nav>
          <div className="p-5">
            <button
              onClick={openModal}
              className="w-full flex items-center justify-center px-4 py-3 text-white bg-red-500 rounded-lg shadow hover:bg-red-600 transition-colors duration-200"
            >
              <HiOutlineLogout className="mr-2 text-xl" />
              Logout
            </button>
          </div>
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
        {/* Logout Confirmation Modal */}
        <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl text-center relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        ariaHideApp={false}
      >
        <div className="flex flex-col items-center">
          <div className="bg-red-100 rounded-full p-3">
            <HiOutlineLogout className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">Confirm Logout</h2>
          <p className="text-gray-600 mt-2">Are you sure you want to logout?</p>
        </div>
        <div className="flex justify-center mt-6 space-x-4">
        <button
      onClick={closeModal}
      className="px-5 py-2 bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700 rounded-full shadow-md hover:from-gray-400 hover:to-gray-500 transition-colors flex items-center"
    >
      <HiOutlineChevronDown className="mr-2 text-lg" />
      Cancel
    </button>
    <button
      onClick={handleLogout}
      className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-md hover:from-red-600 hover:to-red-700 transition-colors flex items-center"
    >
      <HiOutlineLogout className="mr-2 text-lg" />
      Yes, Logout
    </button>
    
  </div>
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
