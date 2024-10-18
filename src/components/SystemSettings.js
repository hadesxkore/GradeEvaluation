// src/components/SystemSettings.js
import React, { useState } from 'react';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const SystemSettings = () => {
  const [settingName, setSettingName] = useState('');
  const [settingValue, setSettingValue] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const firestore = getFirestore();

  const handleUpdateSetting = async () => {
    setError('');
    setSuccess('');
    try {
      const settingsDoc = doc(firestore, 'settings', 'systemSettings');
      await updateDoc(settingsDoc, {
        [settingName]: settingValue,
        updatedAt: new Date(),
      });
      setSuccess('System setting updated successfully!');
      setSettingName('');
      setSettingValue('');
    } catch (error) {
      setError('Error updating setting: ' + error.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-5 border rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-3">System Settings</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <input
        type="text"
        value={settingName}
        onChange={(e) => setSettingName(e.target.value)}
        placeholder="Setting Name"
        className="w-full mb-2 p-2 border rounded"
      />
      <input
        type="text"
        value={settingValue}
        onChange={(e) => setSettingValue(e.target.value)}
        placeholder="Setting Value"
        className="w-full mb-2 p-2 border rounded"
      />
      <button
        onClick={handleUpdateSetting}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
      >
        Update Setting
      </button>
    </div>
  );
};

export default SystemSettings;
