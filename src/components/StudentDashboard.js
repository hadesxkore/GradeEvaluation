import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiOutlineChevronDown,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineAcademicCap,
  HiOutlineLogout,
  HiOutlineX,
  HiBell // Import the HiBell icon here
} from 'react-icons/hi';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
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
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [notifications, setNotifications] = useState([]); // State to hold notifications
  const [currentUserEmail, setCurrentUserEmail] = useState(''); // State to hold user email
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(user.email); // Set the current user's email
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData.role === 'Student') {
            setIsStudent(true);
            setFirstName(userData.firstName || 'Student');
            setProfilePictureUrl(userData.profilePicture || '');
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

  // Fetch notifications for the current user
  useEffect(() => {
    const currentUser = auth.currentUser; // Get the current user

    if (!currentUser) return; // Ensure currentUser is available

    const fetchNotifications = () => {
      const q = query(
        collection(db, 'notifications'),
        where('studentId', '==', currentUser.uid) // Use the current user's ID
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notificationsArray = [];
        querySnapshot.forEach((doc) => {
          notificationsArray.push({ id: doc.id, ...doc.data() });
        });
        setNotifications(notificationsArray);
      });

      return () => unsubscribe();
    };

    fetchNotifications();
  }, [auth]);

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
  <aside className="md:w-96 bg-white rounded-xl shadow-lg border border-gray-300 md:h-screen md:flex md:flex-col">
  <div className="p-6 border-b border-gray-200">
    <h2 className="text-4xl font-bold text-center text-blue-600">Student Dashboard</h2>
    <div className="flex justify-center mt-4">
      <img
        src={profilePictureUrl}
        alt="Profile"
        className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
      />
    </div>
    <p className="text-center text-gray-700 mt-3 text-lg font-semibold">Welcome, {firstName}!</p>
  </div>

  <nav className="mt-6 flex-grow">
    <ul className="space-y-3">
      <li>
        <Link
          to="/student-dashboard/customize-account"
          className="flex items-center px-6 py-4 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <HiOutlineCog className="mr-4 text-2xl text-blue-600" />
          <span className="text-gray-800 font-medium">Student Information</span>
        </Link>
      </li>

      {/* Curriculum List with Dropdown */}
      <li>
        <button
          onClick={toggleProfileDropdown}
          className="flex items-center justify-between w-full px-6 py-4 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <span className="flex items-center">
            <HiOutlineClipboardList className="mr-4 text-2xl text-blue-600" />
            <span className="text-gray-800 font-medium">Curriculum List</span>
            {notifications.length > 0 && (
          <div className="relative">
            <HiBell className="ml-2 text-red-600 text-xl" title="You have new notifications!" />
            <span className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-red-600 text-white text-xs px-1 ">
              {notifications.length}
            </span>
          </div>
        )}
          </span>
          <HiOutlineChevronDown className={`transform transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        {isProfileDropdownOpen && (
  <ul className="pl-6 mt-2 space-y-2">
    <li>
      <Link
        to="/student-dashboard/manage-courses"
        className="flex items-center px-6 py-3 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
      >
        <HiOutlineBookOpen className="mr-3 text-2xl text-blue-600" />
        <span className="text-gray-800 font-medium">Manage Courses to Enroll</span>
        {notifications.length > 0 && (
          <div className="relative">
            <HiBell className="ml-2 text-red-600 text-xl" title="You have new notifications!" />
            <span className="absolute top-0 right-0 -mt-2 -mr-2 rounded-full bg-red-600 text-white text-xs px-1 ">
              {notifications.length}
            </span>
          </div>
        )}
      </Link>
    </li>

    <li>
      <Link
        to="/student-dashboard/download-courses"
        className="flex items-center px-6 py-3 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
      >
        <HiOutlineCollection className="mr-3 text-2xl text-blue-600" />
        <span className="text-gray-800 font-medium">Download Courses to Enroll</span>
      </Link>
    </li>
  </ul>
)}

      </li>

      {/* Analyze Residency */}
      <li>
        <Link
          to="/student-dashboard/analyze-residency"
          className="flex items-center px-6 py-4 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <HiOutlineAcademicCap className="mr-4 text-2xl text-blue-600" />
          <span className="text-gray-800 font-medium">Analyze Residency</span>
        </Link>
      </li>

      {/* Upload Student Grades with Dropdown */}
      <li>
        <button
          onClick={toggleGradesDropdown}
          className="flex items-center justify-between w-full px-6 py-4 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
        >
          <span className="flex items-center">
            <HiOutlineClipboardList className="mr-4 text-2xl text-blue-600" />
            <span className="text-gray-800 font-medium">Upload Student Grades</span>
          </span>
          <HiOutlineChevronDown className={`transform transition-transform duration-200 ${isGradesDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>
        {isGradesDropdownOpen && (
          <ul className="pl-6 mt-2 space-y-2">
            <li>
              <Link
                to="/student-dashboard/upload-grades"
                className="flex items-center px-6 py-3 bg-gray-100 rounded-lg shadow hover:bg-blue-100 transition-all duration-200"
              >
                <HiOutlineClipboardList className="mr-3 text-2xl text-blue-600" />
                <span className="text-gray-800 font-medium">Upload Grade</span>
              </Link>
            </li>
          </ul>
        )}
      </li>
    </ul>
  </nav>

  <div className="p-6">
  <p className="text-gray-800 mb-2">
    Logged in as <span className="text-blue-600">{currentUserEmail}</span>
  </p>
  <button
    onClick={openModal}
    className="w-full flex items-center justify-center px-6 py-4 text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transition-colors duration-200"
  >
    <HiOutlineLogout className="mr-3 text-2xl" />
    <span className="font-medium">Logout</span>
  </button>
</div>

      </aside>


      <main className="flex-grow p-5">
        <Routes>
          <Route path="customize-account" element={<CustomizeAccount />} />
          <Route path="download-courses" element={<DownloadCourses />} />
          <Route path="manage-courses" element={<ManageCourses />} />
          <Route path="analyze-residency" element={<AnalyzeResidency />} />
          <Route path="upload-grades" element={<UploadGrades />} />
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
