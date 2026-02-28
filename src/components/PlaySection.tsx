import PenaltyGame from './PenaltyGame';
import ChatBot from './ChatBot';

const PlaySection = () => {
    return (
        <section id="play" className="py-24 px-6 relative">
            <div className="max-w-6xl mx-auto">
                {/* Section header */}
                <div className="text-center mb-16 reveal">
                    <p className="text-xs tracking-[0.4em] text-accent/60 uppercase font-mono mb-4">
                        ◈ INTERACTIVE ◈
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                        Play With Me
                    </h2>
                    <p className="text-sm text-muted mt-4 max-w-lg mx-auto">
                        Take a penalty shot or chat with my AI — it knows everything about my career.
                    </p>
                </div>

                {/* Two columns: Chat + Game */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Chat */}
                    <div className="reveal" style={{ transitionDelay: '0.1s' }}>
                        <ChatBot />
                    </div>

                    {/* Game */}
                    <div className="reveal" style={{ transitionDelay: '0.2s' }}>
                        <PenaltyGame />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PlaySection;
