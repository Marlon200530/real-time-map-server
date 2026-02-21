const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

function parseAllowedOrigins(raw) {
  return String(raw || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getNormalizedOrigin(origin) {
  try {
    return new URL(origin).origin;
  } catch {
    return origin;
  }
}

function isOriginAllowed(origin, rules) {
  if (!origin) return true; // health checks / curl / server-to-server
  if (rules.length === 0) return true; // default open for easier first deploy

  const normalized = getNormalizedOrigin(origin);
  return rules.some((rule) => {
    if (rule === "*") return true;

    // Supports wildcard host rules like https://*.vercel.app
    if (rule.includes("*")) {
      const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`).test(normalized);
    }

    return normalized === getNormalizedOrigin(rule);
  });
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket.io",
  cors: corsOptions,
});

const users = new Map(); // socketId -> { lat, lng, updatedAt }

function snapshot() {
  return Array.from(users.entries()).map(([id, u]) => ({
    id,
    lat: u.lat,
    lng: u.lng,
    updatedAt: u.updatedAt,
  }));
}

function broadcast() {
  io.emit("users:update", snapshot());
}

// Anti-ghost: remove users que não atualizam há 2 minutos
setInterval(() => {
  const now = Date.now();
  let changed = false;

  for (const [id, u] of users.entries()) {
    if (now - u.updatedAt > 120_000) {
      users.delete(id);
      changed = true;
    }
  }

  if (changed) broadcast();
}, 30_000);

io.on("connection", (socket) => {
  socket.emit("users:update", snapshot());

  socket.on("location:update", ({ lat, lng }) => {
    if (typeof lat !== "number" || typeof lng !== "number") return;

    users.set(socket.id, { lat, lng, updatedAt: Date.now() });
    broadcast();
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    broadcast();
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(
    `CORS_ORIGIN=${allowedOrigins.length ? allowedOrigins.join(",") : "(allow all)"}`
  );
});
