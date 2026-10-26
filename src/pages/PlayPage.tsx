import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import PenaltyGame from '../components/PenaltyGame';

const PlayPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        const previousTitle = document.title;
        document.title = 'Play — Mujthaba\'s Portfolio';
        return () => {
            document.title = previousTitle;
        };
    }, []);

    return (
        <div className="play-page">
            {/* Header bar */}
            <nav className="play-page-nav" aria-label="Play navigation">
                <Link to="/" className="play-back-link">
                    ← Back to Portfolio
                </Link>
                <span className="play-page-logo">MJ</span>
            </nav>

            {/* Hero label */}
            <main>
                <div className="play-page-hero">
                    <p className="play-page-tag">// INTERACTIVE</p>
                    <h1 className="play-page-title">Play With Me</h1>
                    <p className="play-page-sub">
                        Chat with my AI twin — it knows everything about my career.<br />
                        Or attempt a penalty shot. Good luck. 😏
                    </p>
                </div>

                {/* Game grid */}
                <div className="play-page-grid">
                    {/* Chat */}
                    <section className="play-card" aria-labelledby="chat-title">
                        <h2 id="chat-title" className="play-card-label">
                            <span className="play-card-dot" /> Talk To Me
                        </h2>
                        <ChatBot />
                    </section>

                    {/* Game */}
                    <section className="play-card" aria-labelledby="penalty-title">
                        <h2 id="penalty-title" className="play-card-label">
                            <span>⚽</span> Penalty Shootout
                        </h2>
                        <PenaltyGame />
                    </section>
                </div>
            </main>
        </div>
    );
};

export default PlayPage;
