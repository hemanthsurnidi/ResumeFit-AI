import { CheckCircle2, ShieldCheck, Heart, Code2, Cpu, FileText, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#dbe6d6] text-[#142e17]">
      {/* Header */}
      <div className="border-b border-[#b7ccb2] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112e15] tracking-tight">
          About This Project
        </h1>
        <p className="text-sm text-[#3d5e3b] mt-1 font-medium leading-relaxed">
          Why I built ResumeFit, how it compares resumes with job postings, and the engineering behind it.
        </p>
      </div>

      {/* Story Card */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#112e15] flex items-center gap-2">
          <Heart className="text-[#206925]" size={18} /> Why I Built ResumeFit
        </h2>
        <div className="space-y-3 text-sm text-[#2a4d29] leading-relaxed font-medium">
          <p>
            When applying for tech jobs, tailoring your resume for every job description takes a lot of time. Most online ATS scanners just do simple keyword searches without understanding your actual project experience, while general chat models often invent fake experience or give generic, repetitive advice.
          </p>
          <p>
            I built this project to solve that problem cleanly. Instead of calling a black-box cloud API, I wanted to build and fine-tune an actual open-weight language model specifically for resume analysis, and connect it to a full-stack web application.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-[#112e15] flex items-center gap-2">
          <Cpu className="text-[#206925]" size={18} /> How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-white rounded-xl border border-[#c4dec1] space-y-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#dcf2d9] text-[#134916] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="font-bold text-[#112e15] text-sm">Read the Resume</h3>
            <p className="text-xs text-[#3b5d38] leading-relaxed">
              When you upload a PDF or DOCX file, the backend extracts the raw text and sections using PyMuPDF and python-docx.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c4dec1] space-y-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#dcf2d9] text-[#134916] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="font-bold text-[#112e15] text-sm">Compare Requirements</h3>
            <p className="text-xs text-[#3b5d38] leading-relaxed">
              The system identifies what the job actually asks for (skills, tools, years of experience) and checks what is present in your resume.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#c4dec1] space-y-2 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-[#dcf2d9] text-[#134916] flex items-center justify-center font-bold text-xs">
              3
            </div>
            <h3 className="font-bold text-[#112e15] text-sm">Give Practical Advice</h3>
            <p className="text-xs text-[#3b5d38] leading-relaxed">
              It highlights missing skills, checks standard ATS formatting, and rewrites weak bullet points using the Google "Accomplished X by doing Y" format.
            </p>
          </div>
        </div>
      </div>

      {/* Core Rules */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-2xl p-6 sm:p-7 space-y-3 shadow-sm">
        <h2 className="text-lg font-bold text-[#112e15] flex items-center gap-2">
          <ShieldCheck className="text-[#206925]" size={18} /> Important Design Rule: No Fake Experience
        </h2>
        <div className="text-sm text-[#2a4d29] leading-relaxed font-medium space-y-2">
          <p>
            A key rule I built into both the training data and the analysis engine is <strong>honesty</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#355833]">
            <li>The system will <strong>never</strong> suggest falsely claiming a skill you do not have.</li>
            <li>It will <strong>never</strong> invent fake employers, degrees, or certifications.</li>
            <li>If a skill is missing, it will clearly label it as a gap and suggest how to acquire it through small projects or learning.</li>
          </ul>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-2xl p-6 sm:p-7 space-y-3 shadow-sm">
        <h2 className="text-lg font-bold text-[#112e15] flex items-center gap-2">
          <Code2 className="text-[#206925]" size={18} /> Technologies Used
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#2a4d29] font-medium pt-1">
          <div className="p-3 bg-white rounded-xl border border-[#c4dec1]">
            <strong className="text-[#112e15] block mb-1">Machine Learning</strong>
            <p className="text-[#4b6d49]">PyTorch, Hugging Face Transformers, PEFT (LoRA), Datasets, BitsAndBytes.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#c4dec1]">
            <strong className="text-[#112e15] block mb-1">Backend</strong>
            <p className="text-[#4b6d49]">Python, FastAPI, SQLite, PyMuPDF, python-docx, Pydantic.</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-[#c4dec1]">
            <strong className="text-[#112e15] block mb-1">Frontend</strong>
            <p className="text-[#4b6d49]">React 18, Vite, Tailwind CSS, Lucide icons.</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="pt-2 text-center">
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#17431b] via-[#225c27] to-[#2d7332] hover:from-[#1d5221] hover:to-[#38883d] text-white font-bold shadow-md text-sm transition-all"
        >
          <span>Try Analyzing a Resume</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

