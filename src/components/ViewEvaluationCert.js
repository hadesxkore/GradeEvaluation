import React, { useState, useEffect } from 'react';
import { HiOutlineEye, HiClipboardList, HiPrinter, HiEye  } from 'react-icons/hi';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';

const ViewEvaluationCert = ({ viewCourses, printEvaluationCert }) => {
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCoursesTable, setShowCoursesTable] = useState(false); // New state for courses table
    const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [yearLevel, setYearLevel] = useState(null);
    const [semester, setSemester] = useState(null);
    const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showStudentsTable, setShowStudentsTable] = useState(true); // Initialize as true to show the table initially
  const [showCourses, setShowCourses] = useState(true);
  const [isCourseFilesModalOpen, setIsCourseFilesModalOpen] = useState(false);
  const [loadingCourseFiles, setLoadingCourseFiles] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [grades, setGrades] = useState([]);
  // State for course selection modals

  // Fetch students from the 'users' collection with role 'student'
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const studentsRef = collection(db, 'users');
        const q = query(studentsRef, where('role', '==', 'Student'));
        const querySnapshot = await getDocs(q);
        const studentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentData);
        setFilteredStudents(studentData); // Initialize filtered students

      } catch (error) {
        console.error('Error fetching students:', error);
      }
      setLoadingStudents(false);
    };
    
    fetchStudents();
  }, []);


  // Handler for toggling courses visibility
  const handleShowGrades = () => {
    setShowCourses(!showCourses); // Toggle the visibility
  };

  const viewStudentGrades = async (student) => {
    setLoadingGrades(true);
    setSelectedStudent(student);
    try {
      const gradesRef = collection(db, 'grades', student.id, 'files');
      const gradesSnapshot = await getDocs(gradesRef);
      const gradesData = gradesSnapshot.docs.map(doc => doc.data());
      setGrades(gradesData);
      setIsGradesModalOpen(true);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
    setLoadingGrades(false);
  };
  
    // Search handler
    const handleSearch = (event) => {
        const value = event.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = students.filter(student =>
          student.firstName.toLowerCase().includes(value) ||
          student.lastName.toLowerCase().includes(value) ||
          student.studentId.toLowerCase().includes(value)
        );
        setFilteredStudents(filtered);
      };

  // Close the modal
  const closeModal = () => {
    setSelectedStudent(null);
    setIsGradesModalOpen(false);
    setGrades([]);
    setIsCoursesModalOpen(false);
    setIsSemesterModalOpen(false);
    setYearLevel(null);
    setSemester(null);
    setCourses([]);
  };


  const handleYearLevelSelect = (level) => {
    setYearLevel(level);
    setIsCoursesModalOpen(false);
    setIsSemesterModalOpen(true);
    setIsGradesModalOpen(false);
  };

  const handleSemesterSelect = async (sem) => {
    setSemester(sem);
    await fetchCourses(yearLevel, sem);
    setIsSemesterModalOpen(false);
    setIsGradesModalOpen(false);
    setShowCourses(true);
  setShowStudentsTable(false);
  };

  const fetchCourses = async (level, sem) => {
    try {
      const subjectsRef = collection(db, 'subjects', `${level}Year`, sem === '1st' ? 'firstSemester' : 'secondSemester');
      const querySnapshot = await getDocs(subjectsRef);
      const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
      
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const showStudentCourses = async (student) => {
    setLoadingCourseFiles(true);
    try {
        // Create a reference to the student's files sub-collection
        const filesRef = collection(db, 'coursesToEnroll', student.id, 'files'); // Use collection function

        // Fetch all documents in the files sub-collection
        const filesSnapshot = await getDocs(filesRef); // Use getDocs function

        // Check if there are any files
        if (!filesSnapshot.empty) {
            const fetchedFiles = filesSnapshot.docs.map(doc => ({
                name: doc.data().fileName, // Assuming 'fileName' is the field name
                url: doc.data().fileUrl // Assuming 'fileUrl' is the field name
            }));
            
            setCourseFiles(fetchedFiles);
            setIsCourseFilesModalOpen(true);
        } else {
            alert('No course files found for this student.');
            // Handle the case where no documents exist
        }
    } catch (error) {
        console.error('Error fetching course files:', error);
        // Handle the error (e.g., show a message to the user)
    }
    setLoadingCourseFiles(false);
};

const openNotificationModal = (student) => {
  setSelectedStudent(student);
  setNotificationModalOpen(true);
};

const closeNotificationModal = () => {
  setNotificationModalOpen(false);
  setNotificationMessage('');
  setSelectedStudent(null);
};

const sendNotification = async (studentId) => {
  if (notificationMessage.trim() === '') {
    alert('Please enter a message.');
    return;
  }

  try {
    // Add notification to Firestore
    await addDoc(collection(db, 'notifications'), {
      studentId: studentId,
      message: notificationMessage,
      timestamp: new Date(),
    });

    alert('Notification sent successfully!');
    closeNotificationModal(); // Close the modal after sending
  } catch (error) {
    console.error('Error sending notification: ', error);
    alert('Failed to send notification.');
  }
};
  return (
    <div className="p-5">
     {/* Main Card for Evaluation Certificate Management */}
<div className="bg-white rounded-lg shadow-lg p-5 mb-4">
  <h2 className="text-2xl font-semibold mb-3">Evaluation Certificate Management</h2>
  <p className="mb-4 text-gray-700">
    Manage evaluation certificates and view detailed information. Access students' grades, courses, and print evaluation certificates.
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {/* View Students Grades */}
    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiOutlineEye className="mr-2 text-green-500" /> View Students Grades
      </h3>
      <p className="mt-2 text-gray-600">View grades of enrolled students.</p>
      <button
        className="mt-4 bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-700 transition-transform transform hover:scale-105"
        onClick={() => {
          setShowStudentsTable(true); // Open the students table when the button is clicked
          setIsGradesModalOpen(true); // Open the modal directly, if you want to show all students' grades initially
          setShowCoursesTable(false); // Hide the courses table
          setShowCourses(false);
        }}
      >
        Show Grades
      </button>
    </div>

    {/* View Courses */}
    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiClipboardList className="mr-2 text-orange-500" /> View Courses
      </h3>
      <p className="mt-2 text-gray-600">View all available courses for evaluation.</p>
      <button
        className="mt-4 bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-500 hover:to-orange-700 transition-transform transform hover:scale-105"
        onClick={() => setIsCoursesModalOpen(true)}
      >
        Show Courses
      </button>
    </div>

    {/* Print Evaluation Certificate */}
    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiPrinter className="mr-2 text-purple-500" /> Print Evaluation Certificate
      </h3>
      <p className="mt-2 text-gray-600">Print evaluation certificates for students.</p>
      <button
        className="mt-4 bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-purple-700 transition-transform transform hover:scale-105"
        onClick={printEvaluationCert}
      >
        Print Certificate
      </button>
    </div>
  </div>



{/* Courses Selection Modal */}
{isCoursesModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-70">
    <div className="bg-white rounded-lg shadow-xl p-8 w-11/12 sm:w-1/3">
      <h2 className="text-3xl font-semibold mb-6 text-teal-700 text-center">Select Year Level</h2>
      <div className="flex flex-col space-y-5">
        {['1st', '2nd', '3rd', '4th'].map(level => (
          <button
            key={level}
            className="bg-teal-600 text-white text-lg px-5 py-3 rounded-lg hover:bg-teal-700 transition duration-200 transform hover:scale-105"
            onClick={() => handleYearLevelSelect(level)}
          >
            {level} Year
          </button>
        ))}
      </div>
      <button
        className="mt-6 w-full bg-red-600 text-white text-lg px-5 py-3 rounded-lg hover:bg-red-700 transition duration-200 transform hover:scale-105"
        onClick={closeModal}
      >
        Close
      </button>
    </div>
  </div>
)}
{/* Semester Selection Modal */}
{isSemesterModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-70">
    <div className="bg-white rounded-lg shadow-xl p-8 w-11/12 sm:w-1/3">
      <h2 className="text-3xl font-semibold mb-6 text-teal-700 text-center">Select Semester</h2>
      <div className="flex flex-col space-y-5">
        <button
          className="bg-teal-600 text-white text-lg px-5 py-3 rounded-lg hover:bg-teal-700 transition duration-200 transform hover:scale-105"
          onClick={() => handleSemesterSelect('1st')}
        >
          1st Semester
        </button>
        <button
          className="bg-teal-600 text-white text-lg px-5 py-3 rounded-lg hover:bg-teal-700 transition duration-200 transform hover:scale-105"
          onClick={() => handleSemesterSelect('2nd')}
        >
          2nd Semester
        </button>
      </div>
      <button
        className="mt-6 w-full bg-red-600 text-white text-lg px-5 py-3 rounded-lg hover:bg-red-700 transition duration-200 transform hover:scale-105"
        onClick={closeModal}
      >
        Close
      </button>
    </div>
  </div>
)}

   


       {/* Grades Modal */}
{isGradesModalOpen && selectedStudent && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-2xl font-semibold mb-4 text-teal-600">
        Grades for {selectedStudent.firstName} {selectedStudent.lastName}
      </h2>
      {loadingGrades ? (
        <p className="text-gray-700">Loading grades...</p>
      ) : grades.length > 0 ? (
        <ul className="space-y-3">
          {grades.map((grade, index) => (
            <li key={index} className="flex justify-between items-center p-3 border-b border-gray-200 hover:bg-gray-50 transition">
              <div className="flex flex-col">
                <span className="text-gray-800 font-medium">{grade.fileName}</span>
                <span className="text-sm text-gray-500">{grade.fileType}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(grade.fileUrl, '_blank')}
                  className="text-teal-500 hover:text-teal-700 transition"
                  aria-label={`Show ${grade.fileName}`}
                >
                  <HiEye className="h-5 w-5" />
                </button>
                <a
                  href={grade.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-500 underline hidden" // Keep link for accessibility
                >
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-700">No grades available.</p>
      )}
      <button
        className="mt-4 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition w-full"
        onClick={closeModal}
      >
        Close
      </button>
    </div>
  </div>
)}
 </div>
{/* Display Students Table */}
{showStudentsTable && ( 
  <div className="mt-6 bg-white p-4 rounded-lg shadow max-h-90 overflow-hidden"> 
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">Students List, Grades, and Courses.</h3>
      {/* Search Input */}
      
      <input
        type="text"
        placeholder="Search by First Name or Student ID"
        value={searchTerm}
        onChange={handleSearch}
        className="border border-gray-300 rounded-lg p-2 w-1/3" 
      />
    </div>
    {loadingStudents ? (
      <p>Loading students...</p>
    ) : (
      <div className={`overflow-y-auto ${filteredStudents.length >= 7 ? 'max-h-96' : 'max-h-[500px]'}`}>
        <table className="min-w-full table-auto">
          <thead className="bg-teal-500 text-white z-9 sticky top-0">
            <tr>
              {/* Table Headers */}
              <th className="px-4 py-2 border">First Name</th>
              <th className="px-4 py-2 border">Last Name</th>
              <th className="px-4 py-2 border">Middle Name</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Year Level</th>
              <th className="px-4 py-2 border">Program</th>
              <th className="px-4 py-2 border">Student ID</th>
              <th className="px-4 py-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                <td className="px-4 py-2 border">{student.firstName}</td>
                <td className="px-4 py-2 border">{student.lastName}</td>
                <td className="px-4 py-2 border">{student.middleName}</td>
                <td className="px-4 py-2 border">{student.email}</td>
                <td className="px-4 py-2 border">{student.yearLevel}</td>
                <td className="px-4 py-2 border">{student.program}</td>
                <td className="px-4 py-2 border">{student.studentId}</td>
                <td className="px-4 py-2 border">
                  <div className="flex space-x-2">
                    <button
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-500 transition"
                      onClick={() => viewStudentGrades(student)}
                    >
                      View Grades
                    </button>
                    <button
                      className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-500 transition"
                      onClick={() => showStudentCourses(student)}
                    >
                      View Course
                    </button>
                    <button
                      className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-500 transition"
                      onClick={() => openNotificationModal(student)}
                    >
                      Notify
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{/* Notification Modal */}
{isNotificationModalOpen && selectedStudent && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full transition-transform transform scale-100 hover:scale-105">
      <h2 className="text-2xl font-semibold mb-4 text-teal-600">
        Notify {selectedStudent.firstName} {selectedStudent.lastName}
      </h2>
      <textarea
        className="border border-gray-300 p-2 w-full h-24 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
        placeholder="Type your message here..."
        value={notificationMessage}
        onChange={(e) => setNotificationMessage(e.target.value)} // Ensure you have this state set
      />
      <div className="flex flex-col mt-4 space-y-2">
        <button
          className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition w-full"
          onClick={() => sendNotification(selectedStudent.id)} // Call the function to send notification
        >
          Send
        </button>
        <button
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition w-full"
          onClick={closeNotificationModal}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}




{/* Modal for Course Files */}
{isCourseFilesModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full transition-transform transform scale-100 hover:scale-105">
      <h3 className="text-2xl font-bold mb-6 text-center text-teal-600 flex items-center justify-center">
        <HiEye className="mr-2 text-teal-600" /> Uploaded Course Files
      </h3>
      {loadingCourseFiles ? (
        <p className="text-center text-gray-600">Loading course files...</p>
      ) : (
        <div className="space-y-4">
          {courseFiles.length === 0 ? (
            <p className="text-center text-gray-600">No course files found for this student.</p>
          ) : (
            courseFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm transition-shadow hover:shadow-md">
                <span className="text-lg font-medium text-gray-700">{file.name}</span>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-teal-500 hover:text-teal-700 font-semibold transition-colors flex items-center"
                >
                  <HiEye className="mr-1" /> View
                </a>
              </div>
            ))
          )}
        </div>
      )}
      <div className="flex justify-end mt-6">
        <button
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          onClick={() => setIsCourseFilesModalOpen(false)} // Close modal function
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

   {/* Courses Table */}
   {showCourses && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              Courses for {yearLevel} Year - {semester} Semester
            </h3>
          </div>
          {courses.length > 0 ? (
            <table className="min-w-full table-auto">
               <thead>
                      <tr>
                        <th className="border px-4 py-2">Course Code</th>
                        <th className="border px-4 py-2">Course Title</th>
                        <th className="border px-4 py-2 text-center" colSpan={3}>
                          Units<br />
                          <span className="flex justify-around">
                            <span>Lec</span>
                            <span>Lab</span>
                            <span>Total</span>
                          </span>
                        </th>
                        <th className="border px-4 py-2 text-center" colSpan={3}>
                          Hours/Week<br />
                          <span className="flex justify-around">
                            <span>Lec</span>
                            <span>Lab</span>
                            <span>Total</span>
                          </span>
                        </th>
                        <th className="border px-4 py-2 text-center" colSpan={3}>
                          Hours/Semester<br />
                          <span className="flex justify-around">
                            <span>Lec</span>
                            <span>Lab</span>
                            <span>Total</span>
                          </span>
                        </th>
                        <th className="border px-4 py-2">Pre-Requisite</th>
                        <th className="border px-4 py-2">Co-Requisite</th>
                      </tr>
                    </thead>
              <tbody>
                {courses.map((course, index) => (
                  <tr key={course.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                   <td className="border px-4 py-2">{course.courseCode}</td>
                        <td className="border px-4 py-2">{course.courseTitle}</td>
                        <td className="border px-4 py-2">{course.units.lec}</td>
                        <td className="border px-4 py-2">{course.units.lab}</td>
                        <td className="border px-4 py-2">{course.units.total}</td>
                        <td className="border px-4 py-2">{course.hoursPerWeek.lec}</td>
                        <td className="border px-4 py-2">{course.hoursPerWeek.lab}</td>
                        <td className="border px-4 py-2">{course.hoursPerWeek.total}</td>
                        <td className="border px-4 py-2">{course.hoursPerSemester.lec}</td>
                        <td className="border px-4 py-2">{course.hoursPerSemester.lab}</td>
                        <td className="border px-4 py-2">{course.hoursPerSemester.total}</td>
                        <td className="border px-4 py-2">{course.preRequisite}</td>
                        <td className="border px-4 py-2">{course.coRequisite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No courses available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewEvaluationCert;
