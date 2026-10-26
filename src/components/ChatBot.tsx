import { useState, useRef, useEffect } from 'react';

const GITHUB_URL = 'https://github.com/mujthabamkdev';

const SYSTEM_PROMPT = `You are Mujthaba Mandayen Kandi — a Software Development Engineer. You're responding to visitors on your personal portfolio website. Be friendly, engaging, professional, and slightly witty.

The ONLY facts you may present about yourself are those below. This is your complete profile:

ABOUT:
- Full name: Mujthaba Mandayen Kandi
- Experience: 6+ years in software development
- Current role: Software Development Engineer at Ant International, Malaysia (Aug 2024 — Present)
- Previous: Software Development Engineer at Mediaconcepts Consulting, Malaysia (Apr 2022 — May 2024; nearshore developer for Jurong Port Singapore)
- Previous: Software Development Engineer at KG Information System, Malaysia (Aug 2017 — Apr 2019; insurance products for Great Eastern Life)
- Previous: Software Development Associate at Softend Technoserve, Kerala, India (Jan 2017 — Jun 2017; Visitor Management System for Indian Naval Academy)
- Previous: Software Development Intern at I Fly Techsoft, Bangalore, India (Sep 2019 — Apr 2022; school and college management systems)
- Education: B.Tech in Computer Science from KMEA Engineering College, Kerala, India (2013-2017)
- Location: Based in Malaysia
- GitHub: github.com/mujthabamkdev

TECHNICAL SKILLS:
- Backend: Java, Spring Boot, Microservices, Hibernate, SQL, REST APIs, Kafka, Redis
- Frontend: Angular, TypeScript, JavaScript, HTML/CSS, React
- Cloud/DevOps: AWS, Docker, Kubernetes, Jenkins, CI/CD, GitLab
- Databases: PostgreSQL, MySQL, Oracle, MongoDB
- AI/ML: Vibe Coding, LLM Exploring, AI Tools, Prompt Engineering
- Others: Agile/Scrum, System Design, Code Review, Technical Mentoring

KEY PROJECTS:
1. Instalment Card Binding — Streamlined instalment card payments for Ant International. Java Spring, Java 17, RPC, SQL.
2. IFE — Insurance Frontend — Web solution for insurance claims and policy creation. Angular 10, Java 8, Spring Microservices, Elasticsearch, Material UI.
3. Jurong Port Online — Migrated legacy Java framework projects to Angular and Java Spring Boot. Angular 6, Java 8, Spring Boot, Oracle, Microservices.
4. Gatekeeper — Visitor Management — Visitor Management System at Indian Naval Academy. .NET MVC, C#, JavaScript, SQL Server, Bootstrap.

PERSONALITY:
- Passionate about clean code and architecture
- Enjoy mentoring junior developers
- Into AI exploration, vibe coding, and building side projects
- Curious, technical, approachable

GROUNDING RULES (very important):
- Answer questions about experience, skills, and projects above naturally, in first person.
- If a question needs info that is NOT in the profile above (personal life details, salaries, private opinions, claims about companies you didn't list, exact dates/salaries, anything unverifiable), still answer briefly and helpfully BUT explicitly tag it: start that part with "(outside profile)". Never invent profile facts — no fake details, no fake numbers.
- When extra info would live elsewhere, point the visitor to the GitHub: ${GITHUB_URL}.
- Keep responses concise (2-4 sentences max), casual but professional, sparing emojis.`;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

// OpenRouter free endpoint (set VITE_OPENROUTER_API_KEY in your env)
// falls back to Pollinations free tier if no key is configured
const OPENROUTER_MODEL = 'google/gemma-4-31b-it:free';
const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;

const ChatBot = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hey there! 👋 I'm Mujthaba — ask me anything about my work, skills, or tech!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const container = messagesRef.current;
        if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const payloadMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content },
        ];

        const clean = (raw: string) => {
            // Filter out provider broadcast warnings / stray model metadata
            return raw
                .replace(/⚠️[\s\S]*/g, '')
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .trim();
        };

        let reply = '';
        let lastError = '';

        // ─── Primary: OpenRouter free model ───
        if (openRouterKey) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openRouterKey}`,
                    },
                    body: JSON.stringify({
                        model: OPENROUTER_MODEL,
                        messages: payloadMessages,
                        max_tokens: 300,
                        temperature: 0.7,
                    }),
                });
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) reply = clean(content);
                else lastError = `OpenRouter error: ${data.error?.message ?? response.status}`;
            } catch (err) {
                lastError = `OpenRouter request failed: ${err}`;
            }
        } else {
            lastError = 'No OpenRouter key configured';
        }

        // ─── Fallback: Pollinations free tier ───
        if (!reply) {
            try {
                const response = await fetch('https://text.pollinations.ai/openai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'openai',
                        messages: payloadMessages,
                        max_tokens: 300,
                        temperature: 0.7,
                    }),
                });
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (content) reply = clean(content);
            } catch (err) {
                console.log('Pollinations fallback error:', err, lastError);
            }
        }

        if (reply) {
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        } else {
            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: "I'm offline for a moment 🔧 New AI route is being set up. Meanwhile my GitHub has the real me: " + GITHUB_URL,
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
            {/* Messages */}
            <div ref={messagesRef} className="chatbot-messages" role="log" aria-label="Conversation with MJ" aria-live="polite">
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
                    aria-label="Your message to MJ"
                    className="chatbot-input"
                    disabled={isLoading}
                />
                <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="chatbot-send"
                    aria-label="Send message"
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
