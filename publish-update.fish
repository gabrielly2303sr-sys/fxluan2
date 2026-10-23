#!/usr/bin/env fish
# Publica a versão atual no repositório existente sem apagar o histórico.
set -l project (cd (dirname (status --current-filename)); and pwd)
set -l repo "gabrielly2303sr-sys/fxluan2"

if not command -q git
    echo "ERRO: Git não está instalado."; exit 1
end
if not command -q gh
    echo "ERRO: GitHub CLI (gh) não está instalado."; exit 1
end
if not gh auth status >/dev/null 2>&1
    echo "ERRO: a sessão do GitHub CLI não está autenticada. Execute gh auth login."; exit 1
end
if not gh repo view $repo >/dev/null 2>&1
    echo "ERRO: não consigo acessar $repo com a conta autenticada. Confira as permissões."; exit 1
end

set -l tmp (mktemp -d "$HOME/Downloads/fxluan2-publish.XXXXXX")
if test -z "$tmp"
    echo "ERRO: não consegui criar uma pasta temporária."; exit 1
end

echo "Clonando $repo ..."
gh repo clone $repo "$tmp/repo"; or begin
    echo "ERRO: não consegui clonar o repositório."; exit 1
end

set -l target "$tmp/repo"
git -C "$target" checkout main; or begin
    echo "ERRO: não encontrei a branch main. Nenhum arquivo foi enviado."; exit 1
end
git -C "$target" pull --ff-only origin main; or begin
    echo "ERRO: a branch main tem alterações divergentes; não fiz push para evitar sobrescrever conteúdo."; exit 1
end

# Remove the old optional external SFX folder from the remote clone if it was ever committed.
# The public build uses the original bundled effects in assets/audio/fxluan2-sfx/ instead.
rm -rf "$target/assets/audio/p3r-sfx"

# Copy the extracted package over the clone. This package has no .git directory.
cp -a "$project"/. "$target"/; or begin
    echo "ERRO: falha ao copiar os arquivos do pacote."; exit 1
end

# Never stage a local commercial soundtrack even if it exists in the extracted folder.
git -C "$target" reset -q -- assets/audio/full-moon-full-life.mp3 2>/dev/null
if test -f "$target/assets/audio/full-moon-full-life.mp3"
    git -C "$target" rm --cached --ignore-unmatch assets/audio/full-moon-full-life.mp3 >/dev/null 2>&1
end

git -C "$target" add -A; or exit 1
if git -C "$target" diff --cached --quiet
    echo "O repositório já está atualizado; não há nada para enviar."
    echo "Site: https://gabrielly2303sr-sys.github.io/fxluan2/"
    exit 0
end

if not git -C "$target" config --local user.name >/dev/null 2>&1
    set -l login (gh api user --jq .login)
    git -C "$target" config --local user.name "$login"; or exit 1
end
if not git -C "$target" config --local user.email >/dev/null 2>&1
    set -l login (gh api user --jq .login)
    set -l uid (gh api user --jq .id)
    git -C "$target" config --local user.email "$uid+$login@users.noreply.github.com"; or exit 1
end

git -C "$target" commit -m "Bundle ARCANA LAB UI sound effects"; or exit 1
git -C "$target" push origin main; or begin
    echo "ERRO: o commit foi criado no clone temporário, mas o push falhou. Veja a mensagem do Git acima."; exit 1
end

echo "
Publicado com sucesso em https://github.com/$repo"
echo "GitHub Pages: https://gabrielly2303sr-sys.github.io/fxluan2/"
echo "O Pages pode precisar de alguns minutos para refletir as alterações."
echo "Clone temporário preservado em: $tmp/repo"
