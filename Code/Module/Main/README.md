# Main — Profile 走廊

对应文档：`System_doc/Main_Page/Start`

| 目录 | 一期放什么 | 以后 |
| --- | --- | --- |
| `pages/` | `ProfilePage.jsx` 页面壳 | — |
| `scene/` | 走廊、门对、天花中线灯、停驻点 | 更多门对几何 |
| `store/` | `stopIndex` / 相机阶段 | — |
| `overlay/` | Profile 标题 + 中轴文字提示 | — |
| `data/` | `rooms.json`（8 门目录，door 也读这里） | 仍先静态；后端起来后只换数据源 |
| `extensions/physics/` | **空** 禁止一期实现 | 重力 / 碰撞 / 刚体 |
| `extensions/backend/` | **空** | Express 对接 |

贴图：`Code/public/textures/Main/`
