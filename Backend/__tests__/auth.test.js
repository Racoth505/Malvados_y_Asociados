jest.mock("../db", () => ({
  query: jest.fn(),
}));

const request = require("supertest");
const app = require("../app");
const db = require("../db");

describe("Auth endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/auth/register falla si faltan campos", async () => {
    const res = await request(app).post("/api/auth/register").send({
      nombre: "usuario_sin_pass",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Campos obligatorios");
  });

  it("POST /api/auth/login falla si el usuario no existe", async () => {
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app).post("/api/auth/login").send({
      nombre: "no_existe",
      password: "123456",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Credenciales/);
  });

  it("POST /api/auth/register falla si el usuario ya existe", async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);

    const res = await request(app).post("/api/auth/register").send({
      nombre: "usuario_duplicado",
      password: "123456",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Usuario duplicado");
  });
});
