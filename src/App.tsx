import { useState, useEffect, useCallback, useRef } from 'react';
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
import Bee, { type BeeLaunchOrigin } from './components/Bee';
import BeeLaunchTransition from './components/BeeLaunchTransition';
import CustomCursor from './components/CustomCursor';
import PlaySection from './components/PlaySection';
import MatrixBackground from './components/MatrixBackground';
import PlayPage from './pages/PlayPage';

type VisitorChoice = 'yes' | 'no';
const VISITOR_CHOICE_KEY = 'mj-portfolio:visitor-choice:v1';

function readVisitorChoice(): VisitorChoice | null {
  try {
    const choice = localStorage.getItem(VISITOR_CHOICE_KEY);
    return choice === 'yes' || choice === 'no' ? choice : null;
  } catch {
    // Storage may be blocked; keep the gate usable for this visit.
    return null;
  }
}

function Portfolio({ onBeeLaunch }: { onBeeLaunch: (origin: BeeLaunchOrigin) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [visitorChoice, setVisitorChoice] = useState<VisitorChoice | null>(readVisitorChoice);
  const gatePassed = visitorChoice === 'yes';
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const rememberVisitorChoice = (choice: VisitorChoice) => {
    try {
      localStorage.setItem(VISITOR_CHOICE_KEY, choice);
    } catch {
      // A storage failure must not prevent either button from working.
    }
    setVisitorChoice(choice);
  };

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

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

  return (
    <div className="min-h-screen relative bg-black">
      {isLoading && <Loading onComplete={handleLoadingComplete} />}
      {!isLoading && !gatePassed && (
        <SecurityScan
          declined={visitorChoice === 'no'}
          onProceed={() => rememberVisitorChoice('yes')}
          onDecline={() => rememberVisitorChoice('no')}
        />
      )}
      {!isLoading && !gatePassed && <CustomCursor />}

      {/* Electronic bee — perches on active section headers, free-flies between */}
      {!isLoading && gatePassed && !isResumeModalOpen && <Bee onLaunch={onBeeLaunch} />}

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
      </div>
      <ResumeModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />
    </div>
  );
}

function App() {
  const [beeLaunch, setBeeLaunch] = useState<BeeLaunchOrigin | null>(null);
  const routesRef = useRef<HTMLDivElement>(null);
  const finishBeeLaunch = useCallback(() => setBeeLaunch(null), []);

  useEffect(() => {
    const routes = routesRef.current;
    if (!beeLaunch || !routes) return;
    routes.setAttribute('inert', '');
    return () => {
      routes.removeAttribute('inert');
      const title = routes.querySelector<HTMLElement>('.play-page-title');
      if (title) {
        title.setAttribute('tabindex', '-1');
        title.focus({ preventScroll: true });
      }
    };
  }, [beeLaunch]);

  return (
    <BrowserRouter>
      <div ref={routesRef}>
        <Routes>
          <Route path="/" element={<Portfolio onBeeLaunch={setBeeLaunch} />} />
          <Route path="/play" element={<PlayPage />} />
        </Routes>
      </div>
      {beeLaunch && <BeeLaunchTransition origin={beeLaunch} onComplete={finishBeeLaunch} />}
    </BrowserRouter>
  );
}

export default App;
