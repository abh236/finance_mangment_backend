/**
 * Full API smoke / integration tests (no Jest).
 * Spawns in-memory MongoDB + server on a free port, runs requests, exits 0 or 1.
 *
 * Usage (from finance-dashboard-platform): node src/scripts/runApiTests.js
 */
const { spawn } = require("child_process");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const PLATFORM_ROOT = path.join(__dirname, "..", "..");
const PORT = process.env.TEST_PORT || "4010";
const BASE = `http://127.0.0.1:${PORT}`;

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  let body;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

async function waitForHealth() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const { res } = await fetchJson(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* ignore */
    }
    await sleep(200);
  }
  throw new Error("Server did not become healthy in time");
}

async function main() {
  console.log("Starting MongoDB Memory Server...");
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: PLATFORM_ROOT,
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      PORT,
      JWT_SECRET: "smoke-test-jwt-secret-min-32-chars-long",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  child.on("error", (err) => {
    console.error("Failed to spawn server:", err);
  });

  try {
    await waitForHealth();
    console.log("Server up, running tests...\n");

    const suffix = Date.now();
    const adminEmail = `admin_${suffix}@test.local`;
    const viewerEmail = `viewer_${suffix}@test.local`;
    const analystEmail = `analyst_${suffix}@test.local`;
    const password = "pass12345";

    let r = await fetchJson(`${BASE}/health`);
    assert(r.res.status === 200 && r.body.ok === true, "health");

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({
        name: "Admin User",
        email: adminEmail,
        password,
        role: "admin",
      }),
    });
    assert(r.res.status === 201, `register admin: ${r.res.status} ${JSON.stringify(r.body)}`);

    r = await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: adminEmail, password }),
    });
    assert(r.res.status === 200 && r.body.token, "login admin");
    const adminToken = r.body.token;

    r = await fetchJson(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.user?.role === "admin", "me admin");

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({
        name: "Viewer",
        email: viewerEmail,
        password,
        role: "viewer",
      }),
    });
    assert(r.res.status === 201, "register viewer");

    r = await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: viewerEmail, password }),
    });
    assert(r.res.status === 200 && r.body.token, "login viewer");
    const viewerToken = r.body.token;

    r = await fetchJson(`${BASE}/api/dashboard/summary`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && r.body.success === true, "viewer dashboard summary");

    r = await fetchJson(`${BASE}/api/records`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 403, "viewer must not list records");

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({
        name: "Analyst",
        email: analystEmail,
        password,
        role: "analyst",
      }),
    });
    assert(r.res.status === 201, "register analyst");

    r = await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: analystEmail, password }),
    });
    const analystToken = r.body.token;

    r = await fetchJson(`${BASE}/api/records`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.rows), "analyst list records");

    const isoDate = new Date().toISOString();
    r = await fetchJson(`${BASE}/api/records`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        amount: 100.5,
        type: "income",
        category: "TestCat",
        date: isoDate,
        notes: "smoke test",
      }),
    });
    assert(r.res.status === 201 && r.body.record?.id, "admin create record");
    const recordId = r.body.record.id;

    r = await fetchJson(`${BASE}/api/records/${recordId}`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && r.body.record?.id === recordId, "analyst get one record");

    r = await fetchJson(`${BASE}/api/dashboard/categories`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && r.body.success === true, "categories");

    r = await fetchJson(`${BASE}/api/dashboard/trends/monthly?months=3`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.trends), "monthly trends");

    r = await fetchJson(`${BASE}/api/dashboard/trends/weekly`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.trends), "weekly trends");

    r = await fetchJson(`${BASE}/api/dashboard/activity?limit=5`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.activity), "activity");

    r = await fetchJson(`${BASE}/api/records/${recordId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ notes: "updated note" }),
    });
    assert(r.res.status === 200 && r.body.record?.notes === "updated note", "patch record");

    r = await fetchJson(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.rows?.length >= 3, "admin list users");

    r = await fetchJson(`${BASE}/api/users/${r.body.rows[0].id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.user?.id, "admin get user");

    r = await fetchJson(`${BASE}/api/records/${recordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200, "soft delete record");

    r = await fetchJson(`${BASE}/api/records/${recordId}`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 404, "deleted record not visible");

    r = await fetchJson(`${BASE}/api/records`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && r.body.rows.every((row) => row.id !== recordId), "list excludes deleted");

    console.log("All tests passed.");
  } finally {
    child.kill();
    await sleep(500);
    await mongod.stop().catch(() => {});
    if (stderr.trim()) console.error("Server stderr:\n", stderr);
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
