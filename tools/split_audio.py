"""Zet ElevenLabs-opnames op hun plek.

Per plek is er één opname "Naam. Feitje." (tools/audio-v4/item-<id>/*.mp3).
- audio/item-<id>.mp3  = de hele opname (Ontdekken: naam + feitje). Begint het feitje zelf al
  met de naam, dan staat er een losse opname van alleen het feitje in tools/audio-v4/feit-<id>/
  en wordt die gebruikt (anders hoor je de naam twee keer).
- audio/naam-<id>.mp3  = alleen de naam, geknipt tot de eerste pauze.
  Zo klinkt de losse naam precies hetzelfde als in de zin.
Zinnen (tools/audio-v4/zin-<key>/*.mp3) gaan naar shared/audio/<key>.mp3.

Draai: python3 tools/split_audio.py <lesmap>   (bv. topografie-drenthe)
"""
import glob, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "audio-v4")
LES = sys.argv[1] if len(sys.argv) > 1 else "topografie-drenthe"
OUT = os.path.join(ROOT, LES, "audio")
SHARED = os.path.join(ROOT, "shared", "audio")
os.makedirs(OUT, exist_ok=True)
os.makedirs(SHARED, exist_ok=True)


def first_pause(path, min_pause=0.3):
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", path, "-af", f"silencedetect=noise=-38dB:d={min_pause}", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]
    starts = [s for s in starts if s > 0.2]  # stilte vóór het eerste woord negeren
    return starts[0] if starts else None


for d in sorted(glob.glob(os.path.join(SRC, "item-*"))):
    key = os.path.basename(d)[5:]
    f = sorted(glob.glob(os.path.join(d, "*.mp3")))[-1]
    feit = sorted(glob.glob(os.path.join(SRC, f"feit-{key}", "*.mp3")))
    shutil.copy(feit[-1] if feit else f, os.path.join(OUT, f"item-{key}.mp3"))
    cut = first_pause(f)
    if cut is None:
        print("GEEN PAUZE", key); continue
    end = cut + 0.12
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f, "-t", f"{end:.3f}",
                    "-af", f"afade=t=out:st={max(0, end - 0.08):.3f}:d=0.08", "-b:a", "128k",
                    os.path.join(OUT, f"naam-{key}.mp3")], check=True)
    print(f"{key:18s} naam tot {end:.2f}s")

for d in sorted(glob.glob(os.path.join(SRC, "zin-*"))):
    key = os.path.basename(d)[4:]
    f = sorted(glob.glob(os.path.join(d, "*.mp3")))[-1]
    shutil.copy(f, os.path.join(SHARED, f"{key}.mp3"))
print("klaar")
