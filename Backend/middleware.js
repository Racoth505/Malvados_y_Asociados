const jwt = require('jsonwebtoken');

const SECRET = 'CLAVE_SECRETA';

exports.auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

exports.errorHandler = (err, req, res, next) => {
  res.status(400).json({
    error: err.message || 'Error del servidor'
  });
};

exports.SECRET = SECRET;
