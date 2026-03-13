import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3Activity Schema
 * Represents an Event, Project, Campaign, or Match.
 * Activities are owned by an Entity and belong to an Organization.
 */
const ActivitySchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Organization', 
    required: [true, 'organizationId is required'],
    index: true,
  },
  ownerEntityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    index: true,
  },
  name: { 
    type: String, 
    required: [true, 'Activity name is required'],
    trim: true,
  },
  type: { 
    type: String, 
    enum: ['event', 'match', 'campaign', 'project'], 
    required: [true, 'Activity type is required'],
  },
  status: { 
    type: String, 
    enum: ['planned', 'active', 'completed', 'cancelled'], 
    default: 'planned',
  },
  startDate: { type: Date },
  endDate: { type: Date },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.ACTIVITIES 
});

// Compound index for filtering activities by status and time
ActivitySchema.index({ organizationId: 1, status: 1, startDate: -1 });

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3Activity || mongoose.model('V3Activity', ActivitySchema);
