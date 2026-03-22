import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Link, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineClipboardList,
  HiChevronDown,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineLogout,
  HiOutlineX,
  HiBell,
  HiOutlineUpload,
  HiMenuAlt2,
} from 'react-icons/hi';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomizeAccount from './CustomizeAccount';
import DownloadCourses from './DownloadCourses';
import ManageCourses from './ManageCourses';
import AnalyzeResidency from './AnalyzeResidency';
import UploadGrades from './UploadGrades';

Modal.setAppElement('#root');

/* ─── nav config ─────────────────────────── */
const NAV = [
  {
    id: 'profile',
    label: 'Student Information',
    icon: HiOutlineCog,
    to: '/student-dashboard/customize-account',
  },
  {
    id: 'curriculum',
    label: 'Curriculum List',
    icon: HiOutlineClipboardList,
    badge: true, // shows notification badge
    children: [
      {
        label: 'Manage Courses',
        icon: HiOutlineBookOpen,
        to: '/student-dashboard/manage-courses',
        badge: true,
      },
    ],
  },
  {
    id: 'residency',
    label: 'Analyze Residency',
    icon: HiOutlineAcademicCap,
    to: '/student-dashboard/analyze-residency',
  },
  {
    id: 'grades',
    label: 'Grades',
    icon: HiOutlineUpload,
    children: [
      {
        label: 'Upload My Grade',
        icon: HiOutlineUpload,
        to: '/student-dashboard/upload-grades',
      },
    ],
  },
];

/* ─── helper: initials from name ────────── */
function getInitials(name = '') {
  return name.slice(0, 2).toUpperCase() || 'ST';
}

/* ─── NavItem component ─────────────────── */
function NavItem({ item, location, onNavigate, notifCount }) {
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
            ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
        >
          <Icon className="text-lg flex-shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {/* notification badge on parent */}
          {item.badge && notifCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold mr-1">
              {notifCount}
            </span>
          )}
          <HiChevronDown className={`text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>

        <ul className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-40 mt-1' : 'max-h-0'}`}>
          {item.children.map((child) => {
            const CIcon = child.icon;
            const childActive = location.pathname.startsWith(child.to);
            return (
              <li key={child.to}>
                <Link
                  to={child.to}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 pl-10 pr-4 py-2 rounded-xl text-sm transition-all duration-200
                    ${childActive ? 'text-white bg-white/10' : 'text-indigo-300 hover:text-white hover:bg-white/5'}`}
                >
                  <CIcon className="text-base flex-shrink-0" />
                  <span className="flex-1">{child.label}</span>
                  {child.badge && notifCount > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {notifCount}
                    </span>
                  )}
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
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
          ${isActive ? 'bg-white/10 text-white' : 'text-indigo-200 hover:bg-white/5 hover:text-white'}`}
      >
        <span className={`absolute left-0 w-1 h-6 rounded-r-full bg-violet-400 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
        <Icon className="text-lg flex-shrink-0" />
        <span>{item.label}</span>
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
      </Link>
    </li>
  );
}

/* ─── main ─────────────────────────────── */
const StudentDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [firstName, setFirstName] = useState('Student');
  const [lastName, setLastName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUserEmail(user.email);
        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        if (userSnapshot.exists()) {
          const d = userSnapshot.data();
          if (d.role === 'Student') {
            setIsStudent(true);
            setFirstName(d.firstName || 'Student');
            setLastName(d.lastName || '');
            setProfilePictureUrl(d.profilePicture || '');
          } else {
            navigate('/unauthorized');
          }
        } else {
          navigate('/unauthorized');
        }
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [auth, db, navigate]);

  // Real-time notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('studentId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [auth]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login')).catch(console.error);

  if (!isAuthenticated || !isStudent) return null;

  /* ── Sidebar content (shared desktop + mobile) ── */
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand / Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          {/* Profile picture or initials avatar */}
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-violet-400/50 shadow-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg ring-2 ring-violet-400/30">
              {getInitials(firstName)}
            </div>
          )}
          <div>
            <p className="text-white text-sm font-semibold leading-none">{firstName}</p>
            <p className="text-indigo-400 text-xs mt-0.5">Student Portal</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/5 mb-4" />

      {/* Nav Links */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-indigo-400/60">
          Navigation
        </p>
        <ul className="space-y-0.5 relative">
          {NAV.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              location={location}
              onNavigate={() => setSidebarOpen(false)}
              notifCount={notifications.length}
            />
          ))}
        </ul>
      </nav>

      {/* User card at bottom */}
      <div className="mx-3 mb-4 mt-4">
        {/* Notification strip */}
        {notifications.length > 0 && (
          <div className="mb-3 flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
            <HiBell className="text-rose-400 text-base shrink-0" />
            <span className="text-xs text-rose-300 font-medium">
              {notifications.length} new notification{notifications.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center gap-3">
          {/* Avatar */}
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-violet-400/30" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials(firstName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{firstName} {lastName}</p>
            <p className="text-indigo-400 text-[10px] truncate">{currentUserEmail}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            title="Logout"
            className="text-indigo-400 hover:text-rose-400 transition-colors"
          >
            <HiOutlineLogout className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex w-60 flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)' }}
      >
        {sidebar}
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col md:hidden transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)' }}
      >
        <button
          className="absolute top-4 right-4 text-indigo-300 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <HiOutlineX className="text-xl" />
        </button>
        {sidebar}
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <HiMenuAlt2 className="text-2xl" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Student Dashboard</span>
          {notifications.length > 0 && (
            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {notifications.length}
            </span>
          )}
        </header>

        <main className="flex-1 p-5 md:p-7 overflow-auto">
          <Routes>
            <Route path="customize-account" element={<CustomizeAccount />} />
            <Route path="download-courses" element={<DownloadCourses />} />
            <Route path="manage-courses" element={<ManageCourses />} />
            <Route path="analyze-residency" element={<AnalyzeResidency />} />
            <Route path="upload-grades" element={<UploadGrades />} />
            <Route
              path="/"
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-5">
                    <HiOutlineAcademicCap className="text-4xl text-violet-500" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700">Welcome back, {firstName}!</p>
                  <p className="text-sm mt-1 text-slate-500">Select an option from the sidebar to get started.</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* ── Logout Modal ── */}
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

        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <HiOutlineLogout className="text-2xl text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Log out?</h2>
        <p className="text-sm text-slate-500 mb-6">You'll need to sign in again to access your student portal.</p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
