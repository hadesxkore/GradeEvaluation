// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineUserAdd,
  HiOutlineClipboardList,
  HiOutlineLogout,
  HiOutlineX,
  HiOutlinePlusCircle,
  HiOutlineShieldCheck,
  HiMenuAlt2,
  HiChevronRight,
} from 'react-icons/hi';

import CreateEvaluatorAccount from './CreateEvaluatorAccount';
import ContentCustomization from './ContentCustomization';
import Reports from './Reports';
import SystemSettings from './SystemSettings';
import AdminAddSubject from './AdminAddSubject';

/* ─── Nav config ─────────────────────────── */
const NAV = [
  {
    id: 'evaluator',
    label: 'Create Evaluator',
    icon: HiOutlineUserAdd,
    to: '/admin-dashboard/create-evaluator-account',
    desc: 'Manage evaluator accounts',
  },
  {
    id: 'curriculum',
    label: 'Create Curriculum',
    icon: HiOutlinePlusCircle,
    to: '/admin-dashboard/admin-add-subject',
    desc: 'Add and manage subjects',
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: HiOutlineClipboardList,
    to: '/admin-dashboard/reports',
    desc: 'View system reports',
  },
];

/* ─── NavItem ────────────────────────────── */
function NavItem({ item, location, onNavigate }) {
  const Icon = item.icon;
  const isActive =
    location.pathname === item.to ||
    location.pathname.startsWith(item.to + '/');

  return (
    <li>
      <Link
        to={item.to}
        onClick={onNavigate}
        className={`relative group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
          ${isActive
            ? 'bg-red-600/20 text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
      >
        {/* Active left indicator */}
        <span
          className={`absolute left-0 w-0.5 h-5 rounded-r-full bg-red-400 transition-opacity duration-150
            ${isActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <Icon className={`text-lg flex-shrink-0 transition-colors
          ${isActive ? 'text-red-400' : 'text-slate-500 group-hover:text-slate-300'}`}
        />
        <span className="flex-1">{item.label}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
        )}
      </Link>
    </li>
  );
}

/* ─── Main ───────────────────────────────── */
const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState({});
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
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role === 'admin' || data.role === 'Admin') {
            setIsAdmin(true);
            setAdminData({ ...data, email: user.email });
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
    return unsub;
  }, [auth, navigate, db]);

  const handleLogout = () =>
    signOut(auth).then(() => navigate('/login')).catch(console.error);

  if (!isAuthenticated || !isAdmin) return null;

  const firstName = adminData.firstName || 'Admin';
  const lastName = adminData.lastName || '';
  const email = adminData.email || '';
  const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || 'AD';

  /* ── sidebar content (shared) ── */
  const sidebar = (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg">
            <HiOutlineShieldCheck className="text-white text-lg" />
          </span>
          <div>
            <p className="text-white text-sm font-bold leading-none">Admin</p>
            <p className="text-slate-500 text-xs mt-0.5">Control Panel</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-white/5 mb-5" />

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto">
        <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          Management
        </p>
        <ul className="space-y-0.5">
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

      {/* Admin Card */}
      <div className="mx-3 mb-4 mt-4">
        {/* Role badge */}
        <div className="mb-3 flex items-center gap-2 bg-red-600/10 border border-red-600/20 rounded-xl px-3 py-2">
          <HiOutlineShieldCheck className="text-red-400 text-base shrink-0" />
          <span className="text-xs text-red-300 font-semibold">
            System Administrator
          </span>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {firstName} {lastName}
            </p>
            <p className="text-slate-500 text-[10px] truncate">{email}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            title="Logout"
            className="text-slate-500 hover:text-red-400 transition-colors"
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
        className="hidden md:flex w-56 flex-shrink-0 flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}
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

      {/* ── Mobile drawer ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 flex flex-col md:hidden transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <HiOutlineX className="text-xl" />
        </button>
        {sidebar}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <HiMenuAlt2 className="text-2xl" />
          </button>
          <span className="text-sm font-semibold text-slate-700">Admin Dashboard</span>
        </header>

        <main className="flex-1 p-5 md:p-8 overflow-auto">
          <Routes>
            <Route path="/create-evaluator-account" element={<CreateEvaluatorAccount />} />
            <Route path="/admin-add-subject" element={<AdminAddSubject />} />
            <Route path="/content-customization" element={<ContentCustomization />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/system-settings" element={<SystemSettings />} />
            <Route
              path="/"
              element={
                <div className="max-w-3xl mx-auto">
                  {/* Welcome hero */}
                  <div
                    className="rounded-2xl p-8 mb-6 text-white relative overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #7f1d1d 100%)' }}
                  >
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-red-600/10 pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
                    <div className="relative">
                      <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/20 text-red-300 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                        <HiOutlineShieldCheck /> System Administrator
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome back, {firstName}!
                      </h1>
                      <p className="text-slate-400 text-sm max-w-lg">
                        Use the sidebar to manage evaluator accounts, create new curriculum subjects, or view system reports.
                      </p>
                    </div>
                  </div>

                  {/* Quick-access cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {NAV.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.id}
                          to={item.to}
                          className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md hover:border-red-200 transition-all duration-200 flex flex-col gap-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <Icon className="text-xl text-slate-500 group-hover:text-red-600 transition-colors" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-red-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Open <HiChevronRight className="text-sm" />
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* ── Logout Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <HiOutlineX className="text-lg" />
            </button>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineLogout className="text-2xl text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Log out?</h2>
            <p className="text-sm text-slate-500 mb-6">
              You'll be signed out of the admin control panel.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
