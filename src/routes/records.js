import express from 'express'
const router = express.Router();
import { getRecords, getRecordById, createRecord, updateRecord, deleteRecord } from '../controllers/recordController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, authorizeMinLevel } from '../middleware/rbac.js';
import { createRecordValidator, updateRecordValidator } from '../validators/index.js';

// All routes require authentication
router.use(authenticate);

// Read: viewer, analyst, admin
router.get('/',    authorizeMinLevel('viewer'), getRecords);
router.get('/:id', authorizeMinLevel('viewer'), getRecordById);

// Write: admin only
router.post('/',    authorize('admin'), createRecordValidator, createRecord);
router.put('/:id',  authorize('admin'), updateRecordValidator, updateRecord);
router.delete('/:id', authorize('admin'), deleteRecord);

export default router