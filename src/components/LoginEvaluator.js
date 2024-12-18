import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Import the Firestore database
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

const LoginEvaluator = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
        // Sign in user with email and password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('Evaluator logged in successfully:', user);

        // Fetch evaluator data from Firestore using the UID
        const docRef = doc(db, 'evaluators', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const evaluatorData = docSnap.data();
            console.log('Evaluator data found:', evaluatorData);
            navigate('/evaluator-dashboard'); // Redirect on success
        } else {
            console.log('No evaluator data found for UID:', user.uid);
            setError('No evaluator data found');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        setError(error.message);
    }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full p-5 border rounded-lg shadow-lg bg-white">
        <h1 className="text-2xl font-bold mb-5 text-center">Login as Evaluator</h1>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center">
          Don't have an account? 
          <button
            onClick={() => navigate('/signup')} // Adjust the route as necessary
            className="text-blue-500 hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginEvaluator;
