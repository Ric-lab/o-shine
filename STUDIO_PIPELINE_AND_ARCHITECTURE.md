# 🏛️ STUDIO PIPELINE & ARCHITECTURE: BPLM VERTICAL SLICE
> **Documento Mestre de Engenharia, Direção de Arte e Conexão de Skills**  
> *Padrão Industrial:* **Royal Match** (Dream Games), **Peggle** (PopCap), **Clash Royale** (Supercell)  
> *Meta Inegociável:* **Visual 2.5D Volumétrico Deslumbrante, Iluminação Dinâmica Viva, Zero Cisalhamento de Pixels e 60-120 FPS Cravados no Mobile.**

---

## 🧭 1. O Mapa de Conexão de Skills

Para que o jogo atinja a qualidade do *Royal Match*, nenhuma parte é feita isolada. Cinco especialidades técnicas operam em perfeita sintonia:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. GAME ENGINE ARCHITECT (Engenharia de Performance & Estado)               │
│    Matter.js (Headless 60Hz) ➔ Loop Desacoplado ➔ PixiJS v8 / WebGL nativo  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Posições (x,y), Velocidades, Colisões
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. DYNAMIC LIGHTING & SHADER SPECIALIST (Iluminação Dinâmica 2.5D)          │
│    Luz Zenital 45° + Luz Pontual da Bola + Flash Aditivo no Impacto         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Renderiza sprites iluminados
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. ASSET PIPELINE & MATERIAL ARTIST (Aparência Royal Toon)                  │
│    Geometria Frontal 0° + Esmalte / Ouro 24k Liso + Layer Especular Aditivo │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Reações a cada frame
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. JUICE & PROCEDURAL SQUASH-STRETCH (Sensação Tátil)                       │
│    Física de Mola Amortecida (F = -kx - cv) nos Pinos e Caçapas             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Gatilho de eventos sonoros
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. CASINO AUDIO PSYCHOACOUSTICS (Reforço Dopaminérgico)                      │
│    Web Audio API + Escada Pentatônica Dinâmica (+1 semitom por bounce)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 2. Skill 1: Game Engine Architect (Física Headless & WebGL)

### A. O Diagnóstico do Erro Anterior
* **O Problema:** O `Matter.Render` nativo misturava desenho e física no mesmo canvas 2D rudimentar. Além disso, havia um bug crítico de proporção: a escala do pino era calculada com divisor fixo `64` (`xScale = pegRadius * 2 / 64`). Quando um asset de 256px era carregado, ele era desenhado **4 vezes maior**, estourando na tela e causando sobreposição grotesca.
* **A Correção Definitiva:**
  1. **Matter.js 100% Headless:** `Matter.Render` é expurgado. O Matter.js é instanciado sem canvas, calculando apenas vetores e corpos físicos em frequência de 60Hz.
  2. **Renderizador WebGL de Alta Densidade:** O desenho é delegado ao **PixiJS v8** configurado com:
     * `resolution: window.devicePixelRatio || 2`
     * `autoDensity: true`
     * `antialias: true`
     * `backgroundAlpha: 0`
  3. **Vínculo Imperativo sem React Re-renders:**
     O ticker gráfico lê `body.position.x` e `body.position.y` diretamente das instâncias do Matter.js. **Nenhum `useState` roda no loop de 60 FPS**, garantindo zero lixo no coletor de memória (*Garbage Collector*) e consumo térmico mínimo da bateria do celular.

---

## 💡 3. Skill 2: Dynamic Lighting & Shader Specialist (Iluminação Dinâmica)

Jogos como *Royal Match* e *Peggle* parecem 3D vivos porque **a luz se move**. Não é uma imagem chapada.

### A. As 3 Camadas de Iluminação:

#### Camada 1: Luz Global Zenital Fixa (Ambiente do Castelo)
* Vetor de luz direcional fixo vindo a **45° do topo-esquerdo**.
* Cria o degradê natural: o topo de cada pino, bola e moldura é naturalmente mais claro, enquanto a base tem sombra rica de oclusão de contato (*contact shadow*).

#### Camada 2: Luz Pontual Dinâmica da Bola (Proximity Glow)
* A bola em queda atua como um **emissor de luz pontual móvel**:
  $$\text{Luz}(\text{pino}) = \max\left(0, 1.0 - \frac{\text{dist}(\text{bola}, \text{pino})}{R_{\text{luz}}}\right)$$
* Quando a bola desce por entre os pinos, os pinos a menos de 50 pixels de distância **ganham um brilho no chanfro de ouro apontando para a bola**. Se for uma **Fireball**, essa luz é alaranjada intensa; se for a bola normal, é um brilho branco-pérola suave.

#### Camada 3: Flash de Impacto & Bloom Aditivo (Hit Spark)
* No instante do impacto (`collisionStart`), o pino atingido dispara um pulso de luz aditivo:
  * **Frame 0 a 2 (0-30ms):** Flash branco/ciano saturado no centro da gema com `blendMode = 'add'`.
  * **Frame 3 a 15 (30-250ms):** Decaimento suave com dispersão de micro-faíscas.

---

## 🎨 4. Skill 3: Asset Pipeline & Material Artist (Aparência Royal Toon)

### A. Por que Imagens Estáticas Recortadas Causam Cisalhamento?
Quando uma imagem rasterizada (bitmap estático) com bordas arredondadas é desenhada com transformações de escala ou em coordenadas fracionárias de tela, ocorre **cisalhamento de interpolação bilinear** (serrilhamento e perda de nitidez).

### B. A Solução Industrial Anti-Cisalhamento:
Para garantir que o pino e a bola sejam **infinitamente nítidos** em qualquer tela (FHD+, QHD, tablets):
1. **Orientação 100% Frontal (0° de Inclinação):**
   * O jogador segura o celular verticalmente e olha a mesa de frente.
   * O pino é um círculo perfeito frontal:
     * **Anel Externo:** Ouro 24K polido com chanfro duplo e arco de luz no topo.
     * **Núcleo Central:** Gema azul cobalto com cúpula esmaltada lisa.
     * **Superfície Lisa de Porcelana:** Zero ruído procedural, zero relevo granulado.
2. **Sistema Multi-Camada de Especularidade:**
   * **Textura Base:** Formato e cor pura.
   * **Camada Especular Aditiva (Specular Overlay):** Uma camada separada contendo apenas o reflexo curvo branco (*curved window glint*). Ela é desenhada por cima com `blendMode = 'add'`. Dessa forma, mesmo quando a bola de bingo ou o pino mudam de cor, o reflexo branco de plástico envernizado permanece perfeito.
3. **Escala Casada com o Raio Físico:**
   * O diâmetro visual do sprite do pino é dimensionado exatamente para $2 \times r_{\text{pino}}$, sem sobras ou cortes.

---

## 🤸 5. Skill 4: Juice & Procedural Squash-Stretch (Sensação Tátil)

O "Game Feel" que torna o *Royal Match* viciante vem da física de deformação elástica:

### A. Física de Mola Amortecida (Damped Harmonic Oscillator)
Quando a bolinha colide com o pino:
1. Calculamos o vetor unitário normal do impacto:
   $$\vec{n} = \frac{\text{pos}_{\text{bola}} - \text{pos}_{\text{pino}}}{\|\text{pos}_{\text{bola}} - \text{pos}_{\text{pino}}\|}$$
2. O pino achata **imediatamente** na direção do impacto:
   * Escala longitudinal: $s_\parallel = 0.80$ (comprime 20%)
   * Escala transversal: $s_\perp = 1.20$ (expande 20% para conservar o volume aparente)
3. Uma equação diferencial de mola no game loop restaura a escala para `(1.0, 1.0)` em 120ms com oscilação amortecida:
   $$a(t) = -k \cdot (s - 1.0) - c \cdot v(t)$$
   O pino vibra como borracha maciça de alta qualidade, transmitindo fisicalidade imediata.

---

## 🎵 6. Skill 5: Casino Audio Psychoacoustics (Reforço Dopaminérgico)

O som não é apenas estético; ele comanda a química cerebral do jogador:

### A. Escada Pentatônica Crescente
* Colisões repetidas com o mesmo tom irritam o ouvido. 
* Em vez de tocar o mesmo `peg.mp3`, implementamos uma **escala pentatônica maior dinâmica** via Web Audio API:
  * **Hit 1:** Dó (C5 - 523 Hz)
  * **Hit 2:** Ré (D5 - 587 Hz)
  * **Hit 3:** Mi (E5 - 659 Hz)
  * **Hit 4:** Sol (G5 - 784 Hz)
  * **Hit 5:** Lá (A5 - 880 Hz)
  * **Hit 6+:** Dó agudo (C6 - 1046 Hz com harmônicos cristalinos de sino)
* A subida de tom transmite a sensação de que a jogada está "subindo de valor", gerando expectativa contínua.
* Ao cair no balde vencedor, a escala resolve em um acorde triunfal maior (*fanfarra de Las Vegas*).

---

## 📊 7. Matriz de Conexão: Do Código à Geração Real

| Componente BPLM | Skill Responsável | Tecnologia de Produção | Como Aparece na Tela |
| :--- | :--- | :--- | :--- |
| **Simulação Física** | Engine Architect | Matter.js Headless (60Hz) | Invisível; guia apenas coordenadas e colisões. |
| **Pinos de Colisão** | Asset Artist + Shaders | Render Frontal Liso 256x256 no PixiJS | Anéis de ouro 24k com gemas azuis que reagem à luz da bola. |
| **Reação ao Toque** | Juice Specialist | Squash & Stretch por mola amortecida | Pinos achatam no choque e vibram de volta como borracha viva. |
| **Bolas de Bingo** | Asset Artist + Shaders | Esfera Neutra 3D + Tint + Specular Additive | Bolas coloridas brilhantes com número nítido e luz de estúdio. |
| **Baldes / Caçapas** | Asset Artist + UI | NineSliceSprite + Placas de Multiplicador | Caçapas esmaltadas que afundam levemente ao receber a bola. |
| **Som de Rebatida** | Audio Specialist | Web Audio API Pentatônica | Acordes musicais harmoniosos que sobem de tom a cada quique. |
| **Quase-Acerto** | Game Designer | Time-scale 0.7x + Partículas Douradas | Tensão dramática quando a bola roça a caçapa de 10x. |

---

## 🏁 8. Veredito & Garantia de Resultado

Com este pipeline:
1. **O bug de escala 4x é eliminado:** O pino encaixa perfeitamente na grade física.
2. **O cisalhamento de pixels é eliminado:** Resolução nativa de tela WebGL com anti-aliasing de hardware.
3. **A iluminação deixa de ser estática e morta:** A bola ilumina os pinos vizinhos dinamicamente, e cada colisão gera bloom e squash & stretch.
4. **O jogo roda a 60-120 FPS cravados:** Sem `Matter.Render` e sem alocações no loop principal.
