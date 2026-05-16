import { body } from 'express-validator';

export const signupValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a number'),

  body('role')
    .optional()
    .isIn(['citizen', 'official', 'journalist', 'auditor'])
    .withMessage('Role must be one of: citizen, official, journalist, auditor'),

  body('phone')
    .optional().trim()
    .matches(/^[+]?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('organization')
    .optional().trim()
    .isLength({ max: 200 }).withMessage('Organization cannot exceed 200 characters'),

  body('nationalId')
    .optional().trim()
    .notEmpty().withMessage('National ID cannot be blank if provided'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];
