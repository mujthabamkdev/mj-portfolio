import { Code2, Layers, Palette, Database, Box } from 'lucide-react';

const skills = [
  {
    name: 'Java Spring Boot',
    icon: Box,
    description: 'Backend development with Spring Boot framework',
    color: 'from-green-500 to-green-700',
  },
  {
    name: 'Angular',
    icon: Layers,
    description: 'Enterprise-level frontend applications',
    color: 'from-red-500 to-red-700',
  },
  {
    name: 'TypeScript',
    icon: Code2,
    description: 'Type-safe JavaScript development',
    color: 'from-blue-500 to-blue-700',
  },
  {
    name: 'JavaScript',
    icon: Code2,
    description: 'Modern ES6+ JavaScript development',
    color: 'from-yellow-500 to-yellow-700',
  },
  {
    name: 'CSS',
    icon: Palette,
    description: 'Modern styling and responsive design',
    color: 'from-purple-500 to-purple-700',
  },
  {
    name: 'Microservices',
    icon: Database,
    description: 'Distributed system architecture',
    color: 'from-indigo-500 to-indigo-700',
  },
];

const Skills = () => {
  return (
    <section id="skills" className="py-20 px-6 bg-white relative z-10">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-center mb-4 text-slate-900 fade-in-up">
          <span className="gradient-text">Skills</span>
        </h2>
        <p className="text-center text-slate-600 mb-12 text-base fade-in-up animation-delay-100">
          Technologies and tools I work with
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => {
            const Icon = skill.icon;
            return (
              <div
                key={skill.name}
                className="bg-white rounded-lg p-6 shadow-sm card-hover border border-slate-200 group relative overflow-hidden fade-in-up shimmer-subtle"
                style={{ transitionDelay: `${index * 0.05}s` }}
              >
                <div
                  className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 float-slow transition-transform duration-500 group-hover:scale-110 group-hover:from-blue-600 group-hover:to-cyan-600"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900 transition-colors duration-300 group-hover:text-blue-600">
                  {skill.name}
                </h3>
                <p className="text-slate-600 text-sm">{skill.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Skills;
