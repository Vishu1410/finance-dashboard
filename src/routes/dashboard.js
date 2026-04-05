import express from 'express'
const router = express.Router();
import { getSummary, getCategoryTotals, getMonthlyTrends, getWeeklyTrends, getRecentActivity } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeMinLevel } from '../middleware/rbac.js';

router.use(authenticate);

// Viewer+ can see recent activity
router.get('/recent',         authorizeMinLevel('viewer'),  getRecentActivity);

// Analyst+ for all analytics
router.get('/summary',        authorizeMinLevel('analyst'), getSummary);
router.get('/category-totals',authorizeMinLevel('analyst'), getCategoryTotals);
router.get('/monthly-trends', authorizeMinLevel('analyst'), getMonthlyTrends);
router.get('/weekly-trends',  authorizeMinLevel('analyst'), getWeeklyTrends);

export default router