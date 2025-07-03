import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectToDatabase from './db/db.js';

// Routers
import authRouter from './routes/auth.js';
import reservationRouter from './routes/reservationRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';

dotenv.config();
connectToDatabase();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/reservation', reservationRouter);
app.use('/api/notification', notificationRouter);

app.listen(process.env.PORT, () => {
  console.log(`Server is Running on port ${process.env.PORT}`);
});
