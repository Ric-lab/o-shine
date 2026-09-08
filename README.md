# ✨ O-SHINE: Arcade & Casino Multi-Game Hub

Bem-vindo ao repositório oficial do **O-Shine**!

Este projeto é um Hub de Arcade e Cassino Casual mobile para Android desenvolvido com **React 19 + Canvas/WebGL + Capacitor**, contendo 9 minijogos viciantes integrados com carteira única, salvamento na nuvem (Google Drive) e monetização AdMob.

---

## 📖 Documentação e Diretrizes do Projeto
Todo o plano de desenvolvimento, filosofia de design de estúdio (Supercell / Dream Games / PG Soft) e a esteira de produção de assets 3D via Blender estão documentados em:

👉 **[MASTER-ROADMAP.md](./MASTER-ROADMAP.md)** 👈

A esteira agêntica oficial de arte (pesquisa → direção de arte → Meshy → Blender → 2.5D → QA visual → VFX) está documentada em **[docs/agents/O_SHINE_ART_PIPELINE.md](./docs/agents/O_SHINE_ART_PIPELINE.md)**, com o setup de ferramentas locais em **[docs/agents/SETUP_AGENT_TOOLS.md](./docs/agents/SETUP_AGENT_TOOLS.md)**.

---

## 🚀 Comandos Rápidos
- Instalar dependências: `npm install`
- Rodar servidor de desenvolvimento web: `npm run dev`
- Executar testes automatizados: `npm test`
- Checar linting: `npm run lint`
- Sincronizar com Android (Capacitor): `npx cap sync`
- Abrir no Android Studio: `npx cap open android`

---

## 🛠️ Ferramentas Locais Configuradas
- **Blender 5.2.1 LTS**: Instalado em `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` para geração automatizada de malhas, moedas e sprites 3D via Python (`blender -b -P script.py`).
