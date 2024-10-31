import React, { useState, useEffect } from 'react';
import { HiOutlineX ,HiOutlineExclamation , HiUpload, HiEye, HiCheckCircle  } from 'react-icons/hi';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc  } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Ensure your Firestore instance and auth are imported
import { toast } from 'react-toastify'; // Adjust this based on your toast library
import { ClipLoader } from 'react-spinners';


const UploadGrades = () => {
    const [showModal, setShowModal] = useState(false);
    const [showViewGradesModal, setShowViewGradesModal] = useState(false);
    const [showSubjectsModal, setShowSubjectsModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // State for success modal
    const [selectedSemester, setSelectedSemester] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null); // At the top of your component
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // State for loading indicator
    const [grades, setGrades] = useState([]); // State for storing uploaded grades
    const [fileUrl, setFileUrl] = useState(''); // State for storing the file URL
    const [showUploadMessageModal, setShowUploadMessageModal] = useState(false);


    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchUserLevel = async () => {
            if (!currentUser || !currentUser.uid) {
                console.error('Current user is not defined');
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const level = userData.yearLevel;
                    setYearLevel(level);
                    console.log('Year Level:', level);
                } else {
                    console.error('User document not found!');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserLevel();
    }, [currentUser]);

    const handleUploadGrade = async () => {
        // Ensure current user is defined
        if (!currentUser || !currentUser.uid) {
            console.error('Current user is not defined');
            return;
        }
    
        // Check if the user already has uploaded grades
        const gradesDocRef = doc(db, 'grades', currentUser.uid);
        const gradesDocSnapshot = await getDoc(gradesDocRef);
        
        // If the document exists, show the upload message modal
        if (gradesDocSnapshot.exists()) {
            setShowUploadMessageModal(true); // Show the modal if grades already exist
            return; // Exit the function to prevent further actions
        }
    
        // Show the modal for uploading grades
        setShowModal(true);
    };
    

    const handleViewGrades = async () => {
        await fetchGrades(); // Fetch grades before opening the modal
        setShowViewGradesModal(true);
    };

    const fetchGrades = async () => {
        if (!currentUser || !currentUser.uid) {
            console.error('Current user is not defined');
            return;
        }
    
        try {
            // Reference to the user's grades document
            const gradesDocRef = doc(db, 'grades', currentUser.uid);
            const gradesDoc = await getDoc(gradesDocRef);
    
            if (!gradesDoc.exists()) {
                console.warn(`Grades document does not exist for user ID: ${currentUser.uid}`);
                // Optionally create the document with default values
                await setDoc(gradesDocRef, {}); // Create an empty document
                console.log(`Empty grades document created for user ID: ${currentUser.uid}`);
                return; // Exit the function if no grades document exists
            }
    
            const yearLevelCollectionRef = collection(gradesDocRef, yearLevel); // Reference to the user's year level
            
            // Fetch data for the first and second semester
            const firstSemesterDocRef = doc(yearLevelCollectionRef, 'firstSemester');
            const secondSemesterDocRef = doc(yearLevelCollectionRef, 'secondSemester');
    
            const allGrades = [];
    
            // Handle first semester grades
            const firstSemesterDoc = await getDoc(firstSemesterDocRef);
            if (firstSemesterDoc.exists()) {
                const firstSemesterData = firstSemesterDoc.data();
                const firstSemesterGrades = firstSemesterData.grades || [];
                allGrades.push(...firstSemesterGrades.map((grade, index) => ({
                    id: `firstSemester-${index}`, // Unique ID for each grade
                    ...grade,
                })));
            } else {
                console.warn(`First semester grades document does not exist for user ID: ${currentUser.uid}`);
            }
    
            // Handle second semester grades
            const secondSemesterDoc = await getDoc(secondSemesterDocRef);
            if (secondSemesterDoc.exists()) {
                const secondSemesterData = secondSemesterDoc.data();
                const secondSemesterGrades = secondSemesterData.grades || [];
                allGrades.push(...secondSemesterGrades.map((grade, index) => ({
                    id: `secondSemester-${index}`, // Unique ID for each grade
                    ...grade,
                })));
            } else {
                console.warn(`Second semester grades document does not exist for user ID: ${currentUser.uid}`);
            }
    
            // Store all grades in state
            setGrades(allGrades); 
            setFileUrl(firstSemesterDoc.data().fileUrl || ''); // Set the file URL from the first semester document
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };
    
    
    const handleCloseModal = () => {
        setShowModal(false);
        setShowViewGradesModal(false);
        setShowSubjectsModal(false);
        setSubjects([]);
        setSelectedSemester('');
    };


    const handleSaveGrades = async () => {
        if (!currentUser || !currentUser.uid) {
            console.error('Current user is not defined');
            return;
        }
    
        // Check if a file has been selected before proceeding
        if (!selectedFile) {
            toast.error("Please upload a file for verification before saving grades.");
            return; // Exit the function if no file is selected
        }
    
        setIsLoading(true); // Start loading
    
        try {
            const storage = getStorage(); // Initialize Firebase Storage
    
            // Create a new document reference under the grades collection for the current user
            const gradesDocRef = doc(db, 'grades', currentUser.uid); // This is the document for the user's grades
    
            // Create a subcollection for the year level under the user's grades document
            const yearLevelCollectionRef = collection(gradesDocRef, yearLevel); // yearLevel is a string, e.g., "1st year"
    
            // For each semester, we should create a document rather than a subcollection
            const semesterDocRef = doc(yearLevelCollectionRef, selectedSemester === '1st' ? 'firstSemester' : 'secondSemester'); 
    
            // Set up the semester document to hold the grades
            await setDoc(semesterDocRef, { fileUrl: '' }); // Initialize with an empty fileUrl
    
            // Upload the file to Firebase Storage
            const storageRef = ref(storage, `uploads/${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const fileUrl = await getDownloadURL(storageRef); // Get the file URL
    
            // Loop through subjects and save each grade in the semester document
            const gradesData = []; // Array to hold all grades for the semester
    
            for (const subject of subjects) {
                const { courseTitle, courseCode, preRequisite, grade, status } = subject;
    
                // Create an entry for each subject
                gradesData.push({
                    courseTitle,
                    courseCode,
                    preRequisite,
                    grade,
                    status,
                });
            }
    
            // Update the semester document with the grades data and file URL
            await setDoc(semesterDocRef, {
                grades: gradesData,
                fileUrl, // Set the file URL
            }, { merge: true }); // Use merge to update without overwriting
    
            // Show success modal on successful save
            setShowSuccessModal(true);
            setShowSubjectsModal(false);
            setShowModal(false);
            setSubjects([]); // Clear the subjects state
            setSelectedFile(null); // Clear selected file after saving
        } catch (error) {
            console.error('Error saving grades:', error);
            toast.error("An error occurred while saving grades.");
        } finally {
            setIsLoading(false); // Stop loading
        }
    };
    
    
    const fetchSubjects = async (semester) => {
        if (!yearLevel) {
            console.error('Year Level is not defined');
            return;
        }
    
        const trimmedLevel = yearLevel.trim();
        const formattedLevel = trimmedLevel.replace(/\s+/g, '').replace(/year/i, '') + 'Year';
    
        const semCollection = semester === '1st' ? 'firstSemester' : 'secondSemester';
    
        if (formattedLevel) {
            const path = `subjects/${formattedLevel}/${semCollection}`; // Adjusted path to include semester
    
            try {
                const subjectsRef = collection(db, path);
                const querySnapshot = await getDocs(subjectsRef);
    
                if (querySnapshot.empty) {
                    console.warn('No subjects found for the selected semester.');
                } else {
                    const subjectsList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setSubjects(subjectsList);
                    setShowSubjectsModal(true);
                }
            } catch (error) {
                console.error('Error fetching subjects:', error);
            }
        } else {
            console.error('Invalid year level for fetching subjects');
        }
    };
    
    const handleSemesterSelection = (semester) => {
        fetchSubjects(semester);
        setSelectedSemester(semester);
    };
    
    const handleGradeChange = (index, value) => {
        // Validate input (not necessary for dropdown values here, but kept for structure)
        const gradeValue = parseFloat(value); // Convert to float for comparison
        if (isNaN(gradeValue) || gradeValue < 1 || gradeValue > 5) {
            alert('Please enter a grade between 1 and 5.');
            return; // Exit if invalid
        }
    
        const updatedSubjects = [...subjects];
        updatedSubjects[index] = {
            ...updatedSubjects[index],
            grade: value, // Store the grade as a string for dropdown
            status: gradeValue <= 3 ? 'PASSED' : 'FAILED', // Determine status based on the numeric value
        };
        setSubjects(updatedSubjects);
    };
    

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Manage Grades</h2>
            <p className="mb-4 text-gray-700">
                Easily upload and view your grades using the options below.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center text-green-700">
                        <HiUpload className="mr-2 text-green-600" /> Upload My Grade
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Upload your grades to keep track of your academic progress.
                    </p>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        onClick={handleUploadGrade}
                    >
                        Upload My Grade
                    </button>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center text-blue-700">
                        <HiEye className="mr-2 text-blue-600" /> View My Grade
                    </h3>
                    <p className="mt-2 text-gray-600">
                        View the grades you've uploaded to monitor your academic performance.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleViewGrades}
                    >
                        View My Grade
                    </button>
                </div>
            </div>




{/* Upload Grades Modal */}
{showModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full overflow-hidden">
            <h3 className="text-xl font-bold text-center mb-4">Select Semester</h3>
            <div className="relative mb-4">
                <select
                    className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => handleSemesterSelection(e.target.value)}
                >
                    <option value="" disabled selected>Select a semester</option>
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 10l5 5 5-5H7z" />
                    </svg>
                </div>
            </div>
            <button
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full"
                onClick={handleCloseModal}
            >
                Close
            </button>
        </div>
    </div>
)}

{showSubjectsModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300">
        <div className="bg-gradient-to-b from-white to-gray-100 p-6 rounded-lg shadow-lg w-full max-w-3xl overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-gray-800">{`Subjects for ${selectedSemester} Semester`}</h3>
                <button
                    onClick={handleCloseModal}
                    className="text-gray-600 hover:text-red-600 transition duration-200"
                    aria-label="Close Modal"
                >
                    &times; {/* Close icon */}
                </button>
            </div>
            <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Course Code</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Course Title</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Prerequisites</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Grade</th>
                        <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((subject, index) => (
                        <tr key={subject.id} className="hover:bg-gray-100 transition-colors even:bg-gray-50 cursor-pointer">
                            <td className="border border-gray-300 px-4 py-2 font-bold">{subject.courseCode}</td>
                            <td className="border border-gray-300 px-4 py-2">{subject.courseTitle}</td>
                            <td className="border border-gray-300 px-4 py-2">{subject.preRequisite || ''}</td>
                            <td className="border border-gray-300 px-4 py-2">
    <select
        value={subject.grade || ''}
        onChange={(e) => handleGradeChange(index, e.target.value)}
        className="border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150"
        aria-label={`Grade for ${subject.courseCode}`}
    >
        <option value="" disabled>Select Grade</option>
        <option value="1">1.00</option>
        <option value="1.25">1.25</option>
        <option value="1.50">1.50</option>
        <option value="1.75">1.75</option>
        <option value="2">2.00</option>
        <option value="2.25">2.25</option>
        <option value="2.50">2.50</option>
        <option value="2.75">2.75</option>
        <option value="3">3.00</option>
        <option value="3.25">3.25</option>
        <option value="3.50">3.50</option>
        <option value="3.75">3.75</option>
        <option value="4">4.00</option>
        <option value="5">5.00</option>
    </select>
</td>

                            <td className="border border-gray-300 px-4 py-2">
                                <span className={`${subject.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                                    {subject.status || ''}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4">
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="border border-gray-300 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150"
                    aria-label="Upload File"
                />
                <span className="text-red-600 ml-2">
                    Please upload a PDF of your grades for verification.
                </span>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors"
                    onClick={handleCloseModal}
                >
                    Cancel
                </button>
                <button
                    className={`bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-500 transition-colors shadow-lg ${!selectedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleSaveGrades}
                    disabled={!selectedFile} // Disable button if no file is selected
                >
                    Save Grades
                </button>
            </div>
        </div>
    </div>
)}

   {/* Success Modal */}
{showSuccessModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 transition-opacity duration-300">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-full overflow-hidden text-center"> {/* Increased width to w-96 */}
            <div className="flex justify-center mb-4">
                <HiCheckCircle className="text-green-500 text-7xl" /> {/* Slightly reduced icon size */}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Success!</h3> {/* Reduced heading size */}
            <p className="text-lg text-gray-700 mb-3">Your grades have been saved successfully.</p> {/* Kept paragraph size larger for readability */}
            <button
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                onClick={() => setShowSuccessModal(false)}
            >
                Close
            </button> {/* Kept button padding reasonable */}
        </div>
    </div>
)}

{/* Loading Modal */}
{isLoading && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
        <div className="bg-white w-96 p-10 rounded-lg shadow-lg flex flex-col items-center text-center">
            <ClipLoader color="#22c55e" size={60} />
            <span className="text-2xl font-bold text-gray-800 mt-4">Saving Grades</span>
            <p className="text-gray-600 mt-2">Please wait a moment...</p>
            <div className="mt-6 flex items-center justify-center w-full">
                <div className="h-1 bg-green-500 rounded-full w-3/4 animate-pulse"></div>
            </div>
        </div>
    </div>
)}


{showViewGradesModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 transition-opacity duration-300">
        <div className="bg-white w-full max-w-4xl h-4/4 p-4 rounded-lg shadow-lg flex flex-col overflow-y-auto"> {/* Increased width to max-w-4xl and reduced padding */}
            <h3 className="text-2xl font-bold mb-4 text-gray-800 text-center">Uploaded Grades</h3> {/* Reduced heading size */}
            
            <table className="min-w-full border-collapse border border-gray-300 mb-4">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 text-sm">Course Code</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 text-sm">Course Title</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 text-sm">Prerequisites</th> {/* New column for prerequisites */}
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 text-sm">Grade</th>
                        <th className="border border-gray-300 px-3 py-2 text-left text-gray-700 text-sm">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.length > 0 ? (
                        grades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-gray-100 transition-colors duration-200">
                                <td className="border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-800">{grade.courseCode}</td>
                                <td className="border border-gray-300 px-3 py-1 text-sm text-gray-800">{grade.courseTitle}</td>
                                <td className="border border-gray-300 px-3 py-1 text-sm text-gray-800">{grade.preRequisite}</td> {/* New cell for prerequisites */}
                                <td className="border border-gray-300 px-3 py-1 text-sm text-gray-800">{grade.grade}</td>
                                <td className={`border border-gray-300 px-3 py-1 text-sm ${grade.status === 'PASSED' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
                                    {grade.status}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="border border-gray-300 px-4 py-2 text-center text-gray-500">No grades found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {fileUrl && (
                <div className="mt-4 text-center">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800 transition duration-200 text-sm" 
                    >
                        Click here to view your uploaded ROG file
                    </a>
                </div>
            )}

<div className="mt-6 flex justify-end">
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm" 
                    onClick={handleCloseModal}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{showUploadMessageModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
        <div className="bg-white w-3/4 max-w-md p-6 rounded-lg shadow-lg flex flex-col items-center">
            {/* Exclamation icon at the top center */}
            <div className="flex justify-center mb-4">
                <HiOutlineExclamation size={50} className="text-red-600" /> {/* Increased icon size and changed to red */}
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Upload Failed</h3>
            <p className="text-gray-700 mb-4 text-center">
                You have already uploaded your grades. Please check your uploaded grades in the "View My Grades" section.
            </p>
            <div className="flex justify-center w-full">
                <button
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    onClick={() => setShowUploadMessageModal(false)}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

        </div>
    );
};

export default UploadGrades;
