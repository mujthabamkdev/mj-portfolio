import { useNavigate } from 'react-router-dom';

const PlaySection = () => {
    const navigate = useNavigate();

    return (
        <section id="play" className="section-padding relative">
            <div className="max-w-7xl mx-auto">
                {/* Content stays LEFT — character will be on RIGHT */}
                <div className="w-full md:w-[48%]">
                    <p className="section-tag reveal">// INTERACTIVE</p>

                    <h2 className="text-4xl md:text-5xl font-bold mb-6 reveal">
                        Play With Me
                    </h2>

                    <p className="text-muted text-base leading-relaxed mb-10 reveal max-w-md">
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
