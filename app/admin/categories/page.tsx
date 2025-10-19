'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import styles from './Categories.module.css';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';

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
  
  // WHAT: Server-side pagination state following HashtagEditor pattern
  // WHY: Consistent pagination behavior across all admin pages
  const [categories, setCategories] = useState<HashtagCategory[]>([]);
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;
  
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

  // WHAT: Debounce search input to reduce API calls
  // WHY: Prevents excessive requests while user is typing
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // WHAT: Load first page whenever the debounced search changes
  // WHY: Server-side search with pagination following established pattern
  useEffect(() => {
    const loadFirst = async () => {
      setLoading(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const qs = debouncedTerm
          ? `?search=${encodeURIComponent(debouncedTerm)}&offset=0&limit=${PAGE_SIZE}`
          : `?offset=0&limit=${PAGE_SIZE}`;
        const res = await fetch(`/api/hashtag-categories${qs}`, { cache: 'no-store', signal: ctrl.signal });
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
          setNextOffset(data.pagination?.nextOffset ?? null);
          setTotalMatched(data.pagination?.totalMatched ?? data.categories?.length ?? 0);
        } else {
          setError(data.error || 'Failed to load categories');
        }
      } catch (err) {
        // Swallow abort errors silently; log others
        if ((err as any)?.name !== 'AbortError') {
          console.error('Failed to fetch categories:', err);
          setError('Failed to load categories');
        }
      } finally {
        setLoading(false);
      }
    };

    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm]);

  // WHAT: Load more categories for pagination
  // WHY: "Load 20 more" button functionality
  const loadMore = async () => {
    if (loadingMore || nextOffset == null) return;
    setLoadingMore(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const qs = debouncedTerm
        ? `?search=${encodeURIComponent(debouncedTerm)}&offset=${nextOffset}&limit=${PAGE_SIZE}`
        : `?offset=${nextOffset}&limit=${PAGE_SIZE}`;
      const res = await fetch(`/api/hashtag-categories${qs}`, { cache: 'no-store', signal: ctrl.signal });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => [...prev, ...(data.categories || [])]);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched ?? totalMatched);
      }
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Failed to load more categories:', err);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // WHAT: Refresh categories after create/update/delete
  // WHY: Keeps displayed data in sync with database
  const refreshCategories = async () => {
    setLoading(true);
    try {
      const qs = debouncedTerm
        ? `?search=${encodeURIComponent(debouncedTerm)}&offset=0&limit=${PAGE_SIZE}`
        : `?offset=0&limit=${PAGE_SIZE}`;
      const res = await fetch(`/api/hashtag-categories${qs}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched ?? data.categories?.length ?? 0);
      }
    } catch (err) {
      console.error('Failed to refresh categories:', err);
    } finally {
      setLoading(false);
    }
  };

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
      // WHAT: Use apiPost() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPost('/api/hashtag-categories', {
        name: formData.name.trim(),
        color: formData.color,
        order: formData.order
      });

      if (data.success) {
        resetForm();
        setShowCreateForm(false);
        await refreshCategories();
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
      // WHAT: Use apiPut() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiPut('/api/hashtag-categories', {
        id: editingCategory._id,
        name: formData.name.trim(),
        color: formData.color,
        order: formData.order
      });

      if (data.success) {
        resetForm();
        setShowEditForm(false);
        await refreshCategories();
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
      // WHAT: Use apiDelete() for automatic CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header
      const data = await apiDelete(`/api/hashtag-categories?id=${categoryId}`);

      if (data.success) {
        await refreshCategories();
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to delete category');
    }
  };

  // WHAT: Show loading state during initial fetch
  // WHY: Better UX while waiting for server response
  if (loading && categories.length === 0) {
    return (
      <div className="page-container">
        <div className={styles.loading}>Loading categories...</div>
      </div>
    );
  }

if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorText}>{error}</div>
          <button className={styles.retryButton} onClick={refreshCategories}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <AdminHero
        title="🌍 Category Manager"
        subtitle="Manage hashtag categories with colors and display order"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search categories..."
        actionButtons={[
          {
            label: 'New Category',
            icon: '➕',
            onClick: () => setShowCreateForm(true),
            variant: 'primary'
          }
        ]}
      />

      {/* WHAT: Pagination stats header showing X of Y items
       * WHY: User feedback on search/filter results */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Showing {categories.length} of {totalMatched} categories
          </div>
        </div>
      )}

      {/* WHAT: Categories grid using centralized ColoredCard component
       * WHY: Single source of truth for colored card styling - NO inline borderLeftColor styles
       *      ColoredCard handles all card design (padding, border, hover, shadow) */}
      <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <ColoredCard 
                  key={category._id} 
                  accentColor={category.color}
                  className={styles.categoryContent}
                >
                  {/* WHAT: Horizontal layout with content on left, action buttons on right
                   * WHY: Prevents buttons from pushing content when they appear/disappear */}
                  <div className={styles.categoryHorizontalLayout}>
                    {/* Left side: Category content */}
                    <div className={styles.categoryContentArea}>
                      <div className={styles.categoryHeader}>
                        <div className={styles.categoryTitle}>
                          <h3 className={styles.categoryName}>{category.name}</h3>
                        </div>
                      </div>

                      {/* Category Info */}
                      <div className={styles.categoryFooter}>
                        <span>Order: {category.order}</span>
                        <span>Updated {new Date(category.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Right side: Action buttons stacked vertically */}
                    {/* WHAT: Using centralized button classes from components.css
                     * WHY: NO inline styles - using global design system */}
                    <div className="action-buttons-container">
                      <button 
                        className="btn btn-small btn-primary action-button" 
                        onClick={() => handleEditCategory(category._id)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-small btn-danger action-button" 
                        onClick={() => handleDeleteCategory(category._id, category.name)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </ColoredCard>
              ))}
      </div>

      {/* WHAT: Load More button for pagination
       * WHY: Allows loading additional categories when more than 20 exist */}
      {categories.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {nextOffset != null ? (
            <button className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
            </button>
          ) : (
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
          )}
        </div>
      )}

      {/* Empty State */}
      {categories.length === 0 && !loading && (
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
                className="btn btn-small btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCategory}
                disabled={!formData.name.trim()}
                className="btn btn-small btn-primary"
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
                className="btn btn-small btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCategory}
                disabled={!formData.name.trim()}
                className="btn btn-small btn-primary"
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
