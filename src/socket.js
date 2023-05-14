import socketIO from 'socket.io';

let io = null;
const clientsId = {};

const init = (server) => {
  io = socketIO(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('setUserId', (id) => {
      clientsId[id] = socket;
    });

    socket.on('disconnect', () => {
      console.log('A client disconnected');
      for (let id in clientsId) {
        if (clientsId[id].id === socket.id) {
          delete clientsId[id];
          break;
        }
      }
      console.log(`${Object.keys(clientsId).length} clients left`);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error('Socket.io instance is not initialized');
  return io;
};

const getClientSockets = () => {
  return clientsId;
};

export default {
  init,
  getIo,
  getClientSockets,
};
