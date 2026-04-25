// ─── Single source of truth for version + changelog ──────────────────────────
// WhatsNew.jsx and Settings.jsx both import from here.
// To release a new version:
//   1. Bump LATEST_VERSION
//   2. Add a new entry at the top of CHANGELOG (keep existing entries)

export const LATEST_VERSION = 'v1.2.0';

/** @type {{ version: string, date: string, changes: string[] }[]} */
export const CHANGELOG = [
  {
    version: 'v1.2.0',
    date: 'Abril 2026',
    changes: [
      'Galeria: sistema de thumbnails — miniaturas de 320 px geradas automaticamente em background após cada captura, galeria abre instantaneamente sem travar',
      'Galeria: viewer carrega imagem em resolução completa somente ao abrir a foto individualmente (lazy load)',
      'Galeria: imagens no grid carregadas com loading=lazy e decoding=async — UI não bloqueia ao rolar',
      'Galeria em Nuvem: armazenamento migrado de localStorage para IndexedDB — elimina o erro de cota ao enviar muitas fotos',
      'Galeria em Nuvem: enviar para nuvem carrega automaticamente a imagem completa quando a fonte é um thumbnail',
      'Galeria: multi-seleção — nova opção "Enviar selecionadas para Nuvem" na barra de lote',
      'Galeria: upload em lote com contador de progresso (x de y enviadas)',
    ],
  },
  {
    version: 'v1.1.0',
    date: 'Abril 2026',
    changes: [
      'Galeria em Nuvem: login/cadastro com usuário e senha — conta criada automaticamente no primeiro acesso',
      'Galeria em Nuvem: armazenamento simulado em localStorage com fotos por usuário (base64)',
      'Galeria em Nuvem: modal de conta exibe estatísticas (nº de fotos e KB usados)',
      'Galeria em Nuvem: seletor Local / Nuvem para alternar a origem das fotos exibidas',
      'Galeria em Nuvem: menu de contexto exibe opção "Copiar para nuvem" ao segurar/abrir uma foto local quando logado',
      'Galeria em Nuvem: badge azul de nuvem nas fotos provenientes da nuvem no grid',
      'Configurações: toggle "Salvar como Base64" — armazena fotos como texto no IndexedDB sem gerar arquivo físico (ideal para nuvem)',
      'Fotos em base64: carregadas diretamente sem criar ObjectURL — reduz uso de memória e evita vazamentos',
    ],
  },
  {
    version: 'v1.0.9',
    date: 'Abril 2026',
    changes: [
      'Feedback háptico: vibração ao capturar foto (30 ms), travar foco (duplo pulso 25+50+25 ms), trocar câmera, flash e timer',
      'Vibração ao mudar de modo pelo seletor horizontal',
      'Flash: sensor aguarda 150 ms após acender o torch antes de capturar — fotos com flash mais claras e corretas',
      'Flash: overlay branco dispara no exato momento da captura (não mais após)',
      'Troca de câmera: animação de flip 3D em perspectiva (rotateY) no lugar do fade simples',
      'Slider de exposição movido para posição fixa na lateral direita — não sobreposta ao dedo',
      'Badge de zoom central durante gesto de pinça — mostra o valor em tempo real (ex: 2.4×)',
      'Thumbnail da galeria: animação de reveal ao capturar nova foto (scale + fade)',
      'Controles de modo (Pro, Vídeo lento, Time-lapse) animam ao entrar em qualquer modo',
      'Galeria: barra de arraste no topo; arrastar para baixo > 80 px fecha com efeito de físhico',
      'Toast de aviso quando o armazenamento (IndexedDB) está cheio — antes o erro era silenciado',
      'Foco travado é liberado automaticamente 2 s após cada captura',
    ],
  },
  {
    version: 'v1.0.8',
    date: 'Abril 2026',
    changes: [
      'Modo Panorama: captura por varredura (até 8 frames) com costura horizontal automática e 35% de sobreposição — exportado como JPEG',
      'Modo Panorama: guia visual com linha de horizonte, seta animada e barra de progresso',
      'Modo Documento: guia de enquadramento A4 com cantoneiras brancas e filtro de alto contraste/dessaturação',
      'Câmera lenta: gravação real via MediaRecorder com constraint de alta taxa de quadros (60 / 120 / 240 / 480 fps)',
      'Time-lapse: captura de frames no canvas em intervalo configurável (0,5 s a 1 min) e exportação acelerada em vídeo',
      'VideoModeControls: seletor de FPS para câmera lenta e seletor de intervalo para time-lapse, desabilitados durante gravação',
      'Modo Pro: botões EV Auto e WB Auto — redefinem exposição (0 EV) e balanço de branco (5500 K) com um toque',
      'Foco: EV zerado automaticamente ao tocar na tela para focar',
      'Foco: toque longo (650 ms) trava o foco — anel branco com cadeado; toque normal destrava',
    ],
  },
  {
    version: 'v1.0.7',
    date: 'Abril 2026',
    changes: [
      'Atalho de captura: botões de volume (Vol + / Vol −), Espaço ou Enter disparam a foto/vídeo',
      'Configuração "Tecla de captura" nas configurações — toggle para habilitar/desabilitar',
      'Seletor de tecla (Vol +, Vol −, Espaço, Enter) visível apenas quando o atalho está ativo',
      'Atalho inativo automaticamente quando galeria, configurações ou qualquer modal está aberto',
      'e.preventDefault() nos botões de volume — impede alteração do volume do sistema ao capturar',
    ],
  },
  {
    version: 'v1.0.6',
    date: 'Abril 2026',
    changes: [
      'Modal "O que há de novo": salvo automaticamente na primeira exibição — não desaparece ao fechar pelo backdrop',
      'Modal "O que há de novo": checkbox persiste imediatamente ao marcar, sem precisar clicar em "Entendido"',
      'Modal "O que há de novo": acessibilidade — role="dialog", aria-modal, aria-labelledby e foco gerenciado',
      'Modal "O que há de novo": animação de saída (slideDown) e scroll interno para listas longas',
      'Botão Voltar do Android agora é gerenciado dentro do próprio componente WhatsNew',
      'Fonte única de verdade: versão e changelog centralizados em src/utils/changelog.js',
    ],
  },
  {
    version: 'v1.0.5',
    date: 'Abril 2026',
    changes: [
      'Modal "O que há de novo" exibido na primeira abertura com opção de não mostrar novamente',
      'Modo MAIS: sheet com modos extras — Panorama, Câmera lenta, Time-lapse e Documento',
      'Modos extras: perfis de filtro e qualidade dedicados para cada modo',
      'Indicador amarelo em "MAIS" quando um modo extra está ativo',
      'Botão Voltar do Android fecha o sheet de modos extras',
    ],
  },
  {
    version: 'v1.0.4',
    date: 'Abril 2026',
    changes: [
      'Correção de orientação: foto capturada em portrait/landscape reflete o ângulo real do dispositivo',
      'Galeria: opção Compartilhar no menu de contexto (Web Share API)',
      'Galeria: segurar a foto no viewer abre o menu de contexto',
      'Galeria: pinch-to-zoom e pan na visualização individual',
      'Galeria: duplo-toque alterna zoom 1× / 2,5×',
      'Galeria: botão de rotação (90° CW) na barra do viewer',
      'Botão Voltar do Android integrado: fecha galeria, configurações e todas as modais em cascata',
    ],
  },
  {
    version: 'v1.0.3',
    date: 'Abril 2026',
    changes: [
      'Modo Pro: controles reais de ISO e velocidade de obturador',
      'Tap-to-focus corrigido: tela não escurece mais após o foco',
      'Slider de brilho pós-foco funcionando corretamente',
      'Menu nativo do navegador bloqueado no toque longo da galeria',
      'Configurações: seção Sobre com versão, créditos e link do GitHub',
      'Configurações: botão Changelog com histórico de versões',
    ],
  },
  {
    version: 'v1.0.2',
    date: 'Abril 2026',
    changes: [
      'Modal de confirmação para exclusão individual de foto',
      'Painel de edição: rotação ±90° e controle de qualidade',
      'Painel de propriedades com dados EXIF e GPS',
      'Menu de contexto (⋮) e toque longo na galeria',
      'Favoritos com persistência no localStorage',
    ],
  },
  {
    version: 'v1.0.1',
    date: 'Março 2026',
    changes: [
      'Foco real via applyConstraints (tap-to-focus)',
      'Slider de exposição após toque no visor',
      'Galeria: multi-seleção e download em ZIP',
      'Suporte offline com Workbox (skipWaiting + clientsClaim)',
      'Configurações: reset de padrões e forçar atualização',
    ],
  },
  {
    version: 'v1.0.0',
    date: 'Fevereiro 2026',
    changes: [
      'Lançamento inicial do Camera MIUI React',
      'Modos: Foto, Vídeo, Retrato, Pro, Noturno, Panorama',
      'Timer (0 / 3 / 5 / 10 s), grade e tela cheia',
      'Seleção de câmera traseira e frontal',
      'PWA instalável com ícones gerados automaticamente',
      'Deploy contínuo via GitHub Actions',
    ],
  },
];
