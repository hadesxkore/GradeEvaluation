import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Modal from 'react-modal';
import html2canvas from 'html2canvas'; // Import html2canvas
import { jsPDF } from 'jspdf'; // Correctly import jsPDF

// Set the app element for accessibility
Modal.setAppElement('#root');

const Reports = () => {
  const [studentsCount, setStudentsCount] = useState(0);
  const [evaluatorsCount, setEvaluatorsCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const firestore = getFirestore();

  useEffect(() => {
    const fetchReports = async () => {
      await fetchStudentsCount();
      await fetchEvaluatorsCount();
    };
    fetchReports();
  }, []);

  const fetchStudentsCount = async () => {
    const studentsQuery = query(collection(firestore, 'users'), where('role', '==', 'Student'));
    const studentsSnapshot = await getDocs(studentsQuery);
    setStudentsCount(studentsSnapshot.docs.length);
  };

  const fetchEvaluatorsCount = async () => {
    const evaluatorsQuery = query(collection(firestore, 'evaluators'), where('role', '==', 'evaluator'));
    const evaluatorsSnapshot = await getDocs(evaluatorsQuery);
    setEvaluatorsCount(evaluatorsSnapshot.docs.length);
  };

  const studentsChartData = {
    labels: [`Total Students: ${studentsCount}`],
    datasets: [
      {
        label: 'Number of Students',
        data: [studentsCount],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const evaluatorsChartData = {
    labels: [`Total Evaluators: ${evaluatorsCount}`],
    datasets: [
      {
        label: 'Number of Evaluators',
        data: [evaluatorsCount],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const openModal = (data) => {
    setModalData(data);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  // Print function for the chart
  const printChart = (chartId) => {
    const printArea = document.getElementById(chartId);
    html2canvas(printArea).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'pt', 'a4'); // Create a new jsPDF instance
      pdf.addImage(imgData, 'PNG', 20, 20);
      pdf.save(`${chartId}.pdf`);
    });
  };

  return (
    <div className="flex flex-col items-center min-h-full bg-gray-100">
      <h2 className="text-5xl font-bold mb-8 text-gray-800">Reports Overview</h2>
      <div className="w-full max-w-6xl mt-0">
        {/* Total Students Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 transition-transform transform hover:scale-105">
          <h3 className="text-4xl font-semibold text-blue-600 mb-2">Total Students</h3>
          <div className="h-60" id="studentsChart">
            <Bar data={studentsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="flex justify-center space-x-4 mt-4"> {/* Centered and spaced */}
  <button
    onClick={() => printChart('studentsChart')} // Pass the chart id
    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors text-lg w-40" // Increased width
  >
    Print Chart
  </button>
  <button
    onClick={() => openModal(studentsChartData)}
    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors text-lg w-40" // Increased width
  >
    View Details
  </button>
</div>

        </div>

        {/* Total Evaluators Card */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8 transition-transform transform hover:scale-105">
          <h3 className="text-4xl font-semibold text-red-600 mb-2">Total Evaluators</h3>
          <div className="h-60" id="evaluatorsChart">
            <Bar data={evaluatorsChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="flex justify-center space-x-4 mt-4"> {/* Centered and spaced */}
  <button
    onClick={() => printChart('evaluatorsChart')} // Pass the chart id
    className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-500 transition-colors text-lg w-40" // Increased width
  >
    Print Chart
  </button>
  <button
    onClick={() => openModal(evaluatorsChartData)}
    className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-500 transition-colors text-lg w-40" // Increased width
  >
    View Details
  </button>
</div>

        </div>
      </div>

      {/* Modal for Chart Viewing */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            height: '90%',
            borderRadius: '15px',
            padding: '20px',
            border: 'none',
            boxShadow: '0 6px 30px rgba(0, 0, 0, 0.5)',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
        }}
      >
        <button onClick={closeModal} className="absolute top-4 right-4 bg-red-600 text-white py-2 px-4 rounded-full">
          Close
        </button>
        {modalData && (
          <div className="h-full w-full p-4">
            <h3 className="text-3xl font-bold mb-4 text-center">{modalData.datasets[0].label}</h3>
            <Bar
              data={modalData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: 20,
                },
              }}
              height={500}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
