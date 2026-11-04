"""
Exports the homelab rack for the site. Run it from Blender's Text Editor (or
`blender homelab-rack.blend --python export-rack.py`) with homelab-rack.blend
open; it writes, relative to the repository:
  - src/data/rack.json             cable paths (packets) and hover-card anchors
  - public/models/homelab-rack.glb the model (meshopt compressed)
  - public/homelab-rack.webp       the still (reading mode, before WebGL loads)
It joins objects by machine on the way: do not save the .blend afterwards.

Naming in the .blend (rack3d.ts relies on it): parts of a machine start with
its name (switch_, lab_, pve1_, pve2_, truenas_, mug_), cables are curves
named Cable_<machine>, LEDs are LED_<machine>_*, LED_disk_*, LED_port_*.
"""
import json
import math
import os

import bpy
from mathutils import Vector
from mathutils.geometry import interpolate_bezier

scn = bpy.context.scene
repo = os.path.abspath(os.path.join(os.path.dirname(bpy.data.filepath), '..', '..'))


def sample(obj):
    """A cable (bezier curve) as points in glTF space (Y up)."""
    bps = obj.data.splines[0].bezier_points
    pts = []
    for a, b in zip(bps[:-1], bps[1:]):
        seg = interpolate_bezier(a.co, a.handle_right, b.handle_left, b.co, 10)
        pts += [tuple(round(v, 4) for v in (q.x, q.z, -q.y)) for q in (seg if not pts else seg[1:])]
    return pts


def anchor(prefix):
    """Top front of a machine: where its hover card is drawn."""
    zs = [o.location.z + o.dimensions.z / 2 for o in scn.objects if o.name.startswith(prefix) and o.type == 'MESH']
    return (0.0, round(max(zs), 4), 0.03)


# --- data: cable paths and anchors --------------------------------------------
paths = {o.name.replace('Cable_', ''): sample(o) for o in scn.objects if o.name.startswith('Cable_')}
labels = {k: anchor(k + '_') for k in ('switch', 'lab', 'pve1', 'pve2', 'truenas')}
mb = bpy.data.objects['mug_body']
labels['mug'] = (round(mb.location.x, 4), round(mb.location.z + mb.dimensions.z / 2, 4), round(-mb.location.y, 4))
with open(os.path.join(repo, 'src', 'data', 'rack.json'), 'w') as f:
    f.write(json.dumps({'paths': paths, 'labels': labels}))

# --- still -------------------------------------------------------------------------
for name, power in (('Key', 110), ('Fill', 35), ('Rim', 80)):
    o = bpy.data.objects.get(name)
    if o:
        o.data.energy = power
cam = bpy.data.objects['Cam']
target = Vector((0, 0.3, 0.5))
dist, yaw = 2.6, math.radians(20)
cam.location = (target.x + dist * math.sin(yaw), target.y - dist * math.cos(yaw), target.z + 0.28)
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 62
scn.render.film_transparent = True
ims = scn.render.image_settings
ims.media_type = 'IMAGE'
ims.file_format = 'WEBP'
ims.color_mode = 'RGBA'
ims.quality = 85
scn.render.resolution_x, scn.render.resolution_y, scn.render.resolution_percentage = 800, 1000, 100
scn.render.filepath = os.path.join(repo, 'public', 'homelab-rack.webp')
bpy.ops.render.render(write_still=True)

# --- model: one node per machine, cables and LEDs kept apart ------------------------
col = bpy.data.collections['Rack']
groups = {
    'frame': ('Post_', 'Hole_', 'BeamX_', 'BeamY_', 'BasePlate', 'Caster_'),
    'switch': ('switch_',),
    'cablemgr': ('cablemgr_',),
    'pve1': ('pve1_', 'Cylinder'),
    'pve2': ('pve2_',),
    'truenas': ('truenas_',),
    'lab': ('lab_',),
    'blanks': ('blank_',),
    'mug': ('mug_',),
}
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:
    if o.type in ('MESH', 'CURVE') and not o.name.startswith('LED_'):
        o.select_set(True)
bpy.context.view_layer.objects.active = next(o for o in col.objects if o.select_get())
bpy.ops.object.convert(target='MESH')
for g, prefixes in groups.items():
    objs = [o for o in col.objects if o.type == 'MESH' and not o.name.startswith('LED_') and o.name.startswith(prefixes)]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    bpy.context.active_object.name = g
out = os.path.join(repo, 'public', 'models', 'homelab-rack.glb')
bpy.ops.object.select_all(action='DESELECT')
for o in col.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=out, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
    export_lights=False, export_cameras=False, export_texcoords=False, export_normals=True,
    export_meshopt_compression_enable=True,
)
print('rack.json, homelab-rack.webp and', out, os.path.getsize(out), 'bytes')
