import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import {
  HiOutlineUserGroup,
  HiOutlineFolderAdd,
  HiOutlineCollection,
  HiOutlineX,
  HiCheckCircle,
  HiX,
  HiPencil,
  HiTrash,
  HiPlus,
  HiOutlineSave,
  HiSearch,
  HiExclamationCircle,
  HiOutlineEye
} from 'react-icons/hi';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc, query, where } from 'firebase/firestore';

Modal.setAppElement('#root');

const CreateSection = () => {
  // Main state
  const [showStudents, setShowStudents] = useState(false);
  const [showSections, setShowSections] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);

  // Create Section form
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [formData, setFormData] = useState({
    className: '', subjectCode: '', subjectDescription: '',
    units: '', schedule: '', room: '', instructor: '', section: ''
  });

  // Dynamic Modals
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [sectionId, setSectionId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Status Modals
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', message: '' });

  /* ─── Fetchers ─── */
  const fetchStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'Student'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(list);
    } catch (e) { console.error(e); }
  };

  const fetchSections = async () => {
    try {
      const snap = await getDocs(collection(db, 'sections'));
      setSections(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
  };

  /* ─── Handlers ─── */
  const handleViewStudents = async () => {
    setShowSections(false);
    await fetchStudents();
    setShowStudents(true);
  };

  const handleViewSections = async () => {
    setShowStudents(false);
    await fetchSections();
    setShowSections(true);
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    const { className, subjectCode, subjectDescription, units, schedule, room, instructor, section } = formData;
    if (!className || !subjectCode || !subjectDescription || !units || !schedule || !room || !instructor || !section) {
      setStatusModal({ isOpen: true, type: 'error', message: 'All fields are required.' });
      return;
    }
    try {
      await addDoc(collection(db, 'sections'), formData);
      setStatusModal({ isOpen: true, type: 'success', message: 'Section crated successfully!' });
      setIsCreateSectionOpen(false);
      setFormData({ className: '', subjectCode: '', subjectDescription: '', units: '', schedule: '', room: '', instructor: '', section: '' });
      if (showSections) fetchSections();
    } catch (e) {
      setStatusModal({ isOpen: true, type: 'error', message: 'Error creating section.' });
    }
  };

  const handleViewEnrolledStudents = async (sId) => {
    setSelectedSectionId(sId);
    try {
      const secDoc = await getDoc(doc(db, 'sections', sId));
      if (secDoc.exists()) setSectionName(secDoc.data().className);

      const snap = await getDocs(collection(doc(db, 'sections', sId), 'studentEnrolled'));
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsStudentsModalOpen(true);
    } catch (e) { console.error(e); }
  };

  const handleAddStudentToSectionClick = async (sId) => {
    setSectionId(sId);
    await fetchStudents();
    setShowAddStudentModal(true);
  };

  const enrollStudent = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      const ref = doc(collection(db, 'sections', sectionId, 'studentEnrolled'), studentId);
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        setStatusModal({ isOpen: true, type: 'error', message: 'Student already enrolled.' });
        return;
      }
      await setDoc(ref, {
        enrolled: true, firstName: student.firstName, lastName: student.lastName,
        middleName: student.middleName, contactNumber: student.contactNumber,
        yearLevel: student.yearLevel, program: student.program,
        studentId: student.studentId, email: student.email, createdAt: new Date()
      });
      setShowAddStudentModal(false);
      setStatusModal({ isOpen: true, type: 'success', message: 'Student enrolled successfully!' });
    } catch (e) {
      setStatusModal({ isOpen: true, type: 'error', message: 'Failed to enroll student.' });
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', selectedStudent.id), {
        firstName: selectedStudent.firstName, middleName: selectedStudent.middleName,
        lastName: selectedStudent.lastName, email: selectedStudent.email,
        yearLevel: selectedStudent.yearLevel, contactNumber: selectedStudent.contactNumber,
        program: selectedStudent.program, address: selectedStudent.address,
      });

      if (selectedSectionId) {
        const enrRef = doc(db, 'sections', selectedSectionId, 'studentEnrolled', selectedStudent.id);
        await updateDoc(enrRef, {
          firstName: selectedStudent.firstName, middleName: selectedStudent.middleName,
          lastName: selectedStudent.lastName, email: selectedStudent.email,
          yearLevel: selectedStudent.yearLevel, contactNumber: selectedStudent.contactNumber,
          program: selectedStudent.program, address: selectedStudent.address,
        });
      }
      setIsStudentDetailsModalOpen(false);
      setStatusModal({ isOpen: true, type: 'success', message: 'Student profile updated!' });
      if (showStudents) fetchStudents();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', studentToDelete.id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
      if (showStudents) fetchStudents();
      setStatusModal({ isOpen: true, type: 'success', message: 'Student deleted successfully.' });
    } catch (e) {
      setStatusModal({ isOpen: true, type: 'error', message: 'Failed to delete student.' });
    }
  };

  // Filtered lists
  const filteredStudents = students.filter(s =>
    (s.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ─── Header Section ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-2">
          Students & Sections
        </h1>
        <p className="text-slate-500 mb-6 max-w-lg text-sm md:text-base">
          Manage academic sections, enroll students into specific classes, and view comprehensive student masterlists.
        </p>

        <div className="flex flex-wrap gap-4">
          <button onClick={handleViewStudents} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors border shadow-sm ${showStudents ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <HiOutlineUserGroup className="text-lg" /> All Students
          </button>
          <button onClick={handleViewSections} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors border shadow-sm ${showSections ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <HiOutlineCollection className="text-lg" /> All Sections
          </button>
          <button onClick={() => setIsCreateSectionOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm bg-teal-600 text-white hover:bg-teal-700">
            <HiPlus className="text-lg" /> Create Section
          </button>
        </div>
      </div>

      {/* ─── Table: Sections ─── */}
      {showSections && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Section Directory</h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{sections.length} Sections</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-5 py-4">Class Details</th>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Instructor</th>
                  <th className="px-5 py-4 hidden md:table-cell">Schedule & Room</th>
                  <th className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-slate-400">No sections found.</td></tr>
                ) : sections.map(sec => (
                  <tr key={sec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{sec.className}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Sec: {sec.section || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-700">{sec.subjectCode}</div>
                      <div className="text-slate-400 text-xs truncate max-w-[200px]" title={sec.subjectDescription}>{sec.subjectDescription}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{sec.instructor}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="text-sm text-slate-700">{sec.schedule}</div>
                      <div className="text-xs text-slate-500">Room: {sec.room} • {sec.units} Units</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleViewEnrolledStudents(sec.id)} className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          View Roster
                        </button>
                        <button onClick={() => handleAddStudentToSectionClick(sec.id)} className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                          Add Student
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Table: Students ─── */}
      {showStudents && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Student Directory</h2>
            <div className="relative w-full sm:w-64">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search ID or Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-4">Student Info</th>
                  <th className="px-5 py-4 hidden sm:table-cell">Program & Year</th>
                  <th className="px-5 py-4 hidden lg:table-cell">Address</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-400">No students found.</td></tr>
                ) : filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{student.firstName} {student.lastName}</div>
                      <div className="text-slate-500 text-xs mt-0.5"><span className="font-mono bg-slate-100 px-1 rounded">{student.studentId}</span> • {student.email}</div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <div className="text-sm text-slate-700">{student.program || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{student.yearLevel || 'N/A'}</div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-sm text-slate-600 truncate max-w-[200px]" title={student.address}>
                      {student.address || '—'}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => { setSelectedStudent(student); setIsStudentDetailsModalOpen(true); }} className="text-slate-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50 transition-colors inline-block" title="Edit">
                        <HiPencil className="text-lg" />
                      </button>
                      <button onClick={() => { setStudentToDelete(student); setShowDeleteModal(true); }} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors inline-block" title="Delete">
                        <HiTrash className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal: Create Section ─── */}
      <Modal isOpen={isCreateSectionOpen} onRequestClose={() => setIsCreateSectionOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-auto my-10 outline-none" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 px-4 overflow-y-auto pt-20">
        <button onClick={() => setIsCreateSectionOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <HiOutlineFolderAdd className="text-teal-600" /> Create New Section
        </h2>
        <form onSubmit={handleCreateSection} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { id: 'className', label: 'Class Name', type: 'text' },
            { id: 'section', label: 'Section Label', type: 'text' },
            { id: 'subjectCode', label: 'Subject Code', type: 'text' },
            { id: 'units', label: 'Units', type: 'number' },
            { id: 'schedule', label: 'Schedule', type: 'text' },
            { id: 'room', label: 'Room', type: 'text' },
            { id: 'instructor', label: 'Instructor', type: 'text' }
          ].map(f => (
            <div key={f.id} className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">{f.label}</label>
              <input type={f.type} value={formData[f.id]} onChange={e => setFormData({ ...formData, [f.id]: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
          ))}
          <div className="flex flex-col sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Subject Description</label>
            <textarea rows="2" value={formData.subjectDescription} onChange={e => setFormData({ ...formData, subjectDescription: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setIsCreateSectionOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
              <HiOutlineSave /> Save Section
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Modal: View Enrolled Students ─── */}
      <Modal isOpen={isStudentsModalOpen} onRequestClose={() => setIsStudentsModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto my-10 outline-none overflow-hidden" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 px-4 overflow-y-auto pt-20">
        <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center text-white">
          <div><h2 className="text-xl font-bold">Class Roster</h2><p className="text-xs text-indigo-200">{sectionName}</p></div>
          <button onClick={() => setIsStudentsModalOpen(false)} className="text-white/70 hover:text-white"><HiOutlineX className="text-2xl" /></button>
        </div>
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase sticky top-0">
              <tr>
                <th className="px-5 py-3 border-b">Student</th>
                <th className="px-5 py-3 border-b">Program</th>
                <th className="px-5 py-3 border-b">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr><td colSpan="3" className="p-8 text-center text-slate-400">No students enrolled yet.</td></tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{s.firstName} {s.lastName}</div>
                    <div className="text-slate-500 text-xs font-mono">{s.studentId}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{s.program} ({s.yearLevel})</td>
                  <td className="px-5 py-3 text-slate-600">{s.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── Modal: Add Student to Section ─── */}
      <Modal isOpen={showAddStudentModal} onRequestClose={() => setShowAddStudentModal(false)} className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-3xl mx-auto outline-none flex flex-col max-h-[85vh]" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <button onClick={() => setShowAddStudentModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><HiOutlineX className="text-xl" /></button>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Enroll Student</h2>
        <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 text-xs uppercase shadow-sm">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map(s => (
                <tr key={s.id} className="hover:bg-teal-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{s.firstName} {s.lastName}</td>
                  <td className="px-4 py-3 text-slate-500">{s.email}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => enrollStudent(s.id)} className="bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      Enroll
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ─── Modal: Edit Student ─── */}
      {selectedStudent && (
        <Modal isOpen={isStudentDetailsModalOpen} onRequestClose={() => setIsStudentDetailsModalOpen(false)} className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl mx-auto my-10 outline-none" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center z-50 px-4 pt-10 overflow-y-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-4">
            <HiPencil className="text-teal-600" /> Edit Student Data
          </h2>
          <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { id: 'firstName', label: 'First Name' },
              { id: 'lastName', label: 'Last Name' },
              { id: 'email', label: 'Email' },
              { id: 'contactNumber', label: 'Contact' },
              { id: 'program', label: 'Program' },
            ].map(f => (
              <div key={f.id} className="flex flex-col">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1">{f.label}</label>
                <input type="text" value={selectedStudent[f.id] || ''} onChange={e => setSelectedStudent({ ...selectedStudent, [f.id]: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
              </div>
            ))}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Year Level</label>
              <select value={selectedStudent.yearLevel || ''} onChange={e => setSelectedStudent({ ...selectedStudent, yearLevel: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                <option value="">Select...</option>
                {['1st year', '2nd year', '3rd year', '4th year'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase mb-1">Address</label>
              <input type="text" value={selectedStudent.address || ''} onChange={e => setSelectedStudent({ ...selectedStudent, address: e.target.value })} className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsStudentDetailsModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── Modal: Confirm Delete ─── */}
      <Modal isOpen={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto text-center outline-none" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <HiTrash className="text-3xl text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Student?</h2>
        <p className="text-sm text-slate-500 mb-6">Are you sure you want to continuously delete <strong>{studentToDelete?.firstName} {studentToDelete?.lastName}</strong>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200">Cancel</button>
          <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600">Delete</button>
        </div>
      </Modal>

      {/* ─── Status Modal (Success/Error) ─── */}
      <Modal isOpen={statusModal.isOpen} onRequestClose={() => setStatusModal({ ...statusModal, isOpen: false })} className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto text-center outline-none" overlayClassName="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${statusModal.type === 'success' ? 'bg-teal-100' : 'bg-red-100'}`}>
          {statusModal.type === 'success' ? <HiCheckCircle className="text-3xl text-teal-600" /> : <HiExclamationCircle className="text-3xl text-red-500" />}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{statusModal.type === 'success' ? 'Success!' : 'Error'}</h2>
        <p className="text-sm text-slate-500 mb-6">{statusModal.message}</p>
        <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className={`w-full py-3 rounded-xl text-white font-medium ${statusModal.type === 'success' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-500 hover:bg-red-600'}`}>
          Continue
        </button>
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CreateSection;
