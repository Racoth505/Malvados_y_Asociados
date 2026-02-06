const API_URL = 'http://localhost:3000/api';
const $ = (s) => document.querySelector(s);
const errorMsg = $("#errorMsg");

function showError(msg){
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function clearError(){
  errorMsg.hidden = true;
}

function validate(username, password){
  username = username.trim();
  if(username.length < 3) return "El usuario debe tener al menos 3 caracteres.";
  if(password.length < 4) return "La contraseña debe tener al menos 4 caracteres.";
  return null;
}

// LOGIN
$("#btnLogin").addEventListener("click", async () => {
  clearError();

  const nombre = $("#username").value;
  const password = $("#password").value;

  const v = validate(nombre, password);
  if(v) return showError(v);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, password })
    });

    const data = await res.json();

    if(!res.ok) return showError(data.error || 'Error al iniciar sesión');

    localStorage.setItem('token', data.token);
    window.location.href = "home.html";

  } catch {
    showError("No se pudo conectar con el servidor");
  }
});

// REGISTER (si lo usas)
$("#btnSignup").addEventListener("click", async () => {
  clearError();

  const nombre = $("#username").value;
  const password = $("#password").value;

  const v = validate(nombre, password);
  if(v) return showError(v);

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, password })
    });

    const data = await res.json();
    if(!res.ok) return showError(data.error);

    alert("Usuario registrado, ahora inicia sesión");
  } catch {
    showError("Error de conexión");
  }
});
