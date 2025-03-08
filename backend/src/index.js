import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import pinRoutes from './routes/pins.js';
import userRoutes from './routes/users.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet()); // Set security HTTP headers
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(hpp()); // Prevent parameter pollution
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 
});
app.use('/api', limiter);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use('/api/v1/pins', pinRoutes);
app.use('/api/v1/users', userRoutes);

app.use(notFound);
app.use(errorHandler);


app.listen(port, () => {
  connectDB();
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
});