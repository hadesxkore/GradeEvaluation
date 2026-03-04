import React, { useState } from 'react';
import { HiPlus, HiEye, HiPencil, HiTrash } from 'react-icons/hi';

// Set the app element for accessibility
const DownloadCourses = () => {
    // Define state variables if needed
    const [courses, setCourses] = useState([]);

    // Functions to handle button actions
    const handleAddCourse = () => {
        console.log('Add Course clicked');
    };

    const handleShowCourses = () => {
        console.log('Show Courses clicked');
    };

    const handleEditCourse = () => {
        console.log('Edit Course clicked');
    };

    const handleDeleteCourse = () => {
        console.log('Delete Course clicked');
    };

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Courses Taken</h2>
            <p className="mb-4 text-gray-700">
                Manage your courses efficiently. You can add new courses, view your enrolled courses, edit details, and remove any course you no longer need.
            </p>

            {/* Courses Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Add Course */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPlus className="mr-2 text-green-500" /> Add Course
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Add a new course to your profile to keep track of your learning journey.
                    </p>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        onClick={handleAddCourse}
                    >
                        Add Course
                    </button>
                </div>

                {/* Show Courses */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiEye className="mr-2 text-blue-500" /> Show Courses
                    </h3>
                    <p className="mt-2 text-gray-600">
                        View all your enrolled courses to monitor your progress and achievements.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleShowCourses}
                    >
                        Show Courses
                    </button>
                </div>

                {/* Edit Course */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiPencil className="mr-2 text-orange-500" /> Edit Course
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Update course details to ensure accurate representation of your educational background.
                    </p>
                    <button
                        className="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
                        onClick={handleEditCourse}
                    >
                        Edit Course
                    </button>
                </div>

                {/* Delete Course */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiTrash className="mr-2 text-red-500" /> Delete Course
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Remove any course that you no longer wish to keep on your profile.
                    </p>
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                        onClick={handleDeleteCourse}
                    >
                        Delete Course
                    </button>
                </div>
            </div>

            {/* Conclusion Section */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold">Optimize Your Learning</h4>
                <p className="text-gray-600">
                    Use these tools to effectively manage your courses, enhancing your educational experience.
                </p>
            </div>
        </div>
    );
};

export default DownloadCourses;
