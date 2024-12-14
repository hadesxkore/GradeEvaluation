import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification  } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { HiCheckCircle, HiLockClosed } from 'react-icons/hi';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Student'); // Default to 'Student'
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [irregularityReason, setIrregularityReason] = useState('');
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSignUpFormVisible, setIsSignUpFormVisible] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWeakPasswordModalOpen, setIsWeakPasswordModalOpen] = useState(false); // Declare the state here

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

  const handleStudentIdChange = (e) => {
    let value = e.target.value;

    // Remove all non-digit characters
    value = value.replace(/\D/g, '');

    // If the input length is less than or equal to 2, just set the value
    if (value.length <= 2) {
      setStudentId(value);
    }
    // After two digits, add the hyphen and restrict the total length to 7 digits
    else if (value.length <= 5) {
      value = value.slice(0, 2) + '-' + value.slice(2, 5); // Add hyphen after 2 digits
      setStudentId(value);
    }
    // Limit the input to exactly 7 digits
    else {
      value = value.slice(0, 2) + '-' + value.slice(2, 7);
      setStudentId(value);
    }
  };


  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
  
    const emailPattern = /^[\w-\.]+@bpsu\.edu\.ph$/; // Validate BPSU email
    if (!emailPattern.test(email)) {
      setError('Please use your BPSU email account');
      return;
    }
  
    if (password !== confirmPassword) {
      setIsPasswordModalOpen(true); // Open the password mismatch modal
      return;
    }
  
    if (!studentId) {
      setError('Please provide a valid Student ID.');
      return;
    }
  
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength === 'Weak') {
      setIsWeakPasswordModalOpen(true); // Show weak password modal
      return;
    }
  
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Open the irregularity reason modal
      setIsReasonModalOpen(true);
    } catch (error) {
      setError(error.message);
      console.error('Error signing up:', error);
    }
  };
  
  const handleReasonSubmit = async () => {
    if (!irregularityReason) {
      setError('Please select a reason for being irregular.');
      return;
    }
  
    try {
      // Store additional user info in Firestore
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found.');
  
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        studentId: studentId,
        irregularityReason: irregularityReason, // Store selected reason
      });
  
      // Reload user object
      await user.reload();
      const refreshedUser = auth.currentUser;
  
      // Send email verification
      if (refreshedUser) {
        await sendEmailVerification(refreshedUser);
      } else {
        throw new Error('Unable to refresh user object for verification.');
      }
  
      // Hide the modal and the sign-up form
    
      setIsModalOpen(true);
      
      setIsSignUpFormVisible(false); // Hide the sign-up form
      setIsReasonModalOpen(false);
    } catch (error) {
      setError(error.message);
      console.error('Error saving user data or sending verification:', error);
    }
  };
  

  const handleLogin = () => {
    // Close the modal and navigate to the login page
    setIsModalOpen(false);
    
    navigate('/login');
  };



   

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
<div className="max-w-lg w-full p-6 bg-gray-50 rounded-3xl shadow-lg">
  <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    Create Your Account
  </h1>
  {error && (
    <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
  )}
  {isSignUpFormVisible && (
    <form onSubmit={handleSignUp}>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          required
        />
        {password && (
          <p
            className={`mt-1 text-sm font-medium ${
              passwordStrength === 'Strong' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            Password Strength: {passwordStrength}
          </p>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-semibold mb-1 text-gray-700">
          Role
        </label>
        <input
          type="text"
          value="Student"
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
        />
      </div>
      <div className="mb-4">
      <label className="block text-sm font-semibold mb-1 text-gray-700">
        Student ID
      </label>
      <input
        type="text"
        value={studentId}
        onChange={handleStudentIdChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        required
        maxLength={8} // Ensure the input can't be more than 7 characters
      />
    </div>
      <button
        type="submit"
        className="w-full py-2 bg-black text-white text-sm font-semibold rounded-lg hover:shadow-md transition-shadow duration-300"
      >
        Sign Up
      </button>
    </form>
  )}

{isWeakPasswordModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="fixed inset-0 bg-black bg-opacity-30"></div>
    <div className="bg-white rounded-lg p-6 text-center shadow-lg w-4/5 sm:w-[500px] relative z-10"> {/* Adjusted width */}
      <div className="flex justify-center mb-4">
        <HiLockClosed className="text-6xl text-red-600 mb-2" /> {/* Icon for weak password */}
      </div>
      <h2 className="text-xl font-semibold text-red-600 mb-3">Weak Password</h2>
      <p className="text-lg text-gray-600 mb-6">
        Your password is too weak. Please ensure it contains at least one uppercase letter, one lowercase letter, one number, one special character, and is at least 8 characters long.
      </p>
      <button
        className="bg-red-500 text-white py-2 px-6 rounded-lg hover:bg-red-600 transition-colors"
        onClick={() => setIsWeakPasswordModalOpen(false)} // Close the modal
      >
        Close
      </button>
    </div>
  </div>
)}

{isPasswordModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="fixed inset-0 bg-black bg-opacity-30"></div>
    <div className="bg-white rounded-lg p-6 text-center shadow-lg w-4/5 sm:w-96 relative z-10">
      <div className="flex justify-center mb-4">
        <HiLockClosed className="text-6xl text-red-600 mb-2" /> {/* Icon for the error */}
      </div>
      <h2 className="text-xl font-semibold text-red-600 mb-3">Password Mismatch</h2>
      <p className="text-lg text-gray-600 mb-6">
        The passwords you entered do not match. Please make sure both fields are the same.
      </p>
      <button
        className="bg-red-500 text-white py-2 px-6 rounded-lg hover:bg-red-600 transition-colors"
        onClick={() => setIsPasswordModalOpen(false)} // Close the modal
      >
        Close
      </button>
    </div>
  </div>
)}


  <div className="mt-6 text-center">
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
</div>



       {/* Irregularity Reason Modal */}
{isReasonModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
    <div className="bg-white rounded-xl shadow-xl p-8 w-[90%] max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Select Your Irregularity Reason</h2>
      <select
        value={irregularityReason}
        onChange={(e) => setIrregularityReason(e.target.value)}
        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-blue-500 mb-6 transition duration-300"
      >
        <option value="" disabled>Select a Reason</option>
        <option value="Shifter">Shifter</option>
        <option value="Failed Subjects">Failed Subjects</option>
      </select>
      <button
        onClick={handleReasonSubmit}
        className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors duration-300"
      >
        Submit
      </button>
    </div>
  </div>
)}



{isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-20">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md mx-auto text-center">
      <div className="flex items-center justify-center mb-6">
        <HiCheckCircle className="text-black w-16 h-16" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Verify Your Email</h2>
      <p className="text-gray-600 text-lg mb-6">
        A verification link has been sent to your email. Please check your inbox and verify your email to continue.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="bg-black text-white py-3 px-6 rounded-full text-lg font-semibold hover:bg-black transition-all duration-300 shadow-md hover:shadow-lg"
      >
        Go to Login
      </button>
    </div>
  </div>
)}


     


   {/* Success Modal */}
{isSuccessModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-[90%] max-w-md mx-auto text-center">
      <div className="flex items-center justify-center mb-6">
        <HiCheckCircle className="text-green-500 w-16 h-16" />
      </div>
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Sign Up Successful!</h2>
      <p className="text-gray-600 text-lg mb-6">
        Your account has been created successfully. Please log in to continue.
      </p>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white py-3 px-6 rounded-full text-lg font-semibold hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        Login
      </button>
    </div>
  </div>
)}


    </div>
  );
};

export default SignUp;
