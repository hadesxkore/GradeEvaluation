import React, { useState, useEffect } from 'react';
import { HiUpload, HiEye, HiCheckCircle, HiPlusCircle, HiSave, HiXCircle, HiDocumentText  } from 'react-icons/hi';
import { db, auth } from '../firebase';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Modal from 'react-modal';
import { Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';


const UploadGrades = () => {
    const [showModal, setShowModal] = useState(false);
    const [showInputModal, setShowInputModal] = useState(false);
    const [showFileModal, setShowFileModal] = useState(false);
    const [subjects, setSubjects] = useState([{ subjectName: '', grade: '' }]);
    const [file, setFile] = useState(null);
    const [grades, setGrades] = useState([]);
    const [files, setFiles] = useState([]);
    
    const [showViewGradesModal, setShowViewGradesModal] = useState(false);
    
    useEffect(() => {
        if (showViewGradesModal) {
            fetchGrades();
        }
    }, [showViewGradesModal]);

    const handleUploadGrade = () => {
        setShowModal(true);
    };

   
    const handleCloseModal = () => {
        setShowModal(false);
        setShowInputModal(false);
        setShowFileModal(false);
        setShowViewGradesModal(false);
    };
    const handleInputUpload = () => {
        setShowModal(false);
        setShowInputModal(true);
    };

    const handleFileUpload = () => {
        setShowModal(false);
        setShowFileModal(true);
    };

    const handleSaveGrade = async () => {
        const userId = auth.currentUser?.uid;
    
        if (subjects.every((entry) => entry.subjectName && entry.grade)) {
            try {
                // Use writeBatch instead of db.batch()
                const batch = writeBatch(db);
    
                subjects.forEach(({ subjectName, grade }) => {
                    const gradeId = uuidv4();
                    const gradeRef = doc(db, 'grades', userId, 'subjects', gradeId);
                    batch.set(gradeRef, { subjectName, grade });
                });
    
                await batch.commit();
                alert('Grades saved successfully!');
                setSubjects([{ subjectName: '', grade: '' }]);
                handleCloseModal();
            } catch (error) {
                console.error('Error saving grades:', error);
                alert('Failed to save the grades. Please try again.');
            }
        } else {
            alert('Please provide both subject name and grade for each entry.');
        }
    };

    const handleAddSubject = () => {
        setSubjects([...subjects, { subjectName: '', grade: '' }]);
    };

    const handleInputChange = (index, field, value) => {
        const updatedSubjects = [...subjects];
        updatedSubjects[index][field] = value;
        setSubjects(updatedSubjects);
    };

    const handleRemoveSubject = (index) => {
        const updatedSubjects = subjects.filter((_, i) => i !== index);
        setSubjects(updatedSubjects);
    };

    const handleFileChange = (event) => {
        if (event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleSaveFile = async () => {
        if (file) {
            const userId = auth.currentUser?.uid;
            const fileId = uuidv4();
    
            try {
                const storage = getStorage();
                const fileRef = ref(storage, `grades/${userId}/files/${fileId}_${file.name}`);
    
                // Upload the file to Firebase Storage
                await uploadBytes(fileRef, file);
    
                // Get the download URL
                const fileUrl = await getDownloadURL(fileRef);
    
                // Store the file metadata including the download URL in Firestore
                await setDoc(doc(db, 'grades', userId, 'files', fileId), {
                    fileName: file.name,
                    fileType: file.type,
                    fileUrl, // Store the URL of the uploaded file
                    uploadedAt: new Date(),
                });
    
                alert('File uploaded successfully!');
                setFile(null);
                handleCloseModal();
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Failed to upload the file. Please try again.');
            }
        } else {
            alert('Please select a file to upload.');
        }
    };

    const fetchGrades = async () => {
        const userId = auth.currentUser?.uid;
        try {
            const subjectsSnapshot = await getDocs(collection(db, 'grades', userId, 'subjects'));
            const filesSnapshot = await getDocs(collection(db, 'grades', userId, 'files'));

            const subjectsData = subjectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const filesData = filesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setGrades(subjectsData);
            setFiles(filesData);
        } catch (error) {
            console.error('Error fetching grades:', error);
            alert('Failed to load grades.');
        }
    };

    const handleViewGrades = () => {
        setShowViewGradesModal(true);
    };
    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">Manage Grades</h2>
<p className="mb-4 text-gray-700">
    Easily upload and view your grades using the options below.
</p>

{/* Grades Management Section */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Upload My Grade */}
    <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold flex items-center text-green-700">
            <HiUpload className="mr-2 text-green-600" /> Upload My Grade
        </h3>
        <p className="mt-2 text-gray-600">
            Upload your grades to keep track of your academic progress.
        </p>
        <button
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            onClick={handleUploadGrade}
        >
            Upload My Grade
        </button>
    </div>

    {/* View My Grade */}
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-lg transition-shadow">
        <h3 className="text-xl font-semibold flex items-center text-blue-700">
            <HiEye className="mr-2 text-blue-600" /> View My Grade
        </h3>
        <p className="mt-2 text-gray-600">
            View the grades you've uploaded to monitor your academic performance.
        </p>
        <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            onClick={handleViewGrades}
        >
            View My Grade
        </button>
    </div>
</div>



            {showViewGradesModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">My Grades</h3>
            <table className="w-full mb-6 table-auto border-collapse">
                <thead>
                    <tr className="bg-gray-300">
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b">Subject</th>
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-700 border-b">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.map((grade) => (
                        <tr key={grade.id} className="hover:bg-gray-100">
                            <td className="px-6 py-4 border-b">{grade.subjectName}</td>
                            <td className="px-6 py-4 border-b">{grade.grade}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Uploaded Files</h3>
            <ul className="mb-6">
    {files.map((file) => (
        <li key={file.id} className="mb-3">
            <div className="flex items-center justify-between">
                <span className="text-gray-700">{file.fileName}</span>
                <div className="ml-4">
                    {file.fileUrl.endsWith('.pdf') ? (
                        <div className="w-full h-64 mt-2">
                            <Viewer fileUrl={file.fileUrl} />
                        </div>
                    ) : (
                        <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition duration-300 flex items-center"
                        >
                            <span className="mr-1">View</span>
                            <HiEye className="h-4 w-4" />
                        </a>
                    )}
                </div>
            </div>
        </li>
    ))}
</ul>

            <button
                className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded transition duration-300 hover:bg-red-700"
                onClick={handleCloseModal}
            >
                Close
            </button>
        </div>
    </div>
)}



           {/* Modal for selecting upload method */}
{showModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold text-center mb-4">Choose Upload Method</h3>
            <div className="space-y-3">
                <button
                    className="flex items-center justify-center w-full mb-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
                    onClick={handleInputUpload}
                >
                    <HiDocumentText className="mr-2 h-5 w-5" /> {/* Icon for Input Upload */}
                    Upload via Input
                </button>
                <button
                    className="flex items-center justify-center w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300"
                    onClick={handleFileUpload}
                >
                    <HiUpload className="mr-2 h-5 w-5" /> {/* Icon for File Upload */}
                    Upload via File
                </button>
                <button
                    className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition duration-300"
                    onClick={handleCloseModal}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}

          
{/* Modal for input-based grade upload */}
{showInputModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold text-center mb-4">Add Subjects and Grades</h3>
            <div className={`grid ${subjects.length > 2 ? 'grid-cols-3' : 'grid-cols-1'} gap-4`}>
                {subjects.map((subject, index) => (
                    <div key={index} className="flex flex-col mb-2">
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Subject Name"
                            value={subject.subjectName}
                            onChange={(e) =>
                                handleInputChange(index, 'subjectName', e.target.value)
                            }
                        />
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                            placeholder="Grade"
                            value={subject.grade}
                            onChange={(e) =>
                                handleInputChange(index, 'grade', e.target.value)
                            }
                        />
                        {subjects.length > 1 && (
                            <button
                                className="text-red-500 text-sm mt-1 hover:underline"
                                onClick={() => handleRemoveSubject(index)}
                            >
                                <HiXCircle className="inline mr-1" />
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex flex-col gap-2 mt-4">
                <button
                    className="flex items-center justify-center w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
                    onClick={handleAddSubject}
                >
                    <HiPlusCircle className="mr-2 h-5 w-5" />
                    Add More Subject
                </button>
                <button
                    className="flex items-center justify-center w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300"
                    onClick={handleSaveGrade}
                >
                    <HiSave className="mr-2 h-5 w-5" />
                    Save Grades
                </button>
                <button
                    className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition duration-300"
                    onClick={handleCloseModal}
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
)}
            {/* Modal for file-based grade upload */}
            {showFileModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                        <input
                            type="file"
                            className="w-full mb-2 p-2 border rounded"
                            onChange={handleFileChange}
                        />
                        <button
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            onClick={handleSaveFile}
                        >
                            Save File
                        </button>
                        <button
                            className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            onClick={handleCloseModal}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadGrades;
