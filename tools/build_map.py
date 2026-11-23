"""Bouwt de kaartgeometrie voor een topografie-les.

Bronnen (in tools/raw/, niet in git):
  pdok.json    CBS-provinciegrenzen (PDOK WFS, gegeneraliseerd, EPSG:4326)
  canals.json  kanalen uit OpenStreetMap (Overpass, out geom)

Uitvoer: topografie-drenthe/map.js  (window.MAP = {...})
Draai:   python3 tools/build_map.py
"""
import json, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "tools", "raw")
OUT = os.path.join(ROOT, "topografie-drenthe", "map.js")

# Kaartuitsnede, ongeveer zoals op het werkblad
LON0, LON1 = 6.03, 7.24
LAT0, LAT1 = 52.57, 53.245
LATM = (LAT0 + LAT1) / 2
W = 1000
KX = W / ((LON1 - LON0) * math.cos(math.radians(LATM)))
H = round((LAT1 - LAT0) * KX)


def proj(lon, lat):
    x = (lon - LON0) * math.cos(math.radians(LATM)) * KX
    y = (LAT1 - lat) * KX
    return (round(x, 1), round(y, 1))


def dp(pts, tol):
    """Douglas-Peucker vereenvoudiging."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / L
        if d > best:
            best, idx = d, i
    if best > tol:
        return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)
    return [pts[0], pts[-1]]


def ring_path(ring, tol=0.8):
    raw = [proj(*c) for c in ring]
    h = len(raw) // 2  # gesloten ring: in twee helften, anders valt DP samen
    pts = dp(raw[: h + 1], tol)[:-1] + dp(raw[h:], tol)
    if len(pts) < 4:
        return ""
    return "M" + "L".join(f"{x:g},{y:g}" for x, y in pts) + "Z"


def line_path(coords, tol=0.8):
    pts = dp([proj(*c) for c in coords], tol)
    return "M" + "L".join(f"{x:g},{y:g}" for x, y in pts)


def chain(segments):
    """Plak losse OSM-ways aan elkaar tot zo weinig mogelijk lijnen."""
    segs = [list(s) for s in segments]
    lines = []
    while segs:
        cur = segs.pop(0)
        grown = True
        while grown:
            grown = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]
                elif s[-1] == cur[0]:
                    cur = s[:-1] + cur
                elif s[0] == cur[0]:
                    cur = list(reversed(s))[:-1] + cur
                elif s[-1] == cur[-1]:
                    cur += list(reversed(s))[1:]
                else:
                    continue
                segs.pop(i)
                grown = True
                break
        lines.append(cur)
    return lines


# --- provincies ---
prov = json.load(open(os.path.join(RAW, "pdok.json")))
provinces = {}
for f in prov["features"]:
    name = f["properties"]["statnaam"]
    if name not in ("Drenthe", "Groningen", "Fryslân", "Overijssel"):
        continue
    g = f["geometry"]
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    d = "".join(ring_path(r) for p in polys for r in p)
    provinces[name] = d

# --- kanalen ---
canals_raw = json.load(open(os.path.join(RAW, "canals.json")))
groups = {
    # a = Hoogeveensche Vaart (Meppel-Hoogeveen) + Verlengde (Hoogeveen-Klazienaveen),
    # op het werkblad samen getekend als één lijn 'a'.
    "a": ["Hoogeveensche Vaart", "Verlengde Hoogeveense Vaart", "Verlengde Hoogeveensche Vaart"],
    "b": ["Drentsche Hoofdvaart"],
    "c": ["Noord-Willemskanaal"],
}
canals = {}
for key, names in groups.items():
    segs = [
        [(p["lon"], p["lat"]) for p in e["geometry"]]
        for e in canals_raw["elements"]
        if e["tags"].get("name") in names
    ]
    lines = chain(segs)
    lines = [l for l in lines if len(l) > 3]
    canals[key] = "".join(line_path(l) for l in lines)

# --- plaatsen (Nominatim, Emmen en Coevorden handmatig op de kern gezet) ---
places = {
    "westerbork": (6.6103, 52.8492),
    "hoogeveen": (6.4758, 52.7226),
    "gieten": (6.7638, 53.0033),
    "eelde": (6.5634, 53.1346),
    "borger": (6.7906, 52.9241),
    "assen": (6.5620, 52.9930),
    "roden": (6.4275, 53.1405),
    "klazienaveen": (6.9852, 52.7254),
    "emmen": (6.8975, 52.7859),
    "beilen": (6.5124, 52.8611),
    "coevorden": (6.7402, 52.6608),
    "schoonebeek": (6.8848, 52.6643),
    "emmer-compascuum": (7.0462, 52.8115),
    "zuidlaren": (6.6872, 53.0941),
    "smilde": (6.4510, 52.9509),
    "meppel": (6.1940, 52.6960),
}
points = {k: proj(*v) for k, v in places.items()}

# --- Hondsrug: zandrug van Groningen via Zuidlaren en Borger naar Emmen ---
hondsrug = [(6.60, 53.19), (6.66, 53.12), (6.72, 53.04), (6.78, 52.96),
            (6.84, 52.88), (6.89, 52.82), (6.93, 52.77)]
hondsrug_d = "M" + "L".join(f"{x:g},{y:g}" for x, y in (proj(*c) for c in hondsrug))

labels = {
    "Groningen": proj(6.95, 53.22),
    "Friesland": proj(6.12, 53.08),
    "Overijssel": proj(6.40, 52.595),
    "Duitsland": proj(7.17, 52.95),
}

# plek van de letters/nummers op de toetskaart (zoals op het werkblad)
tags = {
    "a": proj(6.74, 52.752),
    "b": proj(6.335, 52.885),
    "c": proj(6.548, 53.085),
    "hondsrug": proj(6.67, 52.99),
}

out = {
    "width": W,
    "height": H,
    "provinces": provinces,
    "focus": "Drenthe",
    "canals": canals,
    "points": points,
    "ridges": {"hondsrug": hondsrug_d},
    "labels": labels,
    "tags": tags,
}
with open(OUT, "w") as fh:
    fh.write("// Gegenereerd door tools/build_map.py. Niet met de hand aanpassen.\n")
    fh.write("// Bronnen: CBS/PDOK provinciegrenzen, OpenStreetMap (ODbL) kanalen en plaatsen.\n")
    fh.write("window.MAP = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("ok", OUT, W, "x", H, os.path.getsize(OUT), "bytes")
