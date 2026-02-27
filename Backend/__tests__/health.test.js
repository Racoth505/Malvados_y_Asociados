const request = require("supertest");
const app = require("../app");

describe("Health endpoint", () => {
  it("GET / responde OK", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("API FINSY funcionando");
  });
});
