"""Export public/nex-logo.glb from brand/nex_logo_only.blend.

Usage:
  blender -b brand/nex_logo_only.blend --python brand/export_logo_glb.py -- \
      Curve.009 public/nex-logo.glb /tmp/logo-preview.png

Gotchas this script exists to encode:
  * use_active_scene=True is required — the .blend holds 7 scenes and the
    exporter otherwise ships all of their geometry (11 MB instead of 84 KB).
  * The source materials carry alpha 0.76, which renders the mark
    semi-transparent in a browser. Alpha is forced to 1.0 here.
  * Metalness is pulled back from Blender's 1.0: the web viewer lights the
    model with a small procedural environment, and a fully metallic surface
    reads near-black under it.
  * Curve.009 is the S mark. The other Curve.* objects are the "nex"
    letterforms.
"""
import bpy, sys, mathutils, math
argv = sys.argv[sys.argv.index("--")+1:]
target, out, preview = argv[0], argv[1], argv[2]

def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

BRAND_CYAN = tuple(srgb_to_linear(v / 255) for v in (0x5c, 0xd6, 0xd7))
TUNING = {
    'Material.010': ((1.0, 1.0, 1.0), 0.55, 0.22),
    'Material.008': ((0.72, 0.75, 0.78), 0.65, 0.28),
    'Material.009': (BRAND_CYAN, 0.55, 0.20),
}

sc = bpy.data.scenes['Scene.005']
bpy.context.window.scene = sc
logo = bpy.data.objects[target]
logo.animation_data_clear()
logo.matrix_world = mathutils.Matrix.Identity(4)

# Hard-delete everything else in the scene so the export can't pick up strays
for ob in list(sc.objects):
    if ob is not logo:
        bpy.data.objects.remove(ob, do_unlink=True)
print("remaining objects:", [o.name for o in sc.objects])

for slot in logo.material_slots:
    m = slot.material
    if not (m and m.use_nodes and m.name in TUNING):
        continue
    color, metal, rough = TUNING[m.name]
    for n in m.node_tree.nodes:
        if n.type == 'BSDF_PRINCIPLED':
            n.inputs['Base Color'].default_value = (*color, 1.0)
            if 'Alpha' in n.inputs:
                n.inputs['Alpha'].default_value = 1.0
            m.blend_method = 'OPAQUE'
            n.inputs['Metallic'].default_value = metal
            n.inputs['Roughness'].default_value = rough
            if 'Emission Strength' in n.inputs:
                n.inputs['Emission Strength'].default_value = 0.0
            break

bpy.context.view_layer.objects.active = logo
logo.select_set(True)
print("BEFORE verts:", len(logo.data.vertices), "polys:", len(logo.data.polygons))

mod = logo.modifiers.new(name='planar', type='DECIMATE')
mod.decimate_type = 'DISSOLVE'
mod.angle_limit = math.radians(1.0)
bpy.ops.object.modifier_apply(modifier=mod.name)
print("AFTER  verts:", len(logo.data.vertices), "polys:", len(logo.data.polygons))

bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
logo.location = (0, 0, 0)
s = 2.0 / max(logo.dimensions)
logo.scale = (s, s, s)
bpy.ops.object.transform_apply(location=True, rotation=False, scale=True)
print("EXPORT dims:", tuple(round(v, 3) for v in logo.dimensions))

bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=True, use_active_scene=True,
    export_apply=True,
    export_animations=False, export_cameras=False, export_lights=False,
    export_draco_mesh_compression_enable=False,
)
print("WROTE", out)

# Quick preview render so we can confirm which artwork this actually is
cam_data = bpy.data.cameras.new('prev')
cam = bpy.data.objects.new('prev', cam_data)
sc.collection.objects.link(cam)
cam.location = (0, 0, 6)
cam.rotation_euler = (0, 0, 0)
sc.camera = cam
light_data = bpy.data.lights.new('key', type='AREA')
light_data.energy = 900
light_data.size = 8
light = bpy.data.objects.new('key', light_data)
sc.collection.objects.link(light)
light.location = (4, -3, 6)
light.rotation_euler = (math.radians(28), math.radians(22), 0)
sc.render.engine = 'BLENDER_EEVEE'
sc.render.image_settings.media_type = 'IMAGE'
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.render.film_transparent = True
sc.render.resolution_x = 600
sc.render.resolution_y = 600
sc.render.resolution_percentage = 100
sc.render.filepath = preview
bpy.ops.render.render(write_still=True)
print("PREVIEW", preview)
