#!/usr/bin/env fish
# ARCANA LAB — Enhanced 2026.10.23-r8
# Importa a música/SFX de ~/Downloads automaticamente e evita cache/porta antiga.
cd (dirname (status -f))
if command -q python3
    python3 prepare_assets.py
    and python3 serve.py
else
    echo "Python 3 não encontrado; abra index.html no navegador."
    xdg-open index.html
end
