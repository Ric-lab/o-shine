# 👑 O-SHINE: Visual Art Bible & 3D Style Guide
> **Padrão Estético Oficial: "Royal Toon 3D" (Toy-Like / Glossy / Chunky)**  
> *Referências:* **Royal Match** (Dream Games), **Clash Royale / Smash Royale** (Supercell), **Toon Blast** (Peak Games)  
> *Pipeline:* **Blender 5.2 (EEVEE/Cycles) ➔ RGBA Sprites & Spritesheets ➔ React/Canvas 60fps**

---

## 🎨 1. A Identidade Visual ("Royal Toon 3D")

O visual do **O-Shine** abandona qualquer aspecto plano, geométrico cru ou fotorrealista sombrio. Ele adota a estética dos maiores sucessos de bilheteria casual mobile do mundo:

| Princípio | Descrição | O que FAZER | O que NUNCA FAZER |
| :--- | :--- | :--- | :--- |
| **Shape Language (Forma)** | Silhuetas robustas, "chunky", cantos hiper-arredondados e proporções de brinquedo colecionável de vinil. | Chanfros largos (*wide bevels*), curvas orgânicas gordinhas, proporções exageradas (*squash & stretch*). | Quinas vivas de 90°, bordas afiadas, formas magras ou arames finos. |
| **Materialidade** | Brinquedo premium: plástico laqueado brilhante, esmalte cerâmico, ouro 24k polido e gomas/doces translúcidos. | *Subsurface Scattering* (SSS sutil), reflexo especular vítreo (*clearcoat* alto), brilho de caramelo/esmalte. | Texturas de metal sujo, ferrugem, ruído procedural árido, cores lavadas ou plástico fosco opaco. |
| **Paleta de Cores** | Cores puras, vibrantes e apetitosas ("Candy Palette"), com gradientes volumétricos de cima para baixo. | Ouro Real (#FFD000 com borda âmbar #E67E00), Vermelho Rubi (#FF1A4B), Azul Real (#1E6BFF), Esmeralda (#00D66C). | Tons pastéis desbotados, cinzas mortos, preto absoluto em materiais, cores sem contraste. |
| **Leitura Rápida (Silhouette Test)** | Reconhecimento instantâneo do símbolo em menos de 100ms na tela vertical do celular. | Alto contraste de luminosidade entre o elemento central e a borda; ícones grandes e centralizados. | Detalhes microscópicos que somem em 32x32px, texturas de alta frequência visual. |

---

## 💡 2. Rig de Estúdio Oficial no Blender (The "Royal Studio" Rig)

Para que **todos** os assets (moedas, pinos, símbolos de slot, dados, baús, personagens) compartilhem exatamente a mesma luz, ângulo e profundidade, estabelecemos o seguinte setup padrão no Blender:

### A. Câmera
* **Tipo:** `ORTHOGRAPHIC` (Ortográfica) ou Perspectiva com lente de `85mm` a `100mm` e ângulo rebaixado de **15° a 20°** (leve inclinação superior para evidenciar a face frontal e o relevo volumétrico superior).
* **Enquadramento:** Elemento ocupando **88%** do canvas quadrado, com margem de segurança de 6% nas bordas.

### B. Iluminação de 3 Pontos com Acentos Estilizados
```
                     [Luz de Aro / Rim Light (Dourada)]
                                    |
                                  [Asset]
                                 /       \
      [Luz Principal / Key Light]         [Luz de Preenchimento / Fill (Azulada)]
         (Branca Quente, 45°/45°)           (Suave, -45°/-15°)
```
1. **Key Light (Luz Principal):** Sol/Área suave a 45° de elevação e -30° de azimute. Cor: `#FFF8E7` (branco quente, energia 3.5).
2. **Fill Light (Preenchimento):** Área difusa a -45° e 15° de elevação. Cor: `#8AB8FF` (azul real suave, energia 1.2) para dar riqueza às sombras.
3. **Rim Light (Luz de Contorno/Aro):** Luz traseira elevada a 60°. Cor: `#FFE680` (ouro brilhante, energia 5.0) destacando a silhueta 3D contra qualquer fundo de jogo.
4. **Ambient Occlusion (AO):** Raio de 0.25m, fator 1.5, garantindo que reentrâncias e chanfros tenham contato visual profundo.

### C. Biblioteca de Shaders Mestres (Blender Principled BSDF)

1. **Royal Gold (Ouro 24K Royal Match):**
   * `Base Color`: `#FFC814` (amarelo ouro intenso)
   * `Metallic`: `0.92`
   * `Roughness`: `0.14`
   * `Clearcoat`: `1.0` (brilho laqueado)
   * `Anisotropic`: `0.1`

2. **Royal Candy Red (Vermelho Laqueado 777 / Botões):**
   * `Base Color`: `#E6003A`
   * `Subsurface Weight`: `0.15` (cor do SSS: `#FF3B69`)
   * `Metallic`: `0.0`
   * `Roughness`: `0.10`
   * `Clearcoat`: `1.0`

3. **Royal Sapphire Gem (Gemas / Scatter / Pinos de Plinko):**
   * `Base Color`: `#0088FF`
   * `Transmission Weight`: `0.75`
   * `Roughness`: `0.05`
   * `IOR`: `1.45`
   * `Emission`: `#00D9FF` (força 0.25 para brilho interno)

4. **Royal Vinyl / Fur (Mascotes / Tigrinho):**
   * `Base Color`: Laranja tigre acolhedor (`#FF8C00`)
   * `Subsurface Weight`: `0.30` (cor SSS: `#FF5500`)
   * `Roughness`: `0.35`
   * `Sheen`: `0.5`

---

## 📦 3. Especificação Técnica dos Sprites & Spritesheets

* **Formato:** PNG 32-bit (RGBA com canal Alpha limpo, sem sangria de preto/branco nas bordas).
* **Resoluções:**
  * **Ícones / Símbolos de Grade (Slots, Pinos, Moedas):** `256 x 256 px` (renderizado em 512x512 e com downscale bicúbico para nitidez máxima no mobile).
  * **Banners & Mascotes:** `512 x 512 px` ou `1024 x 512 px`.
  * **Spritesheets de Animação (Moeda Giratória, Baú Abrindo):** Grade linear horizontal de 16 frames (`256 x 4096 px` ou `128 x 2048 px`).
* **Desempenho:** 100% dos assets 3D são pré-renderizados em sprites. Isso garante que o jogo rode a **120 FPS cravados** em qualquer smartphone Android sem aquecer o aparelho ou drenar a bateria.

---

## 🎯 4. Matriz de Aplicação nos Jogos

| Jogo | Elemento 3D a Padronizar | Especificação Royal Toon |
| :--- | :--- | :--- |
| **Bingo Plinko** | Pinos (Pegs) | Bumper de ouro chanfrado gordinho com gema azul/roxa de chiclete brilhante no topo. |
| **Bingo Plinko** | Baldes (Buckets) | Baldes de brinquedo esmaltados com multiplicadores em relevo dourado. |
| **Bingo Plinko** | Bolas | Bolas de boliche em miniatura peroladas com faíscas. |
| **Match Machine** | Símbolo 7 | Número '7' em bala vermelha brilhante com borda de ouro grosso e pequenos diamantes redondos embutidos. |
| **Match Machine** | Símbolo Ouro | Três lingotes empilhados em ouro de brinquedo hiper-polido com selo de coroa. |
| **Match Machine** | Diamante | Gema azul brilhante facetada com estilo cartoon (grandes facetas limpas). |
| **Match Machine** | Sino | Sino de latão dourado gordinho com laço de cetim vermelho volumoso. |
| **Match Machine** | Frutas | Cerejas e Laranja apetitosas com gotas d'água peroladas e folhas de vinil verde. |
| **Match Machine** | Wild Mascot | Tigrinho fofo em 3D estilizado com colete vermelho de imperador e coroa dourada (estilo mascote de animação). |
| **Carteira Hub** | Moeda Mestre | Moeda dourada pesada com coroa de alto-relevo chanfrada e brilho especular. |

---

## 📐 5. Regra de Ouro da Consistência ("The Golden Rule")
> **"Nenhum asset entra no jogo se parecer um polígono cru sem textura, uma foto realista suja ou um emoji de sistema."**  
> Todos os elementos visuais devem parecer pertencer à mesma mesa de brinquedos de luxo ou ao mesmo filme de animação 3D da DreamWorks / Pixar.
