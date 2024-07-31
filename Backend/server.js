const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crypto-tracker', { useNewUrlParser: true, useUnifiedTopology: true });

// User schema and model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  portfolio: [
    {
      crypto: String,
      amount: Number,
      buyPrice: Number,
      position: String,
      leverage: Number
    }
  ]
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password') || this.isNew) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model('User', UserSchema);

// Register route
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    res.status(201).send('User registered');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid credentials');

    const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).send('Invalid token');
  }
};

// Route to get user portfolio
app.get('/portfolio', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json(user.portfolio);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route to add a transaction to the portfolio
app.post('/portfolio', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.portfolio.push(req.body);
    await user.save();
    res.status(201).send('Transaction added');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});