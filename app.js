const express = require("express");
const path = require("node:path");
const { createServer } = require("node:http");
const { WebSocketServer } = require("ws");

const health = require("./api/health");
const qr = require("./api/qr");
const proxy = require("./api/proxy");
const dns = require("./api/osint/dns");
const rdap = require("./api/osint/rdap");
const ct = require("./api/osint/ct");
const headers = require("./api/osint/headers");
const robots = require("./api/osint/robots");
const username = require("./api/osint/username");

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.get("/api/health", health);
app.get("/api/qr", qr);
app.all("/api/proxy", proxy);
app.get("/api/osint/dns", dns);
app.get("/api/osint/rdap", rdap);
app.get("/api/osint/ct", ct);
app.get("/api/osint/headers", headers);
app.get("/api/osint/robots", robots);
app.get("/api/osint/username", username);
app.get("/api/scramjet-status", async (req, res) => {
  try {
    await getVendorReady();
    res.json({
      ok: true,
      assets: {
        controllerApi: "/controller/controller.api.js",
        controllerSw: "/controller/controller.sw.js",
        controllerInject: "/controller/controller.inject.js",
        scramjetJs: "/scramjet/scramjet.js",
        scramjetWasm: "/scramjet/scramjet.wasm",
        libcurl: "/libcurl/index.mjs",
        serviceWorker: "/sw.js",
        wisp: "/wisp/"
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  }
}));

let scramjetStatic = null;
let controllerStatic = null;
let libcurlStatic = null;
let wisp = null;
let vendorReadyPromise = null;

function findPackageRoot(entryFile, expectedName) {
  const fs = require("node:fs");
  const pathMod = require("node:path");
  let dir = pathMod.dirname(entryFile);

  for (let i = 0; i < 8; i++) {
    const pkgFile = pathMod.join(dir, "package.json");
    if (fs.existsSync(pkgFile)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
        if (!expectedName || pkg.name === expectedName) return dir;
      } catch {}
    }
    const parent = pathMod.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  throw new Error(`Could not locate package root for ${expectedName || entryFile}`);
}

function findExistingDir(candidates, requiredFile) {
  const fs = require("node:fs");
  const pathMod = require("node:path");

  for (const dir of candidates) {
    if (!dir) continue;
    const target = requiredFile ? pathMod.join(dir, requiredFile) : dir;
    if (fs.existsSync(target)) return dir;
  }

  throw new Error(`Could not locate runtime asset ${requiredFile || ""} in: ${candidates.filter(Boolean).join(", ")}`);
}

function getVendorReady() {
  if (vendorReadyPromise) return vendorReadyPromise;

  vendorReadyPromise = (async () => {
    const fs = require("node:fs");
    const pathMod = require("node:path");

    const scramjetPathMod = await import("@mercuryworkshop/scramjet/path");
    const scramjetPath = scramjetPathMod.scramjetPath || scramjetPathMod.default;
    if (!scramjetPath) throw new Error("Scramjet package did not expose scramjetPath");

    // Resolve only public/exported package entrypoints. Never resolve blocked dist subpaths.
    const controllerEntry = require.resolve("@mercuryworkshop/scramjet-controller");
    const controllerRoot = findPackageRoot(controllerEntry, "@mercuryworkshop/scramjet-controller");
    const controllerPath = findExistingDir([
      pathMod.join(controllerRoot, "dist"),
      pathMod.dirname(controllerEntry),
      controllerRoot
    ], "controller.api.js");

    const libcurlEntry = require.resolve("@mercuryworkshop/libcurl-transport");
    const libcurlRoot = findPackageRoot(libcurlEntry, "@mercuryworkshop/libcurl-transport");
    const libcurlPath = findExistingDir([
      pathMod.dirname(libcurlEntry),
      pathMod.join(libcurlRoot, "dist"),
      libcurlRoot
    ], "index.mjs");

    const requiredAssets = [
      pathMod.join(scramjetPath, "scramjet.js"),
      pathMod.join(scramjetPath, "scramjet.wasm"),
      pathMod.join(controllerPath, "controller.api.js"),
      pathMod.join(controllerPath, "controller.inject.js"),
      pathMod.join(controllerPath, "controller.sw.js"),
      pathMod.join(libcurlPath, "index.mjs")
    ];

    const missing = requiredAssets.filter((file) => !fs.existsSync(file));
    if (missing.length) {
      throw new Error("Missing Scramjet runtime assets: " + missing.join(", "));
    }

    scramjetStatic = express.static(scramjetPath, { fallthrough: false });
    controllerStatic = express.static(controllerPath, { fallthrough: false });
    libcurlStatic = express.static(libcurlPath, { fallthrough: false });

    const wispMod = await import("@mercuryworkshop/wisp-js/server");
    wisp = wispMod.server;

    console.log("Scramjet assets ready", {
      scramjetPath,
      controllerRoot,
      controllerPath,
      libcurlRoot,
      libcurlPath
    });

    return {
      scramjetPath,
      controllerRoot,
      controllerPath,
      libcurlRoot,
      libcurlPath
    };
  })().catch((error) => {
    // Allow a later request to retry after a transient module-load problem.
    vendorReadyPromise = null;
    throw error;
  });

  return vendorReadyPromise;
}

app.use("/scramjet/", async (req, res, next) => {
  try { await getVendorReady(); return scramjetStatic(req, res, next); }
  catch (e) { return next(e); }
});
app.use("/controller/", async (req, res, next) => {
  try { await getVendorReady(); return controllerStatic(req, res, next); }
  catch (e) { return next(e); }
});
app.use("/libcurl/", async (req, res, next) => {
  try { await getVendorReady(); return libcurlStatic(req, res, next); }
  catch (e) { return next(e); }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/scramjet/") ||
      req.path.startsWith("/controller/") || req.path.startsWith("/libcurl/") ||
      req.path.startsWith("/~/sj/")) {
    return next();
  }
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Null Sec server error" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

const server = createServer(app);

/* ---------------- Realtime username chat ---------------- */
const chatWss = new WebSocketServer({ noServer: true });
const users = new Map();

function validName(value) {
  const name = String(value || "").trim();
  return /^[A-Za-z0-9_]{3,20}$/.test(name) ? name : null;
}
function send(ws, packet) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(packet));
}
function presence() {
  return [...users.entries()].map(([name, x]) => ({ username: name, pub: x.pub }));
}
function broadcast(packet, except = null) {
  const raw = JSON.stringify(packet);
  for (const { ws } of users.values()) {
    if (ws !== except && ws.readyState === ws.OPEN) ws.send(raw);
  }
}
function publishPresence() {
  broadcast({ type: "presence", users: presence() });
}

chatWss.on("connection", (ws) => {
  let current = null;

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      return send(ws, { type: "error", message: "Invalid message" });
    }

    if (msg.type === "hello") {
      const name = validName(msg.username);
      const pub = typeof msg.pub === "string" && msg.pub.length < 512 ? msg.pub : null;
      if (!name || !pub) return send(ws, { type: "error", message: "Invalid username or public key" });
      if (users.has(name) && users.get(name).ws !== ws) {
        return send(ws, { type: "error", message: "Username is already online" });
      }
      if (current && current !== name) users.delete(current);
      current = name;
      users.set(name, { ws, pub, joined: Date.now() });
      send(ws, { type: "ready", username: name });
      publishPresence();
      broadcast({ type: "system", text: `${name} joined public chat` }, ws);
      return;
    }

    if (!current) return send(ws, { type: "error", message: "Choose a username first" });

    if (msg.type === "public") {
      const text = String(msg.text || "").slice(0, 2000);
      if (!text.trim()) return;
      broadcast({ type: "public", from: current, text, at: Date.now() });
      return;
    }

    if (msg.type === "dm") {
      const to = validName(msg.to);
      const peer = to && users.get(to);
      if (!peer) return send(ws, { type: "error", message: "User is not online" });
      const envelope = {
        type: "dm",
        from: current,
        to,
        iv: String(msg.iv || "").slice(0, 128),
        ct: String(msg.ct || "").slice(0, 12000),
        pub: users.get(current).pub,
        at: Date.now()
      };
      send(peer.ws, envelope);
      send(ws, { type: "dm_ack", to, at: envelope.at });
      return;
    }
  });

  ws.on("close", () => {
    if (current && users.get(current)?.ws === ws) {
      users.delete(current);
      broadcast({ type: "system", text: `${current} left public chat` });
      publishPresence();
    }
  });
});

/* ---------------- Wisp + chat upgrades ---------------- */
server.on("upgrade", async (req, socket, head) => {
  try {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;

    if (pathname === "/chat/" || pathname === "/chat") {
      chatWss.handleUpgrade(req, socket, head, (ws) => chatWss.emit("connection", ws, req));
      return;
    }

    if (pathname === "/wisp/") {
      await getVendorReady();
      req.url = pathname;
      wisp.routeRequest(req, socket, head);
      return;
    }
  } catch (e) {
    console.error("upgrade error", e);
  }
  socket.end();
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`Null Sec OS listening on ${port}`));
}

module.exports = server;
