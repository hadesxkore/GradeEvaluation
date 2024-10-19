import React, { useState, useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { HiOutlineDocumentText, HiOutlineUser, HiOutlineBriefcase, HiOutlineCog, 
  HiOutlineFolder, HiChevronDown, HiOutlineLogout, HiOutlineDocumentAdd, HiOutlineFolderAdd, HiOutlineUserGroup, HiOutlineChevronDown, HiOutlineX } from 'react-icons/hi';
  
import Modal from 'react-modal';

import EncodeGrades from './EncodeGrades';
import UploadStudentMasterlist from './UploadStudentMasterlist';
import CreateSubjects from './CreateSubject';
import CreateSection from './CreateSection';
import ViewEvaluationCert from './ViewEvaluationCert';
import EditStudentProfile from './EditStudentProfile';

const FacultyDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEvaluator, setIsEvaluator] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userDoc = doc(db, 'evaluators', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists() && userSnapshot.data().role === 'evaluator') {
          setIsEvaluator(true);
        } else {
          navigate('/unauthorized');
        }
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate, db]);

  if (!isAuthenticated || !isEvaluator) {
    return null;
  }

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

 
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
          {/* Sidebar */}
          <aside className="md:w-72 bg-white border-r border-gray-200 shadow-lg md:h-screen md:flex md:flex-col">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-center text-teal-600">Faculty Dashboard</h2>
        </div>
        <nav className="mt-5 flex-grow">
          <ul className="space-y-2">
            <li>
              <Link
                to="/faculty-dashboard/encode-grades"
                className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
              >
                <HiOutlineDocumentText className="mr-2 text-xl" />
                Encode Grades
              </Link>
            </li>
            <li>
              <Link
                to="/faculty-dashboard/upload-student-masterlist"
                className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
              >
                <HiOutlineUser className="mr-2 text-xl" />
                Upload Student Masterlist
              </Link>
            </li>
            <li>
              <button
                onClick={toggleDropdown}
                className="flex items-center w-full px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
              >
                <HiOutlineBriefcase className="mr-2 text-xl" />
                Manage Courses
                <HiChevronDown className={`ml-auto transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              {isDropdownOpen && (
                <ul className="mt-2 space-y-2 ml-6">
                  <li>
                    <Link
                      to="/faculty-dashboard/create-subjects"
                      className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
                    >
                      <HiOutlineDocumentAdd className="mr-2 text-xl" />
                      Create Subjects
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faculty-dashboard/create-section"
                      className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
                    >
                      <HiOutlineFolderAdd className="mr-2 text-xl" />
                      Students and Sections
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link
                to="/faculty-dashboard/view-evaluation-cert"
                className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
              >
                <HiOutlineFolder className="mr-2 text-xl" />
                View Evaluation Cert
              </Link>
            </li>
        
        <li>
          
        </li>
            <li>
              <Link
                to="/faculty-dashboard/edit-student-profile"
                className="flex items-center px-4 py-3 text-gray-700 bg-white rounded-lg shadow hover:bg-teal-500 hover:text-white transition-colors duration-200"
              >
                <HiOutlineCog className="mr-2 text-xl" />
                Edit Student Profile
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-5">
          <button
            onClick={openModal}
            className="w-full flex items-center justify-center px-4 py-3 text-white bg-teal-500 rounded-lg shadow hover:bg-teal-600 transition-colors duration-200"
          >
            <HiOutlineLogout className="mr-2 text-xl" />
            Logout
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 p-5">
        <Routes>
          <Route path="encode-grades" element={<EncodeGrades />} />
          <Route path="upload-student-masterlist" element={<UploadStudentMasterlist />} />
          <Route path="create-subjects" element={<CreateSubjects />} />
          <Route path="create-section" element={<CreateSection />} />
          <Route path="view-evaluation-cert" element={<ViewEvaluationCert />} />
          <Route path="edit-student-profile" element={<EditStudentProfile />} />
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

export default FacultyDashboard;
