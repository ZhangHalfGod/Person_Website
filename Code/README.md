# Code — Profile 工程根

在本目录执行 `npm install` 与 `npm run dev`（http://localhost:5173）。

生产部署（阿里云 ECS、Nginx、是否用 PM2）见 [System_doc/部署/阿里云_ECS_Nginx.md](../System_doc/部署/阿里云_ECS_Nginx.md)。

功能代码按模块放在 `Module/`，不要把业务堆回根目录。

```
Code/
  Module/app/     应用壳：入口、路由、全局样式
  Module/Main/    走廊主页（System_doc/Main_Page/Start）
  Module/door/    房间页（System_doc/door_Page）
  Module/Other/   以后新模块（本仓库根下的 Code/Other 也可作同级预留）
  public/textures/Main|door   贴图
```

别名：`@app` `@main` `@door`。第一期无后端、无物理库。
