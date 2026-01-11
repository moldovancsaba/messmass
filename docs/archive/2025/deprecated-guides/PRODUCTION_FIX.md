# Production Database Fix Required
Status: Archived
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: No
Owner: Architecture

## Problem
The visualization page at https://www.messmass.com/admin/visualization is crashing because the production database still has the OLD broken chart data:
- Charts with bracket formulas: `[stats.fanSelfiePortrait1]`
- Charts missing formulas entirely
- Charts with `isActive=undefined`

## Solution
Run the fix script against the PRODUCTION database:

```bash
# Connect to production database
npm run chart:fix-formulas-prod
```

Or manually via MongoDB Atlas:

1. Go to MongoDB Atlas
2. Open messmass database
3. Run this update query on `chart_configurations` collection:

```javascript
// Fix bracket formulas
db.chart_configurations.find({}).forEach(function(doc) {
  if (doc.elements && doc.elements.length > 0) {
    let needsUpdate = false;
    let newElements = doc.elements.map(function(el) {
      if (el.formula && el.formula.startsWith('[') && el.formula.endsWith(']')) {
        needsUpdate = true;
        return { ...el, formula: el.formula.slice(1, -1) };
      }
      return el;
    });
    
    if (needsUpdate) {
      db.chart_configurations.updateOne(
        { _id: doc._id },
        { $set: { elements: newElements } }
      );
    }
  }
});

// Fix report-image-* charts with missing formulas
for (let i = 1; i <= 15; i++) {
  db.chart_configurations.updateOne(
    { chartId: 'report-image-' + i },
    { 
      $set: { 
        elements: [{ formula: 'stats.reportImage' + i }],
        type: 'image',
        isActive: true
      }
    }
  );
}

// Fix report-text-* charts with missing formulas
for (let i = 1; i <= 15; i++) {
  db.chart_configurations.updateOne(
    { chartId: 'report-text-' + i },
    { 
      $set: { 
        elements: [{ formula: 'stats.reportText' + i }],
        type: 'text',
        isActive: true
      }
    }
  );
}
```

## Verification
After running the fix, check:
```bash
# Should return 77
db.chart_configurations.countDocuments({ isActive: true })

# Should show correct formula without brackets
db.chart_configurations.findOne({ chartId: 'fanSelfiePortrait1' })
```

## Alternative: Quick Fix
If you can't access the database directly, redeploy will trigger the fix script automatically in the deployment pipeline.
