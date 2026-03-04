import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  HiCheckCircle,
  HiLockClosed,
  HiOutlineMail,
  HiOutlineIdentification,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiEye,
  HiEyeOff,
  HiExclamationCircle,
  HiArrowRight
} from 'react-icons/hi';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState('Student');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [irregularityReason, setIrregularityReason] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isSignUpFormVisible, setIsSignUpFormVisible] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWeakPasswordModalOpen, setIsWeakPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const pass = e.target.value;
    setPassword(pass);
    setPasswordStrength(checkPasswordStrength(pass));
  };

  const checkPasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars && isLongEnough) return 'Strong';
    else if (isLongEnough) return 'Weak';
    return '';
  };

  const handleStudentIdChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 2) setStudentId(value);
    else if (value.length <= 5) setStudentId(value.slice(0, 2) + '-' + value.slice(2, 5));
    else setStudentId(value.slice(0, 2) + '-' + value.slice(2, 7));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    const emailPattern = /^[\w-.]+@bpsu\.edu\.ph$/;
    if (!emailPattern.test(email)) {
      setError('Please use your official BPSU email (@bpsu.edu.ph).');
      return;
    }
    if (password !== confirmPassword) { setIsPasswordModalOpen(true); return; }
    if (!studentId) { setError('Please provide a valid Student ID.'); return; }
    if (checkPasswordStrength(password) === 'Weak') { setIsWeakPasswordModalOpen(true); return; }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsReasonModalOpen(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleReasonSubmit = async () => {
    if (!irregularityReason) { setError('Please select a reason for being irregular.'); return; }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found.');

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        studentId: studentId,
        irregularityReason: irregularityReason,
      });

      // Email verification is temporarily disabled — re-enable when needed:
      // await user.reload();
      // const refreshedUser = auth.currentUser;
      // if (refreshedUser) {
      //   await sendEmailVerification(refreshedUser);
      // } else {
      //   throw new Error('Unable to refresh user object for verification.');
      // }

      setIsReasonModalOpen(false);
      setIsSignUpFormVisible(false);
      setIsModalOpen(true);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background glow circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <HiOutlineIdentification className="text-4xl text-teal-300" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Grade Evaluation<br />
            <span className="text-teal-400">System</span>
          </h2>
          <p className="text-slate-400 max-w-xs leading-relaxed">
            Create your student account to access your academic records, evaluation certificates, and course enrollments.
          </p>

          <div className="mt-10 space-y-4 text-left">
            {[
              'View your grades and academic history',
              'Access evaluation certificates',
              'Manage your course enrollments',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">

          {/* Logo/Header for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <HiOutlineIdentification className="text-3xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Grade Evaluation System</h2>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
          <p className="text-slate-500 mb-8 text-sm">Use your official BPSU email to register.</p>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in">
              <HiExclamationCircle className="text-lg shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSignUpFormVisible && (
            <form onSubmit={handleSignUp} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BPSU Email</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="yourname@bpsu.edu.ph"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Student ID */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Student ID</label>
                <div className="relative">
                  <HiOutlineIdentification className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="text"
                    value={studentId}
                    onChange={handleStudentIdChange}
                    placeholder="XX-XXXXX"
                    required
                    maxLength={8}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition font-mono tracking-widest"
                  />
                </div>
              </div>

              {/* Role — read only */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-lg" />
                  <input
                    type="text"
                    value="Student"
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Min. 8 chars with uppercase & number"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength === 'Strong' ? 'w-full bg-teal-500' : 'w-1/2 bg-amber-400'}`} />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength === 'Strong' ? 'text-teal-600' : 'text-amber-500'}`}>{passwordStrength}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
                {confirmPassword && password && (
                  <p className={`mt-1.5 text-xs font-medium ${confirmPassword === password ? 'text-teal-600' : 'text-red-500'}`}>
                    {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
              >
                Create Account <HiArrowRight />
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-teal-600 font-semibold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>

      {/* ─── Modals ─── */}

      {/* Irregularity Reason Modal */}
      {isReasonModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiOutlineIdentification className="text-3xl text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Almost Done!</h2>
            <p className="text-sm text-slate-500 mb-6">Please select the reason for your irregular status so we can evaluate your courses properly.</p>
            <div className="flex flex-col gap-3 mb-5">
              {[
                {
                  value: 'Shifter',
                  label: 'Shifter',
                  desc: 'I switched from a different program or course.',
                  emoji: '🔄',
                },
                {
                  value: 'Failed Subjects',
                  label: 'Failed Subjects',
                  desc: 'I have subjects that I did not pass in a previous term.',
                  emoji: '📋',
                },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setIrregularityReason(option.value)}
                  className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-150 flex items-start gap-4 shadow-sm
                    ${irregularityReason === option.value
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <span className="text-2xl mt-0.5">{option.emoji}</span>
                  <div>
                    <p className={`font-semibold text-sm ${irregularityReason === option.value ? 'text-teal-700' : 'text-slate-800'}`}>{option.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                  </div>
                  <div className={`ml-auto mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all
                    ${irregularityReason === option.value
                      ? 'border-teal-500 bg-teal-500'
                      : 'border-slate-300 bg-white'
                    }`}
                  >
                    {irregularityReason === option.value && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handleReasonSubmit} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors">
              Complete Registration
            </button>
          </div>
        </div>
      )}

      {/* Sign-up Complete Modal (Verification disabled) */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiCheckCircle className="text-3xl text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Created!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your student account has been created successfully. You can now log in.
            </p>
            <button onClick={() => navigate('/login')} className="w-full bg-slate-900 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2">
              Go to Login <HiArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* Password Mismatch Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiLockClosed className="text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Passwords Don't Match</h2>
            <p className="text-sm text-slate-500 mb-6">Please make sure both password fields contain the same value.</p>
            <button onClick={() => setIsPasswordModalOpen(false)} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* Weak Password Modal */}
      {isWeakPasswordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiLockClosed className="text-3xl text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Weak Password</h2>
            <p className="text-sm text-slate-500 mb-6">Your password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.</p>
            <button onClick={() => setIsWeakPasswordModalOpen(false)} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors">Got It</button>
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

export default SignUp;
