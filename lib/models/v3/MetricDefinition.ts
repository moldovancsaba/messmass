import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3MetricDefinition Schema
 * Defines the structure and type of a metric (KPI).
 * Examples: 'Ticket Sales' (currency), 'Attendance' (number), 'Fan Growth' (percentage).
 */
const MetricDefinitionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Metric name is required'],
    trim: true,
  },
  key: { 
    type: String, 
    required: [true, 'Metric key is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  type: { 
    type: String, 
    enum: ['number', 'currency', 'percentage', 'duration'], 
    required: [true, 'Metric type is required'],
  },
  unit: { 
    type: String,
    default: '',
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.METRIC_DEFINITIONS 
});

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3MetricDefinition || mongoose.model('V3MetricDefinition', MetricDefinitionSchema);
