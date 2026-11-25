from __future__ import annotations

import hashlib
import io
import threading
import time
from pathlib import Path
from typing import Any

import httpx
from PIL import Image
from rembg import new_session, remove

CUTOUT_CACHE_DIR = Path(__file__).resolve().parent / "cache" / "cutouts"
CUTOUT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

_WIKI_HEADERS = {
    "User-Agent": "BundesligaPortfolioApp/1.0 (https://example.com; contact@example.com)"
}

_REMBG_SESSION: Any = None
_REMBG_LOCK = threading.RLock()
_MISS_CACHE: set[str] = set()


def _get_session() -> Any:
    global _REMBG_SESSION
    with _REMBG_LOCK:
        if _REMBG_SESSION is None:
            _REMBG_SESSION = new_session("u2net_human_seg")
        return _REMBG_SESSION


def remove_background_to_png(raw_bytes: bytes, max_dim: int = 440) -> bytes:
    """Remove background from a player photo and tightly trim to a transparent PNG cutout."""
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    buf_in = io.BytesIO()
    img.save(buf_in, format="PNG")
    with _REMBG_LOCK:
        cutout_bytes = remove(buf_in.getvalue(), session=_get_session())

    out_img = Image.open(io.BytesIO(cutout_bytes)).convert("RGBA")
    bbox = out_img.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        crop_box = (
            max(0, left - 6),
            max(0, top - 6),
            min(out_img.width, right + 6),
            bottom,
        )
        out_img = out_img.crop(crop_box)

    buf_out = io.BytesIO()
    out_img.save(buf_out, format="PNG", optimize=True)
    return buf_out.getvalue()


def _candidate_slugs(name: str) -> list[str]:
    base = name.strip().replace(" ", "_")
    slugs = [base]
    # Handle common diacritic endings (e.g. Demirovic -> Demirović)
    if base.endswith("ic"):
        slugs.append(base[:-2] + "i%C4%87")
    return slugs


def _find_wikipedia_image_url(client: httpx.Client, name: str) -> tuple[str | None, bool]:
    """Return (image_url, is_definitive_miss)."""
    rate_limited = False
    for slug in _candidate_slugs(name):
        for lang in ("en", "de"):
            url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{slug}"
            try:
                r = client.get(url)
                if r.status_code == 200:
                    data = r.json()
                    img_url = (data.get("thumbnail") or {}).get("source") or (
                        data.get("originalimage") or {}
                    ).get("source")
                    if img_url:
                        return img_url, False
                elif r.status_code == 429:
                    rate_limited = True
                    time.sleep(0.4)
            except Exception:
                rate_limited = True
    return None, not rate_limited


def get_or_create_player_cutout(name: str) -> bytes | None:
    """Return cached transparent PNG cutout bytes for a player, generating on first request."""
    key = name.strip().lower()
    if key in _MISS_CACHE:
        return None

    cache_key = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    cache_path = CUTOUT_CACHE_DIR / f"{cache_key}.png"
    if cache_path.exists():
        return cache_path.read_bytes()

    with httpx.Client(
        timeout=15.0, follow_redirects=True, headers=_WIKI_HEADERS
    ) as client:
        img_url, definitive_miss = _find_wikipedia_image_url(client, name)
        if not img_url:
            if definitive_miss:
                _MISS_CACHE.add(key)
            return None

        try:
            img_resp = client.get(img_url)
            if img_resp.status_code != 200 or len(img_resp.content) < 2000:
                return None
            cutout_png = remove_background_to_png(img_resp.content)
            cache_path.write_bytes(cutout_png)
            return cutout_png
        except Exception as exc:
            print(f"[cutouts] Failed for {name}: {exc}")
            return None
