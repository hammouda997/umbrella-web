from PIL import Image
from pathlib import Path

alts = [
    Path(r"C:\Users\msaad\.cursor\projects\c-Users-msaad-Desktop-Job-Navex\assets\umbrella-truck-transparent.jpg"),
    Path(r"C:\Users\msaad\.cursor\projects\c-Users-msaad-Desktop-Job-Navex\assets\c__Users_msaad_AppData_Roaming_Cursor_User_workspaceStorage_b4817bfa7c6ff22f3c2cf6c029bcb4c3_images__5DCD80E5-6698-41CE-BC3E-CC6E2D62FB76_-b2c7ef74-58f6-4b3d-9d86-1ff5230eb959.png"),
    Path(r"C:\Users\msaad\.cursor\projects\c-Users-msaad-Desktop-Job-Navex\assets\umbrella-truck-cutout.jpg"),
]
src = next(p for p in alts if p.exists())
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r > 238 and g > 238 and b > 238:
            pixels[x, y] = (255, 255, 255, 0)
        elif r > 225 and g > 225 and b > 225 and abs(r - g) < 10 and abs(g - b) < 10:
            strength = (min(r, g, b) - 225) / 30.0
            pixels[x, y] = (r, g, b, max(0, int(255 * (1.0 - min(1.0, strength)))))

# Cover baked center branding with white panel paint so only rear logo overlay shows
# Approximate cargo panel mid area if source has centered logo
for y in range(int(h * 0.28), int(h * 0.62)):
    for x in range(int(w * 0.28), int(w * 0.62)):
        r, g, b, a = pixels[x, y]
        if a < 10:
            continue
        # desaturate bright logo reds toward panel white-gray
        if r > 140 and g < 120 and b < 120:
            pixels[x, y] = (236, 236, 236, a)
        elif r > 200 and g > 180 and b > 150 and abs(r - g) < 40:
            pixels[x, y] = (240, 240, 240, a)

out = Path(r"c:\Users\msaad\Desktop\Job\Navex\umbrella\web\public\assets\umbrella-truck.png")
img.save(out, "PNG")
print(f"saved {out} ({out.stat().st_size} bytes) from {src.name} {w}x{h}")
