import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Scroll-reveal hook ──
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = '', direction = 'up' }: { children: React.ReactNode; delay?: number; className?: string; direction?: 'up' | 'left' | 'right' | 'scale' }) {
  const { ref, visible } = useInView();
  const transforms: Record<string, string> = { up: 'translateY(32px)', left: 'translateX(-32px)', right: 'translateX(32px)', scale: 'scale(0.95)' };
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : transforms[direction], transition: `opacity 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// ── Animated counter ──
function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { ref, visible } = useInView();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1800;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      start = Math.round(ease * value);
      setCount(start);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, value]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── 3D tilt card ──
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -8;
    el.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) scale(1.02)`;
  }, []);
  const handleLeave = useCallback(() => {
    const el = cardRef.current;
    if (el) el.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)';
  }, []);
  return (
    <div ref={cardRef} onMouseMove={handleMove} onMouseLeave={handleLeave}
      className={className} style={{ transition: 'transform 0.2s ease-out', willChange: 'transform' }}>
      {children}
    </div>
  );
}

// ── Live typing chat ──
const CHAT_MESSAGES = [
  { name: 'Ayesha', color: 'bg-indigo-200 text-indigo-700', msg: 'Just pushed the model update to the repo' },
  { name: 'Rahul', color: 'bg-violet-200 text-violet-700', msg: 'Nice! I\'ll run the benchmarks tonight' },
  { name: 'Sara', color: 'bg-emerald-200 text-emerald-700', msg: 'Can we discuss the dataset split in tomorrow\'s sync?' },
  { name: 'Ayesha', color: 'bg-indigo-200 text-indigo-700', msg: 'Sure — I\'ll create a board task for it' },
];

function LiveChat() {
  const [messages, setMessages] = useState<typeof CHAT_MESSAGES>([]);
  const [typing, setTyping] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const { ref, visible } = useInView(0.3);

  useEffect(() => {
    if (!visible || currentIdx >= CHAT_MESSAGES.length) return;
    const msg = CHAT_MESSAGES[currentIdx];
    let charIdx = 0;
    setTyping('');

    const typeTimer = setInterval(() => {
      charIdx++;
      setTyping(msg.msg.slice(0, charIdx));
      if (charIdx >= msg.msg.length) {
        clearInterval(typeTimer);
        setTimeout(() => {
          setMessages(prev => [...prev, msg]);
          setTyping('');
          setCurrentIdx(i => i + 1);
        }, 400);
      }
    }, 35);
    return () => clearInterval(typeTimer);
  }, [visible, currentIdx]);

  const typingUser = currentIdx < CHAT_MESSAGES.length ? CHAT_MESSAGES[currentIdx] : null;

  return (
    <div ref={ref} className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg shadow-gray-100">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-semibold text-gray-800">Climate AI Research</span>
        <span className="text-xs text-gray-400 ml-auto">3 online</span>
      </div>
      <div className="p-4 space-y-3 min-h-[200px]">
        {messages.map((m, i) => (
          <div key={i} className="flex items-start gap-2.5 animate-[fadeSlideIn_0.3s_ease-out]">
            <div className={`w-7 h-7 rounded-full ${m.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{m.name[0]}</div>
            <div>
              <span className="text-xs font-semibold text-gray-700">{m.name}</span>
              <p className="text-sm text-gray-600 mt-0.5">{m.msg}</p>
            </div>
          </div>
        ))}
        {typing && typingUser && (
          <div className="flex items-start gap-2.5">
            <div className={`w-7 h-7 rounded-full ${typingUser.color} flex items-center justify-center text-[10px] font-bold flex-shrink-0`}>{typingUser.name[0]}</div>
            <div>
              <span className="text-xs font-semibold text-gray-700">{typingUser.name}</span>
              <p className="text-sm text-gray-600 mt-0.5">{typing}<span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" /></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Data ──
const FEATURES = [
  { icon: 'fa-layer-group', title: 'Projects & Discovery', desc: 'Post projects, browse by tags, and request to join teams with a clear approval flow.', color: 'bg-indigo-100 text-indigo-600' },
  { icon: 'fa-comments', title: 'Rooms & Chat', desc: 'Project rooms with real-time messaging so your group stays aligned without extra tools.', color: 'bg-violet-100 text-violet-600', regular: true },
  { icon: 'fa-table-columns', title: 'Kanban Boards', desc: 'Move tasks across columns and keep delivery visible to the whole team.', color: 'bg-sky-100 text-sky-600' },
  { icon: 'fa-flask', title: 'Research Papers', desc: 'Share papers, discover work from other institutions, and build on collective knowledge.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: 'fa-calendar', title: 'Campus Events', desc: 'Browse listings or manage your own from a dedicated institution panel.', color: 'bg-amber-100 text-amber-600', regular: true },
  { icon: 'fa-graduation-cap', title: 'University Pages', desc: 'Verified college profiles make it easy to find and connect with any campus.', color: 'bg-rose-100 text-rose-600' },
  { icon: 'fa-robot', title: 'AI Assistant', desc: 'Summarize threads, brainstorm ideas, and extract tasks from conversations.', color: 'bg-fuchsia-100 text-fuchsia-600' },
  { icon: 'fa-bell', title: 'Smart Notifications', desc: 'Stay on top of join requests, comments, mentions, and project activity.', color: 'bg-teal-100 text-teal-600' },
  { icon: 'fa-shield-halved', title: 'Trust & Badges', desc: 'Earn points, endorsements, and badges that build your academic reputation.', color: 'bg-orange-100 text-orange-600' },
];

const AUDIENCES = [
  { icon: 'fa-user-graduate', label: 'Students', headline: 'Find your next team', points: ['Join cross-campus projects that match your skills', 'Build a portfolio of real collaborative work', 'Connect with peers beyond your own university'], cta: 'Create student account', link: '/register' },
  { icon: 'fa-microscope', label: 'Researchers', headline: 'Amplify your work', points: ['Publish and discover research papers', 'Find co-authors across institutions', 'Get AI-powered summaries and insights'], cta: 'Start sharing research', link: '/register' },
  { icon: 'fa-building-columns', label: 'Institutions', headline: 'Engage your campus', points: ['Publish events to verified student audiences', 'Manage your college profile and branding', 'Dashboard with analytics on engagement'], cta: 'Register your institution', link: '/register/institution' },
];

const FAQS = [
  { q: 'Is EnterCollab free?', a: 'Yes, completely. There are no paid tiers, no trial periods, and no feature gates. Everything is available to all users.' },
  { q: 'Do I need a university email?', a: 'No. Any valid email works for student accounts. Institution accounts benefit from using an official domain for credibility, but it\'s not required.' },
  { q: 'Can I use it for non-academic projects?', a: 'Absolutely. While the platform is designed for academic collaboration, any project that benefits from team discovery and coordination is a great fit.' },
  { q: 'How does the AI assistant work?', a: 'The AI can summarize long chat threads, help brainstorm ideas, and extract actionable tasks from conversations. It uses OpenAI under the hood.' },
  { q: 'Is my data private?', a: 'Projects can be set to public or private. Private projects and chats are only visible to approved team members. We don\'t sell data or show ads.' },
];

// ── Main page ──
export default function Welcome() {
  const { user } = useAuth();
  const [activeAudience, setActiveAudience] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased" onMouseMove={handleMouseMove}>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
        @keyframes float { 0%,100% { transform:translateY(0) rotate(0deg) } 50% { transform:translateY(-20px) rotate(3deg) } }
        @keyframes float2 { 0%,100% { transform:translateY(0) rotate(0deg) } 50% { transform:translateY(-14px) rotate(-2deg) } }
        @keyframes gradientShift { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
        @keyframes morphBlob { 0%,100% { border-radius:60% 40% 30% 70%/60% 30% 70% 40% } 50% { border-radius:30% 60% 70% 40%/50% 60% 30% 60% } }
        .animate-float { animation: float 6s ease-in-out infinite }
        .animate-float2 { animation: float2 5s ease-in-out infinite }
        .animate-blob { animation: morphBlob 8s ease-in-out infinite }
        .gradient-text { background-size:200% 200%; animation: gradientShift 4s ease infinite }
        .step-line { position:relative }
        .step-line::after { content:''; position:absolute; top:28px; left:100%; width:100%; height:2px; background:linear-gradient(90deg,#818cf8,transparent); display:none }
        @media(min-width:768px) { .step-line:not(:last-child)::after { display:block } }
      `}</style>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-gray-900 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center p-1 group-hover:border-indigo-300 transition-colors">
              <span className="text-indigo-600 font-bold">EC</span>
            </div>
            EnterCollab
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            <a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="hidden md:inline-flex py-2 px-3 text-gray-500 hover:text-gray-900 font-medium transition-colors">Features</a>
            <a href="#for-you" onClick={(e) => smoothScroll(e, 'for-you')} className="hidden md:inline-flex py-2 px-3 text-gray-500 hover:text-gray-900 font-medium transition-colors">For you</a>
            <a href="#faq" onClick={(e) => smoothScroll(e, 'faq')} className="hidden md:inline-flex py-2 px-3 text-gray-500 hover:text-gray-900 font-medium transition-colors">FAQ</a>
            {user ? (
              <Link to="/dashboard" className="btn-primary py-2 px-4 text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex py-2 px-3 text-gray-600 hover:text-gray-900 font-medium transition-colors">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm hover:shadow-lg hover:shadow-indigo-200 transition-shadow">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/60" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-200/30 animate-blob blur-3xl" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-violet-200/25 animate-blob blur-3xl" style={{ animationDelay: '-4s' }} />

        {/* Floating shapes */}
        <div className="absolute top-24 left-[10%] w-12 h-12 rounded-xl bg-indigo-200/40 border border-indigo-200/50 animate-float hidden lg:flex items-center justify-center">
          <i className="fa-solid fa-code text-indigo-400 text-sm" />
        </div>
        <div className="absolute top-40 right-[12%] w-10 h-10 rounded-lg bg-violet-200/40 border border-violet-200/50 animate-float2 hidden lg:flex items-center justify-center">
          <i className="fa-solid fa-flask text-violet-400 text-xs" />
        </div>
        <div className="absolute bottom-28 left-[20%] w-11 h-11 rounded-full bg-emerald-200/40 border border-emerald-200/50 animate-float hidden lg:flex items-center justify-center" style={{ animationDelay: '-2s' }}>
          <i className="fa-solid fa-graduation-cap text-emerald-400 text-xs" />
        </div>
        <div className="absolute bottom-32 right-[18%] w-10 h-10 rounded-xl bg-amber-200/40 border border-amber-200/50 animate-float2 hidden lg:flex items-center justify-center" style={{ animationDelay: '-3s' }}>
          <i className="fa-solid fa-lightbulb text-amber-400 text-xs" />
        </div>

        {/* Mouse-following glow */}
        <div className="absolute pointer-events-none w-[500px] h-[500px] rounded-full opacity-20 blur-[100px] bg-indigo-300 transition-all duration-[2000ms] ease-out"
          style={{ left: mousePos.x - 250, top: mousePos.y - 250 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700 mb-6 hover:bg-indigo-100 transition-colors cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Open platform for academic collaboration
              </div>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Linking campuses through
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent gradient-text"> hands-on</span>, high-impact work.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                List projects, find teammates, run boards and chat in one place. Organizations can publish events and reach verified campus audiences.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                {user ? (
                  <Link to="/dashboard" className="btn-primary inline-flex justify-center py-3.5 px-8 text-base font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:-translate-y-0.5">Go to dashboard</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary inline-flex justify-center py-3.5 px-8 text-base font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all hover:-translate-y-0.5">
                      Create free account
                      <i className="fa-solid fa-arrow-right ml-2 text-sm mt-0.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/register/institution" className="btn-secondary inline-flex justify-center py-3.5 px-8 text-base font-semibold border-gray-300 hover:border-indigo-300 hover:-translate-y-0.5 transition-all">
                      <i className="fa-solid fa-building-columns mr-2 text-sm mt-0.5 text-gray-400" />
                      Register institution
                    </Link>
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: 100, suffix: '%', label: 'Free — no hidden costs' },
              { value: 9, suffix: '+', label: 'Built-in tools' },
              { value: 0, suffix: '', label: 'Ads or data selling', displayText: 'Zero' },
              { value: 24, suffix: '/7', label: 'Real-time collaboration' },
            ].map((s) => (
              <Reveal key={s.label} direction="scale">
                <div className="text-center group cursor-default">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {s.displayText || <Counter value={s.value} suffix={s.suffix} />}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">Features</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Everything your team needs</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">One calm workspace — no clutter, no context-switching, no extra tools.</p>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <TiltCard className="rounded-xl border border-gray-200 bg-white p-6 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/80 transition-all duration-300 cursor-default h-full">
                  <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <i className={`${f.regular ? 'fa-regular' : 'fa-solid'} ${f.icon} text-lg`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo ── */}
      <section className="py-20 sm:py-28 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">Real-time</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Conversations that flow</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">Every project gets its own chat room. Messages appear instantly — no refreshing, no waiting. Mention teammates, share files, and keep everything in context.</p>
                <div className="flex flex-wrap gap-3">
                  {['Instant delivery', 'Typing indicators', 'Project-scoped rooms', 'AI summaries'].map((t) => (
                    <span key={t} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-default">{t}</span>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right">
              <LiveChat />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Who is it for? ── */}
      <section id="for-you" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">Built for you</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Whoever you are in academia</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">Students, researchers, and institutions each get purpose-built tools.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex justify-center gap-2 mb-10">
              {AUDIENCES.map((a, i) => (
                <button key={a.label} onClick={() => setActiveAudience(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeAudience === i
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  <i className={`fa-solid ${a.icon} text-xs`} />
                  {a.label}
                </button>
              ))}
            </div>
          </Reveal>

          <div className="max-w-2xl mx-auto">
            <div key={activeAudience} className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 shadow-sm" style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{AUDIENCES[activeAudience].headline}</h3>
              <ul className="space-y-4 mb-8">
                {AUDIENCES[activeAudience].points.map((p, i) => (
                  <li key={i} className="flex items-start gap-3" style={{ animation: `fadeSlideIn 0.4s ease-out ${i * 100 + 100}ms both` }}>
                    <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-check text-[10px]" />
                    </span>
                    <span className="text-gray-700">{p}</span>
                  </li>
                ))}
              </ul>
              <Link to={AUDIENCES[activeAudience].link}
                className="btn-primary inline-flex items-center gap-2 py-3 px-6 font-semibold hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all">
                {AUDIENCES[activeAudience].cta}
                <i className="fa-solid fa-arrow-right text-sm" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 sm:py-28 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">Getting started</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Up and running in minutes</h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { n: 1, icon: 'fa-envelope-circle-check', title: 'Verify your email', desc: 'Sign up with any email. We\'ll send a quick 6-digit code to confirm it\'s you.' },
              { n: 2, icon: 'fa-compass', title: 'Explore & connect', desc: 'Browse projects, events, and research. Request to join teams or start your own.' },
              { n: 3, icon: 'fa-rocket', title: 'Build together', desc: 'Use chat, boards, and AI tools to collaborate and ship — all in one place.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 150}>
                <div className="relative text-center step-line group cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-300 transition-all duration-300">
                    <i className={`fa-solid ${s.icon} text-xl`} />
                  </div>
                  <div className="absolute -top-1 left-1/2 ml-6 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center border-2 border-white">
                    {s.n}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why EnterCollab ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal direction="left">
              <div>
                <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">Why EnterCollab</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Built different on purpose</h2>
                <div className="space-y-5">
                  {[
                    { icon: 'fa-lock-open', title: 'Free & open', desc: 'No premium tiers, no feature limits. Every student and institution gets full access.', color: 'bg-indigo-50 text-indigo-600' },
                    { icon: 'fa-bolt', title: 'Real-time first', desc: 'Socket-powered messaging and notifications so nothing feels stale or slow.', color: 'bg-amber-50 text-amber-600' },
                    { icon: 'fa-puzzle-piece', title: 'All-in-one', desc: 'Projects, chat, boards, events, research, and AI — no tab juggling.', color: 'bg-violet-50 text-violet-600' },
                    { icon: 'fa-user-shield', title: 'Privacy-respecting', desc: 'No ads, no tracking, no selling data. Private projects stay private.', color: 'bg-emerald-50 text-emerald-600' },
                  ].map((item, i) => (
                    <div key={item.title} className="flex gap-4 group cursor-default hover:translate-x-1 transition-transform" style={{ animation: `fadeSlideIn 0.5s ease-out ${i * 100}ms both` }}>
                      <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                        <i className={`fa-solid ${item.icon}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal direction="right">
              <div className="hidden md:block">
                <div className="relative rounded-2xl border border-gray-200 bg-gray-50 p-6 space-y-4 hover:shadow-xl hover:shadow-gray-100 transition-shadow duration-500">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                    <div className="w-3 h-3 rounded-full bg-green-300" />
                    <span className="text-xs text-gray-400 ml-2">entercollab.com/projects/climate-ai</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">CA</div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Climate AI Research</div>
                        <div className="text-xs text-gray-400">3 members &middot; 12 tasks</div>
                      </div>
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { col: 'To Do', border: 'border-gray-200', head: 'text-gray-400', bg: 'bg-gray-50 text-gray-700', items: ['Literature review', 'Dataset cleanup'] },
                        { col: 'In Progress', border: 'border-indigo-200', head: 'text-indigo-500', bg: 'bg-indigo-50 text-indigo-700', items: ['Train model v2'] },
                        { col: 'Done', border: 'border-green-200', head: 'text-green-500', bg: 'bg-green-50 text-green-700', items: ['Proposal draft', 'IRB approval'] },
                      ].map((c) => (
                        <div key={c.col} className={`rounded-lg bg-white border ${c.border} p-2.5`}>
                          <div className={`text-[10px] font-semibold ${c.head} uppercase mb-2`}>{c.col}</div>
                          <div className="space-y-1.5">
                            {c.items.map((t) => <div key={t} className={`text-xs ${c.bg} rounded px-2 py-1.5`}>{t}</div>)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="flex -space-x-1.5">
                        {[{ c: 'bg-indigo-200 text-indigo-700', l: 'A' }, { c: 'bg-violet-200 text-violet-700', l: 'R' }, { c: 'bg-emerald-200 text-emerald-700', l: 'S' }].map((u) => (
                          <div key={u.l} className={`w-6 h-6 rounded-full ${u.c} border-2 border-gray-50 text-[9px] font-bold flex items-center justify-center`}>{u.l}</div>
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">3 collaborators from 2 universities</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 sm:py-28 bg-white border-y border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-indigo-600 mb-2 tracking-wide uppercase">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Common questions</h2>
            </div>
          </Reveal>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className={`rounded-xl border bg-white overflow-hidden transition-all duration-300 ${openFaq === i ? 'border-indigo-200 shadow-md shadow-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left group">
                    <span className="font-medium text-gray-900 pr-4 group-hover:text-indigo-600 transition-colors">{faq.q}</span>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                      <i className="fa-solid fa-chevron-down text-[10px]" />
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                    <p className="px-6 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal direction="scale">
            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 px-8 sm:px-16 py-14 sm:py-20 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 animate-blob" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-blob" style={{ animationDelay: '-4s' }} />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to collaborate?</h2>
                <p className="text-indigo-100 mb-8 max-w-md mx-auto">Join students and institutions building together across campuses. No cost, no catch.</p>
                {user ? (
                  <Link to="/dashboard" className="inline-flex justify-center py-3.5 px-8 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    Open dashboard
                  </Link>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/register" className="inline-flex justify-center items-center gap-2 py-3.5 px-8 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                      Sign up free
                      <i className="fa-solid fa-arrow-right text-sm" />
                    </Link>
                    <Link to="/login" className="inline-flex justify-center py-3.5 px-8 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20 hover:-translate-y-0.5">
                      Sign in
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2.5 font-semibold text-gray-900 mb-4">
                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">EC</span>
                </div>
                EnterCollab
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Open platform for cross-campus academic collaboration.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" onClick={(e) => smoothScroll(e, 'features')} className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#for-you" onClick={(e) => smoothScroll(e, 'for-you')} className="hover:text-indigo-600 transition-colors">For students</a></li>
                <li><a href="#for-you" onClick={(e) => smoothScroll(e, 'for-you')} className="hover:text-indigo-600 transition-colors">For institutions</a></li>
                <li><a href="#faq" onClick={(e) => smoothScroll(e, 'faq')} className="hover:text-indigo-600 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Get started</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/register" className="hover:text-indigo-600 transition-colors">Student signup</Link></li>
                <li><Link to="/register/institution" className="hover:text-indigo-600 transition-colors">Institution signup</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Explore</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link to="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link></li>
                <li><Link to="/events" className="hover:text-indigo-600 transition-colors">Events</Link></li>
                <li><Link to="/research" className="hover:text-indigo-600 transition-colors">Research</Link></li>
                <li><Link to="/colleges" className="hover:text-indigo-600 transition-colors">Universities</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} EnterCollab &middot; Crafted with precision by Ordinmens</p>
            <div className="flex items-center gap-4 text-gray-400">
              <a href="#" className="hover:text-gray-600 hover:scale-110 transition-all"><i className="fa-brands fa-github text-lg" /></a>
              <a href="#" className="hover:text-gray-600 hover:scale-110 transition-all"><i className="fa-brands fa-twitter text-lg" /></a>
              <a href="#" className="hover:text-gray-600 hover:scale-110 transition-all"><i className="fa-brands fa-linkedin text-lg" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
