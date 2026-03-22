import React, { useState, useEffect, useRef } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { sileo } from 'sileo';
// Firebase Storage removed — using Cloudinary instead
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineBookOpen,
  HiOutlineCamera,
  HiCheckCircle,
  HiOutlineX,
} from 'react-icons/hi';

/* ─── Stable module-level constants (prevent re-mount on each keystroke) ─── */
const inputCls = "w-full px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition";
const readonlyCls = "w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-400 cursor-not-allowed";

/* ─── Field wrapper — defined OUTSIDE the component so React never remounts inputs ─── */
const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
      {Icon && <Icon className="text-base text-slate-400" />}
      {label}
    </label>
    {children}
  </div>
);

const CustomizeAccount = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    address: '',
    contactNumber: '',
    program: '',
    yearLevel: '',
    profilePicture: '',
    studentId: '',
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Cloudinary config
  const CLOUDINARY_CLOUD_NAME = 'dqndurz00';
  const CLOUDINARY_UPLOAD_PRESET = 'gradeeval'; // must be set to "unsigned" in Cloudinary console

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setUserData({
            firstName: d.firstName || '',
            middleName: d.middleName || '',
            lastName: d.lastName || '',
            email: d.email || user.email,
            address: d.address || '',
            contactNumber: d.contactNumber || '',
            program: d.program || '',
            yearLevel: d.yearLevel || '',
            profilePicture: d.profilePicture || '',
            studentId: d.studentId || '',
          });
        }
      });
    }
  }, [user, db]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      let v = value.replace(/[^0-9]/g, '').slice(0, 11);
      if (v.length <= 2) v = '09' + v.slice(2);
      setUserData((prev) => ({ ...prev, [name]: v }));
    } else if (['firstName', 'middleName', 'lastName'].includes(name)) {
      setUserData((prev) => ({ ...prev, [name]: value.replace(/[^a-zA-Z\s'-]/g, '') }));
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);
      setUserData((prev) => ({ ...prev, profilePicture: URL.createObjectURL(file) }));
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let profilePictureUrl = userData.profilePicture;

      if (profilePictureFile) {
        // Upload to Cloudinary using unsigned upload preset
        const formData = new FormData();
        formData.append('file', profilePictureFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('folder', 'profilePictures');

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        if (!cloudinaryRes.ok) throw new Error('Cloudinary upload failed.');
        const cloudinaryData = await cloudinaryRes.json();
        profilePictureUrl = cloudinaryData.secure_url;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        email: userData.email,
        address: userData.address,
        contactNumber: userData.contactNumber,
        program: userData.program,
        yearLevel: userData.yearLevel,
        profilePicture: profilePictureUrl,
      });
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
        photoURL: profilePictureUrl || null,
      });
      sileo.success({ title: 'Profile Updated!', description: 'Your student information has been saved successfully.' });
      setIsModalOpen(true);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      sileo.error({ title: 'Update Failed', description: 'Could not save your profile. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const f = userData.firstName?.[0] || '';
    const l = userData.lastName?.[0] || '';
    return (f + l).toUpperCase() || 'ST';
  };



  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Student Information</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal details and academic profile.</p>
      </div>

      <form onSubmit={handleSaveChanges}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Profile Card ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">

              {/* Avatar */}
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full ring-4 ring-violet-100 overflow-hidden bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                  {userData.profilePicture ? (
                    <img src={userData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{getInitials()}</span>
                  )}
                </div>
                {/* Camera overlay button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-700 flex items-center justify-center shadow-lg transition-colors"
                  title="Change photo"
                >
                  <HiOutlineCamera className="text-white text-sm" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>

              <p className="font-semibold text-slate-800 text-base">
                {userData.firstName || 'Your'} {userData.lastName || 'Name'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{userData.email}</p>

              {/* Student ID badge */}
              <div className="mt-5 w-full bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-center">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Student ID</p>
                <p className="text-xl font-bold text-violet-700 font-mono tracking-wider">
                  {userData.studentId || '—'}
                </p>
              </div>

              {/* Year level badge */}
              {userData.yearLevel && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100">
                  <HiOutlineAcademicCap className="text-sm" />
                  {userData.yearLevel}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 w-full text-sm text-violet-600 font-semibold border border-violet-200 hover:bg-violet-50 rounded-xl py-2 transition-colors"
              >
                Change Photo
              </button>
            </div>
          </div>

          {/* ── RIGHT: Form Fields ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <HiOutlineX className="text-lg shrink-0" />
                {error}
              </div>
            )}

            {/* Name section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <HiOutlineUser className="text-violet-500 text-base" /> Full Name
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="First Name">
                  <input type="text" name="firstName" value={userData.firstName} onChange={handleInputChange} className={inputCls} placeholder="Juan" required />
                </Field>
                <Field label="Middle Name">
                  <input type="text" name="middleName" value={userData.middleName} onChange={handleInputChange} className={inputCls} placeholder="Santos" />
                </Field>
                <Field label="Last Name">
                  <input type="text" name="lastName" value={userData.lastName} onChange={handleInputChange} className={inputCls} placeholder="Dela Cruz" required />
                </Field>
              </div>
            </div>

            {/* Contact & Academic section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <HiOutlineIdentification className="text-violet-500 text-base" /> Academic & Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email" icon={HiOutlineMail}>
                  <input type="email" name="email" value={userData.email} className={readonlyCls} readOnly />
                </Field>

                <Field label="Contact Number" icon={HiOutlinePhone}>
                  <input
                    type="text"
                    name="contactNumber"
                    value={userData.contactNumber}
                    onChange={handleInputChange}
                    maxLength="11"
                    pattern="\d{11}"
                    placeholder="09XXXXXXXXX"
                    className={inputCls}
                    onFocus={(e) => e.target.setSelectionRange(2, 2)}
                  />
                </Field>

                <Field label="Program" icon={HiOutlineBookOpen}>
                  <input type="text" name="program" value={userData.program} onChange={handleInputChange} className={inputCls} placeholder="e.g. BS Industrial Engineering" />
                </Field>

                <Field label="Year Level" icon={HiOutlineAcademicCap}>
                  <div className="relative">
                    <select
                      name="yearLevel"
                      value={userData.yearLevel}
                      onChange={handleInputChange}
                      className="w-full appearance-none px-4 py-2.5 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition pr-10"
                      required
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st year">1st Year</option>
                      <option value="2nd year">2nd Year</option>
                      <option value="3rd year">3rd Year</option>
                      <option value="4th year">4th Year</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>
                </Field>

                <Field label="Address" icon={HiOutlineLocationMarker}>
                  <input type="text" name="address" value={userData.address} onChange={handleInputChange} className={inputCls} placeholder="City, Province" />
                </Field>
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl shadow-sm transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── Success Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiCheckCircle className="text-3xl text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Profile Updated!</h2>
            <p className="text-sm text-slate-500 mb-6">Your student information has been saved successfully.</p>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.25s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default CustomizeAccount;
