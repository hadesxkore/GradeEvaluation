import React, { useEffect, useState } from "react";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
  } from "firebase/firestore";import { db } from "../firebase"; // Correct path and named import
import { HiOutlineSave, HiOutlineChartBar, HiOutlineEye, HiPlus, HiOutlineDownload, HiOutlinePlus, HiPencil, HiTrash  } from 'react-icons/hi';
import {  HiExclamationCircle } from "react-icons/hi";

const UploadStudentMasterlist = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [filter, setFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [irregularCount, setIrregularCount] = useState(0); // State for irregular student count
  const [dropdownOpen, setDropdownOpen] = useState(false); // State to track dropdown visibility
  const [selectedCategory, setSelectedCategory] = useState(""); // Track the selected category for dynamic count
  const [isModalOpen, setIsModalOpen] = useState(false);

   // Fetch students from Firestore
   useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "users");
        const q = query(studentsRef, where("role", "==", "Student"));
        const querySnapshot = await getDocs(q);

        const fetchedStudents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const updatedStudents = await Promise.all(
          fetchedStudents.map(async (student) => {
            let yearsRemaining = 0;

            if (student.irregularityReason === "Shifter") {
              yearsRemaining = 6;
            } else if (student.irregularityReason === "Failed Subjects") {
              yearsRemaining = 5;
            }

            if (student.yearsRemaining !== yearsRemaining) {
              const studentDocRef = doc(db, "users", student.id);
              await updateDoc(studentDocRef, { yearsRemaining });
            }

            return { ...student, yearsRemaining };
          })
        );

        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students:", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest(".dropdown")) return;
      setIsDropdownOpen(false);
    };
  
    document.addEventListener("click", handleClickOutside);
  
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  // Toggle student table visibility
  const handleShowTable = () => {
    setShowTable(!showTable);
  };


  // Handle sorting by irregularity reason
  const handleSort = (reason) => {
    setFilter(reason); // Update the selected filter
    setSelectedCategory(reason); // Set the category for dynamic count
    if (reason === "all") {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) => student.irregularityReason === reason
      );
      setFilteredStudents(filtered);
    }
    setDropdownOpen(false); // Close the dropdown after selecting an option
  };
     // Update the irregular student count based on filter
  useEffect(() => {
    if (filter === "all") {
      setIrregularCount(students.filter(student => student.irregularityReason).length);
    } else {
      setIrregularCount(filteredStudents.filter(student => student.irregularityReason).length);
    }
  }, [filter, students, filteredStudents]);

  // Handle search functionality
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value); // Update the search term
    const filtered = students.filter(
      (student) =>
        student.studentId?.toLowerCase().includes(value) ||
        student.firstName?.toLowerCase().includes(value) ||
        student.lastName?.toLowerCase().includes(value)
    );
    setFilteredStudents(filtered);
  };
    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
      };
    


  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  return (
    <div className="p-5">
{/* Main Card for Section Management */}
<div className="bg-white rounded-lg shadow-lg p-5 mb-4">
  <h2 className="text-2xl font-semibold mb-3">Section Management</h2>
  <p className="mb-4 text-gray-700">
    Manage sections efficiently. Create new sections and view existing students.
  </p>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
    {/* View Students */}
    <div className="bg-gradient-to-r from-blue-50 to-sky-100 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiOutlineEye className="mr-2 text-sky-500" /> View Students
      </h3>
      <p className="mt-2 text-gray-600">View the complete list of students enrolled in the college.</p>
      <button
      onClick={handleShowTable}
      className="mt-4 bg-gradient-to-r from-sky-400 to-sky-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-sky-500 hover:to-sky-700 transition duration-200"
    >
      {showTable ? "Hide Student Table" : "Show Student Table"}
    </button>
    </div>

    {/* Create Section */}
    <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-xl font-semibold flex items-center">
          <HiPlus className="mr-2 text-teal-500" /> Export Data
        </h3>
        <p className="mt-2 text-gray-600">Export the data inside the table</p>

        <button
          onClick={toggleModal}
          className="mt-4 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-amber-500 hover:to-amber-700 transition duration-200"
        >
          Export
        </button>
      </div>
    </div>
    </div>


 {/* Redesigned Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white w-96 rounded-xl shadow-lg p-8 relative">
      <div className="text-center">
        <HiExclamationCircle className="text-amber-400 text-7xl mx-auto mb-4" />
        <h3 className="text-2xl font-semibold text-gray-900">
          Feature Coming Soon
        </h3>
        <p className="mt-3 text-gray-500">
          We're working on this feature. Stay tuned for updates!
        </p>
      </div>
      <button
        onClick={toggleModal}
        className="mt-6 w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-amber-400 transition"
      >
        Close
      </button>
    </div>
  </div>
)}

{showTable && (
  <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-10xl">
   <h2 className="text-2xl font-semibold mb-4 text-gray-700 flex items-center justify-between">
            Student Information
            <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm shadow-md">
              <span>{selectedCategory ? `Irregular Students for ${selectedCategory}: ${irregularCount}` : `Irregular Students: ${irregularCount}`}</span>
            </div>
          </h2>

    {/* Search Input and Sorting Dropdown */}
    <div className="flex justify-between mb-4">
      {/* Search Input */}
      <div className="w-1/2">
        <input
          type="text"
          placeholder="Search by Student ID, First Name, or Last Name"
          value={searchTerm} // Keeps the search term in state
          onChange={handleSearch} // Updates the search term
          className="w-full border border-gray-300 rounded px-4 py-2"
        />
      </div>

     {/* Dropdown for Sorting */}
<div className="relative">
  <button
    onClick={toggleDropdown}
    className="flex items-center justify-between bg-blue-600 text-white px-5 py-3 rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <span className="font-semibold">Sort By</span>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="w-5 h-5 ml-2 transform transition-transform duration-200 ease-in-out"
      style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {dropdownOpen && (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-xl z-10">
      <button
        onClick={() => handleSort("Shifter")}
        className="block w-full px-4 py-3 text-gray-800 hover:bg-blue-100 focus:outline-none focus:bg-blue-200 transition-colors duration-200"
      >
        Shifter
      </button>
      <button
        onClick={() => handleSort("Failed Subjects")}
        className="block w-full px-4 py-3 text-gray-800 hover:bg-blue-100 focus:outline-none focus:bg-blue-200 transition-colors duration-200"
      >
        Failed Subjects
      </button>
      <button
        onClick={() => handleSort("all")}
        className="block w-full px-4 py-3 text-gray-800 hover:bg-blue-100 focus:outline-none focus:bg-blue-200 transition-colors duration-200"
      >
        Show All
      </button>
    </div>
  )}
</div>

    </div>

    {loading ? (
      <p className="text-center text-gray-500">Loading students...</p>
    ) : filteredStudents.length === 0 ? (
      <p className="text-center text-gray-500">No students found.</p>
    ) : (
<div className={filteredStudents.length >= 5 ? "max-h-96 overflow-y-auto" : ""}>
{/* Student Table */}
<table className="w-full border-collapse border border-gray-300 rounded-md text-sm">
  <thead>
    <tr className="bg-gray-200 text-left text-gray-900">
      <th className="border border-gray-300 px-5 py-3 text-sm">Student ID</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Full Name</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Program</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Email</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Contact</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Address</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Year Level</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Irregular Reason</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Years Remaining</th>
      <th className="border border-gray-300 px-5 py-3 text-sm">Profile</th>
    </tr>
  </thead>
  <tbody className="overflow-y-auto max-h-60">
    {filteredStudents.length > 5 ? (
      <div className="overflow-y-scroll max-h-60">
        {filteredStudents.map((student, index) => (
          <tr
            key={student.id}
            className={`${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            } hover:bg-gray-100 text-gray-900`}
          >
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.studentId}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {`${student.firstName} ${student.middleName || ""} ${student.lastName}`}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.program}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.email}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.contactNumber}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.address}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.yearLevel}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.irregularityReason}
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              {student.yearsRemaining} year(s)
            </td>
            <td className="border border-gray-300 px-5 py-3 text-sm">
              <img
                src={student.profilePicture || "/placeholder-profile.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-gray-300"
              />
            </td>
          </tr>
        ))}
      </div>
    ) : (
      filteredStudents.map((student, index) => (
        <tr
          key={student.id}
          className={`${
            index % 2 === 0 ? "bg-white" : "bg-gray-50"
          } hover:bg-gray-100 text-gray-900`}
        >
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.studentId}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {`${student.firstName} ${student.middleName || ""} ${student.lastName}`}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.program}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.email}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.contactNumber}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.address}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.yearLevel}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.irregularityReason}
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            {student.yearsRemaining} year(s)
          </td>
          <td className="border border-gray-300 px-5 py-3 text-sm">
            <img
              src={student.profilePicture || "/placeholder-profile.png"}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-gray-300"
            />
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>


      </div>
    )}
  </div>
)}




    </div>
  );
};

export default UploadStudentMasterlist;
