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

const seedProducts = [
  { id: "p1", name: "Croissant Mentega", price: 35000, category: "Roti", image: "/assets/p-croissant-D5hPY4CY.jpg", stock: 24, description: "Renyah, wangi mentega, dipanggang setiap hari." },
  { id: "p2", name: "Cold Brew 330ml", price: 45000, category: "Minuman", image: "/assets/p-coldbrew-Dmwifmlz.jpg", stock: 18, description: "Cold brew halus dengan ekstraksi 18 jam." },
  { id: "p3", name: "Roti Sourdough", price: 70000, category: "Roti", image: "/assets/p-sourdough-yfwc6Pdw.jpg", stock: 9, description: "Fermentasi 24 jam dengan ragi alami." },
  { id: "p4", name: "Cokelat Hitam 70%", price: 50000, category: "Camilan", image: "/assets/p-chocolate-DbD5nk3D.jpg", stock: 42, description: "Cokelat single-origin dengan 70% kakao." },
  { id: "p5", name: "Pisang Organik", price: 22000, category: "Sayur & Buah", image: "/assets/p-bananas-bAz_1TLB.jpg", stock: 60, description: "Matang, segar, dan siap disantap." },
  { id: "p6", name: "Susu Segar 1L", price: 32000, category: "Kebutuhan Dapur", image: "/assets/p-milk-ui6udx6n.jpg", stock: 3, description: "Susu lokal segar dalam botol kaca." },
  { id: "p7", name: "Muffin Blueberry", price: 38000, category: "Roti", image: "/assets/p-muffin-MqRtP67U.jpg", stock: 14, description: "Muffin lembut dengan blueberry melimpah." },
  { id: "p8", name: "Biji Kopi Sangrai 250g", price: 140000, category: "Kebutuhan Dapur", image: "/assets/p-beans-CDQZ7pJu.jpg", stock: 11, description: "Sangrai medium dengan aroma kakao." },
];
const seedCategories = ["Roti", "Minuman", "Camilan", "Kebutuhan Dapur", "Sayur & Buah"];

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

const publicUser = ({ id, name, email, phone, role }) => ({ id, name, email, phone, role });
const publicCatalog = (db) => ({
  products: db.products ?? [],
  categories: db.categories ?? [],
  storeName: db.storeName ?? "QuickPick POS",
  appIcon: db.appIcon ?? null,
  isStoreOpen: typeof db.isStoreOpen === "boolean" ? db.isStoreOpen : true,
});

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
    const initial = {
      users: [],
      products: [],
      categories: [],
      storeName: "QuickPick POS",
      appIcon: null,
      isStoreOpen: true,
    };
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
  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.categories) || db.categories.length === 0) db.categories = [];
  if (typeof db.storeName !== "string" || !db.storeName) db.storeName = "QuickPick POS";
  if (typeof db.appIcon === "undefined") db.appIcon = null;
  if (typeof db.isStoreOpen !== "boolean") db.isStoreOpen = true;
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

    if (req.method === "GET" && req.url === "/api/catalog") {
      const db = await loadDb();
      return sendJson(res, 200, publicCatalog(db));
    }

    if (req.method === "POST" && req.url === "/api/catalog/bootstrap") {
      const body = await readBody(req);
      const db = await loadDb();
      if ((db.products ?? []).length > 0) {
        return sendJson(res, 200, publicCatalog(db));
      }
      db.products = Array.isArray(body.products) ? body.products : seedProducts;
      db.categories = Array.isArray(body.categories) && body.categories.length ? body.categories : seedCategories;
      db.storeName = typeof body.storeName === "string" && body.storeName.trim() ? body.storeName.trim() : "QuickPick POS";
      db.appIcon = typeof body.appIcon === "string" ? body.appIcon : null;
      db.isStoreOpen = typeof body.isStoreOpen === "boolean" ? body.isStoreOpen : true;
      await saveDb(db);
      return sendJson(res, 201, publicCatalog(db));
    }

    if (req.method === "PUT" && req.url === "/api/catalog") {
      const me = await currentUser(req);
      if (!me || me.role !== "admin") {
        return sendJson(res, 401, { message: "Hanya admin yang dapat mengubah katalog." });
      }
      const body = await readBody(req);
      const db = await loadDb();
      db.products = Array.isArray(body.products) ? body.products : db.products;
      db.categories = Array.isArray(body.categories) ? body.categories : db.categories;
      db.storeName = typeof body.storeName === "string" && body.storeName.trim() ? body.storeName.trim() : db.storeName;
      db.appIcon = typeof body.appIcon === "string" ? body.appIcon : null;
      db.isStoreOpen = typeof body.isStoreOpen === "boolean" ? body.isStoreOpen : db.isStoreOpen;
      await saveDb(db);
      return sendJson(res, 200, publicCatalog(db));
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
