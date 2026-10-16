# Bake1 落地说明（2026-10-14）

> 对照 xlsx「目标二_Bake1家具」。主项已落地；**未宣称对齐 room-interior-v1**。  
> 若表状态未自动勾选（xlsx 被 Excel 占用会 PermissionError），先关闭该表再跑：  
> 建议勾：B1-01～B1-10「已完成」；B1-11 验收截图目录保持未做。

## 任务状态建议

| ID | 状态 |
|----|------|
| B1-01～B1-10 | 已完成 |
| B1-11 验收截图目录 | 未做（可选） |

## 产出路径

### 脚本
- `System_doc/3D美术/第二期/脚本/_bake1_furniture.py`

### 贴图 `Code/public/textures/door/`
- `table_lightmap.jpg` / `table_ao.jpg`（1024）
- `stool_lightmap.jpg` / `stool_ao.jpg`（512）
- `bookcase_lightmap.jpg` / `bookcase_ao.jpg`（1024）
- `picture_frame_lightmap.jpg` / `picture_frame_ao.jpg`（512）
- `picture_lamp_lightmap.jpg` / `picture_lamp_ao.jpg`（512）
- `table_lamp_lightmap.jpg` / `table_lamp_ao.jpg`（512）
- `ceiling_coffers_lightmap.jpg` / `ceiling_coffers_ao.jpg`（1024）

### GLB `Code/public/models/`
- 瘦 GLB（UV2，无内嵌色图）：`table.glb` `stool.glb` `bookcase.glb`
  `picture_frame.glb` `picture_lamp.glb` `ceiling_coffers.glb`
- 例外：`table_lamp.glb` = Poly Haven `desk_lamp_arm_01`（内嵌 PBR）+ UV2；  
  LM/AO 仍为独立 JPG `table_lamp_lightmap.jpg` / `table_lamp_ao.jpg`

### 前端
- `Code/Module/door/scene/useRoomMaterials.js`（`*Lit` + LM/AO）
- `Furniture.jsx` `Painting.jsx` `TableLamp.jsx` `RoomInterior.jsx` `FlickerLights.jsx` `bakeMaps.js`
- `Code/public/licenses.txt`

## 约定
- 烘稳定态 Bake Lights（与 Bake0 同一套）。
- 入场仍暗→亮抬实时灯到峰值；家具 LM 强度中等，减轻双计。
- 未重烘 `room_shell`。

## 目标三
见 `Bake2气质对照说明.md`（前端调参为主；地板灯塘若要更贴目标图再局部重烘）。
