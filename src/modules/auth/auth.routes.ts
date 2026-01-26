import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { loginRateLimiter, registerRateLimiter, apiRateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerRateLimiter, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginRateLimiter, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public (works with refresh token even if access token is expired)
 */
router.post('/logout', apiRateLimiter, AuthController.logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (but requires valid refresh token)
 */
router.post('/refresh', apiRateLimiter, AuthController.refresh);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', apiRateLimiter, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', apiRateLimiter, AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authenticate, AuthController.changePassword);

/**
 * @route   POST /api/auth/verify-contact
 * @desc    Verify user contact (email/phone)
 * @access  Private
 */
router.post('/verify-contact', authenticate, AuthController.verifyContact);

/**
 * @route   POST /api/auth/setup-password
 * @desc    Setup password for first-time user verification
 * @access  Public
 */
router.post('/setup-password', apiRateLimiter, AuthController.setupPassword);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email for unverified users
 * @access  Public
 */
router.post('/resend-verification', apiRateLimiter, AuthController.resendVerification);

export default router;
