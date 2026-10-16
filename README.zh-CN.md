# Person_Website — Profile 三维展示站

**Language / 语言:** [English](README.md) | [中文](README.zh-CN.md)

> **浏览器里的 Profile 展示站：在三维走廊里行走，推门进入亮着槽灯的房间，再从壁画或站点菜单跳到相关控制台与合作项目。**

[![GitHub](https://img.shields.io/badge/GitHub-ZhangHalfGod%2FPerson__Website-blue?logo=github)](https://github.com/ZhangHalfGod/Person_Website)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%20%2F%20drei-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Node](https://img.shields.io/badge/Node-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **本仓做什么**：个人 **Profile** 落地页前端 SPA。一期是 **三维走廊**（`Module/Main`）+ **共用房间场景**（`Module/door`，路由 `/room/:doorId`）。可选登录门槛控制门户链接；房间壁画可嵌入 MechAssist 控制台，并整页跳到 `/console/`。  
> **已用技术栈**：React 18 · Vite 5 · Three.js + `@react-three/fiber` / `drei` · Zustand · React Router 6 · Tailwind 3。  
> **不是**：完整游戏引擎、一期物理库，也不是本仓内的后端 API。生产环境由 Nginx 托管静态包；鉴权 / API 与同机 MechAssist 协作。

---

## 展示动线

1. **走廊。** 打开 `/`，沿停驻点前进（↑ / W）或后退（↓ / S / Backspace）。[快速开始](#快速开始)
2. **推门。** 面向门进入后进入 `/room/:doorId`（门号 `0`–`7` 共用同一套房间 scene）。
3. **房间。** 精装槽灯天花、家具、黑板、壁画；壁画可嵌入 MechAssist Console。
4. **门户。** 站点菜单分「基于本站」「与本站合作」：文档、控制台、出行助手、智能眼镜、Agents Skill。生产环境 `VITE_REQUIRE_CONSOLE=true` 时需登录。

产品与美术说明见 [`System_doc/`](System_doc/README.md)。工程说明见 [`Code/`](Code/README.md)。

---

## 目录

- [展示动线](#展示动线)
- [快速开始](#快速开始)
- [页面上有什么](#页面上有什么)
- [仓库结构](#仓库结构)
- [路由与门户](#路由与门户)
- [环境变量](#环境变量)
- [构建与部署](#构建与部署)
- [相关仓库](#相关仓库)
- [素材许可](#素材许可)

---

## 快速开始

需要 **Node.js 18+**（实验机已用 Node 22 验证）。

```bat
cd /d D:\trae_git\Person_Website\Code
npm install
npm run dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)。开发环境默认不强制控制台登录，便于直接走三维场景。

| 命令 | 含义 |
| --- | --- |
| `npm run dev` | Vite 开发服（端口 `5173`） |
| `npm run build` | 生产构建 → `Code/dist` |
| `npm run preview` | 预览构建结果（端口 `4173`） |

路径别名：`@app` → `Module/app`，`@main` → `Module/Main`，`@door` → `Module/door`。

---

## 页面上有什么

| 区域 | 路由 / 入口 | 作用 |
| --- | --- | --- |
| Profile 走廊 | `/` | 门对、天花中线灯、停驻行走 |
| 房间 | `/room/:doorId` | 共用室内：入场门、槽灯、家具、壁画、黑板 |
| 登录 | `/login` | 控制台登录页（与 MechAssist 同机部署时同源鉴权） |

一期 **不做** 物理库，**不做** 本仓后端。门目录为静态 [`Code/Module/Main/data/rooms.json`](Code/Module/Main/data/rooms.json)。

---

## 仓库结构

```text
Person_Website/
  Code/                 Vite + React 工程（在此目录执行 npm）
    Module/app/         应用壳：入口、路由、会话、站点菜单
    Module/Main/        走廊 Profile 页 + 场景
    Module/door/        房间页 + 场景
    Module/Other/       后续模块预留
    public/             贴图、模型、素材许可说明
    deploy/             Nginx / PM2 示例
  System_doc/           产品 / 美术 / 部署文档
  README.md             英文 README
  README.zh-CN.md       本文件
```

业务代码放在 `Module/` 下，不要堆回 `Code/` 根目录。

---

## 路由与门户

| 路径 | 组件 |
| --- | --- |
| `/` | `ProfilePage`（走廊） |
| `/login` | `LoginPage` |
| `/room/:doorId` | `RoomPage`（`doorId` 为 `0`–`7`） |
| `*` | 回到 `/` |

门户分组见 `Code/Module/app/config/site.js`：

- **基于本站** — 概述、开发者文档（`/agents-skill/`）、控制台登录
- **与本站合作** — 机械助手（`/console/`）、出行助手、智能眼镜、Agents Skill

生产环境打开 `VITE_REQUIRE_CONSOLE=true` 后，需有效控制台会话（`localStorage.console_auth_token` + `/api/auth/me`）才能进入需登录的门户项。

---

## 环境变量

位于 `Code/`：

| 变量 | 常见用法 |
| --- | --- |
| `VITE_REQUIRE_CONSOLE` | `.env.development` 为 `false`（开放三维）；`.env.production` 为 `true`（门户门槛） |
| `VITE_MECHASSIST_EMBED_URL` | 壁画 iframe 与整页跳转目标（默认同机控制台地址） |

开发时可把 `/api`、`/auth` 代理到本机 `http://localhost:3002`（本地 MechAssist API）。Profile 本身仍是静态 SPA。

---

## 构建与部署

```bat
cd /d D:\trae_git\Person_Website\Code
npm ci
npm run build
```

把 `Code/dist` 作为站点根路径 `/` 托管。实验用阿里云 ECS 布局：

| 路径 | 内容 |
| --- | --- |
| `/` | 本仓 Profile SPA（`Code/dist`） |
| `/login` | 本站登录（与 MechAssist 共享鉴权） |
| `/console/` | MechAssist SPA |
| `/api` | MechAssist API（PM2） |

Nginx / PM2 说明与示例：[`System_doc/部署/阿里云_ECS_Nginx.md`](System_doc/部署/阿里云_ECS_Nginx.md)、[`Code/deploy/nginx.person-website.example.conf`](Code/deploy/nginx.person-website.example.conf)。该机上的 PM2 管的是 MechAssist 一类 API，不是本静态前端。

---

## 相关仓库

| 仓库 | 关系 |
| --- | --- |
| [MechAssist-Fusion](https://github.com/ZhangHalfGod/MechAssist-Fusion) | 壁画嵌入 / `/console/` 控制台 |
| [Agents-Skill-Site](https://github.com/ZhangHalfGod/Agents-Skill-Site) | 开发者文档门户 |
| [MCP_Gaode_Map](https://github.com/ZhangHalfGod/MCP_Gaode_Map) | 出行助手门户 |
| [AI_Virtual_Glasses](https://github.com/ZhangHalfGod/AI_Virtual_Glasses) | 智能眼镜门户 |

---

## 素材许可

本仓应用源码 **尚未** 在根目录放置 `LICENSE` 文件。

走廊与房间使用的第三方 **贴图 / HDR 参考** 为 **CC0**。出处与路径见 [`Code/public/licenses.txt`](Code/public/licenses.txt)。