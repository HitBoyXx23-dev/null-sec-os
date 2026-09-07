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

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir, {
  extensions: ["html"],
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  }
}));

let uvStatic = null;
let epoxyStatic = null;
let baremuxStatic = null;
let wisp = null;

const vendorReady = (async () => {
  const uvMod = await import("@titaniumnetwork-dev/ultraviolet");
  const epoxyMod = await import("@mercuryworkshop/epoxy-transport");
  const baremuxMod = await import("@mercuryworkshop/bare-mux/node");
  const wispMod = await import("wisp-server-node");

  uvStatic = express.static(uvMod.uvPath);
  epoxyStatic = express.static(epoxyMod.epoxyPath);
  baremuxStatic = express.static(baremuxMod.baremuxPath);
  wisp = wispMod.default || wispMod;
})();

app.use("/uv/", async (req, res, next) => {
  try {
    await vendorReady;
    uvStatic(req, res, next);
  } catch (e) {
    next(e);
  }
});

app.use("/epoxy/", async (req, res, next) => {
  try {
    await vendorReady;
    epoxyStatic(req, res, next);
  } catch (e) {
    next(e);
  }
});

app.use("/baremux/", async (req, res, next) => {
  try {
    await vendorReady;
    baremuxStatic(req, res, next);
  } catch (e) {
    next(e);
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uv/") ||
      req.path.startsWith("/epoxy/") || req.path.startsWith("/baremux/")) {
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
    const u = new URL(req.url, "http://null.local");
    if (u.pathname === "/chat/" || u.pathname === "/chat") {
      chatWss.handleUpgrade(req, socket, head, (ws) => chatWss.emit("connection", ws, req));
      return;
    }

    if (u.pathname.endsWith("/wisp/")) {
      await vendorReady;
      if (wisp && typeof wisp.routeRequest === "function") {
        wisp.routeRequest(req, socket, head);
        return;
      }
    }
  } catch (e) {
    console.error("upgrade error", e);
  }
  socket.destroy();
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => console.log(`Null Sec OS listening on ${port}`));
}

module.exports = server;
