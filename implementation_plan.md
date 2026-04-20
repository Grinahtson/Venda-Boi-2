# Refatoração Cinematográfica da Landing Page: Boi na Rede

Transformaremos a atual página inicial numa experiência de classe mundial, com peso, micro-interações magnéticas e o estilo visual "Organic Tech" adaptado para o Agronegócio.

## User Review Required

> [!IMPORTANT]
> Esta refatoração mudará radicalmente o visual atual da página inicial (home.tsx). Ele passará de um design padrão (baseado em templates) para um visual ultra-premium, focado num estilo de "Agro-Boutique/Lab". Preciso da sua permissão para reescrever as definições de cores (index.css) e a estrutura completa da Landing Page.

## Proposed Changes

---

### Global Design & Dependencies

Configurando a estrutura visual de base "Organic Tech" e o motor de animações GSAP.

#### [NEW] Instalação de Dependências
- Executar `npm install gsap @gsap/react` para incluir o mecanismo GSAP exigido pela arquitetura.

#### [MODIFY] [index.html](file:///c:/Users/DELL/Downloads/Nova%20pasta/client/index.html)
- Adição da tag do Filtro de Ruído Global (SVG `<feTurbulence>`).
- Atualização das Fontes Google: Plus Jakarta Sans, Outfit, Cormorant Garamond e IBM Plex Mono.

#### [MODIFY] [index.css](file:///c:/Users/DELL/Downloads/Nova%20pasta/client/src/index.css)
- Atualização extrema das variáveis globais CSS (`@theme inline`):
  - Primary: `#2E4036` (Musgo Profundo)
  - Accent: `#CC5833` (Argila)
  - Background: `#F2F0E9` (Creme Terroso)
  - Text: `#1A1A1A` (Carvão)
- Estilos para as micro-interações `cubic-bezier` de hover (escalas sadias e magnéticas).
- Inclusão do overlay universal de ruído de `0.05` de opacidade.

---

### Componentes de Interface & Landing Page

Reescrita completa da página inicial.

#### [MODIFY] [home.tsx](file:///c:/Users/DELL/Downloads/Nova%20pasta/client/src/pages/home.tsx)
Um dos arquivos mais vitais, a Home agora não terá blocos genéricos, e sim seções com ScrollTrigger:

- **B. Hero Section:**
  - Padrão: *"O Agronegócio conectando pontas é a"* (Plus Jakarta Sans) / *"Eficiência Direta."* (Cormorant Garamond itálico de escala massiva).
  - Background Unsplash dark farm com overlay dark gradient.
  - Animação Split Text e Stagger controlada via `gsap.context()`.

- **C. Features ("Artefatos de Software"):**
  1. **Diagnostic Shuffler:** Stack de cards com alternância por mola - "Venda Direta Sem Intermediário".
  2. **Telemetry Typewriter:** Ponto pulsante simulando um cursor terminal retro do Agro - "Catálogo Verificado ao Vivo".
  3. **Cursor Protocol Scheduler:** Hover e foco magnético, animando a facilidade - "Negociação Segura".

- **D. Philosophy:**
  - Fundo `#1A1A1A`.
  - Frase que fará Morph: "A maioria do mercado foca em intermediários caros." -> "*Nós focamos em conexões brutas.*"

- **E. Protocol (Sticky Stacking):**
  - Passos de negociação (1. Anunciar, 2. Conectar, 3. Lucrar) rodando numa timeline Pin de ScrollTrigger no fundo da tela, empilhando (Stacking) conforme rolamos.

- **F. Membership:**
  - Um Super Botão CTA que puxa o usuário para `/create-ad`. 

## Open Questions

> [!WARNING]
> Posso manter componentes originais menores que apareciam na Home (como a roleta do Market Ticker mostrando cotações do boi) encaixados abaixo do Hero da nova página?

## Verification Plan

### Testes Manuais
- Após concluir a reescrita, o processo do Vite processará as fontes e as dependências na hora (Hot Reload). Você poderá abrir `localhost:5000` (no Chrome através do arquivo `.bat` que criamos) e experimentar as sensações do Scroll.
- Verificarei os redimensionamentos para Mobile das fontes massivas no Hero.
