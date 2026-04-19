# 📷 Camera MIUI — Câmera Xiaomi em React

[![Deploy](https://github.com/DanVNeitzel/MIUI-Camera-React/actions/workflows/deploy.yml/badge.svg)](https://github.com/DanVNeitzel/MIUI-Camera-React/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/versão-1.0.3-yellow)](#)
[![PWA](https://img.shields.io/badge/PWA-instalável-blue)](#)

Aplicação React PWA que simula a interface da câmera MIUI (Xiaomi), com acesso real à câmera do dispositivo via Web API. Instalável como app nativo em Android e iOS.

🔗 **Demo ao vivo:** [danvneitzel.github.io/MIUI-Camera-React](https://DanVNeitzel.github.io/MIUI-Camera-React)

---

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento (acessível na rede local)
npm run dev

# Build de produção
npm run build

# Prévia do build
npm run preview
```

Abra `http://localhost:5173` no navegador. Ao acessar pelo celular use o IP local exibido no terminal (ex: `http://192.168.x.x:5173`).

> **Nota:** O navegador exige contexto seguro (HTTPS ou `localhost`) para acessar a câmera. Em dispositivos móveis via IP local, alguns browsers bloqueiam — use um túnel HTTPS (ex: [ngrok](https://ngrok.com/)) se necessário.

---

## 🗂️ Estrutura de componentes

```
src/
├── hooks/
│   ├── useCamera.js          # Lógica de câmera (stream, captura, zoom, foco, exposição, ISO, SS)
│   └── useSettings.js        # Gerenciamento de configurações persistidas
├── utils/
│   ├── filterMap.js          # Mapa de filtros CSS e modo Pro
│   ├── modeProfiles.js       # Perfis por modo (noturno, retrato, pro...)
│   └── photoDB.js            # Persistência de fotos via IndexedDB
├── components/
│   ├── Camera/               # Viewfinder (<video>) + foco ring + slider de exposição
│   ├── TopBar/               # Barra superior (flash, timer, grade, tela cheia, configurações)
│   ├── ZoomControl/          # Botões de preset de zoom + slider fino
│   ├── ModeSelector/         # Seletor horizontal de modos
│   ├── LensSelector/         # Seletor de lente (0.5× / 1× / 2× / 3×)
│   ├── Controls/             # Linha de controles (galeria, captura, trocar câmera)
│   ├── ProControls/          # Painel modo Pro (EV, WB, ISO, velocidade de obturador)
│   ├── FlashOverlay/         # Animação de flash branco ao capturar
│   ├── GridOverlay/          # Grade de composição (terços, quadrado, ambos)
│   ├── Gallery/              # Galeria completa com EXIF, favoritos, edição e contexto
│   ├── PhotoPreview/         # Preview rápido da última foto
│   └── Settings/             # Configurações do app (câmera, foto, filtros, sistema, sobre)
├── App.jsx
└── main.jsx
```

---

## ✨ Funcionalidades

### Câmera
| Funcionalidade | Detalhes |
|---|---|
| **Preview em tempo real** | `getUserMedia` com resolução ideal configurável (720p / 1080p / 4K) |
| **Trocar câmera** | Alterna frontal ↔ traseira |
| **Seletor de lente** | Detecta câmeras 0.5× / 1× / 2× / 3× automaticamente pelo label |
| **Tap-to-focus** | `track.applyConstraints` com `pointOfInterest` — anel amarelo animado |
| **Slider de exposição** | Aparece ao lado do ponto de foco, aplica `exposureCompensation` via API |
| **Zoom** | Pinch-to-zoom + botões preset + slider fino (0.5× a 8×) |
| **Flash** | Cicla OFF → ON → AUTO; torch real via `applyConstraints` |
| **Timer** | 0 / 3 / 5 / 10 segundos com contagem regressiva na tela |
| **Grade de composição** | Terços / Quadrado / Ambos / Nenhum |
| **Tela cheia** | Fullscreen automático na primeira interação |

### Modos de captura
| Modo | Comportamento |
|---|---|
| **Foto** | JPEG com qualidade configurável |
| **Vídeo** | Gravação com `MediaRecorder`, contador de tempo |
| **Retrato** | Vinheta de profundidade de campo + filtro suave |
| **Noturno** | Multi-frame stacking via GPU (canvas globalAlpha) |
| **Pro** | EV, WB, ISO (50–3200), Velocidade de obturador (A a 8") — aplica via `applyConstraints` |
| **Panorama** | Interface UI |

### Galeria
| Funcionalidade | Detalhes |
|---|---|
| **Persistência** | Fotos salvas em IndexedDB — sobrevivem ao recarregamento |
| **Visualizador** | Full-screen com navegação anterior/próxima |
| **Menu de contexto** | Toque longo ou botão ⋮ — Favoritar / Download / Editar / Propriedades / Excluir |
| **Favoritos** | Marcação com ★, persistido no `localStorage`; fotos favoritadas **não podem ser excluídas** |
| **Propriedades (EXIF)** | Câmera, lente, ISO, abertura, exposição, focal, GPS com link para Google Maps |
| **Edição** | Rotação ±90°, controle de qualidade, salvar cópia |
| **Multi-seleção** | Selecionar tudo, download em ZIP ou sequencial, exclusão em lote |
| **Proteção de favoritos** | Exclusão individual e em lote ignoram/bloqueiam fotos favoritadas |

### Configurações
| Opção | Detalhes |
|---|---|
| **Resolução** | 720p / 1080p / 4K |
| **Qualidade de foto** | Baixa / Média / Alta / Máxima |
| **Formato** | JPEG / PNG / WebP |
| **Câmera padrão** | Traseira / Frontal |
| **Filtro de preview** | Nenhum, Vivid, Suave, P&B, Sépia, Cinema |
| **Vinheta** | Liga/desliga |
| **Reset** | Restaurar padrões de fábrica |
| **Forçar atualização** | Limpa cache do Service Worker |
| **Sobre** | Versão, créditos, link GitHub |
| **Changelog** | Histórico de versões dentro do app |

---

## 🎨 Design

Inspirado no MIUI Camera da Xiaomi:
- Fundo totalmente preto com gradientes de overlay
- Botão de captura: anel branco + círculo interno
- Modo ativo destacado com ponto laranja (`#FF6A00`)
- Tipografia `system-ui` / sans-serif limpa e espaçada
- Transições e animações suaves em todos os elementos interativos
- Safe area (iOS notch / Android gesture bar) via `env(safe-area-inset-*)`

---

## 🛠️ Tecnologias

- **React 18** + **Vite 5**
- **vite-plugin-pwa** + **Workbox** — PWA instalável com suporte offline
- **IndexedDB** (`idb`) — persistência local de fotos
- **exifr** — leitura de metadados EXIF/GPS
- **jszip** — download em lote como ZIP
- **GitHub Actions** — deploy automático para GitHub Pages

---

## 📦 Changelog

### v1.0.3 — Abril 2026
- Modo Pro: controles reais de ISO e velocidade de obturador
- Tap-to-focus corrigido: tela não escurece mais após o foco
- Slider de brilho pós-foco funcionando corretamente
- Menu nativo do navegador bloqueado no toque longo da galeria
- Seção Sobre + botão Changelog nas configurações
- Fotos favoritadas protegidas contra exclusão

### v1.0.2 — Abril 2026
- Modal de confirmação para exclusão individual de foto
- Painel de edição: rotação ±90° e controle de qualidade
- Painel de propriedades com dados EXIF e GPS
- Menu de contexto (⋮) e toque longo na galeria
- Favoritos com persistência no localStorage

### v1.0.1 — Março 2026
- Foco real via `applyConstraints` (tap-to-focus)
- Slider de exposição após toque no visor
- Galeria: multi-seleção e download em ZIP
- Suporte offline com Workbox (skipWaiting + clientsClaim)
- Configurações: reset de padrões e forçar atualização

### v1.0.0 — Fevereiro 2026
- Lançamento inicial do Camera MIUI React
- Modos: Foto, Vídeo, Retrato, Pro, Noturno, Panorama
- Timer (0 / 3 / 5 / 10 s), grade e tela cheia
- Seleção de câmera traseira e frontal
- PWA instalável com ícones gerados automaticamente
- Deploy contínuo via GitHub Actions

---

## 👤 Autor

Desenvolvido por **Daniel Neitzel Vieira** — 2026  
[github.com/DanVNeitzel](https://github.com/DanVNeitzel)

