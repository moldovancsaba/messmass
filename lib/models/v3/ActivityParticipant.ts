import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3ActivityParticipant Schema
 * Links an Entity to an Activity with a specific role.
 * Scoped by Organization for security.
 */
const ParticipantSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Organization', 
    required: [true, 'organizationId is required'],
    index: true,
  },
  activityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Activity', 
    required: [true, 'activityId is required'],
    index: true,
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'V3Entity', 
    required: [true, 'entityId is required'],
    index: true,
  },
  role: { 
    type: String, 
    enum: ['primary_partner', 'visitor', 'facilitator', 'observer'], 
    required: [true, 'role is required'],
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.PARTICIPANTS 
});

// Ensure a participant (entity) is only added once to an activity with the same role
ParticipantSchema.index({ activityId: 1, entityId: 1, role: 1 }, { unique: true });

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3ActivityParticipant || mongoose.model('V3ActivityParticipant', ParticipantSchema);
