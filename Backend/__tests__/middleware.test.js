const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const { SECRET } = require("../middleware");

describe("Middleware de auth/roles", () => {
  it("bloquea rutas protegidas sin token", async () => {
    const res = await request(app).get("/api/gastos");

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/No autorizado/);
  });

  it("bloquea ruta admin cuando el rol no es admin", async () => {
    const tokenComun = jwt.sign(
      { id: 10, role: "comun", nombre: "usuario_test" },
      SECRET
    );

    const res = await request(app)
      .get("/api/admin/usuarios")
      .set("Authorization", `Bearer ${tokenComun}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toMatch(/Permisos insuficientes/);
  });

  it("bloquea rutas protegidas con token invalido", async () => {
    const res = await request(app)
      .get("/api/gastos")
      .set("Authorization", "Bearer token.invalido");

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/Token/);
  });
});
