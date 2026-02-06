/* =========================================
   CONFIGURACIÓN API / AUTH
   ========================================= */
const API_URL = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}
function logout() {
  localStorage.removeItem('token');
  location.href = 'index.html';
}
if (!getToken()) logout();

/* =========================================
   ESTADO GLOBAL
   ========================================= */
const state = {
  expenses: [],
  incomes: [],
  categories: {
    Comida: "#ff3b30",
    Ocio: "#ffb300",
    Casa: "#2f5cff",
    Salud: "#9c27b0"
  }
};

/* =========================================
   UTILIDADES
   ========================================= */
const $ = (sel) => document.querySelector(sel);

const REAL_TODAY = new Date();
let currentMonthDate = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth(), 1);

function money(n) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isSameMonth(dateStr, viewDate) {
  if (!dateStr) return false;
  const [y, m] = dateStr.split("-");
  return Number(y) === viewDate.getFullYear() &&
         Number(m) - 1 === viewDate.getMonth();
}

/* =========================================
   NAVEGACIÓN DE MESES
   ========================================= */
function prevMonth() {
  currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
  render();
}

function nextMonth() {
  const next = new Date(currentMonthDate);
  next.setMonth(next.getMonth() + 1);
  if (next > REAL_TODAY) return;
  currentMonthDate = next;
  render();
}

/* =========================================
   LÓGICA VISUAL (GRÁFICOS Y TEXTO)
   ========================================= */

function fitText(element, text) {
  element.textContent = text;
  const len = text.length;
  if(len > 11) element.style.fontSize = "20px"; 
  else if (len > 9) element.style.fontSize = "24px"; 
  else if (len > 7) element.style.fontSize = "28px"; 
  else element.style.fontSize = "34px"; 
}

const CIRC = 289; 

function setRingStroke(el, pct){
  const fg = el.querySelector(".ring-fg");
  if(!fg) return;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = CIRC - (CIRC * clamped / 100);
  fg.style.strokeDasharray = String(CIRC);
  fg.style.strokeDashoffset = String(offset);
}

function drawMultiColorRing(svgElement, dataList, totalBase, isProfitRing = false, profitAmount = 0) {
  svgElement.innerHTML = `<circle cx="60" cy="60" r="46" fill="none" stroke="#f0f0f0" stroke-width="10" />`;
  if (totalBase <= 0) return;

  const sums = {};
  dataList.forEach(e => {
  const cat = e.categoria || "Otros";
  sums[cat] = (sums[cat] || 0) + e.amount;
  });

  let currentOffset = 0;

  Object.entries(sums).forEach(([cat, val]) => {
    const pct = val / totalBase;
    const len = CIRC * pct;
    const color = state.categories[cat] || "#999";
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", "60"); c.setAttribute("cy", "60"); c.setAttribute("r", "46");
    c.setAttribute("fill", "none"); c.setAttribute("stroke", color);
    c.setAttribute("stroke-width", "10");
    c.setAttribute("stroke-dasharray", `${len} ${CIRC}`);
    c.setAttribute("stroke-dashoffset", -currentOffset);
    c.setAttribute("transform", "rotate(-90 60 60)");
    svgElement.appendChild(c);
    currentOffset += len;
  });

  if (isProfitRing && profitAmount > 0) {
    const profitPct = profitAmount / totalBase;
    const profitLen = CIRC * profitPct;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", "60"); c.setAttribute("cy", "60"); c.setAttribute("r", "46");
    c.setAttribute("fill", "none"); c.setAttribute("stroke", "#12a64a"); 
    c.setAttribute("stroke-width", "10");
    c.setAttribute("stroke-dasharray", `${profitLen} ${CIRC}`);
    c.setAttribute("stroke-dashoffset", -currentOffset);
    c.setAttribute("transform", "rotate(-90 60 60)");
    svgElement.appendChild(c);
  }
}


/* =========================================
   RENDER PRINCIPAL
   ========================================= */
function render() {
  const expenses = state.expenses.filter(e => isSameMonth(e.date, currentMonthDate));
  const incomes  = state.incomes.filter(i => isSameMonth(i.date, currentMonthDate));

  const totalExp = expenses.reduce((a, b) => a + b.amount, 0);
  const totalInc = incomes.reduce((a, b) => a + b.amount, 0);
  const profit   = totalInc - totalExp;

  $("#expenseAmount").textContent = money(totalExp);
  $("#incomeAmount").textContent  = money(totalInc);
  $("#profitAmount").textContent  = money(profit);

  /* ====== PROFIT RING ====== */
  const profitSvg = $("#profitRingSvg");
  drawMultiColorRing(profitSvg, expenses, totalInc, true, profit);

  /* ====== EXPENSE RING ====== */
  const expenseSvg = $("#expenseRingSvg");
  drawMultiColorRing(expenseSvg, expenses, totalExp);

  /* ====== INCOME RING (simple) ====== */
  const incomeRing = document.querySelector('[data-ring="income"]');
  setRingStroke(incomeRing, totalInc > 0 ? 100 : 0);

  renderLists(expenses, incomes);
}

/* =========================================
   LISTAS
   ========================================= */
function renderLists(expenses, incomes) {
  $("#expenseList").innerHTML = expenses.map(e => `
    <div class="item" onclick="editMovement('expense', ${e.id})">
      <div>
        <strong>${e.concept}</strong><br>
        ${e.categoria} · ${e.date}
      </div>
      <div class="text-red">-${money(e.amount)}</div>
    </div>
  `).join("") || "Sin gastos";

  $("#incomeList").innerHTML = incomes.map(i => `
    <div class="item" onclick="editMovement('income', ${i.id})">
      <div>
        <strong>${i.concept}</strong><br>
        ${i.date}
      </div>
      <div class="item" onclick="editMovement('income', ${i.id})">
    </div>
  `).join("") || "Sin ingresos";
}

/* =========================================
   MODAL (CREAR / EDITAR)
   ========================================= */
const modal = $("#movementModal");
let currentType = "income";
let editId = null;

window.openEditModal = function(type) {
  currentType = type;
  editId = null;

  $("#movAmount").value = "";
  $("#movConcept").value = "";
  $("#movDate").value = todayISO();
  $("#deleteBtn").style.display = "none";


  modal.showModal();
};

window.editMovement = function(type, id) {
  currentType = type;
  editId = id;

  const item = type === "income"
    ? state.incomes.find(i => i.id === id)
    : state.expenses.find(e => e.id === id);

  $("#movAmount").value = item.amount;
  $("#movConcept").value = item.concept;
  $("#movDate").value = item.date;
  $("#deleteBtn").style.display = "inline-block";

  modal.showModal();
};

$("#cancelBtn").onclick = () => {
  editId = null;
  modal.close();
};

$("#deleteBtn").onclick = async () => {
  if (!editId) return;

  const url =
    currentType === "income"
      ? `${API_URL}/ingresos/${editId}`
      : `${API_URL}/gastos/${editId}`;

  await fetch(url, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + getToken() }
  });

  modal.close();
  editId = null;
  loadData();
};

  $("#addIncomeBtn").onclick = () => openEditModal("income");
  $("#addExpenseBtn").onclick = () => openEditModal("expense");


/* =========================================
   SUBMIT (CREAR / ACTUALIZAR)
   ========================================= */
$("#movementForm").onsubmit = async (e) => {
  e.preventDefault();

  if (!$("#movAmount").value || !$("#movConcept").value) return;

  const body = {
    cantidad: Number($("#movAmount").value),
    concepto: $("#movConcept").value,
    fecha: $("#movDate").value
  };

  if (currentType === "expense") {
    body.categoria = $("#movCategory").value;
    body.color = state.categories[body.categoria];
  }

  let url = `${API_URL}/${currentType === "income" ? "ingresos" : "gastos"}`;
  let method = "POST";

  if (editId) {
    url += `/${editId}`;
    method = "PUT";
  }

  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(body)
  });

  modal.close();
  await loadData();
};

/* =========================================
   ELIMINAR
   ========================================= */
async function deleteIncome(id) {
  await fetch(`${API_URL}/ingresos/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + getToken() }
  });
  loadData();
}

async function deleteExpense(id) {
  await fetch(`${API_URL}/gastos/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + getToken() }
  });
  loadData();
}

/* =========================================
   CARGA INICIAL
   ========================================= */
async function loadData() {
  const headers = { Authorization: "Bearer " + getToken() };

  const [gRes, iRes] = await Promise.all([
    fetch(`${API_URL}/gastos`, { headers }),
    fetch(`${API_URL}/ingresos`, { headers })
  ]);

  const gastos = await gRes.json();
  const ingresos = await iRes.json();

  state.expenses = gastos.map(g => ({
  id: g.id,
  amount: g.amount,
  concept: g.concept,
  date: g.date,
  categoria: g.categoria
}));
  state.incomes = ingresos.map(g => ({
  id: g.id,
  amount: g.amount,
  concept: g.concept,
  date: g.date
}));

  render();
}

loadData();

/* =========================================
   EXPONER
   ========================================= */
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.logout = logout;