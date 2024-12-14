import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Import the Firestore database
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { HiOutlineMail } from "react-icons/hi"
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const [showVerificationModal, setShowVerificationModal] = useState(false); // Modal visibility state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role?.toLowerCase();

        if (userRole === 'student') {
          // Check email verification for Students only
          if (!user.emailVerified) {
            setShowVerificationModal(true);
            return;
          }
          navigate('/student-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setError('User role not recognized');
        }
      } else {
        // Check evaluators collection if no data in users collection
        const evaluatorDocRef = doc(db, 'evaluators', user.uid);
        const evaluatorDocSnap = await getDoc(evaluatorDocRef);

        if (evaluatorDocSnap.exists()) {
          const evaluatorData = evaluatorDocSnap.data();
          const evaluatorRole = evaluatorData.role?.toLowerCase();

          if (evaluatorRole === 'evaluator') {
            navigate('/faculty-dashboard');
          } else {
            setError('Evaluator role not recognized');
          }
        } else {
          setError('No user data found');
        }
      }
    } catch (error) {
      setError(error.message);
      console.error('Error logging in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
{loading && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Overlay */}
    <div className="fixed inset-0 bg-black bg-opacity-40"></div>

    {/* Modal Card */}
    <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-xl p-8 w-10/12 md:w-96 z-10">
      <div className="flex flex-col items-center text-center">
        {/* Spinner */}
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 mb-5"></div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Loading...</h2>

        {/* Description */}
        <p className="text-gray-600 text-lg mb-5">
          Please wait while we log you in.
        </p>

        {/* Optional: A progress bar */}
        {/* <div className="w-full bg-gray-300 rounded-full h-1 mb-3">
          <div className="bg-blue-500 h-1 rounded-full" style={{ width: '50%' }}></div>
        </div> */}
      </div>
    </div>
  </div>
)}

{showVerificationModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Overlay */}
    <div className="fixed inset-0 bg-black bg-opacity-40"></div>

    {/* Modal Card */}
    <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-xl p-6 w-10/12 md:w-96 z-10">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className="bg-gray-200 p-5 rounded-full mb-4 shadow-md">
          <HiOutlineMail className="text-black  text-4xl" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Email Not Verified
        </h2>

        {/* Description */}
        <p className="text-gray-700 text-base mb-6">
          Your email has not been verified. Please check your inbox for the verification email and follow the instructions.
        </p>

        {/* Close Button */}
        <button
          className="w-full bg-black text-white py-3 px-5 rounded-lg hover:bg-gray-800 transition-all shadow-sm text-lg"
          onClick={() => setShowVerificationModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      <div className="max-w-md w-full p-5 border rounded-3xl shadow-lg bg-white">
        <h1 className="text-3xl font-bold mb-5 text-center text-gray-800">Login</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:border-black focus:ring-black"
              required
            />
          </div>
          <p className="mb-2 text-gray-600 flex justify-end">
            <button
              onClick={() => navigate('/forgotpassword')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Forgot Password?
            </button>
          </p>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don’t have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="text-blue-600 hover:underline font-semibold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
