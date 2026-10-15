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
| G3-05 | 未开始 | 金框雕花未做；桌脚 Bake0 已有圆润，未再改几何 |
| G3-06 | 已完成 | 本说明 |
| G3-IBL-01/02 | 跳过 | 外链 HDR 不可靠且易抬黑 |

xlsx：`python System_doc/3D美术/第二期/_mark_bake2_xlsx.py`（先关 Excel）

## 关键数值（稳定态）

| 项 | 值 |
|----|-----|
| `toneMapping` | ACESFilmic |
| `toneMappingExposure` | `0.92` |
| fog | `#040506`，near 18 / far 32 |
| ambient | warm `#1c140e`，stable ≈ `0.047` |
| 天花点光 stable | `15` / `11.5` / fill `4.2` |
| 画灯 Spot stable | `9` / `9.5`，penumbra ≈ `0.9` |
| **`floorLit.lightMapIntensity`** | **`1.28`**（重烘后从 1.55 下调，防双计） |
| `wainscotLit` / `upperLit` LM | `0.58` / `0.30` |
| 家具 LM | table `0.85` · stool `0.78` · bookcase `0.75` |
| canvas/board emissiveIntensity | `0.22` / `0.20` |
| IBL | 跳过 |

## G3-03 地板灯塘（本轮）

### Bake 参数（`_bake2_floor_pools.py`）
- 仅 `BakeFloor`：DIFFUSE lightmap + AO；**不烘墙/家具**
- 天花改为 SPOT（CeilA/B energy 950/720，spot_blend ≈ 0.9，soft size ≈ 0.5）
- World fill `0.006`；其它 Bake 点光压低
- Cycles samples **96**（LM）/ 48（AO），`use_denoising=True`，margin **14**，2048²
- 后处理：`_polish_floor_lightmap.py`（median+gauss denoise、双椭圆软塘叠加、soft-knee 高光）

### 产出
- `Code/public/textures/door/room_floor_lightmap.jpg`（`?v=g3-floor`）
- `Code/public/textures/door/room_floor_ao.jpg`（`?v=g3-floor`）

### 仍差（诚实）
1. 相对目标图，双椭圆灯塘分离度仍不足（偏中心连片池）。
2. Cycles 超时后 MCP 断开，OIDN 质量未二次抬采样验证；JPG 仍有轻微颗粒。
3. 中景桌地可读性仍略压（刻意未加冷 hemi）。

## 并排对照（总）

### 已接近
1. 暗部无冷灰雾，上墙电影感深黑。
2. 画框/白板软边洗光。
3. 地板有更明显的暖色灯塘与家具接触暗部（相对 Bake0 平铺 LM）。
4. 闪灯峰值 → 稳定残光，未爆白双计。
5. 暖琥珀色温同向。

### 仍差
1. 灯塘椭圆极致干净度 / 双池分离。
2. G3-05 金框雕花几何。
3. 书柜架内微层次。
4. 地板缎面高光条（IBL 已跳过）。

## 改动文件

- `Code/public/textures/door/room_floor_lightmap.jpg`
- `Code/public/textures/door/room_floor_ao.jpg`
- `Code/Module/door/scene/useRoomMaterials.js`（floor LM `1.28`，`?v=g3-floor`）
- `Code/Module/door/scene/FlickerLights.jsx`（`floorLit: 1.28`）
- `System_doc/3D美术/第二期/_bake2_floor_pools.py`
- `System_doc/3D美术/第二期/_polish_floor_lightmap.py`
- `System_doc/3D美术/第二期/Bake2气质对照说明.md`
- `System_doc/3D美术/第二期/_mark_bake2_xlsx.py`

## 目标一～三收口（三句）

1. **Bake0 壳 + Bake1 家具 LM/AO 已进网页**，稳定态材质管线锁定（瘦 GLB + JPG UV2）。  
2. **目标三气质主调 + 地板局部重烘已落地**，观感明显好于仅 Bake0；与 v1 仍有灯塘/几何差距但可书面收工。  
3. **目标四明确不做**；G3-05 / 可选 IBL 不阻塞一期收口。
