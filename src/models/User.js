import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['viewer', 'analyst', 'admin'], default: 'viewer' },
    status:   { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);