const db = require("./db");

const DEFAULT_CATEGORIES = [
  { name: "Comida", color: "#ef4444" },
  { name: "Transporte", color: "#f97316" },
  { name: "Hogar", color: "#8b5cf6" },
  { name: "Salud", color: "#22c55e" },
  { name: "Educacion", color: "#06b6d4" },
  { name: "Ocio", color: "#ec4899" },
];

const normalizeName = (value) => String(value || "").trim();
const normalizeColor = (value) => String(value || "").trim();

const validateName = (name) => {
  if (name.length < 3 || name.length > 30) {
    throw new Error("La categoria debe tener entre 3 y 30 caracteres");
  }
};

const validateColor = (color) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error("Color de categoria invalido");
  }
};

const ensureDefaultCategories = async (userId) => {
  const [countRows] = await db.query(
    "SELECT COUNT(*) AS total FROM Categorias WHERE usuario_id = ?",
    [userId]
  );

  if (Number(countRows[0]?.total || 0) > 0) return;

  const valuesSql = DEFAULT_CATEGORIES.map(() => "(?, ?, ?)").join(", ");
  const params = [];

  DEFAULT_CATEGORIES.forEach((row) => {
    params.push(row.name, row.color, userId);
  });

  await db.query(
    `INSERT INTO Categorias (nombre, color, usuario_id) VALUES ${valuesSql}`,
    params
  );
};

exports.listar = async (req, res, next) => {
  try {
    await ensureDefaultCategories(req.user.id);
    const [rows] = await db.query(
      `SELECT id, nombre AS name, color, created_at
       FROM Categorias
       WHERE usuario_id = ?
       ORDER BY created_at ASC, id ASC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const name = normalizeName(req.body?.nombre);
    const color = normalizeColor(req.body?.color);

    validateName(name);
    validateColor(color);

    const [result] = await db.query(
      `INSERT INTO Categorias (nombre, color, usuario_id)
       VALUES (?, ?, ?)`,
      [name, color, req.user.id]
    );

    res.status(201).json({ id: result.insertId, name, color });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "La categoria ya existe" });
    }
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const name = normalizeName(req.body?.nombre);
    const color = normalizeColor(req.body?.color);

    validateName(name);
    validateColor(color);

    const [rows] = await conn.query(
      `SELECT id, nombre, color
       FROM Categorias
       WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Categoria no encontrada" });
    }

    const previous = rows[0];

    await conn.beginTransaction();
    await conn.query(
      `UPDATE Categorias
       SET nombre = ?, color = ?
       WHERE id = ? AND usuario_id = ?`,
      [name, color, id, req.user.id]
    );

    await conn.query(
      `UPDATE Gastos
       SET categoria = ?, color_categoria = ?
       WHERE usuario_id = ? AND categoria = ?`,
      [name, color, req.user.id, previous.nombre]
    );

    await conn.commit();
    res.json({ message: "Categoria actualizada" });
  } catch (err) {
    await conn.rollback();
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "La categoria ya existe" });
    }
    next(err);
  } finally {
    conn.release();
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT nombre
       FROM Categorias
       WHERE id = ? AND usuario_id = ?`,
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Categoria no encontrada" });
    }

    const name = rows[0].nombre;
    const [usage] = await db.query(
      `SELECT COUNT(*) AS total
       FROM Gastos
       WHERE usuario_id = ? AND categoria = ?`,
      [req.user.id, name]
    );

    if (Number(usage[0]?.total || 0) > 0) {
      return res
        .status(400)
        .json({ error: "No puedes eliminar una categoria en uso por gastos" });
    }

    await db.query(
      "DELETE FROM Categorias WHERE id = ? AND usuario_id = ?",
      [id, req.user.id]
    );

    res.json({ message: "Categoria eliminada" });
  } catch (err) {
    next(err);
  }
};
