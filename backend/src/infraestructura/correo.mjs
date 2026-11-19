import nodemailer from 'nodemailer';

const PROVEEDORES = {
  gmail: { host: 'smtp.gmail.com', port: 465 },
  microsoft365: { host: 'smtp.office365.com', port: 587 },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 465 },
};
const booleano = (valor, defecto, nombre) => {
  if (valor === undefined || valor === '') return defecto;
  if (!['true', 'false'].includes(valor)) throw new Error(`${nombre} debe ser true o false.`);
  return valor === 'true';
};

export function opcionesCorreo(env = process.env) {
  const servicio = env.SMTP_SERVICE?.trim().toLowerCase();
  if (servicio && !Object.hasOwn(PROVEEDORES, servicio))
    throw new Error('SMTP_SERVICE debe ser gmail, microsoft365 o yahoo; para otro proveedor usa SMTP_HOST.');
  if (!servicio && !env.SMTP_HOST?.trim()) {
    if (env.SMTP_USER || env.SMTP_PASSWORD || env.SMTP_ACCESS_TOKEN)
      throw new Error('Falta SMTP_HOST o SMTP_SERVICE.');
    return null;
  }
  const perfil = PROVEEDORES[servicio] ?? {};
  const host = env.SMTP_HOST?.trim() || perfil.host;
  const port = Number(env.SMTP_PORT || perfil.port || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('SMTP_PORT debe ser un entero entre 1 y 65535.');
  const secure = booleano(env.SMTP_SECURE, port === 465, 'SMTP_SECURE');
  if (port === 465 && !secure) throw new Error('El puerto 465 requiere SMTP_SECURE=true.');
  if (port === 587 && secure) throw new Error('El puerto 587 usa STARTTLS: SMTP_SECURE=false.');
  const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host);
  const requireTLS = booleano(env.SMTP_REQUIRE_TLS, !secure && !local, 'SMTP_REQUIRE_TLS');
  if (!local && !secure && !requireTLS)
    throw new Error('Un SMTP remoto requiere TLS; usa SMTP_REQUIRE_TLS=true o TLS implicito.');
  const user = env.SMTP_USER?.trim();
  const tipo = env.SMTP_AUTH_TYPE?.trim().toLowerCase() || 'login';
  if (!['login', 'oauth2'].includes(tipo)) throw new Error('SMTP_AUTH_TYPE debe ser login u oauth2.');
  if ((env.SMTP_PASSWORD || env.SMTP_ACCESS_TOKEN || servicio) && !user)
    throw new Error('Falta SMTP_USER del remitente.');
  let auth;
  if (user) {
    if (tipo === 'oauth2') {
      if (!env.SMTP_ACCESS_TOKEN) throw new Error('Falta SMTP_ACCESS_TOKEN para OAuth2.');
      auth = { type: 'OAuth2', user, accessToken: env.SMTP_ACCESS_TOKEN };
    } else {
      if (!env.SMTP_PASSWORD) throw new Error('Falta SMTP_PASSWORD del remitente.');
      auth = { user, pass: env.SMTP_PASSWORD };
    }
  }
  return { host, port, secure, requireTLS, auth,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    tls: { minVersion: 'TLSv1.2' },
  };
}

/** Cola en memoria: nunca persiste codigos/enlaces; los reintentos se pierden al reiniciar. */
export function crearCorreo(env = process.env, {
  crearTransporte = nodemailer.createTransport,
  programar = (fn, ms) => setTimeout(() => { void fn(); }, ms).unref(),
  ahora = Date.now,
  error = mensaje => console.error(mensaje),
} = {}) {
  const opciones = opcionesCorreo(env);
  const transporte = opciones ? crearTransporte(opciones) : null;
  const from = env.SMTP_FROM?.trim() || (env.SMTP_USER ? `SUMA <${env.SMTP_USER.trim()}>` : 'SUMA <no-reply@suma.ec>');
  async function sendMail(message, intento = 0, vence, sigueVigente) {
    if (!transporte || (vence && Date.parse(vence) <= ahora())) return;
    try {
      if (sigueVigente && !await sigueVigente()) return;
    } catch {
      error('No se pudo comprobar la vigencia del correo.');
      return;
    }
    try {
      await transporte.sendMail({ from, ...message });
    } catch {
      if (intento >= 3) {
        error('No se pudo entregar un correo tras 4 intentos. Revisa la configuracion SMTP.');
        return;
      }
      programar(() => sendMail(message, intento + 1, vence, sigueVigente), 300000);
    }
  }
  return {
    disponible: !!transporte,
    sendMail,
    async verificar() {
      if (!transporte) throw new Error('Configura SMTP_SERVICE o SMTP_HOST.');
      return transporte.verify();
    },
  };
}
