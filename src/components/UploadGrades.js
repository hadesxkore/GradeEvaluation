import React, { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineExclamation, HiUpload, HiEye, HiCheckCircle, HiExclamation } from 'react-icons/hi';
// Firebase Storage removed — using Cloudinary for file uploads
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase'; // Ensure your Firestore instance and auth are imported
import { sileo } from 'sileo';
import { ClipLoader } from 'react-spinners';


const UploadGrades = () => {
    const [showModal, setShowModal] = useState(false);
    const [showViewGradesModal, setShowViewGradesModal] = useState(false);
    const [showSubjectsModal, setShowSubjectsModal] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [yearLevel, setYearLevel] = useState('');
    const [irregularityReason, setIrregularityReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCourses, setIsFetchingCourses] = useState(false);
    const [grades, setGrades] = useState([]);
    const [showEnrollCoursesModal, setShowEnrollCoursesModal] = useState(false);
    const [coursesToEnroll, setCoursesToEnroll] = useState([]);
    const [fileUrl, setFileUrl] = useState('');
    const [showUploadMessageModal, setShowUploadMessageModal] = useState(false);
    const [excludedCourses, setExcludedCourses] = useState([]);
    const [showExcludedCoursesModal, setShowExcludedCoursesModal] = useState(false);
    const [selectedCourseGrade, setSelectedCourseGrade] = useState(null);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [isDataUpdated, setIsDataUpdated] = useState(false);
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
            // currentUser is null on initial render while Firebase auth resolves — just wait
            if (!currentUser || !currentUser.uid) {
                setLoading(false);
                return;
            }

            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setYearLevel(userData.yearLevel || '');
                    setIrregularityReason(userData.irregularityReason || '');
                } else {
                    console.error('User document not found in Firestore.');
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

        // Guard: year level must be set in Student Information before uploading grades
        if (!yearLevel) {
            sileo.warning({
                title: 'Year Level Not Set',
                description: 'Please set your Year Level in the Student Information page before uploading your grades.',
            });
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
            sileo.error({ title: 'File Required', description: 'Please upload a file for verification before saving grades.' });
            return; // Exit the function if no file is selected
        }

        setIsLoading(true); // Start loading

        try {
            // Upload file to Cloudinary using unsigned preset
            const CLOUDINARY_CLOUD_NAME = 'dqndurz00';
            const CLOUDINARY_UPLOAD_PRESET = 'gradeeval';

            // PDFs upload as 'image' (Cloudinary supports this and allows fl_attachment transformation)
            // Other non-image files (docx, etc.) upload as 'raw'
            const resourceType = (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf')
                ? 'image'
                : 'raw';

            const cloudinaryForm = new FormData();
            cloudinaryForm.append('file', selectedFile);
            cloudinaryForm.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            cloudinaryForm.append('folder', 'uploads');

            const cloudinaryRes = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
                { method: 'POST', body: cloudinaryForm }
            );
            if (!cloudinaryRes.ok) throw new Error('Cloudinary upload failed.');
            const cloudinaryData = await cloudinaryRes.json();
            const fileUrl = cloudinaryData.secure_url;

            // Reference to the grades document for the current user
            const gradesDocRef = doc(db, 'grades', currentUser.uid);
            const yearLevelCollectionRef = collection(gradesDocRef, yearLevel);

            // Determine current and previous semester
            const currentSemester = selectedSemester === '1st' ? 'firstSemester' : 'secondSemester';
            const previousSemester = selectedSemester === '1st' ? 'secondSemester' : 'firstSemester';

            // Archive previous semester grades before saving new ones
            const previousSemesterDocRef = doc(yearLevelCollectionRef, previousSemester);
            const previousSemesterDoc = await getDoc(previousSemesterDocRef);

            if (previousSemesterDoc.exists()) {
                const previousGrades = previousSemesterDoc.data().grades || [];
                const archivedGradesRef = collection(db, 'archivedGrades', currentUser.uid, yearLevel);
                const archivedSemesterDocRef = doc(archivedGradesRef, previousSemester);
                await setDoc(archivedSemesterDocRef, { grades: previousGrades });
            }

            // Delete the previous semester grades from the current collection
            await deleteDoc(previousSemesterDocRef);

            // Create/update the current semester document
            const semesterDocRef = doc(yearLevelCollectionRef, currentSemester);
            await setDoc(semesterDocRef, { fileUrl: '' }); // Initialize with empty fileUrl

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
            sileo.error({ title: 'Save Failed', description: 'An error occurred while saving grades. Please try again.' });
        } finally {
            setIsLoading(false); // Stop loading
        }
    };

    const handleViewCoursesToEnroll = async () => {
        // Close any open modal first so the Sileo toast isn't hidden behind the backdrop
        setShowSuccessModal(false);
        setShowModal(false);
        setShowViewGradesModal(false);

        if (!currentUser?.uid) return;

        setIsFetchingCourses(true);

        try {
            // ─────────────────────────────────────────────────────────────────
            // STEP 1 — Fetch ALL subjects from every year/semester collection
            // ─────────────────────────────────────────────────────────────────
            const ALL_YEARS = ['1stYear', '2ndYear', '3rdYear', '4thYear'];
            const ALL_SEMS  = ['firstSemester', 'secondSemester'];
            const allSubjects = [];

            for (const yr of ALL_YEARS) {
                for (const sem of ALL_SEMS) {
                    const snap = await getDocs(collection(db, 'subjects', yr, sem));
                    snap.docs.forEach(d => {
                        const s = d.data();
                        const code = (s.courseCode ?? '').trim();
                        // De-duplicate by courseCode (handles duplicate Firestore docs)
                        if (code && !allSubjects.find(x => x.courseCode === code)) {
                            allSubjects.push({
                                id: d.id, year: yr, sem,
                                courseCode:       code,
                                courseTitle:      (s.courseTitle  ?? '').trim(),
                                preRequisite:     (s.preRequisite ?? '').trim(),
                                coRequisite:      (s.coRequisite  ?? '').trim(),
                                units:            s.units            || { lec: 0, lab: 0, total: 0 },
                                hoursPerWeek:     s.hoursPerWeek     || { lec: 0, lab: 0, total: 0 },
                                hoursPerSemester: s.hoursPerSemester || { lec: 0, lab: 0, total: 0 },
                            });
                        }
                    });
                }
            }

            if (allSubjects.length === 0) {
                sileo.info({ title: 'No Curriculum Found', description: 'No subjects are in the system yet. Contact your evaluator.' });
                return;
            }

            // ─────────────────────────────────────────────────────────────────
            // STEP 1b — Smart year-level filter
            //   Regular / Failed-Irregular: show current year (retakes) + next year
            //   Shifter: show ALL years (they may have credits from another school)
            //   4th year: show only 4th year remaining
            // ─────────────────────────────────────────────────────────────────
            const YEAR_PROGRESSION = ['1stYear', '2ndYear', '3rdYear', '4thYear'];
            const YL_TO_KEY = {
                '1st year': '1stYear', '2nd year': '2ndYear',
                '3rd year': '3rdYear', '4th year': '4thYear',
            };
            const currentYearKey = YL_TO_KEY[yearLevel?.toLowerCase()] || null;
            const currentYearIdx = YEAR_PROGRESSION.indexOf(currentYearKey);
            const isShifter = irregularityReason === 'Shifter';

            // Determine which year buckets to include
            const allowedYears = new Set();
            if (isShifter || currentYearKey === null) {
                // Shifters see all years
                YEAR_PROGRESSION.forEach(y => allowedYears.add(y));
            } else {
                // Always include current year (retakes of failed/incomplete subjects)
                allowedYears.add(currentYearKey);
                // And the next year (if not already at 4th year)
                if (currentYearIdx + 1 < YEAR_PROGRESSION.length) {
                    allowedYears.add(YEAR_PROGRESSION[currentYearIdx + 1]);
                }
            }

            const filteredSubjects = allSubjects.filter(s => allowedYears.has(s.year));

            // ─────────────────────────────────────────────────────────────────
            // STEP 2 — Build the student's complete pass history
            //   Reads from:
            //     grades/{uid}/{yearLabel}/{sem}            (active)
            //     archivedGrades/{uid}/{yearLabel}/{sem}    (archived)
            // ─────────────────────────────────────────────────────────────────
            const passedCodes = new Set();

            const collectFromSnap = (snap) => {
                if (!snap.exists()) return;
                (snap.data().grades || []).forEach(g => {
                    const code = (g.courseCode ?? '').trim();
                    if (code && g.status === 'PASSED') passedCodes.add(code);
                });
            };

            const YR_LABELS = {
                '1stYear': '1st year',
                '2ndYear': '2nd year',
                '3rdYear': '3rd year',
                '4thYear': '4th year',
            };

            for (const yr of ALL_YEARS) {
                const label = YR_LABELS[yr];
                for (const sem of ALL_SEMS) {
                    try {
                        collectFromSnap(await getDoc(doc(db, 'grades', currentUser.uid, label, sem)));
                    } catch (_) {}
                    try {
                        collectFromSnap(await getDoc(doc(db, 'archivedGrades', currentUser.uid, label, sem)));
                    } catch (_) {}
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // STEP 3 — Compute Year Standing
            //   2nd Year Standing = student has passed ALL 1st-year subjects
            //   3rd Year Standing = student has passed ALL 2nd-year subjects
            //   4th Year Standing = student has passed ALL 3rd-year subjects
            // ─────────────────────────────────────────────────────────────────
            const codesFor = (yr) => allSubjects.filter(s => s.year === yr).map(s => s.courseCode);
            const has2nd = codesFor('1stYear').every(c => passedCodes.has(c));
            const has3rd = has2nd && codesFor('2ndYear').every(c => passedCodes.has(c));
            const has4th = has3rd && codesFor('3rdYear').every(c => passedCodes.has(c));

            // ─────────────────────────────────────────────────────────────────
            // STEP 4 — Classify every subject as eligible or excluded
            // ─────────────────────────────────────────────────────────────────
            const eligible = [];
            const excluded = [];

            for (const subj of filteredSubjects) {
                // Already passed — student doesn't need to retake it
                if (passedCodes.has(subj.courseCode)) continue;

                // Check if this is a RETAKE (student had grades for it before but didn't pass)
                // We track this so the UI can label it
                const isRetake = allSubjects
                    .filter(s => s.year === currentYearKey)
                    .some(s => s.courseCode === subj.courseCode);

                let blockingReason = null;

                if (subj.preRequisite) {
                    const reqs = subj.preRequisite.split(',').map(r => r.trim()).filter(Boolean);
                    for (const req of reqs) {
                        if (req === '2nd Year Standing') {
                            if (!has2nd) { blockingReason = 'Requires 2nd Year Standing (pass all 1st-year subjects first)'; break; }
                        } else if (req === '3rd Year Standing') {
                            if (!has3rd) { blockingReason = 'Requires 3rd Year Standing (pass all 2nd-year subjects first)'; break; }
                        } else if (req === '4th Year Standing') {
                            if (!has4th) { blockingReason = 'Requires 4th Year Standing (pass all 3rd-year subjects first)'; break; }
                        } else {
                            if (!passedCodes.has(req)) { blockingReason = `Missing pre-req: ${req}`; break; }
                        }
                    }
                }

                if (blockingReason) {
                    excluded.push({ ...subj, blockingReason, isRetake });
                } else {
                    eligible.push({ ...subj, isRetake });
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // STEP 5 — Edge cases & open modal
            // ─────────────────────────────────────────────────────────────────
            if (eligible.length === 0 && excluded.length === 0) {
                sileo.success({ title: '🎓 Congratulations!', description: "You've passed every subject in the curriculum. You're ready to graduate!" });
                return;
            }

            if (eligible.length === 0) {
                sileo.warning({
                    title: 'No Eligible Courses Yet',
                    description: `${excluded.length} subject(s) still have unmet prerequisites. Check the Excluded list for details.`,
                });
            }

            // Save to Firestore so evaluator can see
            await setDoc(doc(db, 'coursesToEnrollments', currentUser.uid), {
                eligibleCourses: eligible,
                excludedCourses: excluded,
                timestamp: new Date(),
            });

            setCoursesToEnroll(eligible);
            setExcludedCourses(excluded);
            setIsFetchingCourses(false);
            setShowEnrollCoursesModal(true);

        } catch (error) {
            setIsFetchingCourses(false);
            console.error('Error fetching courses to enroll:', error);
            sileo.error({
                title: 'Something Went Wrong',
                description: error?.message || 'Could not load courses. Please try again.',
            });
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
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Loading your grades...</p>
            </div>
        </div>
    );
}

return (
    <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-800">My Grades</h1>
            <p className="text-sm text-slate-500 mt-1">
                Upload your semester grades and view your academic performance history.
            </p>
            {yearLevel && (
                <span className="inline-flex items-center gap-1.5 mt-2 bg-violet-50 text-violet-700 border border-violet-100 text-xs font-semibold px-3 py-1.5 rounded-full">
                    📚 {yearLevel}
                </span>
            )}
        </div>

        {/* ── Action Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-violet-500 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                        <HiUpload className="text-xl text-violet-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">Upload My Grades</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">
                    Submit your semester grades along with a PDF verification file for your evaluator to review.
                </p>
                <button
                    onClick={handleUploadGrade}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <HiUpload className="text-base" /> Upload Grades
                </button>
            </div>

            {/* View Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-500 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <HiEye className="text-xl text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm">View My Grades</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">
                    Review the grades you've uploaded and track your academic progress across semesters.
                </p>
                <button
                    onClick={handleViewGrades}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <HiEye className="text-base" /> View Grades
                </button>
            </div>
        </div>

        {/* ════════════════════ SEMESTER SELECT MODAL ════════════════════ */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800 text-lg">Select Semester</h3>
                        <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
                    </div>
                    <p className="text-sm text-slate-500 mb-5">Choose the semester for which you want to upload your grades.</p>
                    <div className="flex flex-col gap-3 mb-2">
                        {[
                            { value: '1st', label: '1st Semester', emoji: '📖', desc: 'August – December term grades' },
                            { value: '2nd', label: '2nd Semester', emoji: '📗', desc: 'January – May term grades' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSemesterSelection(opt.value)}
                                className="w-full text-left px-4 py-4 rounded-xl border-2 border-slate-200 hover:border-violet-400 hover:bg-violet-50 bg-white transition-all flex items-start gap-4 shadow-sm"
                            >
                                <span className="text-2xl mt-0.5">{opt.emoji}</span>
                                <div>
                                    <p className="font-semibold text-sm text-slate-800">{opt.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCloseModal} className="mt-4 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
            </div>
        )}

        {/* ════════════════════ SUBJECTS / GRADE ENTRY MODAL ════════════════════ */}
        {showSubjectsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">{selectedSemester === '1st' ? '1st' : '2nd'} Semester Subjects</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{yearLevel} · Select a grade for each subject</p>
                        </div>
                        <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
                    </div>
                    <div className="overflow-auto flex-1 px-7 py-5">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Req</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Grade</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subjects.map((subject, index) => (
                                    <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 pr-4 font-mono font-semibold text-violet-700 text-xs whitespace-nowrap">{subject.courseCode}</td>
                                        <td className="py-3 pr-4 text-slate-800 font-medium">{subject.courseTitle}</td>
                                        <td className="py-3 pr-4 text-slate-500 text-xs">{subject.preRequisite || '—'}</td>
                                        <td className="py-3 pr-4">
                                            <div className="relative">
                                                <select
                                                    value={subject.grade || ''}
                                                    onChange={(e) => handleGradeChange(index, e.target.value)}
                                                    className="w-full appearance-none px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition pr-8"
                                                    aria-label={`Grade for ${subject.courseCode}`}
                                                >
                                                    <option value="" disabled>Grade</option>
                                                    {['1', '1.25', '1.50', '1.75', '2', '2.25', '2.50', '2.75', '3', '3.25', '3.50', '3.75', '4', '5'].map(g => (
                                                        <option key={g} value={g}>{parseFloat(g).toFixed(2)}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                                    <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            {subject.status ? (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${subject.status === 'PASSED' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {subject.status}
                                                </span>
                                            ) : <span className="text-slate-300 text-xs">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-7 py-5 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Verification File <span className="text-rose-400">*</span></label>
                                <label className="flex items-center gap-3 cursor-pointer border border-dashed border-slate-300 hover:border-violet-400 rounded-xl px-4 py-3 transition-colors group">
                                    <HiUpload className="text-slate-400 group-hover:text-violet-500 text-xl shrink-0" />
                                    <span className="text-sm text-slate-500 truncate">{selectedFile ? selectedFile.name : 'Choose PDF or image to verify grades'}</span>
                                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" />
                                </label>
                                {!selectedFile && <p className="text-xs text-rose-500 mt-1.5">Please attach a verification file before saving.</p>}
                            </div>
                            <div className="flex gap-3 sm:self-end">
                                <button onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                                <button onClick={handleSaveGrades} disabled={!selectedFile} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-colors">Save Grades</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ════════════════════ VIEW GRADES MODAL ════════════════════ */}
        {showViewGradesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">My Uploaded Grades</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{yearLevel} — Latest semester on record</p>
                        </div>
                        <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
                    </div>
                    <div className="overflow-auto flex-1 px-7 py-5">
                        {grades.length === 0 ? (
                            <div className="text-center py-12">
                                <HiEye className="text-5xl text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm font-medium">No grades uploaded yet.</p>
                            </div>
                        ) : (
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                        <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title</th>
                                        <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Req</th>
                                        <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                                        <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {grades.map((grade) => (
                                        <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 pr-4 font-mono font-semibold text-violet-700 text-xs">{grade.courseCode}</td>
                                            <td className="py-3 pr-4 text-slate-800 font-medium">{grade.courseTitle}</td>
                                            <td className="py-3 pr-4 text-slate-500 text-xs">{grade.preRequisite || '—'}</td>
                                            <td className="py-3 text-center font-bold text-slate-700">{grade.grade}</td>
                                            <td className="py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${grade.status === 'PASSED' ? 'bg-teal-50 text-teal-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    {grade.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {fileUrl && (
                            <div className="mt-5 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                                <HiEye className="text-indigo-500 shrink-0" />
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 font-semibold hover:underline"
                                >
                                    View uploaded verification file (ROG)
                                </a>
                            </div>
                        )}
                    </div>
                    <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
                        <button onClick={handleCloseModal} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Close</button>
                        <button onClick={handleViewCoursesToEnroll} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">View Courses to Enroll →</button>
                    </div>
                </div>
            </div>
        )}

        {/* ════════════════════ SUCCESS MODAL ════════════════════ */}
        {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <HiCheckCircle className="text-3xl text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Grades Saved!</h3>
                    <p className="text-sm text-slate-500 mb-6">Your grades have been submitted successfully and are now available for your evaluator to review.</p>
                    <button onClick={() => setShowSuccessModal(false)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors">Done</button>
                </div>
            </div>
        )}

        {/* ════════════════════ LOADING MODAL ════════════════════ */}
        {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-64 text-center">
                    <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="font-semibold text-slate-800">Saving Grades</p>
                    <p className="text-xs text-slate-500 mt-1">Please wait a moment...</p>
                </div>
            </div>
        )}

        {/* ════════════════════ ALREADY UPLOADED MODAL ════════════════════ */}
        {showUploadMessageModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <HiOutlineExclamation className="text-3xl text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Already Uploaded</h3>
                    <p className="text-sm text-slate-500 mb-6">You have already uploaded your grades for this semester. View them using the "View My Grades" option.</p>
                    <button onClick={() => setShowUploadMessageModal(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors">Got It</button>
                </div>
            </div>
        )}

        {/* ════════════════════ FETCHING COURSES LOADING MODAL ════════════════════ */}
        {isFetchingCourses && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-80 flex flex-col items-center gap-5">
                    {/* Animated rings */}
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-600 animate-spin" />
                        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-fuchsia-400 animate-spin" style={{ animationDuration: '0.6s', animationDirection: 'reverse' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg">📚</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-800 text-base">Analyzing Your Curriculum</p>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                            Scanning grade history and checking prerequisites across all subjects&hellip;
                        </p>
                    </div>
                    {/* Animated progress dots */}
                    <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full bg-violet-400"
                                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* ════════════════════ COURSES TO ENROLL MODAL ════════════════════ */}
        {showEnrollCoursesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Eligible Courses for Enrollment</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {coursesToEnroll.length} course{coursesToEnroll.length !== 1 ? 's' : ''} eligible
                                {irregularityReason === 'Shifter'
                                    ? ' · Showing all years (Shifter)'
                                    : yearLevel
                                        ? ` · ${yearLevel} retakes + next year`
                                        : ' based on your grade history'}
                            </p>
                        </div>
                        <button onClick={() => setShowEnrollCoursesModal(false)} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
                    </div>
                    {excludedCourses.length > 0 && (
                        <div className="mx-7 mt-5 flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                            <HiExclamation className="text-rose-500 text-xl shrink-0" />
                            <p className="text-sm text-rose-700 font-medium">{excludedCourses.length} course{excludedCourses.length > 1 ? 's' : ''} excluded due to failed or missing prerequisites.</p>
                        </div>
                    )}
                    <div className="overflow-auto flex-1 px-7 py-5">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                                    <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Units (L/La/T)</th>
                                    <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Wk (L/La/T)</th>
                                    <th className="pb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Sem (L/La/T)</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Req</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {coursesToEnroll.length > 0 ? (() => {
                                    // Group by year + semester for header rows
                                    const SEM_LABEL = { firstSemester: '1st Semester', secondSemester: '2nd Semester' };
                                    const YR_LABEL = {
                                        '1stYear': '1st Year', '2ndYear': '2nd Year',
                                        '3rdYear': '3rd Year', '4thYear': '4th Year',
                                    };
                                    const rows = [];
                                    let lastGroup = null;
                                    // Sort by year index then semester
                                    const sorted = [...coursesToEnroll].sort((a, b) => {
                                        const yOrder = ['1stYear','2ndYear','3rdYear','4thYear'];
                                        const sOrder = ['firstSemester','secondSemester'];
                                        const yDiff = yOrder.indexOf(a.year) - yOrder.indexOf(b.year);
                                        return yDiff !== 0 ? yDiff : sOrder.indexOf(a.sem) - sOrder.indexOf(b.sem);
                                    });
                                    sorted.forEach((course, i) => {
                                        const group = `${course.year}|${course.sem}`;
                                        if (group !== lastGroup) {
                                            lastGroup = group;
                                            rows.push(
                                                <tr key={`hdr-${i}`} className="bg-slate-50">
                                                    <td colSpan={13} className="py-2 px-3 text-xs font-bold text-violet-700 uppercase tracking-wider">
                                                        📅 {YR_LABEL[course.year] || course.year} &mdash; {SEM_LABEL[course.sem] || course.sem}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        rows.push(
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 pr-3 font-mono font-semibold text-violet-700 text-xs whitespace-nowrap">
                                                    <span>{course.courseCode}</span>
                                                    {course.isRetake && (
                                                        <span className="ml-1.5 inline-block bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full align-middle">
                                                            🔄 RETAKE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-3 text-slate-800 font-medium">{course.courseTitle}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.units?.lec ?? '—'}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.units?.lab ?? '—'}</td>
                                                <td className="py-2 text-center font-semibold text-slate-800 text-xs">{course.units?.total ?? '—'}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.hoursPerWeek?.lec ?? '—'}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.hoursPerWeek?.lab ?? '—'}</td>
                                                <td className="py-2 text-center font-semibold text-slate-800 text-xs">{course.hoursPerWeek?.total ?? '—'}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.hoursPerSemester?.lec ?? '—'}</td>
                                                <td className="py-2 text-center text-slate-600 text-xs">{course.hoursPerSemester?.lab ?? '—'}</td>
                                                <td className="py-2 text-center font-semibold text-slate-800 text-xs">{course.hoursPerSemester?.total ?? '—'}</td>
                                                <td className="py-3 text-xs text-slate-500">{course.preRequisite || '—'}</td>
                                            </tr>
                                        );
                                    });
                                    return rows;
                                })() : (
                                    <tr><td colSpan={13} className="py-8 text-center text-slate-400 text-sm">No eligible courses based on your current grades.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
                        <button onClick={() => setShowEnrollCoursesModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Close</button>
                        {excludedCourses.length > 0 && (
                            <button onClick={() => setShowExcludedCoursesModal(true)} className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors">
                                View Excluded ({excludedCourses.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ════════════════════ COURSES UPDATED NOTICE MODAL ════════════════════ */}
        {showModalMessage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <HiOutlineExclamation className="text-3xl text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Courses Updated</h3>
                    <p className="text-sm text-slate-500 mb-6">Your evaluator has already updated your courses to enroll. Check your curriculum list for the latest courses.</p>
                    <button onClick={() => setShowModalMessage(false)} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors">Okay, Got It</button>
                </div>
            </div>
        )}

        {/* ════════════════════ EXCLUDED COURSES MODAL ════════════════════ */}
        {showExcludedCoursesModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Excluded Courses</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Excluded due to failed or missing prerequisites</p>
                        </div>
                        <button onClick={() => setShowExcludedCoursesModal(false)} className="text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
                    </div>
                    <div className="mx-7 mt-5 flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-2">
                        <HiOutlineExclamation className="text-rose-500 text-xl shrink-0 mt-0.5" />
                        <p className="text-sm text-rose-700">Please review your grades. If you think there's an error, contact your evaluator directly.</p>
                    </div>
                    <div className="overflow-auto flex-1 px-7 py-5">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Requisite</th>
                                    <th className="pb-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reason Blocked</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {excludedCourses.length > 0 ? excludedCourses.map((c, i) => (
                                    <tr key={i} className="hover:bg-rose-50/50 transition-colors">
                                        <td className="py-3 pr-4 font-mono font-semibold text-rose-700 text-xs">{c.courseCode}</td>
                                        <td className="py-3 pr-4 text-slate-800 font-medium">{c.courseTitle}</td>
                                        <td className="py-3 pr-4 text-slate-500 text-xs">{c.preRequisite || '—'}</td>
                                        <td className="py-3 text-xs text-amber-700 font-medium">{c.blockingReason || '—'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No excluded courses.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-7 py-5 border-t border-slate-100">
                        <button onClick={() => setShowExcludedCoursesModal(false)} className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}

    </div>
);
};

export default UploadGrades;
