import { createClient } from 'redis';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter'; 

import dotenv from 'dotenv';
dotenv.config();

let io;
const userSocketMap = new Map();

export const initSocket = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // Connect Redis
  const pubClient = createClient({ url: `${process.env.REDIS_URL}` });
  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
  console.log('✅ Redis connected with Socket.IO');

  // Handle socket connections
  io.on('connection', (socket) => {
    const { userId, vendorId } = socket.handshake.query;

    if (userId) userSocketMap.set(userId, socket.id);
    if (vendorId) userSocketMap.set(vendorId, socket.id);

    socket.on('disconnect', () => {
      if (userId) userSocketMap.delete(userId);
      if (vendorId) userSocketMap.delete(vendorId);
    });
  });
};

export const emitToUser = (userId, message) => {
  const socketId = userSocketMap.get(userId);
  if (socketId && io) {
    io.to(socketId).emit('notification', { type: 'customer', message });
  }
};

export const emitToVendor = (vendorId, message) => {
  const socketId = userSocketMap.get(vendorId);
  if (socketId && io) {
    io.to(socketId).emit('notification', { type: 'vendor', message });
  }
};
