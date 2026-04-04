/**
 * Extended integration tests for:
 * - Categories (CRUD + RBAC)
 * - Reports (summary, top-categories, daily, year-over-year, cash-flow)
 * - Audit logs (list, getOne)
 * - Utils (pagination, responseFormatter)
 *
 * Uses in-memory MongoDB — no external deps needed.
 * Usage: node src/scripts/runExtendedTests.js
 */
const { spawn } = require("child_process");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

const PLATFORM_ROOT = path.join(__dirname, "..", "..");
const PORT = process.env.TEST_PORT || "4011";
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  } else {
    passed++;
    console.log(`  ✓ ${msg}`);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { res, body };
}

async function waitForHealth() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const { res } = await fetchJson(`${BASE}/health`);
      if (res.ok) return;
    } catch { /* ignore */ }
    await sleep(300);
  }
  throw new Error("Server did not become healthy in time");
}

async function main() {
  console.log("\n=== Extended Integration Tests ===\n");
  console.log("Starting MongoDB Memory Server...");
  const mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: PLATFORM_ROOT,
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      PORT,
      JWT_SECRET: "extended-test-secret-min-32-chars-long!!",
      NODE_ENV: "test",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.on("data", (d) => { stderr += d.toString(); });
  child.on("error", (err) => console.error("Spawn error:", err));

  try {
    await waitForHealth();
    console.log("Server ready. Running tests...\n");

    const suffix = Date.now();
    const adminEmail = `admin_${suffix}@test.local`;
    const analystEmail = `analyst_${suffix}@test.local`;
    const viewerEmail = `viewer_${suffix}@test.local`;
    const pw = "pass12345";

    // ── Setup: register users ──────────────────────────────────────────────
    console.log("[ Setup ]");
    let r;

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name: "Admin", email: adminEmail, password: pw, role: "admin" }),
    });
    assert(r.res.status === 201, "register admin");
    const adminToken = (await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST", body: JSON.stringify({ email: adminEmail, password: pw }),
    })).body.token;

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name: "Analyst", email: analystEmail, password: pw, role: "analyst" }),
    });
    assert(r.res.status === 201, "register analyst");
    const analystToken = (await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST", body: JSON.stringify({ email: analystEmail, password: pw }),
    })).body.token;

    r = await fetchJson(`${BASE}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ name: "Viewer", email: viewerEmail, password: pw, role: "viewer" }),
    });
    assert(r.res.status === 201, "register viewer");
    const viewerToken = (await fetchJson(`${BASE}/api/auth/login`, {
      method: "POST", body: JSON.stringify({ email: viewerEmail, password: pw }),
    })).body.token;

    // ── Categories ─────────────────────────────────────────────────────────
    console.log("\n[ Categories ]");

    // Admin can create
    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Salary", type: "income", description: "Monthly salary", color: "#22c55e" }),
    });
    assert(r.res.status === 201 && r.body.category?.id, "admin create category");
    const catId = r.body.category.id;

    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Rent", type: "expense", color: "#ef4444" }),
    });
    assert(r.res.status === 201, "admin create second category");

    // Duplicate name rejected
    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "Salary", type: "income" }),
    });
    assert(r.res.status === 409, "duplicate category name rejected");

    // Viewer cannot create
    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: JSON.stringify({ name: "Freelance", type: "income" }),
    });
    assert(r.res.status === 403, "viewer cannot create category");

    // Analyst cannot create
    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${analystToken}` },
      body: JSON.stringify({ name: "Freelance", type: "income" }),
    });
    assert(r.res.status === 403, "analyst cannot create category");

    // All roles can list
    r = await fetchJson(`${BASE}/api/categories`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && r.body.rows?.length >= 2, "viewer can list categories");

    r = await fetchJson(`${BASE}/api/categories`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200, "analyst can list categories");

    // Get one
    r = await fetchJson(`${BASE}/api/categories/${catId}`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 200 && r.body.category?.name === "Salary", "get category by id");

    // Invalid id
    r = await fetchJson(`${BASE}/api/categories/notanid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 422, "invalid category id returns 422");

    // Update
    r = await fetchJson(`${BASE}/api/categories/${catId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ description: "Updated description", color: "#16a34a" }),
    });
    assert(r.res.status === 200 && r.body.category?.description === "Updated description", "admin update category");

    // Viewer cannot update
    r = await fetchJson(`${BASE}/api/categories/${catId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${viewerToken}` },
      body: JSON.stringify({ description: "hack" }),
    });
    assert(r.res.status === 403, "viewer cannot update category");

    // Invalid hex color
    r = await fetchJson(`${BASE}/api/categories`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ name: "BadColor", color: "notacolor" }),
    });
    assert(r.res.status === 422, "invalid hex color rejected");

    // Filter by type
    r = await fetchJson(`${BASE}/api/categories?type=income`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200, "filter categories by type");

    // ── Seed financial records for report tests ────────────────────────────
    console.log("\n[ Seeding Records for Reports ]");
    const now = new Date();
    const recordPayloads = [
      { amount: 5000, type: "income", category: "Salary", date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), notes: "Jan salary" },
      { amount: 1200, type: "expense", category: "Rent", date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(), notes: "Rent" },
      { amount: 300, type: "expense", category: "Rent", date: new Date(now.getFullYear(), now.getMonth(), 3).toISOString(), notes: "Utilities" },
      { amount: 4500, type: "income", category: "Salary", date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), notes: "Prev month" },
      { amount: 800, type: "expense", category: "Rent", date: new Date(now.getFullYear(), now.getMonth() - 1, 5).toISOString(), notes: "Groceries" },
    ];

    for (const payload of recordPayloads) {
      r = await fetchJson(`${BASE}/api/records`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(payload),
      });
      assert(r.res.status === 201, `seed record: ${payload.notes}`);
    }

    // ── Reports ────────────────────────────────────────────────────────────
    console.log("\n[ Reports ]");

    // Summary report
    r = await fetchJson(`${BASE}/api/reports/summary`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && r.body.report?.total_income > 0, "analyst: summary report");
    assert(typeof r.body.report?.savings_rate === "number", "summary has savings_rate");
    assert(typeof r.body.report?.avg_income === "number", "summary has avg_income");

    // Summary with date range
    r = await fetchJson(`${BASE}/api/reports/summary?startDate=${new Date(now.getFullYear(), now.getMonth(), 1).toISOString()}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200, "summary report with date range");

    // Viewer cannot access reports
    r = await fetchJson(`${BASE}/api/reports/summary`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 403, "viewer cannot access reports");

    // Top categories
    r = await fetchJson(`${BASE}/api/reports/top-categories?months=3&limit=5`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.categories), "top categories report");

    // Top categories by type
    r = await fetchJson(`${BASE}/api/reports/top-categories?type=expense`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && r.body.categories?.every((c) => c.category), "top expense categories");

    // Daily breakdown
    r = await fetchJson(`${BASE}/api/reports/daily?days=30`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.breakdown), "daily breakdown report");
    assert(r.body.breakdown?.every((d) => "net" in d), "daily breakdown has net field");

    // Year over year
    r = await fetchJson(`${BASE}/api/reports/year-over-year`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.comparison), "year-over-year report");

    // Cash flow
    r = await fetchJson(`${BASE}/api/reports/cash-flow?months=6`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.cash_flow), "cash flow report");
    assert(r.body.cash_flow?.every((m) => "running_balance" in m), "cash flow has running_balance");

    // Invalid months param — validator rejects non-integer with 422
    r = await fetchJson(`${BASE}/api/reports/cash-flow?months=abc`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 422, "non-numeric months param returns 422 validation error");

    // ── Audit Logs ─────────────────────────────────────────────────────────
    console.log("\n[ Audit Logs ]");

    // Admin can list audit logs
    r = await fetchJson(`${BASE}/api/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && Array.isArray(r.body.rows), "admin can list audit logs");
    assert(r.body.rows?.length > 0, "audit logs have entries");
    assert(typeof r.body.total === "number", "audit logs have total count");

    const firstLogId = r.body.rows[0]?.id;

    // Get single audit log
    r = await fetchJson(`${BASE}/api/audit/${firstLogId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.log, "admin get single audit log");

    // Filter by action
    r = await fetchJson(`${BASE}/api/audit?action=USER_REGISTERED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200, "filter audit logs by action");

    // Filter by targetType
    r = await fetchJson(`${BASE}/api/audit?targetType=FinancialRecord`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.rows?.every((l) => l.target_type === "FinancialRecord"), "filter audit by targetType");

    // Filter by status
    r = await fetchJson(`${BASE}/api/audit?status=success`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200, "filter audit logs by status");

    // Analyst cannot access audit logs
    r = await fetchJson(`${BASE}/api/audit`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(r.res.status === 403, "analyst cannot access audit logs");

    // Viewer cannot access audit logs
    r = await fetchJson(`${BASE}/api/audit`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 403, "viewer cannot access audit logs");

    // Invalid audit log id
    r = await fetchJson(`${BASE}/api/audit/notanid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 422, "invalid audit log id returns 422");

    // Pagination on audit logs
    r = await fetchJson(`${BASE}/api/audit?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.rows?.length <= 2, "audit log pagination works");
    assert("hasNextPage" in r.body, "audit response has hasNextPage");

    // ── Category delete ────────────────────────────────────────────────────
    console.log("\n[ Category Delete ]");

    r = await fetchJson(`${BASE}/api/categories/${catId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(r.res.status === 200 && r.body.category?.id === catId, "admin delete category");

    // Deleted category returns 404
    r = await fetchJson(`${BASE}/api/categories/${catId}`, {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(r.res.status === 404, "deleted category returns 404");

    // ── Summary ────────────────────────────────────────────────────────────
    console.log(`\n${"─".repeat(40)}`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      console.error(`\n${failed} test(s) failed.`);
      process.exitCode = 1;
    } else {
      console.log("\nAll extended tests passed.");
    }
  } finally {
    child.kill();
    await sleep(500);
    await mongod.stop().catch(() => {});
    if (stderr.trim()) {
      const filtered = stderr.split("\n").filter((l) => !l.includes("[MONGOOSE]") && l.trim());
      if (filtered.length) console.error("Server stderr:\n", filtered.join("\n"));
    }
  }
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
