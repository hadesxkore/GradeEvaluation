// src/components/CreateEvaluatorAccount.js
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  HiPlus, HiEye, HiExclamation, HiCheckCircle, HiMail,
  HiOutlineUserAdd, HiOutlineSearch, HiOutlinePencil,
  HiOutlineTrash, HiOutlineX, HiOutlineUser, HiOutlineShieldCheck,
} from 'react-icons/hi';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/* ──────────────────── helpers ──────────────────── */
const inputCls = "w-full px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition";
const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const Field = ({ label, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    {children}
  </div>
);

function getInitials(first = '', last = '') {
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'EV';
}

/* ──────────────────── component ──────────────────── */
const CreateEvaluatorAccount = () => {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [evaluators, setEvaluators] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const auth = getAuth();
  const firestore = getFirestore();
  const [filteredEvaluators, setFilteredEvaluators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccessModalSec, setShowSuccessModalSec] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessDeleteModal, setShowSuccessDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", email: "",
    contactNumber: "", address: "", facultyId: "", birthdate: "",
  });

  useEffect(() => { fetchEvaluators(); }, [firestore]);

  useEffect(() => {
    const filtered = evaluators.filter(ev => {
      const id = (ev.facultyId || '').toLowerCase();
      const name = (ev.firstName || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return id.includes(term) || name.includes(term);
    });
    setFilteredEvaluators(filtered);
  }, [searchTerm, evaluators]);

  const handleEditClick = (evaluator) => {
    setSelectedEvaluator(evaluator);
    setFormData({
      firstName: evaluator.firstName, middleName: evaluator.middleName,
      lastName: evaluator.lastName, email: evaluator.email,
      contactNumber: evaluator.contactNumber, address: evaluator.address,
      facultyId: evaluator.facultyId, birthdate: evaluator.birthdate,
    });
    setPasswordError(''); setPasswordSuccess('');
    setShowEditModal(true);
  };

  const handleSendPasswordReset = async () => {
    if (!selectedEvaluator?.email) { setPasswordError('No email found.'); return; }
    setChangingPassword(true); setPasswordError(''); setPasswordSuccess('');
    try {
      await sendPasswordResetEmail(auth, selectedEvaluator.email);
      setPasswordSuccess(`Reset link sent to ${selectedEvaluator.email}`);
    } catch (err) { setPasswordError(err.message); }
    finally { setChangingPassword(false); }
  };

  const handleDeleteClick = (evaluator) => {
    setSelectedEvaluator(evaluator);
    setShowDeleteModal(true);
  };

  const handleContactChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 11) {
      if (numericValue.startsWith('09')) {
        setFormData({ ...formData, contactNumber: numericValue });
      } else {
        setFormData({ ...formData, contactNumber: '09' + numericValue.slice(2) });
      }
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedEvaluator?.id) return;
    try {
      const evaluatorRef = doc(firestore, 'evaluators', selectedEvaluator.id);
      await updateDoc(evaluatorRef, {
        firstName: formData.firstName, middleName: formData.middleName,
        lastName: formData.lastName, email: formData.email,
        facultyId: formData.facultyId, birthdate: formData.birthdate,
        address: formData.address, contactNumber: formData.contactNumber,
      });
      setShowEditModal(false);
      setShowSuccessModalSec(true);
    } catch (error) { console.error(error); }
  };

  const handleDeleteEvaluator = async () => {
    if (!selectedEvaluator?.id) return;
    try {
      await deleteDoc(doc(firestore, 'evaluators', selectedEvaluator.id));
      setShowDeleteModal(false);
      setShowSuccessDeleteModal(true);
      fetchEvaluators();
    } catch (error) { console.error(error); }
  };

  const fetchEvaluators = () => {
    try {
      onSnapshot(collection(firestore, 'evaluators'), (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvaluators(list);
        setFilteredEvaluators(list);
      });
    } catch (error) { console.error(error); }
  };

  const handleNameChange = (e, fieldName) => {
    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
    setFormData({ ...formData, [fieldName]: value });
  };

  const handleCreateAccount = async () => {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Email and password are required.'); return; }
    setIsCreating(true);
    try {
      const API_KEY = 'AIzaSyDAwUWh8BHKxHg11kDk4dFmQ9hxykjJtIc';
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: false }),
        }
      );
      const signUpData = await signUpRes.json();
      if (!signUpRes.ok) throw new Error(signUpData.error?.message || 'Failed to create account.');
      const userUid = signUpData.localId;
      await setDoc(doc(db, 'evaluators', userUid), {
        firstName, middleName, lastName, email,
        contactNumber, address, birthdate, facultyId,
        createdAt: new Date(), role: 'evaluator',
      });
      resetForm();
      setShowModal(false);
      setShowSuccessModal(true);
      fetchEvaluators();
    } catch (error) { setError('Error: ' + error.message); }
    finally { setIsCreating(false); }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setFirstName(''); setMiddleName('');
    setLastName(''); setContactNumber(''); setAddress(''); setBirthdate(''); setFacultyId('');
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Evaluator Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create and manage evaluator accounts in the system.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <HiOutlineUserAdd className="text-lg" />
          New Evaluator
        </button>
      </div>

      {/* ── Search + Table card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by name or faculty ID…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium ml-auto">
            {filteredEvaluators.length} evaluator{filteredEvaluators.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluator</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty ID</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Address</th>
                <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluators.length > 0 ? filteredEvaluators.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {getInitials(ev.firstName, ev.lastName)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{ev.firstName} {ev.middleName ? ev.middleName[0] + '.' : ''} {ev.lastName}</p>
                        <p className="text-slate-400 text-[10px]">{ev.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{ev.facultyId || '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-600 truncate max-w-[180px]">{ev.email}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">{ev.contactNumber || '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-600 truncate max-w-[150px]">{ev.address || '—'}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(ev)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <HiOutlinePencil /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ev)}
                        className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <HiOutlineTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <HiOutlineUser className="text-4xl text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm font-medium">No evaluators found.</p>
                    <p className="text-slate-300 text-xs mt-1">Create one using the button above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ══════════ CREATE MODAL ══════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Create Evaluator Account</h3>
                <p className="text-xs text-slate-400 mt-0.5">All fields are required</p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); setError(''); }} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-7 py-5">
              {error && (
                <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-xl">
                  <HiExclamation className="shrink-0" /> {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value.replace(/[^A-Za-z\s]/g, ''))} placeholder="First Name" className={inputCls} />
                </Field>
                <Field label="Middle Name">
                  <input type="text" value={middleName} onChange={e => setMiddleName(e.target.value.replace(/[^A-Za-z\s]/g, ''))} placeholder="Middle Name (optional)" className={inputCls} />
                </Field>
                <Field label="Last Name">
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value.replace(/[^A-Za-z\s]/g, ''))} placeholder="Last Name" className={inputCls} />
                </Field>
                <Field label="Faculty ID">
                  <input
                    type="text" value={facultyId}
                    onChange={e => {
                      const v = e.target.value.replace(/[^\d]/g, '');
                      if (v.length <= 7) setFacultyId(v.length > 2 ? `${v.slice(0, 2)}-${v.slice(2)}` : v);
                    }}
                    placeholder="00-0000" maxLength={8} className={inputCls}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    onBlur={e => { const v = e.target.value.trim(); if (v && !v.includes('@')) setEmail(v + '@bpsu.edu.ph'); }}
                    placeholder="username@bpsu.edu.ph" className={inputCls}
                  />
                </Field>
                <Field label="Password">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputCls} />
                </Field>
                <Field label="Contact Number">
                  <input
                    type="text" value={contactNumber}
                    onChange={e => {
                      let v = e.target.value.replace(/[^\d]/g, '');
                      if (v.length > 11) v = v.slice(0, 11);
                      if (v.length === 1 && v !== '0') v = '09';
                      if (v.startsWith('09') && v.length <= 11) setContactNumber(v);
                    }}
                    placeholder="09XXXXXXXXX" className={inputCls}
                  />
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={inputCls}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Address">
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full Address" className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
            <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => { setShowModal(false); resetForm(); setError(''); }} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ EDIT MODAL ══════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-sm font-bold text-white">
                  {getInitials(selectedEvaluator?.firstName, selectedEvaluator?.lastName)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Edit Evaluator</h3>
                  <p className="text-xs text-slate-400">{selectedEvaluator?.email}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-7 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Field label="First Name">
                  <input type="text" value={formData.firstName} onChange={e => handleNameChange(e, 'firstName')} className={inputCls} />
                </Field>
                <Field label="Middle Name">
                  <input type="text" value={formData.middleName} onChange={e => handleNameChange(e, 'middleName')} className={inputCls} />
                </Field>
                <Field label="Last Name">
                  <input type="text" value={formData.lastName} onChange={e => handleNameChange(e, 'lastName')} className={inputCls} />
                </Field>
                <Field label="Faculty ID">
                  <input type="text" value={formData.facultyId} onChange={e => setFormData({ ...formData, facultyId: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Email">
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Birthdate">
                  <input type="date" value={formData.birthdate} onChange={e => setFormData({ ...formData, birthdate: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Contact Number">
                  <input type="text" value={formData.contactNumber} onChange={handleContactChange} className={inputCls} />
                </Field>
                <Field label="Address">
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputCls} />
                </Field>
              </div>

              {/* Reset password */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                  <HiMail className="text-amber-500" /> Reset Password
                </h4>
                <p className="text-xs text-amber-700 mb-3">
                  Send a password reset link to <span className="font-semibold">{selectedEvaluator?.email}</span>.
                </p>
                <button
                  onClick={handleSendPasswordReset}
                  disabled={changingPassword}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <HiMail /> {changingPassword ? 'Sending…' : 'Send Reset Email'}
                </button>
                {passwordError && <p className="text-rose-600 text-xs mt-2">{passwordError}</p>}
                {passwordSuccess && <p className="text-teal-600 text-xs mt-2 font-medium">✅ {passwordSuccess}</p>}
              </div>
            </div>
            <div className="px-7 py-5 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleSaveChanges} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ DELETE MODAL ══════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineTrash className="text-2xl text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Delete Evaluator?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove <span className="font-semibold text-slate-700">{selectedEvaluator?.firstName} {selectedEvaluator?.lastName}</span> from the system.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDeleteEvaluator} className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ SUCCESS — CREATED ══════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheckCircle className="text-3xl text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Account Created!</h3>
            <p className="text-sm text-slate-500 mb-6">The evaluator account has been created successfully and is ready to use.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">Done</button>
          </div>
        </div>
      )}

      {/* ══════════ SUCCESS — UPDATED ══════════ */}
      {showSuccessModalSec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheckCircle className="text-3xl text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Changes Saved!</h3>
            <p className="text-sm text-slate-500 mb-6">The evaluator's information has been updated successfully.</p>
            <button onClick={() => setShowSuccessModalSec(false)} className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">Done</button>
          </div>
        </div>
      )}

      {/* ══════════ SUCCESS — DELETED ══════════ */}
      {showSuccessDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiCheckCircle className="text-3xl text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">Evaluator Deleted</h3>
            <p className="text-sm text-slate-500 mb-6">
              <span className="font-semibold text-slate-700">{selectedEvaluator?.firstName} {selectedEvaluator?.lastName}</span> has been removed from the system.
            </p>
            <button onClick={() => setShowSuccessDeleteModal(false)} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors">Done</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateEvaluatorAccount;

