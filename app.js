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


const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  }
}));

let wisp = null;
let wispReadyPromise = null;

function getWispReady() {
  if (wispReadyPromise) return wispReadyPromise;
  wispReadyPromise = import("@mercuryworkshop/wisp-js/server")
    .then((mod) => {
      wisp = mod.server;
      return wisp;
    })
    .catch((error) => {
      wispReadyPromise = null;
      throw error;
    });
  return wispReadyPromise;
}

app.get("/api/scramjet-status", (req, res) => {
  const fs = require("node:fs");
  const files = {
    controllerApi: path.join(publicDir, "vendor/controller/controller.api.js"),
    controllerSw: path.join(publicDir, "vendor/controller/controller.sw.js"),
    controllerInject: path.join(publicDir, "vendor/controller/controller.inject.js"),
    scramjetJs: path.join(publicDir, "vendor/scramjet/scramjet.js"),
    scramjetWasm: path.join(publicDir, "vendor/scramjet/scramjet.wasm"),
    libcurl: path.join(publicDir, "vendor/libcurl/index.mjs")
  };
  const missing = Object.entries(files).filter(([, file]) => !fs.existsSync(file)).map(([name]) => name);
  res.status(missing.length ? 500 : 200).json({
    ok: missing.length === 0,
    mode: "vendored-static-assets",
    missing,
    urls: {
      controllerApi: "/vendor/controller/controller.api.js",
      controllerSw: "/vendor/controller/controller.sw.js",
      controllerInject: "/vendor/controller/controller.inject.js",
      scramjetJs: "/vendor/scramjet/scramjet.js",
      scramjetWasm: "/vendor/scramjet/scramjet.wasm",
      libcurl: "/vendor/libcurl/index.mjs",
      serviceWorker: "/sw.js",
      wisp: "/wisp/"
    }
  });
});


// Scramjet rewritten navigations must reach the app shell so the root-scoped
// service worker can intercept and route them. Returning JSON 404 here breaks
// controller-managed navigation such as /~/sj/<session>/... .
app.get(/^\/~\/sj\/.*/, (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/vendor/")) {
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
const recentPublic = [];
const MAX_PUBLIC_HISTORY = 50;

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
      send(ws, { type: "history", messages: recentPublic });
      publishPresence();
      broadcast({ type: "system", text: `${name} joined public chat` }, ws);
      return;
    }

    if (!current) return send(ws, { type: "error", message: "Choose a username first" });

    if (msg.type === "public") {
      const text = String(msg.text || "").slice(0, 2000);
      if (!text.trim()) return;
      const packet = { type: "public", from: current, text, at: Date.now() };
      recentPublic.push(packet);
      if (recentPublic.length > MAX_PUBLIC_HISTORY) recentPublic.shift();
      broadcast(packet);
      return;
    }


    if (["voice_offer", "voice_answer", "voice_ice", "voice_hangup"].includes(msg.type)) {
      const to = validName(msg.to);
      const peer = to && users.get(to);
      if (!peer) return send(ws, { type: "error", message: "Voice peer is not online" });

      const packet = {
        type: msg.type,
        from: current,
        to,
        at: Date.now()
      };

      if (msg.type === "voice_offer" || msg.type === "voice_answer") {
        if (!msg.sdp || typeof msg.sdp !== "object") return;
        packet.sdp = msg.sdp;
      } else if (msg.type === "voice_ice") {
        if (!msg.candidate || typeof msg.candidate !== "object") return;
        packet.candidate = msg.candidate;
      }

      send(peer.ws, packet);
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
      await getWispReady();
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
