# Build corridor_door.glb + ceiling_pendant.glb and fix whitebox lamp orientation.
# Run inside Blender via MCP.

import os
from math import atan2, pi

import bpy
import bmesh
from mathutils import Vector

ROOT = r"d:\trae_git\Person_Website"
MODELS = os.path.join(ROOT, "Code", "public", "models")
TEX = os.path.join(ROOT, "Code", "public", "textures", "Main")
BLEND = os.path.join(ROOT, "System_doc", "3D美术", "第一期", "corridor_phase1.blend")
os.makedirs(MODELS, exist_ok=True)

HEIGHT = 3.55
SHADE_H = 0.14
SHADE_TOP_R = 0.055
SHADE_BOT_R = 0.30
ROD_LEN = 0.35
CORD_R = 0.012
DOOR_W, DOOR_H, DOOR_T = 0.96, 2.18, 0.07


def clear_by_prefix(*prefixes):
    for obj in list(bpy.data.objects):
        if obj.name.startswith(prefixes):
            bpy.data.objects.remove(obj, do_unlink=True)


def new_mesh(name, bm, collection):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def box_bm(size, loc=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
        v.co += Vector(loc)
    return bm


def mat(name, **kw):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    principled = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    if "color" in kw:
        principled.inputs["Base Color"].default_value = (*kw["color"], 1)
    if "roughness" in kw:
        principled.inputs["Roughness"].default_value = kw["roughness"]
    if "metalness" in kw:
        principled.inputs["Metallic"].default_value = kw["metalness"]
    if "emission" in kw:
        # Blender 4+/5 emission is on Principled
        if "Emission Color" in principled.inputs:
            principled.inputs["Emission Color"].default_value = (*kw["emission"], 1)
        if "Emission Strength" in principled.inputs:
            principled.inputs["Emission Strength"].default_value = kw.get("emission_strength", 0.3)
    return m


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def load_img(path):
    img = bpy.data.images.get(os.path.basename(path))
    if img is None:
        img = bpy.data.images.load(path)
    else:
        img.reload()
    return img


def brass_mat():
    name = "brass_pbr"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    texcoord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    nt.links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])
    mapping.location = (-600, 0)
    bsdf.location = (0, 0)
    out.location = (300, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def img_node(fname, non_color=True):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = load_img(os.path.join(TEX, fname))
        if non_color:
            n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        return n

    alb = img_node("brass_albedo.png", non_color=False)
    rough = img_node("brass_roughness.png")
    metal = img_node("brass_metalness.png")
    nrm = img_node("brass_normal.png")
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(alb.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    nt.links.new(metal.outputs["Color"], bsdf.inputs["Metallic"])
    nt.links.new(nrm.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def wood_mat():
    name = "door_wood"
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    texcoord = nt.nodes.new("ShaderNodeTexCoord")
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (1.15, 2.15, 1)
    nt.links.new(texcoord.outputs["UV"], mapping.inputs["Vector"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def img_node(fname, non_color=True):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = load_img(os.path.join(TEX, fname))
        if non_color:
            n.image.colorspace_settings.name = "Non-Color"
        nt.links.new(mapping.outputs["Vector"], n.inputs["Vector"])
        return n

    alb = img_node("wainscot_albedo.jpg", non_color=False)
    rough = img_node("wainscot_roughness.jpg")
    nrm = img_node("wainscot_normal.jpg")
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(alb.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    nt.links.new(nrm.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    bsdf.inputs["Metallic"].default_value = 0.08
    return m


def collection(name):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    for obj in list(col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    return col


def cone_open(name, r_bottom, r_top, depth, segs, loc, collection):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=False,
        cap_tris=False,
        segments=segs,
        radius1=r_bottom,
        radius2=r_top,
        depth=depth,
    )
    for v in bm.verts:
        v.co += Vector(loc)
    obj = new_mesh(name, bm, collection)
    return obj


def disk(name, radius, loc, collection, segs=32):
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=segs, radius=radius)
    for v in bm.verts:
        v.co += Vector(loc)
    return new_mesh(name, bm, collection)


def cyl(name, r_bottom, r_top, depth, loc, collection, segs=24):
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=r_bottom,
        radius2=r_top,
        depth=depth,
    )
    for v in bm.verts:
        v.co += Vector(loc)
    return new_mesh(name, bm, collection)


def uv_sphere(name, radius, loc, collection, segs=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(8, segs // 2), radius=radius)
    for v in bm.verts:
        v.co += Vector(loc)
    return new_mesh(name, bm, collection)


def torus(name, major, minor, loc, collection, major_seg=32, minor_seg=10):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major,
        minor_radius=minor,
        major_segments=major_seg,
        minor_segments=minor_seg,
        location=loc,
        rotation=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = name
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def smart_uv(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def export_glb(objs, path, names=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_tangents=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_extras=False,
        export_animations=False,
    )
    print("exported", path, "bytes", os.path.getsize(path))


def build_pendant(col):
    shade_outer = mat(
        "PendantShadeOuter", color=(0.11, 0.09, 0.07), roughness=0.88, metalness=0.08
    )
    shade_inner = mat(
        "PendantShadeInner",
        color=(0.79, 0.63, 0.41),
        roughness=0.35,
        metalness=0.12,
        emission=(1.0, 0.60, 0.29),
        emission_strength=0.28,
    )
    canopy_m = mat("PendantCanopy", color=(0.35, 0.30, 0.24), roughness=0.45, metalness=0.42)
    cord_m = mat("PendantCord", color=(0.54, 0.48, 0.42), roughness=0.52, metalness=0.18)
    brass = brass_mat()

    # Origin at ceiling. Hang toward -Z.
    shade_center_z = -(ROD_LEN + SHADE_H / 2)
    shade_top_z = -ROD_LEN
    shade_bot_z = -(ROD_LEN + SHADE_H)

    outer = cone_open("ShadeOuter", SHADE_BOT_R, SHADE_TOP_R, SHADE_H, 48, (0, 0, shade_center_z), col)
    inner = cone_open("ShadeInner", SHADE_BOT_R - 0.004, SHADE_TOP_R - 0.003, SHADE_H - 0.004, 48, (0, 0, shade_center_z), col)
    # flip inner normals
    bpy.ops.object.select_all(action="DESELECT")
    inner.select_set(True)
    bpy.context.view_layer.objects.active = inner
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode="OBJECT")

    cap = disk("ShadeCap", SHADE_TOP_R + 0.01, (0, 0, shade_top_z + 0.002), col, 32)
    rim = torus("ShadeRim", SHADE_BOT_R, 0.01, (0, 0, shade_bot_z), col, 40, 8)
    collar = cyl("ShadeCollar", SHADE_TOP_R + 0.018, SHADE_TOP_R + 0.01, 0.022, (0, 0, shade_top_z + 0.011), col, 24)
    canopy = cyl("Canopy", 0.09, 0.08, 0.032, (0, 0, -0.016), col, 24)
    canopy_nip = cyl("CanopyNipple", 0.022, 0.018, 0.016, (0, 0, -0.036), col, 12)
    cord = cyl("Cord", CORD_R, CORD_R, ROD_LEN, (0, 0, -ROD_LEN / 2), col, 12)
    cord_ferrule = cyl("CordFerrule", 0.014, 0.012, 0.02, (0, 0, shade_top_z + 0.01), col, 12)

    assign(outer, shade_outer)
    assign(inner, shade_inner)
    assign(cap, shade_outer)
    assign(rim, mat("PendantRim", color=(0.16, 0.14, 0.11), roughness=0.32, metalness=0.55))
    assign(collar, brass)
    assign(canopy, canopy_m)
    assign(canopy_nip, brass)
    assign(cord, cord_m)
    assign(cord_ferrule, brass)

    objs = [outer, inner, cap, rim, collar, canopy, canopy_nip, cord, cord_ferrule]
    for o in objs:
        smart_uv(o)
    return objs


def build_door(col):
    wood = wood_mat()
    brass = brass_mat()
    panel_m = mat("DoorPanelWood", color=(0.42, 0.32, 0.24), roughness=0.55, metalness=0.05)

    # Local, origin = hinge bottom. +X into corridor, +Y along corridor (width), +Z up.
    leaf = new_mesh(
        "DoorLeaf",
        box_bm((DOOR_T, DOOR_W, DOOR_H), (DOOR_T / 2, DOOR_W / 2, DOOR_H / 2)),
        col,
    )
    # Recessed panels on corridor face
    panel_u = new_mesh(
        "DoorPanelU",
        box_bm((0.012, 0.62, 0.72), (DOOR_T + 0.006, DOOR_W / 2, 1.47)),
        col,
    )
    panel_d = new_mesh(
        "DoorPanelD",
        box_bm((0.012, 0.62, 0.72), (DOOR_T + 0.006, DOOR_W / 2, 0.67)),
        col,
    )
    # Raised stiles around panels (thin frames)
    stile_bits = []
    for name, size, loc in [
        ("DoorRailMid", (0.018, 0.70, 0.08), (DOOR_T + 0.004, DOOR_W / 2, 1.09)),
        ("DoorRailTop", (0.018, 0.70, 0.08), (DOOR_T + 0.004, DOOR_W / 2, 1.90)),
        ("DoorRailBot", (0.018, 0.70, 0.08), (DOOR_T + 0.004, DOOR_W / 2, 0.24)),
        ("DoorStileL", (0.018, 0.07, 1.90), (DOOR_T + 0.004, DOOR_W / 2 - 0.34, 1.09)),
        ("DoorStileR", (0.018, 0.07, 1.90), (DOOR_T + 0.004, DOOR_W / 2 + 0.34, 1.09)),
    ]:
        o = new_mesh(name, box_bm(size, loc), col)
        assign(o, wood)
        stile_bits.append(o)

    knob_back = cyl("DoorKnobRose", 0.028, 0.028, 0.01, (DOOR_T + 0.012, DOOR_W * 0.78, 1.01), col, 16)
    knob_neck = cyl("DoorKnobNeck", 0.012, 0.012, 0.03, (DOOR_T + 0.03, DOOR_W * 0.78, 1.01), col, 12)
    # cylinders are Z-aligned; rotate neck/rose to +X
    for o, rot in ((knob_back, (0, pi / 2, 0)), (knob_neck, (0, pi / 2, 0))):
        o.rotation_euler = rot
    knob = uv_sphere("DoorKnob", 0.04, (DOOR_T + 0.055, DOOR_W * 0.78, 1.01), col, 16)

    # Brass plate around label (open frame)
    plate_y, plate_z = DOOR_W / 2, 1.81
    plate_parts = []
    for name, size, loc in [
        ("DoorPlateT", (0.008, 0.30, 0.018), (DOOR_T + 0.008, plate_y, plate_z + 0.056)),
        ("DoorPlateB", (0.008, 0.30, 0.018), (DOOR_T + 0.008, plate_y, plate_z - 0.056)),
        ("DoorPlateL", (0.008, 0.018, 0.13), (DOOR_T + 0.008, plate_y - 0.141, plate_z)),
        ("DoorPlateR", (0.008, 0.018, 0.13), (DOOR_T + 0.008, plate_y + 0.141, plate_z)),
    ]:
        o = new_mesh(name, box_bm(size, loc), col)
        plate_parts.append(o)

    label_anchor = bpy.data.objects.new("LabelAnchor", None)
    label_anchor.empty_display_size = 0.05
    label_anchor.location = (DOOR_T + 0.02, plate_y, plate_z)
    col.objects.link(label_anchor)

    casing = 0.09
    jamb_h = DOOR_H + 0.10
    frame_x = -0.01  # slightly into wall from hinge
    jamb_a = new_mesh("DoorJambHinge", box_bm((0.08, casing, jamb_h), (frame_x, -casing / 2, jamb_h / 2)), col)
    jamb_b = new_mesh(
        "DoorJambLatch",
        box_bm((0.08, casing, jamb_h), (frame_x, DOOR_W + casing / 2, jamb_h / 2)),
        col,
    )
    header = new_mesh(
        "DoorHeader",
        box_bm((0.08, DOOR_W + casing * 2, 0.12), (frame_x, DOOR_W / 2, DOOR_H + 0.06)),
        col,
    )

    assign(leaf, wood)
    assign(panel_u, panel_m)
    assign(panel_d, panel_m)
    assign(knob, brass)
    assign(knob_back, brass)
    assign(knob_neck, brass)
    for o in plate_parts:
        assign(o, brass)
    assign(jamb_a, wood)
    assign(jamb_b, wood)
    assign(header, wood)

    leaf_objs = [leaf, panel_u, panel_d, *stile_bits, knob, knob_back, knob_neck, *plate_parts, label_anchor]
    frame_objs = [jamb_a, jamb_b, header]
    for o in leaf_objs + frame_objs:
        if o.type == "MESH":
            smart_uv(o)

    # Parent under two empties so glTF keeps names
    leaf_root = bpy.data.objects.new("DoorLeafRoot", None)
    frame_root = bpy.data.objects.new("DoorFrame", None)
    col.objects.link(leaf_root)
    col.objects.link(frame_root)
    for o in leaf_objs:
        o.parent = leaf_root
    for o in frame_objs:
        o.parent = frame_root
    # Rename leaf mesh to DoorLeaf for picking; root is DoorLeafRoot
    leaf_root.name = "DoorLeaf"
    return [leaf_root, frame_root] + leaf_objs + frame_objs


def join_keep_name(target_name, objs, col):
    meshes = [o for o in objs if o.type == "MESH"]
    if len(meshes) < 2:
        return meshes[0] if meshes else None
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = target_name
    return joined


def rebuild_whitebox_lamps():
    """Replace inverted cones with mouth-down wide dishes + visible cords."""
    ys = []
    for obj in bpy.data.objects:
        if obj.name.startswith("LampShade_"):
            ys.append(obj.location.y)
    if not ys:
        return
    # remove old lamp meshes/lights for those Ys
    prefixes = ("LampShade_", "LampRod_", "LampBulb_", "Glow_")
    clear_by_prefix(*prefixes)
    # keep Spot_* lights, aim them down if needed
    shade_m = mat("LampShade", color=(0.11, 0.09, 0.07), roughness=0.88, metalness=0.08)
    inner_m = mat(
        "LampShadeInnerWB",
        color=(0.79, 0.63, 0.41),
        roughness=0.35,
        metalness=0.12,
        emission=(1, 0.6, 0.29),
        emission_strength=0.25,
    )
    cord_m = mat("LampRod", color=(0.54, 0.48, 0.42), roughness=0.52, metalness=0.2)
    bulb_m = mat(
        "LampBulb",
        color=(1, 0.96, 0.89),
        roughness=0.1,
        metalness=0.1,
        emission=(1.0, 0.70, 0.40),
        emission_strength=6.0,
    )
    scene_col = bpy.context.scene.collection
    for y in ys:
        tag = str(y).replace(".", "_")
        # match previous naming style 1_15
        tag = f"{y:.2f}".replace(".", "_")
        shade_center_z = HEIGHT - ROD_LEN - SHADE_H / 2
        outer = cone_open(
            f"LampShade_{tag}",
            SHADE_BOT_R,
            SHADE_TOP_R,
            SHADE_H,
            32,
            (0, y, shade_center_z),
            scene_col,
        )
        assign(outer, shade_m)
        cap = disk(f"LampCap_{tag}", SHADE_TOP_R + 0.01, (0, y, HEIGHT - ROD_LEN), scene_col, 24)
        assign(cap, shade_m)
        canopy = cyl(f"LampCanopy_{tag}", 0.09, 0.08, 0.032, (0, y, HEIGHT - 0.016), scene_col, 20)
        assign(canopy, mat("PendantCanopy", color=(0.35, 0.30, 0.24), roughness=0.45, metalness=0.42))
        cord = cyl(f"LampRod_{tag}", CORD_R, CORD_R, ROD_LEN, (0, y, HEIGHT - ROD_LEN / 2), scene_col, 10)
        assign(cord, cord_m)
        bulb = uv_sphere(f"LampBulb_{tag}", 0.05, (0, y, shade_center_z - 0.01), scene_col, 12)
        assign(bulb, bulb_m)
        # aim spots down (-Z)
        spot = bpy.data.objects.get(f"Spot_{tag}") or bpy.data.objects.get(f"Spot_{y:.2f}".replace(".", "_"))
    # fix any remaining spots by rotation
    for obj in bpy.data.objects:
        if obj.type == "LIGHT" and obj.name.startswith("Spot_"):
            obj.rotation_euler = (pi, 0, 0)  # point -Z if default is -Z... Blender spots point -Z already
            # actually default spot points -Z, so rotation 0. If they were aimed up, reset.
            obj.rotation_euler = (0, 0, 0)
            obj.location.z = HEIGHT - ROD_LEN - SHADE_H / 2


def apply_transforms(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)


print("=== building pendant ===")
pend_col = collection("Export_Pendant")
pend_objs = build_pendant(pend_col)
apply_transforms(pend_objs)
export_glb(pend_objs, os.path.join(MODELS, "ceiling_pendant.glb"))

print("=== building door ===")
door_col = collection("Export_Door")
door_objs = build_door(door_col)
apply_transforms([o for o in door_objs if o.type == "MESH"])
export_glb(door_objs, os.path.join(MODELS, "corridor_door.glb"))

print("=== rebuild whitebox lamps ===")
rebuild_whitebox_lamps()

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("saved", BLEND)
print("done")
