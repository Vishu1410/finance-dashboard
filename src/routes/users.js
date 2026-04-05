import express from 'express'
const router = express.Router();
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { createUserValidator, updateUserValidator } from '../validators/index.js';

// All user management routes: admin only
router.use(authenticate, authorize('admin'));

router.get('/',    getAllUsers);
router.get('/:id', getUserById);
router.post('/',   createUserValidator, createUser);
router.put('/:id', updateUserValidator, updateUser);
router.delete('/:id', deleteUser);

export default router