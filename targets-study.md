# Multi-Target Architecture & Packaging Study

## 1. Executive Summary

This study evaluates the feasibility, architecture, and packaging strategy for expanding **Larder** from a standalone web server into multi-platform targets:
- **Desktop**: macOS (`.dmg` / `.app`) & Windows (`.exe` / `.msi`) via **Electron**
- **Mobile**: Android (`.apk`) via **Capacitor + Embedded Node.js**

### Core Objective
Package both the **React 19 frontend** and the **Express + Drizzle backend** directly inside the client binaries, allowing the app to run as a thick standalone client that communicates directly over TLS with a hosted PostgreSQL database and hosted S3/R2 blob storage, **without splitting codebases or rewriting application logic**.

### Feasibility: **100% Doable with Zero Logic Splits**

---

## 2. Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                STANDALONE APP BUNDLE (Desktop or Android)                   │
 │                                                                             │
 │   ┌──────────────────────┐                     ┌────────────────────────┐   │
 │   │  React 19 Frontend   │   HTTP on Loopback  │  Express + Drizzle     │   │
 │   │  (Vite SPA in        │ ──────────────────> │  Backend               │   │
 │   │   WebView / Renderer)│  127.0.0.1:<PORT>   │  (Embedded Node.js)    │   │
 │   └──────────────────────┘                     └───────────┬────────────┘   │
 └────────────────────────────────────────────────────────────┼────────────────┘
                                                              │
                                      Direct TLS over Web     │
                                                              ▼
                                               ┌───────────────────────────┐
                                               │ Hosted PostgreSQL (Neon)  │
                                               │ Hosted S3 / R2 Bucket     │
                                               └───────────────────────────┘
```

---

## 3. Platform Breakdown

### A. Windows & macOS (Electron)

Electron natively bundles a full Node.js runtime inside its main process.

1. **Lifecycle**:
   - On application startup, the Electron Main process boots the bundled Express backend (`dist-server/index.js`) on a local loopback port (e.g. `http://127.0.0.1:3001`).
   - The backend runs `migrateDb()` on startup and establishes the connection pool to PostgreSQL via Node's `pg` driver and the AWS S3 SDK.
   - Electron opens a `BrowserWindow` loading the Vite static frontend (`dist/index.html`) or loopback webserver URL.
2. **Packaging & Distribution**:
   - Tooling: `electron` + `electron-builder`
   - Output targets:
     - **macOS**: `.dmg` and universal `.app` (Apple Silicon & Intel)
     - **Windows**: `.exe` (NSIS installer or portable executable)
3. **Effort & Risk**: **Minimal (Low)**.

---

### B. Android (.apk) via Capacitor & `nodejs-mobile`

Android WebViews are standard browser engines and cannot natively execute Node.js APIs (`node:fs`, `node:net`, `express`, `pg` TCP sockets). To avoid rewriting backend logic or splitting the codebase, we embed a Node.js runtime inside the APK.

1. **Mechanism (`nodejs-mobile-capacitor`)**:
   - Embeds a precompiled native Node.js engine (`libnode.so`) directly inside the APK.
   - When the APK launches, the native Android thread starts the embedded Node.js process running the compiled `dist-server/index.js`.
   - Express listens on `127.0.0.1:3001` inside the Android process sandbox.
   - The Capacitor WebView displays the React app and makes standard `fetch('/api/...')` calls to `http://127.0.0.1:3001`.
2. **Database & Network Connectivity**:
   - The Node.js `pg` driver connects to the hosted PostgreSQL instance over TLS (port 5432 / 6543) directly via Android's networking layer.
   - Standard AWS S3 uploads and image streaming work identically to the server.
3. **Bundle Size & Overhead**:
   - Adds ~25–35 MB to the base APK size for the native Node engine.
   - Background thread startup time: ~1.0–1.5s on first app launch.
4. **Effort & Risk**: **Moderate (Medium)**.

---

## 4. Codebase Unification Strategy

To maintain a single, clean repository without code duplication:

```
larder/
├── src/                    # 100% Shared React 19 Frontend (Vite + Tailwind)
├── server/                 # 100% Shared Express + Drizzle Backend (Node.js)
├── electron/               # Electron Main & Preload scripts (~50 lines)
│   ├── main.ts
│   └── preload.ts
├── android/                # Auto-generated Capacitor Android Studio project
│   └── app/
├── capacitor.config.ts     # Capacitor configuration
├── electron-builder.json   # Electron packaging configuration
└── package.json            # Unified scripts (dev, build, package)
```

### Build Pipeline:
1. `pnpm build` -> compiles `dist/` (client) and `dist-server/` (server).
2. `pnpm package:desktop` -> `electron-builder` packages `dist/` and `dist-server/` into `.dmg` and `.exe`.
3. `pnpm package:android` -> `cap sync` + Gradle builds `app-release.apk`.

---

## 5. Key Technical Considerations

| Area | Consideration | Solution |
| :--- | :--- | :--- |
| **API Base URL** | Native WebViews (`file://` or `capacitor://localhost`) cannot use root-relative `/api` URLs without a proxy. | Inject `API_BASE_URL = 'http://127.0.0.1:3001'` in native builds via `src/services/api.ts`. |
| **Credentials & Security** | DB connection strings and S3 access keys are bundled or configured in thick clients. | Single-user personal app: Embed in build environment.<br>Multi-user: Configure in-app via existing `/api/database` and `/api/storage` settings routes. |
| **Mobile Sleep / Wake** | Mobile OS suspends background threads when the app is backgrounded. | Add a health-check ping on app foreground event; seamlessly reconnect PostgreSQL pool if disconnected. |
| **Safe Areas & Layout** | Mobile status bars and navigation notches. | Add standard CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` padding to main layout wrappers. |

---

## 6. Implementation Roadmap

1. **Decouple API Base URL (`src/services/api.ts`)**:
   - Add support for an optional `VITE_API_BASE_URL` or runtime-injected loopback port.
2. **Desktop Target (Electron)**:
   - Create `electron/main.ts` to spawn `dist-server/index.js` and open `BrowserWindow`.
   - Add `electron-builder` scripts to [package.json](file:///Users/gvp/IdeaProjects/coquinaria/package.json).
3. **Android Target (Capacitor + Node.js Mobile)**:
   - Initialize Capacitor (`@capacitor/cli`, `@capacitor/android`).
   - Add `nodejs-mobile-capacitor` bridge to execute `dist-server/` in Android background thread.
   - Configure Gradle build and test debug `.apk`.
4. **CI/CD Build Automation**:
   - Set up GitHub Actions matrix to build artifacts on release:
     - `macos-latest` -> `.dmg`
     - `windows-latest` -> `.exe`
     - `ubuntu-latest` (Android SDK) -> `.apk`
