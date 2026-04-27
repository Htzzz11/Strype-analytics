# Strype Analytics — Local MySQL via Docker

This folder spins up a local MySQL 8.0 instance for development and testing of the analytics pipeline. It uses [Docker Compose](https://docs.docker.com/compose/) so the setup is identical on macOS, Windows, and Linux.

Each developer runs their own isolated DB on `localhost`. We don't share data between developers — only the schema (which lives in `init/001_schema.sql` and is checked into git).

---

## 1. Install Docker Desktop

### macOS
1. Download from <https://www.docker.com/products/docker-desktop/>.
2. Pick the build matching your chip:
   - **Apple Silicon** (M1/M2/M3/M4) — "Mac with Apple chip"
   - **Intel Mac** — "Mac with Intel chip"
   - To check: Apple menu → About This Mac.
3. Open the `.dmg`, drag Docker into Applications, launch Docker Desktop.
4. Accept the terms, skip the sign-in (not required), and wait until the whale icon in the menu bar shows "Docker Desktop is running".

### Windows
1. Download from <https://www.docker.com/products/docker-desktop/>.
2. Run the installer. When asked, leave "Use WSL 2 instead of Hyper-V" **ticked** (this is the default and recommended).
3. Reboot if prompted.
4. Launch Docker Desktop from the Start menu. Wait for the whale icon in the system tray to turn solid (not animated) — that means it's running.
5. If WSL 2 isn't installed, Docker Desktop will prompt you and link to the [WSL install instructions](https://learn.microsoft.com/en-us/windows/wsl/install). Run `wsl --install` in PowerShell as admin if you need to.

### Verify Docker is working (both OS)
Open a terminal:
- **macOS:** Terminal app, or iTerm2.
- **Windows:** PowerShell (built-in) or Windows Terminal.

Run:
```
docker --version
docker compose version
```
Both should print a version. If you get "command not found", Docker Desktop isn't running — open the app first.

---

## 2. One-time setup

Clone the repo if you haven't, then move into this `db/` folder:

```
cd Strype-analytics/db
```

Copy the env template to a real `.env` file:

**macOS / Linux:**
```
cp .env.example .env
```

**Windows (PowerShell):**
```
Copy-Item .env.example .env
```

You can leave the default passwords for local dev — `.env` is gitignored, and the DB is only reachable from your machine.

---

## 3. Start MySQL

From inside the `db/` folder:

```
docker compose up -d
```

What this does:
- Downloads the `mysql:8.0` image (~500 MB, first time only).
- Creates a container named `strype-analytics-mysql`.
- Creates the `strype_analytics` database, the `strype` user, and runs `init/001_schema.sql` to create the four tables.
- Persists data in a Docker-managed volume (`mysql-data`), so restarts don't lose anything.
- Maps container port 3306 to your machine's port 3306.

First startup takes ~30 seconds. Check it's healthy:

```
docker compose ps
```

You should see `strype-analytics-mysql` with status `Up (healthy)`. If it says `Up (health: starting)`, wait another 15 seconds and re-run.

### Port 3306 already in use?

If you have MySQL installed natively, port 3306 may be busy. Edit `db/.env` and change `MYSQL_HOST_PORT` to something free (e.g. `3307`), then re-run `docker compose up -d`.

---

## 4. Connect with a GUI client

Recommended: [DBeaver Community](https://dbeaver.io/download/) (free, cross-platform).

New connection → MySQL, with these values:

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `3306` (or whatever you set in `.env`) |
| Database | `strype_analytics` |
| Username | `strype` |
| Password | `strypepass` (whatever you set in `.env`) |

If DBeaver complains about a missing MySQL driver, click "Download" when prompted.

You should see four tables: `countries`, `users`, `sessions`, `events`.

### Quick sanity-check from the command line (optional)

```
docker exec -it strype-analytics-mysql mysql -ustrype -pstrypepass strype_analytics -e "SHOW TABLES;"
```

---

## 5. Day-to-day commands

All commands run from inside the `db/` folder.

| Action | Command |
|---|---|
| Start MySQL (in background) | `docker compose up -d` |
| Stop MySQL (keeps data) | `docker compose stop` |
| Stop and remove container (keeps data) | `docker compose down` |
| **Wipe everything** (delete all data, force schema re-init on next start) | `docker compose down -v` |
| Tail container logs | `docker compose logs -f mysql` |
| Open a MySQL shell inside the container | `docker exec -it strype-analytics-mysql mysql -ustrype -pstrypepass strype_analytics` |

---

## 6. When the schema changes

The `init/` SQL files **only run on first startup** (when the data volume is empty). If someone updates `001_schema.sql` or adds a new file, you need to wipe and recreate:

```
docker compose down -v
docker compose up -d
```

Note: this **deletes all your local test data**. That's expected during early development — when the schema stabilises, we'll switch to a proper migrations tool (Knex/Prisma/Flyway, TBD).


