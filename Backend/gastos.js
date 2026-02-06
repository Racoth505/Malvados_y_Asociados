const db = require('./db');
const {
  validarCantidad,
  validarFecha,
  validarConcepto,
  validarCategoria
} = require('./validators');

/* =========================
   CREAR GASTO
   ========================= */
exports.crear = async (req, res, next) => {
  try {
    let { cantidad, fecha, concepto, categoria, color } = req.body;

    validarCantidad(cantidad);
    fecha = validarFecha(fecha);
    validarConcepto(concepto);
    validarCategoria(categoria, color);

    await db.query(
      `INSERT INTO Gastos
       (cantidad, fecha, concepto, categoria, color_categoria, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cantidad, fecha, concepto, categoria, color, req.user.id]
    );

    res.json({ message: 'Gasto agregado' });
  } catch (err) {
    next(err);
  }
};

/* =========================
   LISTAR GASTOS
   ========================= */
exports.listar = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         id,
         cantidad AS amount,
         concepto AS concept,
         categoria AS category,
         color_categoria AS color,
         fecha AS date
       FROM Gastos
       WHERE usuario_id = ?`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* =========================
   ELIMINAR GASTO
   ========================= */
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM Gastos WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json({ message: 'Gasto eliminado' });
  } catch (err) {
    next(err);
  }
};

/* =========================
   ACTUALIZAR GASTO
   ========================= */
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { cantidad, fecha, concepto, categoria, color } = req.body;

    validarCantidad(cantidad);
    fecha = validarFecha(fecha);
    validarConcepto(concepto);
    validarCategoria(categoria, color);

    const [result] = await db.query(
      `UPDATE Gastos
       SET cantidad = ?,
           fecha = ?,
           concepto = ?,
           categoria = ?,
           color_categoria = ?
       WHERE id = ? AND usuario_id = ?`,
      [cantidad, fecha, concepto, categoria, color, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    res.json({ message: 'Gasto actualizado' });
  } catch (err) {
    next(err);
  }
};