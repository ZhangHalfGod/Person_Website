# 左墙画框 · MechAssist 嵌入方案

> **状态**：**主线已实现（M2～M5）** / 用户确认可访问并登录  
> **实现摘要**：框内 iframe 对齐金框 + 前进 1～2 预览 + 第 3 次 location.assign 跳转 Console；登录 iframe 内自助（账号不入库）。  
> **日期**：2026-10-16  
> **范围**：框内 iframe + 第 1～2 次预览 + 第 3 次跳站；不改金框几何 / Bake / 材质。  
> **关联**：房间 `/room/0` 左墙金框（画框）；外站 MechAssist Console。

---

## 1. 目标

在房间**左墙金框 / 画框**内，按现有框格 **UV 矩形**嵌入 MechAssist 首页预览：

| 前进次数 | 行为 |
|---------|------|
| 第 1～2 次 | 仅框内预览交互（聚焦 / 放大预览，不离开房间） |
| 第 3 次 | 整页跳转外站 Console |

外站地址（当前）：`http://8.163.18.183/console/`

---

## 2. 探测结论（已完成）

| 项 | 结果 |
|----|------|
| URL | `http://8.163.18.183/console/` |
| HTTP 可达 | 是（200，标题「MechAssist AI - 机械智能助手」） |
| `X-Frame-Options` | **无** |
| CSP `frame-ancestors` | **无** |
| 可否 iframe | **可以** |
| 混合内容（当前） | 个人站与 ECS 均为 **HTTP** → **无**混合内容问题 |

### 日后域名 / HTTPS 注意

若个人站升级为 **HTTPS**，而 ECS Console 仍为裸 **HTTP**：

- 浏览器会按**混合内容**拦截 iframe。
- 需双方都上 HTTPS，或把 Console **同域反代**到个人站域名下，iframe 才能继续用。

防嵌头若日后被 nginx / 应用加上（`X-Frame-Options` / `frame-ancestors`），则改走「静态截图贴图 + 第三次外链」备选。

---

## 3. 推荐实现（优先）

### 3.1 框内预览（第 1～2 次前进）

- 框内用 **iframe** 指向 `http://8.163.18.183/console/` 首页（或用户登录后的落地页）。
- 用缩放 / `object-fit`（或等价 CSS）把页面可视区域**贴合**金框 UV 矩形，不溢出框缘。

**推荐技术路径（方案层）**

1. **首选**：R3F `Html`（或同类 portal）把 iframe 叠在画框 mesh 的屏幕投影矩形上，随相机变换；尺寸按框格 UV / 世界包围盒算出的屏幕像素对齐。
2. **备选**：独立 DOM overlay，每帧用画框四角投影到屏幕，同步 `left/top/width/height`；实现稍散，但不绑 R3F Html。
3. **不优先**：把 iframe 纹理烘焙进 canvas→纹理（跨域脏画布、登录态更难），除非防嵌头迫使放弃 iframe。

### 3.2 登录

- **iframe 内由用户自己登录**；跨域代登（父页填账号塞进子页）不现实，也不做。
- 预览阶段可不登录，能看到公开首页即可。
- 联调账号：**见本地私密笔记 / 环境变量，勿入库**（本方案文档不写明文密码）。

### 3.3 第三次前进 → 跳出房间

- 在现有 door / 「前进」交互上，对**同一画框**维护点击 / 前进计数。
- 计数到 **3**：`window.open(...)` 或同页 `location` 跳转到 `http://8.163.18.183/console/`。
- 第 1～2 次：只做框内聚焦 / 预览增强，**不**离开 `/room/0`。

### 3.4 前进计数约定（建议）

```
同一画框前进计数 n：
  n = 1 → 聚焦框内 iframe（可轻微放大 / 提示可再进）
  n = 2 → 维持或加深预览（仍在房间内）
  n = 3 → 外链跳转 Console；计数可重置或锁定
离开画框 / 换交互目标 → 计数清零（实现时二选一并写进代码注释）
```

---

## 4. 备选方案

若出现防嵌头、混合内容、或 iframe 性能不可接受：

- **静态截图贴图**填满框格 UV + 轻微「可点击」提示；
- 仍用同一套「第三次前进 → 外链」逻辑。

探测阶段已确认当前**无需**走备选；备选作日后兜底。

---

## 5. 风险

| 风险 | 说明 | 缓解 |
|------|------|------|
| HTTPS 混合内容 | 个人站 HTTPS + ECS HTTP → iframe 被拦 | 双方 HTTPS 或同域反代 |
| 防嵌头变更 | ECS 日后加 `X-Frame-Options` / CSP | 切静态贴图备选 |
| 登录态不出 iframe | Cookie / SameSite 跨域 | 接受；第三次整页跳转后用户再登 |
| 框内可读性 | 页面字号相对小框偏小 | object-fit + 可选缩放；第三次进真站 |
| 与灯光 / Bake 耦合 | 误改材质或重烘 | **本功能不碰 Bake / 灯塘 / 金框几何** |

---

## 6. 落地顺序

1. ~~探测防嵌头与可达性~~ → **已完成**（可 iframe，当前双 HTTP）
2. ~~框内 iframe 对齐金框 UV / 屏幕投影矩形~~ → **M2 已完成**（2026-10-16）
3. ~~绑定前进计数：1～2 预览，3 跳转~~ → **M3+M4 已完成**（2026-10-16）
4. （可选）静态截图兜底资源备好，防日后防嵌头

### 6.1 M2 实现备注（2026-10-16）

| 项 | 说明 |
|----|------|
| 对齐方式 | R3F `@react-three/drei` `<Html transform>`，与画心 plane 同姿态（local `rotation Y=π`，`z≈-0.07`）；`distanceFactor = PAINTING.w * 400 / CSS_W`，使 CSS 像素映射到世界米制，贴合 `PAINTING.w×h`（0.78×1.08） |
| iframe src | `MECHASSIST_EMBED_URL`（`site.js` / `VITE_MECHASSIST_EMBED_URL`），默认 `http://8.163.18.183/console/`；**无密码** |
| pointer | iframe 区域 `pointerEvents=auto`（可滚可点）；`FocusHit` 略大于画心，框缘仍可推进相机；空白处 `onPointerMissed` 后退 |
| 登录 | iframe 内用户自助；父页不代登 |
| 改动文件 | `Code/Module/door/scene/PaintingEmbed.jsx`（新）、`Painting.jsx`、`Code/Module/app/config/site.js`、`.env.development` / `.env.production` |

### 6.2 M3 / M4 实现备注（2026-10-16）

| 项 | 说明 |
|----|------|
| **计数存在哪** | 复用 `useRoomStore` 的 `focus` + `zoom`：当 `focus === 'painting'` 时，`zoom` 即为同框前进次数（1～2）。换目标 / `retreatFocus` 清零。常量 `PAINTING_PREVIEW_MAX = 2`。 |
| M3（第 1～2 次） | `advanceFocus('painting')` → `zoom` 1 或 2，相机走 `FOCUS_VIEWS.painting[1|2]`；**不** `location` / `window.open`。 |
| M4（第 3 次） | 已在 `zoom >= 2` 时再 `advanceFocus('painting')` → `openMechAssistConsole()` → **`window.location.assign(MECHASSIST_EMBED_URL)`**（整页离开 `/room/0`）。 |
| 跳转 API | `Code/Module/app/config/site.js`：`openMechAssistConsole()`；URL = `MECHASSIST_EMBED_URL` / `VITE_MECHASSIST_EMBED_URL`。 |
| 改动文件 | `roomStore.js`、`site.js`（`openMechAssistConsole`）、`roomCameraStops.js`（painting 无 level-3 机位）、`RoomHud.jsx` 提示 |

---


### 6.3 M5 登录（2026-10-16）

| 项 | 说明 |
|----|------|
| 方式 | iframe 内用户自助登录 Console；父页不代登、密码不入库 |
| 验收 | 用户确认可访问并登录（2026-10-16） |

## 7. 明确不做（本方案实现阶段）

- 不改金框雕花几何、不重烘 lightmap / AO
- 不把联调密码写入仓库或本 md
- 不在父页代登 / 抓取 ECS Cookie
- 不在本步做 OC-01～04 / FO 视觉 polish

---

## 8. 验收（实现后）

- ✅ `/room/0` 左墙画框内可见 Console 首页预览，贴合框格、无明显溢出。（M2）
- ✅ 同框第 1～2 次前进仍留在房间；第 3 次 `location.assign` 进 Console。（M3/M4）
- ✅ 个人站仍为 HTTP 时无混合内容报错；实现日期 2026-10-16。
- ✅ 登录：iframe 内自助；**用户确认可访问并登录**（M5，2026-10-16）。

---

## 9. 文档指针

- 气质 / 可选收口对照：`Bake2气质对照说明.md`（本嵌入为**新功能**，非 Bake 收口）
- 计划表：可在「后续优化 / 新功能」中加一行「左墙画框 MechAssist iframe」→ 主线 M2～M5 已完成；进度见同目录（`文档/`）`文档/左墙画框_MechAssist嵌入进度.xlsx`

## 10. 进度表

- 进度跟踪：同目录（`文档/`）`文档/左墙画框_MechAssist嵌入进度.xlsx`（总览 / 里程碑 M0～M7 / 日志；状态：主线 M2～M5 已完成；M6 可选未开始；M7 已记录待日后）
