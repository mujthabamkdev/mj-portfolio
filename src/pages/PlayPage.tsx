import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import PenaltyGame from '../components/PenaltyGame';

const PlayPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = 'Play — Mujthaba\'s Portfolio';
    }, []);

    return (
        <div className="play-page">
            {/* Header bar */}
            <nav className="play-page-nav">
                <Link to="/" className="play-back-link">
                    ← Back to Portfolio
                </Link>
                <span className="play-page-logo">MJ</span>
            </nav>

            {/* Hero label */}
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
                <div className="play-card">
                    <div className="play-card-label">
                        <span className="play-card-dot" /> Talk To Me
                    </div>
                    <ChatBot />
                </div>

                {/* Game */}
                <div className="play-card">
                    <div className="play-card-label">
                        <span>⚽</span> Penalty Shootout
                    </div>
                    <PenaltyGame />
                </div>
            </div>
        </div>
    );
};

export default PlayPage;
