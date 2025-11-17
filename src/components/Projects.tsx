import { Github, ExternalLink } from 'lucide-react';

interface Project {
  name: string;
  description: string;
  technologies: string[];
  githubUrl: string;
  liveUrl?: string;
}

const projects: Project[] = [
  {
    name: 'Payment Solutions System',
    description: 'Comprehensive payment solution with card selection, tokenization, and installment card binding features with risk handling and monitoring.',
    technologies: ['Java Spring Boot', 'Angular', 'Microservices', 'Docker'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
  {
    name: 'E-Commerce Platform',
    description: 'Full-stack e-commerce platform with real-time inventory management and secure payment integration.',
    technologies: ['Angular', 'TypeScript', 'Java Spring Boot', 'PostgreSQL'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
  {
    name: 'Microservices Architecture',
    description: 'Distributed system architecture with service discovery, API gateway, and centralized logging.',
    technologies: ['Spring Boot', 'Docker', 'Elasticsearch', 'Kubernetes'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
  {
    name: 'Dashboard Analytics',
    description: 'Real-time analytics dashboard with data visualization and interactive charts for business intelligence.',
    technologies: ['Angular', 'TypeScript', 'RxJS', 'Chart.js'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
  {
    name: 'API Integration Suite',
    description: 'RESTful API development with comprehensive documentation, authentication, and rate limiting.',
    technologies: ['Java Spring Boot', 'Spring Security', 'Swagger', 'JWT'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
  {
    name: 'Responsive Web Application',
    description: 'Modern, responsive web application with mobile-first design and progressive web app capabilities.',
    technologies: ['Angular', 'TypeScript', 'CSS', 'PWA'],
    githubUrl: 'https://github.com/mujthabamkdev',
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-20 px-6 bg-white relative z-10">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-4 fade-in-up">
          <span className="gradient-text">Projects</span>
        </h2>
        <p className="text-center text-slate-600 mb-12 text-base fade-in-up animation-delay-100">
          Showcase of my recent work and contributions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={project.name}
              className="bg-white rounded-lg p-6 shadow-sm card-hover border border-slate-200 flex flex-col group relative overflow-hidden fade-in-up shimmer-subtle"
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <h3 className="text-xl font-semibold mb-3 text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
                {project.name}
              </h3>
              <p className="text-slate-600 mb-4 flex-grow text-sm leading-relaxed">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.technologies.map((tech, techIdx) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white scale-in"
                    style={{ transitionDelay: `${(techIdx + index) * 0.02}s` }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
              
              <div className="flex gap-3">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-md hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 text-sm font-medium ripple"
                >
                  <Github size={16} />
                  GitHub
                </a>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-sm font-medium ripple"
                  >
                    <ExternalLink size={16} />
                    Live
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
