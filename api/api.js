require('dotenv').config();
const { v4: uuid } = require('uuid');
const express = require('express');
// const { dbGet, dbRun } = require('./database');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./database');
const http = require('http');
const { Server: SocketIO } = require('socket.io');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 4001;

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// The frontend runs on a different port, so CORS is required.
//
// For now, allow requests regardless of  origin. If this were
// a Real Project™, you'd use an environment-specific config file.

const io = new SocketIO(server, {
  cors: {
    origin: '*',
  },
});

const RacerStates = Object.freeze({
  WAITING: Symbol('RACER_STATE_WAITING'),
  IN_PROGRESS: Symbol('RACER_STATE_IN_PROGRESS'),
  FINISHED: Symbol('RACER_STATE_FINISHED'),
});

const noop = () => {};

class Game {
  constructor({ id, state, maxPlayers, onGameStart = noop, onGameFinished = noop }) {
    this.state = state;
    this.maxPlayers = maxPlayers;
    this.onGameStart = onGameStart;
    this.onGameFinished = onGameFinished;
    this.players = [];
    this.id = id;
  }

  addPlayer(player) {
    if (!this.isWaiting()) {
      throw 'Cannot add player to already-running game.';
    }

    this.players.push(player);

    if (this.isFull()) {
      this.start();
    }

    return this;
  }

  hasPlayer(player) {
    return this.players.includes(player);
  }

  start() {
    this.state = RacerStates.IN_PROGRESS;
    this.onGameStart(this);
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }

  finish(winnerPlayerId) {
    this.state = RacerStates.FINISHED;
    this.winner = winnerPlayerId;

    if (typeof this.onGameFinished === 'function') {
      this.onGameFinished(this);
    }
  }

  updateProgress(playerId, pct) {
    this.playersPct[playerId] = pct;

    if (pct >= 1 && this.state === RacerStates.IN_PROGRESS) {
      this.finish(playerId);
    }
  }

  isWaiting() {
    return this.state === RacerStates.WAITING;
  }

  isInProgress() {
    return this.state === RacerStates.IN_PROGRESS;
  }

  isFinished() {
    return this.state === RacerStates.FINISHED;
  }
}

class Player {
  constructor({ id, socketId }) {
    this.id = id;
    this.socketId = socketId;
  }
}


// Registration Route
app.post('/api/register', async (req,res) => {
  const {username, password} = req.body;

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `INSERT INTO users (username, password_hash) VALUES (?, ?)`;

    db.run(query, [username, passwordHash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json( { success: false, message: 'Username is already taken' });
        }
        return res.status(500).json({ success: false, message: 'Database error occured'});
      }
      return res.status(201).json({
        success: true,
        message: 'User registered successfully!',
        userId: this.lastID
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error'});
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
      const query = `SELECT * FROM users WHERE username = ?`;
    
    db.get(query, [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error occured' });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (passwordMatch) {
        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: '1h'}
        );

        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token: token
        });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        }); 
    }
});

} catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error'});
}
});

const createNewGame = ( { onGameStart }) => {
  return new Game({ maxPlayers: 5, onGameStart, id: uuid(), state: RacerStates.WAITING });
}

let activeGame = null;

app.get('/', (req, res) => {
  res.send('Hello').status(200);
});

io.on('connection', (socket) => {
  const player = new Player({ id: uuid(), socketId: socket.id });

  socket.on('disconnect', () => {
    if (activeGame && activeGame.hasPlayer(player)) {
      io.to(activeGame.id).emit('game.message', 'Player disconnected. Game ended.');
      activeGame = null;
    }
  });

  socket.on('game.join', ({username} = {}) => {

    player.username = username || 'Anonymous';

    if (!activeGame) {
      activeGame = createNewGame({
        onGameStart: (game) => {
          io.to(game.id).emit('game.start');
          io.to(game.id).emit('game.message', 'We have a game!');
        },
        onGameFinished: (game) => {
          io.to(game.id).emit('game.message', `Game finished! Player ${game.winner} won!`);
        }
      });
    }

    if (activeGame.isWaiting()) {
      socket.join(activeGame.id);
      socket.emit('game.message', 'Waiting for players.');

      socket.emit('game.playerId', player.id);

      // TODO: This is a hack. Should send down
      // list of existing players when someone connects.
      activeGame.players.forEach((player) => {
        socket.emit('game.player.join', player.id);
      });

      activeGame.addPlayer(player);

      io.in(activeGame.id).emit('game.player.join', player.id);

      if (activeGame.isFull()) {
        activeGame.start();
      }
    } else {
      socket.emit('game.message', 'The game is full.');
    }
  });

  socket.on('game.player.pct', ({ id, pct }) => {
    io.to(activeGame.id).emit('game.player.setPct', { id, pct });
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
