#!/usr/bin/env python3
"""Import a user-local soundtrack when available; UI SFX are bundled in the project."""
from pathlib import Path
import shutil
import unicodedata
import os

ROOT = Path(__file__).resolve().parent
CUSTOM_MUSIC = ROOT / "assets" / "audio" / "full-moon-full-life.mp3"
MUSIC_TITLE = "full moon full life"
MUSIC_SEARCH_DIRS = [
    "Downloads", "Music", "Música", "Desktop", "Área de Trabalho",
    "Documents", "Documentos", "Videos", "Vídeos", "audio", "Áudio",
]
MUSIC_NAMES = ["Full Moon Full Life [hWhgrA2dhrk].mp3", "Full Moon Full Life.mp3"]


def normalize_name(name: str) -> str:
    value = unicodedata.normalize("NFKD", name)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in value).split())


def find_user_music(home: Path):
    target = normalize_name(MUSIC_TITLE)
    found = []
    checked = set()
    for dirname in MUSIC_SEARCH_DIRS:
        folder = home / dirname
        if not folder.is_dir():
            continue
        for current, dirs, files in os.walk(folder):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", ".git"}]
            for filename in files:
                if not filename.lower().endswith(".mp3") or target not in normalize_name(Path(filename).stem):
                    continue
                candidate = Path(current) / filename
                try:
                    key = candidate.resolve()
                    if key not in checked:
                        found.append(candidate)
                        checked.add(key)
                except OSError:
                    found.append(candidate)
    try:
        for item in home.iterdir():
            if item.is_file() and item.suffix.lower() == ".mp3" and target in normalize_name(item.stem):
                found.append(item)
    except OSError:
        pass
    return max((p for p in found if p.is_file()), key=lambda p: p.stat().st_mtime) if found else None


def main():
    home = Path.home()
    expected = [home / "Downloads" / name for name in MUSIC_NAMES]
    found = [p for p in expected if p.is_file()]
    source = max(found, key=lambda p: p.stat().st_mtime) if found else find_user_music(home)
    if source:
        CUSTOM_MUSIC.parent.mkdir(parents=True, exist_ok=True)
        if not CUSTOM_MUSIC.exists() or source.stat().st_mtime > CUSTOM_MUSIC.stat().st_mtime + 1:
            shutil.copy2(source, CUSTOM_MUSIC)
            print(f"Áudio: música local encontrada e ativada: {source}", flush=True)
        else:
            print("Áudio: música local já configurada.", flush=True)
    elif CUSTOM_MUSIC.exists():
        print("Áudio: usando música local já configurada.", flush=True)
    else:
        print("Áudio: MP3 local não encontrado; será usada a música de fallback.", flush=True)
    sfx_count = len(list((ROOT / "assets" / "audio" / "fxluan2-sfx").glob("*.wav")))
    print(f"Áudio: {sfx_count} efeitos UI originais incluídos no projeto.", flush=True)


if __name__ == "__main__":
    main()
