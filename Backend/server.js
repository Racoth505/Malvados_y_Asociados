require('dotenv').config();

const express = require('express');
const app = express();
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(cors());
app.use(express.json());

const auth = require("./auth");
const gastos = require("./gastos");
const ingresos = require("./ingresos");
const admin = require("./admin");
const { auth: authMiddleware, requireRole, errorHandler } = require("./middleware");

app.get("/", (req, res) => {
  res.send("API FINSY funcionando");
});

const divisas = require('./divisas');
app.get('/api/divisas/convertir', authMiddleware, divisas.convertir);
app.get('/api/divisas/populares', authMiddleware, divisas.populares);

// Auth
app.post("/api/auth/register", auth.register);
app.post("/api/auth/login", auth.login);

// Gastos
app.post("/api/gastos", authMiddleware, gastos.crear);
app.get("/api/gastos", authMiddleware, gastos.listar);
app.delete("/api/gastos/:id", authMiddleware, gastos.eliminar);
app.put("/api/gastos/:id", authMiddleware, gastos.actualizar);

// Ingresos
app.post("/api/ingresos", authMiddleware, ingresos.crear);
app.get("/api/ingresos", authMiddleware, ingresos.listar);
app.delete("/api/ingresos/:id", authMiddleware, ingresos.eliminar);
app.put("/api/ingresos/:id", authMiddleware, ingresos.actualizar);

// Admin: usuarios comunes
app.get("/api/admin/usuarios", authMiddleware, requireRole("admin"), admin.listarUsuariosComunes);
app.put("/api/admin/usuarios/:id", authMiddleware, requireRole("admin"), admin.actualizarUsuarioComun);
app.delete("/api/admin/usuarios/:id", authMiddleware, requireRole("admin"), admin.eliminarUsuarioComun);

// Admin: otros administradores
app.post("/api/admin/admins", authMiddleware, requireRole("admin"), admin.crearAdmin);
app.get("/api/admin/admins", authMiddleware, requireRole("admin"), admin.listarAdmins);
app.put("/api/admin/admins/:id", authMiddleware, requireRole("admin"), admin.actualizarAdmin);
app.delete("/api/admin/admins/:id", authMiddleware, requireRole("admin"), admin.eliminarAdmin);

// Admin: reporte financiero global
app.get("/api/admin/reportes/general", authMiddleware, requireRole("admin"), admin.reporteGeneral);

// Si existe build del frontend React, servirlo desde Express (produccion)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000. http://localhost:3000/");
});
