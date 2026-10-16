# Bake2 / 目标三：气质对照 v1（2026-10-15）

> 对照 `System_doc/door_Page/room-interior-v1.png`。  
> **未宣称像素级对齐**；未重烘墙壳/家具全套 LM。

## xlsx「目标三_气质对照v1」状态

| ID | 状态 | 说明 |
|----|------|------|
| 表头状态 | 进行中（主项已调） | 未全勾「全部完成」 |
| G3-01 | 已完成 | 并排对照清单见下 |
| G3-02 | 已完成 | 去灰雾：撤 hemi/dir；压 ambient；ACES + exposure |
| G3-03 | 已完成 | 地板局部重烘 + polish；仍有残余噪点/椭圆不如目标图极致 |
| G3-04 | 已完成 | 画/白板 Spot 洗光 + 面板暖 emissive |
| G3-05 | 几何已改 / LM 待后续 | 见 OC-02；拓扑变了，旧 frame/table LM 会错位 |
| G3-06 | 已完成 | 本说明 |
| G3-IBL-01/02 | 跳过 | 外链 HDR 不可靠且易抬黑 |


## 关键数值（稳定态）

| 项 | 值 |
|----|-----|
| `toneMapping` | ACESFilmic |
| `toneMappingExposure` | `0.92` |
| fog | `#040506`，near 18 / far 32 |
| ambient | warm `#1c140e`，stable ≈ `0.047` |
| 天花点光 stable | `15` / `11.5` / fill `4.2` |
| 画灯 Spot stable | `9` / `9.5`，penumbra ≈ `0.9` |
| **`floorLit.lightMapIntensity`** | **`1.18`**（OC-01 双塘重烘后下调，防双计） |
| `wainscotLit` / `upperLit` LM | `0.58` / `0.30` |
| 家具 LM | table `0.85` · stool `0.78` · bookcase `0.75` |
| canvas/board emissiveIntensity | `0.22` / `0.20` |
| IBL | 跳过 |

## G3-03 / OC-01 地板灯塘

### OC-01（2026-10-16）Bake 参数
- 仅 `BakeFloor`；**不烘墙/家具**
- 收窄 SPOT：CeilA `spot_size=0.68` · E=`1100` · blend=`0.82` · soft=`0.42`  
  CeilB `spot_size=0.62` · E=`920` · blend=`0.80` · soft=`0.38`
- World fill `0.003`；Picture/Board/Table 点光压到 35/35/45
- Cycles samples **128**（LM）/ 48（AO），denoise，bounces 3/2，margin **16**
- polish：从 `_raw` denoise + 加深双塘谷底 + soft-knee（不再大面积 screen 椭圆，避免再合并）

### 产出
- `Code/public/textures/door/room_floor_lightmap.jpg`（`?v=oc01`）
- `Code/public/textures/door/room_floor_ao.jpg`（`?v=oc01`）
- 备份 raw：`room_floor_lightmap_raw.jpg`

### 对照 OC-01
**已接近：** 双塘分离可读；软边；暖色；家具接触暗部保留。  
**仍差：** 相对 v1 多盏天花塘数量/椭圆极致干净度；JPG 仍有轻微颗粒；中景略压。

## 并排对照（总）

### 已接近
1. 暗部无冷灰雾，上墙电影感深黑。
2. 画框/白板软边洗光。
3. 地板有更明显的暖色灯塘与家具接触暗部（相对 Bake0 平铺 LM）。
4. 闪灯峰值 → 稳定残光，未爆白双计。
5. 暖琥珀色温同向。

### 仍差
1. 相对 v1：灯塘数量/椭圆极致干净度仍可再抠（OC-01 已改善双塘分离）。
2. ~~G3-05 / OC-02 金框雕花几何~~ → 几何已改；**LM 待后续重烘**（本话术未开烤）。
3. ~~书柜架内微层次（OC-03）~~ → 点缀已做；仍无书脊浮雕几何。
4. ~~地板缎面高光条~~ → 材质/clearcoat 点缀；强 IBL 仍跳过。

## OC-02 / G3-05（2026-10-16）金框 + 桌脚几何

### 做了什么
- **金框** `FrameRoot`：多层框缘（Outer/OuterBead/Mid/MidBead/Inner/Lip）+ 角饰（Corner/Leaf/Roundel）+ 四向 Crest；瘦 GLB 重导。
- **桌脚** `TableRoot`：更戏剧的 baluster 轮廓 + 分层脚座（FootDisc/Bun/Collar）+ Capital；保留桌面/apron/stretcher/trestle。
- 前端仅 `?v=oc02` cache bust；材质名规则仍匹配 Outer|Corner|Leaf|Crest / Inner|Lip。

### Mesh 名（新建/替换）
- Frame：`FrameOuter` `FrameOuterBead` `FrameMid` `FrameMidBead` `FrameInner` `FrameLip` `FrameCorner_*` `FrameCornerLeaf_*` `FrameCornerRoundel_*` `FrameCrest_{T,B,L,R}`
- Table：`TableLeg_±1` `TableFootDisc_±1` `TableFootBun_±1` `TableFootCollar_±1` `TableCapital_±1`

### 产出路径
- `Code/public/models/picture_frame.glb`
- `Code/public/models/table.glb`
- 脚本：`System_doc/3D美术/第二期/脚本/_oc02_frame_table_geo.py`

### LM
**需后续重烘** `picture_frame_*` / `table_*` lightmap+AO（拓扑变了，旧 UV2 错位）。本话术禁止开烤。

## OC-03（2026-10-16）书柜层次 + 缎面高光（点缀）

### 做了什么
- **书柜**：书脊三档色（`bookcaseDarkLit` / `BookMid` / `BookDeep`）+ 格板略开；柜内 **2 盏弱暖 point**（不闪、无影）。
- **缎面**：桌/凳改 `MeshPhysicalMaterial`（clearcoat 弱）；地板 roughness 略降。
- **IBL**：跳过（外链 HDR 曾失败且易抬黑）——用小灯 + clearcoat 收口。

### 关键数值
| 项 | 值 |
|----|-----|
| 书柜上点 / 中点 | intensity `1.15` / `0.85`，distance `1.35` / `1.15`，`#ffb366` / `#ff9a55` |
| bookcaseLit / Dark / Mid / Deep LM | `0.72` / `0.38` / `0.42` / `0.32` |
| table clearcoat / clearcoatRoughness | `0.20` / `0.38`，roughness `0.30` |
| stool clearcoat | `0.12` / `0.45`，roughness `0.36` |
| floor roughness | `0.18` |

### 对照
**点缀够：** 书脊前后深浅可读；桌面有一丝定向高光，不抢主光。  
**仍平：** 无真实书脊浮雕几何；无弱 IBL 时缎面不如 v1 丝绒感。

## 改动文件

- `Code/public/textures/door/room_floor_lightmap.jpg`（`?v=oc01`）
- `Code/public/textures/door/room_floor_ao.jpg` / `room_floor_lightmap_raw.jpg`
- `Code/Module/door/scene/useRoomMaterials.js`（floor LM `1.18`）
- `Code/Module/door/scene/FlickerLights.jsx`（`floorLit: 1.18`）
- `Code/Module/door/scene/Painting.jsx` / `Furniture.jsx`（书柜弱灯 + `?v=oc03`）
- `Code/Module/door/scene/useRoomMaterials.js`（satin / book 色档）
- `Code/Module/door/scene/FlickerLights.jsx`（book LM 档）
- `Code/public/models/picture_frame.glb` / `table.glb`
- `System_doc/3D美术/第二期/脚本/_bake2_floor_pools.py` / `_polish_floor_lightmap.py` / `_oc02_frame_table_geo.py`
- `System_doc/3D美术/第二期/文档/Bake2气质对照说明.md`
- xlsx：OC-01 已完成；OC-02 几何已改/LM 待后续；OC-03 已完成（点缀）

## 目标一～三收口（三句）

1. **Bake0 壳 + Bake1 家具 LM/AO 已进网页**，稳定态材质管线锁定（瘦 GLB + JPG UV2）。  
2. **目标三气质主调 + 地板局部重烘已落地**，观感明显好于仅 Bake0；与 v1 仍有灯塘/几何差距但可书面收工。  
3. **目标四明确不做**；G3-05 / 可选 IBL 不阻塞一期收口。

## B1-11 对照（OC-04，2026-10-16）

> 对照基准：`System_doc/door_Page/room-interior-v1.png`  
> 截图目录：`System_doc/3D美术/第二期/Test/对照截图_B1-11/`  
> 条件：`/room/0` **LIGHTS_STABLE**（非 flicker 夸张态）；本步**未** Bake / polish / 改 GLB / 改 FlickerLights·materials / 加 IBL。  
> Blender 同机位：可选，本轮跳过（MCP addon protocol 落后，未拍 `blender_*`）。

| 文件 | 机位 | 相对 v1 |
|------|------|---------|
| `web_wide.jpg` | 全屋宽景（ROOM_VIEW） | **已接近** 电影感深黑与暖琥珀色温同向；**仍差** 天花格栅密度与中景金框雕花可读度不如 v1。 |
| `web_floor_pools.jpg` | 地板双灯塘 | **已接近** 双塘分离与暖色软边可读；**仍差** 椭圆极致干净度与灯塘数量仍逊于 v1。 |
| `web_gold_frame_desk.jpg` | 金框 + 桌脚 | **已接近** 画框与桌区同框、洗光可读；**仍差** 框饰仍偏瘦暗（LM 待后续），桌脚雕花层次不如 v1。 |
| `web_bookcase_satin.jpg` | 书柜层次 + 缎面高光 | **已接近** 架内深浅与暖点缀可读；**仍差** 无书脊浮雕，缎面不如 v1 丝绒/架灯感。 |

## 后续优化（B1-11 对照后）

> OC-01～04 可选收口**已收口**；下列项相对 `room-interior-v1.png` / `对照截图_B1-11` **仍差**，标为**后续优化 / 非当前阻塞**。新功能开发可并行，不回头重开 OC 清单。

| ID | 项 | 对照结论 | 状态 | 方向 |
|----|----|----------|------|------|
| FO-01 | 金框雕花/层次 | 现网多为亮白块+细框高光；目标为金箔雕花与框缘层次 | 后续优化 / 未开始 | 几何/材质 |
| FO-02 | 桌脚造型 | 轮廓仍偏简，未及目标缩进/脚线层次 | 后续优化 / 未开始 | 几何 |
| FO-03 | 书柜层次与内容 | 书量、格板纵深、点缀灯仍弱于目标 | 后续优化 / 未开始 | 内容/小灯/材质 |
| FO-04 | 缎面定向高光 | 桌布/木饰等 satin 高光未到位 | 后续优化 / 未开始 | 材质/极弱本地 IBL |
| FO-05 | 地板椭圆灯塘再 polish | 已接近；双塘分离度与软边干净度仍可再收 | 后续优化 / 可选 / 非阻塞 | 局部重烘/polish |

**说明**
- 不阻塞房间新功能；开 polish 时用**独立话术**，勿绑进功能开发。
- FO-01/02 若动几何：记「需后续重烘」即可，勿与功能 PR 硬绑。
- FO-05 非必须；灯塘气质已可验收，仅当视觉优先级升高时再做。

---

## 新功能指针（非 Bake 收口）

| 项 | 状态 | 文档 |
|----|------|------|
| 左墙画框嵌入 MechAssist Console（iframe 预览 + 第三次跳转） | **主线已实现（M2～M5）/ 可访问并登录** | `左墙画框_MechAssist嵌入方案.md` |
| 精装天花 · 晴天灯（嵌入长条天光槽） | **方案已定 / 未实现**（C0 文档完成；C1–C5 未开始） | `精装天花_晴天灯方案.md` / `精装天花_晴天灯进度.xlsx` |

> 与 OC / FO 视觉收口无关；实现时不碰 Bake / 灯塘 / 金框几何。

