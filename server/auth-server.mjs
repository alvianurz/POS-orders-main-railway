import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes, pbkdf2Sync, timingSafeEqual } from "node:crypto";

const port = Number(process.env.PORT || 8787);
const rootDir = process.cwd();
const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || join(rootDir, ".data");
const dbPath = join(dataDir, "auth.json");
const distDir = join(rootDir, "dist");
const sessions = new Map();

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

const publicUser = ({ id, name, email, phone, role }) => ({ id, name, email, phone, role });

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$210000$${salt}$${hash}`;
};

const verifyPassword = (password, stored) => {
  const [scheme, iterations, salt, hash] = String(stored || "").split("$");
  if (scheme !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;
  const attempt = pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");
  const expected = Buffer.from(hash, "hex");
  return expected.length === attempt.length && timingSafeEqual(expected, attempt);
};

const loadDb = async () => {
  await mkdir(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    const initial = { users: [] };
    const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword) {
      initial.users.push({
        id: `u_${randomBytes(8).toString("hex")}`,
        name: "Admin",
        email: adminEmail,
        phone: "",
        role: "admin",
        passwordHash: hashPassword(adminPassword),
        createdAt: Date.now(),
      });
    }
    await writeFile(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const db = JSON.parse(await readFile(dbPath, "utf8"));
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && !db.users.some((user) => user.email === adminEmail)) {
    db.users.push({
      id: `u_${randomBytes(8).toString("hex")}`,
      name: "Admin",
      email: adminEmail,
      phone: "",
      role: "admin",
      passwordHash: hashPassword(adminPassword),
      createdAt: Date.now(),
    });
    await saveDb(db);
  }
  return db;
};

const saveDb = async (db) => {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2));
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const sendJson = (res, status, payload, extraHeaders = {}) => {
  res.writeHead(status, { ...jsonHeaders, ...extraHeaders });
  res.end(JSON.stringify(payload));
};

const getCookie = (req, name) => {
  const cookie = req.headers.cookie || "";
  const found = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
};

const sessionCookie = (sid, maxAge = 60 * 60 * 24 * 7) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `qp_session=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
};

const currentUser = async (req) => {
  const sid = getCookie(req, "qp_session");
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sid);
    return null;
  }
  const db = await loadDb();
  const user = db.users.find((item) => item.id === session.userId);
  return user ? publicUser(user) : null;
};

const createSession = (userId) => {
  const sid = randomBytes(32).toString("hex");
  sessions.set(sid, { userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  return sid;
};

const handleApi = async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end("ok");
    }

    if (req.method === "GET" && req.url === "/api/auth/session") {
      const user = await currentUser(req);
      return sendJson(res, 200, { user });
    }

    if (req.method === "POST" && req.url === "/api/auth/register") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const phone = String(body.phone || "").trim();
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");

      if (!name || !phone || !email || password.length < 8) {
        return sendJson(res, 400, { message: "Lengkapi data dan gunakan kata sandi minimal 8 karakter." });
      }

      const db = await loadDb();
      if (db.users.some((user) => user.email === email)) {
        return sendJson(res, 409, { message: "Email sudah terdaftar." });
      }

      const user = {
        id: `u_${randomBytes(8).toString("hex")}`,
        name,
        email,
        phone,
        role: "customer",
        passwordHash: hashPassword(password),
        createdAt: Date.now(),
      };
      db.users.push(user);
      await saveDb(db);
      const sid = createSession(user.id);
      return sendJson(res, 201, { user: publicUser(user) }, { "set-cookie": sessionCookie(sid) });
    }

    if (req.method === "POST" && req.url === "/api/auth/signin") {
      const body = await readBody(req);
      const email = normalizeEmail(body.email);
      const password = String(body.password || "");
      const db = await loadDb();
      const user = db.users.find((item) => item.email === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return sendJson(res, 401, { message: "Email atau kata sandi salah." });
      }
      const sid = createSession(user.id);
      return sendJson(res, 200, { user: publicUser(user) }, { "set-cookie": sessionCookie(sid) });
    }

    if (req.method === "POST" && req.url === "/api/auth/signout") {
      const sid = getCookie(req, "qp_session");
      if (sid) sessions.delete(sid);
      return sendJson(res, 200, { ok: true }, { "set-cookie": sessionCookie("", 0) });
    }

    return sendJson(res, 404, { message: "Endpoint tidak ditemukan." });
  } catch (error) {
    return sendJson(res, 500, { message: "Server auth bermasalah." });
  }
};

const contentType = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const serveStatic = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(distDir, requested);
  const safePath = filePath.startsWith(distDir) ? filePath : join(distDir, "index.html");
  const finalPath = existsSync(safePath) ? safePath : join(distDir, "index.html");
  try {
    const file = await readFile(finalPath);
    res.writeHead(200, { "content-type": contentType[extname(finalPath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Build belum tersedia. Jalankan npm run build terlebih dahulu.");
  }
};

createServer((req, res) => {
  if (req.url === "/health") return handleApi(req, res);
  if (req.url?.startsWith("/api/")) return handleApi(req, res);
  return serveStatic(req, res);
}).listen(port, () => {
  console.log(`QuickPick server berjalan di http://localhost:${port}`);
});
