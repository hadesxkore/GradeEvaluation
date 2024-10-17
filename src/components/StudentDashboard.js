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
  HiOutlineX
} from 'react-icons/hi';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import CustomizeAccount from './CustomizeAccount';

import CourseTaken from './CourseTaken';
import CoursesEnrolled from './CoursesEnrolled';
import Residency from './Residency';
import CurriculumList from './CurriculumList';



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
<div className="flex flex-col md:flex-row min-h-screen bg-white/90 backdrop-blur-md shadow-lg border border-white/50">
<aside className="md:w-72 bg-white border-r shadow-md md:h-screen md:flex md:flex-col">
<div className="p-5">
    <h2 className="text-2xl font-bold text-center text-blue-600">Student Dashboard</h2>
    <div className="flex justify-center mt-4">
    <img
              src={profilePictureUrl} // Now this is defined
              alt="Profile"
              className="w-24 h-24 rounded-full "
            />
    </div>
    <p className="text-center text-gray-500 mt-2">Welcome, {firstName}!</p>
</div>

        <nav className="mt-5 flex-grow">
          <ul className="space-y-2">
           
            <li>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
              >
                <span className="flex items-center">
                  <HiOutlineUser className="mr-2 text-xl" />
                  Student Profile
                </span>
                <HiOutlineChevronDown className={`transform transition-transform ${isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {isProfileDropdownOpen && (
                <ul className="pl-6 mt-2 space-y-1">
                  <li>
                    <Link
                      to="/student-dashboard/course-taken"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
                    >
                      <HiOutlineBookOpen className="mr-2 text-xl" />
                      Course Taken
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-dashboard/courses-enrolled"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
                    >
                      <HiOutlineCollection className="mr-2 text-xl" />
                      Courses Enrolled
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/student-dashboard/residency"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
                    >
                      <HiOutlineAcademicCap className="mr-2 text-xl" />
                      Residency
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={toggleGradesDropdown}
                className="flex items-center justify-between w-full px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
              >
                <span className="flex items-center">
                  <HiOutlineClipboardList className="mr-2 text-xl" />
                  View Grades
                </span>
                <HiOutlineChevronDown className={`transform transition-transform ${isGradesDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {isGradesDropdownOpen && (
                <ul className="pl-6 mt-2 space-y-1">
                  <li>
                    <Link
                      to="/student-dashboard/curriculum-list"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
                    >
                      <HiOutlineBookOpen className="mr-2 text-xl" />
                      Curriculum List
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link
                to="/student-dashboard/customize-account"
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-blue-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineCog className="mr-2 text-xl" />
                Customize Account
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-5">
          <button
            onClick={openModal}
            className="w-full flex items-center justify-center px-4 py-2 text-gray-700 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
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
          <Route path="course-taken" element={<CourseTaken />} />
          <Route path="courses-enrolled" element={<CoursesEnrolled />} />
          <Route path="residency" element={<Residency />} />
          <Route path="curriculum-list" element={<CurriculumList />} />
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
