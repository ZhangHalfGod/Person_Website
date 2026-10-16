# C3 精装天花：仅重烘 CofferRoot（梁/面板/挡板/口沿）LM+AO，并导出 lean GLB。
# 不烤家具、不烤墙；地板默认不重烤（OC-01 灯塘保留，若 C5 见明显变差再补）。
# Emit 面作发光 caster，不进 LM atlas（防双计）。
#
# Outputs:
#   Code/public/textures/door/ceiling_coffers_{lightmap,ao}.jpg
#   Code/public/models/ceiling_coffers.glb

from __future__ import annotations

import array
import os

import bpy
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
TEX = os.path.join(ROOT, "Code", "public", "textures", "door")
MODELS = os.path.join(ROOT, "Code", "public", "models")

RES = 1024
SAMPLES_LM = 32
SAMPLES_AO = 20
COFFER_Z = 3.18

# Slot centers (Blender local, under CofferRoot at origin): rows y, cols x
SLOT_CENTERS = [
    (-1.10, -1.70),
    (1.10, -1.70),
    (-1.10, 0.10),
    (1.10, 0.10),
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


def receivers(meshes):
    """Bake LM onto beams/panels/baffles/rims — not sky Emit faces."""
    return [m for m in meshes if not is_emit(m.name)]


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


def tune_lights_coffer():
    """
    Moderate ceiling spots (between Bake1 furniture & Bake2 floor pools).
    Soft cool area lights in slots contribute baffle edge light without flooding floor LM.
    """
    energy = {
        "BakeLight_CeilA": 380,
        "BakeLight_CeilB": 300,
        "BakeLight_Picture": 90,
        "BakeLight_Board": 90,
        "BakeLight_Table": 120,
    }
    for name, watts in energy.items():
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            obj.data.energy = watts
            obj.hide_render = False
            obj.hide_viewport = False

    shell = bpy.data.collections.get("Bake0_Shell") or bpy.context.scene.collection
    # Remove prior C3 temps
    for o in list(bpy.data.objects):
        if o.name.startswith("BakeLight_SkySlot"):
            bpy.data.objects.remove(o, do_unlink=True)

    for i, (cx, cy) in enumerate(SLOT_CENTERS):
        name = f"BakeLight_SkySlot_{i}"
        data = bpy.data.lights.new(name, type="AREA")
        obj = bpy.data.objects.new(name, data)
        shell.objects.link(obj)
        data.energy = 45  # soft slot contribution
        data.color = (0.78, 0.86, 0.95)
        data.shape = "RECTANGLE"
        data.size = 1.4
        data.size_y = 0.22
        data.spread = 1.4
        # World: CofferRoot at z=COFFER_Z during bake; opening faces -Z
        obj.location = (cx, cy, COFFER_Z - 0.05)
        obj.rotation_euler = (0, 0, 0)  # area -Z down
        obj.hide_render = False
        obj.hide_viewport = False

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("BakeWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.32, 0.17, 0.09, 1)
    bg.inputs[1].default_value = 0.012


def setup_emit_casters(emit_meshes):
    """Sky Emit as weak emission casters during bake; not bake targets."""
    mat = bpy.data.materials.get("Bake3SkyEmitCaster")
    if mat is None:
        mat = bpy.data.materials.new("Bake3SkyEmitCaster")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        emit = nt.nodes.new("ShaderNodeEmission")
        emit.inputs["Color"].default_value = (0.72, 0.82, 0.92, 1)
        emit.inputs["Strength"].default_value = 2.2
        nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    for obj in emit_meshes:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.hide_render = False
        obj.hide_viewport = False


def ensure_uv2_pack(meshes):
    if not meshes:
        return
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        if obj.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")
        # Drop stale placeholder UV layers on new slot parts; rebuild UV2
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
            PREF_IMG_PX_SIZE=RES,
            PREF_BOX_DIV=12,
            PREF_MARGIN_DIV=0.25,
        )
    except TypeError:
        bpy.ops.uv.lightmap_pack()
    bpy.ops.object.mode_set(mode="OBJECT")
    for obj in meshes:
        obj.data.uv_layers["UV2"].active = True
    print("UV2 packed receivers", len(meshes), [m.name for m in meshes[:6]], "...")


def activate_uv2(meshes):
    for obj in meshes:
        layer = obj.data.uv_layers.get("UV2")
        if layer is None:
            raise RuntimeError(obj.name + " missing UV2")
        layer.active = True
        layer.active_render = True


def new_image(name, res=RES):
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(name, width=res, height=res, alpha=False, float_buffer=True)
    try:
        img.colorspace_settings.name = "Linear Rec.709"
    except Exception:
        pass
    return img


def white_mat(image):
    mat = bpy.data.materials.get("Bake3CofferWhite")
    if mat is None:
        mat = bpy.data.materials.new("Bake3CofferWhite")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        tex = nt.nodes.new("ShaderNodeTexImage")
        uv = nt.nodes.new("ShaderNodeUVMap")
        uv.uv_map = "UV2"
        bsdf.inputs["Base Color"].default_value = (0.82, 0.78, 0.72, 1)
        bsdf.inputs["Roughness"].default_value = 0.6
        nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    tex = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE")
    tex.image = image
    mat.node_tree.nodes.active = tex
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


def save_jpg(image, path, quality=84):
    normalize_light(image)
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = quality
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("jpg", path, os.path.getsize(path))


def bake_targets(meshes, image, bake_type, samples):
    mat = white_mat(image)
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
        if o.name.startswith("BakeLight_SkySlot"):
            bpy.data.objects.remove(o, do_unlink=True)


def main():
    os.makedirs(TEX, exist_ok=True)
    os.makedirs(MODELS, exist_ok=True)
    scene = bpy.context.scene
    print("=== C3 coffer local bake ===", scene.name, bpy.data.filepath)

    root = bpy.data.objects.get("CofferRoot")
    if root is None:
        raise RuntimeError("CofferRoot missing")

    all_meshes = meshes_of(root)
    recv = receivers(all_meshes)
    emit = emitters(all_meshes)
    print("receivers", len(recv), "emit_casters", len(emit))
    if len(recv) < 10:
        raise RuntimeError("too few coffer receivers")

    hide_noise()
    set_shell_casters(True)
    tune_lights_coffer()

    # UV pack at origin, bake at ceiling height
    place(root, (0, 0, 0))
    ensure_uv2_pack(recv)
    place(root, (0, 0, COFFER_Z))
    setup_emit_casters(emit)

    for o in recv + emit:
        o.hide_render = False
        o.hide_viewport = False

    img_l = new_image("ceiling_coffers_lightmap", RES)
    img_a = new_image("ceiling_coffers_ao", RES)

    print("=== DIFFUSE LM ===")
    bake_targets(recv, img_l, "DIFFUSE", samples=SAMPLES_LM)
    save_jpg(img_l, os.path.join(TEX, "ceiling_coffers_lightmap.jpg"))

    print("=== AO ===")
    bake_targets(recv, img_a, "AO", samples=SAMPLES_AO)
    save_jpg(img_a, os.path.join(TEX, "ceiling_coffers_ao.jpg"))

    # Reset for web placement; export UV1+UV2
    place(root, (0, 0, 0))
    export_glb(root, os.path.join(MODELS, "ceiling_coffers.glb"))

    cleanup_temp_lights()
    bpy.ops.wm.save_mainfile()
    print(
        "C3 done | res=%d | LM samples=%d | AO samples=%d | receivers=%d | floor NOT rebaked"
        % (RES, SAMPLES_LM, SAMPLES_AO, len(recv))
    )


if __name__ == "__main__":
    main()
