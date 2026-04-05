import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role, adminSecret } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    // Only allow admin role if correct secret is provided
    let assignedRole = 'viewer';
    if (role === 'admin' || role === 'analyst') {
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid admin secret.' });
      }
      assignedRole = role;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: assignedRole });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.status(201).json({
      success: true,
      message: 'Registered successfully.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
        token,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account inactive. Contact an admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};