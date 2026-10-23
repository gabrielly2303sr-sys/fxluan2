# ARCANA LAB — Enhanced 2026.10.23-r7

> Build r7: inclui os efeitos de interface originais dentro do projeto e remove a regra que impedia o Git de enviar a pasta de SFX. A música MP3 comercial continua local e ignorada pelo Git. A URL `127.0.0.1` é o servidor local, não o número da versão.

# ARCANA LAB — Descubra a função quadrática (GUI Persona 3 Reload)

Minigame web 100% offline em HTML/CSS/JS puro (sem dependências, sem build).
Descubra **a, b, c** de `f(x) = ax² + bx + c` a partir do gráfico e de 3 pontos.

## Repositório GitHub `fxluan2`
Este pacote já está organizado com os arquivos do projeto na raiz para inicializar um repositório Git. O repositório está destinado a ser público. Os efeitos UI em `assets/audio/fxluan2-sfx/` estão incluídos e são sintetizados para este projeto. A trilha MP3 local fica fora do Git.

## Publicar no GitHub

Como o repositório `gabrielly2303sr-sys/fxluan2` já existe, extraia este pacote numa pasta limpa e execute `./publish-update.fish`. O script clona o repositório existente, copia as alterações, cria um commit e faz `push` para `main`, usando a autenticação local do `gh`. A música MP3 local é ignorada; os SFX UI do próprio projeto são versionados normalmente.

## Executar (Linux / Fish)
```fish
cd ~/Downloads/fxluan2; and ./run.fish
```
Use o servidor local para evitar cache de arquivos de mídia. Os SFX UI já estão incluídos no projeto.

## Fluxo
Menu principal: **PLAY · EXPLICAÇÃO · QUIT** (mouse, ↑/↓ + Enter, `Esc` volta).
- **PLAY** abre o menu no estilo Options do Persona (fundo em vídeo com blur aplicado por CSS): aba **JOGAR** (botão JOGAR, dificuldade inicial, cronômetro), **VISUAL** (animações, grade, contraste) e **ÁUDIO** (música, efeitos). O menu principal e o de pausa não têm botão separado de configurações: PLAY leva à tela de opções. Tudo salvo em `localStorage`.
- **JOGAR** abre o **calendário de fases** (baseado no Calendar.qml): 30 fases na diagonal, a atual grande, as vencidas com lua cheia e ★ pontuação, as bloqueadas escuras. Setas/roda do mouse trocam de fase, Enter joga. A dificuldade sobe a cada fase (FÁCIL 1–10, MÉDIO 11–20, DIFÍCIL 21–30; a "dificuldade inicial" adianta a curva).
- **Jogo**: gráfico com a curva sendo traçada, 3 pontos, campos a/b/c (aceita `1/2` e `-1,5`), DICA (3 níveis), RESOLVER (passo a passo, a fase não conta), TROCAR. Acertar gera partículas, flash e contagem de pontos; errar treme a tela.
- **Pausa** (`Esc`): CONTINUAR, EXPLICAÇÃO, REINICIAR, FASES, MENU — mesmo componente do menu principal. O cronômetro para; ao voltar do calendário aberto pela pausa, o jogo retorna ao menu de pausa.
- **QUIT**: tenta `window.close()`; senão mostra tela de saída.
- **Áudio**: os efeitos UI empacotados em `assets/audio/fxluan2-sfx/*.wav` são enviados junto com o projeto e funcionam no GitHub Pages sem importação local. O jogo também preserva fallback em `assets/audio/*.ogg`. Ao executar `./run.fish`, o projeto procura a música MP3 local; se não existir, usa `music.ogg`.

## Textos editáveis
Os textos visíveis da interface — menus, pausa, configurações, calendário, instruções, dicas, lições e explicações passo a passo — ficam centralizados em `js/texts.js`. Para mudar rótulos, descrições, mensagens e lições, edite esse catálogo; os scripts constroem a interface com esses valores.

## Estrutura
`serve.py` (servidor local com porta livre e cache desativado) · `js/texts.js` (catálogo de textos editáveis) · `js/math.js` (geração/verificação, testável em Node) · `js/core.js` (prefs, som, transição) · `js/menu.js` (P3rpause.qml) · `js/screens.js` (Options.qml/Resume.qml) · `js/calendar.js` (Calendar.qml) · `js/game.js` · `assets/` (frames, vídeos mp4+webm, fontes, imagens do Persona).

## Efeitos de áudio e visual
Os arquivos `assets/audio/phase.ogg` e `assets/audio/unlock.ogg` são efeitos originais sintetizados para a entrada de fase e conclusão. `prepare_assets.py` procura apenas a música local; os SFX originais sintetizados já estão dentro do ZIP e do repositório. O áudio aplica velocidade 1× e transição suave de volume; a reprodução inicia no gesto do usuário para respeitar as restrições do navegador. O menu de configurações usa blur sobre o vídeo e os retratos de fundo, com sobreposição escura para manter a legibilidade. No r3, PLAY / VISUAL / ÁUDIO trocam de categoria ao passar o mouse ou selecionar um tab, com som e feedback visual. A entrada do painel é reproduzida uma única vez; mover entre opções não reinicia a animação inteira. O fundo e os retratos foram reconstruídos de recursos em qualidade maior do ZIP de referência; o vídeo de explicação foi reexportado em 1080p.

## Desempenho
Sem loops de render: só há `setInterval` de 250 ms (cronômetro) e vídeos que são pausados quando cobertos/aba oculta. O gráfico só é redesenhado quando algo muda. Com "Animações" desligado não há vídeo em movimento nem transições.

## Limitações honestas
- O projeto `arcana-lab(3).zip` foi preservado e aprimorado; o ZIP `Persona-Quickshell` foi usado como referência visual e fonte de recursos. Os itens de energia do shell original são imagens com texto embutido (SHUTDOWN/RESTART/LOGOUT); o jogo recria o visual inclinado em CSS e usa PLAY como entrada para as opções, sem um botão SETTINGS independente. Os shaders `.qsb` (stars/ripple/parallax) não foram usados.
- A pasta `Assets/fonts` não veio no ZIP do Persona; usei Bebas Neue e Montserrat (as mesmas famílias referenciadas no QML).
- Não houve comparação lado a lado com o Persona rodando; portanto **não afirmo fidelidade 1:1**, apenas reaproveitamento dos recursos e layouts lidos do QML.

## Correções de reprodução r4
- O vídeo de entrada do menu foi normalizado para CFR 24 fps (H.264 MP4 e VP9 WebM), com timestamps reiniciados e keyframes regulares; o MP4 é tentado primeiro e o WebM é fallback.
- O código redefine `playbackRate` para `1×`, monitora progresso da mídia e troca para o loop quando a intro não começa ou fica congelada; se o loop também travar, tenta reiniciar e depois mostra uma imagem estática em vez de deixar um frame preso.
- As faixas da transição foram ampliadas de 95%×30% para 109,25%×34,5%, sobrepostas para cobrir a tela sem frestas.
- Para usar sua música MP3 localmente: deixe o arquivo em uma pasta comum como `~/Downloads` e execute `./run.fish`. O importador procura o arquivo automaticamente; ele não será publicado no Git.


## Ajustes visuais r6
- O menu usa o mesmo vídeo de fundo com personagem e piscina/céu já presente nos recursos do projeto. A seleção mostra uma fita branca inclinada com sombra vermelha, enquanto o texto usa gradiente preto/vermelho com `mix-blend-mode: multiply`, ficando mais escuro sobre a parte azul fora da fita.
- Os tabs PLAY/VISUAL/ÁUDIO usam tipografia itálica, cartões angulares brancos no hover/seleção e sombra deslocada vermelha.
- O MP3 de música não é redistribuído pelo ZIP: se estiver em uma pasta comum do usuário, o início do projeto o copia para `assets/audio/full-moon-full-life.mp3`. Sem ele, usa `music.ogg`. Os efeitos UI do r7 já vêm dentro do projeto.


## Áudio r7
- A pasta `assets/audio/fxluan2-sfx/` contém 12 efeitos de interface sintetizados para este projeto (hover, clique, voltar, sucesso, erro, tick, dica, transição, abrir, limpar, entrada de fase e desbloqueio).
- Esses WAVs são arquivos do próprio projeto e não são ignorados pelo Git; portanto, serão incluídos no commit e disponibilizados junto ao site.
- O MP3 de música continua excluído do Git por segurança de licenciamento e tamanho.
- `publish-update.fish` envia as mudanças para o repositório existente `gabrielly2303sr-sys/fxluan2`; o GitHub Pages publica a atualização após o push.
