const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const activeUsers = {}; // In-memory store: socketId -> { nickname, lat, lng }

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current markers to new user
  socket.emit('existingUsers', activeUsers);

  // Listen for a new user joining with initial location and optional nickname
  socket.on('newUser', (data) => {
    activeUsers[socket.id] = data;  // data: { nickname, lat, lng }
    io.emit('userConnected', { id: socket.id, ...data });
  });

  // Listen for location updates
  socket.on('locationUpdate', (data) => {
    if (activeUsers[socket.id]) {
      activeUsers[socket.id] = { ...activeUsers[socket.id], ...data };
      io.emit('userUpdated', { id: socket.id, ...activeUsers[socket.id] });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete activeUsers[socket.id];
    io.emit('userDisconnected', { id: socket.id });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
