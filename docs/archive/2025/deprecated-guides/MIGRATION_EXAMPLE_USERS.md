# 🎯 Migration Example: Users Page
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

**Date**: 2025-11-02  
**Page**: `/admin/users`  
**Status**: ✅ Complete — Side-by-side comparison available

---

## 📊 Migration Results

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| **Total Lines** | 400 | 312 | **-22% (88 lines)** |
| **Display Logic** | ~200 lines | ~20 lines | **-90%** |
| **State Management** | 12+ state vars | 6 state vars | **-50%** |
| **Search/Sort/View** | Manual (~80 lines) | Automatic (0 lines) | **-100%** |
| **Pagination** | Server-side (~60 lines) | Client-side (0 lines) | **-100%** |

---

## 🔍 Key Differences from Categories Migration

### Unique Layout Challenge
Unlike the categories page (simple list/grid), the users page has a **two-section layout**:
1. **Create Form Section** (green card at top) — Page-specific
2. **User List Section** (table/cards below) — Generic display

### Solution Pattern
- **Keep**: Custom create form section with manual header
- **Migrate**: User list display to `UnifiedAdminPage`
- **Result**: Hybrid approach balancing custom UX with unified system

---

## 📝 What Was Removed

### ❌ Server Pagination (~60 lines)

**Before**:
```tsx
const [nextOffset, setNextOffset] = useState<number | null>(0);
const [loadingMore, setLoadingMore] = useState(false);
const PAGE_SIZE = 20;

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
    const res = await fetch(`/api/admin/local-users${qs}`, { 
      cache: 'no-store', 
      signal: ctrl.signal 
    });
    const data = await res.json();
    if (data.success) {
      setUsers(prev => [...prev, ...(data.users || [])]);
      setNextOffset(data.pagination?.nextOffset ?? null);
    }
  } catch (err) {
    if ((err as any)?.name !== 'AbortError') {
      console.error('Failed to load more users:', err);
    }
  } finally {
    setLoadingMore(false);
  }
};
```

**After**:
```tsx
// Client-side pagination automatic via UnifiedAdminPage
// (Loads all users at once, filters/sorts client-side)
```

### ❌ Search State with Debouncing (~30 lines)

**Before**:
```tsx
const [searchTerm, setSearchTerm] = useState('');
const [debouncedTerm, setDebouncedTerm] = useState('');
const abortRef = useRef<AbortController | null>(null);

useEffect(() => {
  const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
  return () => clearTimeout(t);
}, [searchTerm]);

// Complex server-side search with abort controllers
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
      const res = await fetch(`/api/admin/local-users${qs}`, { 
        cache: 'no-store', 
        signal: ctrl.signal 
      });
      // ... more logic
    } catch (err) {
      if ((err as any)?.name !== 'AbortError') {
        console.error('Failed to fetch users:', err);
      }
    }
  };
  loadFirst();
}, [debouncedTerm]);
```

**After**:
```tsx
// Automatic via UnifiedAdminPage + usersAdapter.searchFields
// Searches by: email, name (client-side)
```

### ❌ Manual Table Markup (~100 lines)

**Before**:
```tsx
<ColoredCard accentColor="#3b82f6" hoverable={false} className="mt-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">All Admin Users</h2>
  
  {!loading && users.length > 0 && (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        Showing {users.length} of {totalMatched} users
      </div>
    </div>
  )}
  
  {loading && users.length === 0 ? (
    <div>Loading users…</div>
  ) : error ? (
    <div className="error-text">{error}</div>
  ) : users.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
      {searchTerm ? `No users found matching "${searchTerm}"` : 'No users yet'}
    </div>
  ) : (
    <>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Created</th>
              <th>Updated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td className="font-mono">{u.createdAt}</td>
                <td className="font-mono">{u.updatedAt}</td>
                <td className="actions-cell">
                  <button className="btn btn-small btn-secondary" onClick={() => onRegenerate(u.id, u.email)}>Regenerate</button>
                  <button className="btn btn-small btn-danger" onClick={() => onDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        {nextOffset != null ? (
          <button className="btn btn-secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more`}
          </button>
        ) : (
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>No more items</span>
        )}
      </div>
    </>
  )}
</ColoredCard>
```

**After**:
```tsx
<UnifiedAdminPage
  adapter={adapterWithHandlers}
  items={users}
  title="All Admin Users"
  subtitle="Manage existing admin accounts"
/>
```

---

## ✅ What Was Kept

### ✅ Custom Create Form Section
```tsx
// BEFORE & AFTER: Identical (page-specific business logic)
<div className="page-container">
  <ColoredCard accentColor="#10b981" hoverable={false}>
    <h2>Create New Admin</h2>
    <form onSubmit={onCreateUser}>
      <input placeholder="Email" value={email} onChange={...} />
      <input placeholder="Name" value={name} onChange={...} />
      <button type="submit">Create</button>
    </form>
  </ColoredCard>
</div>
```

### ✅ Modal Components
```tsx
// BEFORE & AFTER: Unchanged
<PasswordModal isOpen={...} onClose={...} password={...} />
<ConfirmDialog isOpen={...} onConfirm={...} title={...} />
```

### ✅ Business Logic Handlers
```tsx
// BEFORE & AFTER: Identical function signatures
const onCreateUser = async (e: React.FormEvent) => { /* same */ };
const onRegenerate = async (user: AdminUser) => { /* adapted to new signature */ };
const onDelete = async (user: AdminUser) => { /* adapted to new signature */ };
```

---

## 🔧 Handler Signature Changes

### Before: ID-based handlers
```tsx
const onRegenerate = async (id: string, userEmail: string) => {
  // Had to pass both ID and email
};

const onDelete = async (id: string) => {
  // Only had ID
};

// Usage in table:
<button onClick={() => onRegenerate(u.id, u.email)}>Regenerate</button>
<button onClick={() => onDelete(u.id)}>Delete</button>
```

### After: Object-based handlers
```tsx
const onRegenerate = async (user: AdminUser) => {
  // Receives full user object
  const data = await apiPut(`/api/admin/local-users/${user.id}`, {...});
  setPasswordModal({ userEmail: user.email, ... });
};

const onDelete = async (user: AdminUser) => {
  // Receives full user object
  const data = await apiDelete(`/api/admin/local-users/${user.id}`);
};

// Usage in adapter:
rowActions: [{
  label: 'Regenerate',
  handler: onRegenerate, // Adapter passes full item
}]
```

**Why Better?**
- ✅ Less prop drilling
- ✅ Adapter provides full context
- ✅ Easier to access any user field
- ✅ Type-safe with TypeScript

---

## 🎯 Unique Pattern: Two-Section Layout

### Challenge
The users page has a **non-standard layout**:
- Section 1: Create form (green card)
- Section 2: User list (table/cards)

Most admin pages are simple list/grid views.

### Solution
```tsx
return (
  <>
    {/* Section 1: Manual layout for create form */}
    <div className="page-container">
      <h1>Users Management</h1>
      <ColoredCard accentColor="#10b981">
        {/* Create form */}
      </ColoredCard>
    </div>

    {/* Section 2: Unified system for user list */}
    <UnifiedAdminPage
      adapter={adapterWithHandlers}
      items={users}
      title="All Admin Users"
    />
  </>
);
```

**Key Insight**: The unified system is **composable** — use it where it helps, keep custom layout where needed.

---

## 📈 Migration Impact

### Code Reduction
- **Total lines**: 400 → 312 (-22%)
- **Display logic**: ~200 → ~20 (-90%)
- **State variables**: 12+ → 6 (-50%)

### New Features (Free)
✅ **Sorting**: Click columns to sort (email, name, role, dates)
✅ **Search**: Client-side filtering by email/name
✅ **View Toggle**: Switch between list (table) and card view
✅ **View Persistence**: Remember user's view preference

### Trade-offs
⚠️ **Server pagination** → **Client-side pagination**
- Before: Load 20 users at a time
- After: Load all users at once, filter/sort client-side
- Impact: Works fine for <1000 users (typical admin count)
- Future: Can add server pagination if needed

---

## 🚀 Testing Checklist

### Core Functionality
- [ ] Create new user shows password modal
- [ ] Regenerate password shows confirmation then password modal
- [ ] Delete user shows confirmation then removes user
- [ ] User list displays after creation/deletion

### Unified System Features
- [ ] Search by email works
- [ ] Search by name works
- [ ] Sort by email works
- [ ] Sort by role works
- [ ] Sort by created/updated dates works
- [ ] View toggle (list ⇄ card) works
- [ ] View preference persists on refresh

### Edge Cases
- [ ] Empty state (no users) displays correctly
- [ ] Search with no results displays empty state
- [ ] Creating user while list is empty works
- [ ] Error states display correctly

---

## 💡 Lessons Learned

### ✅ Hybrid Approach Works
- Custom sections can coexist with unified system
- Don't force everything into the adapter pattern
- Use unified system where it provides value

### ⚠️ Handler Signature Changes
- Adapters pass full item objects, not just IDs
- Update handler signatures accordingly
- More flexible but requires refactoring

### 🔄 Server vs. Client Pagination
- Client-side works for small datasets (<1000 items)
- Server-side better for large datasets
- Migration simplified data fetching (one endpoint call)

---

## 📁 Files

- **Original**: `app/admin/users/page.tsx` (400 lines)
- **Migrated**: `app/admin/users/page-unified.tsx` (312 lines)
- **Comparison**: `MIGRATION_EXAMPLE_USERS.md` (this file)

---

**Migration Status**: ✅ Users page complete — ready for testing
