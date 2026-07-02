import { Hono } from 'hono';
import { 
  registerController, 
  loginController, 
  meController 
} from '../controllers/authController';
import { authMiddleware } from '../utils/authMiddleware';

const auth = new Hono();

/**
 * Endpoint Registrasi User
 * POST /api/auth/register
 */
auth.post('/register', registerController);

/**
 * Endpoint Login User
 * POST /api/auth/login
 */
auth.post('/login', loginController);

/**
 * Endpoint Ambil Data User Saat Ini (Terautentikasi)
 * GET /api/auth/me
 */
auth.get('/me', authMiddleware, meController);

export default auth;
