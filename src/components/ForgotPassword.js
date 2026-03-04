// src/components/ForgotPassword.js

import React, { useState } from 'react';
import { auth } from '../firebase'; // Import the Firebase auth module
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { HiLockClosed } from 'react-icons/hi'; // Import an icon from react-icons
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root');

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false); // State for modal visibility
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent"); // Logging for debug
      setEmail(''); // Clear the email input
      setModalIsOpen(true); // Open modal on success
    } catch (error) {
      setError(error.message);
      console.error('Error sending password reset email:', error);
    }
  };

  // Close the modal and navigate to login
  const closeModal = () => {
    setModalIsOpen(false);
    navigate('/login'); // Navigate back to login after closing the modal
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
     <div className="max-w-md w-full p-5 border rounded-3xl shadow-lg bg-white">
  <div className="flex flex-col items-center mb-5">
    <HiLockClosed className="text-4xl mb-2" /> {/* Increased icon size */}
    <h1 className="text-3xl font-bold text-gray-800">Forgot Password</h1>
  </div>
  
  {/* Added informational sentence */}
  <p className="text-gray-600 text-sm mb-4 text-center">
    Enter your email address below and we'll send you a link to reset your password.
  </p>

  {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
  
  <form onSubmit={handlePasswordReset}>
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
    <button
      type="submit"
      className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
    >
      Reset Password
    </button>
  </form>

  <p className="mt-4 text-center text-gray-600">
    Remember your password?{' '}
    <button
      onClick={() => navigate('/login')} // Navigate back to the login page
      className="text-blue-600 hover:underline font-semibold"
    >
      Login
    </button>
  </p>
</div>


     {/* Modal for successful password reset */}
<Modal
  isOpen={modalIsOpen}
  onRequestClose={closeModal}
  contentLabel="Password Reset Successful"
  className="fixed inset-0 flex items-center justify-center z-50"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50"
>
  <div className="bg-white rounded-lg p-5 text-center shadow-lg w-11/12 md:w-1/3">
    <div className="flex items-center justify-center mb-4">
      {/* Check Circle Icon */}
      <HiLockClosed className="text-green-600 text-5xl" />
    </div>
    <h2 className="text-2xl font-bold text-green-600 mb-2">Password Reset Successful</h2>
    <p className="text-gray-700 mb-4">A password reset link has been sent to your email.</p>
    <div className="flex justify-center mt-6">
      <button
        onClick={closeModal}
        className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Close
      </button>
    </div>
  </div>
</Modal>


    </div>
  );
};

export default ForgotPassword;
