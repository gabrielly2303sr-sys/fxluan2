/*
 * ARCANA LAB — CENTRAL DE TEXTOS
 * Edite títulos, rótulos, instruções, descrições e lições neste arquivo.
 * A marcação HTML usada em explain.* permite negrito, código e quebras de linha.
 */
window.ARCANA_TEXT = {
  appName: 'ARCANA LAB',
  common: { enabled: '● ON', disabled: '○ OFF', points: 'Pontos:', question: '?', off: 'OFF' },
  menu: {
    main: { play: 'PLAY', explain: 'EXPLICAÇÃO', quit: 'QUIT' },
    pause: { continue: 'CONTINUAR', explain: 'EXPLICAÇÃO', restart: 'REINICIAR', phases: 'FASES', menu: 'MENU' },
    exitTitle: 'OBRIGADO POR JOGAR', exitBody: 'Você já pode fechar esta aba.', exitBack: 'VOLTAR AO MENU'
  },
  settings: {
    categories: { playRole: 'PLAY', play: 'JOGAR', visualRole: 'VIEW', visual: 'VISUAL', audioRole: 'AUDIO', audio: 'ÁUDIO' },
    play: {
      startName: 'JOGAR', startDesc: '30 FASES. A dificuldade aumenta a cada etapa.',
      difficultyName: 'Dificuldade inicial', difficultyDesc: 'Escolha o ponto de partida. O desafio cresce a cada fase.',
      timerName: 'Cronômetro', timerDesc: 'Tempo por fase. Respostas rápidas rendem mais pontos.'
    },
    visual: {
      animationsName: 'Animações', animationsDesc: 'Transições, vídeos de fundo, partículas e impactos. Desligue para reduzir o uso de recursos.',
      gridName: 'Grade do gráfico', gridDesc: 'Mostra ou esconde a grade do plano cartesiano.',
      contrastName: 'Contraste reforçado', contrastDesc: 'Escurece os fundos e destaca os contornos para facilitar a leitura.'
    },
    audio: {
      musicName: 'Música de fundo', musicDesc: 'Trilha musical em loop durante os menus e o jogo.',
      effectsName: 'Efeitos sonoros', effectsDesc: 'Sons de navegação, confirmação, acerto, erro e progressão.'
    },
    difficulty: { easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL' },
    hints: [['ESC', 'VOLTAR'], ['↑ ↓', 'NAVEGAR'], ['ENTER', 'CONFIRMAR']],
    playButtonPrefix: '▶ '
  },
  calendar: {
    title: 'ARCANA', phase: 'FASE', clear: 'FASES CONCLUÍDAS', current: 'ATUAL', locked: 'BLOQUEADA',
    tiers: { easy: 'FÁCIL', medium: 'MÉDIO', hard: 'DIFÍCIL' },
    hints: [['ESC', 'VOLTAR'], ['← →', 'ESCOLHER FASE'], ['ENTER', 'JOGAR']],
    complete: 'CONCLUÍDA', scorePrefix: '★ ', playLocked: 'Conclua as fases anteriores para desbloquear esta.'
  },
  game: {
    score: 'PONTOS', streak: 'SEQUÊNCIA', time: 'TEMPO', knownPoints: 'PONTOS CONHECIDOS', answer: 'SUA RESPOSTA',
    verify: 'VERIFICAR', hint: 'DICA', solve: 'RESOLVER', swap: 'TROCAR', pause: 'PAUSA',
    pauseHint: 'ESC = PAUSA   ·   ENTER = VERIFICAR   ·   TROCAR = OUTRO DESAFIO (QUEBRA A SEQUÊNCIA)',
    phase: 'FASE', discover: 'DESCUBRA A FUNÇÃO', graph: 'f(x) = ax² + bx + c',
    defaultHint: 'Use os pontos e o gráfico para descobrir a, b e c. Peça uma DICA se precisar — cada dica reduz a pontuação.',
    invalid: 'Preencha a, b e c com números (ex.: 2, −1,5 ou 1/2).',
    wrong: 'Os campos em vermelho estão errados. Tente de novo ou peça uma dica.',
    revealed: 'Solução revelada: a fase NÃO conta.',
    correct: 'CORRETO!', incorrect: 'INCORRETO', solutionTitle: 'SOLUÇÃO PASSO A PASSO', retry: 'TENTAR OUTRO DESAFIO', close: 'FECHAR',
    complete: 'COMPLETA!', allDone: 'VOCÊ ZEROU!', nextPhase: 'PRÓXIMA FASE', phases: 'FASES',
    gained: 'PONTOS', total: 'TOTAL', streakLabel: 'SEQUÊNCIA', phasesLabel: 'FASES',
    tierSuffix: 'DESCUBRA A FUNÇÃO', point: 'P', xLabel: 'x', yLabel: 'y', coefficients: ['a', 'b', 'c'],
    hints: {
      first: 'Observe a abertura da parábola: ela abre para {direction}, então {sign}.',
      zeroPoint: ' Se houver um ponto com x = 0, então c = f(0) é o y desse ponto.',
      second: 'Substitua cada ponto em f(x) = ax² + bx + c. Você obtém: ',
      third: 'Subtraia as equações duas a duas para eliminar c. Depois de dividir pela diferença dos x, restam: ',
      thirdJoin: '. Agora elimine b.',
      noMore: 'Sem mais dicas — use RESOLVER para ver o passo a passo (vale 0 pontos).',
      hintPrefix: 'DICA {level}/3 — '
    }
  },
  explain: {
    title: 'EXPLICAÇÃO', back: 'VOLTAR', showSolution: 'VER SOLUÇÃO', fractionLabel: ' (a fracionário)',
    graphUp: '— abre para cima', graphDown: '— abre para baixo', graphNotParabola: '— a = 0 não é parábola!',
    plotValues: 'a = <b>{a}</b>, b = <b>{b}</b>, c = <b>{c}</b>',
    steps: {
      point: 'Ponto {i}: f({x}) = {y} → a·({x})² + b·({x}) + c = {y}  →  {eq}',
      subtract12: 'Subtraindo as equações 1 e 2 (c some) e dividindo por ({x2} − {x1}): a·({sum}) + b = {m}',
      subtract23: 'Subtraindo as equações 2 e 3 e dividindo por ({x3} − {x2}): a·({sum}) + b = {m}',
      eliminate: 'Subtraindo as duas novas equações (b some): a·({difference}) = {m23} − {m12}  →  a = {a}',
      findB: 'Substituindo, b = {b}.', findC: 'Usando o primeiro ponto, c = {c}.',
      substituteB: 'Voltando: b = {m12} − ({a})·({sum}) = {b}',
      substituteC: 'Por fim, c = y₁ − a·x₁² − b·x₁ = {y} − ({a})·{xsq} − ({b})·({x}) = {c}',
      answer: 'Resposta: f(x) = {a}x² {b}x {c}'
    },
    lessons: [
      { title: 'OS COEFICIENTES a, b, c', intro: 'Toda função quadrática tem a forma <code>f(x) = ax² + bx + c</code>, com <b>a ≠ 0</b>. Seu gráfico é uma <b>parábola</b>.', detail: '<b>a</b> acompanha x², <b>b</b> acompanha x e <b>c</b> é o termo sozinho. Exemplo: {example} → <b>a = 2, b = −3, c = 5</b>. Atenção aos sinais!', tip: 'Mexa nos controles abaixo e veja como cada coeficiente muda a parábola:' },
      { title: 'O SINAL DE a', intro: '<b>a &gt; 0</b>: a parábola abre para <b>cima</b> (tem um ponto mínimo). <b>a &lt; 0</b>: abre para <b>baixo</b> (ponto máximo).', detail: 'Quanto maior o valor absoluto de <b>a</b>, mais <b>fechada</b> (estreita) fica a parábola.' },
      { title: 'c É O VALOR f(0)', intro: 'Quando x = 0: <code>f(0) = a·0² + b·0 + c = c</code>. Então a parábola cruza o eixo y exatamente em <b>(0, c)</b>.', detail: 'Se algum ponto do desafio tiver x = 0, o y dele já é o <b>c</b>. Sem entregar nada: procure esse ponto primeiro!', tip: true },
      { title: 'SUBSTITUINDO PONTOS', intro: 'Cada ponto <code>(x, y)</code> vira uma equação: troque x e y em <code>y = ax² + bx + c</code>.', detail: 'Exemplo com os pontos <code>(−1, 2)</code>, <code>(1, 6)</code> e <code>(2, 11)</code>:<br>• x = −1 → <code>1a − 1b + c = 2</code><br>• x = 1 → <code>1a + 1b + c = 6</code><br>• x = 2 → <code>4a + 2b + c = 11</code>', tip: 'Truque: somando as duas primeiras, <code>2a + 2c = 8</code>; subtraindo, <code>2b = 4</code> → <b>b = 2</b>. Pontos com x = 1 e x = −1 entregam b rapidamente.' },
      { title: 'MONTANDO O SISTEMA', intro: 'Três pontos com x diferentes dão um sistema 3×3 com <b>solução única</b>. Elimine <b>c</b>, depois <b>b</b>, e encontre <b>a</b>:', tip: 'Conferência: <code>f(−1) = 1 − 2 + 3 = 2 ✔</code> &nbsp; <code>f(1) = 6 ✔</code> &nbsp; <code>f(2) = 4 + 4 + 3 = 11 ✔</code>' },
      { title: 'EXEMPLOS PROGRESSIVOS', tip: 'Tente resolver no papel e só depois clique em <b>VER SOLUÇÃO</b>.' },
      { title: 'DICAS ÚTEIS', tips: [
        ['c', 'O ponto com <b>x = 0</b> dá c direto: <code>c = f(0)</code>.'],
        ['a', 'Para cima → <b>a &gt; 0</b>. Para baixo → <b>a &lt; 0</b>.'],
        ['b', '<code>f(1) = a + b + c</code> e <code>f(−1) = a − b + c</code>. Logo <code>b = [f(1) − f(−1)] / 2</code>.'],
        ['SIMETRIA', 'Dois pontos com o mesmo y são simétricos em relação ao vértice: <code>xᵥ = (x₁ + x₂) / 2</code>, e <code>xᵥ = −b / 2a</code>.'],
        ['RAÍZES', 'Se a parábola cruza o eixo x em r e s: <code>f(x) = a(x − r)(x − s)</code>.'],
        ['TABELA', 'Com x = 0, 1, 2, ... a segunda diferença dos valores de y é sempre <b>2a</b>.'],
        ['ENTRADA', 'No jogo você pode digitar <b>frações</b> (<code>1/2</code>) ou decimais com vírgula (<code>−1,5</code>).'],
        ['CONFIRA', 'Substitua os <b>três</b> pontos na sua função. Se um falhar, revise os sinais de b e c primeiro.']
      ] }
    ]
  }
};
