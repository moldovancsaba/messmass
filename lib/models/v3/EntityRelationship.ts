import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3EntityRelationship Schema
 * Supports non-hierarchical, lateral associations between entities.
 * Examples: Sister organizations, service providers, or clients.
 */
const RelationshipSchema = new mongoose.Schema({
  fromEntityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    required: [true, 'fromEntityId is required'],
    index: true,
  },
  toEntityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    required: [true, 'toEntityId is required'],
    index: true,
  },
  relationType: { 
    type: String, 
    enum: ['sister', 'provider', 'client', 'associated'], 
    required: [true, 'relationType is required'],
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.RELATIONSHIPS 
});

// Compound index for fast lookup of relationships in either direction
RelationshipSchema.index({ fromEntityId: 1, relationType: 1 });
RelationshipSchema.index({ toEntityId: 1, relationType: 1 });

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3EntityRelationship || mongoose.model('V3EntityRelationship', RelationshipSchema);
