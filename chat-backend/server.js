const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Endereço do frontend
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Usuário conectado');

  socket.on('sendMessage', (message) => {
    io.emit('receiveMessage', message); // Envia para todos os clientes
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});

server.listen(4000, () => {
  console.log('Servidor rodando na porta 4000');
});
