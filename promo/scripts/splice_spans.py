#!/usr/bin/env python3
"""Re-render only the changed spans of the film and splice them into the previous 4K master.

For every span the cut points are moved out to the old master's keyframes, so the untouched parts
are copied bit-exactly (-c copy) and only the spans are drawn (render.py --raw) and encoded with the
master's x264 settings. The film's length and timing must be unchanged (v12 changes no timing).

    python3 promo/scripts/build_audio.py                 # → promo/out/mix.wav
    python3 promo/scripts/splice_spans.py --master lisandan-kulture-v11-3-4k.mp4 \
        --spans 0:19 72.8:78.7 130.4:131.0 178.9:186.1 --workers 3 --out promo/out/lisandan-kulture-v12-4k.mp4

  --scale    device scale factor of the render (2 = 3840×2160, must match the master)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

PROMO = Path(__file__).resolve().parent.parent
FPS = 60
X264 = ["-c:v", "libx264", "-preset", "slower", "-crf", "12", "-profile:v", "high",
        "-x264-params", "aq-mode=3:aq-strength=0.9:deblock=-1,-1:ref=5:bframes=4:psy-rd=1.0,0.15",
        "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-an",
        "-r", str(FPS), "-fps_mode", "cfr"]


def ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"


def keyframes(master: str) -> tuple[list[int], int]:
    """Keyframe frame indices and total frame count of the master's video stream."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time,flags",
                          "-of", "json", master], check=True, capture_output=True, text=True).stdout
    pk = json.loads(out)["packets"]
    times = sorted(float(p["pts_time"]) for p in pk)
    t0 = times[0]
    kf = sorted(round((float(p["pts_time"]) - t0) * FPS) for p in pk if "K" in p.get("flags", ""))
    return kf, len(times)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True)
    ap.add_argument("--spans", nargs="+", required=True, help="changed film seconds, from:to")
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--scale", type=float, default=2)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    ff = ffmpeg()
    tmp = Path(args.out).resolve().parent / "spans"
    tmp.mkdir(parents=True, exist_ok=True)

    kf, total = keyframes(args.master)
    print(f"master: {total} frames, {len(kf)} keyframes")
    spans = []
    for s in args.spans:
        a, b = (float(x) for x in s.split(":"))
        fa = max(k for k in kf if k <= round(a * FPS))
        later = [k for k in kf if k >= round(b * FPS)]
        fb = later[0] if later else total
        if spans and fa <= spans[-1][1]:
            spans[-1] = (spans[-1][0], max(fb, spans[-1][1]))
        else:
            spans.append((fa, fb))
    print("render frames:", ", ".join(f"{a}-{b} ({a / FPS:.3f}-{b / FPS:.3f} s)" for a, b in spans))

    # 1 — draw every span losslessly, `workers` Chromium processes at a time
    jobs = []
    for i, (fa, fb) in enumerate(spans):
        n = fb - fa
        per = -(-n // args.workers)
        for w in range(args.workers):
            a, b = fa + w * per, min(fb, fa + (w + 1) * per)
            if a < b:
                jobs.append((i, w, a, b))
    parts: dict[int, list[Path]] = {}
    for g in range(0, len(jobs), args.workers):
        procs = []
        for k, (i, w, a, b) in enumerate(jobs[g:g + args.workers]):
            part = tmp / f"s{i}_{w}.mkv"
            parts.setdefault(i, []).append(part)
            if part.with_suffix(".done").exists():
                continue
            cmd = [sys.executable, str(PROMO / "scripts" / "render.py"), "--raw", "--from", f"{a / FPS:.6f}", "--to", f"{b / FPS:.6f}",
                   "--fps", str(FPS), "--scale", str(args.scale), "--port", str(8900 + k), "--out", str(part)]
            procs.append((subprocess.Popen(cmd), part))
        for pr, part in procs:
            if pr.wait():
                raise SystemExit(f"render failed: {part}")
            part.with_suffix(".done").touch()

    # 2 — encode each span, cut the copies between them, join
    pieces, prev = [], 0
    for i, (fa, fb) in enumerate(spans):
        if fa > prev:
            cp = tmp / f"copy{i}.mp4"
            subprocess.run([ff, "-y", "-loglevel", "error", "-ss", f"{prev / FPS:.6f}", "-i", args.master, "-map", "0:v",
                            "-frames:v", str(fa - prev), "-c", "copy", str(cp)], check=True)
            pieces.append(cp)
        lst = tmp / f"patch{i}.txt"
        lst.write_text("".join(f"file '{p.resolve()}'\n" for p in parts[i]))
        enc = tmp / f"patch{i}.mp4"
        subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
                        "-vf", "setpts=N/(60*TB)", *X264, str(enc)], check=True)
        pieces.append(enc)
        prev = fb
    if prev < total:
        cp = tmp / "copy_end.mp4"
        subprocess.run([ff, "-y", "-loglevel", "error", "-ss", f"{prev / FPS:.6f}", "-i", args.master, "-map", "0:v",
                        "-c", "copy", str(cp)], check=True)
        pieces.append(cp)
    lst = tmp / "all.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\n" for p in pieces))
    subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-i", str(PROMO / "out" / "mix.wav"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart",
                    str(args.out)], check=True)
    n = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets",
                        "-of", "csv=p=0", str(args.out)], capture_output=True, text=True).stdout.strip()
    print(f"wrote {args.out}: {n} frames (master {total})")


if __name__ == "__main__":
    main()
