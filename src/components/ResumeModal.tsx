import { useEffect, useRef, useState } from 'react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResumeModal = ({ isOpen, onClose }: ResumeModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      setUseFallback(false);

      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(loadingTimer);
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        previousFocusRef.current?.focus();
      };
    }

    document.body.style.overflow = 'unset';
    return undefined;
  }, [isOpen, onClose]);

  const pdfPath = '/Resume Mujthaba Resume.pdf';
  const pdfUrl = `${pdfPath}#toolbar=1&navpanes=1&scrollbar=1`;

  const handleOpenInNewTab = () => {
    window.open(pdfPath, '_blank', 'noopener,noreferrer');
  };

  const handleIframeError = () => {
    setUseFallback(true);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ animation: 'fadeIn 0.3s ease-in forwards' }}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-dark-50 border border-white/10 rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] m-4 flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out forwards' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0 z-20">
          <h2 id="resume-modal-title" className="text-sm font-medium tracking-wider uppercase text-white/70">Resume</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Open in new tab"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </button>
            <a
              href={pdfPath}
              download="Resume_Mujthaba.pdf"
              className="p-2 hover:bg-white/5 rounded transition-colors"
              title="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </a>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden relative bg-dark-100 min-h-0 rounded-b-lg">
          {isLoading && !useFallback && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-muted">Loading resume...</p>
              </div>
            </div>
          )}

          {!useFallback && (
            <iframe
              key="pdf-iframe"
              src={pdfUrl}
              className="w-full h-full border-0 absolute inset-0"
              title="Resume PDF"
              style={{ display: isLoading ? 'none' : 'block' }}
              onLoad={() => setIsLoading(false)}
              onError={handleIframeError}
              allow="fullscreen"
            />
          )}

          {useFallback && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <div className="text-center p-8 max-w-md">
                <p className="text-muted mb-6 text-sm">Unable to display PDF in viewer.</p>
                <div className="flex flex-col gap-3 items-center">
                  <button onClick={handleOpenInNewTab} className="btn-accent">
                    Open in New Tab
                  </button>
                  <a href={pdfPath} download="Resume_Mujthaba.pdf" className="text-xs text-muted hover:text-accent transition-colors">
                    Download Resume
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeModal;
