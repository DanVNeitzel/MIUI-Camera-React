# 📷 Camera MIUI — Câmera Xiaomi em React

[![Deploy](https://github.com/DanVNeitzel/MIUI-Camera-React/actions/workflows/deploy.yml/badge.svg)](https://github.com/DanVNeitzel/MIUI-Camera-React/actions/workflows/deploy.yml)
[![Version](https://img.shields.io/badge/versão-1.0.7-yellow)](#)
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
│   ├── useBackButton.js      # Hook LIFO para botão Voltar do Android (popstate)
│   ├── useCamera.js          # Lógica de câmera (stream, captura, zoom, foco, exposição, ISO, SS)
│   └── useSettings.js        # Gerenciamento de configurações persistidas
├── utils/
│   ├── changelog.js          # Fonte única de versão e histórico de mudanças
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
│   ├── ProControls/          # Painel modo Pro (EV, WB, ISO, obturador) com botões Auto
│   ├── FlashOverlay/         # Animação de flash branco ao capturar
│   ├── GridOverlay/          # Grade de composição (terços, quadrado, ambos)
│   ├── Gallery/              # Galeria completa com EXIF, favoritos, edição, zoom e contexto
│   ├── MoreModes/            # Sheet "MAIS" com modos extras (Panorama, Câmera lenta, Time-lapse, Documento)
│   ├── VideoModeControls/    # Seletor de FPS (câmera lenta) e intervalo (time-lapse)
│   ├── PanoramaOverlay/      # Guia visual de varredura panorâmica (linha, seta, progresso)
│   ├── DocumentOverlay/      # Guia de enquadramento A4 com cantoneiras para modo Documento
│   ├── PhotoPreview/         # Preview rápido da última foto
│   ├── Settings/             # Configurações do app (câmera, foto, filtros, sistema, changelog, sobre)
│   └── WhatsNew/             # Modal "O que há de novo" — exibido na primeira abertura por versão
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
| **Tap-to-focus** | `track.applyConstraints` com `pointOfInterest` — anel amarelo animado; EV zerado automaticamente ao focar |
| **Focus lock** | Toque longo (650 ms) trava o foco no ponto — anel branco com ícone de cadeado; toque normal destrava |
| **Slider de exposição** | Aparece ao lado do ponto de foco, aplica `exposureCompensation` via API |
| **Zoom** | Pinch-to-zoom + botões preset + slider fino (0.5× a 8×) |
| **Flash** | Cicla OFF → ON → AUTO; torch real via `applyConstraints` |
| **Timer** | 0 / 3 / 5 / 10 segundos com contagem regressiva na tela |
| **Grade de composição** | Terços / Quadrado / Ambos / Nenhum |
| **Tela cheia** | Fullscreen automático na primeira interação |
| **Orientação** | Captura detecta o ângulo real do dispositivo — portrait e landscape corretos |

### Modos de captura
| Modo | Comportamento |
|---|---|
| **Foto** | JPEG / PNG / WebP com qualidade configurável |
| **Vídeo** | Gravação com `MediaRecorder`, contador de tempo |
| **Retrato** | Vinheta de profundidade de campo + filtro suave |
| **Noturno** | Multi-frame stacking via GPU (canvas globalAlpha) |
| **Pro** | EV, WB, ISO (50–3200), Velocidade de obturador (A a 8") — aplica via `applyConstraints`; botões Auto para EV e WB |
| **Câmera lenta** | Gravação via `MediaRecorder` com constraint de alta taxa de quadros (60 / 120 / 240 / 480 fps) |
| **Time-lapse** | Captura de frames em canvas por intervalo configurável (0,5 s a 1 min) e exportação em vídeo acelerado |
| **Panorama** | Varredura até 8 frames com costura horizontal automática (35% sobreposição) — exportado como JPEG |
| **Documento** | Guia de enquadramento A4 com cantoneiras + filtro de alto contraste e dessaturação |
| **MAIS** | Sheet com modos extras: Panorama, Câmera lenta, Time-lapse e Documento |

### Galeria
| Funcionalidade | Detalhes |
|---|---|
| **Persistência** | Fotos salvas em IndexedDB — sobrevivem ao recarregamento |
| **Formato correto** | Extensão do arquivo reflete o formato real (`.jpg`, `.png`, `.webp`) |
| **Visualizador** | Full-screen com navegação anterior/próxima |
| **Zoom e pan** | Pinch-to-zoom, pan livre e duplo-toque para alternar 1× / 2,5× no viewer |
| **Rotação** | Botão de rotação 90° CW na barra do viewer |
| **Compartilhar** | Web Share API no menu de contexto |
| **Menu de contexto** | Toque longo ou botão ⋮ — Favoritar / Compartilhar / Download / Editar / Propriedades / Excluir |
| **Favoritos** | Marcação com ★, persistido no `localStorage`; fotos favoritadas **não podem ser excluídas** |
| **Propriedades (EXIF)** | Câmera, lente, ISO, abertura, exposição, focal, GPS com link para Google Maps |
| **Edição** | Rotação ±90°, controle de qualidade, salvar cópia |
| **Multi-seleção** | Selecionar tudo, download em ZIP ou sequencial, exclusão em lote |
| **Proteção de favoritos** | Exclusão individual e em lote ignoram/bloqueiam fotos favoritadas |

### Interface & UX
| Funcionalidade | Detalhes |
|---|---|
| **Botão Voltar do Android** | Stack LIFO via `popstate` — fecha galeria, configurações, modais e sheets em cascata |
| **Modal "O que há de novo"** | Exibido automaticamente na primeira abertura de cada versão, com animação de entrada e saída |
| **Acessibilidade do modal** | `role="dialog"`, `aria-modal`, `aria-labelledby` e foco movido para dentro ao abrir |
| **Atalho de captura** | Botões de volume (Vol + / Vol −), Espaço ou Enter disparam a câmera; habilitável nas configurações |

### Configurações
| Opção | Detalhes |
|---|---|
| **Resolução** | 720p / 1080p / 4K |
| **Qualidade de foto** | Baixa / Média / Alta / Máxima |
| **Formato** | JPEG / PNG / WebP |
| **Câmera padrão** | Traseira / Frontal |
| **Filtro de preview** | Nenhum, Vivid, Suave, P&B, Sépia, Cinema |
| **Vinheta** | Liga/desliga |
| **Tecla de captura** | Toggle on/off + seleção de tecla: Vol +, Vol −, Espaço, Enter |
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

### v1.0.8 — Abril 2026
- Modo Panorama: captura por varredura (até 8 frames) com costura horizontal automática e 35% de sobreposição — exportado como JPEG
- Modo Panorama: guia visual com linha de horizonte, seta animada e barra de progresso
- Modo Documento: guia de enquadramento A4 com cantoneiras brancas e filtro de alto contraste/dessaturação
- Câmera lenta: gravação real via MediaRecorder com constraint de alta taxa de quadros (60 / 120 / 240 / 480 fps)
- Time-lapse: captura de frames no canvas em intervalo configurável (0,5 s a 1 min) e exportação acelerada em vídeo
- VideoModeControls: seletor de FPS para câmera lenta e seletor de intervalo para time-lapse, desabilitados durante gravação
- Modo Pro: botões EV Auto e WB Auto — redefinem exposição (0 EV) e balanço de branco (5500 K) com um toque
- Foco: EV zerado automaticamente ao tocar na tela para focar
- Foco: toque longo (650 ms) trava o foco — anel branco com cadeado; toque normal destrava

### v1.0.7 — Abril 2026
- Atalho de captura: botões de volume (Vol + / Vol −), Espaço ou Enter disparam a foto/vídeo
- Configuração "Tecla de captura" nas configurações — toggle para habilitar/desabilitar
- Seletor de tecla visível apenas quando o atalho está ativo
- Atalho inativo automaticamente quando galeria, configurações ou qualquer modal está aberto
- `e.preventDefault()` nos botões de volume — impede alteração do volume do sistema ao capturar

### v1.0.6 — Abril 2026
- Modal "O que há de novo": salvo automaticamente na primeira exibição — não reaparece ao fechar pelo backdrop
- Modal "O que há de novo": checkbox persiste imediatamente ao marcar, sem precisar clicar em "Entendido"
- Modal "O que há de novo": acessibilidade — `role="dialog"`, `aria-modal`, `aria-labelledby` e foco gerenciado
- Modal "O que há de novo": animação de saída (slideDown) e scroll interno para listas longas
- Botão Voltar do Android gerenciado dentro do próprio componente WhatsNew
- Fonte única de verdade: versão e changelog centralizados em `src/utils/changelog.js`

### v1.0.5 — Abril 2026
- Modal "O que há de novo" exibido na primeira abertura com opção de não mostrar novamente
- Modo MAIS: sheet com modos extras — Panorama, Câmera lenta, Time-lapse e Documento
- Modos extras: perfis de filtro e qualidade dedicados para cada modo
- Indicador amarelo em "MAIS" quando um modo extra está ativo
- Botão Voltar do Android fecha o sheet de modos extras

### v1.0.4 — Abril 2026
- Correção de orientação: foto capturada em portrait/landscape reflete o ângulo real do dispositivo
- Galeria: opção Compartilhar no menu de contexto (Web Share API)
- Galeria: segurar a foto no viewer abre o menu de contexto
- Galeria: pinch-to-zoom e pan na visualização individual
- Galeria: duplo-toque alterna zoom 1× / 2,5×
- Galeria: botão de rotação (90° CW) na barra do viewer
- Botão Voltar do Android integrado: fecha galeria, configurações e todas as modais em cascata

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

