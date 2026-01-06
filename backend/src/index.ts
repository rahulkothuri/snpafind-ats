import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint for AWS App Runner
// Place this BEFORE all other middleware to ensure it responds even if other things hang
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Special middleware for uploads to allow framing (for resume PDFs in iframes)
app.use('/uploads', (req, res, next) => {
  // Remove all frame-related restrictions for uploaded files
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  console.log(`Serving upload file: ${req.path}`);
  next();
});

// Serve static files from uploads directory (for resume files)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Apply helmet to all other routes (not uploads)
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads')) {
    return next();
  }
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })(req, res, next);
});



// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
