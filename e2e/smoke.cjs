const { chromium, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const root = path.resolve(__dirname, ".."),
  output = process.env.SUMA_QA_OUTPUT || path.join(__dirname, "test-results");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "suma-ui-"));
const base = "http://127.0.0.1:4300";
fs.mkdirSync(output, { recursive: true });
const api = spawn(process.execPath, ["dist/main.js"], {
  cwd: path.join(root, "backend"),
  env: {
    ...process.env,
    PORT: "4301",
    DATABASE_URL: "file:" + path.join(temporary, "ui.db"),
    FRONTEND_URL: base,
    SEED_DEMO: "true",
    ENABLE_DEV_RESET_LINK: "true",
    NODE_ENV: "test",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
api.stdout.on("data", (x) => (logs += x));
api.stderr.on("data", (x) => (logs += x));
const dist = path.join(root, "frontend/dist/frontend/browser");
const mime = {
  ".js": "application/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json",
};
const web = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    const proxy = http.request(
      {
        hostname: "127.0.0.1",
        port: 4301,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (r) => {
        res.writeHead(r.statusCode, r.headers);
        r.pipe(res);
      },
    );
    proxy.on("error", () => {
      res.writeHead(502);
      res.end("API unavailable");
    });
    req.pipe(proxy);
    return;
  }
  const filename = path.resolve(
    dist,
    "." + decodeURIComponent(req.url.split("?")[0]),
  );
  if (!filename.startsWith(dist + path.sep) && filename !== dist) {
    res.writeHead(403);
    res.end();
    return;
  }
  const file =
    fs.existsSync(filename) && fs.statSync(filename).isFile()
      ? filename
      : path.join(dist, "index.html");
  res.setHeader(
    "Content-Type",
    mime[path.extname(file)] || "application/octet-stream",
  );
  fs.createReadStream(file).pipe(res);
});
(async () => {
  let browser;
  try {
    await new Promise((resolve) => web.listen(4300, "127.0.0.1", resolve));
    for (let i = 0; i < 80; i++) {
      try {
        if ((await fetch(base + "/api/health")).ok) break;
      } catch {}
      if (i === 79) throw Error("API did not start: " + logs);
      await new Promise((r) => setTimeout(r, 250));
    }
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 1080 },
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await expect(page.locator(".logotipo").first()).toContainText("SUMA");
    await page.goto(base + "/internas/iniciar-sesion.html");
    await page.locator("#correo").fill("admin@suma.ec");
    await page.locator("#clave").fill("Suma2026!");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    // RNF-06: segundo factor por correo para administradores.
    await expect(
      page.getByRole("heading", { name: "Revisa tu correo" }),
    ).toBeVisible();
    const code = (await page.locator(".recoveryStatus").textContent()).match(
      /\d{6}/,
    )[0];
    await page.locator("#codigo").fill(code);
    await page.getByRole("button", { name: "Verificar y entrar" }).click();
    await expect(
      page.getByRole("heading", { name: "Así vamos creciendo" }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(output, "SUMA-panel-administrador.png"),
      fullPage: true,
    });
    console.log("PASS: portada, acceso administrador con 2FA y tablero");
    for (const [route, title] of [
      ["referidos", "Referidos"],
      ["usuarios", "Usuarios"],
      ["roles", "Roles y permisos"],
      ["configuracion", "Configuración"],
      ["actividad", "Registro de actividad"],
      ["notificaciones", "Notificaciones"],
      ["ayuda", "Centro de ayuda"],
    ]) {
      await page.goto(base + "/panel/" + route);
      await expect(
        page.getByRole("heading", { name: title, exact: true }),
      ).toBeVisible();
      await expect(page.locator(".s-loading")).toHaveCount(0);
      await page.screenshot({
        path: path.join(output, "SUMA-" + route + ".png"),
        fullPage: true,
      });
    }
    console.log("PASS: las ocho pantallas de administración");
    await page.goto(base + "/panel/campanias");
    await page.getByRole("button", { name: "Nueva campaña" }).click();
    await page.locator("#campTitulo").fill("Campaña desde Chromium");
    const dia = new Date().toISOString().slice(0,10);
    const fin = new Date(Date.now() + 3 * 86400000).toISOString().slice(0,10);
    await page.locator("#campInicio").fill(dia);
    await page.locator("#campFin").fill(fin);
    await page.getByRole("checkbox", { name: "Loja", exact: true }).check();
    await page.getByRole("button", { name: "Guardar campaña" }).click();
    await expect(page.getByRole("heading", { name: "Campaña desde Chromium" })).toBeVisible();
    await page.getByRole("button", { name: "Activar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible();
    for (const [ruta, titulo] of [
      ["gamificacion", "Niveles e insignias"], ["retos", "Retos"], ["juegos", "Banco de preguntas"],
      ["capacitaciones", "Capacitaciones"], ["talleres", "Talleres"],
    ]) {
      await page.goto(base + "/panel/" + ruta);
      await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
    }
    console.log("PASS: campaña creada y activada y pantallas S3 a S4");
    await page.goto(base + "/panel/referidos");
    await page.getByRole("button", { name: "Nuevo referido" }).click();
    await page.getByRole("button", { name: "Registrar referido" }).click();
    await expect(page.locator(".s-field-error")).not.toHaveCount(0);
    await page.locator("#refNombre").fill("Ana Visual");
    await page.locator("#refCorreo").fill("visual@ejemplo.ec");
    await page.locator("#refCelular").fill("0991234567");
    await page.locator("#refConsentimiento").check();
    await page.getByRole("button", { name: "Registrar referido" }).click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await expect(page.getByText("Ana Visual", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Ana Visual", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Editar a Ana Visual", exact: true })
      .click();
    await page.locator("#refNotas").fill("Prefiere llamadas en la tarde");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Dictaminar a Ana Visual", exact: true })
      .click();
    await page.getByLabel(/Rechazado/).check();
    await page.getByRole("button", { name: "Registrar dictamen" }).click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Dar de baja a Ana Visual", exact: true })
      .click();
    await page.locator("#bajaMotivo").fill("Datos de prueba");
    await page
      .getByRole("button", { name: "Dar de baja", exact: true })
      .click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await expect(page.getByText("Ana Visual", { exact: true })).toHaveCount(0);
    console.log("PASS: crear, editar, dictaminar y dar de baja (lógica) un referido");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar" }).click();
    await downloadPromise;
    await page.goto(base + "/panel/configuracion");
    await page.locator("#cfgPuntos").fill("17.5");
    await page.getByRole("button", { name: "Guardar configuración" }).click();
    await expect(page.locator("#cfgPuntos-error")).toContainText("sin decimales");
    await page.locator("#cfgPuntos").fill("175");
    await page.getByRole("button", { name: "Guardar configuración" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Configuración guardada",
    );
    await page.reload();
    await expect(page.locator("#cfgPuntos")).toHaveValue("175");
    console.log("PASS: exportación y configuración persistente");
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await expect(page).toHaveURL(/iniciar-sesion/);
    const mobile = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      }),
      mp = await mobile.newPage();
    mp.on("pageerror", (e) => errors.push(e.message));
    await mp.goto(base + "/internas/iniciar-sesion.html");
    await mp.locator("#correo").fill("socio@suma.ec");
    await mp.locator("#clave").fill("Suma2026!");
    await mp.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      mp.getByRole("heading", { name: "Hola, Daniela" }),
    ).toBeVisible();
    await mp.screenshot({
      path: path.join(output, "SUMA-panel-movil.png"),
      fullPage: true,
    });
    await mp.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      mp.getByRole("link", { name: "Usuarios", exact: true }),
    ).toHaveCount(0);
    await mp.getByRole("link", { name: "Referidos", exact: true }).click();
    await expect(
      mp.getByRole("heading", { name: "Referidos", exact: true }),
    ).toBeVisible();
    const invitacion = await mp.locator("#enlace-oficial").inputValue();
    const codigoReferido = new URL(invitacion).searchParams.get("ref");
    expect(codigoReferido).toMatch(/^[A-Z0-9]{8}$/);
    await expect(mp.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me/);
    const qr = mp.waitForEvent("download");
    await mp.getByRole("link", { name: "Descargar QR" }).click();
    expect((await qr).suggestedFilename()).toBe("SUMA-invitacion.png");
    await mp.screenshot({
      path: path.join(output, "SUMA-referidos-movil.png"),
      fullPage: true,
    });
    const overflow = await mp.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    if (overflow) throw Error("Mobile horizontal overflow");
    await mp.goto(base + "/panel/usuarios");
    await expect(
      mp.getByRole("heading", { name: "Acceso denegado" }),
    ).toBeVisible();
    console.log("PASS: móvil, menú por rol y acceso denegado");
    await mp.goto(base + "/internas/recuperar.html");
    await mp.locator("#correo").fill("socio@suma.ec");
    await mp.getByRole("button", { name: "Enviar instrucciones" }).click();
    await mp
      .getByRole("link", { name: "Abrir enlace de recuperación" })
      .click();
    await mp.locator("#clave").fill("Nueva2026!");
    await mp.locator("#confirmar").fill("Nueva2026!");
    await mp.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(mp.locator("#message")).toContainText(
      "Contraseña actualizada",
    );
    console.log("PASS: recuperación de contraseña desde interfaz");
    await mp.goto(invitacion);
    await mp.locator("#nombre").fill("Prueba Interfaz");
    await mp.locator("#correo").fill("registro-ui@ejemplo.ec");
    await mp.locator("#celular").fill("0992222222");
    await mp.locator("#sig1").click();
    await mp.locator("#opNo").click();
    await mp.locator("#sig2").click();
    await expect(mp.locator("#codigoReferido")).toHaveValue(codigoReferido);
    await mp.locator("#clave").fill("Registro2026!");
    await mp.locator("#clave2").fill("Registro2026!");
    await mp.locator("#acepto").check();
    await mp.locator("#crear").click();
    await expect(mp).toHaveURL(/confirmar-correo/);
    const codigoConfirmacion = await mp.getByTestId("codigo-confirmacion").textContent();
    await mp.locator("#confirmacionCodigo").fill(codigoConfirmacion);
    await mp.getByRole("button", { name: "Confirmar correo" }).click();
    await expect(mp).toHaveURL(/iniciar-sesion/, { timeout: 10000 });
    await mp.locator("#correo").fill("registro-ui@ejemplo.ec");
    await mp.locator("#clave").fill("Registro2026!");
    await mp.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      mp.getByRole("heading", { name: "Hola, Prueba" }),
    ).toBeVisible();
    await mp.getByRole("link", { name: "Vincular mi cuenta" }).click();
    await mp.locator("#numeroCuentaVinculada").fill("2144556677");
    await mp.getByRole("button", { name: "Solicitar vinculación" }).click();
    await expect(mp.getByText("******6677", { exact: true })).toBeVisible();
    await mp.getByRole("button", { name: "Mostrar número" }).click();
    await expect(mp.getByText("2144556677", { exact: true })).toBeVisible();
    console.log("PASS: invitación por QR, código precargado, confirmación y vinculación en el perfil");
    await mp.goto(base + "/panel/perfil");
    await expect(mp.getByRole("heading", { name: "Mi perfil", exact: true })).toBeVisible();
    await expect(mp.locator("#perfilCorreo")).toHaveValue("registro-ui@ejemplo.ec");
    await mp.getByRole("button", { name: "Hacer público", exact: true }).click();
    await expect(mp.getByRole("button", { name: "Hacer privado", exact: true })).toBeVisible();
    await mp.goto(base + "/panel/puntos");
    await expect(mp.getByRole("heading", { name: "Ranking", exact: true })).toBeVisible();
    console.log("PASS: perfil, privacidad y puntos desde móvil");
    if (errors.length) throw Error("Browser errors: " + errors.join("\n"));
    console.log("PASS: sin errores de JavaScript. Capturas: " + output);
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => web.close(resolve));
    api.kill();
    await new Promise((r) => api.once("exit", r));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  console.error(logs);
  process.exitCode = 1;
});
