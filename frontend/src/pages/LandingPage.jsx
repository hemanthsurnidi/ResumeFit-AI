import { Link } from 'react-router-dom'
import {
  Bot, Zap, Target, FileSearch, PenTool, ListChecks, Shield,
  ChevronRight, Star, Upload, BarChart2, Layers, Lock, Github
} from 'lucide-react'

const FEATURES = [
  {
    icon: Zap,
    title: 'AI-Powered Analysis',
    desc: 'Fine-tuned Qwen2.5 model with LoRA adapters delivers nuanced resume scoring far beyond keyword matching.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20 border-yellow-700/30',
  },
  {
    icon: Target,
    title: 'Skill Gap Detection',
    desc: 'Precisely identifies matching, missing, partial, and transferable skills between your resume and the job description.',
    color: 'text-red-400',
    bg: 'bg-red-900/20 border-red-700/30',
  },
  {
    icon: FileSearch,
    title: 'ATS Optimization',
    desc: 'Checks your resume against ATS systems, flagging keyword density, formatting issues, and section completeness.',
    color: 'text-blue-400',
    bg: 'bg-blue-900/20 border-blue-700/30',
  },
  {
    icon: PenTool,
    title: 'Bullet Rewriting',
    desc: 'Get AI-generated rewrites of your experience bullets that better align with specific job requirements.',
    color: 'text-purple-400',
    bg: 'bg-purple-900/20 border-purple-700/30',
  },
  {
    icon: ListChecks,
    title: 'Prioritized Action Plan',
    desc: 'Actionable recommendations categorized by priority (High / Medium / Low) so you know exactly what to fix first.',
    color: 'text-green-400',
    bg: 'bg-green-900/20 border-green-700/30',
  },
  {
    icon: Layers,
    title: 'Fine-tuned Model',
    desc: 'Not a generic GPT wrapper — trained on hundreds of resume/JD pairs with structured JSON output for reliability.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/20 border-cyan-700/30',
  },
]

const STEPS = [
  { step: '01', icon: Upload, title: 'Upload Your Resume', desc: 'Drop a PDF or DOCX file, or paste your resume text directly.' },
  { step: '02', icon: FileSearch, title: 'Add Job Description', desc: 'Paste the full job description and optionally specify the target role.' },
  { step: '03', icon: BarChart2, title: 'Get Instant Analysis', desc: 'Receive a detailed score breakdown, skill gap report, ATS analysis, and improvement recommendations.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Bot size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ResumeFit AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden sm:block text-sm text-gray-400 hover:text-white transition">
              Dashboard
            </Link>
            <Link
              to="/analyze"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-900/40"
            >
              Get Started <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-700/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-300 text-xs font-medium mb-6">
            <Star size={12} className="fill-current" />
            Powered by fine-tuned Qwen2.5 + LoRA adapters
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Land Your Dream Job with{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              AI-Powered
            </span>{' '}
            Resume Analysis
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Get a detailed score breakdown, skill gap report, ATS optimization, and
            actionable recommendations — all in seconds, powered by a fine-tuned
            language model trained on real resume/job-description pairs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/analyze"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-base font-bold transition shadow-2xl shadow-blue-900/40"
            >
              <Zap size={18} />
              Analyze My Resume Now
            </Link>
            <Link
              to="/model"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-base font-semibold transition"
            >
              <Layers size={18} />
              Learn About the Model
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-green-500" /> Privacy-first</span>
            <span className="flex items-center gap-1.5"><Zap size={14} className="text-yellow-500" /> Results in &lt;30 seconds</span>
            <span className="flex items-center gap-1.5"><Target size={14} className="text-blue-500" /> Structured JSON output</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-gray-400">Three steps to a job-ready resume.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-gray-900 border border-gray-800">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600 bg-gray-950 px-2">{step}</div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-800/30 mb-4">
                  <Icon size={28} className="text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Everything You Need</h2>
            <p className="text-gray-400">Comprehensive resume intelligence, not just a keyword counter.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={`p-6 rounded-2xl border ${bg} transition hover:scale-[1.02]`}>
                <div className={`inline-flex p-2.5 rounded-xl bg-gray-900/60 mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech callout */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-950/40 to-purple-950/40 border-y border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-medium mb-5">
            <Layers size={12} /> Fine-tuned AI
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Powered by Qwen2.5 with LoRA Adapters
          </h2>
          <p className="text-gray-400 leading-relaxed mb-6">
            Unlike generic AI tools, ResumeFit AI uses a base Qwen2.5 model fine-tuned specifically
            on resume analysis tasks using LoRA (Low-Rank Adaptation). The result is a compact,
            fast model that produces structured JSON output — scoring, skill gaps, ATS analysis,
            and bullet rewrites — with far greater precision than prompting a general-purpose LLM.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-xs font-mono">
            {['Qwen2.5-1.5B', 'LoRA r=16 α=32', 'Structured JSON', 'QLoRA 4-bit', 'Google Colab', 'HuggingFace PEFT'].map(tag => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-2xl bg-green-900/20 border border-green-700/30 mb-5">
            <Lock size={28} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Your Resume Stays Private</h2>
          <p className="text-gray-400 leading-relaxed">
            Resumes are processed in memory and never stored permanently on our servers.
            Analysis results are saved locally in a SQLite database you control.
            No third-party tracking, no data selling, no cloud storage.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-950/60 to-purple-950/60 border-y border-gray-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Optimize Your Resume?</h2>
          <p className="text-gray-400 mb-8">
            It's free, fast, and runs locally. No sign-up required.
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg font-bold transition shadow-2xl shadow-blue-900/40"
          >
            Start Analyzing Now <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800 text-center text-sm text-gray-600">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-gray-700" />
            <span>ResumeFit AI — Fine-tuned ML resume analysis</span>
          </div>
          <span className="hidden sm:block">•</span>
          <div className="flex items-center gap-4">
            <Link to="/model" className="hover:text-gray-400 transition">Model Info</Link>
            <Link to="/evaluation" className="hover:text-gray-400 transition">Evaluation</Link>
            <Link to="/settings" className="hover:text-gray-400 transition">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
