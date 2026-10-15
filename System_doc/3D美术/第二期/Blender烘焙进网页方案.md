# Blender 烘焙进网页方案（房间第二期）

> 状态：方案文档（可实施）· 路径已选 · **未宣称已完成烘焙**  
> 对照目标：`System_doc/door_Page/room-interior-v1.png`  
> 关联对比页：`System_doc/3D美术/光影质量路线对比.html`（路线 B）  
> 工作文件：`System_doc/3D美术/第二期/room_phase2.blend`（以仓库实际文件名为准）

---

## 1. 目标与非目标

### 目标

- 在**不换引擎**的前提下（仍 Vite + React + R3F），让房间静帧气质靠近目标图：深暗部层次、墙角/天花间接光、地板与家具受光关系。
- 保持现有资产规则：**瘦 GLB（几何，不带贴图）+ JPG 贴图**；八门共用一室内壳，烘一次全站复用。
- 入场交互保留：开门约 2～3s、暖灯闪约 10s、之后稳定态；台灯拉线可点。

### 非目标（本方案不做）

- 画芯 / 黑板内容编辑器、存档、物理模拟。
- 引入 Houdini 进实时，或 Unity / Unreal 进本站实时链路。
- 走廊页烘焙（可日后复用同一流程，本期只房间）。
- 把门牌 `label` 烤进贴图（门牌仍程序化 / 独立层）。
- 宣称「已对齐目标图」——以第 7 节验收清单逐项过，不预打勾。

---

## 2. 为何选烘焙而非纯实时

| 缺口（对照 PNG） | 纯实时 MeshStandard + 几盏灯 | Cycles 烘焙 lightmap / AO |
|------------------|------------------------------|----------------------------|
| 间接光、墙角漏光 | 弱，靠加灯硬撑 | 强，一次烤进贴图 |
| 暗部电影感 | 难 | 接近离线结果 |
| 地板镜面反射 | IBL 更好 | 烘焙补漫反射受光；镜面可再叠轻 IBL |
| 与现栈兼容 | 好 | 好（只加 UV2 + 贴图槽） |
| 闪灯 / 拉线动态 | 天然 | 需约定：稳定态烘，动态只调 emissive / 强度 |

结论：目标差主要在**间接光 + 大面受光**，不是再抠一点 roughness。烘焙是网页里性价比最高的闭合路径；A 路线（IBL 等）可作为光泽加分项叠加，不替代 B。

---

## 3. 资产与 UV

### UV 通道

| 通道 | 用途 | 注意 |
|------|------|------|
| **UV1**（现有） | albedo / roughness / normal（及金属度若有） | 保持现展开，不因烘焙重排破坏已有 JPG |
| **UV2**（新增） | lightmap / AO 专用 | 尽量无重叠、岛间距够 margin；可与 UV1 完全不同 |

### 导出规则（不变 + 增量）

- **GLB**：仍瘦导出——几何 + UV1 + UV2，**不嵌入**颜色/法线/光照贴图。
- **JPG**：
  - 既有：`textures/door/` 下 albedo 等（命名跟现规范）。
  - 新增：`*_lightmap.jpg`、`*_ao.jpg`（见 §4 命名）。
- 不要把 lightmap 烤进基色贴图；前端用 `lightMap` / `aoMap` 槽位叠加，便于单独调 `lightMapIntensity`。

### 建议按物体拆贴图（便于分批）

- 大面：`room_shell`（墙 + 地 + 天花，或地/墙分两张）
- 家具：`table`、`stool`（三凳可共用一张若 UV2 打包）
- 灯具 / 画框：`lamp`、`frame`（小件分辨率可低）

具体拆分以 `room_phase2.blend` 物体名为准，Bake0 先只做 shell。

---

## 4. Blender 步骤（Cycles Bake）

### 4.1 场景灯：对齐「入场后稳定态」

- 烘焙灯光应模拟 **闪灯结束之后**（文档：暖灯闪约 10s 后的稳定照明），不要烘「闪的峰值」。
- 原则：
  - 画灯 / 天花灯：稳定亮度与色温（暖黄），与目标图一致的主光方向。
  - 避免过多填充灯把暗部抬死；保留深暗，靠弹射补层次。
  - 台灯：若稳定态是关或弱开，按产品设定；拉线交互用实时灯，不靠烘焙表现开关差。
- 烘焙用灯可与游戏用灯分离：一套「Bake Lights」集合，导出到网页时不必带进 GLB。

### 4.2 烘焙类型建议

| 类型 | 用途 | 建议 |
|------|------|------|
| **Diffuse**（Direct + Indirect，Color 视需求） | 漫反射光照进 lightmap | 主路径；金属高光不依赖此图 |
| **AO** | 缝隙、接触暗 | 单独 `*_ao.jpg`，前端 `aoMap` |
| Combined | 含镜面等，易与实时灯打架 | 试点可试，正式优先 Diffuse+AO |

试点（Bake0）：先 Diffuse + AO。若 Combined 更省事且前端关掉重复实时灯后不爆亮，可再评估。

### 4.3 技术参数（起点，可调）

- **Engine**：Cycles  
- **Margin**：2～8 px（分辨率越高可略增；防接缝黑线）  
- **分辨率**：
  - 房间大面（地/墙/天花）：**2048**（2K）；若包体紧可 1K 试点再升
  - 桌等中件：**1024**
  - 凳 / 小框 / 灯：**512～1024**
- **色彩**：lightmap 用线性工作流意识；导出 JPG 时注意是「已含光」的图，前端 tonemap 不要二次曝。
- **清除**：每个物体烘焙前确认 Image 节点选中目标图；UV2 激活。

### 4.4 输出命名与落盘

目录（与现站一致）：

```text
Code/public/textures/door/
  <name>_lightmap.jpg
  <name>_ao.jpg
```

示例：

```text
room_shell_lightmap.jpg
room_shell_ao.jpg
table_lightmap.jpg
table_ao.jpg
stool_lightmap.jpg
stool_ao.jpg
lamp_lightmap.jpg
frame_lightmap.jpg
```

GLB（瘦，含 UV2）仍落现有 models 约定目录（如 `Code/public/models/door/` 或文档已写路径），**版本号或文件名变更时同步改前端引用**。

### 4.5 操作清单（Blender 内）

1. 打开 `room_phase2.blend`，建「Bake Lights」对齐稳定态。  
2. 为大面物体建 UV2，Smart Project / Lightmap Pack，检查重叠。  
3. 新建 Image（2K 等），材质里用 Attribute/UV Map 指到 UV2，Image Texture 选中该图。  
4. Cycles → Bake → Diffuse（或选 AO 再烘一张）。  
5. 保存 JPG 到 `textures/door/`；瘦导出 GLB（含 UV2）。  
6. 网页挂上后目视接缝、曝光，再回调 margin / 强度。

---

## 5. 前端接入（R3F / Three.js）

### 5.1 材质槽

对房间 `MeshStandardMaterial`（或等价）：

- `map` / `roughnessMap` / `normalMap`：仍走 UV1（默认 `uv`）。
- `lightMap`：加载 `*_lightmap.jpg`，**必须**使用 UV2（`geometry.attributes.uv2`；加载 GLB 后确认第二套 UV 存在，必要时 `geometry.setAttribute('uv2', …)`）。
- `aoMap`：`*_ao.jpg`，同样 UV2（Three 中 aoMap 也读 uv2）。
- `lightMapIntensity`：从 ~1.0 起调，对照目标图，避免与残留实时灯叠加爆亮。
- `toneMapping`：保持 / 启用 ACESFilmic；曝光与 lightmap 一起收，不要只拉灯。

### 5.2 与 FlickerLights / 入场动画的关系（推荐约定）

**推荐：烘焙 = 稳定态；闪灯只调 emissive / 实时强度。**

| 阶段 | 烘焙 lightMap | 实时灯 |
|------|---------------|--------|
| 入场开门中 | 已加载，可偏低强度或正常 | 画灯等可暗或未闪 |
| 闪灯 ~10s | **不改 lightMap 内容** | 仅提高 emissive 或独立 Point/Spot 强度做闪烁 |
| 稳定态 ≥10s 后 | lightMap 主导间接光与大面 | 实时灯降到「点缀」或与 Bake 对齐的常亮，避免双计 |

备选（更复杂）：闪灯期 `lightMapIntensity` 从低混到高——一般不必要，优先 emissive 方案。

台灯拉线：继续用实时灯开关；烘焙假定拉线默认态（开或关写进方案备忘，前后端一致）。

### 5.3 可选叠加（不替代烘焙）

- 很弱的环境 IBL（偏暗暖 HDR）补地板/金框反射 —— 对应对比页路线 A 的加分项。
- 轻 bloom 只打在 emissive 灯具上，避免整屏发雾。

---

## 6. 与现码目录映射

| 用途 | 路径 |
|------|------|
| 房间页逻辑 | `Code/Module/door/`（路由 `/room/:doorId`、入场、FlickerLights、家具挂载） |
| 贴图 | `Code/public/textures/door/` |
| 模型 | `Code/public/models/` 下门页既有 GLB 约定（以现引用为准） |
| Blender 源 | `System_doc/3D美术/第二期/room_phase2.blend` |
| 目标静帧 | `System_doc/door_Page/room-interior-v1.png` |
| 入场时序 | `System_doc/door_Page/入场交互时序.md` |
| 工具边界 | `System_doc/3D美术/工具边界与制作计划.md` |
| 本方案 | `System_doc/3D美术/第二期/Blender烘焙进网页方案.md` |
| 三线对比 | `System_doc/3D美术/光影质量路线对比.html` |

改 GLB / 贴图名时：只改 door 模块引用，走廊资产不动。

---

## 7. 验收对照（room-interior-v1.png）

逐项目视，**通过再勾**（本文不预打勾）：

- [ ] 整体明暗：暗部足够深，不是灰雾一片  
- [ ] 墙角 / 踢脚 / 家具接触处有 AO 或间接阴影，无死黑接缝（margin 足够）  
- [ ] 地板有受光过渡（窗/灯方向合理），不只靠一张平 albedo  
- [ ] 画灯 / 天花灯区域有局部提亮，但稳定态不闪  
- [ ] 入场闪灯仍可读、约 10s 后回到与烘焙一致的稳定感  
- [ ] 台灯拉线开关只影响台灯局部，不把全室 lightMap 打穿  
- [ ] UV2 无严重拉伸/重叠导致的光斑重复  
- [ ] 八门进同一房间观感一致（共壳）  
- [ ] 包体：新增 JPG 可接受（大面优先 2K，小件已降）  
- [ ] 移动端/集成显卡：帧率与改前同量级（无额外多盏高成本影）

---

## 8. 风险

| 风险 | 表现 | 缓解 |
|------|------|------|
| UV2 重叠 | 光斑重复、墙灯印到别处 | Lightmap Pack；烘焙前检查；大件单独图 |
| 灯光双计 | 亮爆炸、发白 | 稳定态减弱实时灯；闪灯只用 emissive；调 `lightMapIntensity` |
| 闪灯与烘焙冲突 | 闪时「假」或稳定态接不住 | 烘稳定态；闪不改 lightMap |
| 包体变大 | 加载变慢 | 大面 2K 上限；小件 512；JPG 质量 0.8～0.9；能合并的 UV 岛合并 |
| GLB 无 uv2 | lightMap 错贴到 UV1 | 导出检查；加载后断言 `uv2` |
| 与法线/粗糙度打架 | 过脏或过塑 | lightmap 偏间接光；高光靠 roughness + 可选弱 IBL |

---

## 9. 建议实施批次

### Bake0 — 地面 + 墙（试点）

- 只给 shell 大面 UV2 + Diffuse/AO。  
- 前端仅 shell 接 `lightMap`/`aoMap`，家具仍旧光照。  
- 对照 PNG 看暗部与地板受光是否「方向对了」。  
- **出口**：流程跑通（Blender→JPG→R3F），强度有初值。  
- **2026-10-14 已落地（未宣称对齐目标图）**：`room_shell.glb` + `room_floor_lightmap.jpg` / `room_floor_ao.jpg` / `room_wall_lightmap.jpg` / `room_wall_ao.jpg`；脚本 `_bake0_room_shell.py`、`_bake0_rebake.py`。第 7 节清单仍逐项目视，不预打勾。

### Bake1 — 家具

- 桌、三凳、画框、灯座等 UV2 + 烘焙。  
- 统一稳定态灯光集合，避免每件曝光不一致。  
- **出口**：全室大面+家具均有烘焙，接缝可接受。  
- **2026-10-14 已落地（未宣称对齐目标图）**：脚本 `_bake1_furniture.py`；JPG + 瘦 GLB（含 UV2）见下。前端 `*Lit` 材质挂 `lightMap`/`aoMap`。实时灯仍随入场抬到峰值（产品要求）；家具 LM 强度中等以避免与实时灯完全双计。第 7 节清单仍逐项目视。  
- **产出**：
  1. `table` / `stool` / `bookcase`：1024 或 512 LM+AO。
  2. `picture_frame` / `picture_lamp` / `table_lamp`：512 LM+AO。
  3. `ceiling_coffers`：1024 LM+AO。
  4. 对应 `Code/public/models/*.glb` 瘦导出更新。
- **目标三仍待**：对照 `room-interior-v1.png` 的暗部电影感、灯斑形状、可选弱 IBL / 调参（Bake2）；几何气质（扇形罩、桌脚、书脊）不阻塞 Bake1。

### Bake2 — 调参验收

- 对第 7 节清单逐项；调 margin、分辨率、`lightMapIntensity`、实时灯残留。  
- 可选：叠弱 IBL / 轻 bloom。  
- 气质微调（灯罩扇形、桌脚圆润）仍在 mesh 侧，与烘焙并行但不阻塞 Bake0。  
- **出口**：清单通过项写入门页文档；未通过项列剩余。

---

## 附录：一句话决策

**房间高质量光影 = Cycles 按稳定态烘 lightmap/AO（UV2）+ 网页 MeshStandard 叠加；入场闪灯与台灯保持实时且避免与 lightMap 双计。** 不换 Unity；不把手动进度打成已完成。
