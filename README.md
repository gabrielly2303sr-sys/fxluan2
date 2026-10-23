# ARCANA LAB — Enhanced 2026.10.23-r8

> r8 adiciona importação de áudio pessoal dentro das configurações do site. O MP3 e o ZIP de SFX podem ser escolhidos em **Configurações → ÁUDIO** e ficam salvos apenas no navegador que os importou. Ao executar `./run.fish`, o importador local também procura os arquivos nas pastas comuns do usuário. A página não envia os áudios ao GitHub.

## O projeto

Minigame web de matemática em HTML/CSS/JavaScript puro (sem build e sem dependências externas). Descubra **a, b, c** de `f(x) = ax² + bx + c` a partir do gráfico e de três pontos.

## Executar no CachyOS / Fish

```fish
cd ~/Downloads/arcana-lab; and ./run.fish
```

O servidor escolhe uma porta livre entre 8080–8100, desativa o cache e abre o navegador. `127.0.0.1` é o endereço do servidor local, não o número da versão.

## Menus e jogo

- **PLAY** abre as configurações de jogo: dificuldade inicial, cronômetro, VISUAL e ÁUDIO.
- O calendário apresenta 30 fases; fases concluídas são marcadas, fases futuras ficam bloqueadas e a dificuldade cresce ao longo da progressão.
- O desafio mostra o gráfico quadrático e três pontos; preencha `a`, `b` e `c`. DICA, RESOLVER e TROCAR ficam disponíveis durante a fase.
- `Esc` pausa/volta. As opções são salvas em `localStorage`.
- Os textos editáveis ficam centralizados em `js/texts.js`.

## Música e SFX personalizados

### No site hospedado (GitHub Pages)

Abra **PLAY → ÁUDIO** e clique em **IMPORTAR MP3** para selecionar sua cópia de `Full Moon Full Life`. Depois clique em **IMPORTAR ZIP SFX** e selecione seu ZIP com os WAVs. O site extrai e mapeia todos os 19 WAVs do pacote, usa os efeitos correspondentes nos controles e guarda os arquivos na IndexedDB do navegador e passa a usá-los nas próximas visitas desse mesmo navegador. Caso o navegador não consiga ler o ZIP, extraia-o no gerenciador de arquivos e use **IMPORTAR WAVs**. Esses arquivos permanecem no navegador e não são enviados a nenhum servidor.

### Executando localmente

Ao iniciar, `prepare_assets.py` procura `Full Moon Full Life` e o pacote de SFX em `~/Downloads`, `~/Desktop` e outras pastas comuns; quando encontrados, copia os arquivos para `assets/audio/local-pack/`. Os efeitos personalizados têm prioridade sobre os sons de fallback do projeto.

### Git e publicação

`assets/audio/local-pack/` e `assets/audio/full-moon-full-life.mp3` estão no `.gitignore`. O repositório contém sons de fallback criados para o próprio ARCANA LAB. A música e o pacote de áudio pessoal não são enviados pelo `publish-update.fish`; no site hospedado cada pessoa pode importar uma cópia local que tenha direito de usar.

Para publicar atualizações no repositório existente `gabrielly2303sr-sys/fxluan2`, extraia o ZIP em uma pasta limpa e execute `./publish-update.fish`. O script usa a sessão já autenticada no GitHub CLI (`gh`), preserva o histórico e se recusa a fazer push se a branch estiver divergente.

## Estrutura

- `index.html`: estrutura base do site.
- `css/style.css`: visual, layout, transições e animações.
- `js/texts.js`: catálogo de textos editáveis.
- `js/core.js`: preferências, áudio, IndexedDB, transição e gerenciamento de telas.
- `js/screens.js`: configurações, importação de áudio e explicações.
- `js/calendar.js`, `js/game.js`, `js/math.js`: calendário, desafio e matemática.
- `prepare_assets.py`: busca/importa áudios pessoais apenas para uso local.
- `serve.py` e `run.fish`: servidor local sem cache.
- `assets/audio/fxluan2-sfx/`: efeitos de fallback distribuídos com o projeto.

## Validação

Os scripts JS/Python podem ser verificados com `node --check js/core.js`, `node --check js/screens.js` e `python3 -m py_compile prepare_assets.py serve.py`. Os arquivos pessoais importados no navegador são armazenados localmente e não fazem parte do ZIP público.
