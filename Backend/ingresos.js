const db = require('./db');
const {
  validarCantidad,
  validarFecha,
  validarConcepto
} = require('./validators');

/* =========================
   CREAR INGRESO
   ========================= */
exports.crear = async (req, res, next) => {
  try {
    let { cantidad, fecha, concepto } = req.body;

    validarCantidad(cantidad);
    fecha = validarFecha(fecha);
    validarConcepto(concepto);

    await db.query(
      `INSERT INTO Ingresos
       (cantidad, fecha, concepto, usuario_id)
       VALUES (?, ?, ?, ?)`,
      [cantidad, fecha, concepto, req.user.id]
    );

    res.json({ message: 'Ingreso agregado' });
  } catch (err) {
    next(err);
  }
};

/* =========================
   LISTAR INGRESOS
   ========================= */
exports.listar = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         cantidad AS amount,
         concepto AS concept,
         fecha AS date
       FROM Ingresos
       WHERE usuario_id = ?`,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/* =========================
   ELIMINAR INGRESO
   ========================= */
exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM Ingresos WHERE id = ? AND usuario_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    res.json({ message: 'Ingreso eliminado' });
  } catch (err) {
    next(err);
  }
};

/* =========================
   ACTUALIZAR INGRESO
   ========================= */
exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { cantidad, fecha, concepto } = req.body;

    validarCantidad(cantidad);
    fecha = validarFecha(fecha);
    validarConcepto(concepto);

    const [result] = await db.query(
      `UPDATE Ingresos
       SET cantidad = ?,
           fecha = ?,
           concepto = ?
       WHERE id = ? AND usuario_id = ?`,
      [cantidad, fecha, concepto, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    res.json({ message: 'Ingreso actualizado' });
  } catch (err) {
    next(err);
  }

}