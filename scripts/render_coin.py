import bpy
import math
import os
import sys

# Reset to clean scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# Paths
workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
output_img_dir = os.path.join(workspace_dir, "public", "Images", "Immutable")
frames_dir = os.path.join(output_img_dir, "coin_spin")
os.makedirs(output_img_dir, exist_ok=True)
os.makedirs(frames_dir, exist_ok=True)

# 1. World Ambient Environment (warm studio fill to keep gold luminous)
world = bpy.data.worlds.new("StudioWorld")
world.use_nodes = True
scene.world = world
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs["Color"].default_value = (0.22, 0.18, 0.12, 1.0)
    bg_node.inputs["Strength"].default_value = 0.9

# 2. Materials
gold_mat = bpy.data.materials.new("StudioGold")
gold_mat.use_nodes = True
bsdf = gold_mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (1.0, 0.78, 0.12, 1.0) # Arcade Gold
bsdf.inputs["Metallic"].default_value = 1.0
bsdf.inputs["Roughness"].default_value = 0.14
if "Coat Weight" in bsdf.inputs:
    bsdf.inputs["Coat Weight"].default_value = 0.5
    bsdf.inputs["Coat Roughness"].default_value = 0.06
elif "Clearcoat" in bsdf.inputs:
    bsdf.inputs["Clearcoat"].default_value = 0.5

gold_emblem_mat = bpy.data.materials.new("GoldEmblem")
gold_emblem_mat.use_nodes = True
e_bsdf = gold_emblem_mat.node_tree.nodes.get("Principled BSDF")
e_bsdf.inputs["Base Color"].default_value = (1.0, 0.90, 0.32, 1.0) # Brighter relief highlight
e_bsdf.inputs["Metallic"].default_value = 1.0
e_bsdf.inputs["Roughness"].default_value = 0.08
if "Coat Weight" in e_bsdf.inputs:
    e_bsdf.inputs["Coat Weight"].default_value = 0.7
    e_bsdf.inputs["Coat Roughness"].default_value = 0.04

# 3. Root container for entire coin
coin_root = bpy.data.objects.new("CoinRoot", None)
scene.collection.objects.link(coin_root)

# 4. Outer Rim
bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=0.20, vertices=64)
rim_obj = bpy.context.active_object
rim_obj.name = "CoinRim"
rim_obj.data.materials.append(gold_mat)
rim_obj.parent = coin_root

bevel_mod = rim_obj.modifiers.new("Bevel", "BEVEL")
bevel_mod.width = 0.025
bevel_mod.segments = 3

# 5. Inner Recessed Disc (Face of the coin)
bpy.ops.mesh.primitive_cylinder_add(radius=0.86, depth=0.14, vertices=64)
inner_disc = bpy.context.active_object
inner_disc.name = "CoinInnerDisc"
inner_disc.data.materials.append(gold_mat)
inner_disc.parent = coin_root

# 6. Milled Reeded Edges (Notches on the perimeter)
reeds_mesh = bpy.data.meshes.new("ReedsMesh")
reed_verts = []
reed_faces = []
v_idx = 0
num_reeds = 52
for i in range(num_reeds):
    angle = (i / num_reeds) * 2 * math.pi
    cx = math.cos(angle) * 0.99
    cy = math.sin(angle) * 0.99
    nx = math.cos(angle) * 0.018
    ny = math.sin(angle) * 0.018
    px = -math.sin(angle) * 0.015
    py = math.cos(angle) * 0.015
    z_bot = -0.09
    z_top = 0.09
    reed_verts.extend([
        (cx - px + nx, cy - py + ny, z_bot),
        (cx + px + nx, cy + py + ny, z_bot),
        (cx + px + nx, cy + py + ny, z_top),
        (cx - px + nx, cy - py + ny, z_top)
    ])
    reed_faces.append([v_idx, v_idx + 1, v_idx + 2, v_idx + 3])
    v_idx += 4

reeds_mesh.from_pydata(reed_verts, [], reed_faces)
reeds_mesh.update()
reeds_obj = bpy.data.objects.new("CoinReeds", reeds_mesh)
reeds_obj.data.materials.append(gold_mat)
reeds_obj.parent = coin_root
scene.collection.objects.link(reeds_obj)

# 7. Faceted 3D Star Relief on Front and Back
def create_star_mesh(name, z_center, z_sign):
    mesh = bpy.data.meshes.new(name)
    verts = []
    faces = []
    outer_r = 0.52
    inner_r = 0.26
    for i in range(10):
        angle = (i / 10) * 2 * math.pi + math.pi / 2
        r = outer_r if (i % 2 == 0) else inner_r
        x = math.cos(angle) * r
        y = math.sin(angle) * r
        verts.append((x, y, z_center))
    apex_z = z_center + z_sign * 0.055
    apex_idx = 10
    verts.append((0, 0, apex_z))
    for i in range(10):
        next_i = (i + 1) % 10
        if z_sign > 0:
            faces.append([apex_idx, i, next_i])
        else:
            faces.append([apex_idx, next_i, i])
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(gold_emblem_mat)
    obj.parent = coin_root
    scene.collection.objects.link(obj)
    return obj

create_star_mesh("StarFront", 0.07, 1)
create_star_mesh("StarBack", -0.07, -1)

# 8. Decorative golden beads around the perimeter
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, segments=12, ring_count=8)
base_bead = bpy.context.active_object
base_bead.name = "BeadTemplate"
base_bead.data.materials.append(gold_emblem_mat)

num_beads = 12
for i in range(num_beads):
    angle = (i / num_beads) * 2 * math.pi
    bx = math.cos(angle) * 0.74
    by = math.sin(angle) * 0.74
    fb = base_bead.copy()
    fb.location = (bx, by, 0.075)
    fb.parent = coin_root
    scene.collection.objects.link(fb)
    bb = base_bead.copy()
    bb.location = (bx, by, -0.075)
    bb.parent = coin_root
    scene.collection.objects.link(bb)

bpy.data.objects.remove(base_bead, do_unlink=True)

# 9. Lighting Setup (Front-facing lights for maximum shine on coin face)
# Key Light (Top-Front-Right)
key_light_data = bpy.data.lights.new(name="KeyLight", type="AREA")
key_light_data.energy = 250
key_light_data.size = 2.5
key_light_data.color = (1.0, 0.97, 0.90)
key_light = bpy.data.objects.new(name="KeyLight", object_data=key_light_data)
key_light.location = (2.0, -2.8, 2.2)
key_light.rotation_euler = (math.radians(50), math.radians(10), math.radians(35))
scene.collection.objects.link(key_light)

# Fill Light (Front-Left)
fill_light_data = bpy.data.lights.new(name="FillLight", type="AREA")
fill_light_data.energy = 120
fill_light_data.size = 3.0
fill_light_data.color = (0.90, 0.95, 1.0)
fill_light = bpy.data.objects.new(name="FillLight", object_data=fill_light_data)
fill_light.location = (-2.5, -2.5, 0.8)
fill_light.rotation_euler = (math.radians(40), math.radians(-15), math.radians(-45))
scene.collection.objects.link(fill_light)

# Rim/Back Light (Behind-Top for glowing rim)
rim_light_data = bpy.data.lights.new(name="RimLight", type="AREA")
rim_light_data.energy = 320
rim_light_data.size = 2.5
rim_light_data.color = (1.0, 0.85, 0.45)
rim_light = bpy.data.objects.new(name="RimLight", object_data=rim_light_data)
rim_light.location = (0.0, 2.5, 2.5)
rim_light.rotation_euler = (math.radians(-45), 0, math.radians(180))
scene.collection.objects.link(rim_light)

# Sparkle Kicker (Direct frontal sparkle)
kicker_data = bpy.data.lights.new(name="KickerLight", type="POINT")
kicker_data.energy = 60
kicker_data.color = (1.0, 1.0, 1.0)
kicker = bpy.data.objects.new(name="KickerLight", object_data=kicker_data)
kicker.location = (0.2, -2.2, 0.4)
scene.collection.objects.link(kicker)

# 10. Camera Setup (Looking along -Y, centered at coin with padding)
cam_data = bpy.data.cameras.new(name="StudioCam")
cam_data.lens = 80
cam = bpy.data.objects.new(name="StudioCam", object_data=cam_data)
# Move camera back slightly to (0, -3.85, 0.42) so full coin + rim fits cleanly
cam.location = (0.0, -3.85, 0.42)
cam.rotation_euler = (math.radians(84), 0, 0)
scene.collection.objects.link(cam)
scene.camera = cam

# 11. Render Configuration
scene.render.engine = "BLENDER_EEVEE"
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.resolution_percentage = 100

# Base orientation: Coin face (+Z local) faces the camera (-Y in world).
# We rotate by 90 degrees around X.
BASE_ROT_X = math.radians(90)

# 12. Render Master Static Coin (Juicy 3D isometric tilt)
master_coin_path = os.path.join(output_img_dir, "Coin.png")
# Tilted 12 deg on Y and -8 deg on Z for delicious gloss & bevel visibility
coin_root.rotation_euler = (BASE_ROT_X + math.radians(-5), math.radians(14), math.radians(-10))
scene.render.filepath = master_coin_path
print(f"Rendering Master Coin to {master_coin_path}...")
bpy.ops.render.render(write_still=True)
print("Master Coin Rendered Successfully!")

# 13. Render 16 Spin Frames (Full 360 degree spin around vertical axis)
num_frames = 16
frame_paths = []
print(f"Rendering {num_frames} rotation frames...")
for f in range(num_frames):
    angle = (f / num_frames) * 2 * math.pi
    # Spin around world Z axis:
    # Since BASE_ROT_X is 90 deg around X, rotating around local Z or world Z:
    # In Euler XYZ: (BASE_ROT_X, 0, angle) rotates around world Z!
    # Add subtle tilt wobble (+- 5 deg) for organic coin physics
    wobble = math.sin(angle * 2) * math.radians(5)
    coin_root.rotation_euler = (BASE_ROT_X + wobble, 0, angle)
    
    frame_name = f"coin_{f:02d}.png"
    frame_path = os.path.join(frames_dir, frame_name)
    scene.render.filepath = frame_path
    bpy.ops.render.render(write_still=True)
    frame_paths.append(frame_path)

print("All 16 frames rendered!")

# 14. Stitch into 4x4 Spritesheet (1024x1024)
sheet_size = 1024
frame_size = 256
grid_cols = 4
grid_rows = 4

print("Creating 1024x1024 Spritesheet...")
sheet_img = bpy.data.images.new("CoinSpinSheet", width=sheet_size, height=sheet_size, alpha=True)
total_pixels = sheet_size * sheet_size * 4
sheet_pixels = [0.0] * total_pixels

for idx, fpath in enumerate(frame_paths):
    col = idx % grid_cols
    row = idx // grid_cols
    # Target row in top-to-bottom order (Blender Y=0 is bottom row)
    target_row = (grid_rows - 1 - row)
    
    loaded_img = bpy.data.images.load(fpath)
    loaded_pixels = list(loaded_img.pixels)
    
    for y in range(frame_size):
        src_row_start = y * frame_size * 4
        dst_y = target_row * frame_size + y
        dst_x = col * frame_size
        dst_row_start = (dst_y * sheet_size + dst_x) * 4
        sheet_pixels[dst_row_start : dst_row_start + frame_size * 4] = loaded_pixels[src_row_start : src_row_start + frame_size * 4]
    
    bpy.data.images.remove(loaded_img)

sheet_img.pixels = sheet_pixels
sheet_path = os.path.join(output_img_dir, "coin_spin_sheet.png")
sheet_img.filepath_raw = sheet_path
sheet_img.file_format = "PNG"
sheet_img.save()
print(f"Spritesheet successfully created at {sheet_path}!")
