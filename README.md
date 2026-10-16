# Person_Website — Profile 3D Showcase

**Language / 语言:** [English](README.md) | [中文](README.zh-CN.md)

> **A browser Profile site: walk a 3D corridor, open a door into a lit room, and jump to related consoles from the wall painting and site menu.**

[![GitHub](https://img.shields.io/badge/GitHub-ZhangHalfGod%2FPerson__Website-blue?logo=github)](https://github.com/ZhangHalfGod/Person_Website)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%20%2F%20drei-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **What this repo is**: Front-end SPA for a personal **Profile** landing. Phase 1 is a **3D corridor** (`Module/Main`) plus **shared room scene** (`Module/door`, `/room/:doorId`). Optional login gates portal links; MechAssist Console can embed in the room painting and open full-page at `/console/`.  
> **Validated stack**: React 18 · Vite 5 · Three.js + `@react-three/fiber` / `drei` · Zustand · React Router 6 · Tailwind 3.  
> **Not**: a full game engine, physics (phase 1), or a backend API inside this repo. Production static files are served by Nginx; auth/API live with MechAssist on the same host when deployed.

---

## Showcase flow

1. **Corridor.** Open `/` — walk stops along the hall (↑ / W forward, ↓ / S / Backspace back). [Quick start](#quick-start)
2. **Door.** Face a door and enter — route becomes `/room/:doorId` (doors `0`–`7` share one room scene).
3. **Room.** Coffered ceiling with slot lights, furniture, blackboard, wall painting; painting can embed MechAssist Console.
4. **Portal.** Site menu groups “on this site” and “with this site” links (docs, console, Gaode, glasses, Agents Skill). Login when `VITE_REQUIRE_CONSOLE=true`.

Internal design notes live under [`System_doc/`](System_doc/README.md) (Chinese). App code lives under [`Code/`](Code/README.md).

---

## Table of contents

- [Showcase flow](#showcase-flow)
- [Quick start](#quick-start)
- [What you see](#what-you-see)
- [Repository layout](#repository-layout)
- [Routes and portal](#routes-and-portal)
- [Environment](#environment)
- [Build and deploy](#build-and-deploy)
- [Related projects](#related-projects)
- [Asset licenses](#asset-licenses)

---

## Quick start

Requires **Node.js 18+** (Node 22 verified on the lab PC).

```bat
cd /d D:\trae_git\Person_Website\Code
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Dev defaults keep console gating off so you can walk the 3D scene without a login.

| Script | Meaning |
| --- | --- |
| `npm run dev` | Vite dev server (port `5173`) |
| `npm run build` | Production build → `Code/dist` |
| `npm run preview` | Preview the build (port `4173`) |

Path aliases: `@app` → `Module/app`, `@main` → `Module/Main`, `@door` → `Module/door`.

---

## What you see

| Area | Route / entry | Role |
| --- | --- | --- |
| Profile corridor | `/` | Hall with door pairs, mid-line ceiling lights, walk stops |
| Room | `/room/:doorId` | Shared interior: entry door intro, slot lights, furniture, painting, blackboard |
| Login | `/login` | Console login page (same-origin auth when deployed with MechAssist) |

Phase 1 intentionally has **no** physics library and **no** in-repo backend. Door catalog is static [`Code/Module/Main/data/rooms.json`](Code/Module/Main/data/rooms.json).

---

## Repository layout

```text
Person_Website/
  Code/                 Vite + React app (run npm here)
    Module/app/         Shell: entry, routes, session, site menu
    Module/Main/        Corridor Profile page + scene
    Module/door/        Room page + scene
    Module/Other/       Reserved for later modules
    public/             Textures, models, asset license notes
    deploy/             Example Nginx + PM2 snippets
  System_doc/           Product / art / deploy docs (Chinese)
  README.md             This file
  README.zh-CN.md       Chinese README
```

Do not pile business files back into `Code/` root — keep them under `Module/`.

---

## Routes and portal

| Path | Component |
| --- | --- |
| `/` | `ProfilePage` (corridor) |
| `/login` | `LoginPage` |
| `/room/:doorId` | `RoomPage` (`doorId` `0`–`7`) |
| `*` | Redirect to `/` |

Portal groups (see `Code/Module/app/config/site.js`):

- **On this site** — overview, developer docs (`/agents-skill/`), console login
- **With this site** — MechAssist (`/console/`), Gaode travel helper, smart glasses, Agents Skill

When production sets `VITE_REQUIRE_CONSOLE=true`, explore / portal items that need auth wait for a valid console session (`localStorage.console_auth_token` + `/api/auth/me`).

---

## Environment

Files under `Code/`:

| Variable | Typical use |
| --- | --- |
| `VITE_REQUIRE_CONSOLE` | `false` in `.env.development` (open 3D); `true` in `.env.production` (gate portal) |
| `VITE_MECHASSIST_EMBED_URL` | Painting iframe + full-page jump target (default console URL on the deploy host) |

Dev proxies `/api` and `/auth` to `http://localhost:3002` when a local MechAssist API is running. The Profile SPA itself stays static.

---

## Build and deploy

```bat
cd /d D:\trae_git\Person_Website\Code
npm ci
npm run build
```

Serve `Code/dist` as the site root (`/`). On the lab Alibaba Cloud ECS layout:

| Location | Serves |
| --- | --- |
| `/` | This Profile SPA (`Code/dist`) |
| `/login` | Site login (shared auth with MechAssist) |
| `/console/` | MechAssist SPA |
| `/api` | MechAssist API (PM2) |

Nginx / PM2 notes and examples: [`System_doc/部署/阿里云_ECS_Nginx.md`](System_doc/部署/阿里云_ECS_Nginx.md), [`Code/deploy/nginx.person-website.example.conf`](Code/deploy/nginx.person-website.example.conf). PM2 on that host is for MechAssist APIs, not for this static front end.

---

## Related projects

| Repo | Relation |
| --- | --- |
| [MechAssist-Fusion](https://github.com/ZhangHalfGod/MechAssist-Fusion) | Console embedded in the room painting / `/console/` |
| [Agents-Skill-Site](https://github.com/ZhangHalfGod/Agents-Skill-Site) | Developer docs portal link |
| [MCP_Gaode_Map](https://github.com/ZhangHalfGod/MCP_Gaode_Map) | Travel helper portal link |
| [AI_Virtual_Glasses](https://github.com/ZhangHalfGod/AI_Virtual_Glasses) | Smart glasses portal link |

---

## Asset licenses

Application source in this repository does **not** ship a root `LICENSE` file yet.

Third-party **3D textures / HDR references** used by the corridor and room are **CC0**. Attribution and paths: [`Code/public/licenses.txt`](Code/public/licenses.txt).