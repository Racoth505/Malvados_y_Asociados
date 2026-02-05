const db = require('./db');
const {
  validarCantidad,
  validarFecha,
  validarConcepto
} = require('./validators');

exports.crear = async (req, res, next) => {
  try {
    let { cantidad, fecha, concepto } = req.body;

    validarCantidad(cantidad);
    fecha = validarFecha(fecha);
    validarConcepto(concepto);

    await db.query(
      `INSERT INTO Ingresos (cantidad, fecha, concepto, usuario_id)
       VALUES (?, ?, ?, ?)`,
      [cantidad, fecha, concepto, req.user.id]
    );

    res.json({ message: 'Ingreso agregado' });
  } catch (err) {
    next(err);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Ingresos WHERE usuario_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
