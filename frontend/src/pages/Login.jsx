import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function Login() {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        await apiFetch("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ nombre, password }),
        });
        setMode("login");
        setError("Usuario creado. Ahora inicia sesion.");
        return;
      }

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ nombre, password }),
      });

      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="left">
        <div className="logo">FINSY</div>
      </section>

      <section className="right">
        <form className="card login-card fade-in-up" onSubmit={onSubmit}>
          <h1>{mode === "login" ? "Log in" : "Sign Up"}</h1>

          <label className="field" htmlFor="nombre">
            <span>Usuario</span>
            <input
              id="nombre"
              placeholder="Ej: osvaldo"
              autoComplete="username"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
          </label>

          <label className="field" htmlFor="password">
            <span>Ingresa tu contrasena</span>
            <input
              id="password"
              type="password"
              placeholder="Tu contrasena"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Procesando..." : mode === "login" ? "Log in" : "Sign Up"}
          </button>
          <button
            className="btn btn-soft btn-block"
            type="button"
            onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
            disabled={loading}
          >
            {mode === "login" ? "Sign Up" : "Ya tengo cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}
