import express from "express";
import { randomUUID } from "crypto";
import { CosmosClient } from "@azure/cosmos";
import fs from "fs/promises";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const router = express.Router();

// Resolve paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local JSON path (ensures it points to server/src/data/contacts.json)
const localDataPath = path.resolve(__dirname, "..", "data", "contacts.json");

// Cached Cosmos container
let cosmosContainer = null;

/* ---------- Accept multiple env var naming styles ---------- */
function getCosmosConfig() {
  const endpoint =
    process.env.COSMOS_ENDPOINT ||
    process.env.COSMOS_DB_ENDPOINT ||
    process.env.COSMOS_URI ||
    process.env.COSMOSDB_ENDPOINT ||
    process.env.AZURE_COSMOS_ENDPOINT ||
    process.env.ACCOUNT_ENDPOINT;

  const key =
    process.env.COSMOS_KEY ||
    process.env.COSMOS_DB_KEY ||
    process.env.COSMOS_PRIMARY_KEY ||
    process.env.COSMOS_AUTH_KEY ||
    process.env.ACCOUNT_KEY;

  const database =
    process.env.COSMOS_DATABASE ||
    process.env.COSMOS_DB_DATABASE ||
    process.env.COSMOS_DB_NAME ||
    "ivr-testing-db";

  const container =
    process.env.COSMOS_CONTAINER ||
    process.env.COSMOS_DB_CONTAINER ||
    process.env.COSMOS_CONTAINER_NAME ||
    "contacts";

  return { endpoint, key, database, container };
}

function isCosmosConfigured() {
  const cfg = getCosmosConfig();
  return Boolean(cfg.endpoint && cfg.key);
}

/* ---------- Create CosmosClient, optionally with insecure agent for emulator ---------- */
function createCosmosClient(cfg) {
  const opts = { endpoint: cfg.endpoint, key: cfg.key };

  // Enable per-client TLS bypass when talking to emulator
  let insecure = false;
  try {
    const host = new URL(cfg.endpoint).hostname;
    if (host === "localhost" || host === "127.0.0.1") insecure = true;
  } catch (_) { /* ignore */ }

  if (process.env.COSMOS_INSECURE_TLS === "1") insecure = true;

  if (insecure) {
    opts.agent = new https.Agent({ rejectUnauthorized: false });
    console.warn("[contacts] ⚠️ TLS verification disabled for Cosmos client (emulator).");
  }

  return new CosmosClient(opts);
}

/* ---------- Init Cosmos (lazy, caches container) ---------- */
async function initCosmos() {
  if (cosmosContainer) return cosmosContainer;

  const cfg = getCosmosConfig();
  if (!cfg.endpoint || !cfg.key) {
    throw new Error("Cosmos not configured (missing endpoint/key)");
  }

  const client = createCosmosClient(cfg);

  const { database } = await client.databases.createIfNotExists({ id: cfg.database });
  const { container } = await database.containers.createIfNotExists({
    id: cfg.container,
    partitionKey: { kind: "Hash", paths: ["/id"] },
  });

  cosmosContainer = container;
  console.log(`[contacts] initCosmos connected -> database=${cfg.database} container=${cfg.container}`);
  return cosmosContainer;
}

/* ---------- Local JSON helpers ---------- */
async function ensureLocalFile() {
  try {
    // Check if file exists
    await fs.access(localDataPath);
  } catch {
    // If not, ensure directory exists first
    const dir = path.dirname(localDataPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (mkdirErr) {
      console.error(`[contacts] Failed to create directory ${dir}:`, mkdirErr);
    }
    // Create empty array file
    await fs.writeFile(localDataPath, JSON.stringify([], null, 2), "utf8");
    console.log(`[contacts] Created local storage at: ${localDataPath}`);
  }
}

function normalizeToArray(data) {
  if (!data && data !== 0) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object") {
    if (Array.isArray(data.contacts)) return data.contacts;
    if (Array.isArray(data.items)) return data.items;
    if (data.id || data.phone || data.name) return [data];
    const values = Object.values(data);
    if (Array.isArray(values) && values.every(v => v && (v.id || v.phone || v.name))) return values;
  }
  return [];
}

async function readLocalContacts() {
  await ensureLocalFile();
  try {
    const content = await fs.readFile(localDataPath, "utf8");
    const parsed = JSON.parse(content || "[]");
    return normalizeToArray(parsed);
  } catch (err) {
    console.warn("[contacts] JSON read error, resetting file:", err.message);
    const backupPath = localDataPath + ".corrupt." + Date.now();
    try { await fs.copyFile(localDataPath, backupPath); } catch {}
    await fs.writeFile(localDataPath, JSON.stringify([], null, 2), "utf8");
    return [];
  }
}

async function writeLocalContacts(items) {
  const toWrite = Array.isArray(items) ? items : normalizeToArray(items);
  await ensureLocalFile();
  await fs.writeFile(localDataPath, JSON.stringify(toWrite, null, 2), "utf8");
}

/* ---------- Routes ---------- */

// GET /api/contacts
router.get("/contacts", async (req, res) => {
  const cfg = getCosmosConfig();
  const usingCosmos = isCosmosConfigured();
  console.log(`[contacts] GET -> usingCosmos=${usingCosmos} (endpoint=${!!cfg.endpoint}, db=${cfg.database}, container=${cfg.container})`);
  try {
    if (usingCosmos) {
      try {
        const cont = await initCosmos();
        const q = { query: "SELECT * FROM c" }; // Simplified query
        const { resources: items } = await cont.items.query(q).fetchAll();
        return res.json(items || []);
      } catch (err) {
        console.error("[contacts] Cosmos query failed, falling back to local JSON:", err?.message || err);
        const items = await readLocalContacts();
        return res.json(items);
      }
    } else {
      const items = await readLocalContacts();
      return res.json(items);
    }
  } catch (err) {
    console.error("[contacts] Failed to get contacts:", err?.message || err);
    return res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// POST /api/contacts
router.post("/contacts", async (req, res) => {
  const cfg = getCosmosConfig();
  const usingCosmos = isCosmosConfigured();
  console.log(`[contacts] POST -> usingCosmos=${usingCosmos}`);

  try {
    const { name, phone } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });

    const id = randomUUID();
    const item = { id, name, phone };

    // Try to write to Cosmos
    let createdInCosmos = null;
    let cosmosError = null;
    if (usingCosmos) {
      try {
        const cont = await initCosmos();
        const { resource: created } = await cont.items.create(item, { partitionKey: id });
        createdInCosmos = created;
        console.log("[contacts] Created item in Cosmos:", created.id);
      } catch (err) {
        cosmosError = err?.message || String(err);
        console.error("[contacts] Cosmos create failed:", cosmosError);
      }
    } else {
      console.log("[contacts] Cosmos not configured, will only write local JSON");
    }

    // Always append to local JSON
    let wroteLocal = false;
    try {
      let items = await readLocalContacts();
      if (!Array.isArray(items)) items = [];
      items.push(item);
      await writeLocalContacts(items);
      wroteLocal = true;
      console.log("[contacts] Appended item to local JSON:", item.id);
    } catch (localErr) {
      console.error("[contacts] Failed to write to local JSON:", localErr?.message || localErr);
    }

    const response = {
      id: item.id,
      name: item.name,
      phone: item.phone,
      savedToCosmos: !!createdInCosmos,
      savedToLocal: !!wroteLocal,
      cosmosError: cosmosError || null
    };

    if (!response.savedToCosmos && !response.savedToLocal) {
      return res.status(500).json({ error: "Failed to save contact" });
    }
    return res.status(201).json(response);
  } catch (err) {
    console.error("[contacts] Failed to create contact:", err?.message || err);
    return res.status(500).json({ error: "Failed to create contact" });
  }
});

// DELETE /api/contacts/:id
router.delete("/contacts/:id", async (req, res) => {
  const usingCosmos = isCosmosConfigured();
  const contactId = req.params.id;
  console.log(`[contacts] DELETE -> usingCosmos=${usingCosmos} id=${contactId}`);

  try {
    if (!contactId) return res.status(400).json({ error: "id is required" });

    // Delete from Cosmos if configured
    if (usingCosmos) {
      try {
        const cont = await initCosmos();
        await cont.item(contactId, contactId).delete();
        console.log("[contacts] Deleted from Cosmos:", contactId);
      } catch (err) {
        console.error("[contacts] Cosmos delete failed (might not exist):", err?.message);
      }
    }

    // Delete from local JSON
    try {
      let items = await readLocalContacts();
      if (!Array.isArray(items)) items = [];
      const idx = items.findIndex((c) => c.id === contactId);
      if (idx !== -1) {
        items.splice(idx, 1);
        await writeLocalContacts(items);
        console.log("[contacts] Deleted from local JSON:", contactId);
      }
    } catch (localErr) {
      console.error("[contacts] Failed to delete from local JSON:", localErr?.message || localErr);
    }

    return res.status(204).send();
  } catch (err) {
    console.error("[contacts] Failed to delete contact:", err?.message || err);
    return res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;