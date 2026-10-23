#!/usr/bin/env fish
# Creates a PUBLIC GitHub repository named fxluan2 and pushes this project.
# Run this from the extracted project directory: ./publish-to-github.fish

set -l project (cd (dirname (status --current-filename)); and pwd)
cd "$project"

if not command -q git
    echo "ERRO: Git não está instalado. Instale git e tente novamente."
    exit 1
end
if not command -q gh
    echo "ERRO: GitHub CLI (gh) não está instalado. Instale gh e execute este arquivo novamente."
    exit 1
end
if not gh auth status >/dev/null 2>&1
    echo "Você precisa autenticar o GitHub CLI primeiro: gh auth login"
    exit 1
end

set -l repo_name fxluan2
set -l owner (gh api user --jq .login)
if test -z "$owner"
    echo "ERRO: não consegui identificar a conta conectada ao GitHub."
    exit 1
end
if gh repo view "$owner/$repo_name" >/dev/null 2>&1
    echo "O repositório $owner/$repo_name já existe; vou publicar a atualização nele."
    exec fish "$project/publish-update.fish"
end

if not git rev-parse --is-inside-work-tree >/dev/null 2>&1
    git init -b main; or exit 1
else
    git branch -M main; or exit 1
end

# Set a local commit identity only if this project does not already have one.
if not git config --local user.name >/dev/null 2>&1
    git config --local user.name "$owner"; or exit 1
end
if not git config --local user.email >/dev/null 2>&1
    set -l user_id (gh api user --jq .id)
    git config --local user.email "$user_id+$owner@users.noreply.github.com"; or exit 1
end

git add .; or exit 1
if git diff --cached --quiet
    echo "Não há arquivos novos para commit."
else
    git commit -m "Initial commit: ARCANA LAB Enhanced r8"; or exit 1
end

gh repo create "$repo_name" --public --source . --remote origin --push; or exit 1
echo "Concluído: https://github.com/$owner/$repo_name"
echo "O repositório foi criado como PÚBLICO. Todos os arquivos rastreados podem ser vistos por qualquer pessoa."
