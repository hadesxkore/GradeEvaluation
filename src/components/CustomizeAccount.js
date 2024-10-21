import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { HiOutlineUserCircle } from 'react-icons/hi';
import Modal from 'react-modal'; // Import react-modal

// Set the app element for accessibility
Modal.setAppElement('#root'); // Ensure this matches your root element in the app

const CustomizeAccount = () => {
  const [userData, setUserData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    address: '',
    contactNumber: '',
    program: '',
    profilePicture: '',
    studentId: '', // Add studentId to the state
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUserData({
            firstName: userData.firstName || '',
            middleName: userData.middleName || '',
            lastName: userData.lastName || '',
            email: userData.email || user.email,
            address: userData.address || '',
            contactNumber: userData.contactNumber || '',
            program: userData.program || '',
            profilePicture: userData.profilePicture || '',
            studentId: userData.studentId || '', // Retrieve studentId from Firestore

          });
        }
      });
    }
  }, [user, db]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePictureFile(file);

      const imageUrl = URL.createObjectURL(file);
      setUserData((prevData) => ({
        ...prevData,
        profilePicture: imageUrl,
      }));
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      let profilePictureUrl = userData.profilePicture;

      // Upload profile picture if it exists
      if (profilePictureFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, profilePictureFile);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      // Ensure the profile picture URL is not too long
      if (profilePictureUrl && profilePictureUrl.length > 2048) {
        console.error('Profile picture URL exceeds maximum length.');
        setMessage('Failed to update profile. Photo URL is too long.');
        return;
      }

      // Update user document in Firestore
      await updateDoc(userDocRef, {
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        email: userData.email,
        address: userData.address,
        contactNumber: userData.contactNumber,
        program: userData.program,
        profilePicture: profilePictureUrl,
      });

      // Update Firebase authentication profile only if the URL is valid
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
        photoURL: profilePictureUrl || null,
      });

      setMessage('Profile updated successfully!');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error updating profile:', error.message);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-lg max-w-5xl mx-auto mt-8">
      <h2 className="text-3xl font-semibold mb-6 text-center">Student Information</h2>

      {message && (
        <div className="mb-4 p-3 rounded text-white bg-green-500">
          {message}
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col w-full md:w-1/3 items-center">
          <div className="relative w-48 h-48 mb-4">
            {userData.profilePicture ? (
              <img
                src={userData.profilePicture}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <HiOutlineUserCircle className="w-full h-full text-gray-400" />
            )}
            <label className="absolute inset-0 flex items-center justify-center ">
              <span className="sr-only">Change profile photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="text-sm text-gray-600 opacity-0 absolute inset-0 cursor-pointer"
              />
            </label>
          </div>
          <button
            type="button"
            className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
            onClick={() => document.querySelector('input[type="file"]').click()}
          >
            Choose Profile Picture
          </button>
          <div className="mt-4 bg-white p-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 w-full max-w-md flex flex-col items-center justify-center">
  <p className="text-sm font-medium text-gray-600">Student ID</p>
  <p className="text-2xl font-bold text-blue-700">{userData.studentId}</p>
</div>


        </div>

        <div className="flex flex-col gap-4 w-full md:w-2/3">
          <div>
            <label className="block text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={userData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Middle Name</label>
            <input
              type="text"
              name="middleName"
              value={userData.middleName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={userData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Contact Number</label>
            <input
              type="text"
              name="contactNumber"
              value={userData.contactNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Program</label>
            <input
              type="text"
              name="program"
              value={userData.program}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <Modal
  isOpen={isModalOpen}
  onRequestClose={() => setIsModalOpen(false)}
  className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto"
  overlayClassName="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center"
>
  <div className="flex flex-col items-center">
    <HiOutlineUserCircle className="h-16 w-16 text-green-500" />
    <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
      Profile Updated
    </h2>
    <p className="text-center text-gray-600 mb-6">
      Your profile information has been updated successfully!
    </p>
    <button
      onClick={() => setIsModalOpen(false)}
      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition duration-200 ease-in-out"
    >
      Close
    </button>
  </div>
</Modal>

    </div>
  );
};

export default CustomizeAccount;
