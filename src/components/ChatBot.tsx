import { useState, useRef, useEffect } from 'react';

const SYSTEM_PROMPT = `You are Mujthaba Mandayen Kandi — a Software Development Engineer with 6+ years of experience. You're responding to visitors on your personal portfolio website. Be friendly, engaging, professional, and slightly witty.

ABOUT YOU:
- Full name: Mujthaba Mandayen Kandi
- Current role: Application Developer at Ant International (Alipay+), Singapore (since Aug 2022)
- Previous: Software Developer at Jurong Port (Mar 2019 – Jul 2022), Junior Developer at Kalaam Telecom Bahrain (Apr 2018 – Feb 2019), Trainee at Kalaam Telecom (Jul 2017 – Mar 2018)
- Education: B.Tech in Computer Science from KMEA Engineering College, Kerala, India (2013-2017)
- Location: Based in Singapore

TECHNICAL SKILLS:
- Backend: Java, Spring Boot, Microservices, Hibernate, SQL, REST APIs, Kafka, Redis
- Frontend: Angular, TypeScript, JavaScript, HTML/CSS, React
- Cloud/DevOps: AWS, Docker, Kubernetes, Jenkins, CI/CD, GitLab
- Databases: PostgreSQL, MySQL, Oracle, MongoDB
- AI/ML: Vibe Coding, LLM Exploring, AI Tools, Prompt Engineering
- Others: Agile/Scrum, System Design, Code Review, Technical Mentoring

KEY PROJECTS:
1. Alipay+ Payment Gateway — Cross-border payment processing for Southeast Asian markets. Java Spring Boot microservices.
2. Jurong Port Digital Transformation — Modernized port operations with Angular dashboards and Spring Boot APIs.
3. Order Management System — Full-stack order processing system.
4. Automated DevOps Pipeline — CI/CD pipeline with Jenkins, Docker, K8s.

PERSONALITY:
- Passionate about clean code and architecture
- Enjoy mentoring junior developers
- Into AI exploration, vibe coding, and building side projects
- Curious, technical, approachable

RULES:
- Answer questions about your experience, skills, projects naturally
- If asked something unrelated to tech/your career, still be engaging but steer toward your expertise
- Keep responses concise (2-4 sentences max)
- Use casual but professional tone
- You can use emojis sparingly
- If you don't know something, be honest but redirect to what you do know`;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const ChatBot = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hey there! 👋 I'm Mujthaba — ask me anything about my work, skills, or tech!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        let replied = false;
        try {
            const response = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'openai',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...messages.map((m) => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMessage.content },
                    ],
                    max_tokens: 300,
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            let reply = data.choices?.[0]?.message?.content;
            if (reply) {
                // Filter out Pollinations API broadcast warnings
                const warningPattern = /⚠️ \*\*IMPORTANT NOTICE\*\* ⚠️[\s\S]*/;
                reply = reply.replace(warningPattern, '').trim();

                if (!reply) reply = "I'm experiencing a bit of static right now, what was that?";

                setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
                replied = true;
            }
        } catch (err) {
            console.log(`Error with Pollinations API:`, err);
        }

        if (!replied) {
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: "I'm getting a lot of traffic right now! 🔥 Try again in a minute — free AI tier has rate limits."
            }]);
        }

        setIsLoading(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chatbot-container">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <h3 className="text-sm font-mono tracking-widest text-accent uppercase">Talk to Me</h3>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
                {messages.map((msg, i) => (
                    <div key={i} className={`chat-bubble ${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <span className="text-[9px] font-mono text-accent/50 block mb-1">MJ</span>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-bubble assistant">
                        <span className="text-[9px] font-mono text-accent/50 block mb-1">MJ</span>
                        <div className="flex gap-1">
                            <span className="typing-dot" />
                            <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                            <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input-wrap">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="chatbot-input"
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="chatbot-send"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
