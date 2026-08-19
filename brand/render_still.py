"""Render a transparent-background still from one of the shipped .glb models.

Rendering from the GLB rather than the .blend on purpose: the source objects
are animated, so any given frame has them mid-flight — scaled to zero at the
start, mirrored and scattered at the end. The GLBs were already exported with
the correct rest pose, orientation, centring and materials, so they are the
trustworthy input.

Usage:
  blender -b --python render_from_glb.py -- in.glb out.png 900 900
"""
import bpy, sys, math, mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
src, out, res_x, res_y = argv[0], argv[1], int(argv[2]), int(argv[3])

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=src)

meshes = [o for o in sc.objects if o.type == 'MESH']
for o in sc.objects:
    o.select_set(o.type == 'MESH')
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
art = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
print("imported dims:", tuple(round(v, 3) for v in art.dimensions))

# The glTF importer restores Blender's Z-up, so the art faces +Z. The camera
# looks straight down -Z at that face; a small yaw about Y gives it depth.
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
art.location = (0, 0, 0)
art.rotation_euler = (0, math.radians(-17), 0)
print("final dims:", tuple(round(v, 3) for v in art.dimensions))

cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 70
cam = bpy.data.objects.new('cam', cam_data)
sc.collection.objects.link(cam)
sc.camera = cam
cam.location = (0, 0, 6.6)
cam.rotation_euler = (0, 0, 0)

def reflector(loc, scale, energy, color):
    """Emissive plane aimed at the origin that lights and reflects but never
    appears in frame."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    p = bpy.context.active_object
    p.scale = scale
    p.rotation_euler = (mathutils.Vector((0, 0, 0)) - mathutils.Vector(loc)) \
        .to_track_quat('Z', 'Y').to_euler()
    mat = bpy.data.materials.new('refl')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    emis = nt.nodes.new('ShaderNodeEmission')
    emis.inputs['Color'].default_value = (*color, 1.0)
    emis.inputs['Strength'].default_value = energy
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(emis.outputs['Emission'], outn.inputs['Surface'])
    p.data.materials.append(mat)
    p.visible_camera = False
    p.visible_shadow = False

CYAN = (0.107, 0.672, 0.680)
reflector((0.5, 3.6, 4.0), (8, 4, 1), 7.0, (1, 1, 1))          # key, upper front
reflector((-4.8, 1.0, 3.2), (5, 5, 1), 5.0, CYAN)              # brand fill, left
reflector((4.6, -1.4, 3.0), (4, 4, 1), 3.2, (0.56, 0.91, 0.91))# rim, right
reflector((0, -3.8, 2.6), (7, 3, 1), 1.6, (1, 1, 1))           # bounce, below

sc.render.engine = 'CYCLES'
sc.cycles.samples = 160
sc.cycles.use_denoising = True
sc.render.film_transparent = True
sc.render.image_settings.media_type = 'IMAGE'
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.resolution_x = res_x
sc.render.resolution_y = res_y
sc.render.resolution_percentage = 100
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("WROTE", out)
