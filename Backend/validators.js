exports.validarCantidad = (c) => {
  if (!c || isNaN(c) || Number(c) <= 0)
    throw new Error('Cantidad inválida');
};

exports.validarFecha = (f) => {
  const hoy = new Date().toISOString().split('T')[0];
  if (!f) return hoy;
  if (f > hoy) throw new Error('Fecha no válida');
  return f;
};

exports.validarConcepto = (c) => {
  if (!c || c.length > 25)
    throw new Error('Concepto inválido');
};

exports.validarCategoria = (cat, color) => {
  if (!cat || cat.length < 3 || !color)
    throw new Error('Categoría inválida');
};
