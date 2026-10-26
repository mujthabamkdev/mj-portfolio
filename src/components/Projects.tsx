const projects = [
  {
    number: '01',
    title: 'Instalment Card Binding',
    company: 'Ant International',
    description: 'Implemented a solution to streamline instalment card payments and improve user experience. Created architecture, solution analysis, release review, and integration documents. Delivered a user-friendly card binding process reducing repetitive data entry.',
    tech: ['Java Spring', 'Java 17', 'RPC', 'SQL'],
  },
  {
    number: '02',
    title: 'IFE — Insurance Frontend',
    company: 'KG Information System',
    description: 'Web solution for insurance claims, policy creation with dynamic capability to handle different user types and products. Integrated payment system with different authorization levels for agents and public users.',
    tech: ['Angular 10', 'Java 8', 'Spring Microservices', 'Elasticsearch', 'Material UI'],
  },
  {
    number: '03',
    title: 'Jurong Port Online',
    company: 'Mediaconcepts Consulting',
    description: 'Migrated existing legacy Java framework projects to Angular and Java Spring Boot. Implemented data-driven webpages for new features and delivered critical production fixes in short time periods.',
    tech: ['Angular 6', 'Java 8', 'Spring Boot', 'Oracle', 'Microservices'],
  },
  {
    number: '04',
    title: 'Gatekeeper — Visitor Management',
    company: 'Softend Technoserve',
    description: 'Visitor Management System at Indian Naval Academy. Designed features for generating and managing Internal Driving Licenses, Entry Passes, Visitor Logs, and Dependent Passes.',
    tech: ['.NET MVC', 'C#', 'JavaScript', 'SQL Server', 'Bootstrap'],
  },
];

const Projects = () => {
  return (
    <section id="projects" className="py-32 px-6 relative">
      <div className="w-full">
        <div className="w-full">
          {/* Section Header */}
          <div className="mb-16 reveal">
            <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">// PORTFOLIO</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight">
              PROJECTS
            </h2>
          </div>

          {/* Projects List */}
          <div className="space-y-12">
            {projects.map((project, index) => (
              <div
                key={project.number}
                className="group dashed-card rounded-lg p-5 sm:p-8 lg:p-10 reveal"
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                  {/* Number */}
                  <div className="md:col-span-2">
                    <span className="text-5xl lg:text-6xl font-black text-white/20 tracking-tight leading-none select-none group-hover:text-accent/50 transition-colors duration-500">
                      {project.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="md:col-span-10 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="min-w-0">
                        <h3 className="text-xl md:text-2xl font-semibold tracking-tight group-hover:text-accent transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-xs text-muted mt-1">{project.company}</p>
                      </div>
                      <div className="w-8 h-8 border border-white/10 rounded flex items-center justify-center flex-shrink-0 group-hover:border-accent/40 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted group-hover:text-accent transition-colors">
                          <path d="M7 17L17 7M17 7H7M17 7V17" />
                        </svg>
                      </div>
                    </div>

                    <p className="text-sm text-muted leading-relaxed mt-4 mb-6 max-w-2xl">
                      {project.description}
                    </p>

                    <div>
                      <p className="text-[10px] tracking-[0.2em] text-white/50 uppercase mb-3">Tools & Features</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech.map((t) => (
                          <span key={t} className="tech-tag">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
