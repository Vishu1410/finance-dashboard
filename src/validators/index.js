import { body } from "express-validator";
// ── Auth Validators ──────────────────────────────────────────
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Invalid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── User Validators ──────────────────────────────────────────
export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Invalid email.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin.'),
];

export const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role.'),
  body('status')
    .optional()
    .isIn(['active', 'inactive']).withMessage('Status must be active or inactive.'),
];

// ── Record Validators ────────────────────────────────────────
export const createRecordValidator = [
  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),

  body('type')
    .notEmpty().withMessage('Type is required.')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense.'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required.')
    .isLength({ max: 100 }).withMessage('Category max 100 characters.'),

  body('date')
    .notEmpty().withMessage('Date is required.')
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD).'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes max 500 characters.'),
];

export const updateRecordValidator = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),

  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense.'),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category max 100 characters.'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO date.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes max 500 characters.'),
];

