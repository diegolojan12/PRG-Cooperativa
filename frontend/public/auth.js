const $ = (id) => document.getElementById(id);
const toast = (message) => {
  $('toastTexto').textContent = message;
  $('toast').classList.add('visible');
  setTimeout(() => $('toast').classList.remove('visible'), 5000);
};
$('toast').setAttribute('role', 'alert');
$('toastCerrar').onclick = () => $('toast').classList.remove('visible');
$('alertaCerrar').onclick = () => ($('alerta').style.display = 'none');
if (new URLSearchParams(location.search).has('expired')) $('alerta').style.display = 'flex';
$('verClave').onclick = () => {
  const input = $('clave'),
    visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  $('verClave').setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
};
$('formLogin').addEventListener('submit', async (event) => {
  event.preventDefault();
  const correo = $('correo').value.trim(),
    clave = $('clave').value;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo),
    validPassword = clave.length >= 8;
  $('campoCorreo').classList.toggle('error', !validEmail);
  $('campoClave').classList.toggle('error', !validPassword);
  $('correo').setAttribute('aria-invalid', String(!validEmail));
  $('clave').setAttribute('aria-invalid', String(!validPassword));
  if (!validEmail || !validPassword) return toast('Revisa los campos marcados antes de continuar.');
  const submit = event.target.querySelector('[type=submit]');
  submit.disabled = true;
  submit.textContent = 'Ingresando…';
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, clave }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    location.href = '/panel';
  } catch (error) {
    toast(
      error.message === 'Failed to fetch'
        ? 'No se pudo conectar. Comprueba que el servidor esté iniciado.'
        : error.message,
    );
  } finally {
    submit.disabled = false;
    submit.textContent = 'Iniciar sesión →';
  }
});
