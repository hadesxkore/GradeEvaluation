import React, { useState, useEffect } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { db } from '../firebase'; // Ensure you're importing your Firestore instance
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { HiCheck } from 'react-icons/hi';


import { HiOutlineClipboardList, HiOutlineUsers, HiOutlineBookOpen, HiOutlineChartBar, 
HiStar, HiChartBar, HiOutlineClipboardCheck,  HiOutlineChatAlt , HiOutlineEye, HiOutlineUserGroup, HiOutlineViewList, HiOutlinePlus } from 'react-icons/hi';


const StudentEvaluationTools = () => {
  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Student Evaluation Tools</h2>
      <p className="mb-4 text-gray-700">
        Utilize the following tools to assess and track student performance effectively. Choose the right evaluation method that fits your course objectives.
      </p>

      {/* Evaluation Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Grading Rubric */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardCheck className="mr-2 text-green-500" /> Grading Rubric
          </h3>
          <p className="mt-2 text-gray-600">
            Create and manage detailed grading rubrics to ensure fair and transparent assessments.
          </p>
          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
            Create Rubric
          </button>
        </div>

        {/* Tool 2: Progress Tracking */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiChartBar className="mr-2 text-blue-500" /> Progress Tracking
          </h3>
          <p className="mt-2 text-gray-600">
            Monitor student progress with visual analytics and reports to identify areas of improvement.
          </p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            View Progress
          </button>
        </div>

        {/* Tool 3: Feedback Mechanism */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiStar className="mr-2 text-yellow-500" /> Feedback Mechanism
          </h3>
          <p className="mt-2 text-gray-600">
            Collect and analyze feedback from students to enhance the learning experience and course content.
          </p>
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
            Gather Feedback
          </button>
        </div>

        {/* Tool 4: Exam and Assessment Creation */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardCheck className="mr-2 text-red-500" /> Exam & Assessment
          </h3>
          <p className="mt-2 text-gray-600">
            Design and administer exams with customizable questions and formats to assess student knowledge effectively.
          </p>
          <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
            Create Assessment
          </button>
        </div>
      </div>

      {/* Conclusion Section */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold">Ready to Evaluate?</h4>
        <p className="text-gray-600">
          Start using these tools today to streamline your evaluation processes and provide meaningful insights into student performance.
        </p>
      </div>
    </div>
  );
};


const FeedbackMechanism = () => {
  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Feedback Mechanism</h2>
      <p className="mb-4 text-gray-700">
        Utilize this section to gather feedback from students and analyze their insights to improve course delivery and engagement.
      </p>

      {/* Feedback Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Collect Feedback */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineChatAlt className="mr-2 text-green-500" /> Collect Feedback
          </h3>
          <p className="mt-2 text-gray-600">
            Create surveys and questionnaires to collect valuable feedback from students about their learning experiences.
          </p>
          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
            Create Survey
          </button>
        </div>

        {/* Tool 2: View Feedback */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardList className="mr-2 text-blue-500" /> View Feedback
          </h3>
          <p className="mt-2 text-gray-600">
            Access and review feedback submitted by students to identify trends and areas for improvement.
          </p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            Review Feedback
          </button>
        </div>

        {/* Tool 3: Feedback Analytics */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineEye className="mr-2 text-yellow-500" /> Feedback Analytics
          </h3>
          <p className="mt-2 text-gray-600">
            Analyze feedback data with visual charts and graphs to make informed decisions regarding course improvements.
          </p>
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
            View Analytics
          </button>
        </div>

        {/* Tool 4: Respond to Feedback */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineChatAlt className="mr-2 text-red-500" /> Respond to Feedback
          </h3>
          <p className="mt-2 text-gray-600">
            Engage with students by responding to their feedback, fostering a positive and communicative learning environment.
          </p>
          <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
            Respond
          </button>
        </div>
      </div>

      {/* Conclusion Section */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold">Engage with Your Students</h4>
        <p className="text-gray-600">
          Use these tools to collect, analyze, and respond to student feedback, creating a more effective and engaging learning experience.
        </p>
      </div>
    </div>
  );
};
const ProgressTracking = () => {
  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Progress Tracking</h2>
      <p className="mb-4 text-gray-700">
        Utilize this section to monitor student progress, evaluate performance metrics, and implement strategies for improvement.
      </p>

      {/* Progress Tracking Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Student Progress Overview */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineUserGroup className="mr-2 text-blue-500" /> Student Progress Overview
          </h3>
          <p className="mt-2 text-gray-600">
            Get a comprehensive overview of student progress across all courses, including attendance, assignment submissions, and exam results.
          </p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            View Overview
          </button>
        </div>

        {/* Tool 2: Performance Metrics */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineChartBar className="mr-2 text-green-500" /> Performance Metrics
          </h3>
          <p className="mt-2 text-gray-600">
            Analyze performance data with visual charts and metrics to identify trends and areas needing attention.
          </p>
          <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
            View Metrics
          </button>
        </div>

        {/* Tool 3: Individual Progress Reports */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardCheck className="mr-2 text-yellow-500" /> Individual Progress Reports
          </h3>
          <p className="mt-2 text-gray-600">
            Generate detailed reports for individual students to provide insights into their progress and areas for improvement.
          </p>
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
            Generate Report
          </button>
        </div>

        {/* Tool 4: Set Improvement Goals */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardCheck className="mr-2 text-red-500" /> Set Improvement Goals
          </h3>
          <p className="mt-2 text-gray-600">
            Collaborate with students to set personalized improvement goals based on their performance data.
          </p>
          <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
            Set Goals
          </button>
        </div>
      </div>

      {/* Conclusion Section */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold">Empower Your Students</h4>
        <p className="text-gray-600">
          Use these tools to monitor progress, analyze performance, and work collaboratively with students to enhance their learning journey.
        </p>
      </div>
    </div>
  );
};


const CourseManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showCourses, setShowCourses] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    prerequisites: '',
    courseCode: '',
    units: '',
    hoursPerWeek: '',
    hoursPerSemester: '',
  });

  const handleChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      console.log('Document written with ID: ', docRef.id);
      setCourseData({
        title: '',
        description: '',
        prerequisites: '',
        courseCode: '',
        units: '',
        hoursPerWeek: '',
        hoursPerSemester: '',
      });
      setShowModal(false); // Close modal after submission
      setShowSuccessModal(true); // Show success modal
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const coursesCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(coursesCollection);
      const coursesData = courseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCourses(coursesData);
      setShowCoursesModal(true); // Open the modal after fetching
    } catch (error) {
      console.error("Error fetching courses: ", error);
    }
  };

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);


  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Course Management</h2>
      <p className="mb-4 text-gray-700">
        Manage your courses efficiently with tools to add, edit, and monitor course details.
      </p>

      {/* Course Management Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Add New Course */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlinePlus className="mr-2 text-green-500" /> Add New Course
          </h3>
          <p className="mt-2 text-gray-600">
            Create a new course and set its details such as title, description, and prerequisites.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Add Course
          </button>
        </div>

     {/* Tool 2: View All Courses */}
     <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold flex items-center">
          <HiOutlineViewList className="mr-2 text-blue-500" /> View All Courses
        </h3>
        <p className="mt-2 text-gray-600">
          Access a list of all courses with details, including enrolled students and course materials.
        </p>
        <button
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          onClick={fetchCourses}
        >
          View Courses
        </button>
      </div>

 {/* Courses Modal */}
{showCoursesModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
    <div className="bg-white rounded-lg p-10 shadow-lg max-w-7xl w-full"> {/* Adjusted max width */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">Courses List</h2> {/* Font size adjusted */}
        <button
          onClick={() => setShowCoursesModal(false)}
          className="text-gray-600 hover:text-gray-800 text-3xl"
        >
          &times;
        </button>
      </div>
      <div className="overflow-x-auto max-h-[600px]"> {/* Retained max height for scrolling */}
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-200 text-gray-600">
              <th className="py-4 px-6 border-b text-left text-lg">Course Code</th> {/* Font size retained */}
              <th className="py-4 px-6 border-b text-left text-lg">Title</th>
              <th className="py-4 px-6 border-b text-left text-lg">Description</th>
              <th className="py-4 px-6 border-b text-left text-lg">Units</th>
              <th className="py-4 px-6 border-b text-left text-lg">Hours Per Week</th>
              <th className="py-4 px-6 border-b text-left text-lg">Hours Per Semester</th>
              <th className="py-4 px-6 border-b text-left text-lg">Prerequisites</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id} className="hover:bg-gray-100">
                <td className="py-4 px-6 border-b text-lg">{course.courseCode}</td>
                <td className="py-4 px-6 border-b text-lg">{course.title}</td>
                <td className="py-4 px-6 border-b text-lg">{course.description}</td>
                <td className="py-4 px-6 border-b text-lg">{course.units}</td>
                <td className="py-4 px-6 border-b text-lg">{course.hoursPerWeek}</td>
                <td className="py-4 px-6 border-b text-lg">{course.hoursPerSemester}</td>
                <td className="py-4 px-6 border-b text-lg">{course.prerequisites}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

        {/* Tool 3: Course Details */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineBookOpen className="mr-2 text-yellow-500" /> Course Details
          </h3>
          <p className="mt-2 text-gray-600">
            Edit existing courses, update course materials, and manage schedules.
          </p>
          <button className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors">
            Edit Course
          </button>
        </div>

        {/* Tool 4: Course Assignments */}
        <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold flex items-center">
            <HiOutlineClipboardList className="mr-2 text-red-500" /> Course Assignments
          </h3>
          <p className="mt-2 text-gray-600">
            Create and manage assignments for each course, including deadlines and grading criteria.
          </p>
          <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
            Manage Assignments
          </button>
        </div>
      </div>

 {/* Add Course Modal */}
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Dim background */}
    <div className="fixed inset-0 bg-gray-800 opacity-50"></div>
    {/* Modal content */}
    <div className="bg-white rounded-lg shadow-lg p-5 z-10 w-11/12 md:w-1/2">
      <h3 className="text-xl font-semibold mb-4 text-center">Add New Course</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Fields with Titles */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="title">Course Title</label>
          <input
            type="text"
            name="title"
            id="title"
            value={courseData.title}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="description">Course Description</label>
          <textarea
            name="description"
            id="description"
            value={courseData.description}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="prerequisites">Prerequisites</label>
          <input
            type="text"
            name="prerequisites"
            id="prerequisites"
            value={courseData.prerequisites}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="courseCode">Course Code</label>
          <input
            type="text"
            name="courseCode"
            id="courseCode"
            value={courseData.courseCode}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="units">Units</label>
          <input
            type="number"
            name="units"
            id="units"
            value={courseData.units}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="hoursPerWeek">Hours per Week</label>
          <input
            type="number"
            name="hoursPerWeek"
            id="hoursPerWeek"
            value={courseData.hoursPerWeek}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1" htmlFor="hoursPerSemester">Hours per Semester</label>
          <input
            type="number"
            name="hoursPerSemester"
            id="hoursPerSemester"
            value={courseData.hoursPerSemester}
            onChange={handleChange}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end mt-4 space-x-2"> {/* Use space-x-2 for spacing */}
  <button
    type="submit"
    className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 ease-in-out"
  >
    Submit
  </button>
  <button
    type="button"
    onClick={() => setShowModal(false)}
    className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg transition-all duration-200 ease-in-out"
  >
    Cancel
  </button>
</div>


      </form>
    </div>
  </div>
)}
  

 {/* Conclusion Section */}
{showSuccessModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Dim background */}
    <div className="fixed inset-0 bg-gray-800 opacity-70"></div>
    {/* Modal content */}
    <div className="bg-white rounded-lg shadow-lg p-6 z-10 w-11/12 md:w-1/5">
      <div className="flex items-center justify-center mb-4">
        {/* Check Icon from React Icons */}
        <HiCheck className="h-16 w-16 text-green-600" /> {/* Increased size */}
      </div>
      <h3 className="text-2xl font-semibold text-center text-green-600 ">Success!</h3> {/* Increased text size */}
      <p className="text-center text-gray-600 text-lg mt-2">Course added successfully.</p> {/* Increased text size */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setShowSuccessModal(false)}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition-colors text-lg"  // Increased button text size
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}



      {/* Conclusion Section */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold">Optimize Your Course Management</h4>
        <p className="text-gray-600">
          Use these tools to enhance your course management experience and support student learning effectively.
        </p>
      </div>
    </div>
  );
  
};



const FacultyDashboard = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="md:w-72 bg-white border-r shadow-md md:h-screen md:flex md:flex-col">
        <div className="p-5">
          <h2 className="text-2xl font-bold text-center text-green-600">Faculty Dashboard</h2>
        </div>
        <nav className="mt-5 flex-grow">
          <ul className="space-y-2">
            <li>
              <Link
                to="/faculty-dashboard/student-evaluation" // Updated
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineClipboardList className="mr-2 text-xl" />
                Student Evaluation Tools
              </Link>
            </li>
            <li>
              <Link
                to="/faculty-dashboard/feedback" // Updated
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineUsers className="mr-2 text-xl" />
                Feedback Mechanism
              </Link>
            </li>
            <li>
              <Link
                to="/faculty-dashboard/progress-tracking" // Updated
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineChartBar className="mr-2 text-xl" />
                Progress Tracking
              </Link>
            </li>
            <li>
              <Link
                to="/faculty-dashboard/course-management" // Updated
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-500 hover:text-white transition-colors rounded-md"
              >
                <HiOutlineBookOpen className="mr-2 text-xl" />
                Course Management
              </Link>
              
            </li>
          </ul>
        </nav>
      </aside>
      

      {/* Main Content */}
      <main className="flex-1 p-5">
        <Routes>
          <Route path="/student-evaluation" element={<StudentEvaluationTools />} />
          <Route path="/feedback" element={<FeedbackMechanism />} />
          <Route path="/progress-tracking" element={<ProgressTracking />} />
          <Route path="/course-management" element={<CourseManagement />} />
          <Route path="/" element={<div>Welcome to the Faculty Dashboard! Select an option from the sidebar.</div>} />
        </Routes>
      </main>
    </div>
    
  );

  
};

export default FacultyDashboard;
