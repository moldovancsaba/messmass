import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3Entity Schema
 * Represents a Partner, Division, Team, or Department.
 * Supports a recursive parent-child hierarchy.
 */
const EntitySchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Organization', 
    required: [true, 'organizationId is required'],
    index: true,
  },
  parentEntityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    default: null,
    index: true,
  },
  name: { 
    type: String, 
    required: [true, 'Entity name is required'],
    trim: true,
  },
  type: { 
    type: String, 
    enum: ['partner', 'division', 'team', 'department'], 
    required: [true, 'Entity type is required'],
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.ENTITIES 
});

// Compound index for fast lookup of types within an organization
EntitySchema.index({ organizationId: 1, type: 1 });

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3Entity || mongoose.model('V3Entity', EntitySchema);
