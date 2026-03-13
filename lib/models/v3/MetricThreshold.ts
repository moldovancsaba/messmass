import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3MetricThreshold Schema
 * Defines a structural goal or alert trigger for a specific metric on a specific entity.
 */
const MetricThresholdSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'V3Organization',
    required: [true, 'organizationId is required'],
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'V3Entity',
    required: [true, 'entityId is required'],
    index: true
  },
  metricKey: {
    type: String,
    required: [true, 'metricKey is required'],
    index: true
  },
  thresholdValue: {
    type: Number,
    required: [true, 'thresholdValue is required']
  },
  comparison: {
    type: String,
    enum: ['gt', 'lt', 'gte', 'lte', 'eq'],
    required: [true, 'comparison operator is required (gt, lt, etc.)']
  },
  alertEmail: {
    type: String
  }
}, {
  timestamps: true,
  // Define a new collection for thresholds; assuming we add it to V3_COLLECTIONS
  // For now, we hardcode the fallback collection if it's not in the registry yet
  collection: V3_COLLECTIONS.METRIC_THRESHOLDS || 'v3_metric_thresholds'
});

export default mongoose.models.V3MetricThreshold || mongoose.model('V3MetricThreshold', MetricThresholdSchema);
