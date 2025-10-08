'use client';

import React, { useState, useEffect } from 'react';
import HashtagCategoryDebug from '@/components/HashtagCategoryDebug';

interface ProjectData {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags: string[];
  categorizedHashtags: { [categoryName: string]: string[] };
  viewSlug?: string;
  createdAt: string;
}

interface DebugResponse {
  success: boolean;
  data: {
    projectsWithCategories: ProjectData[];
    projectsWithTraditional: ProjectData[];
    counts: {
      totalWithCategorized: number;
      totalWithTraditional: number;
      totalProjects: number;
    };
  };
}

export default function HashtagCategoriesDebugPage() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug/categorized-hashtags');
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Failed to fetch debug data');
        console.error('Debug fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card max-w-2xl">
          <h1 className="mb-md">Loading...</h1>
          <div>Fetching hashtag category mappings</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-container">
        <div className="error-card max-w-2xl">
          <h1 className="mb-md text-error">Error</h1>
          <div>{error || 'Failed to load data'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="page-container max-w-2xl">
        {/* Header */}
        <div className="card card-lg text-center mb-lg">
          <div className="card-body">
            <h1 className="text-2xl font-bold text-gray-900 mb-md">
              🏷️ Hashtag Categories Debug
            </h1>
            <p className="text-gray-600 text-lg">
              View hashtag-to-category mappings for projects
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="stats-grid mb-lg">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl font-bold text-success mb-sm">
                {data.data.counts.totalWithCategorized}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Projects with Categories
              </div>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl font-bold" style={{color: '#f59e0b'}}>
                {data.data.counts.totalWithTraditional}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Traditional Hashtags Only
              </div>
            </div>
          </div>
          
          <div className="card text-center">
            <div className="card-body">
              <div className="text-4xl font-bold text-primary-700 mb-sm">
                {data.data.counts.totalProjects}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Total Projects
              </div>
            </div>
          </div>
        </div>

        {/* Projects with Categories */}
        {data.data.projectsWithCategories.length > 0 && (
          <div className="card card-lg mb-lg">
            <div className="card-header">
              <h2 className="text-xl font-bold text-gray-900 m-0">
                🎯 Projects with Categorized Hashtags ({data.data.projectsWithCategories.length})
              </h2>
            </div>
            <div className="card-body">
              {data.data.projectsWithCategories.map((project) => (
                <div key={project._id} className="mb-lg">
                  <div className="flex justify-between items-center mb-sm">
                    <h3 className="m-0 text-lg font-semibold text-gray-900">
                      {project.eventName}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {new Date(project.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Category Debug Display */}
                  <HashtagCategoryDebug
                    projectData={{
                      hashtags: project.hashtags,
                      categorizedHashtags: project.categorizedHashtags
                    }}
                    title={`Hashtag Mapping for ${project.eventName}`}
                  />
                  
                  {/* Compact display */}
                  <div className="mt-sm">
                    <strong className="text-sm text-gray-700">
                      Formatted Output:
                    </strong>
                    <HashtagCategoryDebug
                      projectData={{
                        hashtags: project.hashtags,
                        categorizedHashtags: project.categorizedHashtags
                      }}
                      compact={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects with Traditional Hashtags */}
        {data.data.projectsWithTraditional.length > 0 && (
          <div className="card card-lg">
            <div className="card-header">
              <h2 className="text-xl font-bold text-gray-900 m-0">
                📝 Projects with Traditional Hashtags Only ({data.data.projectsWithTraditional.length})
              </h2>
            </div>
            <div className="card-body">
              {data.data.projectsWithTraditional.map((project) => (
                <div key={project._id} className="mb-lg">
                  <div className="flex justify-between items-center mb-sm">
                    <h3 className="m-0 text-lg font-semibold text-gray-900">
                      {project.eventName}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {new Date(project.eventDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-sm">
                    {project.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="hashtag-badge"
                      >
                        #{hashtag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
