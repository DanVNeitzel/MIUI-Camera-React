# 📷 MIUI Camera — Câmera Xiaomi em React

Aplicação React que simula a interface da câmera MIUI (Xiaomi), com acesso real à câmera do dispositivo via Web API.

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
│   └── useCamera.js          # Toda a lógica de câmera (stream, captura, zoom, foco, pinch)
├── components/
│   ├── Camera/               # Elemento <video> + indicador de foco
│   ├── TopBar/               # Barra superior (flash, timer, logo, configurações)
│   ├── ZoomControl/          # Botões de preset de zoom + slider fino
│   ├── ModeSelector/         # Seletor horizontal de modos (NOTURNO, FOTO, VÍDEO…)
│   ├── Controls/             # Linha de controles (miniatura galeria, botão captura, trocar câmera)
│   ├── FlashOverlay/         # Animação de flash branco ao capturar
│   └── PhotoPreview/         # Modal full-screen para ver e baixar a foto
├── App.jsx                   # Orquestrador: une o hook com todos os componentes
├── App.module.css
├── index.css                 # Reset e variáveis CSS globais
└── main.jsx                  # Entry-point React
```

---

## ✨ Funcionalidades

| Funcionalidade | Detalhes |
|---|---|
| **Preview em tempo real** | `getUserMedia` com resolução ideal 1920×1080 |
| **Trocar câmera** | Alterna `facingMode` entre `user` ↔ `environment` |
| **Captura de foto** | Canvas + `toDataURL` (JPEG 92%), mirror automático para câmera frontal |
| **Flash branco** | Overlay branco animado ao capturar |
| **Indicador de foco** | Anel amarelo animado no ponto tocado |
| **Zoom** | CSS `scale()` como simulação + API nativa (`track.applyConstraints`) se disponível |
| **Pinch-to-zoom** | Gestos de dois dedos no touch |
| **Preset de zoom** | Botões rápidos 0.6× / 1× / 2× / 5× |
| **Slider de zoom** | Controle fino de 0.5× a 8× |
| **Modos de câmera** | NOTURNO, FOTO, VÍDEO, RETRATO, PRO, MAIS (UI) |
| **Modo vídeo** | Botão de captura vira vermelho |
| **Miniatura galeria** | Última foto capturada, clicável |
| **Pré-visualização** | Modal fullscreen com botão de download |
| **Flash mode** | Cicla entre OFF → ON → AUTO |
| **Responsivo** | Layout mobile-first, suporte a safe-area (iOS notch) |

---

## 🎨 Design

Inspirado no MIUI Camera da Xiaomi:
- Fundo totalmente preto com gradientes de overlay
- Botão de captura: anel branco + círculo interno
- Modo ativo destacado com ponto laranja (`#FF6A00`)
- Tipografia `system-ui` / san-serif limpa e espaçada
- Transições e animações suaves em todos os elementos interativos
