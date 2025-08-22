import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectToDatabase from './db/db.js';
import { initSocket } from './socket.js';

// Routes
import authRouter from './routes/auth.js';
import vendorAuthRouter from './routes/VendorAuth.js';
import slotRoutes from './routes/slotRoutes.js';
import vendorReservationRoutes from './routes/vendorReservationRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Configs
dotenv.config();
connectToDatabase();

const app = express();
const server = http.createServer(app);
initSocket(server);

//*************** WHEN PRODUCTION MODE IS ON ***************

// const allowedOrigins = [
//   'http://localhost:3000',          // Local dev
//   'http://localhost:19006',         // Expo dev (optional)
//   'exp://localhost:19000',          // Expo LAN
//   'https://vendor.linque.com',      // Your vendor web domain
//   'https://linque-server.up.railway.app' // Your backend URL
// ];

// // Middleware
// app.use(cors({
//   origin: allowedOrigins,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true
// }));

//*************** WHEN DEVELOPMENT MODE IS ON ***************
app.use(cors());
app.use(express.json());

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/vendor-auth', vendorAuthRouter);
app.use('/api/slot', slotRoutes);
app.use('/api/reservation', reservationRoutes);
app.use('/api/vendor', vendorReservationRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});