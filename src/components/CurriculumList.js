import React, { useState } from 'react';
import { HiPlus, HiEye, HiPencil, HiTrash } from 'react-icons/hi';

// Set the app element for accessibility
const CurriculumList = () => {
    // Define state variables if needed
    const [curriculums, setCurriculums] = useState([]);

    // Functions to handle button actions
    const handleAddCurriculum = () => {
        console.log('Add Curriculum clicked');
    };

    const handleShowCurriculums = () => {
        console.log('Show Curriculums clicked');
    };

    const handleEditCurriculum = () => {
        console.log('Edit Curriculum clicked');
    };

    const handleDeleteCurriculum = () => {
        console.log('Delete Curriculum clicked');
    };

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Curriculum Management</h2>
            <p className="mb-4 text-gray-700">
                Manage your curriculum details effectively. You can add new curriculums, view your existing ones, edit information, and remove any curriculum you no longer need.
            </p>

            {/* Curriculum Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Curriculum */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPlus className="mr-2 text-green-500" /> Add Curriculum
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Add a new curriculum to keep track of your educational programs.
                    </p>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        onClick={handleAddCurriculum}
                    >
                        Add Curriculum
                    </button>
                </div>

                {/* Show Curriculums */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiEye className="mr-2 text-blue-500" /> Show Curriculums
                    </h3>
                    <p className="mt-2 text-gray-600">
                        View all your curriculums to monitor your academic progress and course structure.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleShowCurriculums}
                    >
                        Show Curriculums
                    </button>
                </div>

                {/* Edit Curriculum */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPencil className="mr-2 text-orange-500" /> Edit Curriculum
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Update curriculum details to ensure they reflect your current programs and courses.
                    </p>
                    <button
                        className="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
                        onClick={handleEditCurriculum}
                    >
                        Edit Curriculum
                    </button>
                </div>

                {/* Delete Curriculum */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiTrash className="mr-2 text-red-500" /> Delete Curriculum
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Remove any curriculum that you no longer wish to keep on your profile.
                    </p>
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        onClick={handleDeleteCurriculum}
                    >
                        Delete Curriculum
                    </button>
                </div>
            </div>

            {/* Conclusion Section */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold">Optimize Your Education</h4>
                <p className="text-gray-600">
                    Use these tools to effectively manage your curriculum, enhancing your educational experience.
                </p>
            </div>
        </div>
    );
};

export default CurriculumList;
