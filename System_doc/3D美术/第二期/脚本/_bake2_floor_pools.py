# OC-01 / Bake2: local rebake of floor lightmap (+ AO) only.
# Narrower soft spots → two separated elliptical pools (vs merged blob).
# Does NOT rebake walls or furniture.

import array
import os

import bpy

ROOT = r"d:\trae_git\Person_Website"
TEX = os.path.join(ROOT, "Code", "public", "textures", "door")
ROOM_H = 3.18
RES = 2048


def activate_uv2(objs):
    for obj in objs:
        layer = obj.data.uv_layers.get("UV2")
        if layer is None:
            raise RuntimeError(obj.name + " has no UV2")
        layer.active = True
        layer.active_render = True


def ensure_image(name, res=RES):
    old = bpy.data.images.get(name)
    if old and (old.size[0] != res or old.size[1] != res):
        bpy.data.images.remove(old)
        old = None
    if old is None:
        img = bpy.data.images.new(name, res, res, alpha=False, float_buffer=True)
        img.colorspace_settings.name = "sRGB"
        return img
    # Clear to black so bake starts clean
    px = [0.0] * (res * res * 4)
    old.pixels.foreach_set(px)
    old.update()
    return old


def white_mat(image):
    mat = bpy.data.materials.get("Bake0White") or bpy.data.materials.new("Bake0White")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = image
    tex.select = True
    nt.nodes.active = tex
    bsdf.inputs["Base Color"].default_value = (0.82, 0.78, 0.72, 1)
    bsdf.inputs["Roughness"].default_value = 0.85
    bsdf.inputs["Metallic"].default_value = 0.0
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def hide_preview_lights():
    for name in ("FurnitureKey", "FurnitureFill"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True


def set_or_make_spot(name, bl_loc, energy, size, spot_size, spot_blend, col):
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
    light.color = (1.0, 0.74, 0.44)
    light.shadow_soft_size = size
    light.spot_size = spot_size
    light.spot_blend = spot_blend
    light.use_shadow = True
    obj.location = bl_loc
    obj.rotation_euler = (0.0, 0.0, 0.0)  # spot aims local -Z = world -Z
    obj.hide_render = False
    obj.hide_viewport = False
    return obj


def set_point(name, energy, soft=0.25):
    obj = bpy.data.objects.get(name)
    if not obj or obj.type != "LIGHT":
        return
    # Keep as POINT (recreate if was converted)
    if obj.data.type != "POINT":
        bpy.data.objects.remove(obj, do_unlink=True)
        return
    obj.data.energy = energy
    obj.data.color = (1.0, 0.72, 0.42)
    obj.data.shadow_soft_size = soft
    obj.hide_render = False


def tune_lights_for_pools():
    """
    OC-01: narrower cones so CeilA/CeilB stay as TWO ellipses.
    Previous ~1.0 rad (~57°) merged into one blob.
    """
    shell = bpy.data.collections.get("Bake0_Shell")
    if shell is None:
        raise RuntimeError("Bake0_Shell missing")

    # Three.js (x,y,z) → Blender (x, -z, y)
    # Tighter cones (~38–42°), soft blend, moderate soft size
    set_or_make_spot(
        "BakeLight_CeilA",
        (0.05, -0.15, ROOM_H - 0.18),
        energy=1100,
        size=0.42,
        spot_size=0.68,  # ~39°
        spot_blend=0.82,
        col=shell,
    )
    set_or_make_spot(
        "BakeLight_CeilB",
        (0.10, -1.85, ROOM_H - 0.22),
        energy=920,
        size=0.38,
        spot_size=0.62,  # ~35.5°
        spot_blend=0.8,
        col=shell,
    )
    # Mute fill so between-pool floor stays dark
    set_point("BakeLight_Picture", 35, soft=0.2)
    set_point("BakeLight_Board", 35, soft=0.2)
    set_point("BakeLight_Table", 45, soft=0.15)

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("BakeWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.22, 0.11, 0.05, 1)
    bg.inputs[1].default_value = 0.003


def contrast_pools(image):
    """Crush fill, keep soft pool highs — mild so polish can refine ellipses."""
    count = image.size[0] * image.size[1] * 4
    buf = array.array("f", [0.0]) * count
    image.pixels.foreach_get(buf)

    vals = []
    for i in range(0, count, 64):
        vals.append(max(buf[i], buf[i + 1], buf[i + 2]))
    vals.sort()
    lo = vals[max(0, int(len(vals) * 0.12))]
    hi = vals[min(len(vals) - 1, int(len(vals) * 0.985))]
    span = max(1e-4, hi - lo)
    print(image.name, "contrast lo/hi", round(lo, 4), round(hi, 4))

    for i in range(0, count, 4):
        r, g, b = buf[i], buf[i + 1], buf[i + 2]

        def nrm(c):
            return max(0.0, min(1.0, (c - lo) / span))

        rn, gn, bn = nrm(r), nrm(g), nrm(b)

        def curve(t):
            s = t * t * (3.0 - 2.0 * t)
            return pow(s, 0.88)

        buf[i] = curve(rn)
        buf[i + 1] = curve(gn) * 0.9 + curve(rn) * 0.05
        buf[i + 2] = curve(bn) * 0.7
        buf[i + 3] = 1.0

    peak = 0.0
    for i in range(0, count, 16):
        peak = max(peak, buf[i], buf[i + 1], buf[i + 2])
    if peak > 1.0:
        scale = 0.94 / peak
        for i in range(count):
            buf[i] *= scale
        print(image.name, "peak scale", round(scale, 3))

    image.pixels.foreach_set(buf)
    image.update()


def save_jpg(image, path, quality=88):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = quality
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("wrote", path, os.path.getsize(path))


def bake_floor(objs, image, bake_type):
    mat = white_mat(image)
    tex = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE")
    tex.image = image
    mat.node_tree.nodes.active = tex
    for obj in objs:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.hide_render = False
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]

    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    try:
        scene.cycles.device = "CPU"
    except Exception:
        pass
    scene.cycles.samples = 128 if bake_type == "DIFFUSE" else 48
    scene.cycles.use_denoising = True
    # Fewer bounces → less fill between pools
    scene.cycles.max_bounces = 3
    scene.cycles.diffuse_bounces = 2
    scene.render.bake.margin = 16
    scene.render.bake.use_clear = True
    if bake_type == "DIFFUSE":
        scene.render.bake.use_pass_direct = True
        scene.render.bake.use_pass_indirect = True
        scene.render.bake.use_pass_color = False
        bpy.ops.object.bake(type="DIFFUSE")
    else:
        bpy.ops.object.bake(type="AO")
    print("baked", bake_type, image.name)


def main():
    os.makedirs(TEX, exist_ok=True)
    scene = bpy.context.scene
    if scene.name != "RoomFurnitureBuild":
        raise RuntimeError("expected RoomFurnitureBuild, got " + scene.name)

    floor = [bpy.data.objects["BakeFloor"]]
    activate_uv2(floor)

    for col_name in ("Bake0_Casters", "Bake0_Shell"):
        col = bpy.data.collections.get(col_name)
        if not col:
            continue
        for obj in col.objects:
            obj.hide_render = False

    hide_preview_lights()
    tune_lights_for_pools()

    img_l = ensure_image("room_floor_lightmap", RES)
    img_a = ensure_image("room_floor_ao", RES)

    print("=== OC-01 bake floor DIFFUSE (dual ellipses) ===")
    bake_floor(floor, img_l, "DIFFUSE")
    contrast_pools(img_l)
    save_jpg(img_l, os.path.join(TEX, "room_floor_lightmap.jpg"), quality=88)

    print("=== OC-01 bake floor AO ===")
    bake_floor(floor, img_a, "AO")
    save_jpg(img_a, os.path.join(TEX, "room_floor_ao.jpg"), quality=85)

    bpy.ops.wm.save_mainfile()
    print("OC-01 floor pools bake done")


if __name__ == "__main__":
    main()
