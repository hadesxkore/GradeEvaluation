import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiEye,
  HiEyeOff,
  HiArrowRight,
  HiOutlineAcademicCap,
  HiExclamationCircle
} from 'react-icons/hi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  // Keep a ref to the un-verified user so we can resend the email
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role?.toLowerCase();

        if (userRole === 'student') {
          // Block login until the student has verified their email
          if (!user.emailVerified) {
            setUnverifiedUser(user);
            setShowVerificationModal(true);
            await auth.signOut(); // sign them out so they don't slip through
            return;
          }
          navigate('/student-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setError('User role not recognized.');
        }
      } else {
        const evaluatorDocSnap = await getDoc(doc(db, 'evaluators', user.uid));
        if (evaluatorDocSnap.exists()) {
          const evaluatorRole = evaluatorDocSnap.data().role?.toLowerCase();
          if (evaluatorRole === 'evaluator') navigate('/faculty-dashboard');
          else setError('Evaluator role not recognized.');
        } else {
          setError('No account data found. Please contact your administrator.');
        }
      }
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      console.error('Error logging in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">

      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <HiOutlineAcademicCap className="text-4xl text-teal-300" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Welcome Back<br />
            <span className="text-teal-400">to OptiEval</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Sign in to your account to access your academic records, evaluation certificates, and all student resources.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Students', value: 'Active' },
              { label: 'Programs', value: '10+' },
              { label: 'Evaluators', value: 'Online' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xl font-bold text-teal-400">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <HiOutlineAcademicCap className="text-3xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">OptiEval</h2>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
          <p className="text-slate-500 mb-8 text-sm">Enter your credentials to access your dashboard.</p>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm animate-fade-in">
              <HiExclamationCircle className="text-lg shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
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

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => navigate('/forgotpassword')} className="text-xs text-teal-600 font-semibold hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 bg-white rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-teal-700 disabled:bg-slate-400 text-white font-semibold py-3.5 rounded-xl shadow-sm transition-colors duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>Sign In <HiArrowRight /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <button onClick={() => navigate('/signup')} className="text-teal-600 font-semibold hover:underline">
              Create One
            </button>
          </p>
        </div>
      </div>

      {/* Loading Overlay (full-screen during auth check) */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-72 text-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-slate-800">Signing you in...</p>
            <p className="text-sm text-slate-400 mt-1">Please wait a moment.</p>
          </div>
        </div>
      )}

      {/* Email Not Verified Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center animate-fade-in">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiOutlineMail className="text-3xl text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Email Not Verified</h2>
            <p className="text-sm text-slate-500 mb-6">
              Your email address hasn't been verified yet. Please check your inbox (and spam folder) and click the verification link before logging in.
            </p>

            {resendSent ? (
              <p className="text-sm font-semibold text-teal-600 mb-4">
                ✓ Verification email resent! Check your inbox.
              </p>
            ) : (
              <button
                onClick={async () => {
                  if (!unverifiedUser) return;
                  setResendLoading(true);
                  try {
                    await sendEmailVerification(unverifiedUser);
                    setResendSent(true);
                  } catch (e) {
                    setError('Could not resend email. Try again in a moment.');
                  } finally {
                    setResendLoading(false);
                  }
                }}
                disabled={resendLoading}
                className="w-full mb-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {resendLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : '📨 Resend Verification Email'}
              </button>
            )}

            <button
              onClick={() => { setShowVerificationModal(false); setResendSent(false); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
            >
              Close
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

export default Login;
