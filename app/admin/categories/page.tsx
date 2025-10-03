'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import styles from './Categories.module.css';

interface HashtagCategory {
  _id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<HashtagCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<HashtagCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HashtagCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3b82f6',
    order: 0
  });

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
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3b82f6',
      order: 0
    });
    setEditingCategory(null);
  };

  // Handle form submission for creating
  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/hashtag-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
          order: formData.order
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
    }
  };

  // Handle form submission for updating
  const handleUpdateCategory = async () => {
    if (!formData.name.trim() || !editingCategory) {
      alert('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/hashtag-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory._id,
          name: formData.name.trim(),
          color: formData.color,
          order: formData.order
        })
      });

      const data = await response.json();
      if (data.success) {
        resetForm();
        setShowEditForm(false);
        await fetchCategories();
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      alert('Failed to update category');
    }
  };

  // Open edit form with category data
  const handleEditCategory = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        color: category.color,
        order: category.order
      });
      setShowEditForm(true);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/hashtag-categories?id=${categoryId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        await fetchCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category');
    }
  };

  // Loading state removed - show content immediately

if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>{error}</div>
          <button className={styles.retryButton} onClick={fetchCategories}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHero
        title="Categories"
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        actionButtons={[{ label: '➥ New Category', onClick: () => setShowCreateForm(true), variant: 'primary' }]}
        backLink="/admin"
      />

      <div>
          {/* Categories Grid */}
          <div>
            <div className={styles.categoryGrid}>
              {filteredCategories.map((category) => (
                <div key={category._id} className={styles.categoryCard}>
                  {/* Category Header */}
                  <div className={styles.categoryHeader}>
                    <div className={styles.categoryTitle}>
                      <div className={styles.categoryDot} style={{ background: category.color }} />
                      <h3 className={styles.categoryName}>{category.name}</h3>
                    </div>
                    <div className={styles.categoryActions}>
                      <button className={styles.editButton} onClick={() => handleEditCategory(category._id)}>✏️ Edit</button>
                      <button className={styles.deleteButton} onClick={() => handleDeleteCategory(category._id, category.name)}>🗑️ Delete</button>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className={styles.categoryFooter}>
                    <span>Order: {category.order}</span>
                    <span>Updated {new Date(category.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <h3 className={styles.emptyTitle}>
                  {searchTerm ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className={styles.emptyText}>
                  {searchTerm 
                    ? `No categories match "${searchTerm}"`
                    : 'Create your first hashtag category to get started'
                  }
                </p>
                {!searchTerm && (
                  <button className={styles.createFirstButton} onClick={() => setShowCreateForm(true)}>
                    ➕ Create First Category
                  </button>
                )}
              </div>
            )}
          </div>
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
                  transition: 'border-color 0.2s ease',
                  background: 'white',
                  color: '#000000'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            {/* Order */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  background: 'white',
                  color: '#000000'
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
                    transition: 'border-color 0.2s ease',
                    background: 'white',
                    color: '#000000'
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
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!formData.name.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !formData.name.trim() ? '#e5e7eb' : '#3b82f6',
                  color: !formData.name.trim() ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !formData.name.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                🆕 Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditForm && editingCategory && (
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
                ✏️ Edit Category
              </h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
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
                  transition: 'border-color 0.2s ease',
                  background: 'white',
                  color: '#000000'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>

            {/* Order */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  background: 'white',
                  color: '#000000'
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
            <div style={{ marginBottom: '2rem' }}>
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
                    transition: 'border-color 0.2s ease',
                    background: 'white',
                    color: '#000000'
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

            {/* Form Actions */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  resetForm();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!formData.name.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: !formData.name.trim() ? '#e5e7eb' : '#f59e0b',
                  color: !formData.name.trim() ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !formData.name.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                ✏️ Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
