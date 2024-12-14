// src/components/CreateEvaluatorAccount.js
import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, onSnapshot   } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Update this to your Firebase configuration file
import { HiPlus, HiEye, HiExclamation , HiCheckCircle } from 'react-icons/hi';
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
  const [showSuccessModalSec, setShowSuccessModalSec] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSuccessDeleteModal, setShowSuccessDeleteModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    facultyId: "",
    birthdate: "",
  });
  useEffect(() => {
    fetchEvaluators();
  }, [firestore]);

  const handleEditClick = (evaluator) => {
    setSelectedEvaluator(evaluator);
    setFormData({
      firstName: evaluator.firstName,
      middleName: evaluator.middleName,
      lastName: evaluator.lastName,
      email: evaluator.email,
      contactNumber: evaluator.contactNumber,
      address: evaluator.address,
      facultyId: evaluator.facultyId,
      birthdate: evaluator.birthdate,
    });
    setShowEditModal(true);
  };
  const handleDeleteClick = (evaluator) => {
    setSelectedEvaluator(evaluator);
    setShowDeleteModal(true);
  };
  const handleContactChange = (e) => {
    const value = e.target.value;
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Ensure it starts with '09' and only has 11 digits
    if (numericValue.length <= 11) {
      if (numericValue.startsWith('09')) {
        setFormData({ ...formData, contactNumber: numericValue });
      } else {
        setFormData({ ...formData, contactNumber: '09' + numericValue.slice(2) });
      }
    }
  };
  

  
 
  const handleSaveChanges = async () => {
    if (!selectedEvaluator || !selectedEvaluator.id) {
      console.error("Evaluator ID is not defined");
      return;
    }
  
    try {
      const evaluatorRef = doc(firestore, 'evaluators', selectedEvaluator.id);
  
      // Update the evaluator document in Firestore
      await updateDoc(evaluatorRef, {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        facultyId: formData.facultyId,
        birthdate: formData.birthdate,
        address: formData.address,
        contactNumber: formData.contactNumber,
      });
  
      console.log("Evaluator updated successfully:", formData);
      setShowEditModal(false);
      setShowSuccessModalSec(true);
  
      // Real-time update listener (onSnapshot)
      onSnapshot(evaluatorRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Update your local state or handle the new data from Firestore
          const updatedEvaluator = docSnapshot.data();
          console.log("Evaluator real-time data:", updatedEvaluator);
  
          // Optionally, you can update the state here
          // setSelectedEvaluator(updatedEvaluator);
        }
      });
    } catch (error) {
      console.error("Error updating evaluator:", error);
      alert('There was an error updating the evaluator information.');
    }
  };

  // Handle delete evaluator
  const handleDeleteEvaluator = async () => {
    if (!selectedEvaluator || !selectedEvaluator.id) {
      console.error("Evaluator ID is not defined for deletion");
      return;
    }

    try {
      const evaluatorRef = doc(firestore, 'evaluators', selectedEvaluator.id);
      await deleteDoc(evaluatorRef);
      setShowDeleteModal(false);
      setShowSuccessDeleteModal(true);
      fetchEvaluators(); // Refresh evaluator list
    } catch (error) {
      console.error("Error deleting evaluator:", error);
    }
  };
 
  const fetchEvaluators = () => {
    try {
      const evaluatorsRef = collection(firestore, 'evaluators');
  
      // Real-time listener for the evaluators collection
      onSnapshot(evaluatorsRef, (querySnapshot) => {
        const evaluatorsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        console.log('Fetched Evaluators (Real-time):', evaluatorsList); // Debugging line
  
        // Update the state with the new list of evaluators
        setEvaluators(evaluatorsList);
        setFilteredEvaluators(evaluatorsList);
      });
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
    await setDoc(doc(db, 'evaluators', user.uid), {
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

    // Preventing navigation at this point
    // If you're using react-router, do not call any redirect/navigation logic here

  } catch (error) {
    setError('Error creating account: ' + error.message);
  }
};

 // Function to prevent entering numbers in First Name and Middle Name
 const handleNameChange = (e, fieldName) => {
  const value = e.target.value;
  const updatedValue = value.replace(/[^A-Za-z\s]/g, ''); // Allow only letters and spaces
  setFormData({ ...formData, [fieldName]: updatedValue });
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
<div className="bg-gray-800 text-white rounded-lg shadow-md p-5 mb-4">
  <h2 className="text-2xl font-semibold mb-3">Evaluator Management</h2>
  <p className="mb-4 text-gray-300">
    Manage evaluator accounts efficiently. Create new accounts and view existing ones.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Create Evaluator Account */}
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiPlus className="mr-2 text-green-400" /> Create Evaluator Account
      </h3>
      <p className="mt-2 text-gray-200">Add a new evaluator account to the system.</p>
      <button
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        onClick={openModal}
      >
        Create Account
      </button>
    </div>

    {/* View Evaluators */}
    <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold flex items-center">
        <HiEye className="mr-2 text-blue-400" /> View Evaluators
      </h3>
      <p className="mt-2 text-gray-200">View all evaluators in the system.</p>
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
    <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-2xl">
      <h2 className="text-3xl font-semibold mb-6 text-center text-white">Create Evaluator Account</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {success && <p className="text-green-500 text-center mb-4">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name Input */}
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Middle Name Input */}
        <input
          type="text"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          placeholder="Middle Name"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Last Name Input */}
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Email Input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
          pattern="^[a-zA-Z0-9._%+-]+@bpsu.edu.ph$"
          onBlur={(e) => setEmail(e.target.value + '@bpsu.edu.ph')} // Automatically append the domain
        />
        
        {/* Password Input */}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
        />
        {/* Contact Number Input */}
<input
  type="text"
  value={contactNumber}
  onChange={(e) => {
    let value = e.target.value.replace(/[^\d]/g, ''); // Allow only numbers
    if (value.length > 11) value = value.slice(0, 11); // Limit to 11 digits

    // Ensure it starts with "09"
    if (value.length === 1 && value !== '0') value = '09'; // Automatically add "09" if starting with a single digit

    // If the value starts with '09', allow the rest of the input
    if (value.startsWith('09') && value.length <= 11) {
      setContactNumber(value);
    }
  }}
  placeholder="Contact Number"
  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
/>

        
        {/* Address Input */}
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
        />
        
        {/* Date of Birth Input */}
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring focus:ring-blue-500"
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} // Disable dates for users under 18
        />
        
        {/* Faculty ID Input */}
        <input
          type="text"
          value={facultyId}
          onChange={(e) => {
            const value = e.target.value.replace(/[^\d]/g, ''); // Allow only digits
            if (value.length <= 7) {
              setFacultyId(value.length > 2 ? `${value.slice(0, 2)}-${value.slice(2)}` : value);
            }
          }}
          placeholder="Faculty ID"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring focus:ring-blue-500"
          maxLength="8"
        />
      </div>
      
      <div className="flex justify-end mt-6">
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors mr-2"
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
      <h3 className="text-2xl text-center text-green-500">Success</h3>
      <p className="text-center mt-4">Evaluator account has been created successfully!</p>
      <div className="flex justify-center mt-6">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          onClick={() => setShowSuccessModal(false)} // Close modal when clicked
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

<div className="bg-white shadow-lg rounded-lg overflow-hidden">
  <div className="p-6 bg-gray-100">
    <input
      type="text"
      placeholder="Search by Faculty ID or First Name..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-400 transition duration-150 ease-in-out"
    />
  </div>
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse border border-gray-300">
      <thead className="bg-blue-700 text-white">
        <tr>
          <th className="py-4 px-5 text-left">First Name</th>
          <th className="py-4 px-5 text-left">Middle Name</th>
          <th className="py-4 px-5 text-left">Last Name</th>
          <th className="py-4 px-5 text-left">Email</th>
          <th className="py-4 px-5 text-left">Faculty ID</th>
          <th className="py-4 px-5 text-left">Date of Birth</th>
          <th className="py-4 px-5 text-left">Address</th>
          <th className="py-4 px-5 text-left">Role</th>
          <th className="py-4 px-5 text-left">Contact Number</th>
          <th className="py-4 px-5 text-left">Actions</th> {/* New Action column */}

        </tr>
      </thead>
      <tbody className="bg-white">
        {filteredEvaluators.length > 0 ? (
          filteredEvaluators.map(evaluator => (
            <tr key={evaluator.id} className="border-b hover:bg-blue-50 transition duration-150 ease-in-out">
              <td className="py-3 px-5 text-center">{evaluator.firstName}</td>
              <td className="py-3 px-5 text-center">{evaluator.middleName}</td>
              <td className="py-3 px-5 text-center">{evaluator.lastName}</td>
              <td className="py-3 px-5 text-center">{evaluator.email}</td>
              <td className="py-3 px-5 text-center">{evaluator.facultyId}</td>
              <td className="py-3 px-5 text-center">{evaluator.birthdate}</td>
              <td className="py-3 px-5 text-center">{evaluator.address}</td>
              <td className="py-3 px-5 text-center">{evaluator.role}</td>
              <td className="py-3 px-5 text-center">{evaluator.contactNumber}</td>
        
              <td className="py-3 px-5 text-center">
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                      onClick={() => handleEditClick(evaluator)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-lg ml-2"
                      onClick={() => handleDeleteClick(evaluator)}
                    >
                      Delete
                    </button>
                  </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="9" className="py-3 px-5 text-center text-gray-500">No evaluators found.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

{showEditModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center transition-opacity duration-300">
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Edit Evaluator</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleNameChange(e, 'firstName')}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>
          
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">Middle Name</label>
            <input
              id="middleName"
              type="text"
              value={formData.middleName}
              onChange={(e) => handleNameChange(e, 'middleName')}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700">Faculty ID</label>
            <input
              id="facultyId"
              type="text"
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleNameChange(e, 'lastName')}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">Birthdate</label>
            <input
              id="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              required
            />
          </div>

          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input
              id="contactNumber"
              type="text"
              value={formData.contactNumber}
              onChange={(e) => handleContactChange(e)}
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              pattern="09\d{9}" // Only allows numbers starting with '09' and 11 digits in total
              title="Contact Number must start with '09' and be 11 digits long"
              required
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={handleSaveChanges}
          className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          Save Changes
        </button>
        <button
          onClick={() => setShowEditModal(false)}
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* Delete Confirmation Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm transform transition-all duration-300 scale-95 hover:scale-100">
      
      {/* Icon Section */}
      <div className="flex justify-center mb-4">
        <HiExclamation className="text-yellow-500 text-6xl" />
      </div>

      {/* Modal Title */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Are you sure you want to delete{" "}
        <span className="font-bold">{selectedEvaluator?.firstName}{" "}{selectedEvaluator?.lastName}</span>?
      </h2>
      
      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleDeleteEvaluator}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
        >
          Yes, Delete
        </button>
        <button
          onClick={() => setShowDeleteModal(false)}
          className="bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}



{/* Success Modal */}
{showSuccessModalSec && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm transform transition-all duration-300 scale-95 hover:scale-100">
      <div className="flex justify-center mb-4">
        <HiCheckCircle className="text-green-500 text-7xl" />
      </div>
      
      <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
        Success!
      </h2>
      <p className="text-center text-gray-600 mb-6">
  The evaluator's information has been successfully updated.
</p>


      <div className="flex justify-center">
        <button
          onClick={() => setShowSuccessModalSec(false)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* Success Delete Confirmation Modal */}
{showSuccessDeleteModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm transform transition-all duration-300 scale-95 hover:scale-100">
      
      {/* Icon Section */}
      <div className="flex justify-center mb-4">
        <HiCheckCircle className="text-red-500 text-6xl" />
      </div>

      {/* Modal Title */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Success!
      </h2>
      
      {/* Modal Message */}
      <p className="text-lg text-gray-600 mb-6 text-center">
        The evaluator <span className="font-semibold">{selectedEvaluator?.firstName} {selectedEvaluator?.lastName}</span> has been successfully deleted.
      </p>
      
      {/* Action Button */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setShowSuccessDeleteModal(false)}
          className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default CreateEvaluatorAccount;
