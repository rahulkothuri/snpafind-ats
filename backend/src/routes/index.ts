import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import userRoutes from './user.routes.js';
import jobRoutes from './job.routes.js';
import candidateRoutes from './candidate.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required) - Requirements 5.1, 5.10
router.use('/public', publicRoutes);

// API routes (auth required)
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/candidates', candidateRoutes);

export default router;
