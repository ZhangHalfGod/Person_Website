# Detailed trestle table, rung stool, vintage pull-cord table lamp.
# Geometry-only GLBs. Runs inside the live Blender MCP session
# in a throwaway scene so the corridor file is not overwritten.
import math
import os
from math import pi

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
MODELS = os.path.join(ROOT, "Code", "public", "models")
os.makedirs(MODELS, exist_ok=True)

TABLE = dict(w=1.72, d=0.86, h=0.76)
USER_PROMPT = (
    "阅读System_doc\\door_Page\\room-interior-v1.png 图片，帮我在blender中建模细致的桌子凳子的模型以及台灯在桌子上是一个复古的扇形灯罩包围的灯泡，有个金属的带凹凸圆柱 底座，底座最下面是大圆盘，灯罩里面漏出一个灯线 拉一下台灯开，再拉一下台灯关。"
)


def ensure_object_mode():
    if bpy.context.view_layer.objects.active and bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def new_col(name, scene):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
    if name not in scene.collection.children:
        scene.collection.children.link(col)
    for obj in list(col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    return col


def mesh_from_bm(name, bm, col):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.update()
    obj = bpy.data.objects.new(name, me)
    col.objects.link(obj)
    return obj


def box(name, size, loc, col, bevel=0.0, segs=2):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bevel > 0:
        bm.verts.ensure_lookup_table()
        bm.edges.ensure_lookup_table()
        try:
            bmesh.ops.bevel(
                bm,
                geom=list(bm.edges),
                offset=bevel,
                offset_type="OFFSET",
                segments=segs,
                affect="EDGES",
                profile=0.5,
                clamp_overlap=True,
            )
        except TypeError:
            bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=segs)
    for v in bm.verts:
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def cyl(name, r0, r1, depth, loc, col, segs=24):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r0, radius2=r1, depth=depth
    )
    for v in bm.verts:
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def ico(name, radius, loc, col, scale=(1, 1, 1), subdivisions=2):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    for v in bm.verts:
        v.co.x *= scale[0]
        v.co.y *= scale[1]
        v.co.z *= scale[2]
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def uv_project(obj):
    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.03)
        bpy.ops.object.mode_set(mode="OBJECT")
    except Exception as exc:
        print("uv fail", obj.name, exc)
        if bpy.context.object and bpy.context.object.mode != "OBJECT":
            bpy.ops.object.mode_set(mode="OBJECT")


def apply_rot(objs):
    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")
    active = None
    for o in objs:
        if o.type != "MESH":
            continue
        o.select_set(True)
        active = o
    if active:
        bpy.context.view_layer.objects.active = active
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def tris(objs):
    n = 0
    for o in objs:
        if o.type != "MESH":
            continue
        o.data.calc_loop_triangles()
        n += len(o.data.loop_triangles)
    return n


def export_glb(objs, path):
    ensure_object_mode()
    bpy.ops.object.select_all(action="DESELECT")

    def sel(o):
        o.select_set(True)
        for c in o.children:
            sel(c)

    for o in objs:
        sel(o)
    bpy.context.view_layer.objects.active = objs[0]
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_cameras=False,
        export_animations=False,
    )
    try:
        bpy.ops.export_scene.gltf(export_materials="NONE", **kwargs)
    except TypeError:
        bpy.ops.export_scene.gltf(**kwargs)
    print("exported", path, os.path.getsize(path), "bytes")


def parent_empty(name, col, children):
    root = bpy.data.objects.new(name, None)
    root.empty_display_size = 0.08
    col.objects.link(root)
    for o in children:
        mw = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = mw
    return root


def fluted_post(name, radius, height, loc, col, flutes=8, segs=32):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=radius * 1.04,
        radius2=radius * 0.88,
        depth=height,
    )
    for v in bm.verts:
        rad = math.hypot(v.co.x, v.co.y)
        if rad > 0.002:
            ang = math.atan2(v.co.y, v.co.x)
            ridge = 0.5 + 0.5 * math.cos(ang * flutes)
            k = 1.0 - 0.30 * ((1.0 - ridge) ** 1.1)
            v.co.x *= k
            v.co.y *= k
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def knurled_stem(name, r, h, loc, col, segs=28, rings=16):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r * 0.92, depth=h
    )
    vertical = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > h * 0.15]
    if vertical:
        bmesh.ops.subdivide_edges(bm, edges=vertical, cuts=rings)
    for v in bm.verts:
        rad = math.hypot(v.co.x, v.co.y)
        if rad > r * 0.35:
            ang = math.atan2(v.co.y, v.co.x)
            z01 = (v.co.z + h * 0.5) / max(h, 1e-6)
            knurl = 0.0048 * math.sin(ang * 16) * math.sin(z01 * rings * pi)
            ring = 0.0022 * math.sin(z01 * rings * 2 * pi)
            scale = (rad + knurl + ring) / rad
            v.co.x *= scale
            v.co.y *= scale
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def fan_shade(name, r_bot, r_top, depth, loc, col, segs=60, pleats=10, inner=False):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r_bot, radius2=r_top, depth=depth
    )
    vertical = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > depth * 0.2]
    if vertical:
        bmesh.ops.subdivide_edges(bm, edges=vertical, cuts=6)
    for v in bm.verts:
        rad = math.hypot(v.co.x, v.co.y)
        if rad < 0.002:
            v.co += Vector(loc)
            continue
        ang = math.atan2(v.co.y, v.co.x)
        u = (ang / (2 * pi)) * pleats
        frac = u - math.floor(u)
        tri = frac * 2 if frac < 0.5 else (1 - frac) * 2
        k = 0.66 + 0.36 * (tri ** 0.65)
        z01 = (v.co.z + depth * 0.5) / max(depth, 1e-6)
        if z01 < 0.22:
            k *= 1.0 + 0.10 * math.cos(ang * pleats)
        if inner:
            k *= 0.93
        v.co.x *= k
        v.co.y *= k
        v.co += Vector(loc)
    obj = mesh_from_bm(name, bm, col)
    if inner:
        obj.data.flip_normals()
    return obj


def build_table(col):
    w, d, h = TABLE["w"], TABLE["d"], TABLE["h"]
    top_t = 0.078
    top = box("TableTop", (w, d, top_t), (0, 0, h - top_t / 2), col, bevel=0.006, segs=2)
    apron = box(
        "TableApron",
        (w - 0.10, d - 0.10, 0.055),
        (0, 0, h - top_t - 0.03),
        col,
        bevel=0.004,
        segs=1,
    )
    objs = [top, apron]
    trestle_x = w / 2 - 0.22
    for sx in (-1, 1):
        x = sx * trestle_x
        objs.append(cyl(f"TableFootDisc_{sx}", 0.12, 0.108, 0.018, (x, 0, 0.01), col, 28))
        objs.append(ico(f"TableFootBun_{sx}", 0.092, (x, 0, 0.048), col, scale=(1, 1, 0.55), subdivisions=2))
        objs.append(cyl(f"TableFootCollar_{sx}", 0.058, 0.05, 0.028, (x, 0, 0.088), col, 20))
        objs.append(fluted_post(f"TableLeg_{sx}", 0.068, 0.46, (x, 0, 0.34), col, flutes=8, segs=32))
        objs.append(
            box(
                f"TableCapital_{sx}",
                (0.16, 0.20, 0.048),
                (x, 0, h - top_t - 0.058),
                col,
                bevel=0.005,
                segs=1,
            )
        )
        objs.append(
            box(
                f"TableTrestle_{sx}",
                (0.07, 0.42, 0.055),
                (x, 0, 0.125),
                col,
                bevel=0.004,
                segs=1,
            )
        )
    objs.append(
        box("TableStretcher", (trestle_x * 2 - 0.04, 0.075, 0.058), (0, 0, 0.125), col, bevel=0.005, segs=1)
    )
    for o in objs:
        uv_project(o)
    return parent_empty("TableRoot", col, objs), objs


def build_stool(col):
    seat_h = 0.48
    seat_t = 0.05
    seat = box("StoolSeat", (0.38, 0.38, seat_t), (0, 0, seat_h - seat_t / 2), col, bevel=0.006, segs=2)
    objs = [seat]
    thick = 0.042
    top_s, bot_s = 0.118, 0.158
    legs = []
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        top = Vector((sx * top_s, sy * top_s, seat_h - seat_t))
        bot = Vector((sx * bot_s, sy * bot_s, 0.012))
        mid = (top + bot) * 0.5
        direction = top - bot
        length = direction.length
        leg = box(f"StoolLeg_{i}", (thick, thick, length), (0, 0, 0), col, bevel=0.002, segs=1)
        leg.location = mid
        leg.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
        legs.append(leg)
        objs.append(leg)
    apply_rot(legs)
    rung_z = 0.135
    t = (rung_z - 0.012) / (seat_h - seat_t - 0.012)
    span = bot_s + (top_s - bot_s) * t
    for i, sy in enumerate((-1, 1)):
        objs.append(
            box(f"StoolRungX_{i}", (span * 2 - 0.02, 0.028, 0.028), (0, sy * span, rung_z), col, bevel=0.002, segs=1)
        )
    for i, sx in enumerate((-1, 1)):
        objs.append(
            box(f"StoolRungY_{i}", (0.028, span * 2 - 0.02, 0.028), (sx * span, 0, rung_z), col, bevel=0.002, segs=1)
        )
    for o in objs:
        uv_project(o)
    return parent_empty("StoolRoot", col, objs), objs


def build_table_lamp(col):
    # Origin sits on the tabletop. Wide shade mouth is -Z in Blender (down after Y-up).
    disc = cyl("LampBaseDisc", 0.118, 0.108, 0.016, (0, 0, 0.008), col, 40)
    step = cyl("LampBaseStep", 0.058, 0.048, 0.014, (0, 0, 0.022), col, 28)
    stem = knurled_stem("LampStem", 0.023, 0.152, (0, 0, 0.108), col, segs=32, rings=18)
    knurls = []
    for i in range(11):
        z = 0.042 + i * 0.0125
        knurls.append(cyl(f"LampKnurl_{i}", 0.0265, 0.0265, 0.0032, (0, 0, z), col, 28))
    ferrule = cyl("LampFerrule", 0.02, 0.017, 0.022, (0, 0, 0.192), col, 16)
    socket = cyl("LampSocket", 0.015, 0.014, 0.03, (0, 0, 0.218), col, 16)
    shade_z = 0.268
    shade_d = 0.118
    shade_outer = fan_shade("LampShade", 0.118, 0.032, shade_d, (0, 0, shade_z), col, segs=60, pleats=10, inner=False)
    shade_inner = fan_shade("LampShadeInner", 0.118, 0.032, shade_d, (0, 0, shade_z), col, segs=60, pleats=10, inner=True)
    rim = cyl("LampShadeRim", 0.122, 0.118, 0.007, (0, 0, shade_z - shade_d / 2 + 0.005), col, 40)
    cap = cyl("LampShadeCap", 0.038, 0.02, 0.016, (0, 0, shade_z + shade_d / 2 - 0.002), col, 20)
    bulb = ico("LampBulb", 0.024, (0, 0, 0.248), col, scale=(1, 1, 1.12), subdivisions=2)
    ribs = []
    for i in range(10):
        ang = i * (2 * pi / 10)
        rib = box(
            f"LampShadeRib_{i}",
            (0.006, 0.078, 0.11),
            (math.cos(ang) * 0.072, math.sin(ang) * 0.072, shade_z),
            col,
            bevel=0.001,
            segs=1,
        )
        rib.rotation_euler = (0, 0, ang)
        ribs.append(rib)
    apply_rot(ribs)
    cord_x = 0.048
    cord_top = shade_z + 0.01
    cord_bot = 0.042
    cord_len = cord_top - cord_bot
    cord = cyl("PullCord", 0.0042, 0.0042, cord_len, (cord_x, 0.0, (cord_top + cord_bot) / 2), col, 12)
    bead = ico("PullBead", 0.013, (cord_x, 0.0, 0.028), col, scale=(0.82, 0.82, 1.4), subdivisions=2)
    objs = [
        disc,
        step,
        stem,
        *knurls,
        ferrule,
        socket,
        shade_outer,
        shade_inner,
        rim,
        cap,
        bulb,
        *ribs,
        cord,
        bead,
    ]
    for o in objs:
        uv_project(o)
    return parent_empty("LampRoot", col, objs), objs


def setup_preview_camera(scene, table_h):
    cam = bpy.data.cameras.new("FurniturePreviewCam")
    cam.lens = 35
    obj = bpy.data.objects.new("FurniturePreviewCam", cam)
    scene.collection.objects.link(obj)
    obj.location = (1.15, -1.55, 1.35)
    direction = Vector((0.18, 0.1, 0.55)) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    scene.camera = obj
    world = bpy.data.worlds.new("FurniturePreviewWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.08, 0.07, 0.06, 1)
    bg.inputs[1].default_value = 0.4
    scene.world = world
    light_data = bpy.data.lights.new("FurnitureKey", "AREA")
    light_data.energy = 80
    light_data.size = 1.2
    light = bpy.data.objects.new("FurnitureKey", light_data)
    scene.collection.objects.link(light)
    light.location = (0.4, -0.8, 2.2)
    light.rotation_euler = (0.7, 0.1, 0.2)
    fill_data = bpy.data.lights.new("FurnitureFill", "POINT")
    fill_data.energy = 40
    fill_data.color = (1.0, 0.82, 0.62)
    fill = bpy.data.objects.new("FurnitureFill", fill_data)
    scene.collection.objects.link(fill)
    fill.location = (0.7, 0.2, table_h + 0.28)
    print("preview camera ready", USER_PROMPT[:8])


def rebuild_and_export(scene=None):
    print("=== table / stool / lamp ===")
    print("current file", bpy.data.filepath)
    old_scene = bpy.context.window.scene
    if scene is None:
        scene = bpy.data.scenes.get("RoomFurnitureBuild")
        if scene is None:
            scene = bpy.data.scenes.new("RoomFurnitureBuild")
    bpy.context.window.scene = scene

    tcol = new_col("Export_Table", scene)
    troot, tobjs = build_table(tcol)
    print("table tris", tris(tobjs))
    export_glb([troot], os.path.join(MODELS, "table.glb"))

    scol = new_col("Export_Stool", scene)
    sroot, sobjs = build_stool(scol)
    print("stool tris", tris(sobjs))
    export_glb([sroot], os.path.join(MODELS, "stool.glb"))

    lcol = new_col("Export_TableLamp", scene)
    lroot, lobjs = build_table_lamp(lcol)
    print("lamp tris", tris(lobjs))
    print("lamp names", [o.name for o in lobjs])
    export_glb([lroot], os.path.join(MODELS, "table_lamp.glb"))

    sroot.location = (-0.58, -0.72, 0)
    lroot.location = (0.52, -0.18, TABLE["h"])
    if scene.camera is None or scene.camera.name != "FurniturePreviewCam":
        setup_preview_camera(scene, TABLE["h"])
    else:
        scene.camera.location = (0.95, -0.85, 1.18)
        direction = Vector((0.52, -0.18, 0.95)) - scene.camera.location
        scene.camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    print("old scene was", old_scene.name)
    print("done")
    return scene


if __name__ == "__main__":
    rebuild_and_export()
