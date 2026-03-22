import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase'; // storage import removed — using Cloudinary
import { collection, getDocs, deleteDoc, getDoc, setDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
// Firebase Storage removed — all uploads go through Cloudinary; deletes remove only the Firestore record
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { sileo } from 'sileo';
import {
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineClipboardList,
  HiOutlineTrash,
  HiOutlineX,
  HiBell,
  HiChevronRight,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
} from 'react-icons/hi';

const ManageCourses = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [activeNotification, setActiveNotification] = useState(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [courses, setCourses] = useState([]);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCoursesModalOpen, setIsCoursesModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  const auth = getAuth();
  const fileInputRef = useRef(null);

  /* ── Auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);

  /* ── Notifications ── */
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'notifications'), where('studentId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser]);

  /* ── Uploaded files ── */
  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchFiles = async () => {
      const filesCol = collection(db, 'coursesToEnroll', auth.currentUser.uid, 'files');
      const snap = await getDocs(filesCol);
      setUploadedFiles(snap.docs.map((d) => d.data()));
    };
    fetchFiles();
  }, [auth.currentUser]);

  /* ── Cloudinary config ── */
  const CLOUDINARY_CLOUD_NAME = 'dqndurz00';
  const CLOUDINARY_UPLOAD_PRESET = 'gradeeval'; // must be Unsigned in Cloudinary console

  /**
   * Build the correct view URL for a file.
   * Cloudinary image/upload PDFs are served inline by default — no transformation needed.
   * Just return the direct URL so the browser's native PDF viewer handles it.
   */
  const getViewUrl = (fileUrl) => fileUrl ?? '';

  /**
   * Resource type for Cloudinary upload:
   * - Images & PDFs → 'image' (Cloudinary supports PDFs under image/upload
   *   and we can then apply fl_attachment transformation on the view URL)
   * - Word docs, zip, etc. → 'raw'
   */
  const getCloudinaryResourceType = (file) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      return 'image';
    }
    return 'raw';
  };

  /* ── Upload handler (Cloudinary) ── */
  const handleUploadFile = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const resourceType = getCloudinaryResourceType(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'courses');

      // Use the correct resource_type endpoint so Chrome can open the file
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error('Cloudinary upload failed.');
      const data = await res.json();
      const downloadURL = data.secure_url;

      const userId = auth.currentUser.uid;
      await setDoc(doc(db, 'coursesToEnroll', userId, 'files', file.name), {
        fileName: file.name,
        fileUrl: downloadURL,
        resourceType, // store so we know how to display it
        uploadedAt: new Date(),
      });
      setUploadedFiles((prev) => [...prev, { fileName: file.name, fileUrl: downloadURL, resourceType }]);
      setFile(null);
      setIsUploadModalOpen(false);
      sileo.success({ title: 'File Uploaded!', description: `${file.name} was uploaded successfully.` });
    } catch (err) {
      console.error('Upload error:', err);
      sileo.error({ title: 'Upload Failed', description: 'Could not upload the file. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  /* ── Delete handler ── */
  // Note: Cloudinary deletion from client-side requires a signed request (API secret).
  // We delete the Firestore record so the file no longer appears in the UI.
  const handleDelete = async () => {
    if (!fileToDelete) return;
    try {
      const userId = auth.currentUser.uid;
      const fileRef = doc(db, 'coursesToEnroll', userId, 'files', fileToDelete);
      const snap = await getDoc(fileRef);
      if (!snap.exists()) return;
      await deleteDoc(fileRef);
      setUploadedFiles((prev) => prev.filter((f) => f.fileName !== fileToDelete));
      setIsDeleteConfirmOpen(false);
      setFileToDelete(null);
      sileo.success({ title: 'File Deleted', description: 'The file has been removed from your uploads.' });
    } catch (err) {
      console.error(err);
      sileo.error({ title: 'Delete Failed', description: 'Could not remove the file. Please try again.' });
    }
  };

  /* ── Fetch enrollment courses ── */
  const fetchCourses = async () => {
    if (!auth.currentUser) return;
    const snap = await getDocs(collection(db, 'coursesToEnrollments'));
    const data = snap.docs.flatMap((d) => {
      const doc = d.data();
      return Array.isArray(doc.eligibleCourses) ? doc.eligibleCourses : [];
    });
    if (data.length > 0) { setCourses(data); setIsCoursesModalOpen(true); }
  };

  /* ── Notification navigation ── */
  const openNotification = (n) => {
    const idx = notifications.findIndex((x) => x.id === n.id);
    setCurrentNotificationIndex(idx);
    setActiveNotification(n);
    setIsNotificationModalOpen(true);
  };
  const nextNotification = () => {
    const idx = (currentNotificationIndex + 1) % notifications.length;
    setCurrentNotificationIndex(idx);
    setActiveNotification(notifications[idx]);
  };

  /* ── Action cards config ── */
  const cards = [
    {
      id: 'upload',
      icon: HiOutlineUpload,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      accentBorder: 'border-l-violet-500',
      title: 'Upload Course',
      desc: 'Submit a fillable PDF or document for your evaluator to review your eligible courses.',
      action: () => setIsUploadModalOpen(true),
      label: 'Upload Now',
      btnClass: 'bg-violet-600 hover:bg-violet-700',
    },
    {
      id: 'view',
      icon: HiOutlineDocumentText,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      accentBorder: 'border-l-indigo-500',
      title: 'My Uploaded Courses',
      desc: 'View and manage the course documents you have uploaded to your evaluator.',
      action: () => setIsViewModalOpen(true),
      label: 'View Files',
      btnClass: 'bg-indigo-600 hover:bg-indigo-700',
      badge: notifications.length,
    },
    {
      id: 'enroll',
      icon: HiOutlineClipboardList,
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      accentBorder: 'border-l-teal-500',
      title: 'Courses to Enroll',
      desc: 'View the list of courses you are eligible to enroll in for next semester.',
      action: fetchCourses,
      label: 'View Courses',
      btnClass: 'bg-teal-600 hover:bg-teal-700',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Upload course documents and view your enrollment eligibility.</p>
        </div>

        {/* Notification bell */}
        {notifications.length > 0 && (
          <button
            onClick={() => openNotification(notifications[0])}
            className="relative flex items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <HiBell className="text-lg" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
              {notifications.length}
            </span>
          </button>
        )}
      </div>

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-l-4 ${card.accentBorder} p-5 flex flex-col gap-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`text-xl ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{card.title}</h3>
                </div>
                {card.badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {card.badge}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed flex-1">{card.desc}</p>

              <button
                onClick={card.action}
                className={`w-full ${card.btnClass} text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2`}
              >
                {card.label}
                <HiChevronRight className="text-base" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════ */}

      {/* ── Upload Modal ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Upload Course File</h3>
              <button onClick={() => { setIsUploadModalOpen(false); setFile(null); }} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Submit a PDF or document for your evaluator to review your course eligibility.</p>

            {/* Drop zone */}
            <div
              className="border-2 border-dashed border-slate-300 hover:border-violet-400 rounded-xl p-6 text-center cursor-pointer transition-colors mb-5"
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlineUpload className="text-3xl text-slate-400 mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-semibold text-violet-600">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-600">Click to choose a file</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, JPG, PNG</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                onChange={(e) => e.target.files[0] && setFile(e.target.files[0])}
                className="hidden"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setIsUploadModalOpen(false); setFile(null); }}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadFile}
                disabled={uploading || !file}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
                ) : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Uploaded Files Modal ── */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-lg">Uploaded Course Files</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12">
                <HiOutlineDocumentText className="text-5xl text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No files uploaded yet.</p>
                <p className="text-slate-400 text-xs mt-1">Upload a course document to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <HiOutlineDocumentText className="text-xl text-indigo-500 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-slate-700 truncate">{f.fileName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={getViewUrl(f.fileUrl, f.fileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <HiOutlineEye /> View
                      </a>
                      <button
                        onClick={() => { setFileToDelete(f.fileName); setIsDeleteConfirmOpen(true); }}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                      >
                        <HiOutlineTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsViewModalOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Courses to Enroll Modal ── */}
      {isCoursesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Courses Eligible for Enrollment</h3>
                <p className="text-xs text-slate-500 mt-0.5">{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
              </div>
              <button onClick={() => setIsCoursesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="overflow-auto flex-1 rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Units (Lec / Lab / Total)</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Week (Lec / Lab / Total)</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider" colSpan={3}>Hrs/Sem (Lec / Lab / Total)</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Pre-Req</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-violet-700 text-xs whitespace-nowrap">{course.courseCode}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium max-w-xs">{course.courseTitle}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.units?.lec ?? '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.units?.lab ?? '—'}</td>
                      <td className="px-4 py-2 text-center font-semibold text-slate-800">{course.units?.total ?? '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.hoursPerWeek?.lec ?? '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.hoursPerWeek?.lab ?? '—'}</td>
                      <td className="px-4 py-2 text-center font-semibold text-slate-800">{course.hoursPerWeek?.total ?? '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.hoursPerSemester?.lec ?? '—'}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{course.hoursPerSemester?.lab ?? '—'}</td>
                      <td className="px-4 py-2 text-center font-semibold text-slate-800">{course.hoursPerSemester?.total ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{course.preRequisite || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setIsCoursesModalOpen(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Notification Modal ── */}
      {isNotificationModalOpen && activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <HiBell className="text-rose-500" />
                </div>
                <h3 className="font-bold text-slate-800">From your Evaluator</h3>
              </div>
              <button onClick={() => setIsNotificationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Notification {currentNotificationIndex + 1} of {notifications.length}
            </p>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-slate-800 leading-relaxed">{activeNotification.message}</p>
            </div>

            <div className="flex gap-3">
              {notifications.length > 1 && (
                <button
                  onClick={nextNotification}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                >
                  Next
                </button>
              )}
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="text-2xl text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Delete File?</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently remove <span className="font-semibold text-slate-700">{fileToDelete}</span> from your uploads. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsDeleteConfirmOpen(false); setFileToDelete(null); }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
