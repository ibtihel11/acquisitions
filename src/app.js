import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routers.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  logger.info('Hello from aquisitions api!');
  res.status(200).send('Hello from aquisitions api!');
});

app.get('/health', (req, res) => {
  res.status(200).send({status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime()});
});

app.get('/api', (req, res) => {
  res.status(200).send({message: 'Welcome to the acquisitions API!'});
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
