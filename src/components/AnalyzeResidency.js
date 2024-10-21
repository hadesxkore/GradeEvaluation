import React, { useState } from 'react';
import { HiPlus, HiEye, HiPencil, HiTrash } from 'react-icons/hi';

// Set the app element for accessibility
const AnalyzeResidency = () => {
    // Define state variables if needed
    const [residencies, setResidencies] = useState([]);

    // Functions to handle button actions
    const handleAddResidency = () => {
        console.log('Add Residency clicked');
    };

    const handleShowResidencies = () => {
        console.log('Show Residencies clicked');
    };

    const handleEditResidency = () => {
        console.log('Edit Residency clicked');
    };

    const handleDeleteResidency = () => {
        console.log('Delete Residency clicked');
    };

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Residency Management</h2>
            <p className="mb-4 text-gray-700">
                Manage your residency information effectively. You can add new residency details, view your current residencies, edit information, and remove any residency you no longer need.
            </p>

            {/* Residency Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Residency */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPlus className="mr-2 text-green-500" /> Add Residency
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Add a new residency to keep your living arrangements up to date.
                    </p>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        onClick={handleAddResidency}
                    >
                        Add Residency
                    </button>
                </div>

                {/* Show Residencies */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiEye className="mr-2 text-blue-500" /> Show Residencies
                    </h3>
                    <p className="mt-2 text-gray-600">
                        View all your residency details to ensure accurate representation of your living situation.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleShowResidencies}
                    >
                        Show Residencies
                    </button>
                </div>

                {/* Edit Residency */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPencil className="mr-2 text-orange-500" /> Edit Residency
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Update residency details to ensure they reflect your current living arrangements.
                    </p>
                    <button
                        className="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
                        onClick={handleEditResidency}
                    >
                        Edit Residency
                    </button>
                </div>

                {/* Delete Residency */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiTrash className="mr-2 text-red-500" /> Delete Residency
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Remove any residency that you no longer wish to keep on your profile.
                    </p>
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        onClick={handleDeleteResidency}
                    >
                        Delete Residency
                    </button>
                </div>
            </div>

            {/* Conclusion Section */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold">Manage Your Living Arrangements</h4>
                <p className="text-gray-600">
                    Use these tools to effectively manage your residency information and ensure everything is up to date.
                </p>
            </div>
        </div>
    );
};

export default AnalyzeResidency;
