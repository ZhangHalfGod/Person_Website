# Module

业务按文件夹拆开，方便多期往里加，不把文件平铺在 `src/`。

| 目录 | 文档 | 职责 |
| --- | --- | --- |
| [app/](app/) | — | 入口、路由、全局样式 |
| [Main/](Main/) | `System_doc/Main_Page/Start` | Profile 走廊 |
| [door/](door/) | `System_doc/door_Page` | `/room/:doorId` 房间 |
| [Other/](Other/) | — | 以后既不是走廊也不是房间的新模块 |

导入请用别名 `@app` `@main` `@door`。
