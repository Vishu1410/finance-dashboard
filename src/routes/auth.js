import express from 'express'
const router = express.Router();
import {register, login, getMe} from '../controllers/authController.js'
import { registerValidator, loginValidator } from '../validators/index.js';
import { authenticate } from '../middleware/auth.js';


// POST /api/auth/register  → anyone can register (gets viewer role)
router.post('/register', registerValidator, register);

// POST /api/auth/login     → returns JWT
router.post('/login', loginValidator, login);

// GET  /api/auth/me        → returns current user info
router.get('/me', authenticate, getMe);

export default router