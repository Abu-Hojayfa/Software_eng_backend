import { body } from 'express-validator';

export const updateProfileValidator = [
  body('fullName')
    .optional().trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),

  body('phone')
    .optional({ values: 'falsy' }).trim()
    .matches(/^[+]?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('location')
    .optional({ values: 'falsy' }).trim()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),

  body('organization')
    .optional({ values: 'falsy' }).trim()
    .isLength({ max: 200 }).withMessage('Organization cannot exceed 200 characters'),

  body('nationalId')
    .optional({ values: 'falsy' }).trim(),
];

export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your new password')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error('Passwords do not match');
      return true;
    }),
];