'use client';

// app/admin/content-library/page.tsx
// WHAT: Content Management System admin interface
// WHY: Enable non-technical users to manage images and text blocks for charts
// HOW: Search, filter, upload, edit, and delete assets with usage tracking

import React, { useState, useEffect, useMemo } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import { FormModal } from '@/components/modals';
import ImageUploadField from '@/components/ImageUploadField';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './page.module.css';
import {
  type ContentAsset,
  type ContentAssetFormData,
  type ChartReference,
  formatAssetToken,
  generateSlug,
  isValidSlug
} from '@/lib/contentAssetTypes';

export default function ContentLibraryPage() {
  // State management
  const [assets, setAssets] = useState<ContentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'text'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'usageCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'image' | 'text'>('image');
  const [editingAsset, setEditingAsset] = useState<ContentAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<ContentAsset | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ asset: ContentAsset; charts: ChartReference[] } | null>(null);
  
  // Load assets
  useEffect(() => {
    loadAssets();
  }, []);
  
  const loadAssets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content-assets');
      const data = await response.json();
      
      if (data.success) {
        setAssets(data.assets || []);
        console.log(`✅ Loaded ${data.assets?.length || 0} content assets`);
      } else {
        console.error('❌ Failed to load assets:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // WHAT: Get unique categories from existing assets
  // WHY: Dynamic category filter based on actual data
  const categories = useMemo(() => {
    const cats = Array.from(new Set(assets.map(a => a.category).filter(Boolean)));
    return ['all', ...cats.sort()];
  }, [assets]);
  
  // WHAT: Filter and sort assets
  // WHY: Support search, type filter, category filter, and sorting
  const filteredAssets = useMemo(() => {
    let filtered = [...assets];
    
    // Text search
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.title.toLowerCase().includes(query) ||
        asset.description?.toLowerCase().includes(query) ||
        asset.slug.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(asset => asset.type === typeFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(asset => asset.category === categoryFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let compareA: any = a[sortBy];
      let compareB: any = b[sortBy];
      
      if (sortBy === 'title') {
        compareA = compareA.toLowerCase();
        compareB = compareB.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
    
    return filtered;
  }, [assets, searchTerm, typeFilter, categoryFilter, sortBy, sortOrder]);
  
  // WHAT: Copy asset reference token to clipboard
  // WHY: Quick insertion into chart formulas
  const copyToken = (asset: ContentAsset) => {
    const token = formatAssetToken(asset.type, asset.slug);
    navigator.clipboard.writeText(token);
    alert(`✅ Copied: ${token}`);
  };
  
  // WHAT: Check asset usage before deletion
  // WHY: Warn user if asset is referenced in charts
  const checkUsage = async (asset: ContentAsset) => {
    try {
      const response = await fetch(`/api/content-assets/usage?slug=${asset.slug}`);
      const data = await response.json();
      
      if (data.success) {
        setUsageInfo({ asset, charts: data.charts });
      }
    } catch (error) {
      console.error('❌ Error checking usage:', error);
    }
  };
  
  // WHAT: Delete asset (with force flag if needed)
  // WHY: Safe deletion with usage validation
  const deleteAsset = async (force = false) => {
    if (!deletingAsset) return;
    
    try {
      const forceParam = force ? '?force=true' : '';
      const response = await fetch(`/api/content-assets?slug=${deletingAsset.slug}${forceParam}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        setDeletingAsset(null);
        loadAssets();
      } else {
        if (data.error.includes('currently used')) {
          // Show usage info
          await checkUsage(deletingAsset);
        } else {
          alert(`❌ ${data.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error deleting asset:', error);
      alert('Failed to delete asset');
    }
  };
  
  return (
    <div className="page-container">
      <AdminHero
        title="📚 Content Library"
        subtitle="Define image and text variables for event-specific content"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by title, slug, tags..."
        actionButtons={[
          {
            label: '📷 New Image Variable',
            onClick: () => {
              setCreateType('image');
              setShowCreateModal(true);
            },
            variant: 'primary'
          },
          {
            label: '📝 New Text Variable',
            onClick: () => {
              setCreateType('text');
              setShowCreateModal(true);
            },
            variant: 'success'
          }
        ]}
        badges={[
          { text: 'Variable Registry', variant: 'primary' },
          { text: `${filteredAssets.length} Variables`, variant: 'success' }
        ]}
      />
      
      {/* Filters */}
      <ColoredCard accentColor="#10b981" hoverable={false}>
        <div className="grid gap-3 grid-1fr-1fr-1fr-1fr">
          {/* Type Filter */}
          <div>
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="image">🖼️ Images</option>
              <option value="text">📝 Text</option>
            </select>
          </div>
          
          {/* Category Filter */}
          <div>
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort By */}
          <div>
            <label className="form-label">Sort By</label>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="createdAt">📅 Date Created</option>
              <option value="title">🔤 Title</option>
              <option value="usageCount">📊 Usage Count</option>
            </select>
          </div>
          
          {/* Sort Order */}
          <div>
            <label className="form-label">Order</label>
            <select
              className="form-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
            >
              <option value="desc">⬇️ Descending</option>
              <option value="asc">⬆️ Ascending</option>
            </select>
          </div>
        </div>
      </ColoredCard>
      
      {/* Assets Grid */}
      {loading && (
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div>Loading content library...</div>
        </ColoredCard>
      )}
      
      {!loading && filteredAssets.length === 0 && (
        <ColoredCard accentColor="#f59e0b" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <div>No assets found. Try adjusting your filters or create a new asset.</div>
        </ColoredCard>
      )}
      
      {!loading && filteredAssets.length > 0 && (
        <div className="grid gap-3 mt-3">
          {filteredAssets.map(asset => (
            <ColoredCard key={asset._id?.toString()} accentColor="#3b82f6" hoverable={false}>
              <AssetCard
                asset={asset}
                onEdit={() => setEditingAsset(asset)}
                onDelete={() => setDeletingAsset(asset)}
                onCopyToken={() => copyToken(asset)}
                onViewUsage={() => checkUsage(asset)}
              />
            </ColoredCard>
          ))}
        </div>
      )}
      
      {/* Create Asset Modal */}
      {showCreateModal && (
        <CreateAssetModal
          type={createType}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAssets();
          }}
        />
      )}
      
      {/* Edit Asset Modal */}
      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={() => {
            setEditingAsset(null);
            loadAssets();
          }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deletingAsset && !usageInfo && (
        <FormModal
          isOpen={true}
          onClose={() => setDeletingAsset(null)}
          onSubmit={async () => await deleteAsset(false)}
          title="⚠️ Delete Asset"
          size="md"
          submitText="Delete"
        >
          <div>
            <p className="mb-3">
              Are you sure you want to delete <strong>{deletingAsset.title}</strong>?
            </p>
            <p className="text-gray-600">This action cannot be undone.</p>
          </div>
        </FormModal>
      )}
      
      {/* Usage Info Modal */}
      {usageInfo && (
        <FormModal
          isOpen={true}
          onClose={() => {
            setUsageInfo(null);
            setDeletingAsset(null);
          }}
          onSubmit={async () => {
            await deleteAsset(true);
            setUsageInfo(null);
          }}
          title="⚠️ Asset In Use"
          size="lg"
          submitText="Force Delete Anyway"
        >
          <div>
            <p className="mb-3">
              <strong>{usageInfo.asset.title}</strong> is currently used in <strong>{usageInfo.charts.length}</strong> chart(s):
            </p>
            
            <div className="mb-4">
              <div className={styles.usageList}>
                {usageInfo.charts.map((chart, idx) => (
                  <div key={idx} className={styles.usageListItem}>
                    <div><strong>{chart.title}</strong></div>
                    <div className={styles.usageListMeta}>
                      ID: {chart.chartId} | Type: {chart.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-red-600 font-bold">
              Deleting this asset will break these charts. Are you sure?
            </p>
          </div>
        </FormModal>
      )}
    </div>
  );
}

// WHAT: Asset card component for grid display
// WHY: Reusable card with all asset actions
function AssetCard({
  asset,
  onEdit,
  onDelete,
  onCopyToken,
  onViewUsage
}: {
  asset: ContentAsset;
  onEdit: () => void;
  onDelete: () => void;
  onCopyToken: () => void;
  onViewUsage: () => void;
}) {
  const token = formatAssetToken(asset.type, asset.slug);
  
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        {/* Preview & Metadata */}
        <div className="flex-1">
          <div className="flex items-start gap-3">
            {/* Preview */}
            {asset.type === 'image' && asset.content.url && (
              <div className={styles.thumb}>
                <img
                  src={asset.content.url}
                  alt={asset.title}
                  className={styles.thumbImg}
                />
              </div>
            )}
            
            {asset.type === 'text' && (
              <div className={styles.textThumb}>
                {asset.content.text?.substring(0, 100)}...
              </div>
            )}
            
            {/* Metadata */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="mt-0 mb-0">{asset.title}</h3>
                <span className="badge badge-info">{asset.type === 'image' ? '🖼️ Image' : '📝 Text'}</span>
                {asset.usageCount > 0 && (
                  <span
                    className={`badge badge-success ${styles.clickable}`}
                    onClick={onViewUsage}
                    title="Click to view usage"
                  >
                    Used in {asset.usageCount} chart{asset.usageCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <code className={`variable-ref ${styles.token}`}>{token}</code>
              
              {asset.description && (
                <p className="text-gray-600 mt-2 mb-0">{asset.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="badge badge-secondary">{asset.category}</span>
                {asset.tags.map((tag, idx) => (
                  <span key={idx} className="badge badge-secondary">{tag}</span>
                ))}
              </div>
              
              {asset.type === 'image' && asset.content.width && asset.content.height && (
                <div className={`${styles.meta} ${styles.mtSpace2}`}>
                  {asset.content.width} × {asset.content.height}
                  {asset.content.aspectRatio && ` | ${asset.content.aspectRatio}`}
                  {asset.content.fileSize && ` | ${Math.round(asset.content.fileSize / 1024)} KB`}
                </div>
              )}
              
              <div className={`${styles.meta} ${styles.mtSpace2}`}>
                Created: {new Date(asset.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button className="btn btn-small btn-secondary" onClick={onCopyToken} title="Copy reference token">
            <MaterialIcon name="content_copy" variant="outlined" className={styles.iconInline} />
            Copy Token
          </button>
          <button className="btn btn-small btn-primary" onClick={onEdit}>
            <MaterialIcon name="edit" variant="outlined" className={styles.iconInline} />
            Edit
          </button>
          <button className="btn btn-small btn-danger" onClick={onDelete}>
            <MaterialIcon name="delete" variant="outlined" className={styles.iconInline} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// WHAT: Create asset modal component
// WHY: Separate modal for image vs text creation
function CreateAssetModal({
  type,
  onClose,
  onSuccess
}: {
  type: 'image' | 'text';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    slug: '',
    category: '',
    tags: [] as string[],
    tagInput: '',
    imageUrl: '',
    imageWidth: 0,
    imageHeight: 0,
    aspectRatio: '16:9' as '16:9' | '9:16' | '1:1',
    textContent: '',
    isVariable: true, // WHAT: true = variable definition, false = global asset with content
    saving: false,
    error: ''
  });
  
  // Auto-generate slug from title
  useEffect(() => {
    if (form.title && !form.slug) {
      setForm(prev => ({ ...prev, slug: generateSlug(form.title) }));
    }
  }, [form.title]);
  
  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };
  
  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };
  
  const handleSubmit = async () => {
    setForm(prev => ({ ...prev, saving: true, error: '' }));
    
    try {
      // Validation
      if (!form.title) {
        setForm(prev => ({ ...prev, error: 'Title is required', saving: false }));
        return;
      }
      
      if (!form.slug || !isValidSlug(form.slug)) {
        setForm(prev => ({ ...prev, error: 'Invalid slug format', saving: false }));
        return;
      }
      
      // WHAT: Content validation based on mode
      // WHY: Global Assets require content, Variable Definitions don't
      if (!form.isVariable) {
        // Global Asset mode - content is required
        if (type === 'image' && !form.imageUrl) {
          setForm(prev => ({ ...prev, error: 'Please upload an image for global assets', saving: false }));
          return;
        }
        
        if (type === 'text' && !form.textContent) {
          setForm(prev => ({ ...prev, error: 'Text content is required for global assets', saving: false }));
          return;
        }
      }
      // Variable Definition mode - content is optional (filled per-project)
      
      const body: ContentAssetFormData = {
        title: form.title,
        description: form.description || undefined,
        slug: form.slug,
        type,
        category: form.category || 'Uncategorized',
        tags: form.tags,
        isVariable: form.isVariable, // WHAT: Flag to distinguish variable definitions from global assets
        content: type === 'image'
          ? {
              url: form.imageUrl,
              width: form.imageWidth || undefined,
              height: form.imageHeight || undefined,
              aspectRatio: form.aspectRatio
            }
          : {
              text: form.textContent
            }
      };
      
      const response = await fetch('/api/content-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        onSuccess();
      } else {
        setForm(prev => ({ ...prev, error: data.error || 'Failed to create asset', saving: false }));
      }
    } catch (error) {
      console.error('❌ Error creating asset:', error);
      setForm(prev => ({ ...prev, error: 'Network error', saving: false }));
    }
  };
  
  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={type === 'image' ? '📷 New Image Variable' : '📝 New Text Variable'}
      size="lg"
      submitText={form.saving ? 'Creating...' : 'Create Variable'}
      disableSubmit={form.saving}
    >
      <div className="grid gap-3">
        {form.error && (
          <div className={styles.errorBox}>
            <strong>⚠️ {form.error}</strong>
          </div>
        )}
        
        {/* WHAT: Toggle between Variable Definition vs Global Asset */}
        <div className={styles.infoBox}>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="assetMode"
                checked={form.isVariable}
                onChange={() => setForm({ ...form, isVariable: true })}
              />
              <span className="font-semibold">📋 Variable Definition</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="assetMode"
                checked={!form.isVariable}
                onChange={() => setForm({ ...form, isVariable: false })}
              />
              <span className="font-semibold">🌐 Global Asset</span>
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {form.isVariable 
              ? '📋 Define field for event-specific content (filled per-project in Manual Edit)'
              : '🌐 Upload reusable content (e.g., company logo, shared across all projects)'}
          </p>
        </div>
        
        <div className="grid gap-3 grid-1fr-1fr">
          <div>
            <label className="form-label-block">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={form.isVariable ? "Event Photo 1" : "MessMass Logo"}
            />
          </div>
          
          <div>
            <label className="form-label-block">Slug *</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={form.isVariable ? "event-photo-1" : "messmass-logo"}
            />
          </div>
        </div>
        
        <div>
          <label className="form-label-block">Description</label>
          <textarea
            className="form-input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description for search..."
          />
        </div>
        
        <div className="grid gap-3 grid-1fr-1fr">
          <div>
            <label className="form-label-block">Category</label>
            <input
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Partners, Sponsors, etc."
            />
          </div>
          
          <div>
            <label className="form-label-block">Tags</label>
            <div className="flex gap-2">
              <input
                className="form-input"
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
              />
              <button type="button" className="btn btn-small btn-secondary" onClick={addTag}>
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className={`badge badge-primary ${styles.removeableTag}`} onClick={() => removeTag(tag)}>
                  {tag} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {type === 'image' && (
          <>
            <div>
              <label className="form-label-block">Aspect Ratio</label>
              <select
                className="form-select"
                value={form.aspectRatio}
                onChange={(e) => setForm({ ...form, aspectRatio: e.target.value as any })}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
            
            <div>
              <label className="form-label-block">
                Upload Image {form.isVariable ? '(Optional)' : '*'}
              </label>
              <p className="text-sm text-gray-600 mb-2">
                {form.isVariable 
                  ? 'Define field now. Upload event-specific images in Manual Edit per project.'
                  : 'Upload reusable image (e.g., company logo) shared across all projects.'}
              </p>
              <ImageUploadField
                label=""
                value={form.imageUrl}
                onSave={(url) => setForm({ ...form, imageUrl: url })}
              />
            </div>
          </>
        )}
        
        {type === 'text' && (
          <div>
            <label className="form-label-block">
              Text Content {form.isVariable ? '(Optional)' : '*'}
            </label>
            <p className="text-sm text-gray-600 mb-2">
              {form.isVariable 
                ? 'Define field now. Add event-specific text in Manual Edit per project.'
                : 'Add reusable text content shared across all projects.'}
            </p>
            <textarea
              className="form-input"
              rows={8}
              value={form.textContent}
              onChange={(e) => setForm({ ...form, textContent: e.target.value })}
              placeholder={form.isVariable 
                ? 'Optional: Add placeholder text or leave empty...'
                : 'Enter global text content...'}
            />
            <div className={styles.helpText}>
              {form.textContent.length} characters
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}

// WHAT: Edit asset modal component
// WHY: Pre-populated form with slug change warning
function EditAssetModal({
  asset,
  onClose,
  onSuccess
}: {
  asset: ContentAsset;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    title: asset.title,
    description: asset.description || '',
    slug: asset.slug,
    category: asset.category,
    tags: [...asset.tags],
    tagInput: '',
    imageUrl: asset.content.url || '',
    aspectRatio: asset.content.aspectRatio || '16:9',
    textContent: asset.content.text || '',
    saving: false,
    error: ''
  });
  
  const slugChanged = form.slug !== asset.slug;
  
  const addTag = () => {
    if (form.tagInput.trim() && !form.tags.includes(form.tagInput.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };
  
  const removeTag = (tag: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };
  
  const handleSubmit = async () => {
    setForm(prev => ({ ...prev, saving: true, error: '' }));
    
    try {
      if (!form.title) {
        setForm(prev => ({ ...prev, error: 'Title is required', saving: false }));
        return;
      }
      
      if (!isValidSlug(form.slug)) {
        setForm(prev => ({ ...prev, error: 'Invalid slug format', saving: false }));
        return;
      }
      
      const body: ContentAssetFormData = {
        _id: asset._id?.toString(),
        title: form.title,
        description: form.description || undefined,
        slug: form.slug,
        type: asset.type,
        category: form.category,
        tags: form.tags,
        content: asset.type === 'image'
          ? {
              url: form.imageUrl,
              width: asset.content.width,
              height: asset.content.height,
              aspectRatio: form.aspectRatio as any
            }
          : {
              text: form.textContent
            }
      };
      
      const response = await fetch('/api/content-assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        onSuccess();
      } else {
        setForm(prev => ({ ...prev, error: data.error || 'Failed to update asset', saving: false }));
      }
    } catch (error) {
      console.error('❌ Error updating asset:', error);
      setForm(prev => ({ ...prev, error: 'Network error', saving: false }));
    }
  };
  
  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={`✏️ Edit ${asset.type === 'image' ? 'Image' : 'Text'}`}
      size="lg"
      submitText={form.saving ? 'Saving...' : 'Save Changes'}
      disableSubmit={form.saving}
    >
      <div className="grid gap-3">
        {form.error && (
          <div className={styles.errorBox}>
            <strong>⚠️ {form.error}</strong>
          </div>
        )}
        
        {slugChanged && (
          <div className={styles.warningBox}>
            ⚠️ <strong>Warning:</strong> Changing the slug will break existing chart references. Old token: <code>[{asset.type === 'image' ? 'MEDIA' : 'TEXT'}:{asset.slug}]</code>
          </div>
        )}
        
        {asset.usageCount > 0 && (
          <div className={styles.noticeBox}>
            ℹ️ This asset is currently used in <strong>{asset.usageCount}</strong> chart(s).
          </div>
        )}
        
        <div className="grid gap-3 grid-1fr-1fr">
          <div>
            <label className="form-label-block">Title *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          
          <div>
            <label className="form-label-block">Slug *</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
        </div>
        
        <div>
          <label className="form-label-block">Description</label>
          <textarea
            className="form-input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        
        <div className="grid gap-3 grid-1fr-1fr">
          <div>
            <label className="form-label-block">Category</label>
            <input
              className="form-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          
          <div>
            <label className="form-label-block">Tags</label>
            <div className="flex gap-2">
              <input
                className="form-input"
                value={form.tagInput}
                onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" className="btn btn-small btn-secondary" onClick={addTag}>
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className={`badge badge-primary ${styles.removeableTag}`} onClick={() => removeTag(tag)}>
                  {tag} ✕
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {asset.type === 'image' && (
          <>
            <div>
              <label className="form-label-block">Aspect Ratio</label>
              <select
                className="form-select"
                value={form.aspectRatio}
                onChange={(e) => setForm({ ...form, aspectRatio: e.target.value as any })}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="9:16">9:16 (Portrait)</option>
              </select>
            </div>
            
            <div>
              <label className="form-label-block">Image</label>
              {form.imageUrl && (
                <div className={styles.imagePreview}>
                  <img src={form.imageUrl} alt="Preview" />
                </div>
              )}
              <ImageUploadField
                label="Change Image"
                value={form.imageUrl}
                onSave={(url) => setForm({ ...form, imageUrl: url })}
              />
            </div>
          </>
        )}
        
        {asset.type === 'text' && (
          <div>
            <label className="form-label-block">Text Content *</label>
            <textarea
              className="form-input"
              rows={8}
              value={form.textContent}
              onChange={(e) => setForm({ ...form, textContent: e.target.value })}
            />
            <div className={styles.helpText}>
              {form.textContent.length} characters
            </div>
          </div>
        )}
      </div>
    </FormModal>
  );
}
