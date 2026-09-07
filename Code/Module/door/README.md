# door — 房间页

对应文档：`System_doc/door_Page`

路由：`/room/:doorId`（`0`～`7`）。8 门共用同一套 scene，不要复制 8 份房间。

| 目录 | 一期放什么 | 以后 |
| --- | --- | --- |
| `pages/` | `RoomPage.jsx` | — |
| `scene/` | 房间、入场门、闪灯、桌凳、画、黑板 | — |
| `store/` | 入场时间轴阶段 | — |
| `overlay/` | Profile + Back | — |
| `extensions/interact/` | **空** 禁止一期点道具 | 画 / 黑板 / 桌子交互 |
| `extensions/physics/` | **空** | 室内刚体 |
| `extensions/backend/` | **空** | 房间内容存档 |

门目录数据读 `@main/data/rooms.json`。贴图：`Code/public/textures/door/`
