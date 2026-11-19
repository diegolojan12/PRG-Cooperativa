import { crearCorreo } from '../src/infraestructura/correo.mjs';

let verificando = false;
try {
  const correo = crearCorreo();
  if (!correo.disponible) throw new Error('Configura SMTP_SERVICE o SMTP_HOST.');
  verificando = true;
  await correo.verificar();
  console.log('SMTP: conexion y autenticacion correctas. No se enviaron mensajes; falta medir la entrega real.');
} catch (error) {
  const causas = {
    EAUTH: 'El proveedor rechazo la autenticacion. Revisa la contrasena de aplicacion o el token OAuth2.',
    ECONNECTION: 'No se pudo conectar. Revisa host, puerto y acceso de red.',
    ESOCKET: 'Fallo de conexion/TLS. Revisa el puerto y el certificado del proveedor.',
    ETIMEDOUT: 'El servidor SMTP no respondio a tiempo.',
    EDNS: 'No se pudo resolver el host SMTP.',
    ETLS: 'No se pudo establecer TLS con el proveedor.',
  };
  console.error('SMTP:', verificando ? causas[error.code] || 'Fallo del proveedor; revisa SMTP y sus credenciales.' : error.message);
  process.exitCode = 1;
}
