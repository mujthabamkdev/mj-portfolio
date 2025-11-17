import { CheckCircle } from 'lucide-react';

const expertiseAreas = [
  {
    title: 'Angular Expertise',
    technologies: ['Angular 2+', 'RxJS', 'Angular Material', 'Angular CLI', 'State Management'],
    achievements: [
      'Built enterprise-level SPA applications',
      'Implemented reactive programming patterns',
      'Optimized performance and bundle sizes',
      'Developed reusable component libraries',
    ],
    icon: '🎯',
    color: 'from-red-400 to-red-600',
  },
  {
    title: 'JavaScript & TypeScript',
    technologies: ['ES6+', 'TypeScript', 'Node.js', 'DOM Manipulation', 'Async Programming'],
    achievements: [
      'Developed type-safe applications',
      'Implemented modern JavaScript patterns',
      'Built interactive user interfaces',
      'Optimized code for performance',
    ],
    icon: '⚡',
    color: 'from-yellow-400 to-yellow-600',
  },
  {
    title: 'Java Spring Boot',
    technologies: ['Spring Boot', 'Spring Security', 'REST APIs', 'Microservices', 'JPA/Hibernate'],
    achievements: [
      'Designed and developed RESTful APIs',
      'Implemented microservices architecture',
      'Integrated payment solutions and tokenization',
      'Built scalable backend systems',
    ],
    icon: '☕',
    color: 'from-green-400 to-green-600',
  },
];

const Expertise = () => {
  return (
    <section id="expertise" className="py-20 px-6 bg-slate-50 relative z-10">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-4 fade-in-up">
          <span className="gradient-text">Expertise</span>
        </h2>
        <p className="text-center text-slate-600 mb-12 text-base fade-in-up animation-delay-100">
          Deep dive into my core competencies
        </p>
        <div className="space-y-8">
          {expertiseAreas.map((area, index) => (
            <div
              key={area.title}
              className="bg-white rounded-lg p-8 shadow-sm card-hover border border-slate-200 group relative overflow-hidden fade-in-up"
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl float-slow" style={{ animationDelay: `${index * 0.2}s` }}>
                  {area.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                    {area.title}
                  </h3>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 group-hover:w-24" />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="fade-in-left" style={{ transitionDelay: `${index * 0.15 + 0.2}s` }}>
                  <h4 className="text-lg font-medium mb-4 text-slate-700">
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {area.technologies.map((tech, techIdx) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-sm font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white scale-in"
                        style={{ transitionDelay: `${(techIdx + index) * 0.03}s` }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="fade-in-right" style={{ transitionDelay: `${index * 0.15 + 0.3}s` }}>
                  <h4 className="text-lg font-medium mb-4 text-slate-700">
                    Key Achievements
                  </h4>
                  <ul className="space-y-3">
                    {area.achievements.map((achievement, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-3 text-slate-600 group/item transition-colors duration-300"
                      >
                        <CheckCircle 
                          className="text-blue-500 flex-shrink-0 mt-0.5 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:text-cyan-500" 
                          size={18} 
                        />
                        <span className="transition-transform duration-300 group-hover/item:translate-x-1">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Expertise;
