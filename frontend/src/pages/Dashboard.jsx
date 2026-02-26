import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

const DEFAULT_CATEGORIES = [
  { name: "Comida", color: "#ef4444" },
  { name: "Transporte", color: "#f97316" },
  { name: "Hogar", color: "#8b5cf6" },
  { name: "Salud", color: "#22c55e" },
  { name: "Educacion", color: "#06b6d4" },
  { name: "Ocio", color: "#ec4899" },
];

const today = () => new Date().toISOString().slice(0, 10);

const categoryStorageKey = (userId) => `finsy_categories_${userId || "guest"}`;
const RING_RADIUS = 46;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function parseUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function buildArcSegments(segments) {
  const total = segments.reduce((sum, segment) => sum + Number(segment.value || 0), 0);
  let cursor = 0;

  return segments.map((segment) => {
    const length = total > 0 ? (RING_CIRCUMFERENCE * Number(segment.value || 0)) / total : 0;
    const arc = {
      ...segment,
      length,
      offset: -cursor,
    };
    cursor += length;
    return arc;
  });
}

function RingStat({ label, amount, ratio, color, delayClass = "" }) {
  const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
  const offset = RING_CIRCUMFERENCE * (1 - safeRatio);

  return (
    <article className={`card metric ring-card fade-in-up ${delayClass}`}>
      <p>{label}</p>
      <div className="ring-ui">
        <svg viewBox="0 0 120 120" className="ring-svg">
          <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
          <circle
            className="ring-fg"
            cx="60"
            cy="60"
            r={RING_RADIUS}
            style={{
              stroke: color,
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: offset,
            }}
          />
        </svg>
        <div className="ring-center-value">${Number(amount || 0).toFixed(2)}</div>
      </div>
    </article>
  );
}

function ExpenseColorRing({ label, amount, segments, delayClass = "" }) {
  const arcs = buildArcSegments(segments);

  return (
    <article className={`card metric ring-card fade-in-up ${delayClass}`}>
      <p>{label}</p>
      <div className="ring-ui">
        <svg viewBox="0 0 120 120" className="ring-svg">
          <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
          {arcs.length === 0 && <circle className="ring-empty" cx="60" cy="60" r={RING_RADIUS} />}
          {arcs.map((segment) => (
            <circle
              key={`${segment.category}-${segment.color}`}
              className="ring-segment"
              cx="60"
              cy="60"
              r={RING_RADIUS}
              style={{
                stroke: segment.color,
                strokeDasharray: `${segment.length} ${RING_CIRCUMFERENCE}`,
                strokeDashoffset: segment.offset,
              }}
            />
          ))}
        </svg>
        <div className="ring-center-value">${Number(amount || 0).toFixed(2)}</div>
      </div>
    </article>
  );
}

function CombinedRingStat({ label, incomeAmount, expenseAmount, delayClass = "" }) {
  const total = Number(incomeAmount || 0) + Number(expenseAmount || 0);
  const incomeRatio = total > 0 ? Number(incomeAmount || 0) / total : 0;
  const expenseRatio = total > 0 ? Number(expenseAmount || 0) / total : 0;
  const incomeLength = RING_CIRCUMFERENCE * incomeRatio;
  const expenseLength = RING_CIRCUMFERENCE * expenseRatio;

  return (
    <article className={`card metric ring-card fade-in-up ${delayClass}`}>
      <p>{label}</p>
      <div className="ring-ui">
        <svg viewBox="0 0 120 120" className="ring-svg">
          <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
          <circle
            className="ring-segment ring-segment-income"
            cx="60"
            cy="60"
            r={RING_RADIUS}
            style={{
              strokeDasharray: `${incomeLength} ${RING_CIRCUMFERENCE}`,
              strokeDashoffset: 0,
            }}
          />
          <circle
            className="ring-segment ring-segment-expense"
            cx="60"
            cy="60"
            r={RING_RADIUS}
            style={{
              strokeDasharray: `${expenseLength} ${RING_CIRCUMFERENCE}`,
              strokeDashoffset: -incomeLength,
            }}
          />
        </svg>
       <div className="ring-center-value ring-center-multi">
  <span className="muted">Balance</span>
  <span
    className={
      Number(incomeAmount || 0) - Number(expenseAmount || 0) >= 0
        ? "income-txt"
        : "expense-txt"
    }
  >
    $
    {(
      Number(incomeAmount || 0) -
      Number(expenseAmount || 0)
    ).toFixed(2)}
  </span>
</div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = parseUser();
  const isAdmin = user?.rol === "admin";

  const [tab, setTab] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [gastos, setGastos] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [adminUsers, setAdminUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [adminReport, setAdminReport] = useState(null);

  const [newIngreso, setNewIngreso] = useState({ cantidad: "", concepto: "", fecha: today() });
  const [newGasto, setNewGasto] = useState({
    cantidad: "",
    concepto: "",
    fecha: today(),
    categoria: DEFAULT_CATEGORIES[0].name,
    color: DEFAULT_CATEGORIES[0].color,
  });
  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6" });
  const [newAdmin, setNewAdmin] = useState({ nombre: "", password: "" });

  const [editingIngresoId, setEditingIngresoId] = useState(null);
  const [editingGastoId, setEditingGastoId] = useState(null);
  const [editIngreso, setEditIngreso] = useState({ cantidad: "", concepto: "", fecha: today() });
  const [editGasto, setEditGasto] = useState({
    cantidad: "",
    concepto: "",
    fecha: today(),
    categoria: DEFAULT_CATEGORIES[0].name,
    color: DEFAULT_CATEGORIES[0].color,
  });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserName, setEditingUserName] = useState("");

  const totals = useMemo(() => {
    const totalGastos = gastos.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const totalIngresos = ingresos.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return {
      totalGastos,
      totalIngresos,
      balance: totalIngresos - totalGastos,
    };
  }, [gastos, ingresos]);
  const totalsMax = Math.max(totals.totalIngresos, totals.totalGastos, 1);
  const expenseSegments = useMemo(() => {
    const grouped = gastos.reduce((acc, row) => {
      const key = `${row.category || "Sin categoria"}__${row.color || "#e53935"}`;
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

    const entries = Object.entries(grouped).map(([key, value]) => {
      const [category, color] = key.split("__");
      return { category, color, value };
    });
    return entries;
  }, [gastos]);
  const adminTotalsMax = Math.max(
    Number(adminReport?.resumen?.totalIngresos || 0),
    Number(adminReport?.resumen?.totalGastos || 0),
    1
  );
  const adminExpenseSegments = useMemo(() => {
    const movimientos = (adminReport?.movimientos || []).filter((item) => item.tipo === "gasto");
    const grouped = movimientos.reduce((acc, row) => {
      const key = `${row.categoria || "Sin categoria"}__${row.color_categoria || "#e53935"}`;
      acc[key] = (acc[key] || 0) + Number(row.cantidad || 0);
      return acc;
    }, {});

    const entries = Object.entries(grouped).map(([key, value]) => {
      const [category, color] = key.split("__");
      return { category, color, value };
    });
    return entries;
  }, [adminReport]);
  const adminExpenseArcs = useMemo(() => buildArcSegments(adminExpenseSegments), [adminExpenseSegments]);

  const showAction = (message) => {
    setActionMsg(message);
    window.setTimeout(() => setActionMsg(""), 2000);
  };

  const loadUserData = useCallback(async () => {
    const [gData, iData] = await Promise.all([apiFetch("/api/gastos"), apiFetch("/api/ingresos")]);
    setGastos(gData || []);
    setIngresos(iData || []);
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;

    const [usersData, adminsData, reportData] = await Promise.all([
      apiFetch("/api/admin/usuarios"),
      apiFetch("/api/admin/admins"),
      apiFetch("/api/admin/reportes/general"),
    ]);

    setAdminUsers(usersData || []);
    setAdmins(adminsData || []);
    setAdminReport(reportData || null);
  }, [isAdmin]);

  useEffect(() => {
    const stored = localStorage.getItem(categoryStorageKey(user.id));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          setCategories(parsed);
          setNewGasto((prev) => ({
            ...prev,
            categoria: parsed[0].name,
            color: parsed[0].color,
          }));
        }
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    }
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem(categoryStorageKey(user.id), JSON.stringify(categories));
  }, [categories, user.id]);

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadUserData(), loadAdminData()]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [loadAdminData, loadUserData]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const syncCategoryColor = (name, onChange) => {
    const found = categories.find((item) => item.name === name);
    if (found) {
      onChange((prev) => ({ ...prev, categoria: found.name, color: found.color }));
    }
  };

  const addCategory = (event) => {
    event.preventDefault();
    const name = newCategory.name.trim();
    if (name.length < 3) return setError("La categoria debe tener al menos 3 caracteres");

    if (categories.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      return setError("La categoria ya existe");
    }

    const next = [...categories, { name, color: newCategory.color }];
    setCategories(next);
    setNewCategory({ name: "", color: "#3b82f6" });
    setError("");
    showAction("Categoria agregada");
  };

  const addIngreso = async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/api/ingresos", {
        method: "POST",
        body: JSON.stringify({
          cantidad: Number(newIngreso.cantidad),
          concepto: newIngreso.concepto,
          fecha: newIngreso.fecha,
        }),
      });
      setNewIngreso({ cantidad: "", concepto: "", fecha: today() });
      await loadUserData();
      showAction("Ingreso agregado");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const addGasto = async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/api/gastos", {
        method: "POST",
        body: JSON.stringify({
          cantidad: Number(newGasto.cantidad),
          concepto: newGasto.concepto,
          fecha: newGasto.fecha,
          categoria: newGasto.categoria,
          color: newGasto.color,
        }),
      });
      setNewGasto((prev) => ({ ...prev, cantidad: "", concepto: "", fecha: today() }));
      await loadUserData();
      showAction("Gasto agregado");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeIngreso = async (id) => {
    try {
      await apiFetch(`/api/ingresos/${id}`, { method: "DELETE" });
      await loadUserData();
      showAction("Ingreso eliminado");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeGasto = async (id) => {
    try {
      await apiFetch(`/api/gastos/${id}`, { method: "DELETE" });
      await loadUserData();
      showAction("Gasto eliminado");
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditIngreso = (row) => {
    setEditingIngresoId(row.id);
    setEditIngreso({
      cantidad: row.amount,
      concepto: row.concept,
      fecha: row.date ? String(row.date).slice(0, 10) : today(),
    });
  };

  const startEditGasto = (row) => {
    setEditingGastoId(row.id);
    setEditGasto({
      cantidad: row.amount,
      concepto: row.concept,
      fecha: row.date ? String(row.date).slice(0, 10) : today(),
      categoria: row.category,
      color: row.color,
    });
  };

  const saveEditIngreso = async (id) => {
    try {
      await apiFetch(`/api/ingresos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          cantidad: Number(editIngreso.cantidad),
          concepto: editIngreso.concepto,
          fecha: editIngreso.fecha,
        }),
      });
      setEditingIngresoId(null);
      await loadUserData();
      showAction("Ingreso actualizado");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveEditGasto = async (id) => {
    try {
      await apiFetch(`/api/gastos/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          cantidad: Number(editGasto.cantidad),
          concepto: editGasto.concepto,
          fecha: editGasto.fecha,
          categoria: editGasto.categoria,
          color: editGasto.color,
        }),
      });
      setEditingGastoId(null);
      await loadUserData();
      showAction("Gasto actualizado");
    } catch (err) {
      setError(err.message);
    }
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/api/admin/admins", {
        method: "POST",
        body: JSON.stringify(newAdmin),
      });
      setNewAdmin({ nombre: "", password: "" });
      await loadAdminData();
      showAction("Administrador creado");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCommonUser = async (id) => {
    try {
      await apiFetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
      await loadAdminData();
      showAction("Usuario eliminado");
    } catch (err) {
      setError(err.message);
    }
  };

  const removeAdmin = async (id) => {
    try {
      await apiFetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      await loadAdminData();
      showAction("Administrador eliminado");
    } catch (err) {
      setError(err.message);
    }
  };

  const updateCommonUser = async (id) => {
    try {
      await apiFetch(`/api/admin/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nombre: editingUserName }),
      });
      setEditingUserId(null);
      setEditingUserName("");
      await loadAdminData();
      showAction("Usuario actualizado");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="wrap loading-shell">
        <div className="card">Cargando datos...</div>
      </main>
    );
  }

  return (
    <>
      <header className="topbar fade-in-up">
        <div className="brand">FINSY</div>
        <div className="top-actions">
          <span className="user">{user?.nombre || "Usuario"}</span>
          <button className="btn-logout" onClick={logout}>
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="wrap">
      <section className="totals-grid">
        <RingStat
          label="Ingresos"
          amount={totals.totalIngresos}
          ratio={totals.totalIngresos / totalsMax}
          color="var(--green)"
          delayClass="delay-1"
        />
        <ExpenseColorRing
          label="Gastos"
          amount={totals.totalGastos}
          segments={expenseSegments}
          delayClass="delay-2"
        />
        <CombinedRingStat
          label="Ingresos y Gastos"
          incomeAmount={totals.totalIngresos}
          expenseAmount={totals.totalGastos}
          delayClass="delay-3"
        />

      </section>

      {actionMsg && <p className="action-toast">{actionMsg}</p>}
      {error && <p className="form-error center">{error}</p>}

      <section className="tabs-row">
        <button className={`btn ${tab === "resumen" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("resumen")}>
          Resumen
        </button>
        <button className={`btn ${tab === "movimientos" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("movimientos")}>
          Movimientos
        </button>
        <button className={`btn ${tab === "categorias" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("categorias")}>
          Categorias
        </button>
        {isAdmin && (
          <button className={`btn ${tab === "admin" ? "btn-primary" : "btn-soft"}`} onClick={() => setTab("admin")}>
            Menu Admin
          </button>
        )}
      </section>

      {tab === "resumen" && (
        <section className="cards-grid">
          <form className="card" onSubmit={addIngreso}>
            <h3>Agregar ingreso</h3>
            <div className="form-grid">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Cantidad"
                value={newIngreso.cantidad}
                onChange={(event) => setNewIngreso((prev) => ({ ...prev, cantidad: event.target.value }))}
                required
              />
              <input
                placeholder="Concepto"
                maxLength={25}
                value={newIngreso.concepto}
                onChange={(event) => setNewIngreso((prev) => ({ ...prev, concepto: event.target.value }))}
                required
              />
              <input
                type="date"
                value={newIngreso.fecha}
                onChange={(event) => setNewIngreso((prev) => ({ ...prev, fecha: event.target.value }))}
                required
              />
              <button className="btn btn-primary" type="submit">
                Guardar ingreso
              </button>
            </div>
          </form>

          <form className="card" onSubmit={addGasto}>
            <h3>Agregar gasto</h3>
            <div className="form-grid">
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Cantidad"
                value={newGasto.cantidad}
                onChange={(event) => setNewGasto((prev) => ({ ...prev, cantidad: event.target.value }))}
                required
              />
              <input
                placeholder="Concepto"
                maxLength={25}
                value={newGasto.concepto}
                onChange={(event) => setNewGasto((prev) => ({ ...prev, concepto: event.target.value }))}
                required
              />
              <input
                type="date"
                value={newGasto.fecha}
                onChange={(event) => setNewGasto((prev) => ({ ...prev, fecha: event.target.value }))}
                required
              />
              <select
                value={newGasto.categoria}
                onChange={(event) => syncCategoryColor(event.target.value, setNewGasto)}
              >
                {categories.map((row) => (
                  <option key={row.name} value={row.name}>
                    {row.name}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={newGasto.color}
                onChange={(event) => setNewGasto((prev) => ({ ...prev, color: event.target.value }))}
                title="Color del gasto"
              />
              <button className="btn btn-primary" type="submit">
                Guardar gasto
              </button>
            </div>
          </form>
        </section>
      )}

      {tab === "movimientos" && (
        <section className="cards-grid">
          <article className="card">
            <h3>Ingresos</h3>
            <div className="rows rows-scroll">
              {ingresos.map((row) => (
                <div className="row-item" key={row.id}>
                  {editingIngresoId === row.id ? (
                    <div className="row-edit">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editIngreso.cantidad}
                        onChange={(event) => setEditIngreso((prev) => ({ ...prev, cantidad: event.target.value }))}
                      />
                      <input
                        value={editIngreso.concepto}
                        maxLength={25}
                        onChange={(event) => setEditIngreso((prev) => ({ ...prev, concepto: event.target.value }))}
                      />
                      <input
                        type="date"
                        value={editIngreso.fecha}
                        onChange={(event) => setEditIngreso((prev) => ({ ...prev, fecha: event.target.value }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <b>${Number(row.amount).toFixed(2)}</b> - {row.concept} ({String(row.date).slice(0, 10)})
                    </div>
                  )}

                  <div className="row-actions">
                    {editingIngresoId === row.id ? (
                      <>
                        <button className="btn btn-success" onClick={() => saveEditIngreso(row.id)}>
                          Guardar
                        </button>
                        <button className="btn btn-soft" onClick={() => setEditingIngresoId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-edit" onClick={() => startEditIngreso(row)}>
                          Editar
                        </button>
                        <button className="btn btn-danger" onClick={() => removeIngreso(row.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {ingresos.length === 0 && <p className="muted">Aun no tienes ingresos cargados.</p>}
            </div>
          </article>

          <article className="card">
            <h3>Gastos</h3>
            <div className="rows rows-scroll">
              {gastos.map((row) => (
                <div className="row-item" key={row.id}>
                  {editingGastoId === row.id ? (
                    <div className="row-edit">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editGasto.cantidad}
                        onChange={(event) => setEditGasto((prev) => ({ ...prev, cantidad: event.target.value }))}
                      />
                      <input
                        value={editGasto.concepto}
                        maxLength={25}
                        onChange={(event) => setEditGasto((prev) => ({ ...prev, concepto: event.target.value }))}
                      />
                      <input
                        type="date"
                        value={editGasto.fecha}
                        onChange={(event) => setEditGasto((prev) => ({ ...prev, fecha: event.target.value }))}
                      />
                      <select
                        value={editGasto.categoria}
                        onChange={(event) => syncCategoryColor(event.target.value, setEditGasto)}
                      >
                        {categories.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="color"
                        value={editGasto.color}
                        onChange={(event) => setEditGasto((prev) => ({ ...prev, color: event.target.value }))}
                        title="Color del gasto"
                      />
                    </div>
                  ) : (
                    <div>
                      <b>${Number(row.amount).toFixed(2)}</b> - {row.concept}
                      <span className="category-pill" style={{ backgroundColor: row.color || "#6b7280" }}>
                        {row.category}
                      </span>
                    </div>
                  )}

                  <div className="row-actions">
                    {editingGastoId === row.id ? (
                      <>
                        <button className="btn btn-success" onClick={() => saveEditGasto(row.id)}>
                          Guardar
                        </button>
                        <button className="btn btn-soft" onClick={() => setEditingGastoId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-edit" onClick={() => startEditGasto(row)}>
                          Editar
                        </button>
                        <button className="btn btn-danger" onClick={() => removeGasto(row.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {gastos.length === 0 && <p className="muted">Aun no tienes gastos cargados.</p>}
            </div>
          </article>
        </section>
      )}

      {tab === "categorias" && (
        <section className="cards-grid">
          <form className="card" onSubmit={addCategory}>
            <h3>Nueva categoria</h3>
            <div className="form-grid">
              <input
                placeholder="Nombre de categoria"
                value={newCategory.name}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(event) => setNewCategory((prev) => ({ ...prev, color: event.target.value }))}
              />
              <button className="btn btn-primary" type="submit">
                Crear categoria
              </button>
            </div>
          </form>

          <article className="card">
            <h3>Categorias actuales</h3>
            <div className="category-list">
              {categories.map((row) => (
                <div className="category-item" key={row.name}>
                  <span className="dot" style={{ background: row.color }} />
                  <span>{row.name}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {tab === "admin" && isAdmin && (
        <section className="cards-grid">
          <article className="card">
            <h3>Resumen global</h3>
            <div className="admin-rings">
              <div className="admin-ring-block">
                <p>Ingresos globales</p>
                <div className="ring-ui ring-ui--small">
                  <svg viewBox="0 0 120 120" className="ring-svg">
                    <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
                    <circle
                      className="ring-fg"
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      style={{
                        stroke: "var(--green)",
                        strokeDasharray: RING_CIRCUMFERENCE,
                        strokeDashoffset:
                          RING_CIRCUMFERENCE *
                          (1 - Number(adminReport?.resumen?.totalIngresos || 0) / adminTotalsMax),
                      }}
                    />
                  </svg>
                  <div className="ring-center-value">
                    ${Number(adminReport?.resumen?.totalIngresos || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="admin-ring-block">
                <p>Gastos globales</p>
                <div className="ring-ui ring-ui--small">
                  <svg viewBox="0 0 120 120" className="ring-svg">
                    <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
                    {adminExpenseArcs.length === 0 && <circle className="ring-empty" cx="60" cy="60" r={RING_RADIUS} />}
                    {adminExpenseArcs.map((segment) => (
                      <circle
                        key={`admin-${segment.category}-${segment.color}`}
                        className="ring-segment"
                        cx="60"
                        cy="60"
                        r={RING_RADIUS}
                        style={{
                          stroke: segment.color,
                          strokeDasharray: `${segment.length} ${RING_CIRCUMFERENCE}`,
                          strokeDashoffset: segment.offset,
                        }}
                      />
                    ))}
                  </svg>
                  <div className="ring-center-value">
                    ${Number(adminReport?.resumen?.totalGastos || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="admin-ring-block">
                <p>Ingresos y Gastos</p>
                <div className="ring-ui ring-ui--small">
                  <svg viewBox="0 0 120 120" className="ring-svg">
                    <circle className="ring-bg" cx="60" cy="60" r={RING_RADIUS} />
                    <circle
                      className="ring-segment ring-segment-income"
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      style={{
                        strokeDasharray: `${
                          RING_CIRCUMFERENCE *
                          (Number(adminReport?.resumen?.totalIngresos || 0) /
                            (Number(adminReport?.resumen?.totalIngresos || 0) +
                              Number(adminReport?.resumen?.totalGastos || 0) ||
                              1))
                        } ${RING_CIRCUMFERENCE}`,
                        strokeDashoffset: 0,
                      }}
                    />
                    <circle
                      className="ring-segment ring-segment-expense"
                      cx="60"
                      cy="60"
                      r={RING_RADIUS}
                      style={{
                        strokeDasharray: `${
                          RING_CIRCUMFERENCE *
                          (Number(adminReport?.resumen?.totalGastos || 0) /
                            (Number(adminReport?.resumen?.totalIngresos || 0) +
                              Number(adminReport?.resumen?.totalGastos || 0) ||
                              1))
                        } ${RING_CIRCUMFERENCE}`,
                        strokeDashoffset: `-${
                          RING_CIRCUMFERENCE *
                          (Number(adminReport?.resumen?.totalIngresos || 0) /
                            (Number(adminReport?.resumen?.totalIngresos || 0) +
                              Number(adminReport?.resumen?.totalGastos || 0) ||
                              1))
                        }`,
                      }}
                    />
                  </svg>
                  <div className="ring-center-value ring-center-multi">
                    <span className="income-txt">
                      I ${Number(adminReport?.resumen?.totalIngresos || 0).toFixed(0)}
                    </span>
                    <span className="expense-txt">
                      G ${Number(adminReport?.resumen?.totalGastos || 0).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p>
              Balance:{" "}
              <b>${Number(adminReport?.resumen?.balance || 0).toFixed(2)}</b>
            </p>

           <h4>Total de usuarios comunes</h4>
      <div className="admin-total-box">
        {adminUsers.length}
      </div>
          </article>

          <article className="card">
            <h3>Crear administrador</h3>
            <form className="form-grid" onSubmit={createAdmin}>
              <input
                placeholder="Nombre admin"
                value={newAdmin.nombre}
                onChange={(event) => setNewAdmin((prev) => ({ ...prev, nombre: event.target.value }))}
                required
              />
              <input
                placeholder="Password admin"
                type="password"
                value={newAdmin.password}
                onChange={(event) => setNewAdmin((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
              <button className="btn btn-primary" type="submit">
                Crear admin
              </button>
            </form>
          </article>

          <article className="card">
            <h3>Usuarios comunes</h3>
            <div className="rows rows-scroll">
              {adminUsers.map((row) => (
                <div className="row-item" key={row.id}>
                  {editingUserId === row.id ? (
                    <input value={editingUserName} onChange={(event) => setEditingUserName(event.target.value)} />
                  ) : (
                    <div>
                      <b>{row.nombre}</b> ({String(row.created_at).slice(0, 10)})
                    </div>
                  )}
                  <div className="row-actions">
                    {editingUserId === row.id ? (
                      <>
                        <button className="btn btn-success" onClick={() => updateCommonUser(row.id)}>
                          Guardar
                        </button>
                        <button className="btn btn-soft" onClick={() => setEditingUserId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-edit"
                          onClick={() => {
                            setEditingUserId(row.id);
                            setEditingUserName(row.nombre);
                          }}
                        >
                          Editar
                        </button>
                        <button className="btn btn-danger" onClick={() => removeCommonUser(row.id)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="card">
            <h3>Administradores</h3>
            <div className="rows rows-scroll">
              {admins.map((row) => (
                <div className="row-item" key={row.id}>
                  <div>
                    <b>{row.nombre}</b>
                  </div>
                  <div className="row-actions">
                    <button className="btn btn-danger" onClick={() => removeAdmin(row.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
      </main>
    </>
  );
}
