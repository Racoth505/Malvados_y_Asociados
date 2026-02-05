const express = require('express');
const app = express();

const auth = require('./auth');
const gastos = require('./gastos');
const ingresos = require('./ingresos');
const { auth: authMiddleware, errorHandler } = require('./middleware');

app.use(express.json());

// Auth
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);

// Gastos
app.post('/api/gastos', authMiddleware, gastos.crear);
app.get('/api/gastos', authMiddleware, gastos.listar);

// Ingresos
app.post('/api/ingresos', authMiddleware, ingresos.crear);
app.get('/api/ingresos', authMiddleware, ingresos.listar);

// Errores
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000. http://localhost:3000/');
});
