const db = require('./db');
const {
  validarCantidad,
  validarFecha,
  validarConcepto,
  validarCategoria
} = require('./validators');

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

exports.listar = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Gastos WHERE usuario_id = ?',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
