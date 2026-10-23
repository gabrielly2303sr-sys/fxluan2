#!/usr/bin/env python3
"""Import local audio assets from ~/Downloads at launch (no interactive setup).
The commercial MP3 is not redistributed in this ZIP; it is copied locally only
when the original user-supplied file is present on this machine.
"""
from pathlib import Path
from zipfile import ZipFile, BadZipFile
import shutil
import unicodedata
import os

ROOT = Path(__file__).resolve().parent
DOWNLOADS = Path.home() / "Downloads"
AUDIO = ROOT / "assets" / "audio"
CUSTOM_MUSIC = AUDIO / "full-moon-full-life.mp3"
MUSIC_NAMES = ["Full Moon Full Life [hWhgrA2dhrk].mp3", "Full Moon Full Life.mp3"]
MUSIC_TITLE = "full moon full life"
MUSIC_SEARCH_DIRS = [
    "Downloads", "Music", "Música", "Desktop", "Área de Trabalho",
    "Documents", "Documentos", "Videos", "Vídeos", "audio", "Áudio",
]
SFX_NAMES = ["df025566-277c-49cd-854b-84ea36bb953c.zip"]
P3R_DIR = AUDIO / "p3r-sfx"


def normalize_name(name: str) -> str:
    value = unicodedata.normalize("NFKD", name)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in value).split())


def find_user_music(home: Path):
    """Find a user-owned copy with flexible filename matching in common folders."""
    target = normalize_name(MUSIC_TITLE)
    found = []
    checked = set()

    # Exact expected names first, regardless of case.
    for dirname in MUSIC_SEARCH_DIRS:
        folder = home / dirname
        if not folder.is_dir():
            continue
        try:
            for item in folder.iterdir():
                if item.is_file() and item.suffix.lower() == ".mp3" and target in normalize_name(item.stem):
                    found.append(item)
        except OSError:
            pass

    # Then search inside common folders, including renamed copies like "(1)".
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

    # Also check MP3s directly in the home folder.
    try:
        for item in home.iterdir():
            if item.is_file() and item.suffix.lower() == ".mp3" and target in normalize_name(item.stem):
                found.append(item)
    except OSError:
        pass
    files = [p for p in found if p.is_file()]
    return max(files, key=lambda p: p.stat().st_mtime) if files else None


def newest(paths):
    files = [p for p in paths if p.is_file()]
    return max(files, key=lambda p: p.stat().st_mtime) if files else None


def copy_if_newer(src: Path, dst: Path) -> bool:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists() or src.stat().st_mtime > dst.stat().st_mtime + 1:
        shutil.copy2(src, dst)
        return True
    return False


def main():
    music_src = newest([DOWNLOADS / n for n in MUSIC_NAMES])
    if not music_src:
        music_src = find_user_music(Path.home())
    if music_src:
        changed = copy_if_newer(music_src, CUSTOM_MUSIC)
        if changed:
            print(f"Áudio: Full Moon Full Life encontrado em {music_src} e ativado automaticamente.", flush=True)
        else:
            print("Áudio: Full Moon Full Life já está configurado.", flush=True)
    elif CUSTOM_MUSIC.exists():
        print("Áudio: usando a faixa Full Moon Full Life já configurada.", flush=True)
    else:
        searched = ", ".join("~/" + d for d in MUSIC_SEARCH_DIRS)
        print(f"Áudio: não encontrei um MP3 com 'Full Moon Full Life' em {searched} ou diretamente em ~. Será usada a trilha de fallback.", flush=True)

    # Look for the pack by exact name first, then inspect renamed ZIPs instead
    # of accidentally choosing the ARCANA project ZIP itself.
    sfx_src = newest([DOWNLOADS / n for n in SFX_NAMES])
    if not sfx_src:
        candidates = sorted(DOWNLOADS.glob("*.zip"), key=lambda p: p.stat().st_mtime, reverse=True)
        for candidate in candidates:
            try:
                with ZipFile(candidate) as candidate_zip:
                    if any(Path(i.filename.replace("\\", "/")).name.startswith("deck_ui_") and i.filename.lower().endswith(".wav") for i in candidate_zip.infolist()):
                        sfx_src = candidate
                        break
            except (BadZipFile, OSError):
                continue
    imported = 0
    if sfx_src:
        try:
            with ZipFile(sfx_src) as zf:
                for info in zf.infolist():
                    name = info.filename.replace("\\", "/")
                    if info.is_dir() or not name.lower().endswith(".wav"):
                        continue
                    base = Path(name).name
                    if not base.startswith("deck_ui_"):
                        continue
                    target = P3R_DIR / base
                    P3R_DIR.mkdir(parents=True, exist_ok=True)
                    if not target.exists() or info.file_size != target.stat().st_size:
                        with zf.open(info) as src, target.open("wb") as dst:
                            shutil.copyfileobj(src, dst)
                        imported += 1
            if imported:
                print(f"Áudio: {imported} SFX Persona detectados e ativados automaticamente.", flush=True)
        except (BadZipFile, OSError, RuntimeError) as exc:
            print(f"Áudio: não foi possível importar o ZIP de SFX ({exc}); efeitos alternativos serão usados.", flush=True)
    elif P3R_DIR.exists():
        print("Áudio: usando os SFX locais já configurados.", flush=True)
    else:
        print("Áudio: ZIP de SFX não encontrado; serão usados os efeitos alternativos.", flush=True)


if __name__ == "__main__":
    main()
