const jwt=require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function signJwtToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyJwtToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { signJwtToken, verifyJwtToken };
