import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { HiOutlineSave, HiOutlineXCircle, HiOutlineEye, HiPlus, HiOutlineX, HiCheckCircle  } from 'react-icons/hi';
import { db } from '../firebase'; // Import the initialized Firestore
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { query, where } from 'firebase/firestore'; // Import query and where
import { doc, setDoc, getDoc, updateDoc   } from 'firebase/firestore'; // Import necessary functions
import AdminDashboard from './AdminDashboard';

const CreateSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectDescription, setSubjectDescription] = useState('');
  const [units, setUnits] = useState('');
  const [schedule, setSchedule] = useState('');
  const [room, setRoom] = useState('');
  const [instructor, setInstructor] = useState('');
  const [section, setSection] = useState('');
  const [sections, setSections] = useState([]);
  const [showSections, setShowSections] = useState(false);
  const [showStudents, setShowStudents] = useState(false); // State to toggle visibility
// State variables for managing modal visibility
const [showAddStudentModal, setShowAddStudentModal] = useState(false);
const [sectionId, setSectionId] = useState(null);
const [selectedSectionId, setSelectedSectionId] = useState(null);
const [showStudentsModal, setShowStudentsModal] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null); // New variable for the selected student
const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false); // New variable for the modal
const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false); // Renamed variable
const [sectionName, setSectionName] = useState(''); // New state for section name
// Assuming 'students' is fetched and set in state as in your provided code
const [editingStudentId, setEditingStudentId] = useState(null); // Track which student is being edited
const [editedStudentData, setEditedStudentData] = useState({}); // Store edited data
const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [students, setStudents] = useState([]); // State to hold student data
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false); // State for student modal
  const [isSectionsModalOpen, setIsSectionsModalOpen] = useState(false); // State for sections modal
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form fields
    setClassName('');
    setSubjectCode('');
    setSubjectDescription('');
    setUnits('');
    setSchedule('');
    setRoom('');
    setInstructor('');
    setSection('');
  };

  const openStudentModal = () => setIsStudentModalOpen(true); // Open student modal
  const closeStudentModal = () => setIsStudentModalOpen(false); // Close student modal
  const openSectionsModal = () => {
    fetchSections(); // Fetch sections when modal opens
    setIsSectionsModalOpen(true);
  };
  const closeSectionsModal = () => setIsSectionsModalOpen(false);
  const toggleSections = () => {
    setShowSections(prevState => !prevState);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!className || !subjectCode || !subjectDescription || !units || !schedule || !room || !instructor || !section) {
      setError('All fields are required');
      return;
    }

    // Clear error
    setError('');

    try {
      // Add new section to Firestore
      await addDoc(collection(db, 'sections'), { // Use db instead of firestore
        className,
        subjectCode,
        subjectDescription,
        units,
        schedule,
        room,
        instructor,
        section,
      });

      console.log('Section created:', { className, subjectCode, subjectDescription, units, schedule, room, instructor, section });

      // Close the modal after creating the section
      closeModal();
    } catch (error) {
      console.error("Error adding document: ", error);
      setError('Error creating section. Please try again.');
    }
  };
  const viewStudents = async () => {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'Student') // Only fetch users with role 'student'
      );

      const querySnapshot = await getDocs(studentsQuery);
      const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList); // Set fetched students to state
      setShowStudents(true); // Open the student modal
      setShowSections(false);
    } catch (error) {
      console.error("Error fetching students: ", error);
      setError('Error fetching student data.');
    }
  };

  const closeStudentsModal = () => {
    setShowStudents(false); // Close the modal
  };


// Function to fetch sections from the Firestore collection
const fetchSections = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'sections')); // Use db to access Firestore
      const sectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSections(sectionsData);
      setShowSections(true); // Show the sections when fetched
      setShowStudents(false);
    } catch (error) {
      console.error('Error fetching sections: ', error);
    }
  };

  // Function to show the Add Student modal
const handleAddStudent = (id) => {
    setSectionId(id); // Set the current section ID
    setShowAddStudentModal(true); // Show the modal
    fetchStudents(); // Fetch students to show in the modal
  };
 // Function to fetch students from the users collection
const fetchStudents = async () => {
    try {
      // Create a query to fetch users with the role 'Student'
      const studentsQuery = query(
        collection(db, 'users'), // Accessing the 'users' collection
        where('role', '==', 'Student') // Filtering for users with the role 'Student'
      );
  
      // Get the documents that match the query
      const querySnapshot = await getDocs(studentsQuery);
  
      // Map the results to an array of student objects
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(), // Spread operator to include all user data
      }));
  
      setStudents(studentsList); // Set the fetched students in state
    } catch (error) {
      console.error('Error fetching students: ', error);
      alert('Failed to load students.'); // Error feedback
    }
  };
// Function to enroll a student in a section
const handleEnrollStudent = async (sectionId, studentId) => {
    try {
      const student = students.find(student => student.id === studentId); // Assuming students is the list of all fetched students
  
      if (!student) {
        alert('Student not found!');
        return;
      }
  
      // Reference to the specific student enrolled document
      const studentDocRef = doc(collection(db, 'sections', sectionId, 'studentEnrolled'), studentId);
      
      // Check if the student is already enrolled
      const studentDoc = await getDoc(studentDocRef);
  
      if (studentDoc.exists()) {
        alert('Student is already enrolled in this section!'); // Notify the faculty
        return; // Exit the function if already enrolled
      }
  
      // Add student information to the enrolled collection
      await setDoc(studentDocRef, {
        enrolled: true, // Enroll status
        firstName: student.firstName, // Include student name
        lastName: student.lastName, // Include student name
        middleName: student.middleName,
        contactNumber: student.contactNumber,
        program: student.program,
        studentId: student.studentId,
        email: student.email, // Include student email
        createdAt: new Date() // Timestamp of enrollment
      });
  
      alert('Student enrolled successfully!'); // Feedback to the user
      setShowAddStudentModal(false); // Close the modal after enrollment
    } catch (error) {
      console.error('Error enrolling student: ', error);
      alert('Failed to enroll student.'); // Error feedback
    }
  };
// Function to handle viewing students
const handleViewStudents = async (sectionId) => {
    setSelectedSectionId(sectionId);
  
    // Fetch section data to get the className
    const sectionDocRef = doc(db, 'sections', sectionId);
    const sectionDoc = await getDoc(sectionDocRef);
    
    if (sectionDoc.exists()) {
      const sectionData = sectionDoc.data();
      setSectionName(sectionData.className); // Set the section name for the modal title
    } else {
      console.error("No such section document!");
      return;
    }
  
    // Fetch enrolled students
    const enrolledStudents = await fetchStudentsForSection(sectionId);
    setStudents(enrolledStudents);
    setIsStudentsModalOpen(true); // Update modal state
};

// Function to fetch students from db based on section ID
const fetchStudentsForSection = async (sectionId) => {
    try {
      const enrolledStudentsRef = collection(doc(db, 'sections', sectionId), 'studentEnrolled');
      const snapshot = await getDocs(enrolledStudentsRef);
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return studentsData;
    } catch (error) {
      console.error("Error fetching students: ", error);
      return [];
    }
};


// Function to handle viewing a specific student's details
const handleViewStudentDetails = (student) => {
  setSelectedStudent(student);
  setIsStudentDetailsModalOpen(true);
};


const handleUpdateStudentDetails = async () => {
  if (!selectedStudent || !selectedStudent.id) {
    console.error('Selected student or student ID is not defined.');
    return;
  }

  try {
    // Update in the 'users' collection
    const userDocRef = doc(db, 'users', selectedStudent.id);
    await updateDoc(userDocRef, {
      firstName: selectedStudent.firstName,
      middleName: selectedStudent.middleName,
      lastName: selectedStudent.lastName,
      email: selectedStudent.email,
      contactNumber: selectedStudent.contactNumber,
      program: selectedStudent.program,
      address: selectedStudent.address,
    });

    console.log('Updated in users collection for ID:', selectedStudent.id);

    // Update in the 'sections/{sectionId}/studentEnrolled' subcollection
    if (selectedSectionId) {
      const enrolledStudentDocRef = doc(
        db,
        'sections',
        selectedSectionId,
        'studentEnrolled',
        selectedStudent.id
      );

      await updateDoc(enrolledStudentDocRef, {
        firstName: selectedStudent.firstName,
        middleName: selectedStudent.middleName,
        lastName: selectedStudent.lastName,
        email: selectedStudent.email,
        contactNumber: selectedStudent.contactNumber,
        program: selectedStudent.program,
        address: selectedStudent.address,
      });

      console.log('Updated in enrolledStudents subcollection for section ID:', selectedSectionId);
    } else {
      console.error('Selected section ID is not defined for updating studentEnrolled.');
    }

    // Show success modal
    setIsSuccessModalOpen(true);

    // Close the modal after 3 seconds and refresh the student list
    setTimeout(() => {
      setIsSuccessModalOpen(false);
      viewStudents(); // Refresh the student list
    }, 2000);
  } catch (error) {
    console.error('Error updating student:', error);
  }
};





  return (
    <div className="p-5">
      {/* Main Card for Section Management */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-4">
        <h2 className="text-2xl font-semibold mb-3">Section Management</h2>
        <p className="mb-4 text-gray-700">
          Manage sections efficiently. Create new sections and view existing students.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* View Students */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold flex items-center">
              <HiOutlineEye className="mr-2 text-blue-500" /> View Students
            </h3>
            <p className="mt-2 text-gray-600">View all students enrolled in the sections.</p>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onClick={viewStudents}
            >
              Show Students
            </button>
          </div>

          {/* Create Section */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold flex items-center">
              <HiPlus className="mr-2 text-green-500" /> Create Section
            </h3>
            <p className="mt-2 text-gray-600">Add a new section to the system.</p>
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              onClick={openModal}
            >
              Add Section
            </button>
          </div>
           {/* View Sections */}
           <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold flex items-center">
              <HiOutlineEye className="mr-2 text-purple-500" /> View Sections
            </h3>
            <p className="mt-2 text-gray-600">View all existing sections.</p>
            <button
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              onClick={openSectionsModal}
            >
              Show Sections
            </button>
          </div>
   
        </div>
      </div>

    

      
{/* Modal for Create Section */}
<Modal
  isOpen={isModalOpen}
  onRequestClose={closeModal}
  contentLabel="Create Section Modal"
  className="modal-content bg-white p-10 rounded-lg shadow-lg max-w-5xl w-full mx-auto"
  overlayClassName="modal-overlay fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center"
>
  <h2 className="text-3xl font-bold text-teal-600 mb-6 text-center">Create Section</h2>

  {/* Display Error Message */}
  {error && (
    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg mb-4 flex items-center">
      <HiOutlineXCircle className="mr-2 text-lg" />
      {error}
    </div>
  )}

  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Class Name */}
    <div className="flex flex-col">
      <label htmlFor="className" className="text-gray-700 font-semibold mb-1">Class Name</label>
      <input
        type="text"
        id="className"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        placeholder="Enter class name"
      />
    </div>

    {/* Subject Code */}
    <div className="flex flex-col">
      <label htmlFor="subjectCode" className="text-gray-700 font-semibold mb-1">Subject Code</label>
      <input
        type="text"
        id="subjectCode"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={subjectCode}
        onChange={(e) => setSubjectCode(e.target.value)}
        placeholder="Enter subject code"
      />
    </div>

    {/* Units */}
    <div className="flex flex-col">
      <label htmlFor="units" className="text-gray-700 font-semibold mb-1">Units</label>
      <input
        type="number"
        id="units"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={units}
        onChange={(e) => setUnits(e.target.value)}
        placeholder="Enter number of units"
      />
    </div>

    {/* Schedule */}
    <div className="flex flex-col">
      <label htmlFor="schedule" className="text-gray-700 font-semibold mb-1">Schedule</label>
      <input
        type="text"
        id="schedule"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={schedule}
        onChange={(e) => setSchedule(e.target.value)}
        placeholder="Enter schedule"
      />
    </div>

    {/* Room */}
    <div className="flex flex-col">
      <label htmlFor="room" className="text-gray-700 font-semibold mb-1">Room</label>
      <input
        type="text"
        id="room"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        placeholder="Enter room number"
      />
    </div>

    {/* Instructor */}
    <div className="flex flex-col">
      <label htmlFor="instructor" className="text-gray-700 font-semibold mb-1">Instructor</label>
      <input
        type="text"
        id="instructor"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={instructor}
        onChange={(e) => setInstructor(e.target.value)}
        placeholder="Enter instructor name"
      />
    </div>

    {/* Section */}
    <div className="flex flex-col">
      <label htmlFor="section" className="text-gray-700 font-semibold mb-1">Section</label>
      <input
        type="text"
        id="section"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={section}
        onChange={(e) => setSection(e.target.value)}
        placeholder="Enter section name"
      />
    </div>
   {/* Subject Description (Moved to Last) */}
   <div className="flex flex-col md:col-span-2">
      <label htmlFor="subjectDescription" className="text-gray-700 font-semibold mb-1">Subject Description</label>
      <textarea
        id="subjectDescription"
        rows="3"
        className="px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        value={subjectDescription}
        onChange={(e) => setSubjectDescription(e.target.value)}
        placeholder="Enter subject description"
      />
    </div>
    {/* Button Group */}
    <div className="flex justify-end col-span-1 md:col-span-2 mt-6 space-x-4">
    <button
        type="button"
        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        onClick={closeModal}
      >
        <HiOutlineX className="mr-2" /> Cancel
      </button>
      <button
        type="submit"
        className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center"
      >
        <HiOutlineSave className="mr-2" /> Save Section
      </button>
      
    </div>
  </form>
</Modal>

{showSections && (
  <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-semibold mb-4 mt-4 ml-4">Section Information</h2>
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-teal-600 text-white">
          <tr>
            <th className="py-3 px-4">Class Name</th>
            <th className="py-3 px-4">Section</th>
            <th className="py-3 px-4">Subject Code</th>
            <th className="py-3 px-4">Subject Description</th>
            <th className="py-3 px-4">Instructor</th>
            <th className="py-3 px-4">Schedule</th>
            <th className="py-3 px-4">Room</th>
            <th className="py-3 px-4">Units</th>
            <th className="py-3 px-4">Actions</th> {/* New Actions Column */}
          </tr>
        </thead>
        <tbody className="bg-white">
          {sections && sections.length > 0 ? (
            sections.map((section) => (
              <tr key={section.id} className="border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                <td className="py-2 px-4 text-center">{section.className}</td>
                <td className="py-2 px-4 text-center">{section.section || 'N/A'}</td>
                <td className="py-2 px-4 text-center">{section.subjectCode}</td>
                <td className="py-2 px-4 text-center">{section.subjectDescription || 'N/A'}</td>
                <td className="py-2 px-4 text-center">{section.instructor}</td>
                <td className="py-2 px-4 text-center">{section.schedule}</td>
                <td className="py-2 px-4 text-center">{section.room}</td>
                <td className="py-2 px-4 text-center">{section.units}</td>
                <td className="py-2 px-4 text-center">
                <button 
  className="bg-teal-600 text-white font-semibold py-2 px-4 rounded hover:bg-teal-700 transition duration-200"
  onClick={() => handleAddStudent(section.id)} // Call the function to show modal
>
  Add Student
</button>
<button 
    className="bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition duration-200 ml-2"
    onClick={() => handleViewStudents(section.id)} // Call the function to show the students modal
  >
    View Students
  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="py-2 px-4 text-center text-gray-500">No sections found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>


{/* Modal for Students */}
{isStudentsModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-11/12 md:w-3/4 lg:w-2/3">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h2 className="text-2xl font-semibold text-center flex-grow">{sectionName}</h2> {/* Update title to use sectionName */}
        <button
          className="text-gray-600 hover:text-red-500 focus:outline-none"
          onClick={() => setIsStudentsModalOpen(false)} // Close modal function
        >
          &times;
        </button>
      </div>
      <div className="overflow-x-auto p-4"> {/* Added padding around the table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="py-3 px-6">First Name</th>
              <th className="py-3 px-6">Middle Name</th>
              <th className="py-3 px-6">Last Name</th>
              <th className="py-3 px-6">Email</th>
              <th className="py-3 px-6">Contact Number</th>
              <th className="py-3 px-6">Program</th>
              <th className="py-3 px-6">Student ID</th>
            
            </tr>
          </thead>
          <tbody className="bg-white">
            {students.map((student) => (
              <tr key={student.id} className="border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                <td className="py-2 px-4 text-center">{student.firstName}</td>
                <td className="py-2 px-4 text-center">{student.middleName || 'N/A'}</td>
                <td className="py-2 px-4 text-center">{student.lastName}</td>
                <td className="py-2 px-4 text-center">{student.email}</td>
                <td className="py-2 px-4 text-center">{student.contactNumber}</td>
                <td className="py-2 px-4 text-center">{student.program}</td>
                <td className="py-2 px-4 text-center">{student.studentId}</td>
 
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}



 {/* Add Student Modal */}
{showAddStudentModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"> {/* Dimmed background */}
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-11/12 md:w-3/4 lg:w-2/3"> {/* Make the modal wider */}
      <div className="flex justify-between items-center px-4 py-2 border-b"> {/* Header section for title and close button */}
        <h2 className="text-2xl font-semibold text-center flex-grow">Enroll Students</h2>
        <button 
          className="text-gray-600 hover:text-red-500 focus:outline-none" 
          onClick={() => setShowAddStudentModal(false)} // Function to close modal
        >
          &times; {/* X mark */}
        </button>
      </div>
      <div className="overflow-x-auto p-4"> {/* Added padding around the table */}
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="py-3 px-6">First Name</th> {/* Increased padding */}
              <th className="py-3 px-6">Last Name</th>  {/* Increased padding */}
              <th className="py-3 px-6">Email</th>      {/* Increased padding */}
              <th className="py-3 px-6">Actions</th>    {/* Increased padding */}
            </tr>
          </thead>
          <tbody className="bg-white">
            {students.map((student) => (
              <tr key={student.id} className="border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                <td className="py-3 px-4 text-center">{student.firstName}</td> {/* Increased padding */}
                <td className="py-3 px-4 text-center">{student.lastName}</td>  {/* Increased padding */}
                <td className="py-3 px-4 text-center">{student.email}</td>      {/* Increased padding */}
                <td className="py-3 px-4 text-center">
                  <button 
                    className="bg-teal-600 text-white font-semibold py-2 px-4 rounded hover:bg-teal-700 transition duration-200"
                    onClick={() => handleEnrollStudent(sectionId, student.id)} // Call the function to enroll student
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}


  </div>
)}



  {/* Student List Modal */}
{showStudents && (
  <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
    <h2 className="text-2xl font-semibold mb-4 mt-4 ml-4">Students Information</h2>
    <div className="overflow-x-auto">
      <div className="max-h-100 overflow-y-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-teal-600 text-white">
            <tr>
              <th className="py-3 px-4">First Name</th>
              <th className="py-3 px-4">Middle Name</th>
              <th className="py-3 px-4">Last Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Contact Number</th>
              <th className="py-3 px-4">Program</th>
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4">Address</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {students.length > 0 ? (
              students.map((student) => (
                <tr key={student.studentId} className="border-b hover:bg-gray-50 transition duration-150 ease-in-out">
                  <td className="py-2 px-4 text-center">{student.firstName}</td>
                  <td className="py-2 px-4 text-center">{student.middleName || 'N/A'}</td>
                  <td className="py-2 px-4 text-center">{student.lastName}</td>
                  <td className="py-2 px-4 text-center">{student.email}</td>
                  <td className="py-2 px-4 text-center">{student.contactNumber}</td>
                  <td className="py-2 px-4 text-center">{student.program}</td>
                  <td className="py-2 px-4 text-center">{student.studentId}</td>
                  <td className="py-2 px-4 text-center">{student.address}</td>
                  <td className="py-2 px-4 text-center">
                  <td className="py-2 px-4 text-center">
  <button
    className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
    onClick={() => handleViewStudentDetails(student)}
  >
    Edit
  </button>
</td>

                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-2 px-4 text-center text-gray-500">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{/* Modal for editing student info */}
{isStudentDetailsModalOpen && selectedStudent && (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Edit Student Information</h3>
      <form>
        <input
          type="text"
          value={selectedStudent.firstName}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, firstName: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={selectedStudent.middleName}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, middleName: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={selectedStudent.lastName}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, lastName: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="email"
          value={selectedStudent.email}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, email: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={selectedStudent.contactNumber}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, contactNumber: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={selectedStudent.program}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, program: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          type="text"
          value={selectedStudent.address}
          onChange={(e) => setSelectedStudent({ ...selectedStudent, address: e.target.value })}
          className="w-full mb-2 p-2 border rounded"
        />
        <button type="button" onClick={handleUpdateStudentDetails} className="bg-blue-500 text-white px-4 py-2 rounded">
          Update
        </button>
        <button type="button" onClick={() => setIsStudentDetailsModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded ml-2">
          Cancel
        </button>
      </form>
    </div>
  </div>
)}
<Modal
  isOpen={isSuccessModalOpen}
  onRequestClose={() => setIsSuccessModalOpen(false)}
  className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto my-20 text-center"
  overlayClassName="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center"
>
  <HiCheckCircle className="text-green-500 text-6xl mx-auto" />
  <h2 className="text-xl font-semibold mt-4">Update Successful</h2>
  <p className="mt-2 text-gray-600">The student information has been updated successfully.</p>
  <button
    className="bg-teal-600 text-white py-2 px-4 rounded-md mt-4 hover:bg-teal-700 transition"
    onClick={() => setIsSuccessModalOpen(false)}
  >
    Close
  </button>
</Modal>


{/* Button to Close the Modal */}
<button onClick={closeStudentModal} className="absolute top-3 right-3 text-gray-600 hover:text-gray-800">
  <HiOutlineX />
</button>

    </div>
    
  );
};

export default CreateSection;
