const Hero = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center relative overflow-hidden px-6">
      {/* Central glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 filter blur-[120px] animate-glow-pulse pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Text content — centered on top of character */}
        <div className="relative z-20">
          {/* Surveillance tag */}
          <div className="flex items-center gap-2 mb-4 reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] tracking-[0.4em] text-accent/60 uppercase font-mono">
              SYS.IDENTIFY // ASSET LOCATED
            </span>
          </div>

          {/* Subtitle */}
          <p className="text-xs md:text-sm tracking-[0.3em] text-muted uppercase mb-4 reveal" style={{ transitionDelay: '0.15s' }}>
            Software Development Engineer
          </p>

          {/* Name */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase leading-none mb-6 reveal" style={{ transitionDelay: '0.2s' }}>
            <span className="gradient-text">MUJTHABA</span>
          </h1>

          {/* Tagline */}
          <p className="text-sm md:text-base text-muted max-w-lg leading-relaxed mb-8 reveal" style={{ transitionDelay: '0.3s' }}>
            6+ Years of Software Development Experience specializing in
            Java Spring Boot, Angular, TypeScript & Microservices
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 items-start reveal" style={{ transitionDelay: '0.4s' }}>
            <a href="mailto:mujthabamkdev@gmail.com?subject=Let's Work Together" className="btn-accent">
              <span>GET IN TOUCH</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <a href="#work" className="text-xs tracking-[0.2em] text-muted hover:text-white transition-colors uppercase py-3">
              VIEW MY WORK →
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 reveal" style={{ transitionDelay: '0.6s' }}>
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase font-mono">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted/50 to-transparent animate-pulse" />
      </div>
    </section>
  );
};

export default Hero;
