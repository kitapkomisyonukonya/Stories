"""Sentence patches for an existing chapter recording (user 2026-11-20: when a few sentences
change, voice only those sentences instead of the whole chapter, so credits are not wasted).

A request may carry
    "patch": {"baseRequestId": "<id the current mp3 was made from>",
              "baseNarrationText": "<the text that recording read>"}
next to its full new narrationText. The spoken forms of the two texts are split into sentences
and compared. The current mp3 is aligned to the old spoken text (ElevenLabs Forced Alignment),
each changed sentence is cut out at the middle of the pauses around it, the new sentence is
voiced on its own and put in its place. Unchanged sentences keep the old recording.
"""
from __future__ import annotations

import array
import difflib
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Callable

SAMPLE_RATE = 44_100
SENTENCE_RE = re.compile(r"[^\n.!?؟]+(?:[.!?؟]+[»”\"]?)?")
SILENCE_LEVEL = 600  # int16 amplitude; ElevenLabs leaves near-silent edges around a sentence
EDGE_KEEP = 0.08  # seconds kept on each side of a trimmed new sentence


class PatchError(Exception):
    pass


def sentences(text: str) -> list[tuple[int, int, str]]:
    """(start, end, normalized text) for every sentence of a spoken text."""
    found = []
    for match in SENTENCE_RE.finditer(text):
        piece = match.group(0)
        stripped = piece.strip()
        if not stripped or not re.search(r"\w", stripped):
            continue
        start = match.start() + (len(piece) - len(piece.lstrip()))
        found.append((start, start + len(stripped), re.sub(r"\s+", " ", stripped)))
    return found


def changed_spans(old_spoken: str, new_spoken: str) -> list[dict[str, Any]]:
    """Each change: the character span in the old text and the new text that replaces it."""
    old = sentences(old_spoken)
    new = sentences(new_spoken)
    matcher = difflib.SequenceMatcher(a=[s[2] for s in old], b=[s[2] for s in new], autojunk=False)
    changes = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        if i1 == i2:  # pure insertion: anchor between two old sentences
            anchor = old[i1][0] if i1 < len(old) else len(old_spoken)
            span = (anchor, anchor)
        else:
            span = (old[i1][0], old[i2 - 1][1])
        text = " ".join(s[2] for s in new[j1:j2])
        changes.append({"old": old_spoken[span[0]:span[1]], "span": span, "new": text})
    return changes


def word_offsets(alignment: dict[str, Any], text: str) -> list[dict[str, float]]:
    words = []
    cursor = 0
    for word in alignment.get("words") or []:
        token = str(word.get("text", "")).strip()
        if not token:
            continue
        found = text.find(token, cursor)
        if found < 0:
            continue
        cursor = found + len(token)
        words.append({"c0": found, "c1": cursor, "s": float(word.get("start", 0)), "e": float(word.get("end", 0))})
    if not words:
        raise PatchError("Alignment returned no usable words.")
    return words


def cut_points(words: list[dict[str, float]], span: tuple[int, int], duration: float) -> tuple[float, float]:
    """Audio range to replace: from the middle of the pause before the span to the middle of
    the pause after it, so the surrounding pauses stay natural."""
    inside = [i for i, w in enumerate(words) if span[0] <= w["c0"] < max(span[1], span[0] + 1)]
    if span[0] == span[1]:  # insertion point
        after = next((i for i, w in enumerate(words) if w["c0"] >= span[0]), None)
        if after is None:
            return duration, duration
        point = (words[after - 1]["e"] + words[after]["s"]) / 2 if after > 0 else words[after]["s"]
        return point, point
    if not inside:
        raise PatchError(f"No aligned words for «{span}».")
    first, last = inside[0], inside[-1]
    start = (words[first - 1]["e"] + words[first]["s"]) / 2 if first > 0 else 0.0
    end = (words[last]["e"] + words[last + 1]["s"]) / 2 if last + 1 < len(words) else duration
    return start, end


def ensure_ffmpeg() -> str:
    path = shutil.which("ffmpeg")
    if path:
        return path
    subprocess.run(["apt-get", "update", "-qq"], check=True, capture_output=True)
    subprocess.run(["apt-get", "install", "-y", "-qq", "ffmpeg"], check=True, capture_output=True)
    path = shutil.which("ffmpeg")
    if not path:
        raise PatchError("ffmpeg is not available.")
    return path


def decode(ffmpeg: str, mp3: bytes, folder: Path, name: str) -> array.array:
    source = folder / f"{name}.mp3"
    source.write_bytes(mp3)
    raw = folder / f"{name}.raw"
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-i", str(source), "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), str(raw)],
        check=True,
    )
    samples = array.array("h")
    samples.frombytes(raw.read_bytes())
    return samples


def encode(ffmpeg: str, samples: array.array, folder: Path) -> bytes:
    raw = folder / "out.raw"
    raw.write_bytes(samples.tobytes())
    out = folder / "out.mp3"
    subprocess.run(
        [ffmpeg, "-v", "error", "-y", "-f", "s16le", "-ac", "1", "-ar", str(SAMPLE_RATE), "-i", str(raw),
         "-codec:a", "libmp3lame", "-b:a", "128k", str(out)],
        check=True,
    )
    return out.read_bytes()


def trim_silence(samples: array.array) -> array.array:
    loud = [i for i in range(0, len(samples), 64) if abs(samples[i]) > SILENCE_LEVEL]
    if not loud:
        return samples
    keep = int(EDGE_KEEP * SAMPLE_RATE)
    return samples[max(0, loud[0] - keep): min(len(samples), loud[-1] + keep)]


def patch_recording(
    current_mp3: bytes,
    old_spoken: str,
    new_spoken: str,
    align: Callable[[bytes, str], dict[str, Any]],
    synthesize: Callable[[str], bytes],
    log: Callable[[str], None],
) -> tuple[bytes, int]:
    """Returns the patched mp3 and the number of characters that were voiced."""
    changes = changed_spans(old_spoken, new_spoken)
    if not changes:
        raise PatchError("The new text has no changed sentence; nothing to patch.")
    ffmpeg = ensure_ffmpeg()
    words = word_offsets(align(current_mp3, old_spoken), old_spoken)
    voiced = 0
    with tempfile.TemporaryDirectory() as tmp:
        folder = Path(tmp)
        samples = decode(ffmpeg, current_mp3, folder, "base")
        duration = len(samples) / SAMPLE_RATE
        planned = []
        for change in changes:
            start, end = cut_points(words, change["span"], duration)
            planned.append((start, end, change))
        # Work from the end so earlier cut points keep their positions.
        for index, (start, end, change) in enumerate(sorted(planned, key=lambda p: p[0], reverse=True)):
            replacement = array.array("h")
            if change["new"]:
                replacement = trim_silence(decode(ffmpeg, synthesize(change["new"]), folder, f"new{index}"))
                voiced += len(change["new"])
            a, b = int(start * SAMPLE_RATE), int(end * SAMPLE_RATE)
            samples = samples[:a] + replacement + samples[b:]
            log(f"  {start:.2f}-{end:.2f} s: «{change['old'][:60]}» -> «{change['new'][:60]}»")
        return encode(ffmpeg, samples, folder), voiced
