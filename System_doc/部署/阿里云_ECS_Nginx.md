# 阿里云 ECS：Profile 主站 + MechAssist 控制台

对照 MechAssist 文档：[阿里云 Ubuntu 22 部署步骤](../../../MechAssist-Fusion/extern-api/doc/FAQ/阿里云_Ubuntu22_部署步骤.md)（路径按本机仓库）。现网 Nginx 见仓库根 `debug.txt`。

## 结论

| 问题 | 答案 |
| --- | --- |
| 公网 IP 打开是不是本站 | 可以。Nginx `location /` 改指向本仓库 `Code/dist` |
| 用 PM2 管本站 | **可以，但不需要。** 本站是 Vite 静态 SPA，和 MechAssist **前端**一样由 Nginx 读 `dist`。PM2 继续只跑 `mechassist-api`、`mcp-gaode`、`mcp-faq`。若一定要出现在 `pm2 ls`，用 `Code/deploy/ecosystem.config.cjs` |
| MechAssist 去哪 | 生产构建 `base=/console/`，公网路径 `/console/`、`/console/login` |
| 未登录走廊 | 只渲染画面，点击/键盘无效；左上汉堡菜单可开侧栏，走「控制台登录」 |

当前 Nginx `server_name` 是 `8.163.18.183`。若要以 `8.139.112.95` 访问，把两个 IP 都写进 `server_name`（示例配置已写）。

## 访问关系

```text
浏览器
  /              Person_Website（走廊，未登录静态）
  /console/      MechAssist SPA
  /console/login 控制台登录（成功后 ?next=/ 回到走廊）
  /api /auth     仍是 PM2 :3002
  /gaode/ /glasses/ /agents-skill/  与现网相同
```

登录后本站读同源 `localStorage.console_auth_token` / IndexedDB，再请求 `GET /api/auth/me`。通过才解锁行走与开门。

## 服务器步骤

### 1. 上传本仓库

```bash
# Git（有远程时）
cd /var/www
git clone <本仓库URL> Person_Website
cd Person_Website/Code
npm ci
npm run build
```

或本机打包后 scp（排除 `node_modules`）：

```bash
cd D:\trae_git\Person_Website
tar --exclude=node_modules --exclude=Code/node_modules -czvf person-website.tar.gz Code System_doc
scp person-website.tar.gz root@8.139.112.95:/var/www/
# 服务器
cd /var/www && tar -xzvf person-website.tar.gz
# 目录应是 /var/www/Person_Website/Code 或把解压结果挪成该路径
cd /var/www/Person_Website/Code && npm ci && npm run build
```

`npm run build` 会带上 `.env.production` 的 `VITE_REQUIRE_CONSOLE=true`。本机 `npm run dev` 默认不锁走廊，方便继续调 3D。

### 2. 重建 MechAssist 前端（必须）

控制台要从 `/` 让出来，生产 `base` 已改为 `/console/`：

```bash
cd /var/www/MechAssist-Fusion
git pull   # 含 extern-api 导航与 basename 改动
cd extern-api
npm ci
npm run build
pm2 restart mechassist-api
```

不要只换 Nginx 而不重建 `extern-api/dist`，否则 JS 仍从 `/assets/` 加载，会和本站资源打架。

### 3. 换 Nginx

示例：[`Code/deploy/nginx.person-website.example.conf`](../../Code/deploy/nginx.person-website.example.conf)

```bash
sudo cp /var/www/Person_Website/Code/deploy/nginx.person-website.example.conf /etc/nginx/sites-available/mechassist
# 按实际 IP / 路径改 server_name 与 root
sudo nginx -t && sudo systemctl reload nginx
```

`/api`、`/auth`、`/gaode/`、`/glasses/`、`/agents-skill/` 保持现网代理，不要动 PM2 端口。

### 4. 可选 PM2 托管本站

```bash
cd /var/www/Person_Website/Code
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

同时把 Nginx `location /` 改成 `proxy_pass http://127.0.0.1:4173;`（不要再用 `root dist`）。日常更新仍是 `npm run build`；用 Nginx 静态时不必重启 PM2。

## 验证

- `http://8.139.112.95/`：走廊静帧 + 左上三杠侧栏（开发者文档、控制台登录）
- 未登录：点走廊、键盘 WASD 无效
- 侧栏「控制台登录」→ `/console/login?next=/`，登录后回到 `/`，走廊可走
- MechAssist 顶栏「首页」回到门户；「控制台」留在 `/console/`
- `http://8.139.112.95/gaode/`、`/glasses/`、`/api` 与改前一致

## 回滚

把 Nginx `root` 改回 `/var/www/MechAssist-Fusion/extern-api/dist`，去掉 `/console/`。MechAssist 若已按 `/console/` 构建，回滚前端需 `VITE_BASE=/ npm run build` 再重载 Nginx。
