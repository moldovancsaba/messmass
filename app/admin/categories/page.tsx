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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                🆕 Create New Category
              </h2>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
            {/* Category Name */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Category Name *
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sport, Team, Location"
              />
            </div>

            {/* Order */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Display Order
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            {/* Color Picker */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Category Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  className="form-input color-picker"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
                <input
                  type="text"
                  className="form-input flex-1"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            </div>

            {/* Form Actions */}
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!formData.name.trim()}
                className="btn btn-sm btn-primary"
              >
                🆕 Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditForm && editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                ✏️ Edit Category
              </h2>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  resetForm();
                }}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
            {/* Category Name */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Category Name *
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sport, Team, Location"
              />
            </div>

            {/* Order */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Display Order
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            {/* Color Picker */}
            <div className="form-group mb-6">
              <label className="form-label-block text-sm text-gray-700">
                Category Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  className="form-input color-picker"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
                <input
                  type="text"
                  className="form-input flex-1"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            </div>

            {/* Form Actions */}
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  resetForm();
                }}
                className="btn btn-sm btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!formData.name.trim()}
                className="btn btn-sm btn-primary"
              >
                ✔️ Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
