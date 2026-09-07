# Arquitetura atual

## 1. Visão em 5 linhas

1. App de bingo com cartela 5×5 e Plinko: o índice do cesto escolhe o número resolvido na cartela (`src/hooks/useGameLogic.js:194`; `src/App.jsx:245`).
2. FINGO usa linha/coluna/diagonal e 50 bolas; BINGO exige cartela cheia e usa 100; SPINGO exige cinco marcações e usa 25 (`src/hooks/useGameLogic.js:10`; `src/hooks/useGameLogic.js:435`).
3. React 19, Vite 7, Tailwind 3, Matter.js 0.20, Framer Motion e Capacitor 8; entrada em StrictMode (`package.json:15`; `package.json:29`; `src/main.jsx:7`).
4. Scripts dev/build iniciam Vite e compilam; build:android compila e sincroniza o diretório dist pelo Capacitor (`package.json:8`; `package.json:12`; `capacitor.config.json:4`).
5. Android usa com.bingoplinko.game e MainActivity estende BridgeActivity, liberando mídia sem gesto na WebView em onCreate/onResume; execução em aparelho: não verificado (`capacitor.config.json:2`; `android/app/src/main/java/com/bingoplinko/game/MainActivity.java:6`).

## 2. Mapa de arquivos

| Arquivo em src/ | Responsabilidade e ponto de entrada |
| --- | --- |
| main.jsx | Monta App em StrictMode e importa o CSS global. (`src/main.jsx:6`) |
| App.jsx | Compõe Home, jogo, áudio, menu, modais e callbacks entre lógica e canvas. (`src/App.jsx:26`) |
| index.css | Estilos globais, diretivas Tailwind, animações e regras de toque. (`src/index.css:1`) |
| hooks/useGameLogic.js | Estado da partida, persistência de saldo/níveis, sorteios, compras e condições de vitória. (`src/hooks/useGameLogic.js:107`) |
| hooks/useTheme.js | Monta URLs de imagens e sons da skin Standard ou de Immutable. (`src/hooks/useTheme.js:3`) |
| hooks/useSound.js | Instâncias Audio, reprodução, volume, loop e pool para sons sobrepostos. (`src/hooks/useSound.js:3`) |
| utils/plinkoPhysics.js | Configuração, construção dos corpos estáticos, resize das bolas e cálculo do cesto pelo x. (`src/utils/plinkoPhysics.js:8`) |
| utils/sessionPhysics.js | Contador de lançamentos em sessionStorage/memória e fator de assistência. (`src/utils/sessionPhysics.js:20`) |
| utils/mathUtils.js | Probabilidades por nível e escolha de combinações de colunas não adjacentes. (`src/utils/mathUtils.js:30`) |
| utils/storage.js | Journal local síncrono, gravações Preferences serializadas, leitura da cópia recente e repetição de falhas. (`src/utils/storage.js:3`) |
| components/GameCanvas.jsx | Engine/Runner/Render, lançamento, colisões, partículas, vibração e resize. (`src/components/GameCanvas.jsx:8`) |
| components/BingoCard.jsx | Cartela DOM, cabeçalhos LUCKY, números, marcações e FREE. (`src/components/BingoCard.jsx:17`) |
| components/BucketRow.jsx | Cinco alvos clicáveis, números animados, destaque útil e chamas. (`src/components/BucketRow.jsx:160`) |
| components/Footer.jsx | Botões Spin/Fireball/Magic e contador de bolas, habilitados conforme a fase. (`src/components/Footer.jsx:3`) |
| components/Header.jsx | Saldo, balão de nível e abertura do menu. (`src/components/Header.jsx:4`) |
| components/SideMenu.jsx | Ajustes de música/efeitos/vibração, retorno à Home e fechamento do menu. (`src/components/SideMenu.jsx:4`) |
| components/LuckySpin.jsx | Rotação da roleta, ticker, espera de oito segundos, crédito e botão Continuar. (`src/components/LuckySpin.jsx:10`) |
| components/Modal/ConfirmationModal.jsx | Diálogo reutilizável com confirmar, fechar e ação secundária. (`src/components/Modal/ConfirmationModal.jsx:4`) |
| components/Modal/ConfirmationReward.jsx | Exibe recompensa concedida e ação de fechamento. (`src/components/Modal/ConfirmationReward.jsx:4`) |
| components/Modal/FireballModal.jsx | Compra Fireball ou solicita anúncio recompensado pelo callback watchReward. (`src/components/Modal/FireballModal.jsx:6`) |
| components/Modal/GameOverModal.jsx | Continuação paga/gratuita com dez bolas ou reinício. (`src/components/Modal/GameOverModal.jsx:3`) |
| components/Modal/MagicNumberModal.jsx | Seleciona célula não marcada e solicita sorteio pago/gratuito do número. (`src/components/Modal/MagicNumberModal.jsx:5`) |
| components/Modal/MessageModal.jsx | Mensagens por tipo; CelebrationContent mantém canvas e efeito de confete. (`src/components/Modal/MessageModal.jsx:5`) |
| components/Modal/NextLevelModal.jsx | Exibe prêmio, toca áudio de vitória e chama avanço de nível. (`src/components/Modal/NextLevelModal.jsx:3`) |
| components/CloudBackup.jsx | Status do backup automático, conexão Google, escolha de conflitos e privacidade de anúncios. (`src/components/CloudBackup.jsx:20`) |
| hooks/useAutomaticProgress.js | Liga mudanças de moedas/níveis ao sincronizador e repete ao voltar à página ou à rede. (`src/hooks/useAutomaticProgress.js:7`) |
| services/automaticProgress.js | Recuperação automática, fila durável de envios, conta proprietária e resolução de conflitos. (`src/services/automaticProgress.js:7`) |
| hooks/useRewardedAd.js | Bloqueia chamadas simultâneas e concede recompensa apenas com confirmação e componente montado. (`src/hooks/useRewardedAd.js:4`) |
| services/googleDrive.js | Login/autorização Google, token em memória e leitura/gravação de snapshots no appDataFolder. (`src/services/googleDrive.js:11`) |
| services/rewardedAds.js | Inicialização AdMob, consentimento comercial e ciclo de anúncio recompensado por eventos. (`src/services/rewardedAds.js:10`) |
| utils/progress.js | Valida saldo/níveis e envelope versionado de backup, excluindo a partida em andamento. (`src/utils/progress.js:1`) |

## 3. Fluxo de uma partida

1. Callback da Home em App seleciona o modo e gameStarted; selecionar o mesmo modo chama initLevel diretamente (`src/App.jsx:295`; `src/App.jsx:311`; `src/App.jsx:327`).
2. useGameLogic.initLevel cancela seus timers, descarta prêmio pendente, gera cartela com getLevelRanges e reinicia bolas, slots, poderes e fase SPIN; efeito chama initLevel quando sua identidade muda (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:266`).
3. Footer.onSpin passa por App e chama useGameLogic.startSpin: SPIN → SPINNING, sorteia slots e agenda DROP em 2200 ms; Magic pode iniciar também a partir de DROP (`src/App.jsx:409`; `src/hooks/useGameLogic.js:338`; `src/hooks/useGameLogic.js:398`).
4. BucketRow.RollingSlot anima até target e sinaliza revelação; os cinco atrasos são 300 + i×400 ms, mais 200 ms para onFinish (`src/components/BucketRow.jsx:15`; `src/components/BucketRow.jsx:233`).
5. BucketRow.onClick chama App.handleSlotClick somente em DROP; App verifica bolas e pede GameCanvas.dropBall via ref. Só após retorno true chama useGameLogic.dropBall, que desconta uma bola e entra em RESOLVE (`src/components/BucketRow.jsx:204`; `src/App.jsx:208`; `src/components/GameCanvas.jsx:50`; `src/hooks/useGameLogic.js:402`).
6. GameCanvas.dropBall cria Bodies.circle e adiciona ao mundo; Runner avança a física. collisionStart aplica impulsos nos pinos/paredes e assistência às bolas normais em direção às goldenCols (`src/components/GameCanvas.jsx:77`; `src/components/GameCanvas.jsx:443`; `src/components/GameCanvas.jsx:144`).
7. collisionStart registra ball.id em processedBalls antes de chamar onBallLandedRef com binIdx. No chão sem sensor, computeFloorFallbackBin calcula/clampa o índice por x (`src/components/GameCanvas.jsx:237`; `src/components/GameCanvas.jsx:285`; `src/utils/plinkoPhysics.js:44`).
8. App.handleBallLanded obtém slotsResult[binIndex] e chama useGameLogic.resolveTurn; acerto marca a célula e credita cinco moedas. O retorno com hit/earned/hasBingo/isDefeat orienta mensagem e som (`src/App.jsx:238`; `src/hooks/useGameLogic.js:409`; `src/hooks/useGameLogic.js:431`).
9. resolveTurn agenda VICTORY/prêmio em 1100 ms, derrota GAME_OVER em 750 ms ou retorna SPIN quando há bolas; calculateWinReward soma baseReward do modo ao nível (`src/hooks/useGameLogic.js:439`; `src/hooks/useGameLogic.js:87`).
10. nextLevel abre BONUS_WHEEL em níveis múltiplos de 25. LuckySpin.handleSpin sorteia/alinha a roda; após 8000 ms chama claimLuckySpinReward, que consome a ref uma vez. completeLuckySpin incrementa o nível do modo (`src/hooks/useGameLogic.js:270`; `src/components/LuckySpin.jsx:78`; `src/hooks/useGameLogic.js:310`; `src/hooks/useGameLogic.js:319`).

## 4. Dono de cada estado

| Estado / armazenamento | Onde vive | Quem escreve | Quem lê |
| --- | --- | --- | --- |
| coins | Hook (`src/hooks/useGameLogic.js:109`) | Hidratação, resolveTurn, buyItem, claim (`src/hooks/useGameLogic.js:124`; `src/hooks/useGameLogic.js:409`; `src/hooks/useGameLogic.js:485`; `src/hooks/useGameLogic.js:310`) | Persistência e App/Header/compras (`src/hooks/useGameLogic.js:140`; `src/App.jsx:57`; `src/components/Header.jsx:4`) |
| levels; currentLevel derivado | Hook (`src/hooks/useGameLogic.js:112`; `src/hooks/useGameLogic.js:149`) | Hidratação, nextLevel, completeLuckySpin (`src/hooks/useGameLogic.js:124`; `src/hooks/useGameLogic.js:270`; `src/hooks/useGameLogic.js:319`) | initLevel, startSpin, recompensa e Header (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:338`; `src/hooks/useGameLogic.js:447`; `src/components/Header.jsx:4`) |
| balls | Hook (`src/hooks/useGameLogic.js:151`) | initLevel, dropBall, buyItem (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:402`; `src/hooks/useGameLogic.js:485`) | Guardas/derrota e Footer (`src/hooks/useGameLogic.js:402`; `src/hooks/useGameLogic.js:453`; `src/components/Footer.jsx:3`) |
| bingoCard | Hook (`src/hooks/useGameLogic.js:152`) | initLevel e resolveTurn (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:409`) | Sorteio, goldenCols, BingoCard, BucketRow, MagicNumberModal (`src/hooks/useGameLogic.js:338`; `src/App.jsx:71`; `src/components/BingoCard.jsx:17`; `src/components/BucketRow.jsx:160`; `src/components/Modal/MagicNumberModal.jsx:13`) |
| slotsResult | Hook (`src/hooks/useGameLogic.js:153`) | initLevel, startSpin, resolveTurn (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:338`; `src/hooks/useGameLogic.js:409`) | goldenCols, cestos e handleBallLanded (`src/App.jsx:71`; `src/components/BucketRow.jsx:160`; `src/App.jsx:245`) |
| phase | Hook (`src/hooks/useGameLogic.js:160`) | initLevel, ações de jogo, callbacks de safeTimeout e buyItem (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:270`; `src/hooks/useGameLogic.js:338`; `src/hooks/useGameLogic.js:402`; `src/hooks/useGameLogic.js:409`; `src/hooks/useGameLogic.js:485`) | Guardas, sons, Footer, BucketRow e modais em App (`src/hooks/useGameLogic.js:338`; `src/App.jsx:163`; `src/components/Footer.jsx:4`; `src/components/BucketRow.jsx:160`; `src/App.jsx:457`) |
| isGameOver / winState / winReward | Hook (`src/hooks/useGameLogic.js:154`; `src/hooks/useGameLogic.js:155`; `src/hooks/useGameLogic.js:165`) | initLevel/resolveTurn; buyItem limpa isGameOver (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:409`; `src/hooks/useGameLogic.js:485`) | winState e winReward orientam App; isGameOver é exportado, App não o desestrutura (`src/hooks/useGameLogic.js:505`; `src/App.jsx:57`; `src/App.jsx:458`) |
| fireBallActive / magicActive | Hook (`src/hooks/useGameLogic.js:156`; `src/hooks/useGameLogic.js:157`) | initLevel/resolveTurn limpam; buyItem ativa Fireball, startSpin ativa Magic (`src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:409`; `src/hooks/useGameLogic.js:485`; `src/hooks/useGameLogic.js:366`) | App/dropBall/goldenCols e BucketRow (`src/App.jsx:210`; `src/App.jsx:71`; `src/components/BucketRow.jsx:160`) |
| luckySpinReward / pendingLuckyRewardRef | Hook: estado visual/ref de consumo (`src/hooks/useGameLogic.js:161`; `src/hooks/useGameLogic.js:164`) | spinLuckySpin, claim, initLevel e completeLuckySpin (`src/hooks/useGameLogic.js:288`; `src/hooks/useGameLogic.js:310`; `src/hooks/useGameLogic.js:194`; `src/hooks/useGameLogic.js:319`) | LuckySpin via reward; spin/claim leem ref (`src/App.jsx:485`; `src/hooks/useGameLogic.js:288`; `src/hooks/useGameLogic.js:310`) |
| timersRef / hydratedRef | Hook (`src/hooks/useGameLogic.js:171`; `src/hooks/useGameLogic.js:119`) | safeTimeout/clearAllTimers e hidratação (`src/hooks/useGameLogic.js:172`; `src/hooks/useGameLogic.js:181`; `src/hooks/useGameLogic.js:124`) | Cancelamento e persistência (`src/hooks/useGameLogic.js:181`; `src/hooks/useGameLogic.js:138`) |
| audioSettings / audioHydratedRef | App (`src/App.jsx:29`; `src/App.jsx:34`) | Hidratação e SideMenu.toggleSetting (`src/App.jsx:38`; `src/components/SideMenu.jsx:6`) | Persistência, useSound e vibração do canvas (`src/App.jsx:50`; `src/App.jsx:92`; `src/App.jsx:385`) |
| gameStarted / gameMode | App (`src/App.jsx:53`; `src/App.jsx:54`) | Botões Home; onGoHome limpa gameStarted (`src/App.jsx:295`; `src/App.jsx:311`; `src/App.jsx:327`; `src/App.jsx:356`) | Overlay Home/áudio e useGameLogic (`src/App.jsx:275`; `src/App.jsx:109`; `src/App.jsx:59`) |
| messageModal | App (`src/App.jsx:171`) | showMessage/closeMessage (`src/App.jsx:178`; `src/App.jsx:188`) | MessageModal (`src/App.jsx:448`) |
| showMagicModal / showFireballConfirm / isMenuOpen | App (`src/App.jsx:173`; `src/App.jsx:174`; `src/App.jsx:175`) | onPowerUp/onOpenMenu e callbacks de fechar (`src/App.jsx:413`; `src/App.jsx:345`; `src/App.jsx:355`; `src/App.jsx:428`; `src/App.jsx:440`) | Props isOpen dos três componentes (`src/App.jsx:427`; `src/App.jsx:439`; `src/App.jsx:354`) |
| goldenCols / canvasRef | App: memo/ref (`src/App.jsx:71`; `src/App.jsx:206`) | useMemo e montagem de GameCanvas (`src/App.jsx:71`; `src/App.jsx:382`) | GameCanvas e handleSlotClick (`src/App.jsx:387`; `src/App.jsx:213`) |
| sceneRef / engineRef / renderRef / runnerRef | GameCanvas (`src/components/GameCanvas.jsx:9`) | Montagem/cleanup e handleResize (`src/components/GameCanvas.jsx:123`; `src/components/GameCanvas.jsx:450`; `src/components/GameCanvas.jsx:469`) | dropBall, colisões e Render/Runner (`src/components/GameCanvas.jsx:50`; `src/components/GameCanvas.jsx:144`; `src/components/GameCanvas.jsx:443`) |
| processedBalls / litPegs / particles / shake | GameCanvas (`src/components/GameCanvas.jsx:14`; `src/components/GameCanvas.jsx:26`; `src/components/GameCanvas.jsx:299`; `src/components/GameCanvas.jsx:29`) | Colisões, afterRender, resize e cleanup (`src/components/GameCanvas.jsx:144`; `src/components/GameCanvas.jsx:349`; `src/components/GameCanvas.jsx:450`; `src/components/GameCanvas.jsx:469`) | Deduplicação, desenho e classe CSS (`src/components/GameCanvas.jsx:239`; `src/components/GameCanvas.jsx:349`; `src/components/GameCanvas.jsx:490`) |
| Refs de callback, vibração, alvos e imagem | GameCanvas (`src/components/GameCanvas.jsx:17`; `src/components/GameCanvas.jsx:18`; `src/components/GameCanvas.jsx:21`; `src/components/GameCanvas.jsx:25`; `src/components/GameCanvas.jsx:31`) | Efeitos de atualização das props (`src/components/GameCanvas.jsx:33`; `src/components/GameCanvas.jsx:37`; `src/components/GameCanvas.jsx:42`; `src/components/GameCanvas.jsx:46`) | Colisões e construção/resize (`src/components/GameCanvas.jsx:144`; `src/components/GameCanvas.jsx:141`; `src/components/GameCanvas.jsx:458`) |
| displayNum / isFinal; revealed / prevPhase | RollingSlot/BucketRow (`src/components/BucketRow.jsx:17`; `src/components/BucketRow.jsx:162`) | update, onFinish e mudança de fase (`src/components/BucketRow.jsx:24`; `src/components/BucketRow.jsx:234`; `src/components/BucketRow.jsx:166`) | Texto/animação e showGold (`src/components/BucketRow.jsx:51`; `src/components/BucketRow.jsx:187`) |
| uiState / rotation / displayReward; refs da roda/ticker/timer/trava | LuckySpin (`src/components/LuckySpin.jsx:11`; `src/components/LuckySpin.jsx:15`; `src/components/LuckySpin.jsx:18`) | handleSpin, timeout e checkRotation; efeito atualiza ticker (`src/components/LuckySpin.jsx:78`; `src/components/LuckySpin.jsx:32`; `src/components/LuckySpin.jsx:21`) | Rotação CSS, texto/botão, ticker e cleanup (`src/components/LuckySpin.jsx:177`; `src/components/LuckySpin.jsx:192`; `src/components/LuckySpin.jsx:32`; `src/components/LuckySpin.jsx:24`) |
| selectedId / showReward | MagicNumberModal (`src/components/Modal/MagicNumberModal.jsx:16`) | Efeito de abertura, seleção, vídeo e fechamento (`src/components/Modal/MagicNumberModal.jsx:20`; `src/components/Modal/MagicNumberModal.jsx:96`; `src/components/Modal/MagicNumberModal.jsx:47`; `src/components/Modal/MagicNumberModal.jsx:53`) | selectedCell e branch ConfirmationReward (`src/components/Modal/MagicNumberModal.jsx:30`; `src/components/Modal/MagicNumberModal.jsx:59`) |
| showReward | FireballModal (`src/components/Modal/FireballModal.jsx:16`) | Abertura, vídeo e fechamento (`src/components/Modal/FireballModal.jsx:20`; `src/components/Modal/FireballModal.jsx:33`; `src/components/Modal/FireballModal.jsx:38`) | Branch ConfirmationReward (`src/components/Modal/FireballModal.jsx:44`) |
| audioRef / poolRef / optionsRef | useSound (`src/hooks/useSound.js:4`) | Efeitos, play, stop, setVolume (`src/hooks/useSound.js:12`; `src/hooks/useSound.js:17`; `src/hooks/useSound.js:43`; `src/hooks/useSound.js:94`; `src/hooks/useSound.js:101`) | Reprodução e cleanup (`src/hooks/useSound.js:43`; `src/hooks/useSound.js:25`) |
| canvasRef de confete | CelebrationContent (`src/components/Modal/MessageModal.jsx:121`) | Ref do canvas na montagem (`src/components/Modal/MessageModal.jsx:166`) | Efeito confetti.create (`src/components/Modal/MessageModal.jsx:125`) |
| memoryDropCount / sessionStorage | sessionPhysics (`src/utils/sessionPhysics.js:14`) | incrementSessionDropCount/resetSessionDropCount (`src/utils/sessionPhysics.js:41`; `src/utils/sessionPhysics.js:57`) | getSessionDropCount/getSessionAssistFactor (`src/utils/sessionPhysics.js:20`; `src/utils/sessionPhysics.js:78`) |

| isReady / storageError | Hook (`src/hooks/useGameLogic.js:120`) | Hidratação (`src/hooks/useGameLogic.js:132`) | Overlay, alerta de armazenamento e backup (`src/App.jsx:491`; `src/App.jsx:363`) |
| canvasGeneration | App (`src/App.jsx:28`) | Restauração (`src/App.jsx:66`) | Remontagem do GameCanvas (`src/App.jsx:381`) |
| busy / locked / generation | useRewardedAd (`src/hooks/useRewardedAd.js:4`) | watch e cleanup do efeito | App bloqueia interface e silencia música (`src/App.jsx:92`; `src/App.jsx:489`) |
| privacyBusy / message | CloudBackup (`src/components/CloudBackup.jsx:21`) | Callback de privacidade | Botão e mensagem do painel (`src/components/CloudBackup.jsx:50`) |
| state / booting / controller | useAutomaticProgress (`src/hooks/useAutomaticProgress.js:8`) | notify do controlador, start e efeitos | CloudBackup e overlay App (`src/App.jsx:363`; `src/App.jsx:491`) |
| meta: account, owner, base, heads, pending, resolutionHeads; progress / canRestore / operation / conflicts / loaded | createAutomaticProgress (`src/services/automaticProgress.js:9`) | initialize, update, reconcile, connect/disconnect/choose | Comparação de revisões e upload/recuperação; meta persiste em bplm.cloud.v2 (`src/services/automaticProgress.js:29`; `src/hooks/useAutomaticProgress.js:6`) |
| queues / pending / sequence; journal e Preferences | createJSONStorage (`src/utils/storage.js:4`) | saveJSON e loadJSON | loadJSON escolhe versão; flushStorage repete pendentes (`src/utils/storage.js:9`; `src/utils/storage.js:51`) |
| session / initialized | createDriveClient (`src/services/googleDrive.js:11`) | connect/disconnect; resume e renovação após HTTP 401 | request/heads/latest/save usam token/userId em memória (`src/services/googleDrive.js:23`) |
| busy / initialized; listeners, timer e earned por anúncio | createRewardedAds (`src/services/rewardedAds.js:10`) | Inicialização e callbacks do SDK | consentimento, exclusão de chamadas simultâneas, resultado e cleanup (`src/services/rewardedAds.js:40`) |

## 5. Fronteira física/render

- Matter controla posição, velocidade, gravidade, corpos e contatos; buildStaticWorld cria paredes, chão, pinos, funis e sensores. React mantém saldo, cartela e fase (`src/components/GameCanvas.jsx:123`; `src/utils/plinkoPhysics.js:81`; `src/hooks/useGameLogic.js:107`).
- Render desenha corpos no canvas; afterRender desenha partículas e brilho. React/DOM desenha cartela, cestos, controles e modais; shake só escolhe classe CSS (`src/components/GameCanvas.jsx:444`; `src/components/GameCanvas.jsx:349`; `src/App.jsx:369`; `src/App.jsx:392`; `src/App.jsx:405`; `src/App.jsx:447`; `src/components/GameCanvas.jsx:490`).
- Entrada: ref.dropBall cria corpo e retorna booleano. Saída: onBallLandedRef retorna índice/Fireball, sem escrever saldo diretamente (`src/components/GameCanvas.jsx:50`; `src/components/GameCanvas.jsx:251`; `src/App.jsx:238`).
- Resize/orientação espera 100 ms; resizeWorld escala posição, velocidade, raio e sprite das bolas, limita posição acima do sensor e reconstrói estáticos. No mesmo callback, Render.setSize/setPixelRatio ajustam desenho e bounds (`src/components/GameCanvas.jsx:450`; `src/utils/plinkoPhysics.js:50`).

## 6. Convenção de assets

- useTheme fixa Standard; getImage/getSound concatenam /Images/Standard/ ou /Audio/Standard/. Immutable usa diretórios fixos independentes da skin; não é uma permissão de arquivo (`src/hooks/useTheme.js:1`; `src/hooks/useTheme.js:5`; `src/hooks/useTheme.js:7`).
- public/Images/Standard contém fundo, card/cell/freecell, letras LUCKY, balões, botões e sprites ball/peg/triangle; consumidores: App, BingoCard, Header, Footer e física (`src/App.jsx:269`; `src/components/BingoCard.jsx:26`; `src/components/Header.jsx:6`; `src/components/Footer.jsx:15`; `src/components/GameCanvas.jsx:88`; `src/utils/plinkoPhysics.js:136`; `src/utils/plinkoPhysics.js:175`).
- public/Images/Immutable contém Home, botões dos modos, Coin, bingo!, aro, centro e roleta; LuckySpin e modais também usam URLs literais (`src/App.jsx:281`; `src/App.jsx:304`; `src/App.jsx:320`; `src/App.jsx:336`; `src/components/Header.jsx:18`; `src/components/Modal/NextLevelModal.jsx:20`; `src/components/LuckySpin.jsx:151`; `src/components/LuckySpin.jsx:163`; `src/components/LuckySpin.jsx:182`).
- Áudio Standard: song/peg/buttons; Immutable: Theme/slot/fireball/explosion/lucky/BINGO!/palheta. App define caminhos e volumes por useSound (`src/App.jsx:95`; `src/App.jsx:96`; `src/App.jsx:97`; `src/App.jsx:98`; `src/App.jsx:99`; `src/App.jsx:101`; `src/App.jsx:102`; `src/App.jsx:103`; `src/App.jsx:104`; `src/App.jsx:105`).

## Integrações Android

- Login só fica disponível em Android com VITE_GOOGLE_WEB_CLIENT_ID; initialize solicita drive.appdata. DriveSessionPlugin retoma autorização pelo e-mail sem abrir consentimento, exigindo interação se hasResolution; tokens ficam na memória (`src/services/googleDrive.js:6`; `src/services/googleDrive.js:49`; `android/app/src/main/java/com/bingoplinko/game/DriveSessionPlugin.java:18`; `src/services/googleDrive.js:12`).
- save cria snapshots imutáveis por POST multipart; heads pagina metadados e encontra revisões sem descendentes, incluindo backups legados. validateProgress copia coins/levels; readBackup verifica versão/conta/data (`src/services/googleDrive.js:114`; `src/services/googleDrive.js:79`; `src/utils/progress.js:1`; `src/utils/progress.js:22`).
- Moedas/níveis disparam journal local e escrita Preferences; upload aguarda 2 s sem mudança e repete a cada 15 s e em online/pageshow/visibilitychange. Falha de leitura local bloqueia o jogo; falha de escrita mostra alerta (`src/hooks/useGameLogic.js:140`; `src/utils/storage.js:37`; `src/hooks/useAutomaticProgress.js:24`; `src/hooks/useAutomaticProgress.js:39`; `src/App.jsx:490`).
- Recuperação automática exige Home sem anúncio: restaura instalação inicial ou progresso local sem divergência, substitui moedas/níveis, cancela timers e remonta canvas. Conflitos e troca de proprietário exigem escolha; saldos não são somados (`src/services/automaticProgress.js:46`; `src/services/automaticProgress.js:122`; `src/App.jsx:62`; `src/hooks/useGameLogic.js:329`; `src/App.jsx:66`).
- A fila pending é persistida antes do POST e sua revisão identifica envio cuja resposta se perdeu. Snapshots antigos são mantidos; a confirmação saved representa a revisão reconhecida na sincronização, e encerramento forçado durante gravação não tem garantia de durabilidade física verificada (`src/services/automaticProgress.js:37`; `src/services/automaticProgress.js:72`; `src/services/googleDrive.js:116`).
- Anúncios usam o ID oficial de teste por padrão. Em modo comercial, prepareConsent consulta UMP e exige canRequestAds; Rewarded seguido de Dismissed concede prêmio, falhas não concedem. watch ignora conclusão após unmount (`src/services/rewardedAds.js:4`; `src/services/rewardedAds.js:14`; `src/services/rewardedAds.js:40`; `src/hooks/useRewardedAd.js:9`).
- Configuração externa e testes nativos: não verificado. Passos de cadastro e ativação estão em docs/GOOGLE-ADS-SETUP.md; as dependências constam no pacote (`package.json:16`; `package.json:21`).

## 7. Onde mexer para

| Tarefa | Arquivo exato / ponto atual |
| --- | --- |
| 1. Mudar gravidade | PHYSICS_CONFIG.GRAVITY_Y (`src/utils/plinkoPhysics.js:37`); aplicação em GameCanvas (`src/components/GameCanvas.jsx:124`). |
| 2. Adicionar modo | MODE_CONFIG e condições de vitória (`src/hooks/useGameLogic.js:10`; `src/hooks/useGameLogic.js:435`); níveis e botões Home (`src/hooks/useGameLogic.js:112`; `src/App.jsx:295`). |
| 3. Trocar som | public/Audio/Standard/peg.mp3; seleção/volume em App e resolução no hook (`src/App.jsx:98`; `src/hooks/useTheme.js:6`). |
| 4. Mudar valor da economia | Prêmios/saldo/compras no hook; custos nos modais Fireball/Magic/GameOver (`src/hooks/useGameLogic.js:87`; `src/hooks/useGameLogic.js:431`; `src/hooks/useGameLogic.js:485`; `src/components/Modal/FireballModal.jsx:17`; `src/components/Modal/MagicNumberModal.jsx:32`; `src/components/Modal/GameOverModal.jsx:25`). |
| 5. Adicionar tela | Composição/condicionais em App (`src/App.jsx:275`; `src/App.jsx:480`). |
| 6. Mudar faixas numéricas | getLevelRanges (`src/hooks/useGameLogic.js:28`). |
| 7. Mudar probabilidades/colunas | calculateProbabilities/pickNonAdjacentColumns e startSpin (`src/utils/mathUtils.js:30`; `src/utils/mathUtils.js:57`; `src/hooks/useGameLogic.js:338`). |
| 8. Mudar assistência nos pinos | getSessionAssistFactor, PEG_STEER_NUDGE e aplicação da força (`src/utils/sessionPhysics.js:78`; `src/utils/plinkoPhysics.js:23`; `src/components/GameCanvas.jsx:196`). |
| 9. Mudar prêmios/alinhamento da roleta | spinLuckySpin, PRIZE_SLICES e public/Images/Immutable/roleta.png (`src/hooks/useGameLogic.js:288`; `src/components/LuckySpin.jsx:6`; `src/components/LuckySpin.jsx:114`; `src/components/LuckySpin.jsx:182`). |
| 10. Mudar resize/pinos/sensores | resizeWorld/buildStaticWorld e handleResize (`src/utils/plinkoPhysics.js:50`; `src/utils/plinkoPhysics.js:81`; `src/components/GameCanvas.jsx:450`). |

## 8. Armadilhas

- Letras internas são BINGO; cabeçalhos visuais são LUCKY. FREE começa marcado em FINGO/BINGO e SPINGO mantém número central não marcado (`src/hooks/useGameLogic.js:8`; `src/components/BingoCard.jsx:3`; `src/hooks/useGameLogic.js:225`).
- Home é overlay: onGoHome só fecha menu e muda gameStarted; initLevel ocorre ao selecionar novamente um modo. Nível/saldo persistidos não são zerados por initLevel (`src/App.jsx:356`; `src/App.jsx:311`; `src/hooks/useGameLogic.js:194`).
- Fireball tem isSensor=true e velocidade inicial própria; só bola normal incrementa contador de assistência. O listener ainda aplica força quando encontra pino (`src/components/GameCanvas.jsx:94`; `src/components/GameCanvas.jsx:99`; `src/components/GameCanvas.jsx:166`).
- O número pontuado vem do cesto de chegada, não da coluna clicada; processedBalls registra o corpo antes do callback e sua remoção física é posterior (`src/App.jsx:245`; `src/components/GameCanvas.jsx:244`; `src/components/GameCanvas.jsx:265`).
- O prêmio pendente fica na ref; setState é a projeção visual. claim zera a ref antes de atualizar moedas; a roda cancela seu timeout ao desmontar (`src/hooks/useGameLogic.js:164`; `src/hooks/useGameLogic.js:310`; `src/components/LuckySpin.jsx:24`).
- clearAllTimers cobre safeTimeout do hook; mensagens mantêm setTimeout próprio. Os três botões de vídeo chamam watchReward e não usam temporizador para conceder prêmio (`src/hooks/useGameLogic.js:181`; `src/App.jsx:178`; `src/App.jsx:191`; `src/components/Modal/FireballModal.jsx:33`; `src/components/Modal/MagicNumberModal.jsx:47`; `src/components/Modal/GameOverModal.jsx:48`).
- buildStaticWorld remove todos os isStatic; resizeWorld trata corpos player-ball/fireball antes dessa reconstrução e preserva o id usado na deduplicação (`src/utils/plinkoPhysics.js:85`; `src/utils/plinkoPhysics.js:50`; `src/components/GameCanvas.jsx:239`).
- npm test executa cinco suítes unitárias e regressões de jogo, armazenamento e integrações; HTTP e SDKs de conta/anúncio são simulados nos testes. Testes de canvas substituem desenho/agendamento automático, avançam Matter.Engine manualmente e verificam callback; renderização visual e aparelho Android: não verificado (`package.json:7`; `test-fingo-physics.mjs:202`; `tests/game-regressions.test.mjs:11`; `tests/game-regressions.test.mjs:125`; `tests/game-regressions.test.mjs:181`).
