import React, { useState, useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import {
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineFolder,
  HiChevronDown,
  HiOutlineLogout,
  HiOutlineFolderAdd,
  HiOutlineX,
  HiMenuAlt2,
} from 'react-icons/hi';

import Modal from 'react-modal';

import EncodeGrades from './EncodeGrades';
import UploadStudentMasterlist from './UploadStudentMasterlist';
import CreateSubjects from './CreateSubject';
import CreateSection from './CreateSection';
import ViewEvaluationCert from './ViewEvaluationCert';
import EditStudentProfile from './EditStudentProfile';

Modal.setAppElement('#root');

/* ─── nav config ─────────────────────────────────── */
const NAV = [
  {
    id: 'residency',
    label: 'Analyze Residency',
    icon: HiOutlineUser,
    to: '/faculty-dashboard/upload-student-masterlist',
  },
  {
    id: 'courses',
    label: 'Manage Courses',
    icon: HiOutlineBriefcase,
    children: [
      {
        label: 'Students & Sections',
        icon: HiOutlineFolderAdd,
        to: '/faculty-dashboard/create-section',
      },
    ],
  },
  {
    id: 'cert',
    label: 'Evaluation Cert',
    icon: HiOutlineFolder,
    to: '/faculty-dashboard/view-evaluation-cert',
  },
];

/* ─── helpers ────────────────────────────────────── */
function getInitials(email = '') {
  return email.split('@')[0].slice(0, 2).toUpperCase();
}

/* ─── sidebar nav item ───────────────────────────── */
function NavItem({ item, location, onNavigate }) {
  const [open, setOpen] = useState(false);
  const isActive = item.to
    ? location.pathname === item.to || location.pathname.startsWith(item.to)
    : item.children?.some((c) => location.pathname.startsWith(c.to));

  const Icon = item.icon;

  if (item.children) {
    return (
      <li>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
            ${isActive
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
        >
          <Icon className="text-lg flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <HiChevronDown
            className={`text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* sub-items */}
        <ul
          className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 mt-1' : 'max-h-0'
            }`}
        >
          {item.children.map((child) => {
            const CIcon = child.icon;
            const childActive = location.pathname.startsWith(child.to);
            return (
              <li key={child.to}>
                <Link
                  to={child.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl text-sm transition-all duration-200
                    ${childActive
                      ? 'text-white bg-white/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <CIcon className="text-base flex-shrink-0" />
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.to}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${isActive
            ? 'bg-white/10 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        {/* active pill */}
        <span
          className={`absolute left-0 w-1 h-6 rounded-r-full bg-teal-400 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'
            }`}
        />
        <Icon className="text-lg flex-shrink-0" />
        <span>{item.label}</span>
        {isActive && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
        )}
      </Link>
    </li>
  );
}

/* ─── main component ─────────────────────────────── */
const FacultyDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEvaluator, setIsEvaluator] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || '');
        const snap = await getDoc(doc(db, 'evaluators', user.uid));
        if (snap.exists() && snap.data().role === 'evaluator') {
          setIsEvaluator(true);
        } else {
          navigate('/unauthorized');
        }
      } else {
        navigate('/login');
      }
    });
    return unsub;
  }, [auth, navigate, db]);

  if (!isAuthenticated || !isEvaluator) return null;

  const handleLogout = () =>
    signOut(auth).then(() => navigate('/login')).catch(console.error);

  /* ── sidebar content (shared between desktop & mobile) ── */
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* brand */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </span>
          <div>
            <p className="text-white text-sm font-semibold leading-none">Faculty</p>
            <p className="text-slate-400 text-xs mt-0.5">Dashboard</p>
          </div>
        </div>
      </div>

      {/* divider */}
      <div className="mx-5 h-px bg-white/5 mb-4" />

      {/* nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Navigation
        </p>
        <ul className="space-y-0.5 relative">
          {NAV.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              location={location}
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </ul>
      </nav>

      {/* footer / user */}
      <div className="mx-3 mb-4 mt-4">
        <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center gap-3">
          {/* avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {getInitials(userEmail)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userEmail}</p>
            <p className="text-slate-500 text-[10px]">Evaluator</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            title="Logout"
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <HiOutlineLogout className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}
      >
        {sidebar}
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col md:hidden transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)' }}
      >
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <HiOutlineX className="text-xl" />
        </button>
        {sidebar}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <HiMenuAlt2 className="text-2xl" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Faculty Dashboard</span>
        </header>

        <main className="flex-1 p-5 md:p-7 overflow-auto">
          <Routes>
            <Route path="encode-grades" element={<EncodeGrades />} />
            <Route path="upload-student-masterlist" element={<UploadStudentMasterlist />} />
            <Route path="create-subjects" element={<CreateSubjects />} />
            <Route path="create-section" element={<CreateSection />} />
            <Route path="view-evaluation-cert" element={<ViewEvaluationCert />} />
            <Route path="edit-student-profile" element={<EditStudentProfile />} />
            <Route
              path="/"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                  <span className="text-5xl mb-4">👋</span>
                  <p className="text-lg font-medium text-slate-600">Welcome back!</p>
                  <p className="text-sm mt-1">Select an option from the sidebar to get started.</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* ── Logout modal ── */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-auto text-center outline-none"
        overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      >
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <HiOutlineX className="text-lg" />
        </button>

        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineLogout className="text-2xl text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Log out?</h2>
        <p className="text-sm text-slate-500 mb-6">You'll need to sign in again to access the dashboard.</p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyDashboard;
