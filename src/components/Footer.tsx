const Footer = () => {
  return (
    <footer className="py-12 px-6 relative z-10">
      <div className="section-divider mb-8" />
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-white/20 tracking-wider">
          © {new Date().getFullYear()} MUJTHABA MANDAYEN KANDI
        </p>
        <p className="text-xs text-white/20 tracking-wider">
          Made with <span className="text-accent">♥</span> and lots of ☕
        </p>
      </div>
    </footer>
  );
};

export default Footer;
