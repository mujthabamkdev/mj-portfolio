import { Linkedin, Github, Send } from 'lucide-react';
import { useState, useEffect } from 'react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/30'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text">
            Mujthaba
          </div>
          <div className="flex items-center space-x-5">
            <a
              href="https://linkedin.com/in/mujthabamk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-blue-600 transition-colors duration-300 hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin size={22} />
            </a>
            <a
              href="https://github.com/mujthabamkdev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-cyan-600 transition-colors duration-300 hover:scale-110"
              aria-label="GitHub"
            >
              <Github size={22} />
            </a>
            <a
              href="https://t.me/mujthabamk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-purple-600 transition-colors duration-300 hover:scale-110"
              aria-label="Telegram"
            >
              <Send size={22} />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
