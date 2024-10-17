import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { HiOutlineUserCircle } from 'react-icons/hi';
import Modal from 'react-modal'; // Import react-modal

// Set the app element for accessibility
Modal.setAppElement('#root'); // Ensure this matches your root element in the app

const Residency = () => {
 
 
};

export default Residency;
