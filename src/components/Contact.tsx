const socialLinks = [
    {
        label: 'Github',
        href: 'https://github.com/mujthabamkdev',
    },
    {
        label: 'LinkedIn',
        href: 'https://linkedin.com/in/mujthabamk',
    },
    {
        label: 'Telegram',
        href: 'https://t.me/mujthabamk',
    },
    {
        label: 'Email',
        href: 'mailto:mujthabamkdev@gmail.com',
    },
];

const Contact = () => {
    return (
        <section id="contact" className="py-32 px-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Section Header */}
                <div className="mb-16 reveal">
                    <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3">// CONNECT</p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight">
                        GET IN TOUCH
                    </h2>
                    <p className="text-muted text-sm mt-4 max-w-lg leading-relaxed">
                        I'm always open to discussing new opportunities, interesting projects,
                        or just having a conversation about tech.
                    </p>
                </div>

                {/* Social Links */}
                <div className="max-w-2xl">
                    {socialLinks.map((link, index) => (
                        <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith('mailto') ? undefined : '_blank'}
                            rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                            className="social-link reveal"
                            style={{ transitionDelay: `${index * 0.1}s` }}
                        >
                            <span className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight uppercase">
                                {link.label}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="arrow-icon"
                            >
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                            </svg>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Contact;
