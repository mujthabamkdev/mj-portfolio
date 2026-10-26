import { useNavigate } from 'react-router-dom';

const PlaySection = () => {
    const navigate = useNavigate();

    return (
        <section id="play" className="py-32 px-6 relative">
            <div className="w-full">
                <div className="w-full">
                    <p className="text-xs tracking-[0.3em] text-accent uppercase mb-3 reveal">// INTERACTIVE</p>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight mb-6 reveal">
                        Play With Me
                    </h2>

                    <p className="text-muted text-base leading-relaxed mb-10 reveal">
                        Challenge me to a <span className="accent-text font-semibold">penalty shootout</span>, or chat with my <span className="accent-text font-semibold">AI twin</span> that knows my career inside-out.
                    </p>

                    <button
                        onClick={() => navigate('/play')}
                        className="btn-accent reveal"
                    >
                        <span>PLAY WITH ME</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PlaySection;
