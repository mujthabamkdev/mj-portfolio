import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'ABOUT', href: '#about', route: false },
  { label: 'WORK', href: '#work', route: false },
  { label: 'PROJECTS', href: '#projects', route: false },
  { label: 'PLAY', href: '/play', route: true },
  { label: 'CONTACT', href: '#contact', route: false },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: { href: string; route: boolean }) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (link.route) {
      navigate(link.href);
    } else {
      const el = document.querySelector(link.href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? 'bg-black/80 backdrop-blur-xl border-b border-white/5'
        : 'bg-transparent'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="text-xl font-bold tracking-tight accent-text hover:opacity-80 transition-opacity">
            MJ
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`text-xs font-medium tracking-[0.2em] transition-colors duration-300 ${link.route ? 'text-accent hover:text-white' : 'text-muted hover:text-white'
                  }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-muted hover:text-white transition-colors"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div data-testid="mobile-menu" className="md:hidden mt-4 flex flex-col gap-4 border-t border-white/5 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`text-xs font-medium tracking-[0.2em] transition-colors duration-300 ${link.route ? 'text-accent hover:text-white' : 'text-muted hover:text-white'
                  }`}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;