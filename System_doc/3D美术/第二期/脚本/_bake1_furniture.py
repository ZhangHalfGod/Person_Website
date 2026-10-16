# Bake1: furniture UV2 + stable-state Cycles lightmap/AO + lean GLB export.
# Does NOT rebake room_shell. Run inside the live Blender MCP / room_phase2.blend.
#
# Outputs:
#   Code/public/textures/door/{table,stool,bookcase,picture_frame,picture_lamp,table_lamp,ceiling_coffers}_{lightmap,ao}.jpg
#   Code/public/models/{table,stool,bookcase,picture_frame,picture_lamp,table_lamp,ceiling_coffers}.glb  (lean, UV1+UV2)

from __future__ import annotations

import array
import os
from math import pi

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
TEX = os.path.join(ROOT, "Code", "public", "textures", "door")
MODELS = os.path.join(ROOT, "Code", "public", "models")
BLEND = os.path.join(ROOT, "System_doc", "3D美术", "第二期", "room_phase2.blend")

# Web (x,y,z) Y-up → Blender (x,-z,y) Z-up used by Bake0 casters.
ROOM = {
    "table": (0.18, -1.48, 0.0),
    "stools": [(-0.40, -0.76, 0.0), (0.80, -0.90, 0.0), (0.06, -2.26, 0.0)],
    "bookcase": (1.85, -3.78, 0.0),
    # Painting on +X wall: web (HALF_W-0.055, 1.58, 0.28) → Blender (x, -z, y)
    "frame": (3.245, -0.28, 1.58),
    "picture_lamp": (3.245, -0.28, 1.58 + 0.54 + 0.14),
    # Table lamp on tabletop
    "table_lamp": (0.46, -1.42, 0.705),
    "coffers": (0.0, 0.0, 3.18),
}

JOBS = [
    # name, root_empty, res, bake_pos, export_glb, lightmap+ao
    ("table", "TableRoot", 1024, ROOM["table"], "table.glb", True),
    ("stool", "StoolRoot", 512, ROOM["stools"][0], "stool.glb", True),
    ("bookcase", "BookcaseRoot", 1024, ROOM["bookcase"], "bookcase.glb", True),
    ("picture_frame", "FrameRoot", 512, ROOM["frame"], "picture_frame.glb", True),
    ("picture_lamp", "PictureLampRoot", 512, ROOM["picture_lamp"], "picture_lamp.glb", True),
    ("table_lamp", "TableLampRoot", 512, ROOM["table_lamp"], "table_lamp.glb", True),
    ("ceiling_coffers", "CofferRoot", 1024, ROOM["coffers"], "ceiling_coffers.glb", True),
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
    if root.type == "MESH":
        return [root]
    return [o for o in kids(root) if o.type == "MESH"]


def ensure_empty(name):
    obj = bpy.data.objects.get(name)
    if obj is None:
        obj = bpy.data.objects.new(name, None)
        obj.empty_display_size = 0.15
        bpy.context.scene.collection.objects.link(obj)
    return obj


def reparent(obj, parent):
    mw = obj.matrix_world.copy()
    obj.parent = parent
    obj.matrix_world = mw


def repair_hierarchy():
    """Orphaned lamp parts after prior exports — rebuild picture + table lamp roots."""
    pic = ensure_empty("PictureLampRoot")
    pic.location = (0, 0, 0)
    table = ensure_empty("TableLampRoot")
    table.location = (0, 0, 0)

    picture_names = {
        "LampArm",
        "LampBar",
        "LampMount",
        "LampShade",
        "LampShade.001",
    }
    # Procedural table-lamp parts (no corridor pendant numbered names)
    table_prefixes = (
        "LampBase",
        "LampStem",
        "LampFerrule",
        "LampSocket",
        "LampBulb",
        "LampKnurl_",
        "LampShadeCap",
        "LampShadeInner",
        "LampShadeRib_",
        "LampShadeRim",
        "LampShade.002",
        "LampShade.003",
        "PullBead",
        "PullCord",
        "LampShade.00",
    )

    for o in list(bpy.data.objects):
        if o.type != "MESH":
            continue
        if o.name in picture_names or (o.name.startswith("LampShade") and o.name in ("LampShade", "LampShade.001")):
            if not o.name.startswith("LampShade_"):
                reparent(o, pic)
                continue
        if any(o.name.startswith(p) for p in table_prefixes) or o.name in {
            "LampBaseDisc",
            "LampBaseStep",
            "LampFerrule",
            "LampStem",
            "LampSocket",
            "LampBulb",
            "LampShadeCap",
            "LampShadeInner",
            "LampShadeRim",
            "PullBead",
            "PullCord",
        }:
            # skip numbered corridor pendants LampBulb_1_15 etc.
            if "_" in o.name and o.name.split("_")[-1].replace(".", "").isdigit() is False:
                pass
            if any(x in o.name for x in ("_10_", "_13_", "_17_", "_1_", "_20_", "_24_", "_28_", "_3_", "_6_")):
                continue
            if o.name.startswith("LampShade_") and any(c.isdigit() for c in o.name):
                continue
            reparent(o, table)

    # Also catch LampShade.002/.003 and knurls without .001 picture confusion
    for o in list(bpy.data.objects):
        if o.type != "MESH":
            continue
        if o.name.startswith("LampKnurl_") and ".001" not in o.name:
            # table lamp knurls; .001 variants are duplicates — hide later
            if o.parent is None:
                reparent(o, table)
        if o.name in ("LampShade.002", "LampShade.003") and o.parent is None:
            reparent(o, table)

    print(
        "PictureLampRoot meshes",
        len(meshes_of(pic)),
        "TableLampRoot meshes",
        len(meshes_of(table)),
    )
    return pic, table


def hide_noise():
    """Hide duplicates / corridor clutter from the bake."""
    for o in bpy.data.objects:
        hide = False
        if o.name.endswith(".001") or o.name.endswith(".002") or o.name.endswith(".003"):
            hide = True
        if o.name.startswith("InstDoor_") or o.name.startswith("Spot_"):
            hide = True
        if o.name in ("FurnitureKey", "FurnitureFill"):
            hide = True
        if o.name.startswith("LampRod_") or o.name.startswith("LampCanopy_") or o.name.startswith("LampCap_"):
            hide = True
        if o.name.startswith("LampShade_") and any(ch.isdigit() for ch in o.name):
            hide = True
        if o.name.startswith("LampBulb_") and "_" in o.name[8:]:
            hide = True
        if hide:
            o.hide_render = True
            o.hide_viewport = True
        else:
            # ensure bake targets visible later
            pass


def tune_lights():
    energy = {
        "BakeLight_CeilA": 320,
        "BakeLight_CeilB": 240,
        "BakeLight_Picture": 110,
        "BakeLight_Board": 110,
        "BakeLight_Table": 140,
    }
    for name, watts in energy.items():
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "LIGHT":
            obj.data.energy = watts
            obj.hide_render = False
            obj.hide_viewport = False
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("BakeWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.35, 0.18, 0.09, 1)
    bg.inputs[1].default_value = 0.015


def ensure_uv2(meshes):
    if not meshes:
        return
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        if obj.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")
        if "UV2" not in obj.data.uv_layers:
            obj.data.uv_layers.new(name="UV2")
        obj.data.uv_layers["UV2"].active = True
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    # Lightmap pack into UV2
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    try:
        bpy.ops.uv.lightmap_pack(
            PREF_CONTEXT="ALL_FACES",
            PREF_PACK_IN_ONE=True,
            PREF_NEW_UVLAYER=False,
            PREF_APPLY_IMAGE=False,
            PREF_IMG_PX_SIZE=1024,
            PREF_BOX_DIV=12,
            PREF_MARGIN_DIV=0.2,
        )
    except TypeError:
        bpy.ops.uv.lightmap_pack()
    bpy.ops.object.mode_set(mode="OBJECT")
    for obj in meshes:
        obj.data.uv_layers["UV2"].active = True
        if "UVMap" in obj.data.uv_layers:
            # keep UV1 as render default for PBR later; bake uses active UV2
            pass
    print("UV2 packed", [m.name for m in meshes[:4]], "...", len(meshes))


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
    img.colorspace_settings.name = "Linear Rec.709"
    return img


def white_mat(image):
    mat = bpy.data.materials.get("Bake1White")
    if mat is None:
        mat = bpy.data.materials.new("Bake1White")
        mat.use_nodes = True
        nt = mat.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        tex = nt.nodes.new("ShaderNodeTexImage")
        uv = nt.nodes.new("ShaderNodeUVMap")
        uv.uv_map = "UV2"
        bsdf.inputs["Base Color"].default_value = (0.82, 0.78, 0.72, 1)
        bsdf.inputs["Roughness"].default_value = 0.55
        nt.links.new(uv.outputs["UV"], tex.inputs["Vector"])
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        mat.node_tree.nodes.active = tex
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


def save_jpg(image, path):
    normalize_light(image)
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 82
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("jpg", path, os.path.getsize(path))


def bake_targets(meshes, image, bake_type, samples=24):
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
    scene.render.bake.margin = 6
    scene.render.bake.use_clear = True
    if bake_type == "DIFFUSE":
        scene.render.bake.use_pass_direct = True
        scene.render.bake.use_pass_indirect = True
        scene.render.bake.use_pass_color = False
        bpy.ops.object.bake(type="DIFFUSE")
    else:
        bpy.ops.object.bake(type="AO")
    print("baked", bake_type, image.name, "n=", len(meshes))


def export_glb(roots, path):
    bpy.ops.object.select_all(action="DESELECT")
    objs = []
    for root in roots:
        objs.append(root)
        objs.extend(kids(root))
    for o in objs:
        o.hide_viewport = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = roots[0]
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


def set_shell_casters(visible=True):
    col = bpy.data.collections.get("Bake0_Shell")
    if not col:
        return
    for o in col.objects:
        if o.type == "MESH":
            o.hide_render = not visible


def place(root, loc):
    root.location = Vector(loc)
    root.rotation_euler = (0, 0, 0)
    root.scale = (1, 1, 1)


def link_export_collections():
    scene = bpy.context.scene
    for name in (
        "Export_Frame",
        "Export_Coffers",
        "Export_Bookcase",
        "Export_Table",
        "Export_Stool",
        "Export_Lamp",
        "Bake0_Shell",
        "Bake0_Casters",
    ):
        col = bpy.data.collections.get(name)
        if col is None:
            continue
        if col.name not in scene.collection.children:
            try:
                scene.collection.children.link(col)
                print("linked collection", name)
            except RuntimeError as exc:
                print("collection link skip", name, exc)


def main():
    os.makedirs(TEX, exist_ok=True)
    os.makedirs(MODELS, exist_ok=True)
    scene = bpy.context.scene
    print("Bake1 in", scene.name, bpy.data.filepath)

    link_export_collections()
    repair_hierarchy()
    hide_noise()
    tune_lights()
    set_shell_casters(True)

    # Ensure primary roots exist
    for _, root_name, *_ in JOBS:
        if bpy.data.objects.get(root_name) is None and root_name not in ("PictureLampRoot", "TableLampRoot"):
            print("WARN missing", root_name)

    # Extra stool instances as casters (occlusion) — hide from export
    stool = bpy.data.objects.get("StoolRoot")
    caster_stools = []
    if stool:
        for i, loc in enumerate(ROOM["stools"][1:], start=1):
            # temporarily show duplicates if present
            dup = bpy.data.objects.get(f"StoolRoot.00{i}")
            if dup:
                dup.hide_render = False
                dup.location = Vector(loc)
                caster_stools.append(dup)

    for job_name, root_name, res, loc, glb_name, do_light in JOBS:
        root = bpy.data.objects.get(root_name)
        if root is None:
            print("SKIP missing root", root_name)
            continue
        meshes = meshes_of(root)
        if not meshes:
            print("SKIP no meshes", root_name)
            continue
        print("===", job_name, "meshes", len(meshes), "res", res)

        # Origin for UV pack, then move to room for bake
        place(root, (0, 0, 0))
        ensure_uv2(meshes)
        place(root, loc)
        # Frame / picture lamp face into room (-X): rotate like frontend
        if job_name in ("picture_frame", "picture_lamp"):
            root.rotation_euler = (0, 0, pi / 2)
        if job_name == "table_lamp":
            root.rotation_euler = (0, 0, pi / 2)

        for o in meshes:
            o.hide_render = False

        if do_light:
            img_l = new_image(f"{job_name}_lightmap", res)
            img_a = new_image(f"{job_name}_ao", res)
            samples = 16 if res <= 512 else 24
            bake_targets(meshes, img_l, "DIFFUSE", samples=samples)
            save_jpg(img_l, os.path.join(TEX, f"{job_name}_lightmap.jpg"))
            bake_targets(meshes, img_a, "AO", samples=max(12, samples - 4))
            save_jpg(img_a, os.path.join(TEX, f"{job_name}_ao.jpg"))

        # Reset transform for lean export (frontend places them)
        place(root, (0, 0, 0))
        root.rotation_euler = (0, 0, 0)
        export_glb([root], os.path.join(MODELS, glb_name))

    # Hide caster stools again
    for dup in caster_stools:
        dup.hide_render = True

    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    print("Bake1 done, saved", BLEND)


if __name__ == "__main__":
    main()
