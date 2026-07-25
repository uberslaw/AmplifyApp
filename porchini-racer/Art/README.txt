Rocket art goes here:

  Porcini base image.png

Typical Windows path:

  C:\Porchini Racer\Art\Porcini base image.png

The game loads this as the mushroom rocket. Flames are drawn in code.

────────────────────────────────────────
Removing checkerboard / “transparent tiling”
────────────────────────────────────────
If your PNG shows a grey checkerboard *in the image itself*, that pattern was
baked into the pixels (common with some AI exports). The game cannot strip it
automatically. Export a clean PNG with a real transparent background:

Free (browser):
  • https://www.photopea.com  — open PNG → Magic Wand the checkerboard → Delete
    → File → Export as → PNG
  • https://www.remove.bg     — if you need background removed from a solid back

Desktop:
  • GIMP (free) or Photoshop — same idea: select checkerboard, delete, export PNG

Tip: After editing, zoom in on the edges — you want see-through alpha, not
grey squares. Then replace Art/Porcini base image.png and restart the game.
