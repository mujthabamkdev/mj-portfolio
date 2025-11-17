import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Skills from './components/Skills';
import Expertise from './components/Expertise';
import Projects from './components/Projects';
import Footer from './components/Footer';
import ResumeModal from './components/ResumeModal';

function App() {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  // Water-like smooth scroll animations and background effect
  useEffect(() => {
    let ticking = false;

    const updateScrollAnimations = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollY / maxScroll, 1);
      
      // Update water background based on scroll with enhanced movement and visibility
      const waterLayers = document.querySelectorAll('.water-layer');
      waterLayers.forEach((layer, index) => {
        const speed = (index + 1) * 0.3;
        const scrollProgressValue = scrollY * 0.001;
        const xOffset = Math.sin(scrollProgressValue * speed) * 30;
        const yOffset = Math.cos(scrollProgressValue * speed) * 20;
        const rotate = scrollProgressValue * speed * 10;
        (layer as HTMLElement).style.transform = `translate(${xOffset}px, ${yOffset}px) rotate(${rotate}deg)`;
        
        // Increase opacity based on scroll for better visibility
        const baseOpacity = 0.15 + (scrollProgress * 0.2);
        (layer as HTMLElement).style.opacity = String(baseOpacity);
      });

      // Update background gradient based on scroll
      const waterBackground = document.querySelector('.water-background') as HTMLElement;
      if (waterBackground) {
        const intensity = scrollProgress * 0.3;
        waterBackground.style.background = `linear-gradient(135deg, 
          hsl(210, 40%, ${95 - intensity * 5}%) 0%, 
          hsl(210, 35%, ${92 - intensity * 5}%) 25%, 
          hsl(215, 30%, ${88 - intensity * 5}%) 50%, 
          hsl(210, 35%, ${92 - intensity * 5}%) 75%, 
          hsl(210, 40%, ${95 - intensity * 5}%) 100%)`;
      }

      // Trigger scroll-triggered animations with water-like easing
      const elements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .scale-in');
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 100; // Trigger point

        if (elementTop < window.innerHeight - elementVisible) {
          element.classList.add('visible');
        }
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollAnimations();
        });
        ticking = true;
      }
    };

    // Initial check for visible elements
    updateScrollAnimations();

    // Add scroll listener with passive for better performance
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Also check on resize
    window.addEventListener('resize', updateScrollAnimations, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateScrollAnimations);
    };
  }, []);

  // Cursor water droplet effect
  useEffect(() => {
    const createWaterDroplet = (e: MouseEvent) => {
      const droplet = document.createElement('div');
      droplet.className = 'water-droplet';
      
      const x = e.clientX;
      const y = e.clientY;
      
      droplet.style.left = `${x}px`;
      droplet.style.top = `${y}px`;
      
      document.body.appendChild(droplet);
      
      // Remove droplet after animation
      setTimeout(() => {
        droplet.remove();
      }, 2000);
    };

    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (!throttleTimeout) {
        createWaterDroplet(e);
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 100); // Create droplet every 100ms max
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Water-like animated background with glossy effect */}
      <div className="water-background">
        <div className="water-layer water-layer-1"></div>
        <div className="water-layer water-layer-2"></div>
        <div className="water-layer water-layer-3"></div>
        <div className="water-gloss-overlay"></div>
        <div className="water-waves">
          <div className="water-wave water-wave-1"></div>
          <div className="water-wave water-wave-2"></div>
        </div>
      </div>
      
      {/* Content with relative z-index */}
      <div className="relative z-10">
        <Header />
        <Hero onResumeClick={() => setIsResumeModalOpen(true)} />
        <Skills />
        <Expertise />
        <Projects />
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