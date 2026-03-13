import mongoose from 'mongoose';
import { V3_COLLECTIONS } from '../../constants';

/**
 * MigrationHistory Schema
 * 
 * Provides an audit ledger for all executed database migrations,
 * preventing double execution and capturing robust execution logs.
 */
const MigrationHistorySchema = new mongoose.Schema({
  scriptName: {
    type: String,
    required: [true, 'Migration script name is required'],
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    required: true,
    default: 'pending'
  },
  executedAt: {
    type: Date,
    default: Date.now
  },
  logs: {
    type: [String],
    default: []
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true,
  collection: V3_COLLECTIONS.MIGRATION_HISTORY || 'v3_migration_history'
});

export default mongoose.models.MigrationHistory || mongoose.model('MigrationHistory', MigrationHistorySchema);
