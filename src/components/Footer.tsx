import { Heart, Coffee } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-6 relative z-10">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <p className="text-gray-300">
              Made with <Heart className="inline text-red-500" size={18} /> by Mujthaba
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Support my work:</span>
            <a
              href="https://buymeacoffee.com/mujthabamk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-md font-medium transition-all duration-300 ripple shadow-lg"
            >
              <Coffee size={18} />
              <span>Buy Me a Coffee</span>
            </a>
          </div>
          
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Mujthaba Mandayen Kandi. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
