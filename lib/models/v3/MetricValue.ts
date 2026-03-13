import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3MetricValue Schema
 * Stores actual data points for a specific metric key, 
 * linked to an Entity and an optional Activity.
 * Designed for high-performance time-series lookups.
 */
const MetricValueSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Organization', 
    required: [true, 'organizationId is required'],
    index: true,
  },
  metricKey: { 
    type: String, 
    required: [true, 'metricKey is required'],
    index: true,
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    required: [true, 'entityId is required'],
    index: true,
  },
  activityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Activity', 
    default: null,
    index: true,
  },
  value: { 
    type: Number, 
    required: [true, 'value is required'],
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true,
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.METRIC_VALUES 
});

/**
 * Covering Index for Reporting Aggregation
 * This index allows MongoDB to answer the core aggregation queries
 * entirely from the index (Index-Only Scan), which is critical
 * for performance with millions of records.
 */
MetricValueSchema.index({ 
  entityId: 1, 
  metricKey: 1, 
  timestamp: -1, 
  value: 1 
});

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3MetricValue || mongoose.model('V3MetricValue', MetricValueSchema);
