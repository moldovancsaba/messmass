'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageHero from '@/components/AdminPageHero';

interface HashtagCategory {
  _id: string;
  name: string;
  description?: string;
  color: string;
  hashtags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<HashtagCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<HashtagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    hashtags: [] as string[]
  });
  const [newHashtag, setNewHashtag] = useState('');

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/hashtag-categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
        setFilteredCategories(data.categories);
      } else {
        setError(data.error || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.hashtags && category.hashtags.some(hashtag => hashtag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      hashtags: []
    });
    setNewHashtag('');
  };

  // Handle form submission
  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/hashtag-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
          hashtags: formData.hashtags
        })
      });

      const data = await response.json();
      if (data.success) {
        resetForm();
        setShowCreateForm(false);
        await fetchCategories();
      } else {
        alert(data.error || 'Failed to create category');
      }
    } catch (err) {
      console.error('Failed to create category:', err);
      alert('Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  // Add hashtag to form
  const handleAddHashtag = () => {
    const hashtag = newHashtag.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (hashtag && !formData.hashtags.includes(hashtag)) {
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, hashtag]
      }));
      setNewHashtag('');
    }
  };

  // Remove hashtag from form
  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== hashtagToRemove)
    }));
  };

  const handleEditCategory = (categoryId: string) => {
    // TODO: Open edit category modal/form
    console.log('Edit category:', categoryId);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/hashtag-categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchCategories();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</div>
          <div>Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div>{error}</div>
          <button
            onClick={fetchCategories}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <AdminPageHero
        title="Categories"
        icon="📂"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        onAction={() => setShowCreateForm(true)}
        actionLabel="➥ New Category"
        backLink="/admin"
      />

      {/* Categories Grid */}
      <div className="admin-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCategories.map((category) => (
            <div
              key={category._id}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Category Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: category.color
                  }} />
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {category.name}
                  </h3>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => handleEditCategory(category._id)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id, category.name)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Description */}
              {category.description && (
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {category.description}
                </p>
              )}

              {/* Hashtags */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {category.hashtags && category.hashtags.length > 0 ? (
                  <>
                    {category.hashtags.slice(0, 5).map((hashtag) => (
                      <span
                        key={hashtag}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'rgba(107, 114, 128, 0.1)',
                          color: '#4b5563',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          fontWeight: '500'
                        }}
                      >
                        #{hashtag}
                      </span>
                    ))}
                    {category.hashtags.length > 5 && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(107, 114, 128, 0.1)',
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        borderRadius: '6px'
                      }}>
                        +{category.hashtags.length - 5} more
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    fontStyle: 'italic'
                  }}>
                    No hashtags yet
                  </span>
                )}
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#6b7280',
                borderTop: '1px solid rgba(107, 114, 128, 0.1)',
                paddingTop: '0.75rem'
              }}>
                <span>{category.hashtags ? category.hashtags.length : 0} hashtags</span>
                <span>Updated {new Date(category.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {searchTerm ? 'No categories found' : 'No categories yet'}
            </h3>
            <p style={{ marginBottom: '1.5rem' }}>
              {searchTerm 
                ? `No categories match "${searchTerm}"`
                : 'Create your first hashtag category to get started'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                ➕ Create First Category
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Category Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#1f2937',
                margin: 0
              }}>
                🆕 Create New Category
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Category Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sport, Team, Location"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Description (optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            {/* Color Picker */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Category Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  style={{
                    width: '3rem',
                    height: '3rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3b82f6"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
              </div>
            </div>

            {/* Hashtags */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Hashtags (optional)
              </label>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHashtag();
                    }
                  }}
                  placeholder="Add a hashtag..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                />
                <button
                  onClick={handleAddHashtag}
                  disabled={!newHashtag.trim()}
                  style={{
                    padding: '0.75rem 1rem',
                    background: newHashtag.trim() ? '#10b981' : '#e5e7eb',
                    color: newHashtag.trim() ? 'white' : '#9ca3af',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: newHashtag.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add
                </button>
              </div>

              {/* Current Hashtags */}
              {formData.hashtags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {formData.hashtags.map((hashtag) => (
                    <span
                      key={hashtag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}
                    >
                      #{hashtag}
                      <button
                        onClick={() => handleRemoveHashtag(hashtag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '1rem',
                          lineHeight: 1
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                disabled={creating}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: creating ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={creating || !formData.name.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: creating || !formData.name.trim() ? '#e5e7eb' : '#3b82f6',
                  color: creating || !formData.name.trim() ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating || !formData.name.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {creating ? 'Creating...' : '🆕 Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
