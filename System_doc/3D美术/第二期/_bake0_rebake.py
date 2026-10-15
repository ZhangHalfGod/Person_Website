# Rebake Bake0 onto UV2 (the first pass baked the overlapping UV1).
import array
import os

import bpy

TEX = r"d:\trae_git\Person_Website\Code\public\textures\door"
RES_NAME = {
    "room_floor_lightmap": "room_floor_lightmap.jpg",
    "room_wall_lightmap": "room_wall_lightmap.jpg",
    "room_floor_ao": "room_floor_ao.jpg",
    "room_wall_ao": "room_wall_ao.jpg",
}


def activate_uv2(objs):
    for obj in objs:
        layer = obj.data.uv_layers.get("UV2")
        if layer is None:
            raise RuntimeError(obj.name + " has no UV2")
        layer.active = True
        layer.active_render = True


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
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.35, 0.18, 0.09, 1)
    bg.inputs[1].default_value = 0.015
    world.light_settings.distance = 0.45


def save_jpg(image, path):
    count = image.size[0] * image.size[1] * 4
    buf = array.array("f", [0.0]) * count
    image.pixels.foreach_get(buf)
    peak = 0.0
    for i in range(0, count, 32):
        peak = max(peak, buf[i], buf[i + 1], buf[i + 2])
    print(image.name, "peak", round(peak, 3))
    if peak > 1.05:
        scale = 0.92 / peak
        for i in range(count):
            buf[i] *= scale
        image.pixels.foreach_set(buf)
        image.update()
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 82
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("wrote", path, os.path.getsize(path))


def bake(objs, image_name, bake_type):
    image = bpy.data.images[image_name]
    mat = bpy.data.materials["Bake0White"]
    tex = next(n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE")
    tex.image = image
    mat.node_tree.nodes.active = tex
    for obj in objs:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        obj.hide_render = False
        obj.select_set(False)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.cycles.use_denoising = True
    scene.render.bake.margin = 8
    scene.render.bake.use_clear = True
    if bake_type == "DIFFUSE":
        scene.render.bake.use_pass_direct = True
        scene.render.bake.use_pass_indirect = True
        scene.render.bake.use_pass_color = False
        bpy.ops.object.bake(type="DIFFUSE")
    else:
        bpy.ops.object.bake(type="AO")
    save_jpg(image, os.path.join(TEX, RES_NAME[image_name]))


def main():
    shell = [o for o in bpy.data.collections["Bake0_Shell"].objects if o.type == "MESH" and o.name.startswith("Bake")]
    floor = [o for o in shell if o.name == "BakeFloor"]
    walls = [o for o in shell if o.name != "BakeFloor" and o.name != "BakeCeilingBounce"]
    activate_uv2(floor + walls)
    tune_lights()
    print("rebake floor light")
    bake(floor, "room_floor_lightmap", "DIFFUSE")
    print("rebake wall light")
    bake(walls, "room_wall_lightmap", "DIFFUSE")
    print("rebake floor ao")
    bake(floor, "room_floor_ao", "AO")
    print("rebake wall ao")
    bake(walls, "room_wall_ao", "AO")
    bpy.ops.wm.save_mainfile()
    print("rebake done")


if __name__ == "__main__":
    main()
