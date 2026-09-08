# UI 设计规范 — Profile 走廊

目标图：[profile-corridor-v1.png](profile-corridor-v1.png)

## 气质

暗黑走廊、暖黄灯、木门。像夜里的旅馆通道，不是科幻 HUD。

## 灯

- 位置：天花 **中线** `x = 0`，沿 Z 一排，挂在天花下方一点。
- 颜色：约 `#ffb366` / 2700K。
- 气质参考 [scheme-a-css3d-profile.png](../../Main_Page/Requirement_Analysis/scheme-a-css3d-profile.png)：深色浅盘罩、腔内暖泡、可见吊线。
- **下面**（地板）：灯塘 + 轻微拉丝反光。**上面**（天花 / 上门墙）：暗色微亮、哑光，不要地板那种反光；不要纯黑空洞。
- 灯罩：扇形大口朝下，灯泡在腔内，**顶部密封**。现网是前端占位（`CeilingLights.jsx`），不是半透明羊皮灯笼。
- 罩外侧 8 条楞条是试做装饰，参考图没有，下轮应删。
- 正式资产仍是 `ceiling_pendant.glb`（口朝下、有灯座和吊线）。现在不必先开 Blender。
- 分析原稿：[../../Error/第一期/Light_physical/天花吊灯物理交互与阴影.html](../../Error/第一期/Light_physical/天花吊灯物理交互与阴影.html)。现网进度：[../../前端/第一期/现网进度.html](../../前端/第一期/现网进度.html)。
- **不要**把灯装在「门和墙之间的门楣」上。

## HUD（HTML，不要画在地面上）

| 元素 | 规则 |
| --- | --- |
| 标题 | 左上，`Profile`，小字、浅色、低存在感 |
| 前进提示 | 画面中下或中轴视觉中心偏下：`Click the corridor to walk forward` |
| 尽头 | `End of the corridor` 或隐藏前进句 |
| 面向门 | 可换成 `Click again to open` |
| 圆圈 | **禁止**地面发光圈、准星、圆环 |

文字半透明，不挡门。点击文字 = 点击中轴。

## 门

- 深色实木，有厚度。
- 门牌是独立文字/小牌，读 `label`，不要烤进贴图。
- 关闭时与墙齐；打开时能看到门后一条缝（进房间前的短暂暗示即可）。

## 光标

- 中轴可点：`cursor: pointer`
- 门可点：`pointer`
- 动画中：默认光标
