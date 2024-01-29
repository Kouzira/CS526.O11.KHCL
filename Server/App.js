import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const port = 3000;
const app = express();
const server = createServer(app);
const games = {};

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log("ID:", socket.id);

  socket.on("message", ({ room, message }) => {
    console.log(room, message);
    socket.to(room).emit("receive-message", message);
  });

  socket.on("join-room", (room) => {
    console.log("Joined room", room);
    socket.join(room);
  });

  socket.on('create-game', (room) => {
    console.log('Created game in room', room);
    socket.join(room);
    games[room] = { board: Array(9).fill(null), players: [socket.id], currentPlayer: socket.id };
    io.to(room).emit('game-state', games[room]);
  });

  socket.on('join-game', (room) => {
    console.log('Joined game in room', room);
    socket.join(room);
    if (games[room] && games[room].players.length === 1) {
      games[room].players.push(socket.id);
      io.to(room).emit('game-state', games[room]);
    }
  });

  socket.on('make-move', ({ room, index }) => {
    const game = games[room];
  
    if (game && game.currentPlayer === socket.id && !game.board[index]) {
      const currentPlayerSymbol = (game.currentPlayer === game.players[0]) ? "X" : "O";
  
      // Gán giá trị cho ô đó trên bảng là 'X' hoặc 'O', tùy thuộc vào người chơi hiện tại
      game.board[index] = currentPlayerSymbol;
  
      // Chuyển lượt chơi cho người chơi kế tiếp
      game.currentPlayer = (game.players[0] === socket.id) ? game.players[1] : game.players[0];
  
      // Gửi trạng thái mới của trò chơi đến tất cả các máy khách trong phòng
      io.to(room).emit('game-state', game);
  
      // Kiểm tra nếu người chơi đã chiến thắng
      if (checkWinner(game.board, currentPlayerSymbol)) {
        io.to(room).emit('game-over', { winner: socket.id });
      }
    }

  });
  

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

function checkWinner(board, player) {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  return winningCombinations.some(combination => {
    const [a, b, c] = combination;
    return board[a] === player && board[b] === player && board[c] === player;
  });
}

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});