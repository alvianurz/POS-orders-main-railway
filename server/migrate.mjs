/**
 * Toko Ar-Rahmah POS - Migration Script
 * Migrates data from JSON file (.data/auth.json) to PostgreSQL
 *
 * Usage: node server/migrate.mjs
 *
 * Prerequisites:
 * 1. Set DATABASE_URL environment variable
 */

import pg from "pg";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { URL } from "node:url";

const { Pool } = pg;

// Configuration
let databaseUrl = process.env.DATABASE_URL;
const rootDir = process.cwd();
const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || join(rootDir, ".data");
const dbPath = join(dataDir, "auth.json");

// Default values
const DEFAULT_STORE_NAME = "Toko Ar-Rahmah";
const DEFAULT_APP_ICON = "/brand/logo.png";

// Colors for console output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

// Add sslmode=require if not present and using Railway proxy
if (databaseUrl && databaseUrl.includes(".proxy.rlwy.net") && !databaseUrl.includes("sslmode")) {
  const parsed = new URL(databaseUrl);
  parsed.searchParams.set("sslmode", "require");
  parsed.searchParams.set("uselibpqcompat", "true");
  databaseUrl = parsed.toString();
}

// Configure PostgreSQL connection with SSL support
const isRailwayProxy = databaseUrl?.includes(".proxy.rlwy.net");
const poolConfig = {
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isRailwayProxy ? { rejectUnauthorized: false } : undefined,
};

async function loadJsonData() {
  console.log(cyan("\n📁 Loading JSON data..."));

  if (!existsSync(dbPath)) {
    console.error(red(`❌ JSON file not found: ${dbPath}`));
    console.error(red("   Make sure you're running this from the project root directory."));
    process.exit(1);
  }

  const content = await readFile(dbPath, "utf8");
  const data = JSON.parse(content);

  console.log(green(`   ✅ Loaded data from ${dbPath}`));
  console.log(`   - Users: ${data.users?.length || 0}`);
  console.log(`   - Products: ${data.products?.length || 0}`);
  console.log(`   - Categories: ${data.categories?.length || 0}`);
  console.log(`   - Orders: ${data.orders?.length || 0}`);

  return data;
}

async function createTables(pool) {
  console.log(cyan("\n🗄️  Creating tables..."));

  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NOT NULL DEFAULT '',
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'customer')),
      password_hash VARCHAR(512) NOT NULL,
      created_at BIGINT NOT NULL
    );

    -- App state table (stores catalog, orders as JSONB)
    CREATE TABLE IF NOT EXISTS app_state (
      key VARCHAR(64) PRIMARY KEY,
      value JSONB NOT NULL
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `;

  try {
    await pool.query(schema);
    console.log(green("   ✅ Tables created successfully"));
  } catch (error) {
    console.error(red(`   ❌ Failed to create tables: ${error.message}`));
    throw error;
  }
}

async function migrateData(pool, data) {
  console.log(cyan("\n📦 Migrating data to PostgreSQL..."));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Migrate users
    console.log(cyan("   👥 Migrating users..."));
    for (const user of (data.users || [])) {
      await client.query(
        `INSERT INTO users (id, name, email, phone, role, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash`,
        [user.id, user.name, user.email, user.phone || "", user.role || "customer", user.passwordHash, user.createdAt || Date.now()]
      );
    }
    console.log(green(`   ✅ ${(data.users || []).length} user(s) migrated`));

    // Prepare catalog data
    const catalog = {
      products: data.products || [],
      categories: data.categories || [],
      storeName: data.storeName || DEFAULT_STORE_NAME,
      appIcon: data.appIcon || DEFAULT_APP_ICON,
      isStoreOpen: data.isStoreOpen !== undefined ? data.isStoreOpen : true,
      orders: data.orders || [],
    };

    // Migrate catalog (stored as JSONB)
    console.log(cyan("   📦 Migrating catalog..."));
    await client.query(
      `INSERT INTO app_state (key, value)
       VALUES ('catalog', $1::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(catalog)]
    );
    console.log(green("   ✅ Catalog migrated (products, categories, orders, settings)"));

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function verifyMigration(pool) {
  console.log(cyan("\n🔍 Verifying migration..."));

  try {
    const usersCount = await pool.query("SELECT COUNT(*) FROM users");
    const stateResult = await pool.query("SELECT value FROM app_state WHERE key = 'catalog'");
    const catalog = stateResult.rows[0]?.value || {};

    console.log(green("\n📊 Migration Summary:"));
    console.log(`   Users: ${usersCount.rows[0].count}`);
    console.log(`   Products: ${catalog.products?.length || 0}`);
    console.log(`   Categories: ${catalog.categories?.length || 0}`);
    console.log(`   Orders: ${catalog.orders?.length || 0}`);
    console.log(`   Store: ${catalog.storeName || "N/A"}`);
  } catch (error) {
    console.error(red(`   ❌ Verification failed: ${error.message}`));
  }
}

async function main() {
  console.log("\n" + "=".repeat(50));
  console.log(cyan("🚀 Toko Ar-Rahmah - PostgreSQL Migration Tool"));
  console.log("=".repeat(50));

  // Check for DATABASE_URL
  if (!databaseUrl) {
    console.error(red("\n❌ DATABASE_URL environment variable is not set!"));
    console.error(red("   Set it with: export DATABASE_URL='postgresql://...'"));
    process.exit(1);
  }

  console.log(cyan("\n📡 Connecting to PostgreSQL..."));
  console.log(`   Database: ${databaseUrl.replace(/:[^:@]+@/, ":****@")}`);

  let pool;

  try {
    pool = new Pool(poolConfig);

    // Test connection
    const client = await pool.connect();
    console.log(green("   ✅ Connected to PostgreSQL"));
    client.release();

    // Load existing JSON data
    const jsonData = await loadJsonData();

    // Create tables
    await createTables(pool);

    // Migrate data
    await migrateData(pool, jsonData);

    // Verify
    await verifyMigration(pool);

    console.log("\n" + "=".repeat(50));
    console.log(green("✅ Migration completed successfully!"));
    console.log("=".repeat(50));
    console.log("\nNext steps:");
    console.log("1. Commit and push changes: git add -A && git commit && git push");
    console.log("2. Railway will auto-deploy the updated auth-server.mjs");

  } catch (error) {
    console.error(red("\n❌ Migration failed!"));
    console.error(red(`   Error: ${error.message}`));
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

main();