import { X, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResumeModal = ({ isOpen, onClose }: ResumeModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
      setUseFallback(false);
      
      // Auto-hide loading after a delay (reduced for smaller PDF)
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => {
        clearTimeout(loadingTimer);
        document.body.style.overflow = 'unset';
      };
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // PDF path - Vite serves files from public folder at root
  const pdfPath = '/Resume Mujthaba Resume.pdf';
  const pdfUrl = `${pdfPath}#toolbar=1&navpanes=1&scrollbar=1`;

  const handleOpenInNewTab = () => {
    window.open(pdfPath, '_blank', 'noopener,noreferrer');
  };

  const handleIframeError = () => {
    console.log('Iframe failed to load, trying fallback');
    setUseFallback(true);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{ animation: 'fadeIn 0.3s ease-in forwards' }}
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] m-4 flex flex-col z-10"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'scaleIn 0.3s ease-out forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg flex-shrink-0 z-20">
          <h2 className="text-xl font-semibold text-gray-900">My Resume</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink size={20} className="text-gray-600" />
            </button>
            <a
              href={pdfPath}
              download="Resume Mujthaba Resume.pdf"
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Download Resume"
              title="Download Resume"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={20} className="text-gray-600" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Close modal"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden relative bg-gray-50 min-h-0 rounded-b-lg">
            {isLoading && !useFallback && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-30 rounded-b-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading resume...</p>
                </div>
              </div>
            )}
            
            {/* Primary: iframe (most reliable) */}
            {!useFallback && (
              <iframe
                key="pdf-iframe"
                src={pdfUrl}
                className="w-full h-full border-0 absolute inset-0"
                title="Resume PDF"
                style={{ display: isLoading ? 'none' : 'block' }}
                onLoad={() => {
                  console.log('PDF iframe loaded successfully');
                  setIsLoading(false);
                }}
                onError={handleIframeError}
                allow="fullscreen"
              />
            )}
            
            {/* Fallback message if PDF fails to load */}
            {useFallback && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-30 rounded-b-lg">
                <div className="text-center p-8 max-w-md">
                  <p className="text-gray-600 mb-6">Unable to display PDF in viewer. Please use one of the options below:</p>
                  <div className="flex flex-col gap-3 items-center">
                    <button
                      onClick={handleOpenInNewTab}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      <ExternalLink size={18} />
                      Open Resume in New Tab
                    </button>
                    <a
                      href={pdfPath}
                      download="Resume Mujthaba Resume.pdf"
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      <Download size={18} />
                      Download Resume
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ResumeModal;
