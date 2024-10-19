// src/components/CreateEvaluatorAccount.js
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs,  } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Update this to your Firebase configuration file
import { HiPlus, HiEye, HiSearch, HiCheckCircle } from 'react-icons/hi';
import Modal from 'react-modal';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import doc and setDoc


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
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchEvaluators();
  }, [firestore]);

 
  const fetchEvaluators = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'evaluators')); // Changed from 'users' to 'evaluators'
      const evaluatorsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Fetched Evaluators:', evaluatorsList); // Debugging line
      setEvaluators(evaluatorsList);
      setFilteredEvaluators(evaluatorsList);
    } catch (error) {
      console.error('Error fetching evaluators:', error);
    }
  };
  
  
  useEffect(() => {
    const filtered = evaluators.filter(evaluator => {
      const facultyIdLower = evaluator.facultyId ? evaluator.facultyId.toLowerCase() : '';
      const firstNameLower = evaluator.firstName ? evaluator.firstName.toLowerCase() : '';
      return (
        facultyIdLower.includes(searchTerm.toLowerCase()) ||
        firstNameLower.includes(searchTerm.toLowerCase())
      );
    });

    setFilteredEvaluators(filtered);
  }, [searchTerm, evaluators]);

  const handleCreateAccount = async () => {
    setError('');
    setSuccess('');
    try {
      // Create the user account using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save evaluator's data directly into the 'evaluators' collection using UID as a document ID
      await setDoc(doc(db, 'evaluators', user.uid), { // Changed 'users' to 'evaluators'
        firstName,
        middleName,
        lastName,
        email: user.email,
        contactNumber,
        address,
        birthdate,
        facultyId,
        createdAt: new Date(),
        role: 'evaluator', // Assign role as 'evaluator'
      });

      console.log('Evaluator created:', { firstName, lastName });

      setSuccess('Evaluator account created successfully!');
      resetForm();
      setShowSuccessModal(true); // Show success modal
      fetchEvaluators(); // Refresh the list after creating
    } catch (error) {
      setError('Error creating account: ' + error.message);
    }
  };
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setContactNumber('');
    setAddress('');
    setBirthdate('');
    setFacultyId('');
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div className="p-5">
      {/* Main Card for Evaluator Management */}
      <div className="bg-white rounded-lg shadow-md p-5 mb-4">
        <h2 className="text-2xl font-semibold mb-3">Evaluator Management</h2>
        <p className="mb-4 text-gray-700">
          Manage evaluator accounts efficiently. Create new accounts and view existing ones.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Evaluator Account */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold flex items-center">
              <HiPlus className="mr-2 text-green-500" /> Create Evaluator Account
            </h3>
            <p className="mt-2 text-gray-600">Add a new evaluator account to the system.</p>
            <button
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              onClick={openModal}
            >
              Create Account
            </button>
          </div>

          {/* View Evaluators */}
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold flex items-center">
              <HiEye className="mr-2 text-blue-500" /> View Evaluators
            </h3>
            <p className="mt-2 text-gray-600">View all evaluators in the system.</p>
            <button
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              onClick={fetchEvaluators}
            >
              Show Evaluators
            </button>
          </div>
        </div>
      </div>

    {/* Modal for creating an evaluator */}
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-3xl font-semibold mb-6 text-center">Create Evaluator Account</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name Input */}
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Middle Name Input */}
        <input
          type="text"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          placeholder="Middle Name"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Last Name Input */}
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Contact Number Input */}
        <input
          type="text"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="Contact Number"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Address Input */}
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Date of Birth Input */}
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Faculty ID Input */}
        <input
          type="text"
          value={facultyId}
          onChange={(e) => setFacultyId(e.target.value)}
          placeholder="Faculty ID"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors mr-2"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          onClick={handleCreateAccount}
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}


{showSuccessModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="flex items-center justify-center mb-4">
        <HiCheckCircle className="text-green-500 text-7xl" /> {/* Success Icon */}
      </div>
      <h2 className="text-2xl font-semibold text-center text-green-600">Success</h2>
      <p className="text-center mt-2 text-gray-700">{success}</p>
      <div className="mt-6">
        <button
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          onClick={() => setShowSuccessModal(false)} // Close the success modal
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

<div className="bg-white shadow-md rounded-lg overflow-hidden">
  <div className="p-4 bg-gray-50">
    <input
      type="text"
      placeholder="Search by Faculty ID or First Name..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500 transition duration-150 ease-in-out"
    />
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse border border-gray-300">
      <thead className="bg-blue-600 text-white">
        <tr>
          <th className="py-3 px-4">First Name</th>
          <th className="py-3 px-4">Middle Name</th>
          <th className="py-3 px-4">Last Name</th>
          <th className="py-3 px-4">Email</th>
          <th className="py-3 px-4">Faculty ID</th>
          <th className="py-3 px-4">Date of Birth</th>
          <th className="py-3 px-4">Address</th>
          <th className="py-3 px-4">Role</th>
          <th className="py-3 px-4">Contact Number</th>
        </tr>
      </thead>
      <tbody className="bg-white">
        {filteredEvaluators.length > 0 ? (
          filteredEvaluators.map(evaluator => (
            <tr key={evaluator.id} className="border-b hover:bg-blue-50 transition duration-150 ease-in-out">
              <td className="py-2 px-4 text-center">{evaluator.firstName}</td>
              <td className="py-2 px-4 text-center">{evaluator.middleName}</td>
              <td className="py-2 px-4 text-center">{evaluator.lastName}</td>
              <td className="py-2 px-4 text-center">{evaluator.email}</td>
              <td className="py-2 px-4 text-center">{evaluator.facultyId}</td>
              <td className="py-2 px-4 text-center">{evaluator.birthdate}</td>
              <td className="py-2 px-4 text-center">{evaluator.address}</td>
              <td className="py-2 px-4 text-center">{evaluator.role}</td>
              <td className="py-2 px-4 text-center">{evaluator.contactNumber}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="9" className="py-2 px-4 text-center text-gray-500">No evaluators found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

    </div>
  );
};

export default CreateEvaluatorAccount;
