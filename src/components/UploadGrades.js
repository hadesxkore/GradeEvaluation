import React, { useState, useEffect } from 'react';
import { HiOutlineX ,HiOutlineExclamation , HiUpload, HiEye, HiCheckCircle, HiExclamation   } from 'react-icons/hi';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc  } from 'firebase/firestore';
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
    const [showEnrollCoursesModal, setShowEnrollCoursesModal] = useState(false);
const [coursesToEnroll, setCoursesToEnroll] = useState([]); // State for eligible courses
    const [fileUrl, setFileUrl] = useState(''); // State for storing the file URL
    const [showUploadMessageModal, setShowUploadMessageModal] = useState(false);
    const [excludedCourses, setExcludedCourses] = useState([]); // Declare state for excluded courses
    const [showExcludedCoursesModal, setShowExcludedCoursesModal] = useState(false); // State for excluded courses modal
    const [selectedCourseGrade, setSelectedCourseGrade] = useState(null);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [isDataUpdated, setIsDataUpdated] = useState(false); // Track if data was updated
    const [modalMessage, setModalMessage] = useState('');
    const [showModalMessage, setShowModalMessage] = useState(false);

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
        
        // Fetch second semester first since it's considered the latest
        const secondSemesterDocRef = doc(yearLevelCollectionRef, 'secondSemester');
        const secondSemesterDoc = await getDoc(secondSemesterDocRef);

        if (secondSemesterDoc.exists()) {
            const secondSemesterData = secondSemesterDoc.data();
            const secondSemesterGrades = secondSemesterData.grades || [];
            setGrades(
                secondSemesterGrades.map((grade, index) => ({
                    id: `secondSemester-${index}`, // Unique ID for each grade
                    ...grade,
                }))
            );
            setFileUrl(secondSemesterData.fileUrl || ''); // Set the file URL for the second semester
            return; // Stop here since we have the latest grades
        }

        // If no second semester grades exist, fall back to first semester
        const firstSemesterDocRef = doc(yearLevelCollectionRef, 'firstSemester');
        const firstSemesterDoc = await getDoc(firstSemesterDocRef);

        if (firstSemesterDoc.exists()) {
            const firstSemesterData = firstSemesterDoc.data();
            const firstSemesterGrades = firstSemesterData.grades || [];
            setGrades(
                firstSemesterGrades.map((grade, index) => ({
                    id: `firstSemester-${index}`, // Unique ID for each grade
                    ...grade,
                }))
            );
            setFileUrl(firstSemesterData.fileUrl || ''); // Set the file URL for the first semester
        } else {
            console.warn(`No grades available for user ID: ${currentUser.uid}`);
            setGrades([]); // Clear grades if none are available
            setFileUrl(''); // Clear file URL
        }
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
    
            // Reference to the grades document for the current user
            const gradesDocRef = doc(db, 'grades', currentUser.uid); // This is the document for the user's grades
            const yearLevelCollectionRef = collection(gradesDocRef, yearLevel); // Reference to the user's year level
    
            // Before uploading the new grades, delete the previous semester's grades and store them in a new collection
            const currentSemester = selectedSemester === '1st' ? 'firstSemester' : 'secondSemester';
            const previousSemester = selectedSemester === '1st' ? 'secondSemester' : 'firstSemester';
    
            // Fetch previous semester grades and store them in a new collection for archival purposes
            const previousSemesterDocRef = doc(yearLevelCollectionRef, previousSemester);
            const previousSemesterDoc = await getDoc(previousSemesterDocRef);
    
            if (previousSemesterDoc.exists()) {
                const previousGrades = previousSemesterDoc.data().grades || [];
                const archivedGradesRef = collection(db, 'archivedGrades', currentUser.uid, yearLevel);
                const archivedSemesterDocRef = doc(archivedGradesRef, previousSemester);
    
                // Save the previous semester grades in the archived collection
                await setDoc(archivedSemesterDocRef, { grades: previousGrades });
            }
    
            // Delete the previous semester grades from the current collection
            await deleteDoc(previousSemesterDocRef);
    
            // Proceed with saving the new grades (same as your existing logic)
            const semesterDocRef = doc(yearLevelCollectionRef, currentSemester);
    
            await setDoc(semesterDocRef, { fileUrl: '' }); // Initialize with an empty fileUrl
    
            const storageRef = ref(storage, `uploads/${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const fileUrl = await getDownloadURL(storageRef);
    
            // Loop through subjects and save each grade in the semester document
            const gradesData = [];
    
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
                fileUrl,
            }, { merge: true });
    
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
    
    const handleViewCoursesToEnroll = async () => {
        const failedCourses = grades
            .filter(grade => grade.status === 'FAILED')
            .map(grade => grade.courseCode.trim());
    
        try {
            // Define document references for first and second semester grades
            const firstSemesterDocRef = doc(collection(db, 'grades', currentUser.uid, yearLevel), 'firstSemester');
            const secondSemesterDocRef = doc(collection(db, 'grades', currentUser.uid, yearLevel), 'secondSemester');
    
            // Get the documents for first and second semester
            const firstSemesterDoc = await getDoc(firstSemesterDocRef);
            const secondSemesterDoc = await getDoc(secondSemesterDocRef);
    
            let currentSemester;
            let nextSemesterCollection;
    
            // Determine the current semester based on uploaded grades
            if (firstSemesterDoc.exists()) {
                currentSemester = 'firstSemester';
            } else if (secondSemesterDoc.exists()) {
                currentSemester = 'secondSemester';
            } else {
                console.warn("No grades found for the user.");
                return;
            }
    
            console.log(`Current Semester: ${currentSemester}`);
            console.log(`Current Year Level: ${yearLevel}`);
    
            // Logic to determine the next semester
            if (yearLevel === "1st year") {
                if (currentSemester === 'firstSemester') {
                    nextSemesterCollection = "subjects/1stYear/secondSemester";
                } else if (currentSemester === 'secondSemester') {
                    nextSemesterCollection = "subjects/2ndYear/firstSemester";
                }
            } else if (yearLevel === "2nd year") {
                if (currentSemester === 'firstSemester') {
                    nextSemesterCollection = "subjects/2ndYear/secondSemester";
                } else if (currentSemester === 'secondSemester') {
                    nextSemesterCollection = "subjects/3rdYear/firstSemester";
                }
            } else if (yearLevel === "3rd year") {
                if (currentSemester === 'firstSemester') {
                    nextSemesterCollection = "subjects/3rdYear/secondSemester";
                } else if (currentSemester === 'secondSemester') {
                    nextSemesterCollection = "subjects/4thYear/firstSemester";
                }
            } else if (yearLevel === "4th year") {
                console.warn("You've completed all subjects.");
                return;
            } else {
                console.warn("Unknown year level. No courses will be fetched.");
                return;
            }
    
            console.log(`Fetching courses from: ${nextSemesterCollection}`);
    
            // Fetch the courses from the next semester collection
            const semesterRef = collection(db, nextSemesterCollection);
            const querySnapshot = await getDocs(semesterRef);
    
            if (querySnapshot.empty) {
                console.warn("No courses found in the collection.");
                return;
            }
    
            const eligibleCourses = [];
            const excludedCourses = [];
    
            querySnapshot.forEach(doc => {
                const course = doc.data();
                const prerequisites = course.preRequisite ? course.preRequisite.trim().split(",") : [];  // Support for multiple prerequisites
    
                // Check for "2nd Year Standing", "3rd Year Standing", and "4th Year Standing" prerequisites
                const hasSecondYearStandingPrerequisite = prerequisites.includes("2nd Year Standing");
                const hasThirdYearStandingPrerequisite = prerequisites.includes("3rd Year Standing");
                const hasFourthYearStandingPrerequisite = prerequisites.includes("4th Year Standing");
    
                // If any of these year standing prerequisites are present and the student has failed any course, exclude the course
                if ((hasSecondYearStandingPrerequisite || hasThirdYearStandingPrerequisite || hasFourthYearStandingPrerequisite) && failedCourses.length > 0) {
                    excludedCourses.push({
                        courseCode: course.courseCode,
                        courseTitle: course.courseTitle,
                        preRequisite: prerequisites.join(", ")  // Show all prerequisites
                    });
                    console.log(`Excluding course ${course.courseCode} due to failed subject and prerequisite: ${prerequisites.join(", ")}`);
                } else {
                    // Check if the student has failed any of the prerequisites
                    const failedPrerequisites = prerequisites.filter(prerequisite => failedCourses.includes(prerequisite.trim()));
    
                    if (failedPrerequisites.length > 0) {
                        excludedCourses.push({
                            courseCode: course.courseCode,
                            courseTitle: course.courseTitle,
                            preRequisite: prerequisites.join(", ")  // Show all prerequisites
                        });
                        console.log(`Excluding course ${course.courseCode} due to failed prerequisite(s): ${failedPrerequisites.join(", ")}`);
                    } else {
                        eligibleCourses.push({
                            id: doc.id,
                            courseCode: course.courseCode,
                            courseTitle: course.courseTitle,
                            preRequisite: prerequisites.join(", "),  // Show all prerequisites
                            units: course.units || { lec: 0, lab: 0, total: 0 },
                            hoursPerWeek: course.hoursPerWeek || { lec: 0, lab: 0, total: 0 },
                            hoursPerSemester: course.hoursPerSemester || { lec: 0, lab: 0, total: 0 }
                        });
                    }
                }
            });
    
            // Fetch existing data for this student from the coursesToEnrollments collection
            const coursesRef = doc(collection(db, 'coursesToEnrollments'), currentUser.uid);
            const coursesDoc = await getDoc(coursesRef);
    
            if (coursesDoc.exists()) {
                // Compare existing stored courses with new ones
                const storedEligibleCourses = coursesDoc.data().eligibleCourses;
                const storedExcludedCourses = coursesDoc.data().excludedCourses;
    
                // Normalize courses to remove any differences in order or structure
                const normalizeCourses = (courses) => {
                    return courses.map(course => ({
                        courseCode: course.courseCode,
                        courseTitle: course.courseTitle,
                        preRequisite: course.preRequisite
                    }));
                };
    
                const normalizedEligibleCourses = normalizeCourses(eligibleCourses);
                const normalizedExcludedCourses = normalizeCourses(excludedCourses);
                const normalizedStoredEligibleCourses = normalizeCourses(storedEligibleCourses);
                const normalizedStoredExcludedCourses = normalizeCourses(storedExcludedCourses);
    
                const isCoursesUnchanged = JSON.stringify(normalizedStoredEligibleCourses) === JSON.stringify(normalizedEligibleCourses) &&
                                           JSON.stringify(normalizedStoredExcludedCourses) === JSON.stringify(normalizedExcludedCourses);
    
                console.log("Courses Unchanged:", isCoursesUnchanged);
    
                // Always update the state with the fetched courses, even if unchanged
                setCoursesToEnroll(eligibleCourses);
                setExcludedCourses(excludedCourses);
    
                if (isCoursesUnchanged) {
                    console.log("Courses data is the same as before, enabling button.");
                } else {
                    // Show the pop-up message saying courses have already been updated
                    setShowModalMessage(true); // Show modal with message
                    
                    // Prevent the modal from showing if alert is triggered
                    setShowEnrollCoursesModal(false); // Ensure the modal does not show
                    return; // Exit early if the alert is shown
                }
                // Show modal to view the courses
                setShowEnrollCoursesModal(true);
            } else {
                // If no previous data exists, store the new courses
                await setDoc(coursesRef, {
                    eligibleCourses: eligibleCourses,
                    excludedCourses: excludedCourses,
                    timestamp: new Date()
                }).then(() => {
                    console.log("Courses to be enrolled successfully stored in Firestore.");
                    setCoursesToEnroll(eligibleCourses);
                    setExcludedCourses(excludedCourses);
                    console.log("Setting showEnrollCoursesModal to true");
                    setShowEnrollCoursesModal(true);
                }).catch((error) => {
                    console.error("Error storing courses in Firestore:", error);
                });
            }
        } catch (error) {
            console.error('Error fetching courses to enroll:', error);
        }
    };
    
    
    const storeExcludedCourses = async () => {
        if (excludedCourses.length === 0) {
            console.log("No excluded courses to store.");
            return;
        }
    
        try {
            // Define the document reference in the `excludedCourses` collection
            const excludedCoursesDocRef = doc(db, 'excludedCourses', currentUser.uid);
    
            // Check if the document already exists
            const docSnapshot = await getDoc(excludedCoursesDocRef);
            if (docSnapshot.exists()) {
                console.log("Excluded courses already stored. Skipping save operation.");
                return;
            }
    
            // Prepare the data to store
            const data = {
                excludedCourses: excludedCourses,
                timestamp: new Date(), // Optional: Add a timestamp for when the data was stored
            };
    
            // Store the data in Firestore
            await setDoc(excludedCoursesDocRef, data);
            console.log("Excluded courses successfully stored in Firestore.");
        } catch (error) {
            console.error("Error storing excluded courses in Firestore:", error);
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

<div className="mt-6 flex justify-end space-x-4">
    <button
        className="bg-red-600 text-white px-6 py-3 w-30 rounded-lg hover:bg-red-700 transition-colors text-sm"
        onClick={handleCloseModal}
    >
        Close
    </button>
    <button
        className="bg-blue-600 text-white px-6 py-3 w-30 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        onClick={handleViewCoursesToEnroll}
    >
        View Courses to Be Enrolled
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



{/* Enrollment Courses Modal */}
{showEnrollCoursesModal && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-6xl w-full">
            <h3 className="text-2xl font-semibold mb-6 text-center">Courses Eligible for Enrollment</h3>
           
{/* Message for excluded courses */}
{excludedCourses.length > 0 && (
    <div className="mb-4 text-red-600 text-center flex items-center justify-center">
        <HiExclamation className="mr-2 text-2xl" /> {/* Icon with increased size */}
        <p>You have failed or excluded subjects. Please review your excluded courses.</p>
    </div>
)}

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
                        <th className="border p-4">Co-Requisite</th>
                    </tr>
                </thead>
                <tbody>
                    {coursesToEnroll.length > 0 ? (
                        coursesToEnroll.map((course, index) => (
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
                                <td className="border p-4">{course.coRequisite}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={13} className="text-center text-gray-500 py-6">No courses available for enrollment based on current grades.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {/* Button container with flex layout for alignment */}
            <div className="flex justify-end mt-6 space-x-4">
                <button
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                    onClick={() => setShowEnrollCoursesModal(false)}
                >
                    Close
                </button>
                <button
    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
    onClick={() => {
        setShowExcludedCoursesModal(true);
        storeExcludedCourses(); // Store the excluded courses in Firestore
    }}
>
    View Excluded Courses
</button>

            </div>
        </div>
    </div>
)}


  {/* Modal for message */}
{showModalMessage && (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-96 max-w-sm flex flex-col items-center">
            <HiExclamation className="text-yellow-500 text-6xl mb-4" /> {/* Exclamation icon in yellow */}
            <h3 className="text-2xl font-semibold text-gray-900">Courses Updated</h3>
            <p className="mt-2 text-gray-600 text-center">The evaluator has already updated your courses to enroll. Please check your curriculum list.</p>
            <div className="mt-6 flex justify-center w-full">
                <button
                    onClick={() => setShowModalMessage(false)}
                    className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200">
                    Close
                </button>
            </div>
        </div>
    </div>
)}
{/* Excluded Courses Modal */}
{showExcludedCoursesModal && (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-6xl w-full relative">
            <h3 className="text-2xl font-semibold mb-2 text-center">Excluded Courses Due to Failed Prerequisites</h3>

          {/* Notification Message with Icon */}
          <div className="flex items-center justify-center text-red-600 mb-6">
                <HiExclamation className="mr-2 h-6 w-6" />
                <p>Please check your uploaded grades. If you think there’s a mistake, you can reach out to message the evaluator.</p>
            </div>
            
            
            {/* Courses Table */}
            <table className="w-full border-collapse text-base">
                <thead>
                    <tr className="bg-red-300">
                        <th className="border p-4">Course Code</th>
                        <th className="border p-4">Course Title</th>
                        <th className="border p-4">Pre-Requisite</th>
                    </tr>
                </thead>
                <tbody>
                    {excludedCourses.length > 0 ? (
                        excludedCourses.map((course, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}>
                                <td className="border p-4">{course.courseCode}</td>
                                <td className="border p-4">{course.courseTitle}</td>
                                <td className="border p-4">{course.preRequisite}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="text-center text-gray-500 py-6">No excluded courses found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Close Button in Bottom Right */}
            <div className="flex justify-end mt-6">
                <button
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    onClick={() => setShowExcludedCoursesModal(false)}
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
