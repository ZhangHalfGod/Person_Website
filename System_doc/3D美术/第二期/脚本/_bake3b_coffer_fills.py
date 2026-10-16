# C3b：C1b 填心 + C4 四槽光对齐后的局部重烘。
# Receivers: CofferFill_* / CofferBeam* / CofferPanel_*（远排）
# 不进 LM atlas: SlotPanelEmit（caster）、SlotBaffle/Rim（网页玻璃 transmission 无 LM）
# 另：仅地板补烤（四槽下照替换旧双椭圆锥灯塘）；不烤家具/墙。
#
# Outputs:
#   Code/public/textures/door/ceiling_coffers_{lightmap,ao}.jpg
#   Code/public/textures/door/room_floor_{lightmap,ao}.jpg
#   Code/public/models/ceiling_coffers.glb

from __future__ import annotations

import array
import math
import os

import bpy
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
TEX = os.path.join(ROOT, "Code", "public", "textures", "door")
MODELS = os.path.join(ROOT, "Code", "public", "models")

RES_COFFER = 1024
RES_FLOOR = 2048
SAMPLES_LM = 36
SAMPLES_AO = 22
SAMPLES_FLOOR = 96
COFFER_Z = 3.18
ROOM_H = 3.18

# Web SLOT_LIGHTS → Blender (x, -z, y)
# web (x, y, z) with y≈ROOM_H-0.06 → bl (x, -z, ROOM_H-0.06)
SLOT_LIGHTS_BL = [
    (-1.10, -1.70, ROOM_H - 0.06),
    (1.10, -1.70, ROOM_H - 0.06),
    (-1.10, 0.10, ROOM_H - 0.06),
    (1.10, 0.10, ROOM_H - 0.06),
]


def kids(obj):
    out = []

    def walk(x):
        for c in x.children:
            out.append(c)
            walk(c)

    walk(obj)
    return out


def meshes_of(root):
    return [o for o in kids(root) if o.type == "MESH"]


def is_emit(name: str) -> bool:
    return "SlotPanelEmit" in name or "SlotEmit" in name


def is_glass(name: str) -> bool:
    return "SlotBaffle" in name or "SlotRim" in name


def receivers(meshes):
    """Fills, beams, far panels — not Emit, not glass cover."""
    return [m for m in meshes if not is_emit(m.name) and not is_glass(m.name)]


def emitters(meshes):
    return [m for m in meshes if is_emit(m.name)]


def place(root, loc):
    root.location = Vector(loc)
    root.rotation_euler = (0, 0, 0)
    root.scale = (1, 1, 1)


def hide_noise():
    for o in bpy.data.objects:
        hide = False
        if o.name.endswith((".001", ".002", ".003")):
            hide = True
        if o.name.startswith(("InstDoor_", "Spot_", "LampRod_", "LampCanopy_", "LampCap_")):
            hide = True
        if o.name in ("FurnitureKey", "FurnitureFill"):
            hide = True
        if o.name.startswith("LampShade_") and any(ch.isdigit() for ch in o.name):
            hide = True
        if o.name.startswith("LampBulb_") and "_" in o.name[8:]:
            hide = True
        if hide:
            o.hide_render = True
            o.hide_viewport = True


def set_shell_casters(visible=True):
    for name in ("Bake0_Shell", "Bake0_Casters"):
        col = bpy.data.collections.get(name)
        if not col:
            continue
        for o in col.objects:
            if o.type == "MESH":
                o.hide_render = not visible


def set_or_make_spot(name, bl_loc, energy, size, spot_size, spot_blend, col, color):
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "LIGHT" or obj.data.type != "SPOT":
        if obj is not None:
            bpy.data.objects.remove(obj, do_unlink=True)
        data = bpy.data.lights.new(name, type="SPOT")
        obj = bpy.data.objects.new(name, data)
        col.objects.link(obj)
    light = obj.data
    light.type = "SPOT"
    light.energy = energy
    light.color = color
    light.shadow_soft_size = size
    light.spot_size = spot_size
    light.spot_blend = spot_blend
    light.use_shadow = True
    obj.location = bl_loc
    obj.rotation_euler = (0.0, 0.0, 0.0)  # -Z down
    obj.hide_render = False
    obj.hide_viewport = False
    return obj


def tune_lights_c4_slots(for_floor=False):
    """Align bake spots with C4 SLOT_LIGHTS; mute old CeilA/B cone lamps."""
    shell = bpy.data.collections.get("Bake0_Shell") or bpy.context.scene.collection

    # Hide / mute legacy dual-ellipse cone spots
    for name in ("BakeLight_CeilA", "BakeLight_CeilB"):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            obj.hide_render = True
            obj.data.energy = 1.0

    for name in ("FurnitureKey", "FurnitureFill"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True

    # Remove prior temps
    for o in list(bpy.data.objects):
        if o.name.startswith("BakeLight_SkySlot") or o.name.startswith("BakeLight_C4Slot"):
            bpy.data.objects.remove(o, do_unlink=True)

    # Cool daylight-ish, match web #d8e6f4
    color = (0.85, 0.90, 0.96)
    # Web stable ~6 → Cycles watts scaled for bake readability
    energy = 520 if for_floor else 280
    size = 0.36 if for_floor else 0.28
    spot_size = 0.78  # ~ angle 0.78 rad
    spot_blend = 0.88

    for i, loc in enumerate(SLOT_LIGHTS_BL):
        set_or_make_spot(
            f"BakeLight_C4Slot_{i}",
            loc,
            energy=energy,
            size=size,
            spot_size=spot_size,
            spot_blend=spot_blend,
            col=shell,
            color=color,
        )

    # Accents muted (wash still live on web; don't dominate bake)
    for name, watts in (("BakeLight_Picture", 40), ("BakeLight_Board", 40), ("BakeLight_Table", 55)):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            obj.data.energy = watts
            obj.hide_render = False

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("BakeWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.28, 0.16, 0.09, 1)
    bg.inputs[1].default_value = 0.008


def setup_emit_casters(emit_meshes):
    mat = bpy.data.materials.get("Bake3bSkyEmitCaster")
    if mat is None:
        mat = bpy.data.materials.new("Bake3bSkyEmitCaster")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = (0.78, 0.88, 0.96, 1)
        emit.inputs["Strength"].default_value = 1.8
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    for obj in emit_meshes:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.hide_render = False
        obj.hide_viewport = False


def hide_glass_from_bake(meshes):
    """Glass covers: hide from bake (no LM; avoid black/opaque casting)."""
    for o in meshes:
        if is_glass(o.name):
            o.hide_render = True


def ensure_uv2_pack(meshes, res):
    if not meshes:
        return
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        if obj.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")
        if "UV2" not in obj.data.uv_layers:
            obj.data.uv_layers.new(name="UV2")
        if not obj.data.uv_layers:
            obj.data.uv_layers.new(name="UVMap")
        obj.data.uv_layers["UV2"].active = True
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.lightmap_pack(
            PREF_CONTEXT="ALL_FACES",
            PREF_PACK_IN_ONE=True,
            PREF_NEW_UVLAYER=False,
            PREF_APPLY_IMAGE=False,
            PREF_IMG_PX_SIZE=res,
            PREF_BOX_DIV=12,
            PREF_MARGIN_DIV=0.25,
        )
    except TypeError:
        bpy.ops.uv.lightmap_pack()
    bpy.ops.object.mode_set(mode="OBJECT")
    for obj in meshes:
        obj.data.uv_layers["UV2"].active = True
    print("UV2 packed", len(meshes), [m.name for m in meshes[:8]], "...")


def activate_uv2(meshes):
    for obj in meshes:
        layer = obj.data.uv_layers.get("UV2")
        if layer is None:
            raise RuntimeError(obj.name + " missing UV2")
        layer.active = True
        layer.active_render = True


def new_image(name, res):
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(name, width=res, height=res, alpha=False, float_buffer=True)
    try:
        img.colorspace_settings.name = "Linear Rec.709"
    except Exception:
        pass
    return img


def ensure_image(name, res):
    old = bpy.data.images.get(name)
    if old and (old.size[0] != res or old.size[1] != res):
        bpy.data.images.remove(old)
        old = None
    if old is None:
        return new_image(name, res)
    px = [0.0] * (res * res * 4)
    old.pixels.foreach_set(px)
    old.update()
    return old


def white_mat(image, uv_name="UV2"):
    mat = bpy.data.materials.get("Bake3bWhite")
    if mat is None:
        mat = bpy.data.materials.new("Bake3bWhite")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        tex = nt.nodes.new("ShaderNodeTexImage")
        uv = nt.nodes.new("ShaderNodeUVMap")
        uv.uv_map = uv_name
        bsdf.inputs["Base Color"].default_value = (0.82, 0.78, 0.72, 1)
        bsdf.inputs["Roughness"].default_value = 0.55
        nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    tex = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE")
    tex.image = image
    mat.node_tree.nodes.active = tex
    uv = next((n for n in mat.node_tree.nodes if n.type == "UVMAP"), None)
    if uv:
        uv.uv_map = uv_name
    return mat


def normalize_light(image):
    count = image.size[0] * image.size[1] * 4
    buf = array.array("f", [0.0]) * count
    image.pixels.foreach_get(buf)
    peak = 0.0
    for i in range(0, count, 16):
        peak = max(peak, buf[i], buf[i + 1], buf[i + 2])
    print(image.name, "peak", round(peak, 3))
    if peak > 1.05:
        scale = 0.92 / peak
        for i in range(count):
            buf[i] *= scale
        image.pixels.foreach_set(buf)
        image.update()
        print(image.name, "scaled", round(scale, 3))


def soft_contrast_floor(image):
    """Mild pool contrast — keep four soft spots, avoid crush."""
    count = image.size[0] * image.size[1] * 4
    buf = array.array("f", [0.0]) * count
    image.pixels.foreach_get(buf)
    vals = []
    for i in range(0, count, 64):
        vals.append(max(buf[i], buf[i + 1], buf[i + 2]))
    vals.sort()
    lo = vals[max(0, int(len(vals) * 0.1))]
    hi = vals[min(len(vals) - 1, int(len(vals) * 0.985))]
    span = max(1e-4, hi - lo)
    print(image.name, "floor contrast", round(lo, 4), round(hi, 4))
    for i in range(0, count, 4):
        r, g, b = buf[i], buf[i + 1], buf[i + 2]

        def nrm(c):
            return max(0.0, min(1.0, (c - lo) / span))

        rn, gn, bn = nrm(r), nrm(g), nrm(b)

        def curve(t):
            s = t * t * (3.0 - 2.0 * t)
            return math.pow(s, 0.9)

        # Slight cool bias to match slot daylight
        buf[i] = curve(rn) * 0.92
        buf[i + 1] = curve(gn) * 0.95
        buf[i + 2] = min(1.0, curve(bn) * 1.02)
        buf[i + 3] = 1.0
    peak = 0.0
    for i in range(0, count, 16):
        peak = max(peak, buf[i], buf[i + 1], buf[i + 2])
    if peak > 1.0:
        scale = 0.94 / peak
        for i in range(count):
            buf[i] *= scale
    image.pixels.foreach_set(buf)
    image.update()


def save_jpg(image, path, quality=84):
    normalize_light(image)
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = quality
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("jpg", path, os.path.getsize(path))


def bake_targets(meshes, image, bake_type, samples, uv_name="UV2"):
    mat = white_mat(image, uv_name=uv_name)
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.hide_render = False
        obj.hide_viewport = False
    activate_uv2(meshes)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    try:
        scene.cycles.device = "CPU"
    except Exception:
        pass
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.cycles.diffuse_bounces = 3
    scene.render.bake.margin = 8
    scene.render.bake.use_clear = True
    if bake_type == "DIFFUSE":
        scene.render.bake.use_pass_direct = True
        scene.render.bake.use_pass_indirect = True
        scene.render.bake.use_pass_color = False
        bpy.ops.object.bake(type="DIFFUSE")
    else:
        bpy.ops.object.bake(type="AO")
    print("baked", bake_type, image.name, "n=", len(meshes), "samples=", samples)


def export_glb(root, path):
    bpy.ops.object.select_all(action="DESELECT")
    objs = [root] + kids(root)
    for o in objs:
        o.hide_viewport = False
        o.hide_set(False)
        o.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format="GLB",
        export_texcoords=True,
        export_normals=True,
        export_materials="NONE",
        export_apply=True,
        export_yup=True,
    )
    print("glb", path, os.path.getsize(path))


def cleanup_temp_lights():
    for o in list(bpy.data.objects):
        if o.name.startswith("BakeLight_C4Slot") or o.name.startswith("BakeLight_SkySlot"):
            bpy.data.objects.remove(o, do_unlink=True)


def bake_floor():
    floor = [bpy.data.objects["BakeFloor"]]
    activate_uv2(floor)
    tune_lights_c4_slots(for_floor=True)
    # Coffers as casters at ceiling
    root = bpy.data.objects.get("CofferRoot")
    if root:
        place(root, (0, 0, COFFER_Z))
        for o in meshes_of(root):
            if is_glass(o.name):
                o.hide_render = True
            else:
                o.hide_render = False
        setup_emit_casters(emitters(meshes_of(root)))

    img_l = ensure_image("room_floor_lightmap", RES_FLOOR)
    img_a = ensure_image("room_floor_ao", RES_FLOOR)
    print("=== C3b floor DIFFUSE (4-slot) ===")
    bake_targets(floor, img_l, "DIFFUSE", samples=SAMPLES_FLOOR)
    soft_contrast_floor(img_l)
    # soft_contrast already normalized-ish; save without second hard peak crush
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 88
    img_l.filepath_raw = os.path.join(TEX, "room_floor_lightmap.jpg")
    img_l.file_format = "JPEG"
    img_l.save()
    print("jpg floor LM", os.path.getsize(img_l.filepath_raw))

    print("=== C3b floor AO ===")
    bake_targets(floor, img_a, "AO", samples=48)
    save_jpg(img_a, os.path.join(TEX, "room_floor_ao.jpg"), quality=85)

    if root:
        place(root, (0, 0, 0))


def main():
    os.makedirs(TEX, exist_ok=True)
    os.makedirs(MODELS, exist_ok=True)
    scene = bpy.context.scene
    print("=== C3b coffer fills + floor ===", scene.name, bpy.data.filepath)

    root = bpy.data.objects.get("CofferRoot")
    if root is None:
        raise RuntimeError("CofferRoot missing")

    all_meshes = meshes_of(root)
    recv = receivers(all_meshes)
    emit = emitters(all_meshes)
    print(
        "receivers",
        len(recv),
        [m.name for m in recv],
        "emit",
        len(emit),
        "glass_hidden",
        sum(1 for m in all_meshes if is_glass(m.name)),
    )
    if len(recv) < 8:
        raise RuntimeError("too few coffer receivers")

    hide_noise()
    set_shell_casters(True)
    tune_lights_c4_slots(for_floor=False)

    place(root, (0, 0, 0))
    ensure_uv2_pack(recv, RES_COFFER)
    place(root, (0, 0, COFFER_Z))
    setup_emit_casters(emit)
    hide_glass_from_bake(all_meshes)

    for o in recv + emit:
        o.hide_render = False
        o.hide_viewport = False

    img_l = new_image("ceiling_coffers_lightmap", RES_COFFER)
    img_a = new_image("ceiling_coffers_ao", RES_COFFER)

    print("=== C3b coffer DIFFUSE ===")
    bake_targets(recv, img_l, "DIFFUSE", samples=SAMPLES_LM)
    save_jpg(img_l, os.path.join(TEX, "ceiling_coffers_lightmap.jpg"))

    print("=== C3b coffer AO ===")
    bake_targets(recv, img_a, "AO", samples=SAMPLES_AO)
    save_jpg(img_a, os.path.join(TEX, "ceiling_coffers_ao.jpg"))

    place(root, (0, 0, 0))
    # Unhide glass for export
    for o in all_meshes:
        o.hide_render = False
        o.hide_viewport = False
    export_glb(root, os.path.join(MODELS, "ceiling_coffers.glb"))

    print("=== C3b floor pass ===")
    bake_floor()

    cleanup_temp_lights()
    # Restore Ceil lights visibility (energy left low; bake2 can retune later)
    for name in ("BakeLight_CeilA", "BakeLight_CeilB"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = False

    bpy.ops.wm.save_mainfile()
    print(
        "C3b done | coffer res=%d s=%d/%d recv=%d | floor res=%d s=%d | glass+emit no LM"
        % (RES_COFFER, SAMPLES_LM, SAMPLES_AO, len(recv), RES_FLOOR, SAMPLES_FLOOR)
    )


if __name__ == "__main__":
    main()
