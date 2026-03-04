// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;

      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            console.log('User role:', userData.role);
            // Redirect based on role
            if (userData.role === 'Student') {
              navigate('/student-dashboard'); // Replace with your actual student dashboard route
            } else if (userData.role === 'Faculty') {
              navigate('/faculty-dashboard'); // Replace with your actual faculty dashboard route
            } else if (userData.role === 'Admin') {
              navigate('/admin-dashboard'); // Replace with your actual admin dashboard route
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      } else {
        navigate('/login'); // Redirect to login if user is not authenticated
      }
    };

    fetchUserRole();
  }, [navigate]);

  return (
    <div>
      {/* Dashboard Content can go here */}
      <h1>Welcome to the Dashboard</h1>
      {role && <p>Your role is: {role}</p>}
    </div>
  );
};

export default Dashboard;
