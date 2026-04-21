// ─── Single source of truth for version + changelog ──────────────────────────
// WhatsNew.jsx and Settings.jsx both import from here.
// To release a new version:
//   1. Bump LATEST_VERSION
//   2. Add a new entry at the top of CHANGELOG (keep existing entries)

export const LATEST_VERSION = 'v1.0.7';

/** @type {{ version: string, date: string, changes: string[] }[]} */
export const CHANGELOG = [
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
