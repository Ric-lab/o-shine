# ✨ O-SHINE: ARCADE & CASINO MULTI-GAME HUB
> **Master Blueprint & Diretrizes do Diretor de Jogo**  
> *Repositório Oficial:* `Ric-lab/o-shine` | *Localização:* `c:\Users\ROG\Desktop\BPLM\o-shine`

---

## 🎯 1. Visão do Projeto: O Que É e Por Que Existe

### O Que É:
O **O-Shine** é um Hub de Arcade e Cassino Casual mobile para Android, composto por **9 minijogos rápidos, altamente visuais e viciantes**, interligados por:
* Uma **Carteira Única de Moedas** (o que você ganha em um jogo, aposta em outro).
* Sistema de **Salvamento Automático Local e em Nuvem (Google Drive via AppData)**.
* Monetização integrada via **Google AdMob (Rewarded Ads)**.
* Visual e áudio inspirados nos padrões de excelência da **Supercell, Dream Games (*Royal Match*), King e PG Soft (*Fortune Tiger*)**.

### Por Que Este Repositório Existe:
1. **Isolamento e Segurança:** O repositório anterior (`Bingo-Plinko-Lucky-Machine`) foi **congelado** e segue seu ciclo independente de publicação na Google Play.
2. **Evolução de Escopo:** O **O-Shine** não é apenas um jogo de bingo/plinko; é uma **plataforma completa de minijogos arcade** que exige uma arquitetura de lobby, transições de jogos e uma esteira de assets 3D pré-renderizados de estúdio.

---

## 🏛️ 2. Os 3 Pilares Fundamentais de Design

Para atingir a qualidade de jogos líderes de bilheteria, o desenvolvimento sempre segue três pilares:

### Pilar 1: A Mecânica (Game Designer - Visão do Usuário)
* **Regra dos 2 Segundos:** Qualquer jogador deve entender o que fazer em 2 segundos sem tutorial longo.
* **One-Thumb Control:** Todo o jogo é jogado na vertical com o dedão.
* **Tensão e Recompensa:** O jogo alterna entre expectativa (tensão) e catarse (recompensa explosiva).

### Pilar 2: O Visual 3D "Toy-Like / Glossy" (Game Director - IA)
* **Estética de Vinil e Ouro:** Objetos volumosos, cantos arredondados e acabamento de plástico brilhante, esmalte ou ouro polido de estúdio.
* **Juiciness (Suculência):**
  * **Squash & Stretch (Física de Mola):** Botões e fichas deformam e voltam como borracha.
  * **Screen Shake (Micro-tremor):** A tela sacode de 40ms a 70ms em vitórias e grandes impactos.
  * **Hit-Stop:** Pausa de 30ms antes da comemoração de um grande prêmio.
  * **Chafariz de Moedas (Coin Fountain):** As moedas explodem em arco na tela e voam em curvas de Bézier até a carteira no topo, fazendo o número rolar no odômetro (*number ticker*).

### Pilar 3: O Som Psicoacústico (Game Director - IA)
* **Escada Pentatônica:** Os acertos consecutivos sobem de afinação sem nunca soar desafinados, gerando dopamina.
* **Latência Zero:** Efeitos de clique, saltos e moedas sintetizados via Web Audio API, disparando em menos de 5 milissegundos.
* **Graves Aveludados:** Impactos com "peso", transmitindo sensação de solidez física.

---

## 🎮 3. A Lista dos 9 Minijogos

| # | Jogo | Mecânica Central | Visual e VFX de Estúdio |
| :--- | :--- | :--- | :--- |
| **1** | **Bingo Plinko** | Bolas caindo em pinos, marcando cartelas de bingo e alimentando a roleta da sorte. *(Base já importada e testada)*. | Pinos iluminados, baldes de fogo, chamas dinâmicas e roleta 3D. |
| **2** | **Match Machine (Tigrinho 777)** | Slot 3x3 clássico com linhas de pagamento, multiplicadores selvagens e bônus de rodada grátis. | Rolos dourados, mascote 3D vibrando com comemorações e explosão de lingotes de ouro. |
| **3** | **Pênalti Dourado** | 5 cobranças consecutivas para dobrar o dinheiro (risco x recompensa com cashout). | Câmera atrás do batedor, mira de arrastar, goleiro ágil com saltos acrobáticos e gol em câmera lenta. |
| **4** | **Crazy Clown (Smash Royale)** | Cabeça do palhaço que gira 360°. Boca, olhos, orelhas e nariz abrem e fecham revelando multiplicadores que mudam. | Visual de parque de diversões retrô brilhante, dentes dourados, iluminação de holofote e giro com inércia. |
| **5** | **Tiles Hop (Crash do Vidro)** | Bolinha que pula de piso em piso. Cada quique soma +0.1% ao valor. Pisos de vidro trincam e quebram de surpresa. | Reflexos de neon nos pisos, partículas de vidro estilhaçando e contador de multiplicador saltitante. |
| **6** | **Claw Machine (Garra Caça-Níquel)** | Joystick para posicionar a garra mecânica sobre uma piscina de cápsulas surpresa com probabilidade calculada de escorregar. | Garra metálica com cabos móveis, cápsulas translúcidas coloridas e física de balanço. |
| **7** | **Marble Run (Corrida de Bolinhas)** | Pistas 2D físicas com funis, desvios e alavancas. O jogador aposta na cor da bolinha vencedora. | Tubos de acrílico translúcidos, luzes de neon e física de colisão elástica. |
| **8** | **Basket / Skee-Ball** | Deslizar o dedo (*swipe*) para arremessar bolas na rampa em direção a cestas concêntricas com pontuações variadas. | Madeira polida com anéis de neon, placar digital de LED retroiluminado e redes balançando. |
| **9** | **Raspadinha Royale** | O jogador passa o dedo para raspar a película prateada ou dourada, revelando 3 símbolos premiados. | Efeito de fagulhas saindo do dedo ao raspar (`destination-out`) e brilho estelar nos símbolos revelados. |

---

## 🛠️ 4. Arquitetura Técnica & Ferramentas Instaladas

* **Framework:** React 19 + Vite + Vanilla Canvas / WebGL (alta performance a 60/120 FPS).
* **Camada Mobile:** Capacitor 7 para Android (APK leve de ~15MB, inicialização instantânea).
* **Blender Oficial:** **Blender 5.2.1 LTS** instalado em `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` para geração automatizada de malhas, moedas 3D, pinos e spritesheets via scripts Python (`blender -b -P script.py`).
* **Sistemas Nativos:**
  * Backup no Google Drive em pasta oculta de AppData (`DriveSessionPlugin.java`).
  * Anúncios premiados do AdMob com gerenciamento de consentimento e ciclo de vida.
  * Armazenamento local robusto com journal de recuperação de falhas.

---

## 🗺️ 5. Plano de Execução (Fases do Projeto)

### Fase 1: Fundação do "Juiciness" e Motor de VFX
1. **Moeda 3D do Blender:** Script Python no Blender para renderizar a moeda mestra com relevo de coroa e borda de ouro chanfrado em 16 ângulos de rotação.
2. **Coin Fountain Engine:** Sistema de partículas no React/Canvas para disparar moedas em arco até o contador do topo.
3. **Odômetro de Moedas (Number Ticker):** Saldo que sobe com rolagem acelerada e som de clique mecânico.
4. **Sistema de Screen Shake & Floating Texts:** Efeitos de tremor de tela e textos 3D flutuantes (*"BIG WIN!"*, *"x5 COMBO!"*).

### Fase 2: O Lobby Central & Carteira Global
1. Criar `src/components/HubLobby.jsx` com estética de cassino arcade noturno, letreiro de neon e cards 3D dos jogos.
2. Criar `src/hooks/useWallet.js` unificando apostas, prêmios e histórico de todos os minijogos.
3. Garantir desmontagem limpa (`cancelAnimationFrame`) para que apenas um jogo rode na memória por vez.

### Fase 3: Reformulação Visual do Bingo Plinko
1. Substituir os botões e pinos antigos pelos novos assets gerados no Blender.
2. Integrar o chafariz de moedas na linha de bingo e na queda da bola nos baldes.

### Fase 4: Construção dos Novos Jogos (Ordem Recomendada)
1. **Match Machine (Tigrinho)** -> 2. **Raspadinha Royale** -> 3. **Pênalti Dourado** -> 4. **Tiles Hop** -> 5. **Crazy Clown** -> 6. **Basket / Skee-Ball** -> 7. **Claw Machine** -> 8. **Marble Run**.

### Fase 5: Empacotamento, Testes & Publicação
1. Testes automatizados de cada novo minijogo e da carteira.
2. Sincronização do Capacitor (`npx cap sync`).
3. Geração do Android App Bundle (AAB) para a Play Store.

---

## 💡 Mensagem para a Próxima Sessão / IA:
> **Você está no repositório `o-shine`.**
> A base inicial já foi copiada do Bingo Plinko V7 e todos os 31 testes unitários/integração estão passando.
> O Blender 5.2.1 LTS está instalado em `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
> O repositório anterior está congelado.
> **Próxima tarefa imediata:** Iniciar a **Fase 1 (O Motor de Juiciness)** criando a Moeda 3D no Blender e o sistema de partículas de chafariz de moedas no jogo!
