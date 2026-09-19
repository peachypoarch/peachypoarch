FARHAN ARINATA — PERSONAL ARCHIVE 3D
========================================

This is the full structured version.

FILES
-----
index.html
css/style.css
js/main.js
js/hand3d.js       <- TRUE 3D procedural hand using Three.js geometry
js/webgl-bg.js     <- realtime WebGL2 animated shader backgrounds
assets/images/mom-and-me.jpeg
assets/images/flower.jpeg
assets/audio/archive-ambient.wav
assets/effects/
shaders/bg.vert
shaders/bg.frag

WHAT IS "REAL 3D" HERE?
-----------------------
The green/red hand is not a flat PNG/SVG. It is constructed from actual
Three.js 3D mesh geometry with:
- articulated finger groups
- perspective camera
- physically-based glossy material
- multiple 3D lights
- bloom post-processing
- pointer-follow spring movement
- hand pose response on pointer press
- scene-specific scale, rotation, material and color
- 3D glass shards in the red scene
- 3D scanning rings in the green system scene

GITHUB PAGES
------------
Keep the directory structure exactly as supplied.
The project loads Three.js modules from jsDelivr, so the live website needs internet access.

For the default account Pages repository, deploy:
branch: main
folder: / (root)

IPHONE NOTE
-----------
GitHub's mobile web uploader is awkward for complete folder trees.
The safest workflow for this structured version is to upload/extract it using a computer,
GitHub Desktop, or another Git client that preserves directories.

Do not mix files from the earlier website version with this one.
