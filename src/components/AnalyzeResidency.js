import React, { useState } from 'react';
import { HiEye, HiUserCircle } from 'react-icons/hi';
import manImage from '../images/man.png'; // Adjust the path based on your folder structure

const AnalyzeResidency = () => {
    // State to handle modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for sample residency details
    const residencyDetails = {
        name: 'Juan Dela Cruz',
        program: 'Industrial Engineering',
        yearLevel: '3rd Year',
        profilePicture: <img src={manImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />,
        remainingYears: 1, // Sample data for remaining years in college
    };

    // Open and close modal handlers
    const handleViewResidency = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Residency Management</h2>
            <p className="mb-4 text-gray-700">
                Manage your residency information effectively. Click below to view your residency details.
            </p>

            {/* View Residency Card */}
            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold flex items-center">
                    <HiEye className="mr-2 text-blue-500" /> View My Residency
                </h3>
                <p className="mt-2 text-gray-600">
                    View your residency details to ensure accurate representation of your living situation.
                </p>
                <button
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    onClick={handleViewResidency}
                >
                    View Residency
                </button>
            </div>
 {/* Modal for Residency Information */}
 {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md transition-all transform scale-95 hover:scale-100">
                        <h3 className="text-2xl font-semibold mb-4 text-center">Residency Information</h3>

                        <div className="flex items-center justify-start mb-6 space-x-6">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex justify-center items-center text-gray-500">
                                    {residencyDetails.profilePicture}
                                </div>
                            </div>
                            <div>
                                <p className="text-xl font-semibold text-gray-800">{residencyDetails.name}</p>
                                <p className="text-gray-600">{residencyDetails.program}</p>
                                <p className="text-gray-600">{residencyDetails.yearLevel}</p>
                            </div>
                        </div>

                        <p className="mb-6 text-gray-700 text-center">
                            You have <span className="font-bold text-blue-600">{residencyDetails.remainingYears}</span> more year(s) to finish your program.
                        </p>

                        <div className="flex justify-center">
                            <button
                                className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 focus:outline-none transition-colors"
                                onClick={closeModal}
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

export default AnalyzeResidency;
