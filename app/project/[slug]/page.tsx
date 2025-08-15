'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Calendar, Wifi, WifiOff } from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  date: string;
  slug: string;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({
    visitors: 1,
    activeSessions: 1,
    conversions: 0,
    revenue: 1
  });

  useEffect(() => {
    // Mock project data based on slug
    setProject({
      id: '1',
      name: decodeURIComponent(params.slug as string).replace(/-/g, ' '),
      date: new Date().toISOString().split('T')[0],
      slug: params.slug as string
    });

    // Simulate connection
    setConnected(true);
  }, [params.slug]);

  const incrementStat = (key: keyof typeof stats) => {
    setStats(prev => ({
      ...prev,
      [key]: prev[key] + 1
    }));
  };

  const decrementStat = (key: keyof typeof stats) => {
    setStats(prev => ({
      ...prev,
      [key]: Math.max(0, prev[key] - 1)
    }));
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, onIncrement, onDecrement }: {
    title: string;
    value: number;
    onIncrement: () => void;
    onDecrement: () => void;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="text-3xl font-bold text-blue-600 mb-4">{value}</div>
      <div className="flex space-x-2">
        <button
          onClick={onIncrement}
          className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Add 1
        </button>
        <button
          onClick={onDecrement}
          className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Remove 1
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 capitalize">
                {project.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{project.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {connected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Visitors"
            value={stats.visitors}
            onIncrement={() => incrementStat('visitors')}
            onDecrement={() => decrementStat('visitors')}
          />
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            onIncrement={() => incrementStat('activeSessions')}
            onDecrement={() => decrementStat('activeSessions')}
          />
          <StatCard
            title="Conversions"
            value={stats.conversions}
            onIncrement={() => incrementStat('conversions')}
            onDecrement={() => decrementStat('conversions')}
          />
          <StatCard
            title="Revenue"
            value={stats.revenue}
            onIncrement={() => incrementStat('revenue')}
            onDecrement={() => decrementStat('revenue')}
          />
        </div>
      </div>
    </div>
  );
}
