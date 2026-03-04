// src/components/ContentCustomization.js
import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const ContentCustomization = () => {
  const [curriculum, setCurriculum] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const firestore = getFirestore();

  const handleUpdateCurriculum = async () => {
    setError('');
    setSuccess('');
    try {
      const curriculumDoc = doc(firestore, 'settings', 'curriculum');
      await updateDoc(curriculumDoc, {
        content: curriculum,
        updatedAt: new Date(),
      });
      setSuccess('Curriculum updated successfully!');
      setCurriculum('');
    } catch (error) {
      setError('Error updating curriculum: ' + error.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-5 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">Content Customization</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <textarea
        value={curriculum}
        onChange={(e) => setCurriculum(e.target.value)}
        placeholder="Update Curriculum Content"
        rows={5}
        className="w-full mb-2 p-2 border rounded"
      ></textarea>
      <button
        onClick={handleUpdateCurriculum}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
      >
        Update Curriculum
      </button>
    </div>
  );
};

export default ContentCustomization;
