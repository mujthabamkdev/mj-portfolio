const experiences = [
    {
        period: 'Aug 2024 — Present',
        year: '2024',
        role: 'Software Development Engineer',
        company: 'Ant International',
        location: 'Malaysia',
        description: 'Designing software architecture, delivering payment solutions for card selection, tokenization, and instalment card binding. Mentoring team members and working with cross-functional teams across different regions.',
        tech: ['Java 17', 'Spring Microservices', 'RPC', 'SQL'],
    },
    {
        period: 'Apr 2022 — May 2024',
        year: '2022',
        role: 'Software Development Engineer',
        company: 'Mediaconcepts Consulting',
        location: 'Malaysia',
        subtitle: 'Jurong Port Singapore',
        description: 'Nearshore developer for Jurong Port, a leading international port operator. Migrated legacy Java projects to Angular and Spring Boot. Delivered critical production fixes and mentored junior team members.',
        tech: ['Angular 6', 'Java 8', 'Spring Boot', 'Microservices', 'Oracle'],
    },
    {
        period: 'Aug 2017 — Apr 2019',
        year: '2017',
        role: 'Software Development Engineer',
        company: 'KG Information System',
        location: 'Malaysia',
        subtitle: 'Great Eastern Life',
        description: 'Spearheaded high-volume insurance product development resulting in over $10 million sales. Engineered an online payment recovery system using Spring Batch and MQ, eliminating manual recovery efforts.',
        tech: ['Angular 12', 'Java 8', 'Spring Microservices', 'Elasticsearch', 'Material UI'],
    },
    {
        period: 'Jan 2017 — Jun 2017',
        year: '2017',
        role: 'Software Development Associate',
        company: 'Softend Technoserve',
        location: 'Kerala, India',
        subtitle: 'Indian Naval Academy',
        description: 'Developed Visitor Management System for the Indian Naval Academy. Designed features for generating and managing Internal Driving Licenses, Entry Passes, and Visitor Logs.',
        tech: ['.NET MVC', 'C#', 'JavaScript', 'SQL Server', 'Bootstrap'],
    },
    {
        period: 'Sep 2019 — Apr 2022',
        year: '2019',
        role: 'Software Development Intern',
        company: 'I Fly Techsoft',
        location: 'Bangalore, India',
        description: 'Self-learned .NET framework and contributed to school and college management systems. Participated in both front-end and back-end development tasks for government-backed systems.',
        tech: ['.NET MVC', 'C#', 'JavaScript', 'jQuery', 'SQL Server'],
    },
];

const Experience = () => {
    return (
        <section id="work" className="py-32 px-6 relative">
            <div className="w-full">
                {/* Section Header */}
                <div className="mb-16 reveal">
                    <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">// EXPERIENCE</p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight">
                        WORK
                    </h2>
                </div>

                {/* Timeline */}
                <div className="space-y-0">
                    {experiences.map((exp, index) => (
                        <div
                            key={`${exp.company}-${exp.period}`}
                            className="group border-b border-white/5 last:border-b-0 reveal"
                            style={{ transitionDelay: `${index * 0.1}s` }}
                        >
                            <div className="py-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                                {/* Left: Role & Company */}
                                <div className="md:col-span-7">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                                        <h3 className="text-lg md:text-xl font-semibold tracking-tight group-hover:text-accent transition-colors duration-300">
                                            {exp.role}
                                        </h3>
                                        {index === 0 && (
                                            <span className="shrink-0 px-2 py-0.5 text-[10px] tracking-wider uppercase bg-accent/10 text-accent border border-accent/20 rounded-sm">
                                                Current
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted mb-1">
                                        {exp.company}
                                        {exp.subtitle && <span className="text-white/50"> — {exp.subtitle}</span>}
                                    </p>
                                    <p className="text-xs text-white/50 mb-4">
                                        {exp.location} · {exp.period}
                                    </p>
                                    <p className="text-sm text-muted leading-relaxed mb-4">
                                        {exp.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {exp.tech.map((t) => (
                                            <span key={t} className="tech-tag">{t}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Large Year */}
                                <div className="md:col-span-5 flex md:justify-end items-start">
                                    <span className="text-6xl md:text-7xl lg:text-8xl font-black text-white/20 tracking-tight leading-none select-none group-hover:text-white/40 transition-colors duration-500">
                                        {exp.year}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Experience;
