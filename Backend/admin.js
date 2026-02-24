const db = require('./db');
const bcrypt = require('bcryptjs');

const COMMON_ROLE = 'comun';
const ADMIN_ROLE = 'admin';

const assertNotSelf = (authUserId, targetId) => {
  if (Number(authUserId) === Number(targetId)) {
    throw new Error('No puedes realizar esta operacion sobre tu propio usuario');
  }
};

const getUserById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, nombre, rol FROM Usuarios WHERE id = ?',
    [id]
  );
  return rows[0];
};

exports.listarUsuariosComunes = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, rol, created_at
       FROM Usuarios
       WHERE rol = ?
       ORDER BY created_at DESC`,
      [COMMON_ROLE]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.actualizarUsuarioComun = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, password } = req.body;

    const user = await getUserById(id);
    if (!user || user.rol !== COMMON_ROLE) {
      return res.status(404).json({ error: 'Usuario comun no encontrado' });
    }

    const updates = [];
    const values = [];

    if (nombre) {
      updates.push('nombre = ?');
      values.push(nombre);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hash);
    }

    if (!updates.length) {
      throw new Error('Debe enviar al menos un campo para actualizar');
    }

    values.push(id);
    await db.query(
      `UPDATE Usuarios
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    res.json({ message: 'Usuario comun actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.eliminarUsuarioComun = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const user = await getUserById(id);

    if (!user || user.rol !== COMMON_ROLE) {
      return res.status(404).json({ error: 'Usuario comun no encontrado' });
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM Gastos WHERE usuario_id = ?', [id]);
    await conn.query('DELETE FROM Ingresos WHERE usuario_id = ?', [id]);
    await conn.query('DELETE FROM Usuarios WHERE id = ?', [id]);
    await conn.commit();

    res.json({ message: 'Usuario comun eliminado' });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.crearAdmin = async (req, res, next) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
      throw new Error('Nombre y password son obligatorios');
    }

    const [exists] = await db.query(
      'SELECT id FROM Usuarios WHERE nombre = ?',
      [nombre]
    );
    if (exists.length) {
      throw new Error('Nombre de usuario duplicado');
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO Usuarios (nombre, password, rol) VALUES (?, ?, ?)',
      [nombre, hash, ADMIN_ROLE]
    );

    res.status(201).json({ message: 'Administrador creado' });
  } catch (err) {
    next(err);
  }
};

exports.listarAdmins = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT id, nombre, rol, created_at
       FROM Usuarios
       WHERE rol = ?
       ORDER BY created_at DESC`,
      [ADMIN_ROLE]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.actualizarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, password } = req.body;

    assertNotSelf(req.user.id, id);

    const admin = await getUserById(id);
    if (!admin || admin.rol !== ADMIN_ROLE) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    const updates = [];
    const values = [];

    if (nombre) {
      updates.push('nombre = ?');
      values.push(nombre);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hash);
    }

    if (!updates.length) {
      throw new Error('Debe enviar al menos un campo para actualizar');
    }

    values.push(id);
    await db.query(
      `UPDATE Usuarios
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    res.json({ message: 'Administrador actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.eliminarAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    assertNotSelf(req.user.id, id);

    const admin = await getUserById(id);
    if (!admin || admin.rol !== ADMIN_ROLE) {
      return res.status(404).json({ error: 'Administrador no encontrado' });
    }

    await db.query('DELETE FROM Usuarios WHERE id = ?', [id]);
    res.json({ message: 'Administrador eliminado' });
  } catch (err) {
    next(err);
  }
};

exports.reporteGeneral = async (req, res, next) => {
  try {
    const [resumenRows] = await db.query(
      `SELECT
         COALESCE((SELECT SUM(i.cantidad)
                   FROM Ingresos i
                   INNER JOIN Usuarios u ON u.id = i.usuario_id
                   WHERE u.rol = ?), 0) AS total_ingresos,
         COALESCE((SELECT SUM(g.cantidad)
                   FROM Gastos g
                   INNER JOIN Usuarios u ON u.id = g.usuario_id
                   WHERE u.rol = ?), 0) AS total_gastos,
         (SELECT COUNT(*)
          FROM Usuarios u
          WHERE u.rol = ?) AS numero_usuarios_comunes,
         (SELECT COUNT(*)
          FROM Usuarios u
          WHERE u.rol = ?) AS numero_administradores`,
      [COMMON_ROLE, COMMON_ROLE, COMMON_ROLE, ADMIN_ROLE]
    );

    const resumen = resumenRows[0];
    const balance =
      Number(resumen.total_ingresos || 0) - Number(resumen.total_gastos || 0);

    res.json({
      resumen: {
        totalIngresos: Number(resumen.total_ingresos || 0),
        totalGastos: Number(resumen.total_gastos || 0),
        balance,
        numeroUsuariosComunes: Number(resumen.numero_usuarios_comunes || 0),
        numeroAdministradores: Number(resumen.numero_administradores || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};
