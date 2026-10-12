#!/usr/bin/env python3
"""Arabic narration queue (tts/arabic_requests.json), kept apart from the English-only queue.

Same flow as process_requests.py: the chapter title, a paragraph break, then the story;
parenthetical spans are not read, while honorifics written in the text itself
are read. Audio is written only to existing arabic_audio objects, keeping their download
token so the current audioUrl values stay valid.
"""
from __future__ import annotations

import json
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any
from urllib import error, request

sys.path.insert(0, str(Path(__file__).resolve().parent))
from process_requests import (  # noqa: E402
    MAX_TEXT_CHARS,
    TtsError,
    end_title,
    get_access_token,
    get_object_metadata,
    multipart_upload,
    strip_parenthetical_content,
)

VOICE_ID = "w4LX7bK479eHGM1k15Em"
MODEL_ID = "eleven_v4"
SPEED = 0.96
REQUESTS_FILE = Path(os.environ.get("STORIES_TTS_ARABIC_REQUESTS_FILE", "tts/arabic_requests.json"))
ARABIC_SCRIPT_RE = re.compile(r"[؀-ۿ]")
def log(message: str) -> None:
    print(f"[Stories TTS Arabic] {message}", flush=True)


def narration_for_audio(text: str) -> str:
    cleaned = strip_parenthetical_content(text)
    cleaned = re.sub(r"[ \t]+([،؛.!?؟:])", r"\1", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    return end_poem_lines(end_title(read_as_written(cleaned.strip())))


def read_as_written(text: str) -> str:
    """Listener fixes (Rabia Okutan, 2026-10-12):
    - Inside ﴿…﴾ the voice switched to recitation: slow, heavy tajweed, and it stopped mid-verse,
      dropping the final vowels (وَاحِدَهْ for وَاحِدَةٍ). Verses are read like the rest of the text,
      every word with its full vowels, so the ornate brackets become plain quotes for the voice.
    - «سُورَةُ ص» was read "saa"; the sura's name is read صَادْ.
    - A line opening with the article (a title such as الِاسْتِقْرَارُ) starts with "a", not "i"."""
    text = text.replace("﴿", "«").replace("﴾", "»")
    text = re.sub(r"(سُورَ[ةت][َُِ]?\s+)ص(?=[\s.,،:؛»]|$)", r"\1صَادْ", text)
    return re.sub(r"(?m)^(«?)ال", r"\1اَل", text)


def end_poem_lines(text: str) -> str:
    """A poem line without closing punctuation ran into the next line ("gerek Misafirdir");
    a comma at its end gives the voice a short pause, as a reader pauses at a line break."""
    lines = text.split("\n")
    in_poem = False
    for index, line in enumerate(lines):
        marker = line.strip()
        if marker == "[POEM]":
            in_poem = True
        elif marker == "[/POEM]":
            in_poem = False
        elif in_poem and marker and not re.search(r"[.,،;؛:!?؟…»”\"]$", marker):
            comma = "،" if ARABIC_SCRIPT_RE.search(marker[-1]) else ","
            lines[index] = f"{line.rstrip()}{comma}"
    return "\n".join(lines)


def validate_request(item: dict[str, Any]) -> tuple[str, str, str]:
    request_id = str(item.get("id", "")).strip()
    narration_text = str(item.get("narrationText", "")).strip()
    storage_path = str(item.get("storagePath", "")).strip()

    if not re.fullmatch(r"[A-Za-z0-9._-]{6,120}", request_id):
        raise TtsError("Invalid request id.")
    if not ARABIC_SCRIPT_RE.search(narration_text):
        raise TtsError(f"{request_id}: narrationText is not Arabic.")
    if not storage_path or storage_path.startswith("/") or ".." in Path(storage_path).parts:
        raise TtsError(f"{request_id}: invalid storagePath.")
    in_arabic_audio_folder = any(
        part.lower().endswith("arabic_audio") for part in Path(storage_path).parts[:-1]
    )
    if not in_arabic_audio_folder or not storage_path.lower().endswith(".mp3"):
        raise TtsError(f"{request_id}: storagePath must be an .mp3 inside an arabic_audio folder.")
    return request_id, narration_text, storage_path


def elevenlabs_synthesize(api_key: str, narration_text: str, stability: float | None = None) -> bytes:
    cleaned = narration_for_audio(narration_text)
    if not cleaned:
        raise TtsError("Narration became empty after cleanup.")
    if len(cleaned) > MAX_TEXT_CHARS:
        raise TtsError(f"Narration is {len(cleaned)} characters; maximum is {MAX_TEXT_CHARS}.")

    endpoint = (
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
        "?output_format=mp3_44100_128"
    )
    # Speed is always overridden. A request may also set "stability" (higher = steadier, less
    # emotional delivery); otherwise the voice keeps its stored stability/similarity settings.
    voice_settings: dict[str, float] = {"speed": SPEED}
    if stability is not None:
        voice_settings["stability"] = stability
    body = json.dumps(
        {
            "text": cleaned,
            "model_id": MODEL_ID,
            "voice_settings": voice_settings,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = request.Request(
        endpoint,
        data=body,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=300) as response:
            audio = response.read()
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise TtsError(f"ElevenLabs returned {exc.code}: {details}") from exc

    if len(audio) < 1024:
        raise TtsError("ElevenLabs returned an unexpectedly small audio payload.")
    log(f"Generated {len(cleaned)} narration characters ({MODEL_ID}, speed {SPEED}).")
    return audio


def load_requests() -> list[dict[str, Any]]:
    if not REQUESTS_FILE.exists():
        log(f"No request file at {REQUESTS_FILE}; nothing to do.")
        return []
    payload = json.loads(REQUESTS_FILE.read_text(encoding="utf-8"))
    if payload.get("version") != 1:
        raise TtsError(f"{REQUESTS_FILE} must use version 1.")
    items = payload.get("requests")
    if not isinstance(items, list):
        raise TtsError(f"{REQUESTS_FILE} must contain a requests array.")
    # One request per Storage object, as in the English queue. Two enabled requests for the
    # same path would both regenerate whenever the queue changes, and with parallel workers
    # the older text could finish last and win.
    latest_by_path: dict[str, dict[str, Any]] = {}
    for item in items:
        if isinstance(item, dict) and item.get("enabled", True):
            latest_by_path[str(item.get("storagePath", ""))] = item
    return list(latest_by_path.values())


def process_item(api_key: str, access_token: str, item: dict[str, Any]) -> str:
    """Returns "processed" or "skipped"; raises TtsError on failure."""
    request_id, narration_text, storage_path = validate_request(item)
    existing = get_object_metadata(access_token, storage_path)
    existing_custom = (existing or {}).get("metadata") or {}

    if existing_custom.get("storiesTtsRequestId") == request_id:
        log(f"{request_id}: already processed; skipping.")
        return "skipped"
    if existing is not None and item.get("allowOverwrite") is not True:
        raise TtsError(f"{request_id}: target already exists. Set allowOverwrite=true after approval.")

    log(f"{request_id}: generating Arabic narration -> {storage_path}")
    stability = item.get("stability")
    if stability is not None and not (isinstance(stability, (int, float)) and 0 <= stability <= 1):
        raise TtsError(f"{request_id}: stability must be a number between 0 and 1.")
    audio = elevenlabs_synthesize(api_key, narration_text, stability)
    uploaded, firebase_url = multipart_upload(
        access_token, storage_path, audio, existing, request_id, voice_id=VOICE_ID
    )
    log(f"{request_id}: uploaded generation {uploaded.get('generation', 'unknown')} ({len(audio)} bytes).")
    log(f"{request_id}: {firebase_url}")
    return "processed"


def main() -> int:
    items = load_requests()
    if not items:
        return 0

    api_key = os.environ.get("ELEVENLABS_ARABIC_API_KEY", "").strip()
    if not api_key:
        raise TtsError("ELEVENLABS_ARABIC_API_KEY is not available.")

    access_token = get_access_token()
    # A Cloud Build run has a hard time limit, so work in parallel and stop starting new
    # chapters once the budget is spent. Anything left over is picked up by the next build.
    workers = max(1, int(os.environ.get("STORIES_TTS_ARABIC_WORKERS", "3")))
    budget = float(os.environ.get("STORIES_TTS_ARABIC_BUDGET_SECONDS", "600"))
    started = time.monotonic()
    stop = threading.Event()
    counts = {"processed": 0, "skipped": 0, "failed": 0, "deferred": 0}
    lock = threading.Lock()

    def run(item: dict[str, Any]) -> None:
        if stop.is_set() or time.monotonic() - started > budget:
            with lock:
                counts["deferred"] += 1
            return
        try:
            result = process_item(api_key, access_token, item)
        except TtsError as exc:
            log(f"FAILED {item.get('id')}: {exc}")
            with lock:
                counts["failed"] += 1
            if "quota" in str(exc).lower():
                log("ElevenLabs quota exhausted; stopping. The queue is retried on the next build.")
                stop.set()
            return
        with lock:
            counts[result] += 1

    with ThreadPoolExecutor(max_workers=workers) as pool:
        list(pool.map(run, items))

    log(
        "Complete. "
        f"processed={counts['processed']}, skipped={counts['skipped']}, "
        f"failed={counts['failed']}, deferred={counts['deferred']}"
    )
    # Deferred chapters must keep the queue "unfinished", so the build does not save the
    # queue hash and the next build carries on with them.
    if counts["deferred"]:
        log(f"{counts['deferred']} chapters wait for the next build (time budget spent).")
    return 1 if counts["failed"] or counts["deferred"] else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (TtsError, json.JSONDecodeError) as exc:
        print(f"[Stories TTS Arabic] FAILED: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(1)
