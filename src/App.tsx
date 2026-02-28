import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ResumeModal from './components/ResumeModal';
import Loading from './components/Loading';
import Character from './components/Character';
import CustomCursor from './components/CustomCursor';
import PlaySection from './components/PlaySection';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Track scroll progress for character transitions
  useEffect(() => {
    if (isLoading) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(Math.min(scrollY / maxScroll, 1));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isLoading]);

  // Scroll-triggered reveal animations
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isLoading]);

  return (
    <div className="min-h-screen relative bg-black">
      {/* Loading Screen */}
      {isLoading && <Loading onComplete={handleLoadingComplete} />}

      {/* Custom Cursor */}
      {!isLoading && <CustomCursor />}

      {/* 3D Character — fixed background layer */}
      {!isLoading && (
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <Character scrollProgress={scrollProgress} />
        </div>
      )}

      {/* Animated blob background */}
      <div className="blob-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Neon glow border */}
      <div className="neon-border"></div>

      {/* Vertical Resume Tab */}
      {!isLoading && (
        <button
          onClick={() => setIsResumeModalOpen(true)}
          className="resume-tab"
        >
          RESUME
        </button>
      )}

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <Hero />
        <About />
        <Experience />
        <Projects />
        <PlaySection />
        <Contact />
        <Footer />
        <ResumeModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;