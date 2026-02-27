jest.mock("../db", () => ({
  query: jest.fn(),
}));

const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db");
const { SECRET } = require("../middleware");

describe("Gastos endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/gastos aplica filtro por categoria cuando se envia en query", async () => {
    const token = jwt.sign({ id: 5, role: "comun", nombre: "tester" }, SECRET);
    db.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get("/api/gastos?categoria=Comida")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain("AND categoria = ?");
    expect(db.query.mock.calls[0][1]).toEqual([5, "Comida"]);
  });
});
