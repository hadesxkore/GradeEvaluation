import React, { useState, useEffect } from 'react';
import { db, storage, auth  } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { HiEye, HiUpload, HiBell, HiOutlineTrash } from 'react-icons/hi';
import { getFirestore, setDoc, doc, onSnapshot,  query, where} from 'firebase/firestore'; // Import Firestore functions
import { getAuth } from 'firebase/auth'; // Import Firebase Auth
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged
import { deleteObject } from 'firebase/storage';


const ManageCourses = () => {
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null); // State to hold the file to delete

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);
    const [currentUser, setCurrentUser] = useState(null); // State to hold the current user
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const auth = getAuth(); // Get the current user authentication instance
    const db = getFirestore(); // Get the Firestore instance

    const handleUploadCourse = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFile(null);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadFile = async () => {
        if (!file) return alert('Please select a file to upload.');

        setUploading(true);
        const storageRef = ref(storage, `courses/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => {
                console.error('Upload failed:', error);
                setUploading(false);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                const userId = auth.currentUser.uid; // Get the current user's ID

                const fileDocId = file.name; // Use the file name as the document ID
                await setDoc(doc(db, 'coursesToEnroll', userId, 'files', fileDocId), {
                    fileName: file.name,
                    fileUrl: downloadURL,
                    uploadedAt: new Date(),
                });

                console.log('File uploaded successfully and data saved.');
                setUploading(false);
                handleCloseModal();
            }
        );
    };

    // Fetch uploaded files when the component mounts or when the user ID changes
    useEffect(() => {
        const fetchUploadedFiles = async () => {
            const userId = auth.currentUser.uid;
            const filesCollection = collection(db, 'coursesToEnroll', userId, 'files');
            const fileDocs = await getDocs(filesCollection);
            const files = fileDocs.docs.map(doc => doc.data());
            setUploadedFiles(files);
        };

        if (auth.currentUser) {
            fetchUploadedFiles();
        }
    }, [auth.currentUser]);


       // Listen for authentication state changes
       useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user); // Set the current user
        });

        return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

     // Fetch notifications for the current user
     useEffect(() => {
        if (!currentUser) return; // Ensure currentUser is available

        const fetchNotifications = () => {
            const q = query(
                collection(db, 'notifications'),
                where('studentId', '==', currentUser.uid) // Use the current user's ID
            );

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const notificationsArray = [];
                querySnapshot.forEach((doc) => {
                    notificationsArray.push({ id: doc.id, ...doc.data() });
                });
                setNotifications(notificationsArray);
            });

            return () => unsubscribe();
        };

        fetchNotifications();
    }, [currentUser]);

    const handleNotificationClick = (notification) => {
        setActiveNotification(notification);
        setIsNotificationModalOpen(true);
    };

    
    // Function to open the confirmation modal
    const handleDeleteConfirmation = (fileId) => {
        setFileToDelete(fileId); // Set the file to delete
        setIsDeleteConfirmOpen(true); // Open the confirmation modal
    };

    // Function to handle the actual deletion
    const handleDelete = async () => {
        console.log('Deleting file with ID:', fileToDelete); // Log the ID for debugging
        if (!fileToDelete) {
            console.error('fileToDelete is undefined');
            return; // Prevent further execution if fileToDelete is undefined
        }
    
        try {
            const userId = auth.currentUser.uid; // Get the current user's ID
            
            // Check if the file document exists
            const fileRef = doc(db, 'coursesToEnroll', userId, 'files', fileToDelete);
            const docSnap = await getDoc(fileRef);
            if (!docSnap.exists()) {
                console.error('No such document!');
                return; // Exit if the document does not exist
            }
    
            // Delete the file document from Firestore
            await deleteDoc(fileRef);
            console.log('File document deleted from Firestore.');
    
            // Delete the file from Storage
            const storageRef = ref(storage, `courses/${fileToDelete}`);
            await deleteObject(storageRef);
            console.log('File deleted from Storage.');
    
            // Update the state to remove the deleted file from the list
            setUploadedFiles((prevFiles) => prevFiles.filter((file) => file.fileName !== fileToDelete)); // Ensure correct property is used
            
            // Close the confirmation modal after deletion
            setIsDeleteConfirmOpen(false);
            setFileToDelete(null); // Reset file to delete
        } catch (error) {
            console.error('Error deleting file:', error);
            // Handle any errors (e.g., show a toast notification)
        }
    };
    
    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Manage Your Courses</h2>
            <p className="mb-4 text-gray-700">
                Upload new courses or view the ones you've added to keep track of your teaching content.
            </p>

            {/* Courses Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Course */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiUpload className="mr-2 text-blue-500" /> Upload Course
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Add a new course to share with your evaluator and expand your curriculum.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleUploadCourse}
                    >
                        Upload Course
                    </button>
                </div>

                {/* View My Courses */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow relative">
           {/* Notification Icon */}
{notifications.length > 0 && (
    <div
        className="absolute top-2 right-2 cursor-pointer p-2" // Added padding
        onClick={() => handleNotificationClick(notifications[0])} // Show the first notification
        title="View Notifications"
    >
        <HiBell className="text-red-600 text-3xl hover:text-red-800 transition-colors" /> {/* Increased size */}
    </div>
)}

            {/* View My Courses */}
            <h3 className="text-xl font-semibold flex items-center">
                <HiEye className="mr-2 text-green-500" /> View My Courses
            </h3>
            <p className="mt-2 text-gray-600">
                Review the courses you've uploaded and manage them as needed.
            </p>
            <button
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                onClick={() => setIsViewModalOpen(true)} // Open the view modal
            >
                View Courses
            </button>

                </div>
            </div>



{/* Notification Modal */}
{isNotificationModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 transition-opacity duration-300">
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h4 className="text-xl text-gray-800">
        Notification from: <span className="font-bold">Evaluator</span>
      </h4>

      {/* Message Card */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
        <p className="text-lg text-gray-800 leading-relaxed">
          {activeNotification?.message}
        </p>
      </div>

      <button
        className="mt-6 w-full bg-red-500 text-white px-4 py-2 rounded-md text-lg font-semibold hover:bg-red-600 transition-colors duration-200"
        onClick={() => setIsNotificationModalOpen(false)}
      >
        Close
      </button>
    </div>
  </div>
)}


           {/* Upload Course Modal */}
{isModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full transition-transform transform scale-100 hover:scale-105">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center">
                <HiUpload className="mr-2 text-blue-600" /> Upload Course
            </h3>
            <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                onChange={handleFileChange}
                className="mb-6 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none hover:border-blue-500 transition-colors"
            />
            <div className="flex justify-end space-x-2">
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={handleCloseModal}
                    disabled={uploading}
                >
                    Cancel
                </button>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={handleUploadFile}
                    disabled={uploading}
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
        </div>
    </div>
)}
{/* View My Courses Modal */}
{isViewModalOpen && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full transition-transform transform scale-100 hover:scale-105">
            <h3 className="text-2xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center">
                <HiEye className="mr-2 text-blue-600" /> Your Uploaded Courses
            </h3>
            <div className="space-y-4">
            {uploadedFiles.length === 0 ? (
                <p className="text-center text-gray-600">No courses uploaded yet.</p>
            ) : (
                uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm transition-shadow hover:shadow-md">
                        <span className="text-lg font-medium text-gray-700">{file.fileName}</span>
                        <div className="flex space-x-4">
                            <a 
                                href={file.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors flex items-center"
                            >
                                <HiEye className="mr-1" /> View
                            </a>
                            <button
                                className="text-red-500 hover:text-red-700 flex items-center"
                                onClick={() => handleDeleteConfirmation(file.fileName)} // Ensure you pass the correct file ID or file name
                            >
                                <HiOutlineTrash className="mr-1" /> Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
            <div className="flex justify-end mt-6">
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={handleCloseViewModal}
                >
                    Close
                </button>
            </div>
        </div>
    </div>
)}

{/* Delete Confirmation Modal */}
{isDeleteConfirmOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full transition-transform transform scale-100 hover:scale-105">
                        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Confirm Deletion</h3>
                        <p className="text-center text-gray-600">Are you sure you want to delete this course?</p>
                        <div className="flex justify-center space-x-4 mt-6">
                            <button
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={handleDelete}
                            >
                                Yes, Delete
                            </button>
                            <button
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                                onClick={() => setIsDeleteConfirmOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ManageCourses;
