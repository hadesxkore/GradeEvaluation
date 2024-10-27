import React, { useState, useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { HiOutlineDocumentText, HiOutlineUser, HiOutlineBriefcase, HiOutlineCog, 
  HiOutlineFolder, HiChevronDown, HiOutlineLogout, HiOutlineDocumentAdd, HiOutlineFolderAdd, HiOutlineX } from 'react-icons/hi';
  
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
  const [isEvaluationDropdownOpen, setIsEvaluationDropdownOpen] = useState(false);
  const [isManageCoursesDropdownOpen, setIsManageCoursesDropdownOpen] = useState(false);
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

  const toggleEvaluationDropdown = () => {
    setIsEvaluationDropdownOpen(!isEvaluationDropdownOpen);
    setIsManageCoursesDropdownOpen(false); // Close the other dropdown
  };

  const toggleManageCoursesDropdown = () => {
    setIsManageCoursesDropdownOpen(!isManageCoursesDropdownOpen);
    setIsEvaluationDropdownOpen(false); // Close the other dropdown
  };

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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
    {/* Sidebar */}
    <aside className="md:w-80 bg-white shadow-lg md:h-screen md:flex md:flex-col">
      <div className="p-6 bg-teal-600 text-white">
        <h2 className="text-3xl font-bold text-center">Faculty Dashboard</h2>
      </div>
      <nav className="mt-5 flex-grow">
        <ul className="space-y-2">
          <li>
            <button
              onClick={toggleEvaluationDropdown}
              className="flex items-center w-full px-5 py-4 text-lg text-gray-800 bg-white rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
            >
              <HiOutlineDocumentText className="mr-3 text-2xl" />
              Evaluation
              <HiChevronDown className={`ml-auto transform ${isEvaluationDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isEvaluationDropdownOpen && (
              <ul className="mt-2 space-y-2 ml-6">
                <li>
                  <Link
                    to="/faculty-dashboard/encode-grades"
                    className="flex items-center px-4 py-3 text-lg text-gray-800 bg-gray-50 rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
                  >
                    <HiOutlineDocumentText className="mr-3 text-xl" />
                    Encode Grades
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              to="/faculty-dashboard/upload-student-masterlist"
              className="flex items-center px-5 py-4 text-lg text-gray-800 bg-white rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
            >
              <HiOutlineUser className="mr-3 text-2xl" />
              Upload Student Masterlist
            </Link>
          </li>
          <li>
            <button
              onClick={toggleManageCoursesDropdown}
              className="flex items-center w-full px-5 py-4 text-lg text-gray-800 bg-white rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
            >
              <HiOutlineBriefcase className="mr-3 text-2xl" />
              Manage Courses
              <HiChevronDown className={`ml-auto transform ${isManageCoursesDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            {isManageCoursesDropdownOpen && (
              <ul className="mt-2 space-y-2 ml-6">
                <li>
                  <Link
                    to="/faculty-dashboard/create-subjects"
                    className="flex items-center px-4 py-3 text-lg text-gray-800 bg-gray-50 rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
                  >
                    <HiOutlineDocumentAdd className="mr-3 text-xl" />
                    Create Subjects
                  </Link>
                </li>
                <li>
                  <Link
                    to="/faculty-dashboard/create-section"
                    className="flex items-center px-4 py-3 text-lg text-gray-800 bg-gray-50 rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
                  >
                    <HiOutlineFolderAdd className="mr-3 text-xl" />
                    Students and Sections
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              to="/faculty-dashboard/view-evaluation-cert"
              className="flex items-center px-5 py-4 text-lg text-gray-800 bg-white rounded-lg hover:bg-teal-500 hover:text-white transition-colors duration-200"
            >
              <HiOutlineFolder className="mr-3 text-2xl" />
              View Evaluation Cert
            </Link>
          </li>
          
        </ul>
      </nav>
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <button
          onClick={openModal}
          className="w-full flex items-center justify-center px-5 py-4 text-lg text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors duration-200"
        >
          <HiOutlineLogout className="mr-3 text-2xl" />
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
        <div className="absolute top-2 right-2">
          <button onClick={closeModal}>
            <HiOutlineX className="text-gray-600" />
          </button>
        </div>
        <h2 className="text-xl font-bold mb-4">Are you sure you want to log out?</h2>
        <div className="flex justify-center">
          <button
            onClick={handleLogout}
            className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors duration-200"
          >
            Yes
          </button>
          <button
            onClick={closeModal}
            className="ml-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            No
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyDashboard;
