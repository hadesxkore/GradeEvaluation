import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';

import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css'; // Make sure Tailwind and other styles are imported here

const App = () => {
  return (
    <Router>
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
