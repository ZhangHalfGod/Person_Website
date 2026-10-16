# OC-02 / G3-05: richer picture-frame + table-leg geometry (no bake).
# Keeps FrameRoot / TableRoot names for frontend materials.
# New topology → UV2 no longer matches old LM (note: need later rebake).

import os
from math import cos, pi, sin

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
MODELS = os.path.join(ROOT, "Code", "public", "models")
PAINT_W, PAINT_H = 0.78, 1.08


def mesh_from_bm(name, bm, col, parent=None):
    # Ensure UV1 + UV2 (simple planar) so export stays UV2-capable
    if "UVMap" not in bm.loops.layers.uv:
        bm.loops.layers.uv.new("UVMap")
    if "UV2" not in bm.loops.layers.uv:
        bm.loops.layers.uv.new("UV2")
    uv1 = bm.loops.layers.uv["UVMap"]
    uv2 = bm.loops.layers.uv["UV2"]
    for face in bm.faces:
        for loop in face.loops:
            co = loop.vert.co
            loop[uv1].uv = (co.x * 2.0 + 0.5, co.z * 2.0 + 0.5)
            loop[uv2].uv = (co.x * 1.2 + 0.5, co.z * 1.2 + 0.5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.update()
    # remove old object with same name under parent
    old = bpy.data.objects.get(name)
    if old is not None:
        bpy.data.objects.remove(old, do_unlink=True)
    obj = bpy.data.objects.new(name, me)
    col.objects.link(obj)
    if parent is not None:
        obj.parent = parent
        obj.matrix_parent_inverse.identity()
    return obj


def box_bm(size, loc=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    ox, oy, oz = loc
    for v in bm.verts:
        v.co.x = v.co.x * sx + ox
        v.co.y = v.co.y * sy + oy
        v.co.z = v.co.z * sz + oz
    return bm


def box(name, size, loc, col, parent=None):
    return mesh_from_bm(name, box_bm(size, loc), col, parent)


def bevel_box(name, size, loc, col, parent=None, width=0.008, segments=2):
    bm = box_bm(size, loc)
    bmesh.ops.bevel(
        bm,
        geom=bm.edges[:],
        offset=width,
        segments=segments,
        affect="EDGES",
    )
    return mesh_from_bm(name, bm, col, parent)


def lathe_leg(name, cx, cy, z0, z1, profile, col, parent, segs=28):
    bm = bmesh.new()
    height = z1 - z0
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
    bm.faces.new(tuple(reversed(rings[0])))
    bm.faces.new(tuple(rings[-1]))
    return mesh_from_bm(name, bm, col, parent)


def collection_of(obj):
    if obj.users_collection:
        return obj.users_collection[0]
    return bpy.context.scene.collection


def clear_children_meshes(root, keep_names=None):
    keep = set(keep_names or [])
    for child in list(root.children_recursive):
        if child.type == "MESH" and child.name not in keep:
            bpy.data.objects.remove(child, do_unlink=True)


def rebuild_frame():
    root = bpy.data.objects.get("FrameRoot")
    if root is None:
        raise RuntimeError("FrameRoot missing")
    col = collection_of(root)
    # Remove old frame meshes
    for child in list(root.children_recursive):
        if child.type == "MESH":
            bpy.data.objects.remove(child, do_unlink=True)

    w, h = PAINT_W, PAINT_H

    def rim(prefix, ow, oh, iw, ih, depth, y):
        """Hollow molding — open center so canvasWhite plane shows through."""
        th = (oh - ih) * 0.5
        tw = (ow - iw) * 0.5
        box(f"{prefix}_T", (ow, depth, th), (0, y, ih * 0.5 + th * 0.5), col, root)
        box(f"{prefix}_B", (ow, depth, th), (0, y, -(ih * 0.5 + th * 0.5)), col, root)
        box(f"{prefix}_L", (tw, depth, ih), (-(iw * 0.5 + tw * 0.5), y, 0), col, root)
        box(f"{prefix}_R", (tw, depth, ih), (iw * 0.5 + tw * 0.5, y, 0), col, root)

    # Stepped gold moldings (outer → lip), hollow — NOT solid panels over the canvas
    rim("FrameOuter", w + 0.22, h + 0.22, w + 0.16, h + 0.16, 0.055, 0.0)
    rim("FrameOuterBead", w + 0.18, h + 0.18, w + 0.13, h + 0.13, 0.04, 0.014)
    rim("FrameMid", w + 0.12, h + 0.12, w + 0.06, h + 0.06, 0.036, 0.024)
    rim("FrameMidBead", w + 0.09, h + 0.09, w + 0.04, h + 0.04, 0.028, 0.034)
    rim("FrameInner", w + 0.04, h + 0.04, w + 0.01, h + 0.01, 0.022, 0.044)
    rim("FrameLip", w + 0.018, h + 0.018, w - 0.01, h - 0.01, 0.012, 0.054)

    # Corner ornaments (larger, stepped blocks + small “scroll” discs)
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        cx = sx * (w / 2 + 0.055)
        cz = sz * (h / 2 + 0.055)
        bevel_box(
            f"FrameCorner_{sx}_{sz}",
            (0.095, 0.07, 0.095),
            (cx, 0.028, cz),
            col,
            root,
            0.01,
            3,
        )
        # Outer leaf / scroll bump
        box(
            f"FrameCornerLeaf_{sx}_{sz}",
            (0.055, 0.05, 0.055),
            (cx + sx * 0.04, 0.036, cz + sz * 0.04),
            col,
            root,
        )
        # Small roundel
        bm = bmesh.new()
        bmesh.ops.create_cone(
            bm, cap_ends=True, cap_tris=False, segments=16, radius1=0.022, radius2=0.022, depth=0.03
        )
        for v in bm.verts:
            # cone along Z → rotate to face out along Y
            x, y, z = v.co.x, v.co.y, v.co.z
            v.co = Vector((x + cx + sx * 0.01, z + 0.055, y + cz + sz * 0.01))
        mesh_from_bm(f"FrameCornerRoundel_{sx}_{sz}", bm, col, root)

    # Mid-rail crests (top/bottom/left/right)
    crests = [
        ("FrameCrest_T", (0.16, 0.055, 0.06), (0, 0.03, h / 2 + 0.07)),
        ("FrameCrest_B", (0.16, 0.055, 0.06), (0, 0.03, -(h / 2 + 0.07))),
        ("FrameCrest_L", (0.06, 0.055, 0.14), (-(w / 2 + 0.07), 0.03, 0)),
        ("FrameCrest_R", (0.06, 0.055, 0.14), (w / 2 + 0.07, 0.03, 0)),
    ]
    for name, size, loc in crests:
        bevel_box(name, size, loc, col, root, 0.008, 2)

    print("frame rebuilt under FrameRoot:", [c.name for c in root.children])


def rebuild_table_legs():
    root = bpy.data.objects.get("TableRoot")
    if root is None:
        raise RuntimeError("TableRoot missing")
    col = collection_of(root)

    # Replace leg shafts + enlarge stepped feet; keep top/apron/stretcher/trestle
    replace_names = {
        "TableLeg_-1",
        "TableLeg_1",
        "TableFootBun_-1",
        "TableFootBun_1",
        "TableFootCollar_-1",
        "TableFootCollar_1",
        "TableFootDisc_-1",
        "TableFootDisc_1",
        "TableCapital_-1",
        "TableCapital_1",
    }
    for child in list(root.children_recursive):
        if child.name in replace_names:
            bpy.data.objects.remove(child, do_unlink=True)

    # Centers from previous AABB (leg axes)
    centers = { -1: (-0.64, 0.0), 1: (0.64, 0.0) }
    # Richer baluster: thick foot flare → waist → bulb → neck → capital
    profile = (
        (0.00, 0.095),
        (0.06, 0.108),
        (0.14, 0.078),
        (0.28, 0.055),
        (0.40, 0.048),
        (0.52, 0.062),
        (0.64, 0.092),
        (0.74, 0.070),
        (0.84, 0.052),
        (0.92, 0.060),
        (1.00, 0.078),
    )
    z0, z1 = 0.12, 0.575  # above stepped plinth, under capital

    for side, (cx, cy) in centers.items():
        lathe_leg(f"TableLeg_{side}", cx, cy, z0, z1, profile, col, root, segs=28)
        # Stepped plinth (closer to v1 heavy foot)
        box(f"TableFootDisc_{side}", (0.28, 0.28, 0.022), (cx, cy, 0.012), col, root)
        bevel_box(
            f"TableFootBun_{side}",
            (0.20, 0.20, 0.055),
            (cx, cy, 0.048),
            col,
            root,
            0.012,
            3,
        )
        box(f"TableFootCollar_{side}", (0.13, 0.13, 0.032), (cx, cy, 0.092), col, root)
        # Capital under apron
        bevel_box(
            f"TableCapital_{side}",
            (0.175, 0.22, 0.055),
            (cx, cy, 0.62),
            col,
            root,
            0.01,
            2,
        )

    # Slightly thicken trestles if present
    for name in ("TableTrestle_-1", "TableTrestle_1"):
        o = bpy.data.objects.get(name)
        if o is None:
            continue
        # leave geometry; optional scale in local X thickness
        print("keep", name)

    print("table legs rebuilt:", [c.name for c in root.children if "Leg" in c.name or "Foot" in c.name or "Capital" in c.name])


def export_lean(root_name, path):
    root = bpy.data.objects.get(root_name)
    if root is None:
        raise RuntimeError(root_name + " missing")
    bpy.ops.object.select_all(action="DESELECT")
    objs = [root] + list(root.children_recursive)
    for o in objs:
        o.hide_viewport = False
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


def main():
    os.makedirs(MODELS, exist_ok=True)
    if bpy.context.scene.name != "RoomFurnitureBuild":
        raise RuntimeError("expected RoomFurnitureBuild")
    rebuild_frame()
    rebuild_table_legs()
    export_lean("FrameRoot", os.path.join(MODELS, "picture_frame.glb"))
    export_lean("TableRoot", os.path.join(MODELS, "table.glb"))
    bpy.ops.wm.save_mainfile()
    print("OC-02 geometry done (no bake)")


if __name__ == "__main__":
    main()
