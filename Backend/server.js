const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path'); // ← corregido

app.use(cors());
app.use(express.json());

// 🔥 Esto sirve tu carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const auth = require('./auth');
const gastos = require('./gastos');
const ingresos = require('./ingresos');
const { auth: authMiddleware, errorHandler } = require('./middleware');

app.get('/', (req, res) => {
  res.send('API FINSY funcionando 🚀');
});


// Auth
app.post('/api/auth/register', auth.register);
app.post('/api/auth/login', auth.login);

// Gastos
app.post('/api/gastos', authMiddleware, gastos.crear);
app.get('/api/gastos', authMiddleware, gastos.listar);
app.delete('/api/gastos/:id', authMiddleware, gastos.eliminar);
app.put('/api/gastos/:id', authMiddleware, gastos.actualizar);

// Ingresos
app.post('/api/ingresos', authMiddleware, ingresos.crear);
app.get('/api/ingresos', authMiddleware, ingresos.listar);
app.delete('/api/ingresos/:id', authMiddleware, ingresos.eliminar);
app.put('/api/ingresos/:id', authMiddleware, ingresos.actualizar);

// Errores
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000. http://localhost:3000/');
});
