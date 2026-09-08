# High-detail corridor door: flush leaf, wall-embedded casing, knob + lock.
# Origin = hinge bottom. +X into corridor, +Y along door width, +Z up.
# Run inside Blender via MCP.

import os
from math import pi

import bpy
import bmesh
from mathutils import Matrix, Vector

ROOT = r"d:\trae_git\Person_Website"
MODELS = os.path.join(ROOT, "Code", "public", "models")
TEX = os.path.join(ROOT, "Code", "public", "textures", "Main")
BLEND = os.path.join(ROOT, "System_doc", "3D美术", "第一期", "corridor_phase1.blend")

DOOR_W, DOOR_H, DOOR_T = 0.96, 2.18, 0.07
GAP = 0.003
EMBED = 0.13
PROUD = 0.045
CASING = 0.102
STOP_IN = 0.014
STOP_X1 = -0.048
STILE = 0.118
RAIL_BOT, RAIL_MID, RAIL_TOP = 0.175, 0.145, 0.145
MOLD_W = 0.022
USER_PROMPT = (
    "阅读System_doc中的内容，帮我增加门和门框以及门把、门锁的高清素材建模，"
    "首先门框是嵌入墙体然后凸出来和走廊的左右墙壁大概对齐的位置，"
    "门主体是跟墙壁同一水平线 ，材质需要实木的 。墙壁的木头也需要同色调的 "
    "建模搞得细腻一点。我本地哟blender mcp工具可以使用"
)


def collection(name, clear=True):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    if clear:
        for obj in list(col.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
    return col


def box_uv_bm(bm):
    uv_layer = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        n = face.normal
        ax = abs(n.x), abs(n.y), abs(n.z)
        for loop in face.loops:
            v = loop.vert.co
            if ax[0] >= ax[1] and ax[0] >= ax[2]:
                loop[uv_layer].uv = (v.y, v.z)
            elif ax[1] >= ax[2]:
                loop[uv_layer].uv = (v.x, v.z)
            else:
                loop[uv_layer].uv = (v.x, v.y)


def bevel_bm(bm, offset=0.003, segments=1, profile=0.65):
    if offset <= 0:
        return
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    geom = list(bm.edges)
    try:
        bmesh.ops.bevel(
            bm,
            geom=geom,
            offset=offset,
            offset_type="OFFSET",
            segments=segments,
            profile=profile,
            affect="EDGES",
        )
    except TypeError:
        bmesh.ops.bevel(bm, geom=geom, offset=offset, segments=segments, profile=profile)


def mesh_from_bm(name, bm, col, bevel=0.0, segments=1):
    if bevel > 0:
        bevel_bm(bm, bevel, segments)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    box_uv_bm(bm)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    col.objects.link(obj)
    return obj


def add_box(name, size, loc, col, bevel=0.0025, segments=1):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    sx, sy, sz = size
    loc = Vector(loc)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
        v.co += loc
    return mesh_from_bm(name, bm, col, bevel, segments)


def add_cyl(name, radius, depth, loc, col, axis="X", segs=20, bevel=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=segs, radius1=radius, radius2=radius, depth=depth
    )
    if axis == "X":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(pi / 2, 4, "Y"))
    elif axis == "Y":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(pi / 2, 4, "X"))
    loc = Vector(loc)
    for v in bm.verts:
        v.co += loc
    return mesh_from_bm(name, bm, col, bevel, 1)


def add_sphere(name, radius, loc, col, segs=18):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(10, segs // 2), radius=radius)
    loc = Vector(loc)
    for v in bm.verts:
        v.co += loc
        v.co.x *= 1.0
        v.co.z *= 0.92
    return mesh_from_bm(name, bm, col, 0.0, 1)


def add_rect_frame(name, inner_w, inner_h, frame_w, thick, loc, col, bevel=0.0018):
    bm = bmesh.new()
    hw, hh = inner_w / 2, inner_h / 2
    ow, oh = hw + frame_w, hh + frame_w
    x0, x1 = -thick / 2, thick / 2

    def ring(x, w, h):
        return [
            bm.verts.new((x, -w, -h)),
            bm.verts.new((x, w, -h)),
            bm.verts.new((x, w, h)),
            bm.verts.new((x, -w, h)),
        ]

    a = ring(x0, ow, oh)
    b = ring(x0, hw, hh)
    c = ring(x1, ow, oh)
    d = ring(x1, hw, hh)
    loc = Vector(loc)
    for v in bm.verts:
        v.co += loc

    def quad(v0, v1, v2, v3):
        bm.faces.new((v0, v1, v2, v3))

    for i in range(4):
        j = (i + 1) % 4
        quad(a[i], a[j], b[j], b[i])
        quad(c[j], c[i], d[i], d[j])
        quad(a[j], a[i], c[i], c[j])
        quad(b[i], b[j], d[j], d[i])
    return mesh_from_bm(name, bm, col, bevel, 1)


def load_img(path):
    key = os.path.basename(path)
    img = bpy.data.images.get(key)
    if img is None:
        img = bpy.data.images.load(path)
        img.name = key
    else:
        img.filepath = path
        img.reload()
    return img


def pbr_mat(name, albedo, roughness, normal=None, metallic=0.0, color=(1, 1, 1), uv_scale=(1, 1, 1)):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    texcoord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = uv_scale
    out.location = (420, 0)
    bsdf.location = (120, 0)
    mapping.location = (-480, 0)
    texcoord.location = (-680, 0)
    nt.links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def img_node(fname, non_color, y):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.location = (-280, y)
        n.image = load_img(os.path.join(TEX, fname))
        if non_color:
            n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        return n

    alb = img_node(albedo, False, 180)
    nt.links.new(alb.outputs["Color"], bsdf.inputs["Base Color"])
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.35
    bsdf.inputs["Roughness"].default_value = 0.48
    bsdf.inputs["Metallic"].default_value = metallic
    if roughness:
        r = img_node(roughness, True, -40)
        nt.links.new(r.outputs["Color"], bsdf.inputs["Roughness"])
    if normal:
        nrm = img_node(normal, True, -260)
        nmap = nt.nodes.new("ShaderNodeNormalMap")
        nmap.location = (-40, -260)
        nmap.inputs["Strength"].default_value = 0.85
        nt.links.new(nrm.outputs["Color"], nmap.inputs["Color"])
        nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    return m


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def parent_keep(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def build_door(col, wood, panel_m, brass):
    leaf_root = bpy.data.objects.new("DoorLeaf", None)
    frame_root = bpy.data.objects.new("DoorFrame", None)
    leaf_root.empty_display_size = 0.08
    frame_root.empty_display_size = 0.08
    col.objects.link(leaf_root)
    col.objects.link(frame_root)

    # Door sits on the wall plane; thickness goes into the opening, not the corridor.
    leaf_x1 = -0.008
    leaf_x0 = leaf_x1 - DOOR_T
    leaf_cx = (leaf_x0 + leaf_x1) / 2
    y0, y1 = GAP, DOOR_W - GAP
    z0, z1 = 0.004, DOOR_H - GAP
    cy, cz = (y0 + y1) / 2, (z0 + z1) / 2

    slab = add_box(
        "DoorSlab",
        (DOOR_T, y1 - y0, z1 - z0),
        (leaf_cx, cy, cz),
        col,
        bevel=0.0032,
        segments=2,
    )
    assign(slab, wood)

    inner_w = (y1 - y0) - 2 * STILE
    z_low0 = z0 + RAIL_BOT
    z_low1 = z_low0 + 0.68
    z_mid0 = z_low1
    z_mid1 = z_mid0 + RAIL_MID
    z_up0 = z_mid1
    z_up1 = z1 - RAIL_TOP
    panels = []
    for name, za, zb in (("DoorPanelD", z_low0, z_low1), ("DoorPanelU", z_up0, z_up1)):
        ph = zb - za
        pz = (za + zb) / 2
        pw = inner_w
        recess = 0.018
        panel = add_box(
            name,
            (0.016, pw - 0.04, ph - 0.04),
            (leaf_x1 - recess - 0.008, cy, pz),
            col,
            bevel=0.003,
            segments=1,
        )
        assign(panel, panel_m)
        mold = add_rect_frame(
            name.replace("DoorPanel", "DoorMold"),
            pw - 0.046,
            ph - 0.046,
            MOLD_W,
            0.009,
            (leaf_x1 - 0.006, cy, pz),
            col,
            bevel=0.0016,
        )
        assign(mold, wood)
        back = add_box(
            name + "Back",
            (0.012, pw - 0.05, ph - 0.05),
            (leaf_x0 + 0.010, cy, pz),
            col,
            bevel=0.002,
            segments=1,
        )
        assign(back, panel_m)
        panels.extend([panel, mold, back])

    # Raised stiles / rails on corridor face for a built-up door.
    face_x = leaf_x1 + 0.0045
    stile_bits = []
    for name, size, loc in [
        ("DoorStileHinge", (0.007, STILE, z1 - z0 - 0.01), (face_x, y0 + STILE / 2, cz)),
        ("DoorStileLatch", (0.007, STILE, z1 - z0 - 0.01), (face_x, y1 - STILE / 2, cz)),
        ("DoorRailBot", (0.007, inner_w + 0.01, RAIL_BOT - 0.02), (face_x, cy, z0 + RAIL_BOT / 2)),
        ("DoorRailMid", (0.007, inner_w + 0.01, RAIL_MID), (face_x, cy, (z_mid0 + z_mid1) / 2)),
        ("DoorRailTop", (0.007, inner_w + 0.01, RAIL_TOP - 0.02), (face_x, cy, z1 - RAIL_TOP / 2)),
    ]:
        o = add_box(name, size, loc, col, bevel=0.0018, segments=1)
        assign(o, wood)
        stile_bits.append(o)

    ky = DOOR_W - 0.092
    kz = 1.02
    rose = add_cyl("DoorKnobRose", 0.038, 0.008, (leaf_x1 + 0.005, ky, kz), col, "X", 24, 0.0008)
    rose2 = add_cyl("DoorKnobRoseInner", 0.024, 0.007, (leaf_x1 + 0.011, ky, kz), col, "X", 20, 0.0006)
    neck = add_cyl("DoorKnobNeck", 0.012, 0.032, (leaf_x1 + 0.030, ky, kz), col, "X", 16, 0.0005)
    knob = add_sphere("DoorKnob", 0.042, (leaf_x1 + 0.058, ky, kz), col, 20)
    collar = add_cyl("DoorKnobCollar", 0.016, 0.009, (leaf_x1 + 0.042, ky, kz), col, "X", 16, 0.0004)
    for o in (rose, rose2, neck, knob, collar):
        assign(o, brass)

    lock_z = 1.195
    lock_rose = add_cyl("DoorLockRose", 0.030, 0.007, (leaf_x1 + 0.005, ky, lock_z), col, "X", 20, 0.0006)
    lock_cyl = add_cyl("DoorLockCylinder", 0.018, 0.014, (leaf_x1 + 0.014, ky, lock_z), col, "X", 18, 0.0005)
    lock_face = add_cyl("DoorLockFace", 0.013, 0.004, (leaf_x1 + 0.022, ky, lock_z), col, "X", 16, 0.0)
    lock_pin = add_box("DoorLockPin", (0.005, 0.0035, 0.012), (leaf_x1 + 0.026, ky, lock_z), col, 0.0004, 1)
    for o in (lock_rose, lock_cyl, lock_face, lock_pin):
        assign(o, brass)

    esc_z = 0.84
    esc = add_box("DoorEscutcheon", (0.006, 0.028, 0.052), (leaf_x1 + 0.004, ky, esc_z), col, 0.0022, 2)
    esc_ring = add_cyl("DoorEscutcheonRing", 0.007, 0.004, (leaf_x1 + 0.008, ky, esc_z + 0.008), col, "X", 14, 0.0)
    key_slot = add_box("DoorKeyhole", (0.003, 0.004, 0.014), (leaf_x1 + 0.008, ky, esc_z - 0.006), col, 0.0006, 1)
    for o in (esc, esc_ring, key_slot):
        assign(o, brass)

    plate_y, plate_z = cy, 1.81
    plates = []
    for name, size, loc in [
        ("DoorPlateT", (0.007, 0.30, 0.016), (leaf_x1 + 0.005, plate_y, plate_z + 0.056)),
        ("DoorPlateB", (0.007, 0.30, 0.016), (leaf_x1 + 0.005, plate_y, plate_z - 0.056)),
        ("DoorPlateL", (0.007, 0.016, 0.128), (leaf_x1 + 0.005, plate_y - 0.142, plate_z)),
        ("DoorPlateR", (0.007, 0.016, 0.128), (leaf_x1 + 0.005, plate_y + 0.142, plate_z)),
    ]:
        o = add_box(name, size, loc, col, 0.0012, 1)
        assign(o, brass)
        plates.append(o)

    faceplate = add_box(
        "DoorLockPlate",
        (0.028, 0.004, 0.168),
        (leaf_cx, y1 + 0.001, (kz + lock_z) / 2),
        col,
        0.0008,
        1,
    )
    latch_bolt = add_cyl("DoorLatchBolt", 0.007, 0.016, (leaf_cx, y1 + 0.010, kz), col, "Y", 12, 0.0004)
    dead_bolt = add_box("DoorLockBolt", (0.016, 0.014, 0.010), (leaf_cx, y1 + 0.009, lock_z), col, 0.0006, 1)
    for o in (faceplate, latch_bolt, dead_bolt):
        assign(o, brass)

    hinges = []
    for i, hz in enumerate((0.23, 1.09, 1.90)):
        knuckle = add_cyl(f"DoorHingeKnuckle{i+1}", 0.0075, 0.078, (-0.004, 0.0, hz), col, "Z", 14, 0.0004)
        leaf_a = add_box(
            f"DoorHingeLeaf{i+1}",
            (0.022, 0.003, 0.072),
            (leaf_cx + 0.004, 0.010, hz),
            col,
            0.0006,
            1,
        )
        for o in (knuckle, leaf_a):
            assign(o, brass)
        hinges.extend([knuckle, leaf_a])

    label_anchor = bpy.data.objects.new("LabelAnchor", None)
    label_anchor.empty_display_size = 0.04
    label_anchor.location = (leaf_x1 + 0.012, plate_y, plate_z)
    col.objects.link(label_anchor)

    leaf_objs = (
        [slab]
        + panels
        + stile_bits
        + [rose, rose2, neck, knob, collar, lock_rose, lock_cyl, lock_face, lock_pin, esc, esc_ring, key_slot]
        + plates
        + [faceplate, latch_bolt, dead_bolt]
        + hinges
        + [label_anchor]
    )
    for o in leaf_objs:
        parent_keep(o, leaf_root)

    # Frame: embedded into the wall (–X) then proud to the corridor wall plane (+X).
    x_in, x_out = -EMBED, PROUD
    x_core = (x_in + 0.008) / 2
    core_t = 0.008 - x_in
    jamb_h = DOOR_H + 0.108
    hinge_y = -CASING / 2
    latch_y = DOOR_W + CASING / 2

    jamb_h_obj = add_box(
        "DoorJambHinge",
        (core_t, CASING, jamb_h),
        (x_core, hinge_y, jamb_h / 2),
        col,
        0.0024,
        1,
    )
    jamb_l_obj = add_box(
        "DoorJambLatch",
        (core_t, CASING, jamb_h),
        (x_core, latch_y, jamb_h / 2),
        col,
        0.0024,
        1,
    )
    header = add_box(
        "DoorHeader",
        (core_t, DOOR_W + CASING * 2, 0.108),
        (x_core, DOOR_W / 2, DOOR_H + 0.054),
        col,
        0.0026,
        1,
    )
    for o in (jamb_h_obj, jamb_l_obj, header):
        assign(o, wood)

    stop_h = add_box(
        "DoorJambStopHinge",
        (0.028, STOP_IN + 0.006, DOOR_H - 0.01),
        (STOP_X1, STOP_IN / 2, DOOR_H / 2),
        col,
        0.0014,
        1,
    )
    stop_l = add_box(
        "DoorJambStopLatch",
        (0.028, STOP_IN + 0.006, DOOR_H - 0.01),
        (STOP_X1, DOOR_W - STOP_IN / 2, DOOR_H / 2),
        col,
        0.0014,
        1,
    )
    stop_head = add_box(
        "DoorHeaderStop",
        (0.028, DOOR_W + 0.01, STOP_IN + 0.004),
        (STOP_X1, DOOR_W / 2, DOOR_H - STOP_IN / 2),
        col,
        0.0014,
        1,
    )
    for o in (stop_h, stop_l, stop_head):
        assign(o, wood)

    step1_t = 0.018
    step1_x = 0.008 + step1_t / 2
    cas1_h = add_box(
        "DoorCasingHinge",
        (step1_t, CASING + 0.016, jamb_h + 0.016),
        (step1_x, hinge_y - 0.008, jamb_h / 2 + 0.006),
        col,
        0.0024,
        1,
    )
    cas1_l = add_box(
        "DoorCasingLatch",
        (step1_t, CASING + 0.016, jamb_h + 0.016),
        (step1_x, latch_y + 0.008, jamb_h / 2 + 0.006),
        col,
        0.0024,
        1,
    )
    cas1_head = add_box(
        "DoorHeaderCasing",
        (step1_t, DOOR_W + CASING * 2 + 0.032, 0.096),
        (step1_x, DOOR_W / 2, DOOR_H + 0.074),
        col,
        0.0024,
        1,
    )
    step2_t = PROUD - (0.008 + step1_t)
    step2_x = 0.008 + step1_t + step2_t / 2
    cas2_h = add_box(
        "DoorCasingHingeOuter",
        (step2_t, CASING + 0.034, jamb_h + 0.030),
        (step2_x, hinge_y - 0.017, jamb_h / 2 + 0.010),
        col,
        0.0026,
        2,
    )
    cas2_l = add_box(
        "DoorCasingLatchOuter",
        (step2_t, CASING + 0.034, jamb_h + 0.030),
        (step2_x, latch_y + 0.017, jamb_h / 2 + 0.010),
        col,
        0.0026,
        2,
    )
    cas2_head = add_box(
        "DoorHeaderCasingOuter",
        (step2_t, DOOR_W + CASING * 2 + 0.068, 0.082),
        (step2_x, DOOR_W / 2, DOOR_H + 0.092),
        col,
        0.0026,
        2,
    )
    for o in (cas1_h, cas1_l, cas1_head, cas2_h, cas2_l, cas2_head):
        assign(o, wood)

    plinth_h = add_box(
        "DoorJambPlinthHinge",
        (0.038, 0.118, 0.168),
        (0.010, hinge_y - 0.012, 0.084),
        col,
        0.003,
        2,
    )
    plinth_l = add_box(
        "DoorJambPlinthLatch",
        (0.038, 0.118, 0.168),
        (0.010, latch_y + 0.012, 0.084),
        col,
        0.003,
        2,
    )
    for o in (plinth_h, plinth_l):
        assign(o, wood)

    strike = add_box(
        "DoorStrikePlate",
        (0.032, 0.003, 0.175),
        (leaf_cx, DOOR_W + 0.004, (kz + lock_z) / 2),
        col,
        0.0006,
        1,
    )
    strike_hole = add_box(
        "DoorStrikeLatch",
        (0.018, 0.006, 0.012),
        (leaf_cx, DOOR_W + 0.007, kz),
        col,
        0.0004,
        1,
    )
    for o in (strike, strike_hole):
        assign(o, brass)

    frame_hinges = []
    for i, hz in enumerate((0.23, 1.09, 1.90)):
        leaf_b = add_box(
            f"DoorJambHingeLeaf{i+1}",
            (0.022, 0.003, 0.072),
            (x_core + 0.02, -0.010, hz),
            col,
            0.0006,
            1,
        )
        assign(leaf_b, brass)
        frame_hinges.append(leaf_b)

    frame_objs = [
        jamb_h_obj,
        jamb_l_obj,
        header,
        stop_h,
        stop_l,
        stop_head,
        cas1_h,
        cas1_l,
        cas1_head,
        cas2_h,
        cas2_l,
        cas2_head,
        plinth_h,
        plinth_l,
        strike,
        strike_hole,
        *frame_hinges,
    ]
    for o in frame_objs:
        parent_keep(o, frame_root)

    return leaf_root, frame_root


def count_tris(roots):
    n = 0
    for root in roots:
        for obj in [root] + list(root.children_recursive):
            if obj.type == "MESH":
                n += sum(len(p.vertices) - 2 for p in obj.data.polygons)
    return n


def export_glb(roots, path):
    bpy.ops.object.select_all(action="DESELECT")
    objs = []
    for root in roots:
        root.select_set(True)
        objs.append(root)
        for o in root.children_recursive:
            o.select_set(True)
            objs.append(o)
    bpy.context.view_layer.objects.active = roots[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="NONE",
        export_cameras=False,
        export_extras=False,
        export_animations=False,
        export_skins=False,
    )
    print("exported", path, "bytes", os.path.getsize(path), "objs", len(objs))


def wipe_prefixes(prefixes):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def instance_doors(leaf, frame, dest):
    wipe_prefixes(
        (
            "Door_L_",
            "Door_R_",
            "DoorPanelU_L_",
            "DoorPanelU_R_",
            "DoorPanelD_L_",
            "DoorPanelD_R_",
            "JambA_",
            "JambB_",
            "Header_L_",
            "Header_R_",
            "Knob_L_",
            "Knob_R_",
            "Plate_L_",
            "Plate_R_",
            "InstDoor_",
        )
    )
    for child in list(dest.objects):
        if child.name.startswith("InstDoor_"):
            bpy.data.objects.remove(child, do_unlink=True)

    centers = [
        ("L_0", -2.24, 3.25, 1),
        ("L_2", -2.24, 10.25, 1),
        ("L_4", -2.24, 17.25, 1),
        ("L_6", -2.24, 24.25, 1),
        ("R_1", 2.24, 3.25, -1),
        ("R_3", 2.24, 10.25, -1),
        ("R_5", 2.24, 17.25, -1),
        ("R_7", 2.24, 24.25, -1),
    ]
    src = []

    def gather(o):
        src.append(o)
        for c in o.children:
            gather(c)

    gather(leaf)
    gather(frame)

    for tag, x, y_c, sx in centers:
        mapping = {}
        for o in src:
            no = o.copy()
            if o.data:
                no.data = o.data
            no.name = f"InstDoor_{tag}_{o.name}"
            dest.objects.link(no)
            mapping[o] = no
        for o, no in mapping.items():
            if o.parent in mapping:
                no.parent = mapping[o.parent]
                no.matrix_parent_inverse = o.matrix_parent_inverse.copy()
            else:
                no.parent = None
        y_hinge = y_c - DOOR_W / 2
        for root_src in (leaf, frame):
            nr = mapping[root_src]
            nr.location = (x, y_hinge, 0.0)
            nr.scale = (sx, 1.0, 1.0)


def bind_wall_wood(wood):
    for name in (
        "Wainscot_L",
        "Wainscot_R",
        "Floor",
        "ChairRail_L",
        "ChairRail_R",
        "Base_L",
        "Base_R",
    ):
        obj = bpy.data.objects.get(name)
        if obj and obj.type == "MESH":
            assign(obj, wood)
    for obj in bpy.data.objects:
        if obj.type == "MESH" and obj.name.startswith("Panel_"):
            assign(obj, wood)


def set_collection_visible(name, vis):
    layer = bpy.context.view_layer.layer_collection
    stack = [layer]
    while stack:
        lc = stack.pop()
        if lc.name == name:
            lc.exclude = not vis
            return
        stack.extend(lc.children)


def main():
    os.makedirs(MODELS, exist_ok=True)
    wood = pbr_mat(
        "door_wood",
        "wainscot_albedo.jpg",
        "wainscot_roughness.jpg",
        "wainscot_normal.jpg",
        metallic=0.06,
        color=(0.92, 0.86, 0.78),
        uv_scale=(1.0, 1.0, 1.0),
    )
    wall = pbr_mat(
        "wood_cabinet_worn_long",
        "wainscot_albedo.jpg",
        "wainscot_roughness.jpg",
        "wainscot_normal.jpg",
        metallic=0.06,
        color=(0.92, 0.86, 0.78),
        uv_scale=(14.0, 1.15, 1.0),
    )
    panel_m = pbr_mat(
        "DoorPanelWood",
        "wainscot_albedo.jpg",
        "wainscot_roughness.jpg",
        "wainscot_normal.jpg",
        metallic=0.05,
        color=(0.78, 0.70, 0.60),
        uv_scale=(0.9, 0.9, 1.0),
    )
    brass = pbr_mat(
        "brass_pbr",
        "brass_albedo.jpg",
        "brass_roughness.jpg",
        "brass_normal.jpg",
        metallic=0.9,
        color=(1.0, 0.92, 0.72),
        uv_scale=(2.0, 2.0, 1.0),
    )

    set_collection_visible("Export_Door", True)
    door_col = collection("Export_Door", clear=True)
    leaf, frame = build_door(door_col, wood, panel_m, brass)
    tris = count_tris([leaf, frame])
    print("door tris", tris)
    if tris > 8000:
        raise RuntimeError(f"door over budget: {tris} tris")

    export_glb([leaf, frame], os.path.join(MODELS, "corridor_door.glb"))

    doors_col = bpy.data.collections.get("Doors") or collection("Doors", clear=False)
    instance_doors(leaf, frame, doors_col)
    bind_wall_wood(wall)
    set_collection_visible("Export_Door", False)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    print("saved", BLEND)
    print("done")


main()
