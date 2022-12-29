const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4200"], // to debug
  }
});

var positionMap = {};

const leaveRoom = (socket, room) => {
  console.log('socket: ' + socket.id + ' is leaving room ' + room);
  if (positionMap[room]) {
    console.log('1', positionMap);
    delete positionMap[room][socket.id];
    console.log('2', positionMap);
    if (Object.keys(positionMap[room]).length === 0) {
      delete positionMap[room];
    }
    console.log('3', positionMap); 
  }
};

io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('disconnect', () => {
    console.log('user DISconnected');
  });
  
  socket.on('disconnecting', () => {
    for (let room of socket.rooms) {
      leaveRoom(socket, room)
    }
  });

  socket.on('leave room', (room) => {
    console.log('user ' + socket.id + ' is leaving room ' + room);
    leaveRoom(socket, room);
  });

  socket.on('join room', (room) => {
    socket.join(room);
    if (!positionMap[room]) {
      console.log('creating room: ' + room);
      positionMap[room] = {};
    }
  });

  socket.on('update player position', (position) => {
    for (var roomId of socket.rooms) {
      if (roomId !== socket.id) {
        positionMap[roomId][socket.id] = position;
      }
    }
  });
});

setInterval(() => {
  Object.keys(positionMap).forEach(roomId => {
    io.to(roomId).emit('update all', positionMap[roomId]);
  });
}, 10);

server.listen(3000, () => {
  console.log('listening on *:3000');
});