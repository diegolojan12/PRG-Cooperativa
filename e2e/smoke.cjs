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
    await expect(
      page.getByRole("heading", { name: "Hola, Andrea" }),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(output, "SUMA-panel-administrador.png"),
      fullPage: true,
    });
    console.log("PASS: portada y acceso administrador");
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
    await page.goto(base + "/panel/referidos");
    await page.getByRole("button", { name: "Nuevo referido" }).click();
    await page.locator("#refName").fill("Ana Visual");
    await page.locator("input[name=correo]").fill("visual@ejemplo.ec");
    await page.locator("input[name=celular]").fill("0991234567");
    await page.locator("input[name=consentimiento]").check();
    await page.getByRole("button", { name: "Registrar referido" }).click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await expect(page.getByText("Ana Visual", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Ana Visual", { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Editar a Ana Visual", exact: true })
      .click();
    await page.locator("select[name=estado]").selectOption("VALIDADO");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Eliminar a Ana Visual", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Eliminar referido", exact: true })
      .click();
    await expect(page.locator(".s-modal")).toHaveCount(0);
    await expect(page.getByText("Ana Visual", { exact: true })).toHaveCount(0);
    console.log("PASS: crear, persistir, editar y eliminar referido");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar" }).click();
    await downloadPromise;
    await page.goto(base + "/panel/configuracion");
    await page.locator("input[name=puntos]").fill("175");
    await page.getByRole("button", { name: "Guardar configuración" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Configuración guardada",
    );
    await page.reload();
    await expect(page.locator("input[name=puntos]")).toHaveValue("175");
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
      mp.getByRole("heading", { name: "Este espacio no está disponible" }),
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
    await mp.goto(base + "/internas/registro.html");
    await mp.locator("#nombre").fill("Prueba Interfaz");
    await mp.locator("#correo").fill("registro-ui@ejemplo.ec");
    await mp.locator("#celular").fill("0992222222");
    await mp.locator("#sig1").click();
    await mp.locator("#opNo").click();
    await mp.locator("#sig2").click();
    await mp.locator("#clave").fill("Registro2026!");
    await mp.locator("#clave2").fill("Registro2026!");
    await mp.locator("#acepto").check();
    await mp.locator("#crear").click();
    await expect(mp).toHaveURL(/iniciar-sesion/, { timeout: 10000 });
    await mp.locator("#correo").fill("registro-ui@ejemplo.ec");
    await mp.locator("#clave").fill("Registro2026!");
    await mp.getByRole("button", { name: "Iniciar sesión" }).click();
    await expect(
      mp.getByRole("heading", { name: "Hola, Prueba" }),
    ).toBeVisible();
    console.log("PASS: registro existente conectado a base de datos");
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
