import mongoose from 'mongoose';

const financialRecordSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:    { type: Number, required: true, min: 0.01 },
    type:      { type: String, enum: ['income', 'expense'], required: true },
    category:  { type: String, required: true, trim: true },
    date:      { type: Date, required: true },
    notes:     { type: String, default: null },
    deletedAt: { type: Date, default: null },   // soft delete
  },
  { timestamps: true }
);

export default mongoose.model('FinancialRecord', financialRecordSchema);