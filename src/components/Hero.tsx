import { FileText, Mail } from 'lucide-react';

interface HeroProps {
  onResumeClick: () => void;
}

const Hero = ({ onResumeClick }: HeroProps) => {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 px-6 bg-transparent relative overflow-hidden">
      {/* Animated background elements with better colors */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl float-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl float-slow animation-delay-500"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl float-medium animation-delay-300"></div>
      </div>

      <div className="container mx-auto text-center fade-in-up relative z-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-900">
          <span className="gradient-text inline-block float-slow">
            Mujthaba
          </span>
        </h1>
        <h2 className="text-2xl md:text-4xl font-medium text-slate-600 mb-6 float-medium">
          Software Development Engineer
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 fade-in-up animation-delay-200">
          6+ Years of Software Development Experience | Specializing in Java Spring Boot, 
          Angular, TypeScript, and JavaScript
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in-up animation-delay-400">
          <button
            onClick={onResumeClick}
            className="btn-primary flex items-center gap-2 ripple"
          >
            <FileText size={20} />
            <span className="relative z-10">Resume</span>
          </button>
          <a
            href="mailto:mujthabamkdev@gmail.com?subject=Let's Work Together"
            className="btn-secondary flex items-center gap-2 ripple"
          >
            <Mail size={20} />
            <span className="relative z-10">Hire Me</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
