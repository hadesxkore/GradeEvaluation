import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';

import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

const App = () => {
  return (
    <Router>
      {/* Global Sileo toast notifications — top-center on every page */}
      <Toaster
        position="top-center"
        offset={16}
        options={{
          fill: '#171717',
          duration: 4000,
          roundness: 12,
          styles: {
            description: 'sileo-desc-white',
          },
        }}
      />
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
        <Route path="/ForgotPassword/*" element={<ForgotPassword />} />
        <Route path="/faculty-dashboard/*" element={<FacultyDashboard />} />
        <Route path="/admin-dashboard/*" element={<AdminDashboard />} />
        <Route path="*" element={<SignUp />} />
      </Routes>
    </Router>
  );
};

export default App;
