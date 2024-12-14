import React, { useState } from "react";
import Modal from "react-modal";
import { HiOutlineEye, HiPlus } from "react-icons/hi";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { HiCheckCircle, HiOutlineAcademicCap } from "react-icons/hi";
import { jsPDF } from "jspdf";
import bpsuLogo from '../images/bpsu.png'; // Import the logo
import html2canvas from "html2canvas";
// Set the root element for Modal
Modal.setAppElement("#root");

const AdminAddDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [yearLevel, setYearLevel] = useState("");
  const [semester, setSemester] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [units, setUnits] = useState({ lec: "", lab: "", total: "" });
  const [hoursPerWeek, setHoursPerWeek] = useState({ lec: "", lab: "", total: "" });
  const [hoursPerSemester, setHoursPerSemester] = useState({ lec: "", lab: "", total: "" });
  const [preRequisite, setPreRequisite] = useState("");
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState('portrait');
  const [showOptions, setShowOptions] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const [coRequisite, setCoRequisite] = useState("");
  // Change subjects state to a nested object
  const [subjects, setSubjects] = useState({
    "1st": { "1st": [], "2nd": [] },
    "2nd": { "1st": [], "2nd": [] },
    "3rd": { "1st": [], "2nd": [] },
    "4th": { "1st": [], "2nd": [] },
  }); 

  const [showSubjects, setShowSubjects] = useState({}); // State to control display of subjects

  const handleAddSubject = async () => {
    if (!courseCode || !courseTitle || !yearLevel || !semester) {
      alert("Please fill in all required fields before adding a subject.");
      return;
    }

    try {
      // Adjusting to add the subject as a document in a nested collection structure
      const subjectsRef = collection(db, "subjects", `${yearLevel}Year`, semester === "1st" ? "firstSemester" : "secondSemester");
      await addDoc(subjectsRef, {
        courseCode,
        courseTitle,
        units: {
          lec: Number(units.lec),
          lab: Number(units.lab),
          total: Number(units.total),
        },
        hoursPerWeek: {
          lec: Number(hoursPerWeek.lec),
          lab: Number(hoursPerWeek.lab),
          total: Number(hoursPerWeek.total),
        },
        hoursPerSemester: {
          lec: Number(hoursPerSemester.lec),
          lab: Number(hoursPerSemester.lab),
          total: Number(hoursPerSemester.total),
        },
        preRequisite,
        coRequisite,
      });
      setIsSuccessModalOpen(true);

    
      setCourseCode("");
      setCourseTitle("");
      setUnits({ lec: "", lab: "", total: "" });
      setHoursPerWeek({ lec: "", lab: "", total: "" });
      setHoursPerSemester({ lec: "", lab: "", total: "" });
      setPreRequisite("");
      setCoRequisite("");
      setSemester(""); // Reset semester
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding subject: ", error);
      alert("Failed to add subject. Please try again.");
    }
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  const openModal = (level) => {
    setYearLevel(level);
    setIsModalOpen(true);
  };

  const fetchSubjects = async (level, sem) => {
    const subjectsRef = collection(db, "subjects", `${level}Year`, sem === "1st" ? "firstSemester" : "secondSemester");
    const snapshot = await getDocs(subjectsRef);
    const subjectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Update the specific year and semester subjects
    setSubjects(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [sem]: subjectsData,
      },
    }));
  };
  const handleShowSubjects = (level, sem) => {
    const key = `${level}-${sem}`;
    
    // Update showSubjects state
    setShowSubjects(prev => {
      const newShowSubjects = {};
  
      // Toggle the selected table visibility
      newShowSubjects[key] = !prev[key];
  
      // Ensure other tables are hidden
      Object.keys(prev).forEach(existingKey => {
        if (existingKey !== key) {
          newShowSubjects[existingKey] = false;
        }
      });
  
      return newShowSubjects;
    });
  
    // Fetch subjects only if not already fetched
    if (!showSubjects[key]) {
      fetchSubjects(level, sem);
    }
  };
  

// Function to print the subjects table
const handlePrint = async () => {
    const input = document.getElementById("subjectsTable");
    const canvas = await html2canvas(input, {
        scale: 2 // Increase scale for better resolution
    });
    const imgData = canvas.toDataURL("image/png");

    // Determine PDF dimensions based on selected paper size and orientation
    const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: paperSize === 'A4' ? 'a4' : paperSize === 'A3' ? 'a3' : 'letter',
    });

    // Add the logo
    const logoWidth = 30; // Set the width for the logo
    const logoHeight = 20; // Set the height for the logo
    const logoX = 10; // Fixed position for the logo on the left
    const logoY = 10; // Position from the top
    pdf.addImage(bpsuLogo, 'PNG', logoX, logoY, logoWidth, logoHeight); // Add the logo to the PDF

    // Add text to the left of the logo
    pdf.setFontSize(8);
    const textX = logoX + logoWidth + 10; // Position text to the right of the logo
    const textYStart = logoY + 5; // Starting Y position for the text

    // Add the first set of text
    pdf.text("BATAAN PENINSULA STATE UNIVERSITY", textX, textYStart, { align: "left" });
    pdf.text("City of Balanga 2100 Bataan", textX, textYStart + 5, { align: "left" });
    pdf.text("PHILIPPINES", textX, textYStart + 10, { align: "left" });

    // Set the position for the program details at the right corner, facing the text on the left
    const pageWidth = pdf.internal.pageSize.getWidth();
    const textRightX = pageWidth - 10; // Position 10mm from the right edge

    // Align the program details vertically with the left text
    const textYRightStart = textYStart; // Aligns with the first line of text

    // Add the program details to the right corner, aligned with the left text
    pdf.text("Program: Bachelor of Science in Industrial Engineering", textRightX, textYRightStart, { align: "right" });
    pdf.text("Major: None", textRightX, textYRightStart + 5, { align: "right" });
    pdf.text("Curriculum Year: AY 2022-2023", textRightX, textYRightStart + 10, { align: "right" });

    // Calculate width and height based on the paper size
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();

    // Calculate the aspect ratio of the image
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const aspectRatio = imgWidth / imgHeight;

    // Determine dimensions for adding the image to the PDF
    let newWidth, newHeight;
    if (orientation === 'landscape') {
        newWidth = width;
        newHeight = width / aspectRatio; // Maintain aspect ratio
    } else {
        // For portrait orientation, adjust dimensions to fit better
        newHeight = height;
        newWidth = height * aspectRatio; // Maintain aspect ratio

        // Adjust width to fit within the page width
        if (newWidth > width) {
            newWidth = width;
            newHeight = width / aspectRatio; // Recalculate height to maintain aspect ratio
        }
    }

    // Add the subjects table image to the PDF and set the dimensions
    // Adjust the Y position to be closer to the header, e.g., set to 50 or 60
    const tableYPosition = 40; // Set this to your desired Y position
    pdf.addImage(imgData, "PNG", 0, tableYPosition, newWidth, newHeight); // Start after text

    // Save the PDF
    pdf.save("subjects.pdf");
};

  // Function to open the print options modal
  const openPrintOptionsModal = () => {
    setShowOptionsModal(true);
  };

  // Function to close the print options modal
  const closePrintOptionsModal = () => {
    setShowOptionsModal(false);
  };

  // Function to handle print action from the options modal
  const handlePrintFromModal = () => {
    handlePrint(); // Trigger the printing process
    closePrintOptionsModal(); // Close the modal
  };
  
  return (
    <div className="p-5">
    {/* Subject Management Card */}
<div className="bg-gray-800 text-white rounded-lg shadow-md p-5 mb-4">
  <h2 className="text-2xl font-semibold mb-3">Curriculum Management</h2>
  <p className="mb-4 text-gray-300">
    Manage curriculum efficiently. Add new curriculum and view existing curriculum for each year level.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {["1st", "2nd", "3rd", "4th"].map((level) => (
      <div
        key={level}
        className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm hover:shadow-lg transition-shadow"
      >
        <h3 className="text-xl font-semibold flex items-center">
          <HiPlus className="mr-2 text-green-400" /> Add {level} Year Subject
        </h3>
        <p className="mt-2 text-gray-200">Add a new subject for {level} year.</p>
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors w-full"
          onClick={() => openModal(level)}
        >
          Add Subject
        </button>

        <div className="mt-4 p-4 bg-gray-600 rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-gray-100 flex items-center mb-3 justify-center">
            <HiOutlineEye className="mr-2 text-blue-400" />
            Show Subjects
          </h3>
          <div className="flex justify-center space-x-4">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-200 transform hover:scale-105"
              onClick={() => handleShowSubjects(level, "1st")}
            >
              1st Sem
            </button>
            <button
              className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition duration-200 transform hover:scale-105"
              onClick={() => handleShowSubjects(level, "2nd")}
            >
              2nd Sem
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>


     {/* New Card for Display Subjects */}
     <div className="bg-white rounded-lg shadow-md p-5 mb-4">
     <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-semibold">Display Curriculum</h2>
        <button
          onClick={openPrintOptionsModal} // Open the print options modal
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition-colors duration-300 ml-auto"
        >
          Print
        </button>
      </div>
{/* Print Options Modal */}
<div
  className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${
    showOptionsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
>
  <div className="bg-white rounded-lg shadow-lg p-6 w-96">
    <h2 className="text-xl font-semibold mb-4">Print Options</h2>
    <div className="mb-4">
      <label className="block mb-1">Paper Size:</label>
      <select
        value={paperSize}
        onChange={(e) => setPaperSize(e.target.value)}
        className="border border-gray-300 rounded p-2 w-full"
      >
        <option value="A4">A4</option>
        <option value="A3">A3</option>
        <option value="Letter">Letter</option>
      </select>
    </div>
    <div className="mb-4">
      <label className="block mb-1">Orientation:</label>
      <select
        value={orientation}
        onChange={(e) => setOrientation(e.target.value)}
        className="border border-gray-300 rounded p-2 w-full"
      >
        <option value="portrait">Portrait</option>
        <option value="landscape">Landscape</option>
      </select>
    </div>
    <div className="flex justify-end">
      <button
        onClick={handlePrintFromModal}
        className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition-colors duration-300"
      >
        Print
      </button>
      <button
        onClick={closePrintOptionsModal}
        className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition-colors duration-300 ml-2"
      >
        Cancel
      </button>
    </div>
  </div>
</div>





{["1st", "2nd", "3rd", "4th"].map((level) => (
  <div key={level}>
    {showSubjects[`${level}-1st`] && (
      <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
        <h4 className="font-semibold">Subjects for {level} Year - 1st Semester</h4>
        <div id="subjectsTable" className="min-h-80"> {/* Set an ID and min height */}
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}> {/* Scrollable if more than 5 rows */}
            <table className="w-full mt-2">
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
                {subjects[level]["1st"].map((subject) => (
                  <tr key={subject.id}>
                    <td className="border px-4 py-2">{subject.courseCode}</td>
                    <td className="border px-4 py-2">{subject.courseTitle}</td>
                    <td className="border px-4 py-2">{subject.units.lec}</td>
                    <td className="border px-4 py-2">{subject.units.lab}</td>
                    <td className="border px-4 py-2">{subject.units.total}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.lec}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.lab}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.total}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.lec}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.lab}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.total}</td>
                    <td className="border px-4 py-2">{subject.preRequisite}</td>
                    <td className="border px-4 py-2">{subject.coRequisite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {showSubjects[`${level}-2nd`] && (
      <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
        <h4 className="font-semibold">Subjects for {level} Year - 2nd Semester</h4>
        <div id="subjectsTable" className="min-h-80">
          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
            <table className="w-full mt-2">
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
                {subjects[level]["2nd"].map((subject) => (
                  <tr key={subject.id}>
                    <td className="border px-4 py-2">{subject.courseCode}</td>
                    <td className="border px-4 py-2">{subject.courseTitle}</td>
                    <td className="border px-4 py-2">{subject.units.lec}</td>
                    <td className="border px-4 py-2">{subject.units.lab}</td>
                    <td className="border px-4 py-2">{subject.units.total}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.lec}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.lab}</td>
                    <td className="border px-4 py-2">{subject.hoursPerWeek.total}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.lec}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.lab}</td>
                    <td className="border px-4 py-2">{subject.hoursPerSemester.total}</td>
                    <td className="border px-4 py-2">{subject.preRequisite}</td>
                    <td className="border px-4 py-2">{subject.coRequisite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>
))}

    </div>


    {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-lg">
      <h2 className="text-xl font-semibold text-center text-white mb-4">Add Subject for {yearLevel} Year</h2>
      {semester ? (
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Selected Semester: {semester}</h3>
          <div className="space-y-4">

            {/* Course Code and Title Inputs */}
            <input
              type="text"
              placeholder="Course Code"
              className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
            />
            <input
              type="text"
              placeholder="Course Title"
              className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
            />

            {/* Units Section */}
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Units LEC"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={units.lec}
                onChange={(e) => setUnits({ ...units, lec: e.target.value })}
              />
              <input
                type="number"
                placeholder="Units LAB"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={units.lab}
                onChange={(e) => setUnits({ ...units, lab: e.target.value })}
              />
              <input
                type="number"
                placeholder="Units Total"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={units.total}
                onChange={(e) => setUnits({ ...units, total: e.target.value })}
              />
            </div>

            {/* Hours per Week Section */}
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Hours/Week LEC"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerWeek.lec}
                onChange={(e) => setHoursPerWeek({ ...hoursPerWeek, lec: e.target.value })}
              />
              <input
                type="number"
                placeholder="Hours/Week LAB"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerWeek.lab}
                onChange={(e) => setHoursPerWeek({ ...hoursPerWeek, lab: e.target.value })}
              />
              <input
                type="number"
                placeholder="Hours/Week Total"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerWeek.total}
                onChange={(e) => setHoursPerWeek({ ...hoursPerWeek, total: e.target.value })}
              />
            </div>

            {/* Hours per Semester Section */}
            <div className="grid grid-cols-3 gap-4">
              <input
                type="number"
                placeholder="Hours/Semester LEC"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerSemester.lec}
                onChange={(e) => setHoursPerSemester({ ...hoursPerSemester, lec: e.target.value })}
              />
              <input
                type="number"
                placeholder="Hours/Semester LAB"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerSemester.lab}
                onChange={(e) => setHoursPerSemester({ ...hoursPerSemester, lab: e.target.value })}
              />
              <input
                type="number"
                placeholder="Hours/Semester Total"
                className="p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hoursPerSemester.total}
                onChange={(e) => setHoursPerSemester({ ...hoursPerSemester, total: e.target.value })}
              />
            </div>

            {/* Pre-Requisite and Co-Requisite Inputs */}
            <input
              type="text"
              placeholder="Pre-Requisite"
              className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={preRequisite}
              onChange={(e) => setPreRequisite(e.target.value)}
            />
            <input
              type="text"
              placeholder="Co-Requisite"
              className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={coRequisite}
              onChange={(e) => setCoRequisite(e.target.value)}
            />

            {/* Action Buttons */}
            <button
              onClick={handleAddSubject}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Subject
            </button>
            <button
              onClick={() => { setSemester(""); }}
              className="mt-2 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-center text-white mb-4">Select Semester</h3>

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => { setSemester("1st"); }}
              className="flex items-center justify-center bg-green-600 text-white px-6 py-4 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            >
              <HiOutlineAcademicCap className="mr-2 text-2xl" /> {/* Icon for 1st Semester */}
              <span className="font-semibold">1st Semester</span>
            </button>

            <button
              onClick={() => { setSemester("2nd"); }}
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              <HiOutlineAcademicCap className="mr-2 text-2xl" /> {/* Icon for 2nd Semester */}
              <span className="font-semibold">2nd Semester</span>
            </button>

            <button
              onClick={() => setIsModalOpen(false)}
              className="flex items-center justify-center w-full bg-red-600 text-white px-6 py-4 rounded-lg shadow-md hover:bg-red-700 transition-colors"
            >
              <span className="font-semibold">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}


      {/* Success Modal */}
      <Modal
  isOpen={isSuccessModalOpen}
  onRequestClose={closeSuccessModal}
  className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto" // Adjusted max-width to md for a smaller size
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
>
  <div className="flex flex-col items-center">
    <HiCheckCircle className="text-green-500 text-6xl mb-4" />
    <h2 className="text-2xl font-semibold mb-2">Success!</h2>
    <p className="text-gray-700">Subject has been added successfully.</p>
    <button
      className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      onClick={closeSuccessModal}
    >
      Close
    </button>
  </div>
</Modal>


    </div>
  );
};

export default AdminAddDashboard;
