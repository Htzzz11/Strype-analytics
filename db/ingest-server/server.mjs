import "dotenv/config";
import cors from "cors";
import express from "express";
import mysql from "mysql2/promise";

const port = parseInt(process.env.INGEST_PORT || "8787", 10) || 8787;

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306", 10) || 3306,
    user: process.env.MYSQL_USER || "strype",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "strype_analytics",
    waitForConnections: true,
    connectionLimit: 10,
});

function normaliseCountryCode(code) {
    if (code == null || typeof code !== "string") {
        return null;
    }
    const c = code.trim().toUpperCase();
    return /^[A-Z]{2}$/.test(c) ? c : null;
}

function parseRecordTime(iso) {
    if (typeof iso !== "string" || !iso) {
        return new Date();
    }
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? new Date() : d;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "512kb" }));

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.post("/", async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== "object") {
        res.status(400).json({ error: "Expected JSON body" });
        return;
    }

    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
    const reason = body.reason;
    if (!userId || !sessionId || (reason !== "run" && reason !== "save")) {
        res.status(400).json({ error: "Missing or invalid userId, sessionId, or reason" });
        return;
    }

    const countryCode = normaliseCountryCode(body.countryCode);
    const recordTime = parseRecordTime(body.recordedAt);
    const activeMs =
        typeof body.activeSessionTimeMs === "number" && Number.isFinite(body.activeSessionTimeMs)
            ? Math.max(0, Math.floor(body.activeSessionTimeMs))
            : null;

    const eventId = crypto.randomUUID();

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        await conn.execute(
            `INSERT INTO users (user_id, country_code)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE
               country_code = IFNULL(VALUES(country_code), users.country_code)`,
            [userId.slice(0, 36), countryCode],
        );

        await conn.execute(
            `INSERT INTO sessions (session_id, user_id, started_at, active_duration_ms)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               active_duration_ms = VALUES(active_duration_ms)`,
            [sessionId.slice(0, 36), userId.slice(0, 36), recordTime, activeMs],
        );

        await conn.execute(
            `INSERT INTO events (event_id, session_id, user_id, record_time, event_type, payload)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [eventId, sessionId.slice(0, 36), userId.slice(0, 36), recordTime, reason, JSON.stringify(body)],
        );

        await conn.commit();
        res.status(204).end();
    }
    catch (e) {
        if (conn) {
            try {
                await conn.rollback();
            }
            catch {
                // ignore
            }
        }
        console.error("[ingest]", e);
        res.status(500).json({ error: "Database error" });
    }
    finally {
        if (conn) {
            conn.release();
        }
    }
});

const server = app.listen(port, () => {
    console.log(`Strype analytics ingest listening on http://127.0.0.1:${port}/`);
    console.log("POST JSON snapshots here; GET /health for a quick check.");
});

server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Set INGEST_PORT in db/ingest-server/.env to a free port (e.g. 8788), then update VITE_ANALYTICS_INGEST_URL in the project root .env and restart Vite.`);
    }
    else {
        console.error(err);
    }
    process.exit(1);
});
