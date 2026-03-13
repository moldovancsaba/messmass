import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * V3Organization Schema
 * The root level of the V3 hierarchy.
 */
const OrganizationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Organization name is required'],
    trim: true,
  },
  slug: { 
    type: String, 
    required: [true, 'Organization slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true, 
  collection: V3_COLLECTIONS.ORGANIZATIONS 
});

// Avoid model recompilation errors in development (Next.js hot reloading)
export default mongoose.models.V3Organization || mongoose.model('V3Organization', OrganizationSchema);
