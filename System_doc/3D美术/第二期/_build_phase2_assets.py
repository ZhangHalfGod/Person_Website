# Build Phase-2 room GLBs (geometry only). Run inside Blender via MCP.
import os
from math import pi

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
MODELS = os.path.join(ROOT, "Code", "public", "models")
BLEND = os.path.join(ROOT, "System_doc", "3D美术", "第二期", "room_phase2.blend")
os.makedirs(MODELS, exist_ok=True)

TABLE = dict(w=1.72, d=0.86, h=0.76)
PAINT_W, PAINT_H = 0.78, 1.08
ROOM_W, ROOM_D = 6.6, 8.0


def new_col(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
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


def box(name, size, loc, col):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
        v.co += Vector(loc)
    return mesh_from_bm(name, bm, col)


def cyl(name, r0, r1, depth, loc, col, segs=16, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r0, radius2=r1, depth=depth
    )
    for v in bm.verts:
        v.co += Vector(loc)
    obj = mesh_from_bm(name, bm, col)
    obj.rotation_euler = rot
    return obj


def uv_project(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.03)
    bpy.ops.object.mode_set(mode="OBJECT")


def apply_rot(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        if o.type != "MESH":
            continue
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    if bpy.context.view_layer.objects.active:
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


def export_glb(objs, path):
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
    print("exported", path, os.path.getsize(path))


def parent_empty(name, col, children):
    root = bpy.data.objects.new(name, None)
    root.empty_display_size = 0.08
    col.objects.link(root)
    for o in children:
        mw = o.matrix_world.copy()
        o.parent = root
        o.matrix_world = mw
    return root


def build_table(col):
    w, d, h = TABLE["w"], TABLE["d"], TABLE["h"]
    top_t = 0.08
    top = box("TableTop", (w, d, top_t), (0, 0, h - top_t / 2), col)
    apron = box("TableApron", (w - 0.12, d - 0.12, 0.07), (0, 0, h - top_t - 0.04), col)
    inset = 0.08
    leg_h = h - top_t - 0.02
    legs = []
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        legs.append(
            box(
                f"TableLeg_{sx}_{sy}",
                (0.085, 0.085, leg_h),
                (sx * (w / 2 - inset), sy * (d / 2 - inset), leg_h / 2),
                col,
            )
        )
    objs = [top, apron, *legs]
    for o in objs:
        uv_project(o)
    return parent_empty("TableRoot", col, objs), objs


def build_stool(col):
    seat = box("StoolSeat", (0.36, 0.36, 0.05), (0, 0, 0.47), col)
    legs = []
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (-1, 1), (1, 1))):
        legs.append(box(f"StoolLeg_{i}", (0.045, 0.045, 0.44), (sx * 0.13, sy * 0.13, 0.22), col))
    ring = box("StoolRing", (0.28, 0.28, 0.03), (0, 0, 0.16), col)
    objs = [seat, ring, *legs]
    for o in objs:
        uv_project(o)
    return parent_empty("StoolRoot", col, objs), objs


def build_frame(col):
    w, h = PAINT_W, PAINT_H
    outer = box("FrameOuter", (w + 0.18, 0.055, h + 0.18), (0, 0, 0), col)
    mid = box("FrameMid", (w + 0.12, 0.04, h + 0.12), (0, 0.018, 0), col)
    inner = box("FrameInner", (w + 0.05, 0.028, h + 0.05), (0, 0.032, 0), col)
    lip = box("FrameLip", (w + 0.02, 0.016, h + 0.02), (0, 0.042, 0), col)
    corners = []
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        corners.append(
            box(
                f"FrameCorner_{sx}_{sz}",
                (0.07, 0.06, 0.07),
                (sx * (w / 2 + 0.04), 0.03, sz * (h / 2 + 0.04)),
                col,
            )
        )
    objs = [outer, mid, inner, lip, *corners]
    for o in objs:
        uv_project(o)
    return parent_empty("FrameRoot", col, objs), objs


def build_lamp(col):
    mount = box("LampMount", (0.08, 0.02, 0.12), (0, 0, 0), col)
    arm = box("LampArm", (0.025, 0.16, 0.025), (0, 0.09, 0.02), col)
    bar = box("LampBar", (0.42, 0.025, 0.03), (0, 0.16, 0.06), col)
    shades = []
    for sx in (-0.14, 0.14):
        shades.append(
            cyl("LampShade", 0.05, 0.018, 0.06, (sx, 0.14, 0.09), col, 16, rot=(pi / 2, 0, 0))
        )
    objs = [mount, arm, bar, *shades]
    apply_rot(shades)
    for o in objs:
        uv_project(o)
    return parent_empty("LampRoot", col, objs), objs


def build_coffers(col):
    objs = []
    xs = [-2.2, 0, 2.2]
    zs = [-2.6, -0.8, 1.0, 2.8]
    # Blender Z-up: hang below z=0 so glTF -Y hangs from ceiling
    for i, x in enumerate(xs):
        objs.append(box(f"CofferBeamX_{i}", (0.1, ROOM_D - 0.12, 0.12), (x, 0, -0.06), col))
    for i, y in enumerate(zs):
        objs.append(box(f"CofferBeamZ_{i}", (ROOM_W - 0.12, 0.1, 0.1), (0, y, -0.05), col))
    for i, x in enumerate((-1.1, 1.1)):
        for j, y in enumerate((-1.7, 0.1, 1.9)):
            objs.append(box(f"CofferPanel_{i}_{j}", (1.9, 1.5, 0.04), (x, y, -0.02), col))
    for o in objs:
        uv_project(o)
    return parent_empty("CofferRoot", col, objs), objs


print("=== phase2 assets ===")
bpy.ops.wm.read_homefile(use_empty=True)

tcol = new_col("Export_Table")
troot, _ = build_table(tcol)
export_glb([troot], os.path.join(MODELS, "table.glb"))

scol = new_col("Export_Stool")
sroot, _ = build_stool(scol)
export_glb([sroot], os.path.join(MODELS, "stool.glb"))

fcol = new_col("Export_Frame")
froot, _ = build_frame(fcol)
export_glb([froot], os.path.join(MODELS, "picture_frame.glb"))

lcol = new_col("Export_Lamp")
lroot, _ = build_lamp(lcol)
export_glb([lroot], os.path.join(MODELS, "picture_lamp.glb"))

ccol = new_col("Export_Coffers")
croot, _ = build_coffers(ccol)
export_glb([croot], os.path.join(MODELS, "ceiling_coffers.glb"))

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("saved", BLEND)
print("done")
