import { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ResumeModal from './components/ResumeModal';
import Loading from './components/Loading';
import SecurityScan from './components/SecurityScan';
import { lazy, Suspense } from 'react';
const Character = lazy(() => import('./components/Character'));
import CustomCursor from './components/CustomCursor';
import PlaySection from './components/PlaySection';
import MatrixBackground from './components/MatrixBackground';
import PlayPage from './pages/PlayPage';

// Defines which SIDE the CONTENT is on for each section
// Character goes to the OPPOSITE side and looks toward content
const SECTION_SIDES: Record<string, 'left' | 'right'> = {
  hero: 'left',   // content left → character right
  about: 'right',  // content right → character left
  work: 'left',   // content left → character right
  projects: 'right',  // content right → character left
  play: 'left',   // content left → character right
  contact: 'left',   // content left → character right
};

function Portfolio() {
  const [isLoading, setIsLoading] = useState(true);
  const [gatePassed, setGatePassed] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // IntersectionObserver: track which section is most visible
  useEffect(() => {
    if (isLoading) return;

    const sectionIds = Object.keys(SECTION_SIDES);
    const visibilityMap: Record<string, number> = {};

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap[entry.target.id] = entry.intersectionRatio;
        });
        // Find most visible section
        const best = Object.entries(visibilityMap).sort((a, b) => b[1] - a[1])[0];
        if (best && best[1] > 0) setActiveSection(best[0]);
      },
      {
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
        rootMargin: '-25% 0px -55% 0px',
      }
    );

    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 200);

    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [isLoading]);

  // Scroll-triggered reveal animations
  useEffect(() => {
    if (isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
      elements.forEach((el) => observer.observe(el));
    }, 100);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [isLoading]);

  const contentSide = SECTION_SIDES[activeSection] ?? 'left';

  return (
    <div className="min-h-screen relative bg-black">
      {isLoading && <Loading onComplete={handleLoadingComplete} />}
      {!isLoading && !gatePassed && (
        <SecurityScan onProceed={() => setGatePassed(true)} />
      )}
      {!isLoading && !gatePassed && <CustomCursor />}

      {/* 3D Character — fixed background layer */}
      {!isLoading && (
        <div className="fixed inset-0 z-[1] pointer-events-none">
          <ErrorBoundary>
            <Suspense fallback={null}>
              <Character contentSide={contentSide} />
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Matrix/code animated background — behind everything */}
      {!isLoading && <MatrixBackground />}

      {/* Animated blob background */}
      <div className="blob-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="neon-border" />

      {!isLoading && (
        <button onClick={() => setIsResumeModalOpen(true)} className="resume-tab">
          RESUME
        </button>
      )}
      {!isLoading && (
        <button
          onClick={() => setIsResumeModalOpen(true)}
          className="resume-tab-mobile md:hidden"
          aria-label="Open resume"
        >
          RESUME
        </button>
      )}

      <div className="relative z-10">
        <Header />
        <Hero />
        <About />
        <Experience />
        <Projects />
        <PlaySection />
        <Contact />
        <Footer />
        <ResumeModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/play" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;