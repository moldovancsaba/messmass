'use client';

import React, { useState, useEffect } from 'react';

export default function Home() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [showProjects, setShowProjects] = useState(false);
  const [projects] = useState([
    { name: 'Moldován x Csaba Tesztel', date: '8/17/2025', updated: '8/15/2025' },
    { name: 'Újpest FC x Kisvárda FC', date: '8/15/2025', updated: '8/15/2025' },
    { name: 'DVTK x Kazincbarcika', date: '8/16/2025', updated: '8/15/2025' },
    { name: 'MotoGP Balaton - Sunday', date: '8/24/2025', updated: '8/15/2025' },
    { name: 'MotoGP Balaton - Saturday', date: '8/23/2025', updated: '8/15/2025' },
    { name: 'MotoGP Balaton - Friday', date: '8/22/2025', updated: '8/15/2025' },
    { name: 'Hungary x Romania - MKOSZ', date: '8/15/2025', updated: '8/15/2025' },
  ]);
  
  const [stats, setStats] = useState({
    remoteImages: 0,
    hostessImages: 0,
    allSelfies: 0,
    remoteFans: 0,
    onLocationFan: 0,
    female: 0,
    male: 0,
    genAlpha: 0,
    genYZ: 0,
    genX: 0,
    boomer: 0,
    merched: 0,
    jersey: 0,
    scarfFlags: 0,
    baseballCap: 0
  });

  const incrementStat = (key: keyof typeof stats) => {
    setStats(prev => ({
      ...prev,
      [key]: prev[key] + 1
    }));
  };

  const resetStats = () => {
    setStats({
      remoteImages: 0,
      hostessImages: 0,
      allSelfies: 0,
      remoteFans: 0,
      onLocationFan: 0,
      female: 0,
      male: 0,
      genAlpha: 0,
      genYZ: 0,
      genX: 0,
      boomer: 0,
      merched: 0,
      jersey: 0,
      scarfFlags: 0,
      baseballCap: 0
    });
  };

  const saveProject = () => {
    if (!eventName.trim()) {
      alert('Please enter an event name');
      return;
    }
    alert('Project saved successfully!');
  };

  const downloadCSV = () => {
    alert('CSV download started');
  };

  const exportToGoogleSheets = () => {
    window.open('https://docs.google.com/spreadsheets/create', '_blank');
  };

  // Calculate totals
  const totalFans = stats.remoteFans + stats.onLocationFan;
  const totalDemographic = stats.female + stats.male;
  const totalUnder40 = stats.genAlpha + stats.genYZ;
  const totalOver40 = stats.genX + stats.boomer;
  const totalAgeGroups = totalUnder40 + totalOver40;

  const StatButton = ({ label, value, onClick, className = "" }: {
    label: string;
    value: number;
    onClick: () => void;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 ${className}`}
    >
      <div className="font-bold text-lg text-gray-900 mb-1">{label}</div>
      <div className="text-3xl font-bold text-blue-600">{value}</div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MessMass</h1>
          <p className="text-lg text-gray-600">Event Statistics Dashboard</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Project Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              onClick={() => setShowProjects(!showProjects)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-lg"
            >
              📁 Show Projects ({showProjects ? 'Hide' : projects.length})
            </button>
            <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg">
              ➕ New Project
            </button>
          </div>

          {showProjects && (
            <div className="mb-6 space-y-3">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Projects</h3>
              {projects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-bold text-lg text-gray-900">{project.name}</div>
                    <div className="text-sm text-gray-600">{project.date}</div>
                    <div className="text-sm text-gray-500">Updated: {project.updated}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      📂 Load
                    </button>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">Event Name:</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter event name"
              />
            </div>
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-2">Event Date:</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={saveProject}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg"
              >
                💾 Save Project
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Images & Fans */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Images & Fans</h2>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Images</h3>
              <div className="space-y-3">
                <StatButton
                  label="Remote Images"
                  value={stats.remoteImages}
                  onClick={() => incrementStat('remoteImages')}
                />
                <StatButton
                  label="Hostess Images"
                  value={stats.hostessImages}
                  onClick={() => incrementStat('hostessImages')}
                />
                <StatButton
                  label="All Selfies"
                  value={stats.allSelfies}
                  onClick={() => incrementStat('allSelfies')}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Fans</h3>
              <div className="space-y-3">
                <StatButton
                  label="Remote Fans"
                  value={stats.remoteFans}
                  onClick={() => incrementStat('remoteFans')}
                />
                <StatButton
                  label="On Location Fan"
                  value={stats.onLocationFan}
                  onClick={() => incrementStat('onLocationFan')}
                />
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-lg p-4">
              <div className="text-xl font-bold text-blue-900">Total Fans</div>
              <div className="text-3xl font-bold text-blue-600">{totalFans}</div>
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Demographics</h2>
            
            <div className="space-y-3 mb-6">
              <StatButton
                label="Female"
                value={stats.female}
                onClick={() => incrementStat('female')}
              />
              <StatButton
                label="Male"
                value={stats.male}
                onClick={() => incrementStat('male')}
              />
            </div>
            
            <div className="bg-purple-100 rounded-lg p-4">
              <div className="text-xl font-bold text-purple-900">Total Demographic</div>
              <div className="text-3xl font-bold text-purple-600">{totalDemographic}</div>
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Age Groups</h2>
            
            <div className="space-y-3 mb-4">
              <StatButton
                label="Gen Alpha"
                value={stats.genAlpha}
                onClick={() => incrementStat('genAlpha')}
              />
              <StatButton
                label="Gen Y+Z"
                value={stats.genYZ}
                onClick={() => incrementStat('genYZ')}
              />
            </div>
            
            <div className="bg-blue-100 rounded-lg p-4 mb-4">
              <div className="text-lg font-bold text-blue-900">Total Under 40</div>
              <div className="text-2xl font-bold text-blue-600">{totalUnder40}</div>
            </div>
            
            <div className="space-y-3 mb-4">
              <StatButton
                label="Gen X"
                value={stats.genX}
                onClick={() => incrementStat('genX')}
              />
              <StatButton
                label="Boomer"
                value={stats.boomer}
                onClick={() => incrementStat('boomer')}
              />
            </div>
            
            <div className="bg-orange-100 rounded-lg p-4 mb-4">
              <div className="text-lg font-bold text-orange-900">Total Over 40</div>
              <div className="text-2xl font-bold text-orange-600">{totalOver40}</div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-lg font-bold text-gray-900">Total Age Groups</div>
              <div className="text-2xl font-bold text-gray-600">{totalAgeGroups}</div>
            </div>
          </div>

          {/* Merchandise */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Merchandise</h2>
            
            <div className="space-y-3">
              <StatButton
                label="Merched"
                value={stats.merched}
                onClick={() => incrementStat('merched')}
              />
              <StatButton
                label="Jersey"
                value={stats.jersey}
                onClick={() => incrementStat('jersey')}
              />
              <StatButton
                label="Scarf + Flags"
                value={stats.scarfFlags}
                onClick={() => incrementStat('scarfFlags')}
              />
              <StatButton
                label="Baseball Cap"
                value={stats.baseballCap}
                onClick={() => incrementStat('baseballCap')}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={resetStats}
            className="px-8 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold text-lg"
          >
            Reset Stats
          </button>
          <button
            onClick={downloadCSV}
            className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg"
          >
            📁 Download CSV
          </button>
          <button
            onClick={exportToGoogleSheets}
            className="px-8 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-bold text-lg"
          >
            📊 Export to Google Sheets
          </button>
        </div>
      </div>
    </div>
  );
}
