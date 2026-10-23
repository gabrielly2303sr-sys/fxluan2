#!/usr/bin/env python3
"""Find local personal audio and install it into the ignored assets/audio/local-pack folder.

Nothing copied here is included in a clean Git commit. A hosted static site can import the same
files through Options > ÁUDIO and keep them in this browser's IndexedDB.
"""
from pathlib import Path
import os
import shutil
import unicodedata
import zipfile
import io

ROOT = Path(__file__).resolve().parent
AUDIO_DIR = ROOT / "assets" / "audio" / "local-pack"
SFX_DIR = AUDIO_DIR / "sfx"
MUSIC_TITLE = "full moon full life"
SFX_ZIP_HINT = "df025566-277c-49cd-854b-84ea36bb953c.zip"
MUSIC_NAMES = ["Full Moon Full Life [hWhgrA2dhrk].mp3", "Full Moon Full Life.mp3"]
MUSIC_SEARCH_DIRS = ["Downloads", "Music", "Música", "Desktop", "Área de Trabalho", "Documents", "Documentos", "Videos", "Vídeos", "audio", "Áudio"]
SFX_SEARCH_DIRS = ["Downloads", "Desktop", "Área de Trabalho", "Documents", "Documentos"]
SFX_MAP = {
    "hover": "deck_ui_navigation.wav",
    "click": "deck_ui_default_activation.wav",
    "back": "deck_ui_side_menu_fly_out.wav",
    "good": "deck_ui_toast.wav",
    "bad": "deck_ui_bumper_end_02.wav",
    "tick": "deck_ui_slider_down.wav",
    "hint": "deck_ui_volume.wav",
    "whoosh": "deck_ui_tab_transition_01.wav",
    "open": "deck_ui_show_modal.wav",
    "clear": "deck_ui_hide_modal.wav",
    "phase": "deck_ui_launch_game.wav",
    "unlock": "deck_ui_achievement_toast.wav",
    "toggleOn": "deck_ui_switch_toggle_on.wav",
    "toggleOff": "deck_ui_switch_toggle_off.wav",
    "misc": "deck_ui_misc_10.wav",
    "sliderUp": "deck_ui_slider_up.wav",
    "sideMenuIn": "deck_ui_side_menu_fly_in.wav",
    "outOfGame": "deck_ui_out_of_game_detail.wav",
    "intoGame": "deck_ui_into_game_detail.wav",
}


def normalize_name(name: str) -> str:
    value = unicodedata.normalize("NFKD", name)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join("".join(ch.lower() if ch.isalnum() else " " for ch in value).split())


def walk_files(roots, suffixes):
    for dirname in roots:
        folder = Path.home() / dirname
        if not folder.is_dir():
            continue
        for current, dirs, files in os.walk(folder):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", ".git", "arcana-lab-r5-test", "arcana-lab-r6-test"}]
            for filename in files:
                path = Path(current) / filename
                if path.suffix.lower() in suffixes:
                    yield path


def find_music(home: Path):
    wanted = normalize_name(MUSIC_TITLE)
    expected = [home / "Downloads" / name for name in MUSIC_NAMES]
    exact = [p for p in expected if p.is_file()]
    if exact:
        return max(exact, key=lambda p: p.stat().st_mtime)
    candidates = []
    seen = set()
    for p in walk_files(MUSIC_SEARCH_DIRS, {".mp3"}):
        if wanted not in normalize_name(p.stem):
            continue
        try:
            key = p.resolve()
            if key not in seen:
                candidates.append(p); seen.add(key)
        except OSError:
            candidates.append(p)
    try:
        for p in home.iterdir():
            if p.is_file() and p.suffix.lower() == ".mp3" and wanted in normalize_name(p.stem):
                candidates.append(p)
    except OSError:
        pass
    return max(candidates, key=lambda p: p.stat().st_mtime) if candidates else None


def copy_music(home: Path):
    dest = AUDIO_DIR / "music.mp3"
    source = find_music(home)
    if source:
        AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        if not dest.exists() or source.stat().st_size != dest.stat().st_size or source.stat().st_mtime > dest.stat().st_mtime + 1:
            shutil.copy2(source, dest)
        print(f"Áudio local: música carregada de {source}", flush=True)
        return True
    if dest.is_file():
        print("Áudio local: música personalizada já importada.", flush=True)
        return True
    print("Áudio local: MP3 não encontrado; a aplicação usará a trilha de fallback. No site, abra ÁUDIO > IMPORTAR MP3.", flush=True)
    return False


def mapping_present():
    return sum(1 for name in SFX_MAP if (SFX_DIR / f"{name}.wav").is_file())


def copy_from_directory(source_dir: Path):
    by_name = {p.name.lower(): p for p in source_dir.rglob("*.wav")}
    count = 0
    for target, source_name in SFX_MAP.items():
        source = by_name.get(source_name.lower())
        if source:
            SFX_DIR.mkdir(parents=True, exist_ok=True)
            dest = SFX_DIR / f"{target}.wav"
            if not dest.exists() or source.stat().st_size != dest.stat().st_size:
                shutil.copy2(source, dest)
            count += 1
    return count


def copy_from_zip(path: Path):
    try:
        with zipfile.ZipFile(path) as zf:
            index = {Path(info.filename).name.lower(): info for info in zf.infolist() if not info.is_dir() and info.filename.lower().endswith(".wav")}
            if not {x.lower() for x in SFX_MAP.values()}.intersection(index):
                return 0
            SFX_DIR.mkdir(parents=True, exist_ok=True)
            count = 0
            for target, source_name in SFX_MAP.items():
                info = index.get(source_name.lower())
                if not info:
                    continue
                dest = SFX_DIR / f"{target}.wav"
                with zf.open(info) as source, dest.open("wb") as out:
                    shutil.copyfileobj(source, out)
                count += 1
            return count
    except (OSError, zipfile.BadZipFile, RuntimeError):
        return 0


def import_sfx(home: Path):
    existing = mapping_present()
    if existing == len(SFX_MAP):
        print(f"Áudio local: {existing} SFX personalizados já estão preparados.", flush=True)
        return existing
    candidates = []
    hinted = home / "Downloads" / SFX_ZIP_HINT
    if hinted.is_file():
        candidates.append(hinted)
    for p in walk_files(SFX_SEARCH_DIRS, {".zip"}):
        if p not in candidates and any(k in normalize_name(p.name) for k in ["persona", "reload", "sfx", "df025566"]):
            candidates.append(p)
    for p in candidates:
        count = copy_from_zip(p)
        if count:
            print(f"Áudio local: {count} SFX importados automaticamente de {p}", flush=True)
            return count
    # Also supports a pack previously extracted in the user's Downloads/Desktop/Documents.
    for dirname in SFX_SEARCH_DIRS:
        folder = home / dirname
        if not folder.is_dir():
            continue
        for current, dirs, files in os.walk(folder):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in {"node_modules", ".git"}]
            wav_names = {f.lower() for f in files if f.lower().endswith(".wav")}
            if sum(1 for name in SFX_MAP.values() if name.lower() in wav_names) >= 5:
                count = copy_from_directory(Path(current))
                if count:
                    print(f"Áudio local: {count} SFX importados da pasta {current}", flush=True)
                    return count
    if existing:
        print(f"Áudio local: {existing}/{len(SFX_MAP)} SFX personalizados encontrados; os restantes usam fallback.", flush=True)
        return existing
    print("Áudio local: ZIP de SFX não encontrado; use ÁUDIO > IMPORTAR ZIP SFX no site para escolher seu pacote.", flush=True)
    return 0


def main():
    home = Path.home()
    copy_music(home)
    sfx_count = import_sfx(home)
    bundled = len(list((ROOT / "assets" / "audio" / "fxluan2-sfx").glob("*.wav")))
    print(f"Áudio fallback do projeto: {bundled} WAVs. SFX personalizados locais: {sfx_count}/{len(SFX_MAP)}.", flush=True)


if __name__ == "__main__":
    main()
