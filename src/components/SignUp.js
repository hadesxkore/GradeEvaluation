import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student'); // Default to 'Student'
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    const pass = e.target.value;
    setPassword(pass);

    // Check password strength
    const strength = checkPasswordStrength(pass);
    setPasswordStrength(strength);
  };

  const checkPasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars && isLongEnough) {
      return 'Strong';
    } else if (isLongEnough) {
      return 'Weak';
    }
    return '';
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
     // Validate email format
     const emailPattern = /^[\w-\.]+@bpsu\.edu\.ph$/; // Regex to check email ends with @bpsu.edu.ph
     if (!emailPattern.test(email)) {
       setError('Please use your bpsu email account');
       return; // Stop further execution
     }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!studentId) {
      setError('Please provide a valid Student ID.');
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store additional user info (role and ID) in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        studentId: studentId, // Only Student ID is stored
      });

      console.log('User signed up successfully:', user);

      // Show the success modal
      setIsModalOpen(true);
    } catch (error) {
      setError(error.message);
      console.error('Error signing up:', error);
    }

  };

  const handleLogin = () => {
    // Close the modal and navigate to the login page
    setIsModalOpen(false);
    navigate('/login');
  };



   

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
    <div className="max-w-md w-full p-5 border rounded-lg shadow-lg bg-white">
      <h1 className="text-2xl font-bold mb-5 text-center">Sign Up</h1>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSignUp}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
          {password && (
            <p className={`text-sm mt-1 ${passwordStrength === 'Strong' ? 'text-green-600' : 'text-red-600'}`}>
              Password Strength: {passwordStrength}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role</label>
          <input
            type="text"
            value="Student"
            readOnly
            className="w-full px-3 py-2 border rounded-lg bg-gray-200"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <button
        type="submit"
        className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Sign Up
      </button>
      </form>
      <div className="mt-4 text-center">
      <p className="text-sm text-gray-600">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-blue-600 hover:underline font-semibold"
        >
          Login
        </button>
      </p>
    </div>
    


        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2l4-4M7 12h.01m-.01-2.5A5.5 5.5 0 0112 4h.01m-.01 0a5.5 5.5 0 115.49 5.5M12 15v6m0 0h4m-4 0H8"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Sign Up Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your account has been created successfully. Please log in to continue.
              </p>
              <button
                onClick={handleLogin}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
