// src/components/Login.js
import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Import the Firestore database
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true); // Set loading to true when starting login

    try {
      // Sign in user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User logged in successfully:', user);

      // Fetch user role from Firestore in the users collection
      console.log('Fetching document with UID:', user.uid);
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role?.toLowerCase(); // Convert to lowercase for uniform comparison

        // Redirect based on user role
        if (userRole === 'student') {
          navigate('/student-dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setError('User role not recognized');
        }
      } else {
        // If no user data found in users collection, check evaluators collection
        const evaluatorDocRef = doc(db, 'evaluators', user.uid);
        const evaluatorDocSnap = await getDoc(evaluatorDocRef);

        if (evaluatorDocSnap.exists()) {
          const evaluatorData = evaluatorDocSnap.data();
          const evaluatorRole = evaluatorData.role?.toLowerCase(); // Ensure uniform comparison
          
          // Assuming evaluators only have one role: evaluator
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
      setLoading(false); // Hide loading modal when done
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {loading && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Overlay for the background only */}
    <div className="fixed inset-0 bg-black bg-opacity-30"></div>
    
    <div className="bg-white rounded-lg p-6 text-center shadow-lg w-11/12 md:w-1/3 relative z-10">
      <div className="flex justify-center mb-3">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Loading...</h2>
      <p className="text-gray-600">Please wait while we log you in.</p>
    </div>
  </div>
)}

      <div className="max-w-md w-full p-5 border rounded-lg shadow-lg bg-white">
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
              onClick={() => navigate('/forgotpassword')} // Navigate to the ForgotPassword page
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
            onClick={() => navigate('/signup')} // Adjust the route as necessary
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
