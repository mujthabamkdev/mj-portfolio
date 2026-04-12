    const aboutCards = [
    {
        title: 'Full-Stack Developer',
        description: 'Building enterprise-grade applications with Java Spring Boot, Angular, and TypeScript. Experienced in end-to-end development from architecture to deployment.',
        tags: ['Java Spring Boot', 'Angular', 'TypeScript', 'REST APIs'],
    },
    {
        title: 'AI Explorer',
        description: 'Exploring the cutting edge of AI-powered development. Leveraging LLMs, vibe coding, and AI tools to enhance productivity and build intelligent solutions.',
        tags: ['Vibe Coding', 'LLM Exploring', 'AI Tools', 'Prompt Engineering'],
    },
    {
        title: 'Backend Architect',
        description: 'Designing scalable microservices architectures with robust data pipelines, containerization, and high-availability systems.',
        tags: ['Microservices', 'Docker', 'Elasticsearch', 'Spring Security'],
    },
];

const About = () => {
    return (
        <section id="about" className="py-32 px-6 relative">
            {/* Content pushed to the right half — character sits on the left */}
            <div className="max-w-7xl mx-auto flex justify-end">
                <div className="w-full md:w-[58%]">
                    {/* Section Header */}
                    <div className="mb-16 reveal">
                        <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">// ABOUT</p>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight">
                            WHAT I DO
                        </h2>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {aboutCards.map((card, index) => (
                            <div
                                key={card.title}
                                className="dashed-card bracket-card rounded-lg p-8 reveal"
                                style={{ transitionDelay: `${index * 0.15}s` }}
                            >
                                {/* Card icon */}
                                <div className="w-10 h-10 border border-white/10 rounded flex items-center justify-center mb-6">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b4a0e5" strokeWidth="2">
                                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                                    </svg>
                                </div>

                                <h3 className="text-xl font-semibold mb-3 tracking-tight">
                                    {card.title}
                                </h3>

                                <p className="text-sm text-muted leading-relaxed mb-6">
                                    {card.description}
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    {card.tags.map((tag) => (
                                        <span key={tag} className="tech-tag">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
