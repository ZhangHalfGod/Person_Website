# Bake0: room floor + wall UV2, stable-state Cycles lightmap/AO.
# Also: rounder table legs, a project-original bookcase (no third-party GLB).
# Run inside Blender. Does not embed textures in GLBs.

import os
from math import cos, pi, sin

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
TEX = os.path.join(ROOT, "Code", "public", "textures", "door")
MODELS = os.path.join(ROOT, "Code", "public", "models")
BLEND = os.path.join(ROOT, "System_doc", "3D美术", "第二期", "room_phase2.blend")

ROOM_W, ROOM_D, ROOM_H = 6.6, 8.0, 3.18
HALF_W, HALF_D = ROOM_W / 2, ROOM_D / 2
WAINSCOT_H = 1.48
DOOR_W, DOOR_H, DOOR_X = 0.96, 2.18, 1.58
INSET = 0.012
RES = 2048


def to_bl(p):
    return (p.x, -p.z, p.y)


def collection(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    elif bpy.context.scene.user_of_id and col.name not in bpy.context.scene.collection.children:
        try:
            bpy.context.scene.collection.children.link(col)
        except RuntimeError:
            pass
    return col


def clear_collection(col):
    for obj in list(col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def mesh_obj(name, bm, col):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    return obj


def plane(name, origin, axis_u, axis_v, size_u, size_v, col, uv2_rect):
    bm = bmesh.new()
    o = Vector(origin)
    au = Vector(axis_u)
    av = Vector(axis_v)
    corners = [o, o + au * size_u, o + au * size_u + av * size_v, o + av * size_v]
    verts = [bm.verts.new(to_bl(p)) for p in corners]
    face = bm.faces.new(verts)
    uv_a = bm.loops.layers.uv.new("UVMap")
    uv_b = bm.loops.layers.uv.new("UV2")
    u0, v0, u1, v1 = uv2_rect
    uv1s = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    uv2s = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
    for loop, a, b in zip(face.loops, uv1s, uv2s):
        loop[uv_a].uv = a
        loop[uv_b].uv = b
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    return mesh_obj(name, bm, col)


def sub_rect(rect, a0, a1, b0, b1):
    """Fractions a,b in 0..1 across the rect (u, v)."""
    u0, v0, u1, v1 = rect
    return (
        u0 + (u1 - u0) * a0,
        v0 + (v1 - v0) * b0,
        u0 + (u1 - u0) * a1,
        v0 + (v1 - v0) * b1,
    )


def replace_table_legs():
    """Turn the straight fluted posts into a rounder baluster."""
    profile = (
        (0.00, 0.084),
        (0.10, 0.072),
        (0.24, 0.102),
        (0.42, 0.058),
        (0.58, 0.046),
        (0.74, 0.094),
        (0.90, 0.052),
        (1.00, 0.068),
    )
    segs = 24
    for name in ("TableLeg_-1", "TableLeg_1"):
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            print("skip leg", name)
            continue
        xs = [v.co.x for v in obj.data.vertices]
        ys = [v.co.y for v in obj.data.vertices]
        zs = [v.co.z for v in obj.data.vertices]
        cx = (min(xs) + max(xs)) / 2
        cy = (min(ys) + max(ys)) / 2
        z0, z1 = min(zs), max(zs)
        height = z1 - z0
        bm = bmesh.new()
        rings = []
        for t, radius in profile:
            z = z0 + height * t
            ring = []
            for i in range(segs):
                ang = 2 * pi * i / segs
                ring.append(bm.verts.new((cx + radius * cos(ang), cy + radius * sin(ang), z)))
            rings.append(ring)
        for a, b in zip(rings, rings[1:]):
            for i in range(segs):
                j = (i + 1) % segs
                bm.faces.new((a[i], a[j], b[j], b[i]))
        bottom = rings[0]
        top = rings[-1]
        bm.faces.new(tuple(reversed(bottom)))
        bm.faces.new(tuple(top))
        uv = bm.loops.layers.uv.new("UVMap")
        for face in bm.faces:
            for loop in face.loops:
                loop[uv].uv = ((loop.vert.co.x - cx) * 4 + 0.5, (loop.vert.co.z - z0) / max(height, 1e-6))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(obj.data)
        bm.free()
        obj.data.update()
        print("turned", name, "z", round(z0, 3), round(z1, 3))


def box(name, size, loc, col):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    for v in bm.verts:
        v.co.x = v.co.x * sx + loc[0]
        v.co.y = v.co.y * sy + loc[1]
        v.co.z = v.co.z * sz + loc[2]
    uv = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop in face.loops:
            loop[uv].uv = (loop.vert.co.x + loop.vert.co.y, loop.vert.co.z)
    return mesh_obj(name, bm, col)


def build_bookcase(col):
    clear_collection(col)
    w, d, h = 0.92, 0.36, 2.06
    objs = []
    objs.append(box("BookcasePlinth", (w, d, 0.08), (0, 0, 0.04), col))
    objs.append(box("BookcaseSideL", (0.028, d, h - 0.08), (-w / 2 + 0.014, 0, 0.08 + (h - 0.08) / 2), col))
    objs.append(box("BookcaseSideR", (0.028, d, h - 0.08), (w / 2 - 0.014, 0, 0.08 + (h - 0.08) / 2), col))
    objs.append(box("BookcaseTop", (w, d, 0.03), (0, 0, h - 0.015), col))
    objs.append(box("BookcaseBack", (w - 0.04, 0.018, h - 0.12), (0, -d / 2 + 0.016, h / 2), col))
    shelf_zs = (0.42, 0.78, 1.14, 1.50, 1.84)
    for i, z in enumerate(shelf_zs):
        objs.append(box(f"BookcaseShelf_{i}", (w - 0.06, d - 0.04, 0.02), (0, 0.01, z), col))
    book_rows = (
        (0.50, 5),
        (0.86, 4),
        (1.22, 6),
        (1.58, 3),
    )
    x_cursor_base = -w / 2 + 0.08
    bi = 0
    for z, count in book_rows:
        x = x_cursor_base
        for k in range(count):
            bw = 0.045 + (k % 3) * 0.012
            bh = 0.22 + (k % 2) * 0.04
            objs.append(box(f"BookcaseBook_{bi}", (bw, 0.18, bh), (x + bw / 2, 0.02, z + 0.01 + bh / 2), col))
            x += bw + 0.012
            bi += 1
    root = bpy.data.objects.new("BookcaseRoot", None)
    root.empty_display_size = 0.08
    col.objects.link(root)
    for obj in objs:
        obj.parent = root
    print("bookcase tris", sum(len(o.data.polygons) for o in objs))
    return root


def export_glb(roots, path):
    bpy.ops.object.select_all(action="DESELECT")

    def sel(obj):
        obj.select_set(True)
        for child in obj.children:
            sel(child)

    for root in roots:
        sel(root)
    bpy.context.view_layer.objects.active = roots[0]
    kwargs = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="NONE",
        export_cameras=False,
        export_animations=False,
    )
    try:
        bpy.ops.export_scene.gltf(**kwargs)
    except TypeError:
        kwargs.pop("export_materials", None)
        bpy.ops.export_scene.gltf(**kwargs)
    print("exported", path, os.path.getsize(path))


def build_shell(col):
    clear_collection(col)
    left = (-HALF_W + INSET, 0, 0)
    right = (HALF_W - INSET, 0, 0)
    far = (0, 0, HALF_D - INSET)
    near = (0, 0, -HALF_D + INSET)
    # rects: (u0, v0, u1, v1). v is height fraction, u runs along the wall.
    side = (0.02, 0.02, 0.48, 0.48)
    side_r = (0.52, 0.02, 0.98, 0.48)
    far_r = (0.02, 0.52, 0.48, 0.98)
    door_r = (0.52, 0.52, 0.98, 0.98)
    objs = []

    def wall_span(name, x, z, y0, y1, along, rect, along0, along1, along_min, along_max):
        frac0 = (along0 - along_min) / (along_max - along_min)
        frac1 = (along1 - along_min) / (along_max - along_min)
        uv = sub_rect(rect, frac0, frac1, y0 / ROOM_H, y1 / ROOM_H)
        if along == "z":
            origin = (x, y0, along0 if along0 < along1 else along1)
            # rebuild origin from the low corner of the chosen axis direction
        return uv

    # Left wall, normal +X. Param u walks -Z (z=+4 -> z=-4).
    def add_left(name, y0, y1):
        uv = sub_rect(side, 0, 1, y0 / ROOM_H, y1 / ROOM_H)
        objs.append(
            plane(
                name,
                (-HALF_W + INSET, y0, HALF_D),
                (0, 0, -1),
                (0, 1, 0),
                ROOM_D,
                y1 - y0,
                col,
                uv,
            )
        )

    def add_right(name, y0, y1):
        uv = sub_rect(side_r, 0, 1, y0 / ROOM_H, y1 / ROOM_H)
        objs.append(
            plane(
                name,
                (HALF_W - INSET, y0, -HALF_D),
                (0, 0, 1),
                (0, 1, 0),
                ROOM_D,
                y1 - y0,
                col,
                uv,
            )
        )

    def add_far(name, y0, y1):
        uv = sub_rect(far_r, 0, 1, y0 / ROOM_H, y1 / ROOM_H)
        objs.append(
            plane(
                name,
                (HALF_W, y0, HALF_D - INSET),
                (-1, 0, 0),
                (0, 1, 0),
                ROOM_W,
                y1 - y0,
                col,
                uv,
            )
        )

    def add_door(name, x0, x1, y0, y1):
        uv = sub_rect(door_r, (x0 + HALF_W) / ROOM_W, (x1 + HALF_W) / ROOM_W, y0 / ROOM_H, y1 / ROOM_H)
        objs.append(
            plane(
                name,
                (x0, y0, -HALF_D + INSET),
                (1, 0, 0),
                (0, 1, 0),
                x1 - x0,
                y1 - y0,
                col,
                uv,
            )
        )

    add_left("BakeWainscotL", 0.0, WAINSCOT_H)
    add_left("BakeUpperL", WAINSCOT_H, ROOM_H)
    add_right("BakeWainscotR", 0.0, WAINSCOT_H)
    add_right("BakeUpperR", WAINSCOT_H, ROOM_H)
    add_far("BakeWainscotFar", 0.0, WAINSCOT_H)
    add_far("BakeUpperFar", WAINSCOT_H, ROOM_H)
    gap_l = DOOR_X - DOOR_W / 2
    gap_r = DOOR_X + DOOR_W / 2
    add_door("BakeWainscotDoorL", -HALF_W, gap_l, 0.0, WAINSCOT_H)
    add_door("BakeUpperDoorL", -HALF_W, gap_l, WAINSCOT_H, ROOM_H)
    add_door("BakeWainscotDoorR", gap_r, HALF_W, 0.0, WAINSCOT_H)
    add_door("BakeUpperDoorR", gap_r, HALF_W, WAINSCOT_H, ROOM_H)
    add_door("BakeUpperDoorTop", gap_l, gap_r, DOOR_H, ROOM_H)

    floor_uv = (0.02, 0.02, 0.98, 0.98)
    objs.append(
        plane(
            "BakeFloor",
            (-HALF_W, 0.004, HALF_D),
            (1, 0, 0),
            (0, 0, -1),
            ROOM_W,
            ROOM_D,
            col,
            floor_uv,
        )
    )
    print("shell", [o.name for o in objs])
    return objs


def point_light(name, three_pos, energy, col):
    light = bpy.data.lights.new(name, "POINT")
    light.energy = energy
    light.color = (1.0, 0.68, 0.38)
    light.shadow_soft_size = 0.18
    obj = bpy.data.objects.new(name, light)
    x, y, z = three_pos
    obj.location = (x, -z, y)
    col.objects.link(obj)
    return obj


def duplicate_root(root, col, three_pos):
    objs = [root] + list(root.children_recursive)
    mapping = {}
    for src in objs:
        copy = src.copy()
        col.objects.link(copy)
        mapping[src] = copy
    for src, copy in mapping.items():
        if src.parent in mapping:
            copy.parent = mapping[src.parent]
            copy.matrix_parent_inverse = src.matrix_parent_inverse.copy()
    placed = mapping[root]
    x, y, z = three_pos
    placed.location = (x, -z, y)
    placed.rotation_euler = (0.0, 0.0, 0.0)
    placed.scale = (1.0, 1.0, 1.0)
    return placed


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


def new_image(name):
    old = bpy.data.images.get(name)
    if old:
        bpy.data.images.remove(old)
    img = bpy.data.images.new(name, RES, RES, alpha=False, float_buffer=True)
    img.colorspace_settings.name = "sRGB"
    return img


def normalize_light(image):
    """Keep the bake inside 0–1 so JPEG does not clip the whole room to white."""
    import array

    count = image.size[0] * image.size[1] * 4
    buf = array.array("f", [0.0]) * count
    image.pixels.foreach_get(buf)
    peak = 0.0
    for i in range(0, count, 16):
        peak = max(peak, buf[i], buf[i + 1], buf[i + 2])
    print(image.name, "sample peak", round(peak, 3))
    if peak > 1.05:
        scale = 0.94 / peak
        for i in range(count):
            buf[i] *= scale
        image.pixels.foreach_set(buf)
        image.update()
        print(image.name, "scaled", round(scale, 3))


def save_jpg(image, path):
    normalize_light(image)
    scene = bpy.context.scene
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 82
    image.filepath_raw = path
    image.file_format = "JPEG"
    image.save()
    print("jpg", path, os.path.getsize(path))


def bake_targets(objs, image, bake_type):
    mat = white_mat(image)
    for obj in objs:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    nt = mat.node_tree
    tex = next(n for n in nt.nodes if n.type == "TEX_IMAGE")
    tex.image = image
    nt.nodes.active = tex
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 32
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
    print("baked", bake_type, image.name)


def setup_lights(col):
    for obj in list(col.objects):
        if obj.type == "LIGHT":
            bpy.data.objects.remove(obj, do_unlink=True)
    # Stable state targets from FlickerLights / TableLamp (table lamp defaults on).
    point_light("BakeLight_CeilA", (0.05, ROOM_H - 0.22, 0.15), 80, col)
    point_light("BakeLight_CeilB", (0.10, ROOM_H - 0.28, 1.85), 60, col)
    point_light("BakeLight_Picture", (HALF_W - 0.28, 1.58 + 1.08 / 2 + 0.16, 0.28), 28, col)
    point_light("BakeLight_Board", (-HALF_W + 0.28, 1.52 + 0.98 / 2 + 0.14, 0.72), 30, col)
    point_light("BakeLight_Table", (0.42, 0.76 + 0.25, 1.38), 36, col)
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("BakeWorld")
        bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.22, 0.12, 0.07, 1)
    bg.inputs[1].default_value = 0.06


def hide_preview_lights():
    for name in ("FurnitureKey", "FurnitureFill"):
        obj = bpy.data.objects.get(name)
        if obj:
            obj.hide_render = True


def main():
    os.makedirs(TEX, exist_ok=True)
    os.makedirs(MODELS, exist_ok=True)
    scene = bpy.context.scene
    if scene.name != "RoomFurnitureBuild":
        raise RuntimeError("expected RoomFurnitureBuild, got " + scene.name)

    replace_table_legs()
    table = bpy.data.objects.get("TableRoot")
    # Table lamp is LampRoot.001 (has LampBaseDisc). LampRoot is the picture lamp — do not export that.
    lamp = bpy.data.objects.get("LampRoot.001")
    if lamp is None or bpy.data.objects.get("LampBaseDisc") is None:
        lamp = next(
            (
                o
                for o in bpy.data.objects
                if o.type == "EMPTY"
                and any(c.name.startswith("LampBaseDisc") for c in o.children)
            ),
            None,
        )
    export_glb([table], os.path.join(MODELS, "table.glb"))
    if lamp:
        # Asset origin must stay on the tabletop local (0,0,0). Preview poses get baked by export_apply.
        lamp.location = (0.0, 0.0, 0.0)
        lamp.rotation_euler = (0.0, 0.0, 0.0)
        lamp.scale = (1.0, 1.0, 1.0)
        export_glb([lamp], os.path.join(MODELS, "table_lamp.glb"))

    book_col = collection("Export_Bookcase")
    book = build_bookcase(book_col)
    export_glb([book], os.path.join(MODELS, "bookcase.glb"))

    shell_col = collection("Bake0_Shell")
    shell = build_shell(shell_col)
    floor = [o for o in shell if o.name == "BakeFloor"]
    walls = [o for o in shell if o.name != "BakeFloor"]

    caster_col = collection("Bake0_Casters")
    clear_collection(caster_col)
    duplicate_root(table, caster_col, (0.18, 0.0, 1.48))
    stools = [
        ((-0.40, 0.0, 0.76), "StoolRoot"),
        ((0.80, 0.0, 0.90), "StoolRoot"),
        ((0.06, 0.0, 2.26), "StoolRoot"),
    ]
    stool = bpy.data.objects.get("StoolRoot")
    if stool:
        for pos, _ in stools:
            duplicate_root(stool, caster_col, pos)
    if lamp:
        duplicate_root(lamp, caster_col, (0.42, 0.76, 1.38))
    duplicate_root(book, caster_col, (1.85, 0.0, HALF_D - 0.22))

    # Ceiling bounce so light does not vanish upward. Not exported.
    bounce = plane(
        "BakeCeilingBounce",
        (-HALF_W, ROOM_H - 0.02, -HALF_D),
        (1, 0, 0),
        (0, 0, 1),
        ROOM_W,
        ROOM_D,
        caster_col,
        (0, 0, 1, 1),
    )
    dark = bpy.data.materials.get("BakeCeilingDark") or bpy.data.materials.new("BakeCeilingDark")
    dark.use_nodes = True
    principled = next(n for n in dark.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    principled.inputs["Base Color"].default_value = (0.05, 0.045, 0.04, 1)
    principled.inputs["Roughness"].default_value = 1.0
    bounce.data.materials.append(dark)

    hide_preview_lights()
    setup_lights(shell_col)

    # Casters and bounce stay visible. Shell is the only bake target.
    for obj in list(caster_col.objects) + shell:
        obj.hide_render = False

    floor_light = new_image("room_floor_lightmap")
    floor_ao = new_image("room_floor_ao")
    wall_light = new_image("room_wall_lightmap")
    wall_ao = new_image("room_wall_ao")

    bake_targets(floor, floor_light, "DIFFUSE")
    save_jpg(floor_light, os.path.join(TEX, "room_floor_lightmap.jpg"))
    bake_targets(floor, floor_ao, "AO")
    save_jpg(floor_ao, os.path.join(TEX, "room_floor_ao.jpg"))
    bake_targets(walls, wall_light, "DIFFUSE")
    save_jpg(wall_light, os.path.join(TEX, "room_wall_lightmap.jpg"))
    bake_targets(walls, wall_ao, "AO")
    save_jpg(wall_ao, os.path.join(TEX, "room_wall_ao.jpg"))

    export_glb(shell, os.path.join(MODELS, "room_shell.glb"))
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    print("saved", BLEND)


if __name__ == "__main__":
    main()
