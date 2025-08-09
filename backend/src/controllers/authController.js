const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { signJwtToken } = require('../utils/jwt');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 1000, // 1 hour in ms
};

exports.signup = async (req, res, next) => {
  try {
    const { id, password, name, phoneNumber } = req.body;

    if (!id || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (existingUser) {
      return res.status(400).json({ error: 'User ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        id,
        password: hashedPassword,
        name,
        phoneNumber,
      },
    });

    const token = signJwtToken({ id: user.id, name: user.name });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(201).json({ message: 'Signup successful', user: { id: user.id, name: user.name } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ error: 'ID and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signJwtToken({ id: user.id, name: user.name });

    res.cookie('token', token, COOKIE_OPTIONS);
    res.status(200).json({ message: 'Login successful', user: { id: user.id, name: user.name } });
  } catch (err) {
    next(err);
  }
};
