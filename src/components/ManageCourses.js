import React, { useState } from 'react';
import { HiEye, HiDownload, HiShare } from 'react-icons/hi';

// Set the app element for accessibility
const ManageCourses = () => {
    // Define state variables if needed
    const [courses, setCourses] = useState([]);

    // Functions to handle button actions
    const handleShowEnrolledCourses = () => {
        console.log('Show Enrolled Courses clicked');
    };

    const handleDownloadCertificates = () => {
        console.log('Download Certificates clicked');
    };

    const handleShareCourses = () => {
        console.log('Share Courses clicked');
    };

    return (
        <div className="p-5 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-3">Courses Enrolled</h2>
            <p className="mb-4 text-gray-700">
                Keep track of the courses you are currently enrolled in. You can view details, download certificates, and share your progress with others.
            </p>

            {/* Courses Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Show Enrolled Courses */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiEye className="mr-2 text-blue-500" /> Show Enrolled Courses
                    </h3>
                    <p className="mt-2 text-gray-600">
                        View all the courses you are currently enrolled in to track your learning journey.
                    </p>
                    <button
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={handleShowEnrolledCourses}
                    >
                        Show Courses
                    </button>
                </div>

                {/* Download Certificates */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiDownload className="mr-2 text-green-500" /> Download Certificates
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Download your course completion certificates to showcase your achievements.
                    </p>
                    <button
                        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                        onClick={handleDownloadCertificates}
                    >
                        Download Certificates
                    </button>
                </div>

                {/* Share Courses */}
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 shadow-sm hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-semibold flex items-center">
                        <HiShare className="mr-2 text-purple-500" /> Share Your Courses
                    </h3>
                    <p className="mt-2 text-gray-600">
                        Share your enrolled courses with friends and family to celebrate your learning progress.
                    </p>
                    <button
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                        onClick={handleShareCourses}
                    >
                        Share Courses
                    </button>
                </div>
            </div>

            {/* Conclusion Section */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold">Enhance Your Learning Journey</h4>
                <p className="text-gray-600">
                    Utilize these options to effectively manage and showcase your enrolled courses.
                </p>
            </div>
        </div>
    );
};

export default ManageCourses;
