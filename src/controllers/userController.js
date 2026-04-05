import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

export const getAllUsers = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role)   filter.role   = role;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) },
    });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role = 'viewer' } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already in use.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    return res.status(201).json({
      success: true,
      message: 'User created.',
      data: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, role, status } = req.body;
  const isOwnAccount = req.params.id === req.user._id.toString();

  try {
    // Prevent admin from deactivating themselves
    if (isOwnAccount && status === 'inactive') {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    // Prevent admin from changing their own role
    if (isOwnAccount && role && role !== req.user.role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const data = {
      ...(name   && { name   }),
      ...(role   && { role   }),
      ...(status && { status }),
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'User updated.', data: user });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};