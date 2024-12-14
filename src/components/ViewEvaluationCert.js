import React, { useState, useEffect } from 'react';
import { HiOutlineEye, HiClipboardList, HiPrinter, HiEye  } from 'react-icons/hi';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { HiOutlineAcademicCap, HiX, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineXCircle, HiPlus } from "react-icons/hi";

const ViewEvaluationCert = ({ viewCourses }) => {
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
  const [loadingProgress, setLoadingProgress] = useState(0); // Define loadingProgress state
  const [studentName, setStudentName] = useState('');
  const [isExcludedCoursesModalOpen, setIsExcludedCoursesModalOpen] = useState(false);
const [excludedCourses, setExcludedCourses] = useState([]);  // For storing excluded courses
const [showExcludedCourses, setShowExcludedCourses] = useState(false); // Declare the state for toggling excluded courses
const [dropdownOpen, setDropdownOpen] = useState(false);
const [selectedYear, setSelectedYear] = useState(null);
const [semesterModalOpen, setSemesterModalOpen] = useState(false);
const [selectedSemester, setSelectedSemester] = useState(null);
const [modalType, setModalType] = useState('success'); // Default to success

const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
const [currentYear, setCurrentYear] = useState(null);
const [currentSemester, setCurrentSemester] = useState(null);
const [courseList, setCourseList] = useState([]);
const [isSemesterSelectionModalOpen, setIsSemesterSelectionModalOpen] = useState(false);
const [modalMessage, setModalMessage] = useState('');
const [isModalOpen, setIsModalOpen] = useState(false); 

const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);


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


// Helper function to format the year as '1stYear', '2ndYear', etc.
const getFormattedYear = (year) => {
  const suffixes = ['st', 'nd', 'rd', 'th'];
  const remainder = year % 10;
  const suffix = (remainder <= 3 && (Math.floor(year / 10) !== 1)) ? suffixes[remainder - 1] : suffixes[3];
  return `${year}${suffix}Year`;
};

// Handle year level selection
const handleYearSelection = (year) => {
  setCurrentYear(year);
  setIsSemesterSelectionModalOpen(true);
};

const printEvaluationCert = () => {
  // The download URL of the PDF stored in Firebase Storage
  const pdfUrl = 'https://firebasestorage.googleapis.com/v0/b/gradeeval.appspot.com/o/ROF-042%20Course%20Assessment%20Fillable%20Form%20(1).pdf?alt=media&token=cce7068a-4ea4-4231-b8fe-01004d127dd4';

  // Open the PDF in a new tab
  window.open(pdfUrl, '_blank');
};

// Handle semester selection
const handleSemesterSelection = (semester) => {
  // Log the semester being selected to verify the value
  console.log("Selected Semester:", semester);

  setCurrentSemester(semester);
  setIsSemesterSelectionModalOpen(false);
  setIsSubjectModalOpen(true);

  // Fetch courses based on the formatted year and selected semester
  const formattedYear = getFormattedYear(currentYear);
  fetchCourses(formattedYear, semester);
};

const handleAddCourse = async (course) => {
  if (!selectedStudent) {
    console.error('No student selected!');
    return;
  }

  console.log("Adding course to student ID:", selectedStudent.id);

  try {
    const studentDocRef = doc(db, 'coursesToEnrollments', selectedStudent.id);
    const studentDocSnapshot = await getDoc(studentDocRef);

    if (studentDocSnapshot.exists()) {
      const studentData = studentDocSnapshot.data();
      const existingCourses = studentData.eligibleCourses || [];

      const courseAlreadyAdded = existingCourses.some(existingCourse => existingCourse.id === course.id);

      if (courseAlreadyAdded) {
        setModalMessage('This course has already been added to the student\'s enrollment.');
        setModalType('warning'); // You can set a type for the message: 'warning' for already added.
        setIsModalOpen(true);
      } else {
        existingCourses.push(course);

        await updateDoc(studentDocRef, {
          eligibleCourses: existingCourses
        });

        setModalMessage('Course successfully added to the student\'s enrollment!');
        setModalType('success'); // Set success type for the successful add.
        setIsModalOpen(true);
      }
    } else {
      setModalMessage('Student document not found.');
      setModalType('error'); // Error message type
      setIsModalOpen(true);
    }
  } catch (error) {
    console.error('Error adding course to student:', error);
    setModalMessage('Error adding course. Please try again.');
    setModalType('error'); // Error message type
    setIsModalOpen(true);
  }
};

const fetchCourses = async (formattedYear, sem) => {
  try {
    const semester = sem === 'firstSemester' ? 'firstSemester' : 'secondSemester';

    // Log the correctly formatted year and semester
    console.log('Fetching courses for:', formattedYear, semester);

    // Construct the Firestore path
    const subjectsRef = collection(db, 'subjects', formattedYear, semester);

    console.log('Querying Firestore path:', `${formattedYear}/${semester}`);

    // Fetch the documents
    const querySnapshot = await getDocs(subjectsRef);

    // Log the snapshot
    console.log('Query Snapshot:', querySnapshot);

    // Map the data
    const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('Fetched courses:', coursesData);

    // Additional debugging for each course
    coursesData.forEach((course, index) => {
      console.log(`Course ${index + 1}:`, course);
    });

    // Update the course list
    setCourseList(coursesData);
  } catch (error) {
    console.error('Error fetching courses:', error);
  }
};





   // Function to handle year selection
const handleYearSelect = (year) => {
  setSelectedYear(year);
  setSemesterModalOpen(true); // Show the semester modal after year selection
  setDropdownOpen(false); // Close the year dropdown
};
  
  // Function to handle semester selection
const selectSemester = (semester) => {
  setSelectedSemester(semester);
  fetchArchivedGrades(selectedStudent, selectedYear, semester); // Fetch grades based on selected year and semester
  setSemesterModalOpen(false); // Close the semester modal after selection
};


// Function to fetch archived grades
const fetchArchivedGrades = async (student, selectedYear, selectedSemester) => {
  setLoadingGrades(true);
  setSelectedStudent(student);
  setLoadingProgress(0); // Initialize progress at 0

  try {
    console.log('Fetching archived grades for student:', student.id);

    // Reference to the student's archived grades collection
    const yearRef = collection(db, 'archivedGrades', student.id, selectedYear);

    // Reference to the specific semester document
    const semesterDocRef = doc(yearRef, selectedSemester);
    const semesterDoc = await getDoc(semesterDocRef);

    if (semesterDoc.exists()) {
      const { grades: semesterGrades, fileUrl } = semesterDoc.data();
      console.log(`Archived grades for ${selectedYear} - ${selectedSemester}:`, semesterGrades);

      // Update the state with fetched archived grades
      setGrades([
        {
          yearLevel: selectedYear,
          semester: selectedSemester,
          grades: semesterGrades,
          fileUrl,
        },
      ]);
      setIsGradesModalOpen(true);
    } else {
      console.log(`No archived grades found for ${selectedYear} - ${selectedSemester}`);
      setGrades([]); // No grades found
    }
  } catch (error) {
    console.error('Error fetching archived grades:', error.message);
    alert("An error occurred while fetching the student's archived grades.");
  } finally {
    setLoadingGrades(false);
  }
};



  // Handler for toggling courses visibility
  const handleShowGrades = () => {
    setShowCourses(!showCourses); // Toggle the visibility
  };


  const viewStudentGrades = async (student) => {
    setLoadingGrades(true);
    setSelectedStudent(student);
    setLoadingProgress(0); // Initialize progress at 0

    try {
        console.log('Fetching grades for student:', student.id);
        
        const gradesRef = doc(db, 'grades', student.id); // Reference to the student's grades document
        const gradesDoc = await getDoc(gradesRef);

        if (!gradesDoc.exists()) {
            console.log('No grades document found for student:', student.id);
            setGrades([]);
            setIsGradesModalOpen(true);
            setLoadingGrades(false);
            return;
        }

        const allGradesData = []; // Array to store all fetched grades
        const yearLevels = ['1st year', '2nd year', '3rd year', '4th year'];
        const semesters = ['firstSemester', 'secondSemester'];
        let totalItems = yearLevels.length * semesters.length;
        let processedItems = 0;

        // Loop through each year level and semester
        for (const yearLevel of yearLevels) {
            for (const semester of semesters) {
                console.log(`Checking ${yearLevel} - ${semester} for student: ${student.id}`);
                
                const semesterDocRef = doc(collection(gradesRef, yearLevel), semester);
                const semesterDoc = await getDoc(semesterDocRef);

                if (semesterDoc.exists()) {
                    const { grades: semesterGrades, fileUrl } = semesterDoc.data();
                    console.log(`Grades found for ${yearLevel} - ${semester}:`, semesterGrades);

                    allGradesData.push({
                        yearLevel,
                        semester,
                        grades: semesterGrades,
                        fileUrl,
                    });
                } else {
                    console.log(`No data found for ${yearLevel} - ${semester}`);
                }

                processedItems++;
                setLoadingProgress((processedItems / totalItems) * 100); // Update the progress
            }
        }

        // Update the state with fetched grades
        setGrades(allGradesData);
        setIsGradesModalOpen(true);
    } catch (error) {
        console.error('Error fetching grades:', error.message);
        alert("An error occurred while fetching the student's grades.");
    } finally {
        setLoadingGrades(false);
    }
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
    const formattedYear = `${level}Year`; // Format the year with "Year"
    setYearLevel(formattedYear);         // Store the formatted year
    setIsCoursesModalOpen(false);
    setIsSemesterModalOpen(true);
    setIsGradesModalOpen(false);
  };
  
  const handleSemesterSelect = async (sem) => {
    // Log the selected semester to check the value
    console.log("Selected Semester:", sem);
  
    // Map '1st' to 'firstSemester' and '2nd' to 'secondSemester'
    const semesterFormatted = sem === '1st' ? 'firstSemester' : 'secondSemester';
  
    setSemester(semesterFormatted);  // Update the semester state with the correctly formatted value
    
    // Call the fetchCourses function with the correctly formatted year and semester
    await fetchCourses(yearLevel, semesterFormatted);
    
    setIsSemesterModalOpen(false);   // Close the semester modal
    setIsGradesModalOpen(false);     // Close the grades modal
    setShowCourses(true);            // Show the courses table
    setShowStudentsTable(false);     // Optionally hide students table (if necessary)
  };
  

 
  

  const showStudentCourses = async (student) => {
    setLoadingCourseFiles(true);
    try {
      // Log the student ID
      console.log("Selected Student ID:", student.id);  // This logs the ID of the selected student
  
      // Set the selected student in state
      setSelectedStudent(student); // Store the selected student in the state
  
      // Create a reference to the student's document in 'coursesToEnrollments' collection
      const studentDocRef = doc(db, 'coursesToEnrollments', student.id); // Access the student by their ID
  
      // Fetch the student's document from coursesToEnrollments
      const studentDocSnapshot = await getDoc(studentDocRef);
  
      // Check if the document exists
      if (studentDocSnapshot.exists()) {
        // Get the 'eligibleCourses' array from the document
        const eligibleCourses = studentDocSnapshot.data().eligibleCourses;
  
        // Fetch the student's name from the 'users' collection using the student ID
        const userDocRef = doc(db, 'users', student.id); // Assuming the document ID is the same
        const userDocSnapshot = await getDoc(userDocRef);
  
        if (userDocSnapshot.exists()) {
          // Extract student's name
          const firstName = userDocSnapshot.data().firstName;
          const lastName = userDocSnapshot.data().lastName;
          const studentName = `${firstName} ${lastName}`;
  
          // Set the student's name in the state (for displaying in the modal)
          setStudentName(studentName);
        } else {
          console.error('User document not found.');
        }
  
        // Check if there are any eligible courses
        if (eligibleCourses && eligibleCourses.length > 0) {
          // Map through the courses and extract relevant information
          const fetchedCourses = eligibleCourses.map(course => ({
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            courseDescription: course.preRequisite || "No prerequisites",
            hoursPerSemester: course.hoursPerSemester,
            hoursPerWeek: course.hoursPerWeek,
            units: course.units,
            excludedCourses: course.excludedCourses,
            id: course.id
          }));
  
          // Set the fetched courses in the state
          setCourseFiles(fetchedCourses);
        } else {
          alert('No courses found for this student.');
        }
  
        // Fetch the excluded courses based on the student ID
        const excludedCoursesRef = doc(db, 'excludedCourses', student.id);  // Get the specific document for the student
        const excludedCoursesDoc = await getDoc(excludedCoursesRef);
  
        if (excludedCoursesDoc.exists()) {
          // Get the 'excludedCourses' field from the document
          const excludedCoursesList = excludedCoursesDoc.data().excludedCourses;
  
          if (excludedCoursesList && excludedCoursesList.length > 0) {
            setExcludedCourses(excludedCoursesList);  // Set the excluded courses
          } else {
            console.log("No excluded courses found.");
            setExcludedCourses([]);  // Handle the case of no excluded courses
          }
        } else {
          console.log("No excluded courses document found.");
          setExcludedCourses([]);  // Handle the case where no document exists for the student
        }
  
        setIsCourseFilesModalOpen(true);
      } else {
        alert('Student document not found.');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
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
        <HiPrinter className="mr-2 text-purple-500" /> Generate Evaluation Certificate
      </h3>
      <p className="mt-2 text-gray-600">Generate evaluation certificates for students.</p>
      <button
        className="mt-4 bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-500 hover:to-purple-700 transition-transform transform hover:scale-105"
        onClick={printEvaluationCert}
      >
        Generate Certificate
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
    <div className="bg-white p-8 rounded-lg shadow-2xl w-11/12 max-w-4xl">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-teal-700">
            Grades for {selectedStudent.firstName} {selectedStudent.lastName}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            View the grades and academic details of the selected student.
          </p>
        </div>
        {/* Dropdown Button */}
        <div className="relative">
          <button
            className="bg-teal-600 text-white font-medium py-2 px-4 rounded-lg shadow hover:bg-teal-700 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            Select Year
          </button>
          {/* Dropdown Menu */}
          {/* Dropdown Menu */}
{dropdownOpen && (
  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
    <ul className="divide-y divide-gray-200">
      {['1st year', '2nd year', '3rd year', '4th year'].map((year, index) => (
        <li
          key={index}
          className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors cursor-pointer"
          onClick={() => handleYearSelect(year)}
        >
          {year}
        </li>
      ))}
    </ul>
  </div>
)}

        </div>
      </div>

      {/* Grades Section */}
      {loadingGrades ? (
        <p className="text-gray-500 text-lg text-center">Loading grades...</p>
      ) : grades.length > 0 ? (
        <div className="overflow-x-auto space-y-6">
          {grades.map((gradeData, index) => (
            <div key={index} className="border-b border-gray-300 pb-6">
              <h3 className="text-xl font-semibold text-teal-600 mb-4">
                {gradeData.yearLevel} - {gradeData.semester}
              </h3>
              <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow">
                <thead>
                  <tr className="bg-teal-600 text-white">
                  <th className="py-3 px-4 text-left text-sm font-medium">Course Code</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Course Title</th>
                   
                    <th className="py-3 px-4 text-left text-sm font-medium">Pre-requisite</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Grade</th>
                    <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.grades.map((subject, idx) => (
                    <tr
                      key={idx}
                      className={`border-b ${
                        idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                           <td className="py-3 px-4 text-gray-800">{subject.courseCode}</td>
                      <td className="py-3 px-4 text-gray-800">{subject.courseTitle}</td>
                 
                      <td className="py-3 px-4 text-gray-800">
                        {subject.preRequisite}
                      </td>
                      <td className="py-3 px-4 text-gray-800">{subject.grade}</td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          subject.status === 'PASSED'
                            ? 'text-green-600'
                            : subject.status === 'FAILED'
                            ? 'text-red-600'
                            : 'text-gray-800'
                        }`}
                      >
                        {subject.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gradeData.fileUrl && (
                <div className="mt-4 text-right">
                  <button
                    onClick={() => window.open(gradeData.fileUrl, '_blank')}
                    className="text-teal-600 hover:text-teal-800 text-sm font-semibold transition"
                  >
                    View Uploaded File
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-lg text-center">No grades available.</p>
      )}

      {/* Close Button */}
      <button
        className="mt-6 bg-red-600 text-white text-lg font-semibold py-3 rounded-lg shadow hover:bg-red-700 transition w-full"
        onClick={closeModal}
      >
        Close
      </button>
    </div>
  </div>
)}


   {/* Semester Modal */}
{semesterModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-2xl w-11/12 max-w-lg flex flex-col items-center">
      {/* Icon and Label Aligned Horizontally */}
      <div className="flex items-center space-x-3 mb-6">
        <HiOutlineAcademicCap className="text-teal-600 text-5xl" />
        <h2 className="text-2xl font-bold text-gray-800">
          Select Semester
        </h2>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-6 text-center">
        Please choose a semester for <span className="font-semibold text-gray-800">{selectedYear}</span>.
      </p>

      {/* Semester Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full">
        <button
          className="bg-teal-600 text-white py-3 px-6 rounded-lg flex justify-center items-center space-x-2 shadow-lg hover:bg-teal-700 transition duration-300"
          onClick={() => selectSemester('firstSemester')}
        >
          <HiOutlineAcademicCap className="text-xl" />
          <span>First Semester</span>
        </button>
        <button
          className="bg-teal-600 text-white py-3 px-6 rounded-lg flex justify-center items-center space-x-2 shadow-lg hover:bg-teal-700 transition duration-300"
          onClick={() => selectSemester('secondSemester')}
        >
          <HiOutlineAcademicCap className="text-xl" />
          <span>Second Semester</span>
        </button>
      </div>

      {/* Close Button */}
      <button
        className="mt-6 bg-red-600 text-white text-lg font-semibold py-3 rounded-lg shadow-lg hover:bg-red-700 transition duration-300 w-full"
        onClick={() => setSemesterModalOpen(false)}
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
{/* Loading Modal */}
{loadingGrades && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center transform transition-all duration-500 ease-out">
            <div className="mb-6">
                {/* Progress bar with dynamic width based on loadingProgress */}
                <div className="relative pt-1">
                    <div className="flex mb-4 items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">Loading...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        {/* Smooth progress bar animation */}
                        <div
                            className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            <p className="text-2xl font-semibold text-teal-700 mb-4 animate-fadeIn">Fetching Grades...</p>
            <p className="text-sm text-gray-600 mb-6">Please be patient while we retrieve the data.</p>
            <p className="text-xs text-gray-500 italic animate-fadeIn">This may take a moment depending on your connection.</p>
        </div>
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


{isCourseFilesModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-5xl w-full">
      <h3 className="text-2xl font-bold mb-6 text-center text-teal-600 flex items-center justify-center">
        <HiEye className="mr-2 text-teal-600" />
        {showExcludedCourses ? `${studentName}'s Excluded Courses` : `${studentName}'s Courses to Enroll`}
      </h3>

      {loadingCourseFiles ? (
        <p className="text-center text-gray-600">Loading courses...</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Main Course Table */}
          {!showExcludedCourses && (
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="bg-orange-300">
                  <th className="border p-4">Course Code</th>
                  <th className="border p-4">Course Title</th>
                  <th className="border p-4" colSpan={3}>
                    Units<br />
                    <span className="flex justify-around">
                      <span>Lec</span>
                      <span>Lab</span>
                      <span>Total</span>
                    </span>
                  </th>
                  <th className="border p-4" colSpan={3}>
                    Hours/Week<br />
                    <span className="flex justify-around">
                      <span>Lec</span>
                      <span>Lab</span>
                      <span>Total</span>
                    </span>
                  </th>
                  <th className="border p-4" colSpan={3}>
                    Hours/Semester<br />
                    <span className="flex justify-around">
                      <span>Lec</span>
                      <span>Lab</span>
                      <span>Total</span>
                    </span>
                  </th>
                  <th className="border p-4">Pre-Requisite</th>
                </tr>
              </thead>
              <tbody>
                {courseFiles.length > 0 ? (
                  courseFiles.map((course, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}>
                      <td className="border p-4">{course.courseCode}</td>
                      <td className="border p-4">{course.courseTitle}</td>
                      <td className="border p-4">{course.units.lec}</td>
                      <td className="border p-4">{course.units.lab}</td>
                      <td className="border p-4">{course.units.total}</td>
                      <td className="border p-4">{course.hoursPerWeek.lec}</td>
                      <td className="border p-4">{course.hoursPerWeek.lab}</td>
                      <td className="border p-4">{course.hoursPerWeek.total}</td>
                      <td className="border p-4">{course.hoursPerSemester.lec}</td>
                      <td className="border p-4">{course.hoursPerSemester.lab}</td>
                      <td className="border p-4">{course.hoursPerSemester.total}</td>
                      <td className="border p-4">{course.preRequisite}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={13} className="text-center text-gray-500 py-6">No courses available for enrollment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Display excluded courses if the state is true */}
          {showExcludedCourses && excludedCourses.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xl font-semibold mb-4 text-red-600">Excluded Courses</h4>
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr className="bg-red-300">
                    <th className="border p-4">Course Code</th>
                    <th className="border p-4">Course Title</th>
                    <th className="border p-4">Pre-Requisite</th>
                  </tr>
                </thead>
                <tbody>
                  {excludedCourses.map((course, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}>
                      <td className="border p-4">{course.courseCode}</td>
                      <td className="border p-4">{course.courseTitle}</td>
                      <td className="border p-4">{course.preRequisite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Button to toggle excluded courses */}
          <div className="mt-6 text-center">
            
          </div>
        </div>
      )}

<div className="flex justify-end mt-6 space-x-4">
  <button
    className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors flex items-center"
    onClick={() => setShowExcludedCourses((prev) => !prev)} // Toggle excluded courses visibility
  >
    <HiEye className="mr-2" /> {/* Icon on the left */}
    {showExcludedCourses ? "Hide Excluded Courses" : "View Excluded Courses"}
  </button>

  <button
    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
    onClick={() => setIsCourseModalOpen(true)}
  >
    <HiPlus className="mr-2" /> {/* Icon on the left */}
    Add Course
  </button>

  <button
    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center"
    onClick={() => setIsCourseFilesModalOpen(false)} // Close modal function
  >
    <HiX className="mr-2" /> {/* Icon on the left */}
    Close
  </button>
</div>

    </div>
  </div>
)}

 {/* Year Selection Modal */}
 {isCourseModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-2xl font-bold mb-6 text-center text-teal-600">Select Year Level</h3>
            <div className="flex flex-col space-y-4">
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleYearSelection(1)}
              >
                1st Year
              </button>
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleYearSelection(2)}
              >
                2nd Year
              </button>
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleYearSelection(3)}
              >
                3rd Year
              </button>
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleYearSelection(4)}
              >
                4th Year
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
                onClick={() => setIsCourseModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Semester Selection Modal */}
      {isSemesterSelectionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-2xl font-bold mb-6 text-center text-teal-600">Select Semester</h3>
            <div className="flex flex-col space-y-4">
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleSemesterSelection('firstSemester')}
              >
                First Semester
              </button>
              <button
                className="bg-teal-500 text-white px-6 py-2 rounded-lg"
                onClick={() => handleSemesterSelection('secondSemester')}
              >
                Second Semester
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
                onClick={() => setIsSemesterSelectionModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
{/* Subject Selection Modal */}
{isSubjectModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-7xl w-full">
      <h3 className="text-2xl font-bold mb-6 text-center text-teal-600">Select Subject</h3>
      <div className="overflow-x-auto">
      <table className="min-w-full table-auto">
      <thead>
            <tr className="bg-orange-300">
              <th className="border p-4">Course Code</th>
              <th className="border p-4">Course Title</th>
              <th className="border p-4" colSpan={3}>
                Units<br />
                <span className="flex justify-around">
                  <span>Lec</span>
                  <span>Lab</span>
                  <span>Total</span>
                </span>
              </th>
              <th className="border p-4" colSpan={3}>
                Hours/Week<br />
                <span className="flex justify-around">
                  <span>Lec</span>
                  <span>Lab</span>
                  <span>Total</span>
                </span>
              </th>
              <th className="border p-4" colSpan={3}>
                Hours/Semester<br />
                <span className="flex justify-around">
                  <span>Lec</span>
                  <span>Lab</span>
                  <span>Total</span>
                </span>
              </th>
              <th className="border p-4">Pre-Requisite</th>
              <th className="border p-4">Action</th> {/* Add Action column for the button */}
            </tr>
          </thead>
        </table>
       {/* Scrollable tbody */}
<div className={courseList.length >= 4 ? "max-h-96 overflow-y-auto" : ""}>
  <table className="w-full border-collapse text-base">
    <tbody>
      {courseList.length > 0 ? (
        courseList.map((course, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}>
            <td className="border p-4">{course.courseCode}</td>
            <td className="border p-4">{course.courseTitle}</td>
            <td className="border p-4">{course.units.lec}</td>
            <td className="border p-4">{course.units.lab}</td>
            <td className="border p-4">{course.units.total}</td>
            <td className="border p-4">{course.hoursPerWeek.lec}</td>
            <td className="border p-4">{course.hoursPerWeek.lab}</td>
            <td className="border p-4">{course.hoursPerWeek.total}</td>
            <td className="border p-4">{course.hoursPerSemester.lec}</td>
            <td className="border p-4">{course.hoursPerSemester.lab}</td>
            <td className="border p-4">{course.hoursPerSemester.total}</td>
            <td className="border p-4">{course.preRequisite}</td>
            <td className="border p-4">
              {/* Add button for each row */}
              <button
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600"
                onClick={() => handleAddCourse(course)}
              >
                Add
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={14} className="text-center text-gray-500 py-6">No courses available for enrollment.</td>
        </tr>
      )}
    </tbody>
  </table>
</div>

      </div>
      <div className="flex justify-end mt-6">
        <button
          className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
          onClick={() => setIsSubjectModalOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


{/* Modal for Success/Error/Warning Messages */}
{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-black">
    <div className={`bg-white rounded-lg shadow-lg p-8 max-w-sm w-full ${modalType === 'error' ? 'border-red-500' : modalType === 'warning' ? 'border-yellow-500' : 'border-teal-500'}`}>
      <div className="text-center">
        {/* Icon based on message type */}
        {modalType === 'success' && <HiOutlineCheckCircle className="text-teal-500 text-6xl mb-4 mx-auto" />}
        {modalType === 'warning' && <HiOutlineExclamation className="text-red-500 text-6xl mb-4 mx-auto" />}
        {modalType === 'error' && <HiOutlineXCircle className="text-red-500 text-6xl mb-4 mx-auto" />}

        <h2 className="text-xl font-semibold text-teal-600 mb-4">Message</h2>
        <p className="text-lg text-gray-700 mb-4">{modalMessage}</p>
        
        {/* Close Button */}
        <button
          onClick={() => setIsModalOpen(false)}  // Close the modal
          className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


{showCourses && (
  <div className="mt-6 bg-white p-4 rounded-lg shadow">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold">
        Courses for {yearLevel}  - {semester} 
      </h3>
    </div>
    {courseList.length > 0 ? ( // Changed `courses` to `courseList`
          <div className="max-h-96 overflow-y-auto"> {/* Increased max height for the table container */}
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
            {courseList.map((course, index) => ( // Changed `courses` to `courseList`
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
      </div>
    ) : (
      <p>No courses available.</p>
    )}
  </div>
)}

    </div>
  );
};

export default ViewEvaluationCert;
