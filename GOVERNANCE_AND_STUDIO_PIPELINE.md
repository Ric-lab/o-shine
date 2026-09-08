# 👑 GOVERNANCE, ROLES & STUDIO PIPELINE: BPLM VERTICAL SLICE
> **Documento Oficial de Governança, Post-Mortem e Engenharia de Estúdio**  
> *Benchmark de Mercado:* **Royal Match** (Dream Games), **Clash Royale** (Supercell), **Peggle** (PopCap)  
> *Escopo Focado:* **Bingo Plinko Lucky Machine (BPLM) como Único Vertical Slice**

---

## 🎭 1. As 5 Funções e Personalidades do Agente

Para garantir que o produto final tenha a qualidade dos maiores sucessos casuais de bilheteria do mundo, a IA assume e alterna formalmente entre 5 papéis:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. DIRETOR CRIATIVO & DE ARTE (Creative & Art Director)                     │
│    - Benchmark de mercado contínuo (Royal Match, Toon Blast, Clash Royale). │
│    - Guarda da Bíblia Visual: formas "chunky", esmalte cerâmico, ouro 24k.  │
│    - Orientação estritamente FRONTAL (0° de inclinação para mobile em pé).  │
│    - Zero ruído/grão e teste de silhueta legível em menos de 50ms.          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│ 2. DIRETOR DE TECNOLOGIA & ENGENHEIRO CHEFE (CTO & Tech Lead)                │
│    - Arquitetura de performance: Matter.js 100% Headless (apenas física).   │
│    - Motor de Renderização WebGL via PixiJS v8 (60-120 FPS cravados).       │
│    - Desacoplamento do React: zero useState no game loop, zero Garbage Coll.│
│    - Modularidade de UI: NineSliceSprite e BitmapText para fontes estáveis. │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│ 3. ENGENHEIRO DE SHADERS & ILUMINAÇÃO DINÂMICA (Lighting Engineer)          │
│    - Camada 1: Luz Zenital Global Fixa a 45° (consistência do castelo).     │
│    - Camada 2: Luz Pontual Móvel da Bola (pinos iluminam ao passar da bola).│
│    - Camada 3: Flash Aditivo de Colisão (blendMode = 'add' / hit bloom).    │
│    - Camada Especular Separada: reflexo curvo branco por cima da cor base.  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│ 4. JUICE & PROCEDURAL ANIMATION SPECIALIST (Sensação Tátil & Game Feel)     │
│    - Squash & Stretch elástico por mola amortecida: F = -kx - cv.           │
│    - Reação vetorial: pino achata na direção do choque e vibra em 120ms.    │
│    - Mecânica de quase-acerto (Near-Miss): desaceleração e faíscas no 10x.  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────┴──────────────────────────────────────┐
│ 5. SOUND DESIGNER PSICOACÚSTICO (Engenharia de Som de Cassino & Retenção)   │
│    - Síntese com latência zero via Web Audio API.                           │
│    - Escada Pentatônica Dinâmica: C5 -> D5 -> E5 -> G5 -> A5 -> C6.         │
│    - Subida de +1 semitom a cada bounce consecutivo para gerar dopamina.    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💀 2. Post-Mortem de Todas as Tentativas Anteriores (O Que Falhou e Por Que)

Abaixo está o registro honesto e transparente de todos os erros cometidos nas tentativas anteriores e as razões técnicas/artísticas do fracasso:

| # | Tentativa Realizada | Sintoma / Resultado Ruim | Causa Raiz Técnica & Artística |
| :-: | :--- | :--- | :--- |
| **1** | Geometria procedural no Blender via código (`bmesh/subsurf`) sem escultura ou texturas. | Cilindros e esferas lisas com cores pastéis mortas. | Parecia "arte de programador" de faculdade. Sem mapas de relevo ou luz volumétrica rica, código puro cria apenas polígonos crus. |
| **2** | Geração de imagem via IA e recorte de fundo preto via script de limiar simples. | Borda com halos pretos, cisalhamento e perda de detalhes transparentes. | O corte ingênuo de limiar destrói o anti-aliasing de subpixel nas bordas e remove reflexos semi-translúcidos. |
| **3** | Pino modelado com câmera superior inclinada a 75°. | Parecia uma tigela, prato ou buraco visto de cima. | **Erro de ergonomia mobile:** O jogador segura o celular verticalmente na frente do rosto e olha de frente. A perspectiva do pino precisa ser **100% FRONTAL (0° de inclinação)**. |
| **4** | Carregamento do sprite no `plinkoPhysics.js` usando divisor fixo `64`. | O pino ficou gigantesco na tela, cobrindo outros pinos e paredes. | **Bug de escala de legado:** O código original dividia por 64 (`(pegRadius * 2) / 64`), esperando um asset de 64px. Ao carregar 256px, a imagem foi inflada em **4x**. |
| **5** | Uso contínuo do `Matter.Render` nativo com truques no evento `afterRender`. | Quedas de frame, visual amador e impossibilidade de usar blend modes WebGL. | O `Matter.Render` é uma ferramenta de depuração/wireframe em Canvas 2D, não um renderizador comercial. Aloca lixo na memória e não suporta shaders. |
| **6** | Geração procedural de brilho (*glint*) com rotação de caixa no Pillow. | Cisalhamento visível em linha reta (corte quadrado) no canto da gema. | Rotacionar um retângulo sem matriz de máscara contínua corta as pontas transparentes da imagem, gerando uma quina recortada visível. |
| **7** | Shader com ruído procedural de relevo no Blender. | "Areia suja" e pixels manchados e granulados no celular. | Jogos casuais tipo *Royal Match* usam superfícies **100% lisas como esmalte ou porcelana**, nunca bump maps de ruído ou areia. |

---

## 💎 3. A Solução Definitiva para o BPLM (Garantia de Resultado)

### A. Geometria & Proporção Perfeita
1. O pino terá diâmetro visual rigorosamente casado com o raio físico:
   $$\text{diâmetro} = 2 \times r_{\text{pino}}$$
2. Desenhado em projeção **100% frontal**, composto por um anel externo de ouro 24k espelhado com chanfro arredondado e núcleo central de gema azul esmaltada lisa.

### B. O Fim do Cisalhamento (Anti-Aliasing de Hardware)
1. Renderizado na GPU via **PixiJS v8** com `resolution: window.devicePixelRatio || 2` e `antialias: true`.
2. As bordas do pino utilizam equações analíticas e texturas em alta densidade com padding transparente de 2px, eliminando qualquer cisalhamento ou serrote.

### C. A Iluminação Dinâmica em 3 Camadas
1. **Luz Zenital Global (45° Topo-Esquerdo):** Dá a sensação de que o tabuleiro está sob o mesmo lustre do castelo.
2. **Luz da Bola Móvel (Point Light):** Conforme a bola cai, os pinos dentro de um raio de 60px ganham um brilho no lado voltado para a bola. Se for Fireball, a luz é alaranjada ardente.
3. **Hit Bloom & Flash Aditivo:** No momento exato da colisão, o pino emite um flash aditivo (`blendMode = 'add'`) que dura 60ms e decai suavemente.

### D. Squash & Stretch Elástico Real
1. Ao sofrer o impacto, o pino achata 20% na direção da colisão e expande 20% transversalmente.
2. Uma equação de mola amortecida ($F = -kx - cv$) devolve o pino ao formato original em 120ms, dando a sensação de borracha viva.

### E. Psicoacústica de Cassino
1. As rebatidas consecutivas sobem de tom na escala pentatônica maior (+1 semitom por bounce).
2. O cérebro do jogador interpreta a subida musical como aproximação de vitória, disparando dopamina contínua.

---

## 🧹 4. Limpeza Geral dos Artefatos Experimentais

Todos os scripts descartáveis e arquivos temporários criados nas tentativas anteriores são removidos do repositório para deixar o projeto 100% limpo, estável e pronto para a implementação comercial limpa.
