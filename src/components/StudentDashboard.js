import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Link, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlineChevronDown,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineAcademicCap,
  HiOutlineLogout,
  HiOutlineX
} from 'react-icons/hi';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import CustomizeAccount from './CustomizeAccount';


import DownloadCourses from './DownloadCourses';
import ManageCourses from './ManageCourses';
import AnalyzeResidency from './AnalyzeResidency';
import UploadGrades from './UploadGrades';




const StudentDashboard = () => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isGradesDropdownOpen, setIsGradesDropdownOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('Student');
  const [profilePictureUrl, setProfilePictureUrl] = useState(''); // New state for profile picture
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData.role === 'Student') {
            setIsStudent(true);
            setFirstName(userData.firstName || 'Student');
            setProfilePictureUrl(userData.profilePicture || ''); // Set profile picture URL
          } else {
            setIsStudent(false);
            navigate('/unauthorized');
          }
        } else {
          setIsStudent(false);
          navigate('/unauthorized');
        }
      } else {
        setIsAuthenticated(false);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, db, navigate]);

  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const toggleGradesDropdown = () => setIsGradesDropdownOpen(!isGradesDropdownOpen);

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

  if (!isAuthenticated || !isStudent) {
    return null;
  }

  return (
<div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-white to-gray-50">
<aside className="md:w-72 bg-white rounded-lg shadow-lg border border-gray-200 md:h-screen md:flex md:flex-col">
  <div className="p-5 border-b border-gray-200">
    <h2 className="text-2xl font-bold text-center text-blue-600">Student Dashboard</h2>
    <div className="flex justify-center mt-4">
      <img
        src={profilePictureUrl}
        alt="Profile"
        className="w-28 h-28 rounded-full"
      />
    </div>
    <p className="text-center text-gray-600 mt-2">Welcome, {firstName}!</p>
  </div>

  <nav className="mt-5 flex-grow">
    <ul className="space-y-2">
      <li>
        <Link
          to="/student-dashboard/customize-account"
          className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <HiOutlineCog className="mr-2 text-xl" />
          Student Information
        </Link>
      </li>

      {/* Curriculum List with Dropdown */}
      <li>
        <button
          onClick={toggleProfileDropdown}
          className="flex items-center justify-between w-full px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <span className="flex items-center">
            <HiOutlineClipboardList className="mr-2 text-xl" />
            Curriculum List
          </span>
          <HiOutlineChevronDown className={`transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>
        {isProfileDropdownOpen && (
          <ul className="pl-6 mt-2 space-y-1">
            <li>
              <Link
                to="/student-dashboard/manage-courses"
                className="flex items-center px-4 py-2 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
              >
                <HiOutlineBookOpen className="mr-2 text-xl" />
                Manage Courses to Enroll
              </Link>
            </li>
            <li>
              <Link
                to="/student-dashboard/download-courses"
                className="flex items-center px-4 py-2 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
              >
                <HiOutlineCollection className="mr-2 text-xl" />
                Download Courses to Enroll
              </Link>
            </li>
          </ul>
        )}
      </li>

      {/* Analyze Residency */}
      <li>
        <Link
          to="/student-dashboard/analyze-residency"
          className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <HiOutlineAcademicCap className="mr-2 text-xl" />
          Analyze Residency
        </Link>
      </li>

      {/* Upload Student Grades with Dropdown */}
      <li>
        <button
          onClick={toggleGradesDropdown}
          className="flex items-center justify-between w-full px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <span className="flex items-center">
            <HiOutlineClipboardList className="mr-2 text-xl" />
            Upload Student Grades
          </span>
          <HiOutlineChevronDown className={`transform transition-transform duration-200 ${isGradesDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>
        {isGradesDropdownOpen && (
          <ul className="pl-6 mt-2 space-y-1">
            <li>
              <Link
                to="/student-dashboard/upload-grades"
                className="flex items-center px-4 py-2 text-gray-700 bg-white rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
              >
                <HiOutlineClipboardList className="mr-2 text-xl" />
                Upload Grade
              </Link>
            </li>
          </ul>
        )}
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
          <Route path="customize-account" element={<CustomizeAccount />} />
          <Route path="manage-courses" element={<ManageCourses />} />
          <Route path="download-courses" element={<DownloadCourses />} />
          <Route path="analyze-residency" element={<AnalyzeResidency />} />
          <Route path="upload-grades" element={<UploadGrades />} />
          <Route path="/" element={<div>Welcome to the Student Dashboard! Select an option from the sidebar.</div>} />
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

export default StudentDashboard;
