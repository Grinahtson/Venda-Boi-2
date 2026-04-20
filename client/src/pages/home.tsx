import { Link } from "wouter";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MarketTicker } from "@/components/ui/market-ticker";
import { ArrowRight, Activity, Terminal, ShieldCheck, CheckCircle2, Star, Quote } from "lucide-react";
import heroImage from "@assets/generated_images/hero_image_of_a_modern_cattle_farm.png";
import neloreImage from "@/assets/showcase/nelore.png";
import angusImage from "@/assets/showcase/angus.png";
import farmerImage from "@/assets/showcase/farmer.png";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const container = useRef<HTMLDivElement>(null);
  
  useGSAP(() => {
    // Hero Animations
    gsap.from(".hero-text-anim", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
      delay: 0.2
    });

    // Features Section Stagger
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".features-section",
        start: "top 75%",
      },
      y: 60,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power3.out"
    });

    // Philosophy Scroll Reveal
    gsap.from(".philosophy-line", {
      scrollTrigger: {
        trigger: ".philosophy-section",
        start: "top 60%",
      },
      y: 30,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out"
    });

    // Testimonials Reveal
    gsap.from(".testimonial-card", {
      scrollTrigger: {
        trigger: ".testimonials-section",
        start: "top 70%",
      },
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out"
    });

    // Protocol Sticky Stacking
    const cards = gsap.utils.toArray<HTMLElement>('.protocol-card');
    cards.forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: "top top",
        pin: true,
        pinSpacing: false,
        end: "max",
        id: `card-${i}`
      });
      
      // Animate previous cards down & blur as new ones cover them
      if (i > 0) {
        gsap.to(cards[i - 1], {
          scale: 0.9,
          opacity: 0.4,
          filter: "blur(10px)",
          scrollTrigger: {
            trigger: card,
            start: "top 50%",
            end: "top top",
            scrub: true
          }
        });
      }
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, { scope: container });

  return (
    <div ref={container} className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-[#1A1A1A]">
      {/* ===== HERO ===== */}
      <section className="relative h-[100dvh] w-full overflow-hidden flex flex-col justify-end">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Fazenda" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/60 to-transparent" />
        </div>

        <div className="container relative z-10 px-6 md:px-12 pb-24 mx-auto w-full max-w-7xl">
          <div className="max-w-4xl">
            <h1 className="hero-text-anim text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
              <span className="block font-sans font-bold text-white mb-2">Boi na Rede</span>
              <span className="block font-serif italic text-accent mt-2">O Mercado Digital do Agronegócio.</span>
            </h1>
            <p className="hero-text-anim text-lg md:text-xl text-gray-300 font-light max-w-xl mb-10">
              Compre e venda gado de forma rápida, segura e inteligente. Conectamos produtores de todo o Brasil com a melhor tecnologia.
            </p>
            <div className="hero-text-anim flex gap-4">
              <Link href="/create-ad">
                <button className="magnetic-btn bg-accent text-accent-foreground px-8 md:px-10 py-4 rounded-[2rem] font-bold text-lg hover:shadow-[0_0_40px_rgba(204,88,51,0.4)] transition-all overflow-hidden relative group">
                  <span className="relative z-10 flex items-center gap-2">Anunciar meu lote <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker integration keeping original functionality */}
      <div className="w-full bg-[#1A1A1A] border-y border-white/5 py-1 z-20 relative">
        <MarketTicker />
      </div>

      {/* ===== FEATURES (Artefatos Funcionais) ===== */}
      <section className="features-section py-24 md:py-32 bg-background relative z-10">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="feature-card bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-500 hover-lift">
              <div className="mb-8 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Activity size={24} />
              </div>
              <h3 className="font-sans font-bold text-2xl mb-3 text-foreground">Venda Direta.</h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Nossa rede elimina os leiloeiros e intermediários. Conecte-se diretamente com produtores e abatedouros verificados na sua região. Lucro limpo.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-500 hover-lift group">
              <div className="mb-8 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Terminal size={24} />
              </div>
              <h3 className="font-sans font-bold text-2xl mb-3 flex items-center gap-2 text-foreground">
                Catálogo Ao Vivo <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              </h3>
              <div className="bg-primary/5 rounded-xl p-4 mt-2 mb-4 font-mono text-sm text-primary/80 overflow-hidden relative">
                {`> LOTE_008: Nelore (150 cab)`}<br/>
                {`> LOC: Mato Grosso do Sul`}<br/>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="feature-card bg-card border border-border/50 rounded-[2rem] p-8 shadow-sm flex flex-col hover:shadow-xl transition-shadow duration-500 hover-lift">
              <div className="mb-8 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-sans font-bold text-2xl mb-3 text-foreground">Negócio Seguro.</h3>
              <p className="text-muted-foreground font-light leading-relaxed">
                Cálculo de frete embutido, reputação de compradores transparentes e simulação de lucratividade. Ferramentas que cortam os riscos da operação.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===== PHILOSOPHY ===== */}
      <section className="philosophy-section py-32 bg-primary text-white relative z-10 overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.05] pattern-wavy" />
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <p className="philosophy-line font-mono text-white/50 mb-8 uppercase tracking-widest text-sm">A Filosofia do Mercado</p>
          <div className="philosophy-line text-2xl md:text-3xl text-white/70 font-light mb-4">
            A maioria da pecuária foca em negociadores e intermediários comissionados.
          </div>
          <div className="philosophy-line text-4xl md:text-6xl font-serif italic text-white mt-12 leading-tight drop-shadow-sm">
            Nós focamos em <span className="text-accent underline decoration-white/20 underline-offset-8">conexões rentáveis.</span>
          </div>
        </div>
      </section>

      {/* ===== PROTOCOL (Sticky Stacking) ===== */}
      <section className="protocol-container bg-background pb-32">
        {/* Card 1 */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center bg-background border-b border-border/30 relative py-20 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]">
          <div className="container max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-mono text-accent text-6xl opacity-20 block mb-6">01</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground">O Anúncio de Precisão.</h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">Suba dados técnicos, fotos, peso estimado corporal e de carcaça. O sistema entende o seu rebanho e padroniza a visualização para os compradores altamente qualificados.</p>
            </div>
            <div className="hidden md:flex justify-end p-12">
               <div className="w-[400px] h-[400px] rounded-[3rem] overflow-hidden shadow-2xl relative border-4 border-background">
                 <img src={farmerImage} alt="Produtor usando o celular no pasto" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
               </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center bg-[#F2F0E9] dark:bg-[#151515] border-b border-border/30 relative py-20 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)]">
          <div className="container max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:flex justify-start p-12">
               <div className="w-[400px] h-[400px] rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative border-4 border-[#F2F0E9] dark:border-[#151515]">
                 <img src={neloreImage} alt="Lote comercial de Nelore branco no pasto" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                 <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border/50">
                   <div className="flex justify-between items-center mb-1">
                     <span className="font-mono text-xs text-muted-foreground uppercase">Frete Estimado</span>
                     <span className="font-bold text-accent">R$ 1.850</span>
                   </div>
                   <div className="w-full bg-secondary/50 rounded-full h-1.5"><div className="bg-accent h-1.5 rounded-full w-[85%]"></div></div>
                 </div>
               </div>
            </div>
            <div>
              <span className="font-mono text-accent text-6xl opacity-20 block mb-6">02</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground">Match Matemático.</h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">Nosso motor não apenas lista. Ele calcula o frete rodoviário e te mostra a rentabilidade real de quem está num raio viável da sua fazenda através das nossas integrações avançadas.</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="protocol-card min-h-screen w-full flex items-center justify-center bg-background relative py-20 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)]">
          <div className="container max-w-6xl px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-mono text-primary text-6xl opacity-20 block mb-6">03</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight font-serif italic text-primary">Liquidez Bruta.</h2>
              <p className="text-xl text-muted-foreground font-light leading-relaxed">O comprador aprova. O sistema processa tudo com rapidez e conformidade. Seu gado vendido com segurança incontestável.</p>
            </div>
            <div className="hidden md:flex justify-end p-12">
               <div className="w-[400px] h-[400px] rounded-[3rem] overflow-hidden shadow-2xl relative flex items-center justify-center group border-4 border-background">
                 <img src={angusImage} alt="Rebanho Angus no por do sol refletindo liquidez e qualidade" className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/20 transition-colors duration-500"></div>
                 <div className="w-24 h-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform cursor-pointer relative z-10 shadow-2xl ring-4 ring-primary-foreground/30">
                   <CheckCircle2 size={40} className="text-primary-foreground" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS (Social Proof) ===== */}
      <section className="testimonials-section bg-[#F2F0E9] dark:bg-[#151515] py-32 relative z-20">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
             <span className="font-mono text-accent text-sm tracking-widest uppercase mb-4 block">Confiança no Campo</span>
             <h2 className="text-4xl md:text-6xl font-bold font-serif italic text-foreground leading-tight">Quem já está no<br/>pasto do futuro.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="testimonial-card bg-card border border-border/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow relative">
               <div className="flex gap-1 mb-6 text-accent">
                 <Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} />
               </div>
               <p className="text-muted-foreground font-light text-lg mb-8 relative z-10">"Parei de pagar altas comissões para currais de leilão. Vendi 120 cabeças de Nelore direto do meu pasto pro confinador em 48h. Operação limpa."</p>
               <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">CM</div>
                 <div>
                   <h4 className="font-bold text-foreground">Carlos M.</h4>
                   <p className="text-sm text-muted-foreground">Fazenda Santa Bárbara, MS</p>
                 </div>
               </div>
            </div>

            <div className="testimonial-card bg-card border border-border/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow relative">
               <Quote className="absolute top-6 right-6 text-primary/5 w-12 h-12" />
               <div className="flex gap-1 mb-6 text-accent">
                 <Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} />
               </div>
               <p className="text-muted-foreground font-light text-lg mb-8 relative z-10">"Comprei reprodutores Angus sem enrolação de intermediários. Custo 15% menor na arroba final e papelada assinada direto dentro do site."</p>
               <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">JR</div>
                 <div>
                   <h4 className="font-bold text-foreground">João R.</h4>
                   <p className="text-sm text-muted-foreground">Confinamento Boa Esperança, GO</p>
                 </div>
               </div>
            </div>

            <div className="testimonial-card bg-card border border-border/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow relative">
               <Quote className="absolute top-6 right-6 text-primary/5 w-12 h-12" />
               <div className="flex gap-1 mb-6 text-accent">
                 <Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} /><Star fill="currentColor" size={18} />
               </div>
               <p className="text-muted-foreground font-light text-lg mb-8 relative z-10">"O cálculo de frete automático integrado no anúncio me fez fechar negócio de venda com um abatedouro que a nossa fazenda nem sabia que existia."</p>
               <div className="flex items-center gap-4 border-t border-border/50 pt-6">
                 <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">FP</div>
                 <div>
                   <h4 className="font-bold text-foreground">Felipe P.</h4>
                   <p className="text-sm text-muted-foreground">Agropecuária Alvorada, MG</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ACTION CTA ===== */}
      <section className="bg-primary/95 pt-40 pb-32 text-center text-primary-foreground relative rounded-t-[4rem] z-20 mt-[-5rem] overflow-hidden">
         <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
         <div className="container mx-auto px-6 relative z-10">
            <h2 className="text-5xl md:text-7xl font-sans font-bold tracking-tighter mb-8 max-w-3xl mx-auto drop-shadow-md">O rebanho ao alcance de um clique.</h2>
            <Link href="/create-ad">
              <button className="magnetic-btn bg-accent text-accent-foreground px-12 py-5 rounded-[3rem] font-bold text-xl hover:bg-accent/90 focus:outline-none mb-12 shadow-[0_0_50px_rgba(204,88,51,0.5)]">
                Acessar o Marketplace
              </button>
            </Link>
            <div className="flex justify-center items-center gap-3 text-primary-foreground/70 font-mono text-sm">
                <span className="w-3 h-3 rounded-full bg-accent animate-pulse block shadow-[0_0_10px_rgba(204,88,51,1)]"></span>
                SISTEMA BOI NA REDE OPERACIONAL (VER: 2.1)
            </div>
         </div>
      </section>
    </div>
  );
}
