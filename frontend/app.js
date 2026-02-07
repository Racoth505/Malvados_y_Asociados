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
  expenseFilter: 'all',
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

function loadCatSelect() {
  const select = $("#movCategory");
  select.innerHTML = "";

  Object.entries(state.categories).forEach(([name, color]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  // Selecciona la primera por defecto
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    $("#movColor").value = state.categories[select.value];
  }
}

const $ = (sel) => document.querySelector(sel);

const REAL_TODAY = new Date();
let currentMonthDate = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth(), 1);

function normalizeDateStr(dateStr) {
  if (!dateStr) return "";
  // Soporta 'YYYY-MM-DD' y también 'YYYY-MM-DDTHH:mm:ss...'
  return String(dateStr).slice(0, 10);
}

function money(n) {
  return Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function formatMonthYear(date) {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${meses[date.getMonth()]} ${date.getFullYear()}`;
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function isSameMonth(dateStr, viewDate) {
  if (!dateStr) return false;
  const d = normalizeDateStr(dateStr);
  const [y, m] = d.split("-");
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
  // No permitir navegar a meses futuros
  const firstOfNext = new Date(next.getFullYear(), next.getMonth(), 1);
  const firstOfCurrentReal = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth(), 1);
  if (firstOfNext > firstOfCurrentReal) return;
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

  const monthLabel = formatMonthYear(currentMonthDate);
  // Month nav (profit)
  const monthText = $("#profitMonthText");
  if (monthText) monthText.textContent = monthLabel;
  const nextArrow = $("#nextArrow");
  const prevArrow = $("#prevArrow");
  if (nextArrow) {
    const firstOfNext = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
    const firstOfReal = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth(), 1);
    nextArrow.classList.toggle('disabled', firstOfNext > firstOfReal);
  }
  if (prevArrow) prevArrow.classList.remove('disabled');
  $("#incomeMonth").textContent = monthLabel;

  /* ====== PROFIT RING ====== */
  const profitSvg = $("#profitRingSvg");
  drawMultiColorRing(profitSvg, expenses, totalInc, true, profit);

  /* ====== EXPENSE RING ====== */
  const expenseSvg = $("#expenseRingSvg");
  drawMultiColorRing(expenseSvg, expenses, totalExp);

  /* ====== INCOME RING (simple) ====== */
  const incomeRing = document.querySelector('[data-ring="income"]');
  setRingStroke(incomeRing, totalInc > 0 ? 100 : 0);

  renderLegendAndFilter(expenses);
  renderMiniLists(expenses, incomes);
  renderLists(expenses, incomes);
}

function renderMiniLists(expenses, incomes) {
  const sortByDateDesc = (a, b) => normalizeDateStr(b.date).localeCompare(normalizeDateStr(a.date));
  const lastExpenses = [...expenses].sort(sortByDateDesc).slice(0, 2);
  const lastIncomes = [...incomes].sort(sortByDateDesc).slice(0, 2);

  const miniExp = $("#miniExpenseList");
  const miniInc = $("#miniIncomeList");

  if (miniExp) {
    miniExp.innerHTML = lastExpenses.map(e => `
      <div class="mini-item">
        <span class="mini-concept">${e.concept}</span>
        <span class="mini-amount text-red">-${money(e.amount)}</span>
      </div>
    `).join('') || '<div class="mini-item"><span class="mini-concept">Sin gastos</span></div>';
  }

  if (miniInc) {
    miniInc.innerHTML = lastIncomes.map(i => `
      <div class="mini-item">
        <span class="mini-concept">${i.concept}</span>
        <span class="mini-amount text-green">${money(i.amount)}</span>
      </div>
    `).join('') || '<div class="mini-item"><span class="mini-concept">Sin ingresos</span></div>';
  }
}

function renderLegendAndFilter(expenses) {
  const filter = $("#expenseFilter");
  const legend = $("#expenseLegend");
  if (!filter || !legend) return;

  const catsInMonth = [...new Set(expenses.map(e => e.categoria).filter(Boolean))];

  // Opciones del select
  filter.innerHTML = `<option value="all">Todos</option>` +
    catsInMonth.map(c => `<option value="${c}">${c}</option>`).join('');
  if (state.expenseFilter !== 'all' && !catsInMonth.includes(state.expenseFilter)) {
    state.expenseFilter = 'all';
  }
  filter.value = state.expenseFilter;

  legend.innerHTML = catsInMonth.map(c => {
    const color = state.categories[c] || '#999';
    return `<div class="legend-item"><span class="swatch" style="background:${color}"></span>${c}</div>`;
  }).join('') || '';
}

/* =========================================
   LISTAS
   ========================================= */
function renderLists(expenses, incomes) {
  const filteredExpenses = state.expenseFilter === 'all'
    ? expenses
    : expenses.filter(e => e.categoria === state.expenseFilter);

  $("#expenseList").innerHTML = filteredExpenses.map(e => {
    const c = e.categoria || 'Otros';
    const color = state.categories[c] || '#999';
    const d = normalizeDateStr(e.date);
    return `
      <div class="item" onclick="editMovement('expense', ${e.id})">
        <div class="item-left">
          <div class="item-title">${e.concept}</div>
          <div class="item-sub"><span class="swatch" style="background:${color}"></span>${c} · ${d}</div>
        </div>
        <div class="item-amt text-red">-${money(e.amount)}</div>
      </div>
    `;
  }).join("") || "Sin gastos";

  $("#incomeList").innerHTML = incomes.map(i => {
    const d = normalizeDateStr(i.date);
    return `
      <div class="item" onclick="editMovement('income', ${i.id})">
        <div class="item-left">
          <div class="item-title">${i.concept}</div>
          <div class="item-sub">${d}</div>
        </div>
        <div class="item-amt text-green">${money(i.amount)}</div>
      </div>
    `;
  }).join("") || "Sin ingresos";
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

  if (type === "expense") {
    loadCatSelect();                // 🔴 FALTABA
    $("#expenseFields").style.display = "grid";
  } else {
    $("#expenseFields").style.display = "none";
  }

  $("#formError").hidden = true;

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
  $("#movDate").value = normalizeDateStr(item.date);
  $("#deleteBtn").style.display = "inline-block";

  if (type === 'expense') {
    loadCatSelect();
    $("#expenseFields").style.display = "grid";
    $("#movCategory").value = item.categoria || $("#movCategory").value;
    $("#movColor").value = state.categories[$("#movCategory").value] || '#999999';
  } else {
    $("#expenseFields").style.display = "none";
  }

  $("#formError").hidden = true;

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

  const errorEl = $("#formError");
  errorEl.hidden = true;
  errorEl.textContent = '';

  if (!$("#movAmount").value || !$("#movConcept").value) return;

  // Validación front: no permitir fecha futura (mismo criterio que el backend)
  const d = $("#movDate").value;
  if (d && d > todayISO()) {
    errorEl.textContent = 'Fecha no válida (no puede ser mayor a hoy).';
    errorEl.hidden = false;
    return;
  }

  const body = {
    cantidad: Number($("#movAmount").value),
    concepto: $("#movConcept").value,
    fecha: $("#movDate").value
  };

  if (currentType === "expense") {
    body.categoria = $("#movCategory").value;
    // Si el usuario cambió el color manualmente, lo guardamos en el estado
    const picked = $("#movColor").value;
    state.categories[body.categoria] = picked;
    body.color = picked;
  }

  let url = `${API_URL}/${currentType === "income" ? "ingresos" : "gastos"}`;
  let method = "POST";

  if (editId) {
    url += `/${editId}`;
    method = "PUT";
  }

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + getToken()
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    let msg = 'Error al guardar';
    try {
      const data = await resp.json();
      msg = data?.error || msg;
    } catch {}
    errorEl.textContent = msg;
    errorEl.hidden = false;
    return;
  }

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

  state.expenses = gastos.map(g => {
    const cat = g.category || g.categoria || 'Otros';
    const color = g.color || state.categories[cat] || '#999999';
    // Mantener catálogo de colores (viene del backend o de defaults)
    state.categories[cat] = color;
    return {
      id: g.id,
      amount: Number(g.amount || 0),
      concept: g.concept,
      date: normalizeDateStr(g.date),
      categoria: cat,
      color
    };
  });

  state.incomes = ingresos.map(i => ({
    id: i.id,
    amount: Number(i.amount || 0),
    concept: i.concept,
    date: normalizeDateStr(i.date)
  }));

  render();
}

// Filtro de gastos
const expenseFilterEl = document.getElementById('expenseFilter');
if (expenseFilterEl) {
  expenseFilterEl.addEventListener('change', (e) => {
    state.expenseFilter = e.target.value;
    render();
  });
}

// Sincronizar color con categoría en el modal
const movCatEl = document.getElementById('movCategory');
const movColorEl = document.getElementById('movColor');
if (movCatEl && movColorEl) {
  movCatEl.addEventListener('change', () => {
    const cat = movCatEl.value;
    movColorEl.value = state.categories[cat] || '#999999';
  });
  movColorEl.addEventListener('input', () => {
    const cat = movCatEl.value;
    if (cat) state.categories[cat] = movColorEl.value;
  });
}

// Sync select->color en modal
const catSel = document.getElementById('movCategory');
if (catSel) {
  catSel.addEventListener('change', () => {
    const cat = catSel.value;
    const c = state.categories[cat] || '#999999';
    const colorInput = document.getElementById('movColor');
    if (colorInput) colorInput.value = c;
  });
}

loadData();

/* =========================================
   EXPONER
   ========================================= */
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.logout = logout;