const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { SECRET } = require('./middleware');

exports.register = async (req, res, next) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password)
      throw new Error('Campos obligatorios');

    const [existe] = await db.query(
      'SELECT id FROM Usuarios WHERE nombre = ?',
      [nombre]
    );
    if (existe.length) throw new Error('Usuario duplicado');

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO Usuarios (nombre, password) VALUES (?, ?)',
      [nombre, hash]
    );

    res.json({ message: 'Usuario registrado' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password)
      throw new Error('Datos incompletos');

    const [users] = await db.query(
      'SELECT * FROM Usuarios WHERE nombre = ?',
      [nombre]
    );
    if (!users.length) throw new Error('Credenciales inválidas');

    const user = users[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error('Credenciales inválidas');

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: '1d' });

    res.json({ token });
  } catch (err) {
    next(err);
  }
};
