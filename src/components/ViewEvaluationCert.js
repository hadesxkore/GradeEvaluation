import React, { useState, useEffect } from 'react';
import {
  HiOutlineEye,
  HiClipboardList,
  HiPrinter,
  HiEye,
  HiOutlineAcademicCap,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineXCircle,
  HiPlus,
  HiOutlineBell,
  HiSearch,
  HiOutlineDocumentText
} from 'react-icons/hi';
import Modal from 'react-modal';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { sileo } from 'sileo';

Modal.setAppElement('#root');

const ViewEvaluationCert = ({ viewCourses }) => {
  // State variables (Preserving original logic)
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [showStudentsTable, setShowStudentsTable] = useState(true);
  const [showCoursesTable, setShowCoursesTable] = useState(false);
  const [showCourses, setShowCourses] = useState(false);

  // General Modals
  const [isNotificationModalOpen, setNotificationModalOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Courses Data
  const [courseList, setCourseList] = useState([]);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [yearLevel, setYearLevel] = useState(null);
  const [semester, setSemester] = useState(null);

  // Student specific modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentName, setStudentName] = useState('');

  const [isCourseFilesModalOpen, setIsCourseFilesModalOpen] = useState(false);
  const [loadingCourseFiles, setLoadingCourseFiles] = useState(false);
  const [courseFiles, setCourseFiles] = useState([]);
  const [excludedCourses, setExcludedCourses] = useState([]);
  const [showExcludedCourses, setShowExcludedCourses] = useState(false);

  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [grades, setGrades] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [semesterModalOpen, setSemesterModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);

  // Add course selection Modals
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(null);
  const [isSemesterSelectionModalOpen, setIsSemesterSelectionModalOpen] = useState(false);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // Success/Error Msg Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');

  /* ─── DATA FETCHING & LOGIC (Untouched, formatting only) ─── */
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'Student'));
        const querySnapshot = await getDocs(q);
        const studentData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStudents(studentData);
        setFilteredStudents(studentData);
      } catch (error) { console.error('Error fetching students:', error); }
      setLoadingStudents(false);
    };
    fetchStudents();
  }, []);

  const getFormattedYear = (year) => {
    const suffixes = ['st', 'nd', 'rd', 'th'];
    const remainder = year % 10;
    const suffix = (remainder <= 3 && (Math.floor(year / 10) !== 1)) ? suffixes[remainder - 1] : suffixes[3];
    return `${year}${suffix}Year`;
  };

  const handleYearSelection = (year) => {
    setCurrentYear(year);
    setIsSemesterSelectionModalOpen(true);
  };

  const printEvaluationCert = () => {
    const ROF042_URL = 'https://res.cloudinary.com/dqndurz00/raw/upload/v1774317787/forms/e0iyemedapvyjkp5gygs.pdf';
    window.open(ROF042_URL, '_blank');
  };

  const handleSemesterSelection = (semester) => {
    setCurrentSemester(semester);
    setIsSemesterSelectionModalOpen(false);
    setIsSubjectModalOpen(true);
    fetchCourses(getFormattedYear(currentYear), semester);
  };

  const handleAddCourse = async (course) => {
    if (!selectedStudent) return;
    try {
      const studentDocRef = doc(db, 'coursesToEnrollments', selectedStudent.id);
      const studentDocSnapshot = await getDoc(studentDocRef);
      if (studentDocSnapshot.exists()) {
        const existingCourses = studentDocSnapshot.data().eligibleCourses || [];
        if (existingCourses.some(c => c.id === course.id)) {
          sileo.warning({ title: 'Already Added', description: "This course has already been added to the student's enrollment." });
        } else {
          existingCourses.push(course);
          await updateDoc(studentDocRef, { eligibleCourses: existingCourses });
          sileo.success({ title: 'Course Added!', description: "Course successfully added to the student's enrollment." });
        }
      } else {
        sileo.error({ title: 'Not Found', description: 'Student document not found.' });
      }
    } catch (error) {
      sileo.error({ title: 'Error', description: 'Error adding course. Please try again.' });
    }
  };

  const fetchCourses = async (formattedYear, sem) => {
    try {
      const qs = await getDocs(collection(db, 'subjects', formattedYear, sem === 'firstSemester' ? 'firstSemester' : 'secondSemester'));
      setCourseList(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) { console.error(error); }
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setSemesterModalOpen(true);
    setDropdownOpen(false);
  };

  const selectSemester = (semester) => {
    setSelectedSemester(semester);
    fetchArchivedGrades(selectedStudent, selectedYear, semester);
    setSemesterModalOpen(false);
  };

  const fetchArchivedGrades = async (student, yr, sem) => {
    setLoadingGrades(true); setSelectedStudent(student); setLoadingProgress(0);
    try {
      const semesterDoc = await getDoc(doc(collection(db, 'archivedGrades', student.id, yr), sem));
      if (semesterDoc.exists()) {
        const { grades: semesterGrades, fileUrl } = semesterDoc.data();
        setGrades([{ yearLevel: yr, semester: sem, grades: semesterGrades, fileUrl }]);
        setIsGradesModalOpen(true);
      } else {
        setGrades([]);
      }
    } catch (error) { sileo.error({ title: 'Error', description: 'An error occurred fetching records.' }); }
    finally { setLoadingGrades(false); }
  };

  const viewStudentGrades = async (student) => {
    setLoadingGrades(true); setSelectedStudent(student); setLoadingProgress(0);
    try {
      const gradesRef = doc(db, 'grades', student.id);
      const gradesDoc = await getDoc(gradesRef);
      if (!gradesDoc.exists()) {
        setGrades([]); setIsGradesModalOpen(true); setLoadingGrades(false); return;
      }
      const allGradesData = [];
      const yearLevels = ['1st year', '2nd year', '3rd year', '4th year'];
      const semesters = ['firstSemester', 'secondSemester'];
      let processed = 0, total = 8;
      for (const yl of yearLevels) {
        for (const sm of semesters) {
          const semesterDoc = await getDoc(doc(collection(gradesRef, yl), sm));
          if (semesterDoc.exists()) {
            allGradesData.push({ yearLevel: yl, semester: sm, grades: semesterDoc.data().grades, fileUrl: semesterDoc.data().fileUrl });
          }
          processed++; setLoadingProgress((processed / total) * 100);
        }
      }
      setGrades(allGradesData);
      setIsGradesModalOpen(true);
    } catch (error) { sileo.error({ title: 'Error', description: 'An error occurred fetching grades.' }); }
    finally { setLoadingGrades(false); }
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    setFilteredStudents(students.filter(student =>
      (student.firstName?.toLowerCase() || '').includes(value) ||
      (student.lastName?.toLowerCase() || '').includes(value) ||
      (student.studentId?.toLowerCase() || '').includes(value)
    ));
  };

  const closeModal = () => {
    setSelectedStudent(null); setIsGradesModalOpen(false); setGrades([]);
    setIsCoursesModalOpen(false); setIsSemesterModalOpen(false); setYearLevel(null); setSemester(null);
  };

  const handleYearLevelSelect = (level) => {
    setYearLevel(`${level}Year`);
    setIsCoursesModalOpen(false);
    setIsSemesterModalOpen(true);
  };

  const handleSemesterSelect = async (sem) => {
    const semesterFormatted = sem === '1st' ? 'firstSemester' : 'secondSemester';
    setSemester(semesterFormatted);
    await fetchCourses(yearLevel, semesterFormatted);
    setIsSemesterModalOpen(false); setShowCourses(true); setShowStudentsTable(false);
  };

  const showStudentCourses = async (student) => {
    setLoadingCourseFiles(true); setSelectedStudent(student);
    try {
      const stdDoc = await getDoc(doc(db, 'coursesToEnrollments', student.id));
      if (stdDoc.exists()) {
        const uDoc = await getDoc(doc(db, 'users', student.id));
        if (uDoc.exists()) setStudentName(`${uDoc.data().firstName} ${uDoc.data().lastName}`);

        const eligibleCourses = stdDoc.data().eligibleCourses;
        if (eligibleCourses && eligibleCourses.length > 0) {
          setCourseFiles(eligibleCourses.map(c => ({
            courseCode: c.courseCode, courseTitle: c.courseTitle,
            courseDescription: c.preRequisite || "No prerequisites",
            hoursPerSemester: c.hoursPerSemester, hoursPerWeek: c.hoursPerWeek,
            units: c.units, excludedCourses: c.excludedCourses, id: c.id
          })));
        } else { setCourseFiles([]); sileo.info({ title: 'No Courses', description: 'No courses found for this student.' }); }

        const excDoc = await getDoc(doc(db, 'excludedCourses', student.id));
        if (excDoc.exists() && excDoc.data().excludedCourses?.length > 0) {
          setExcludedCourses(excDoc.data().excludedCourses);
        } else { setExcludedCourses([]); }

        setIsCourseFilesModalOpen(true);
      } else { sileo.error({ title: 'Not Found', description: 'Student document not found.' }); }
    } catch (e) { console.error(e); }
    setLoadingCourseFiles(false);
  };

  const sendNotification = async (studentId) => {
    if (!notificationMessage.trim()) return sileo.warning({ title: 'Empty Message', description: 'Please enter a message before sending.' });
    try {
      await addDoc(collection(db, 'notifications'), { studentId, message: notificationMessage, timestamp: new Date() });
      sileo.success({ title: 'Notification Sent!', description: 'The student will receive your message.' });
      setNotificationModalOpen(false); setNotificationMessage(''); setSelectedStudent(null);
    } catch (e) { sileo.error({ title: 'Failed', description: 'Could not send the notification. Try again.' }); }
  };

  /* ─── UI COMPONENTS ─── */
  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ─── Header Section ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-2">
          Evaluation Certificates
        </h1>
        <p className="text-slate-500 mb-6 max-w-lg text-sm md:text-base">
          Manage academic evaluation certificates, view student academic histories, manage course enrollments, and print official reports.
        </p>

        <div className="flex flex-wrap gap-4">
          {/* Show Students Grades */}
          <button
            onClick={() => { setShowStudentsTable(true); setShowCourses(false); }}
            className={`flex flex-col sm:flex-row items-center sm:gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-all shadow-sm ${showStudentsTable ? 'bg-sky-50 border-sky-200 text-sky-700 ring-2 ring-sky-500/20' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <div className="bg-sky-100 p-2 rounded-lg text-sky-600 mb-2 sm:mb-0"><HiOutlineAcademicCap className="text-xl" /></div>
            <div className="text-center sm:text-left">
              <span className="block font-bold">Students & Grades</span>
            </div>
          </button>

          {/* View Courses Map */}
          <button
            onClick={() => setIsCoursesModalOpen(true)}
            className="flex flex-col sm:flex-row items-center sm:gap-3 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-medium transition-all shadow-sm focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 mb-2 sm:mb-0"><HiClipboardList className="text-xl" /></div>
            <div className="text-center sm:text-left">
              <span className="block font-bold">Subject Masterlist</span>
            </div>
          </button>

          {/* Generic Cert */}
          <button
            onClick={printEvaluationCert}
            className="flex flex-col sm:flex-row items-center sm:gap-3 px-5 py-3 rounded-xl border border-transparent bg-teal-600 text-white hover:bg-teal-700 text-sm font-medium transition-all shadow-sm focus:ring-2 focus:ring-teal-500/20"
          >
            <div className="bg-teal-500 p-2 rounded-lg text-white mb-2 sm:mb-0"><HiPrinter className="text-xl" /></div>
            <div className="text-center sm:text-left">
              <span className="block font-bold">Form ROF-042</span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── Main Table: Students ─── */}
      {showStudentsTable && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Student Evaluations</h2>
            <div className="relative w-full sm:w-64">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search students..." value={searchTerm} onChange={handleSearch} className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingStudents ? (
              <div className="p-10 text-center text-slate-500">Loading student directory...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold sticky top-0">
                  <tr>
                    <th className="px-5 py-4">Student Info</th>
                    <th className="px-5 py-4 hidden sm:table-cell">Program</th>
                    <th className="px-5 py-4">Evaluation Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan="3" className="p-8 text-center text-slate-400">No students found.</td></tr>
                  ) : filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{student.firstName} {student.middleName ? student.middleName[0] + '.' : ''} {student.lastName}</div>
                        <div className="text-slate-500 text-xs mt-0.5"><span className="font-mono bg-slate-100 px-1 rounded">{student.studentId}</span> • {student.email}</div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <div className="text-sm text-slate-700">{student.program || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{student.yearLevel || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => viewStudentGrades(student)} className="flex items-center gap-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <HiOutlineAcademicCap /> Grades
                          </button>
                          <button onClick={() => showStudentCourses(student)} className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <HiClipboardList /> Courses
                          </button>
                          <button onClick={() => { setSelectedStudent(student); setNotificationModalOpen(true); }} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                            <HiOutlineBell /> Notify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Table: Curriculum Courses ─── */}
      {showCourses && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in mt-6">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">
              Curriculum Subjects
              <span className="block text-xs font-normal text-slate-500 mt-1">{yearLevel} • {semester}</span>
            </h2>
            <button onClick={() => setShowCourses(false)} className="text-slate-400 hover:text-red-500 transition-colors">
              <HiX className="text-xl" />
            </button>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 border-r">Subject</th>
                  <th className="px-4 py-3 border-r text-center" colSpan={3}>Units (L/L/T)</th>
                  <th className="px-4 py-3 border-r text-center" colSpan={3}>Hrs/Week (L/L/T)</th>
                  <th className="px-5 py-3">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courseList.length === 0 ? (
                  <tr><td colSpan="8" className="p-10 text-center text-slate-400">No courses listed for this term.</td></tr>
                ) : courseList.map((course, idx) => (
                  <tr key={course.id || idx} className="hover:bg-slate-50">
                    <td className="px-5 py-3 border-r">
                      <div className="font-semibold text-slate-800">{course.courseCode}</div>
                      <div className="text-xs text-slate-500">{course.courseTitle}</div>
                    </td>
                    <td className="px-2 py-3 text-center text-slate-500">{course.units?.lec}</td>
                    <td className="px-2 py-3 text-center text-slate-500">{course.units?.lab}</td>
                    <td className="px-2 py-3 border-r text-center font-semibold text-slate-700">{course.units?.total}</td>

                    <td className="px-2 py-3 text-center text-slate-500">{course.hoursPerWeek?.lec}</td>
                    <td className="px-2 py-3 text-center text-slate-500">{course.hoursPerWeek?.lab}</td>
                    <td className="px-2 py-3 border-r text-center font-semibold text-slate-700">{course.hoursPerWeek?.total}</td>

                    <td className="px-5 py-3 text-xs text-slate-600">
                      <div><span className="font-semibold">Pre:</span> {course.preRequisite || 'None'}</div>
                      <div><span className="font-semibold">Co:</span> {course.coRequisite || 'None'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}

      {/* 1. Select Curriculum Year Modal */}
      <Modal isOpen={isCoursesModalOpen} onRequestClose={() => setIsCoursesModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto my-20 outline-none flex flex-col items-center" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center z-50 px-4">
        <button onClick={() => setIsCoursesModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><HiX className="text-xl" /></button>
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-4"><HiClipboardList className="text-3xl" /></div>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Select Curriculum Year</h2>
        <div className="grid grid-cols-2 gap-3 w-full">
          {[1, 2, 3, 4].map(y => (
            <button key={y} onClick={() => handleYearLevelSelect(`${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'}`)} className="bg-slate-50 border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 font-medium py-3 rounded-xl transition-all shadow-sm">
              {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
            </button>
          ))}
        </div>
      </Modal>

      {/* 2. Select Semester Modal */}
      <Modal isOpen={isSemesterModalOpen} onRequestClose={() => setIsSemesterModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto my-20 outline-none flex flex-col items-center" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center z-50 px-4">
        <button onClick={() => setIsSemesterModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><HiX className="text-xl" /></button>
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4"><HiOutlineAcademicCap className="text-3xl" /></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Select Semester</h2>
        <p className="text-sm text-slate-500 mb-6 text-center">Which semester of {yearLevel} do you want to view?</p>
        <div className="flex flex-col w-full gap-3">
          <button onClick={() => handleSemesterSelect('1st')} className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 font-semibold py-3 rounded-xl transition-all shadow-sm">First Semester</button>
          <button onClick={() => handleSemesterSelect('2nd')} className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 font-semibold py-3 rounded-xl transition-all shadow-sm">Second Semester</button>
        </div>
      </Modal>

      {/* 3. Notify Student Modal */}
      <Modal isOpen={isNotificationModalOpen} onRequestClose={() => setNotificationModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto my-20 outline-none flex flex-col" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center z-50 px-4">
        <button onClick={() => setNotificationModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><HiX className="text-xl" /></button>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Send Notification</h2>
        <p className="text-xs text-slate-500 mb-4">To: <span className="font-semibold text-slate-700">{selectedStudent?.firstName} {selectedStudent?.lastName}</span></p>
        <textarea value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} rows="4" placeholder="Type your message here..." className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 mb-5 resize-none" />
        <button onClick={() => sendNotification(selectedStudent?.id)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl shadow-sm transition-all">Send Message</button>
      </Modal>

      {/* 4. Student Grades View Modal */}
      <Modal isOpen={isGradesModalOpen} onRequestClose={closeModal} className="relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-5xl mx-auto my-10 outline-none overflow-hidden max-h-[85vh] flex flex-col" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 px-4 pt-10">
        <div className="bg-slate-900 px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Academic Record</h2>
            <p className="text-sm text-slate-400 mt-0.5">{selectedStudent?.firstName} {selectedStudent?.lastName} • {selectedStudent?.studentId}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Year Dropdown */}
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
                View Archives
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl w-40 overflow-hidden z-20">
                  {['1st year', '2nd year', '3rd year', '4th year'].map((yr) => (
                    <button key={yr} onClick={() => { handleYearSelect(yr); setDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 border-b border-slate-50 last:border-0">
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><HiX className="text-xl" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loadingGrades ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-48 bg-slate-200 rounded-full h-2 mb-4 overflow-hidden"><div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }}></div></div>
              <p className="text-slate-500 font-medium">Fetching academic records...</p>
            </div>
          ) : grades.length > 0 ? (
            <div className="space-y-8">
              {grades.map((g, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wide text-sm">{g.yearLevel} • <span className="text-slate-500">{g.semester}</span></h3>
                    {g.fileUrl && <a href={g.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline decoration-teal-300 underline-offset-2">View Source Doc</a>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-5 py-2 font-medium border-b">Code</th>
                          <th className="px-5 py-2 font-medium border-b">Title</th>
                          <th className="px-5 py-2 font-medium border-b text-center">Grade</th>
                          <th className="px-5 py-2 font-medium border-b text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {g.grades.map((sub, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-2.5 font-semibold text-slate-700">{sub.courseCode}</td>
                            <td className="px-5 py-2.5 text-slate-600 line-clamp-1" title={sub.courseTitle}>{sub.courseTitle}</td>
                            <td className="px-5 py-2.5 text-center font-bold text-slate-800">{sub.grade}</td>
                            <td className="px-5 py-2.5 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${sub.status === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : sub.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{sub.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><HiOutlineDocumentText className="text-3xl text-slate-300" /></div>
              <p>No academic grades recorded for this student.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* 5. Student Custom Course Enrollment Modal */}
      <Modal isOpen={isCourseFilesModalOpen} onRequestClose={() => setIsCourseFilesModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-5xl mx-auto my-10 outline-none overflow-hidden max-h-[85vh] flex flex-col" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 px-4 pt-10">
        <div className="bg-teal-600 px-6 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Active Enrollment Profile</h2>
            <p className="text-sm text-teal-100 mt-0.5">{studentName}</p>
          </div>
          <button onClick={() => setIsCourseFilesModalOpen(false)} className="text-teal-200 hover:text-white transition-colors bg-white/10 p-2 rounded-full"><HiX className="text-xl" /></button>
        </div>

        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap gap-3 items-center shrink-0">
          <button onClick={() => setShowExcludedCourses(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${!showExcludedCourses ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-500/20' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}>Eligible Subjects</button>
          <button onClick={() => setShowExcludedCourses(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${showExcludedCourses ? 'bg-red-100 text-red-800 ring-2 ring-red-500/20' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'}`}>Excluded Subjects <span className="bg-red-200 text-red-800 py-0.5 px-1.5 rounded-md text-[10px] ml-1">{excludedCourses.length}</span></button>
          <div className="flex-1" />
          <button onClick={() => setIsCourseModalOpen(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"><HiPlus /> Add Extra Course</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loadingCourseFiles ? (<div className="text-center py-10 text-slate-500">Loading enrollment data...</div>) : showExcludedCourses ? (
            /* Excluded Courses Table */
            <div className="border border-red-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-red-50 text-red-700 uppercase text-xs font-semibold">
                  <tr><th className="px-5 py-3 border-b border-red-100">Course Code</th><th className="px-5 py-3 border-b border-red-100">Title</th><th className="px-5 py-3 border-b border-red-100">Prerequisite</th></tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {excludedCourses.length === 0 ? (<tr><td colSpan="3" className="p-8 text-center text-slate-400">No excluded courses found.</td></tr>) :
                    excludedCourses.map((c, i) => (<tr key={i} className="hover:bg-red-50/50"><td className="px-5 py-3 font-semibold text-slate-700">{c.courseCode}</td><td className="px-5 py-3 text-slate-600">{c.courseTitle}</td><td className="px-5 py-3 text-slate-500 text-xs">{c.preRequisite}</td></tr>))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Enrolled/Eligible Courses Table */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
                  <tr><th className="px-5 py-3 border-b border-slate-200">Class Details</th><th className="px-5 py-3 border-b border-slate-200 text-center border-l">Units (L/L/T)</th><th className="px-5 py-3 border-b border-slate-200">Prerequisite</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courseFiles.length === 0 ? (<tr><td colSpan="3" className="p-8 text-center text-slate-400">No scheduled courses for enrollment.</td></tr>) :
                    courseFiles.map((c, i) => (<tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3"><div className="font-semibold text-slate-800">{c.courseCode}</div><div className="text-slate-500 text-xs">{c.courseTitle}</div></td>
                      <td className="px-5 py-3 border-l text-center"><span className="text-slate-400">{c.units?.lec} / {c.units?.lab} / </span><span className="font-bold text-slate-700">{c.units?.total}</span></td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{c.preRequisite}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Adding Courses Specific Drawer/Modals -> Year -> Semester -> Course Picker */}
      {/* Year (Add Course) */}
      <Modal isOpen={isCourseModalOpen} onRequestClose={() => setIsCourseModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto my-20 outline-none flex flex-col items-center z-50" overlayClassName="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-[60] px-4">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pick Subject Year Level</h2>
        <div className="grid grid-cols-2 gap-3 w-full mb-6">
          {[1, 2, 3, 4].map(y => <button key={y} onClick={() => handleYearSelection(y)} className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-400 font-medium py-3 rounded-xl transition-all shadow-sm">{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</button>)}
        </div>
        <button onClick={() => setIsCourseModalOpen(false)} className="w-full text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors">Cancel</button>
      </Modal>
      {/* Sem (Add Course) */}
      <Modal isOpen={isSemesterSelectionModalOpen} onRequestClose={() => setIsSemesterSelectionModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto my-20 outline-none flex flex-col items-center z-50" overlayClassName="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center z-[60] px-4">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Pick Subject Semester</h2>
        <div className="flex flex-col w-full gap-3 mb-6">
          <button onClick={() => handleSemesterSelection('firstSemester')} className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-400 font-medium py-3 rounded-xl transition-all shadow-sm">First Semester</button>
          <button onClick={() => handleSemesterSelection('secondSemester')} className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-teal-50 hover:border-teal-400 font-medium py-3 rounded-xl transition-all shadow-sm">Second Semester</button>
        </div>
        <button onClick={() => setIsSemesterSelectionModalOpen(false)} className="w-full text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors">Cancel</button>
      </Modal>
      {/* Course List Picker */}
      <Modal isOpen={isSubjectModalOpen} onRequestClose={() => setIsSubjectModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-4xl mx-auto my-10 outline-none overflow-hidden max-h-[85vh] flex flex-col z-50" overlayClassName="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-start justify-center z-[60] px-4 pt-10">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-bold">Add Extra Subject</h2>
          <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white"><HiX /></button>
        </div>
        <div className="flex-1 overflow-y-auto bg-white p-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold sticky top-0 border-b border-slate-200">
              <tr><th className="p-3">Course</th><th className="p-3 text-center">Units</th><th className="p-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courseList.length === 0 ? (<tr><td colSpan="3" className="p-10 text-center text-slate-400">No courses available.</td></tr>) :
                courseList.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3"><div className="font-semibold text-slate-800">{c.courseCode}</div><div className="text-slate-500 text-xs">{c.courseTitle}</div></td>
                    <td className="p-3 text-center font-bold text-slate-600 border-x border-slate-100">{c.units?.total}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleAddCourse(c)} className="bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Schedule</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── Global Message Modal ─── */}
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto text-center outline-none z-[100]" overlayClassName="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${modalType === 'success' ? 'bg-teal-100' : modalType === 'warning' ? 'bg-amber-100' : 'bg-red-100'}`}>
          {modalType === 'success' ? <HiOutlineCheckCircle className="text-3xl text-teal-600" /> : modalType === 'warning' ? <HiOutlineExclamation className="text-3xl text-amber-500" /> : <HiOutlineXCircle className="text-3xl text-red-500" />}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{modalType === 'success' ? 'Success!' : modalType === 'warning' ? 'Attention' : 'Error'}</h2>
        <p className="text-sm text-slate-500 mb-6">{modalMessage}</p>
        <button onClick={() => setIsModalOpen(false)} className={`w-full py-3 rounded-xl text-white font-medium ${modalType === 'success' ? 'bg-teal-600 hover:bg-teal-700' : modalType === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}>
          Acknowledge
        </button>
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ViewEvaluationCert;
