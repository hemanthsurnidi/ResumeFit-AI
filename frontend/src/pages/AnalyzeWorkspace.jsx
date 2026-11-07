import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FileText,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Edit3,
  Cpu,
  Code2,
  RotateCcw,
  Target,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import FileDropzone from '../components/FileDropzone'
import { uploadResume, analyzeResume } from '../services/api'

const SAMPLE_PRESETS = [
  {
    name: 'Senior ML / AI Engineer',
    icon: Cpu,
    role: 'Senior Machine Learning Engineer',
    resume: `ALEX RIVERA
Email: alex.rivera@example.com | GitHub: github.com/alexrivera-ml | LinkedIn: linkedin.com/in/alexrivera-ml
Location: San Francisco, CA

PROFESSIONAL SUMMARY
Results-driven Machine Learning Engineer with 5+ years of experience designing, training, and deploying large language models, computer vision systems, and deep learning pipelines. Strong foundation in PyTorch, Transformers, LoRA/PEFT, and production model serving with FastAPI and Docker.

TECHNICAL SKILLS
Languages: Python, C++, SQL, Bash
Frameworks & ML: PyTorch, TensorFlow, Hugging Face Transformers, PEFT, TRL, Scikit-learn, LangChain, NumPy, Pandas
DevOps & Cloud: AWS (EC2, S3, SageMaker), Docker, Kubernetes, CI/CD, MLflow, Git
Databases: PostgreSQL, Redis, Pinecone, ChromaDB

PROFESSIONAL EXPERIENCE
Senior ML Engineer | Cortex AI Labs | 2022 - Present
- Fine-tuned open-source LLMs (Llama 3, Qwen 2.5) using QLoRA and LoRA on 150k custom conversational pairs, decreasing validation perplexity by 34%.
- Architected high-throughput model inference API using FastAPI and vLLM on NVIDIA A100 GPUs, achieving 45ms P95 latency.
- Built automated evaluation pipeline with ROUGE, BERTScore, and LLM-as-a-judge for weekly model regression tracking.

Machine Learning Engineer | Apex Systems | 2019 - 2022
- Developed NLP classification pipelines using BERT and RoBERTa for automated document routing with 94.2% accuracy.
- Containerized model training workflows with Docker and orchestrated distributed training using PyTorch DDP.
- Mentored junior data scientists in clean coding practices and PyTest unit testing.

EDUCATION
B.S. in Computer Science | UC Berkeley | 2015 - 2019`,
    jd: `Senior Machine Learning Engineer - LLM & Alignment
Company: NovaTech AI
Location: Remote / San Francisco

About the Role:
We are seeking an experienced Senior Machine Learning Engineer to lead our LLM fine-tuning and model alignment initiatives. You will work on pretraining adaptation, Supervised Fine-Tuning (SFT), Parameter-Efficient Fine-Tuning (PEFT/LoRA), and reinforcement learning from human feedback (RLHF) to optimize our proprietary domain models.

Requirements:
- 4+ years of hands-on experience in machine learning and deep learning.
- Strong proficiency in Python and deep learning frameworks (PyTorch preferred).
- Demonstrated experience with Hugging Face ecosystem (Transformers, Datasets, PEFT, TRL).
- Experience with quantization techniques (BitsAndBytes, AWQ, GPTQ) and PEFT methods (LoRA, QLoRA).
- Proficiency in deploying ML APIs using FastAPI, Docker, and Kubernetes.
- Familiarity with vector databases (Pinecone, Milvus) and RAG architectures.
- Experience with cloud platforms (AWS/GCP), CI/CD pipelines, and MLflow/Weights & Biases tracking.
- Strong knowledge of evaluation metrics for generative models and benchmark evaluation.`,
  },
  {
    name: 'Senior Full-Stack Developer',
    icon: Code2,
    role: 'Senior Full-Stack Developer',
    resume: `JORDAN LEE
Email: jordan.lee@example.com | Portfolio: jordanlee.dev | GitHub: github.com/jordanlee
Location: New York, NY

PROFESSIONAL SUMMARY
Senior Full-Stack Developer with 6 years of expertise building scalable web applications with React, TypeScript, Node.js, and FastAPI. Passionate about performant user interfaces, resilient microservices, and database optimization.

TECHNICAL SKILLS
Frontend: React, TypeScript, Next.js, Tailwind CSS, Redux Toolkit, Vite, HTML5, CSS3
Backend: Node.js, Express, Python, FastAPI, REST APIs, GraphQL
Databases & Cloud: PostgreSQL, MongoDB, Redis, Docker, AWS (ECS, S3, RDS), GitHub Actions

EXPERIENCE
Senior Frontend / Full-Stack Engineer | ScaleFlow | 2021 - Present
- Led front-end redesign for enterprise SaaS analytics platform using React 18, TypeScript, and Tailwind CSS.
- Optimized bundle size by 42% through code-splitting, tree-shaking, and modern Vite configuration.
- Engineered REST and GraphQL backend services in FastAPI and Node.js serving 500k monthly requests.

Full-Stack Developer | PixelCraft Studio | 2018 - 2021
- Created interactive dashboards and data visualizations with React and D3.js.
- Integrated PostgreSQL database with Prisma ORM and implemented Redis caching for 60% query speedup.
- Set up automated CI/CD deployment pipelines using GitHub Actions and Docker.

EDUCATION
B.S. in Software Engineering | NYU | 2014 - 2018`,
    jd: `Senior Full-Stack Developer (React / Python / Cloud)
Company: Elevate Digital

We need a Senior Full-Stack Engineer to architect, build, and deploy high-performance web applications.

Responsibilities & Skills:
- 5+ years of full-stack web development experience.
- Strong expertise with React, TypeScript, Next.js, and Tailwind CSS.
- Solid backend experience with Python (FastAPI / Django) or Node.js.
- Database proficiency with PostgreSQL, SQLite, Redis, and SQLAlchemy / Prisma.
- Containerization and orchestration experience using Docker and Kubernetes.
- Modern testing practices with Jest, React Testing Library, and PyTest.
- Experience building secure RESTful APIs and OAuth authentication.`,
  },
]

export default function AnalyzeWorkspace() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upload') // 'upload' | 'text'
  const [file, setFile] = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState('')

  const resumeTextareaRef = useRef(null)
  const jdTextareaRef = useRef(null)

  const handleFileUpload = async (selectedFile) => {
    setFile(selectedFile)
    setUploading(true)
    setUploadError(null)
    const toastId = toast.loading(`Uploading & extracting "${selectedFile.name}"...`)
    try {
      const res = await uploadResume(selectedFile)
      const text = res.data.full_text || res.data.text || res.data.extracted_text_preview || ''
      if (!text.trim()) {
        throw new Error('No readable text could be extracted from this file. Try copying and pasting your resume directly.')
      }
      setResumeText(text)
      setUploadError(null)
      const wordCount = res.data.word_count || text.split(/\s+/).filter(Boolean).length
      toast.success(`Extracted ${wordCount} words from ${selectedFile.name}`, {
        id: toastId,
      })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.userMessage ||
        err.message ||
        'Failed to extract resume text. Please check the file format or paste the text directly.'
      setUploadError(msg)
      setResumeText('')
      toast.error(msg, { id: toastId, duration: 6000 })
    } finally {
      setUploading(false)
    }
  }

  const handleLoadPreset = (preset) => {
    setResumeText(preset.resume)
    setJobDescription(preset.jd)
    setTargetRole(preset.role)
    setActiveTab('text')
    setFile(null)
    setUploadError(null)
    toast.success(`Loaded "${preset.name}" preset!`)
  }

  const handleClearAll = () => {
    setFile(null)
    setResumeText('')
    setJobDescription('')
    setTargetRole('')
    setUploadError(null)
    toast.success('Workspace cleared.')
  }

  const handleRunAnalysis = async () => {
    if (analyzing || uploading) return

    if (!resumeText.trim()) {
      toast.error('Resume is required. Please upload a PDF/DOCX or paste text into Candidate Resume.')
      if (activeTab === 'text' && resumeTextareaRef.current) {
        resumeTextareaRef.current.focus()
      }
      return
    }

    if (!jobDescription.trim()) {
      toast.error('Job description is required. Please paste the job requirements in Target Opportunity.')
      if (jdTextareaRef.current) {
        jdTextareaRef.current.focus()
      }
      return
    }

    setAnalyzing(true)
    setProgressStep('Running Fine-Tuned Alignment Engine...')

    try {
      const res = await analyzeResume({
        resume_text: resumeText,
        job_description: jobDescription,
        target_role: targetRole || undefined,
        resume_filename: file?.name || 'direct_input.txt',
      })

      toast.success('Analysis complete!')
      navigate(`/results/${res.data.id}`)
    } catch (err) {
      toast.error(err.userMessage || 'Failed to analyze resume. Please try again.')
    } finally {
      setAnalyzing(false)
      setProgressStep('')
    }
  }

  const resumeWords = resumeText.trim() ? resumeText.trim().split(/\s+/).filter(Boolean).length : 0
  const jdWords = jobDescription.trim() ? jobDescription.trim().split(/\s+/).filter(Boolean).length : 0
  const isReady = resumeWords > 0 && jdWords > 0

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-3 sm:p-4 gap-2.5 bg-[#dbe6d6] bg-[radial-gradient(#bed4ba_1px,transparent_1px)] [background-size:20px_20px] text-[#142e17]">
      {/* 1. Header Bar: Elevated Frosted Bar with Gradient Highlights */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-gradient-to-r from-white/90 via-[#edf5eb]/95 to-white/90 backdrop-blur-md border border-[#a6c5a1] rounded-2xl p-2 px-3.5 shadow-[0_4px_16px_rgba(20,50,22,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#18451b] via-[#235b27] to-[#307535] text-white flex items-center justify-center shadow-xs">
            <Sparkles size={17} className="text-[#a7f3d0]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-[#0f2e13] flex items-center gap-2 leading-none">
              Resume Alignment Workspace
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#d6ebd3] border border-[#7eb879] text-[#0f3f14] text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1da027] animate-pulse" />
                Qwen 2.5 LoRA
              </span>
            </h1>
            <p className="text-[11px] text-[#446841] font-medium mt-0.5 hidden sm:block">
              Intelligent resume-to-job matching with fine-tuned PEFT parameter adaptation.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets & Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#446841] font-bold mr-0.5 flex items-center gap-1">
            <Zap size={12} className="text-[#206925]" /> Presets:
          </span>
          {SAMPLE_PRESETS.map((preset, idx) => {
            const Icon = preset.icon
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleLoadPreset(preset)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-[#f2faf0] border border-[#a2c39d] hover:border-[#2f6f34] text-[11px] text-[#123916] font-bold transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
              >
                <Icon size={12} className="text-[#205a25]" />
                {preset.name}
              </button>
            )
          })}
          {(resumeWords > 0 || jdWords > 0) && (
            <button
              type="button"
              onClick={handleClearAll}
              title="Clear all inputs"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#e4efe1] hover:bg-[#d8e8d4] border border-[#a8c7a3] text-[11px] text-[#446841] hover:text-red-700 font-bold transition-all shadow-2xs cursor-pointer ml-1"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* 2. Main 2-Column Grid: Vibrant Elevated Cards with Soft Depth */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Card: Candidate Resume */}
        <div className="bg-gradient-to-b from-white/95 via-[#f6fbf4]/95 to-[#edf5ec]/95 backdrop-blur-md border border-[#a2c49d] rounded-2xl p-3 flex flex-col h-full min-h-0 shadow-[0_8px_24px_rgba(20,50,22,0.06)] ring-1 ring-white/80">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#c8ddc4]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#dcf2d9] border border-[#8ec789] text-[#134916] flex items-center justify-center shadow-2xs">
                <FileText size={14} />
              </div>
              <h2 className="text-xs sm:text-sm font-black text-[#0f2e13]">Candidate Resume</h2>
              {resumeWords > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#d8eed4] text-[#0a3a0e] border border-[#65aa60] font-bold shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1da027]" />
                  {resumeWords} words
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f7ef] text-[#557852] border border-[#bed8bb] font-medium">
                  Awaiting input
                </span>
              )}
            </div>

            {/* Toggle Switch Tabs */}
            <div className="flex bg-[#e2ede0] p-0.5 rounded-xl border border-[#b6d0b3] text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-[#1c481f] to-[#265e2b] text-white shadow-xs font-bold'
                    : 'text-[#3b5d38] hover:text-[#112d14] font-semibold'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-gradient-to-r from-[#1c481f] to-[#265e2b] text-white shadow-xs font-bold'
                    : 'text-[#3b5d38] hover:text-[#112d14] font-semibold'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="flex-1 min-h-0 pt-2 flex flex-col">
            {activeTab === 'upload' ? (
              <div className="flex-1 min-h-0 flex flex-col justify-between gap-2">
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  <FileDropzone
                    onFile={handleFileUpload}
                    file={file}
                    loading={uploading}
                    error={uploadError}
                    onSwitchToText={() => setActiveTab('text')}
                    onClear={() => {
                      setFile(null)
                      setResumeText('')
                      setUploadError(null)
                    }}
                  />
                </div>

                {resumeText && !uploadError && (
                  <div className="shrink-0 p-3 bg-gradient-to-r from-[#f4faf2] via-white to-[#f0f8ee] border border-[#8ec789] rounded-xl shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-[#0f3f14] font-black flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-[#1da027]" /> Extracted Successfully ({resumeWords} words)
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#e4f2e1] hover:bg-[#d5ebd1] border border-[#91c78b] text-[11px] text-[#134916] font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Edit3 size={11} /> Edit in Text Mode
                      </button>
                    </div>
                    <p className="text-[11px] text-[#294c26] line-clamp-2 font-mono leading-relaxed bg-white/70 p-1.5 rounded-lg border border-[#c4dec1]">
                      {resumeText}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                <textarea
                  ref={resumeTextareaRef}
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value)
                    if (uploadError) setUploadError(null)
                  }}
                  placeholder="Paste candidate resume content here (Summary, Technical Skills, Experience, Education)..."
                  className="w-full flex-1 min-h-0 bg-white border border-[#9fc19a] rounded-xl p-3 text-xs sm:text-sm text-[#0d2a10] placeholder-[#668b64] font-mono leading-relaxed shadow-inner focus:outline-none focus:border-[#245828] focus:ring-2 focus:ring-[#245828]/20 resize-none overflow-y-auto"
                />
                <div className="shrink-0 flex justify-between items-center text-[11px] text-[#446841] pt-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#143d17]">{resumeWords} words</span>
                    <span>•</span>
                    <span>{resumeText.length} characters</span>
                  </div>
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => setResumeText('')}
                      className="text-red-600 hover:text-red-800 hover:underline font-bold cursor-pointer"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Target Opportunity */}
        <div className="bg-gradient-to-b from-white/95 via-[#f6fbf4]/95 to-[#edf5ec]/95 backdrop-blur-md border border-[#a2c49d] rounded-2xl p-3 flex flex-col h-full min-h-0 shadow-[0_8px_24px_rgba(20,50,22,0.06)] ring-1 ring-white/80">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#c8ddc4]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#dcf2d9] border border-[#8ec789] text-[#134916] flex items-center justify-center shadow-2xs">
                <Briefcase size={14} />
              </div>
              <h2 className="text-xs sm:text-sm font-black text-[#0f2e13]">Target Opportunity</h2>
              {jdWords > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#d8eed4] text-[#0a3a0e] border border-[#65aa60] font-bold shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1da027]" />
                  {jdWords} words
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f1f7ef] text-[#557852] border border-[#bed8bb] font-medium">
                  Awaiting JD
                </span>
              )}
            </div>

            {/* Target Role input inside top bar to save vertical height */}
            <div className="relative w-48 sm:w-64">
              <Target size={13} className="absolute left-2.5 top-2 text-[#466944]" />
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target Job Title (Optional)"
                className="w-full bg-white border border-[#9fc19a] rounded-lg pl-7 pr-2.5 py-1 text-xs text-[#0d2a10] placeholder-[#668b64] font-semibold focus:outline-none focus:border-[#245828] focus:ring-1 focus:ring-[#245828]/25 shadow-2xs"
              />
            </div>
          </div>

          {/* Card Body: JD Textarea fills all remaining height */}
          <div className="flex-1 min-h-0 pt-2 flex flex-col">
            <textarea
              ref={jdTextareaRef}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste company job posting requirements, responsibilities, and qualifications here..."
              className="w-full flex-1 min-h-0 bg-white border border-[#9fc19a] rounded-xl p-3 text-xs sm:text-sm text-[#0d2a10] placeholder-[#668b64] font-mono leading-relaxed shadow-inner focus:outline-none focus:border-[#245828] focus:ring-2 focus:ring-[#245828]/20 resize-none overflow-y-auto"
            />
            <div className="shrink-0 flex justify-between items-center text-[11px] text-[#446841] pt-1.5 font-medium">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#143d17]">{jdWords} words</span>
                <span>•</span>
                <span>{jobDescription.length} characters</span>
              </div>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-red-600 hover:text-red-800 hover:underline font-bold cursor-pointer"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Launchpad: High-Impact Hero Bar */}
      <div className="shrink-0 bg-gradient-to-r from-white/95 via-[#edf5eb]/95 to-white/95 backdrop-blur-md border border-[#a2c49d] rounded-2xl px-4 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_8px_24px_rgba(20,50,22,0.08)] ring-1 ring-white/80">
        {/* Dynamic Checklist Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#285025] hidden md:inline">
            Status:
          </span>

          {resumeWords > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8eed4] border border-[#65aa60] text-[#0a3a0e] text-[11px] font-extrabold shadow-2xs">
              <CheckCircle2 size={13} className="text-[#156019]" /> Resume Ready ({resumeWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#854d0e] text-[11px] font-extrabold shadow-2xs animate-pulse">
              <AlertCircle size={13} className="text-[#b45309]" /> Resume Required
            </span>
          )}

          {jdWords > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8eed4] border border-[#65aa60] text-[#0a3a0e] text-[11px] font-extrabold shadow-2xs">
              <CheckCircle2 size={13} className="text-[#156019]" /> Job Description Ready ({jdWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#854d0e] text-[11px] font-extrabold shadow-2xs animate-pulse">
              <AlertCircle size={13} className="text-[#b45309]" /> Job Description Required
            </span>
          )}
        </div>

        {/* Action Button: Glowing High-Energy Launchpad */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={analyzing || uploading}
          className={`w-full sm:w-auto px-7 py-2.5 rounded-xl font-black flex items-center justify-center gap-2.5 text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
            analyzing || uploading
              ? 'bg-[#cce0cb] text-[#5d7c5b] cursor-not-allowed border border-[#a2be9f]'
              : isReady
              ? 'bg-gradient-to-r from-[#17431b] via-[#225c27] to-[#2d7332] hover:from-[#1d5221] hover:to-[#38883d] text-white shadow-[0_4px_18px_rgba(25,70,30,0.35)] ring-2 ring-[#7cd483]/60 hover:scale-[1.02] active:scale-[0.99]'
              : 'bg-white hover:bg-[#edf5eb] text-[#123916] border border-[#97bc93] hover:border-[#225c27]'
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#86efac]" />
              <span>{progressStep || 'Running Alignment Engine...'}</span>
            </>
          ) : uploading ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#86efac]" />
              <span>Extracting Document...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} className={isReady ? 'text-[#86efac] animate-pulse' : 'text-[#206925]'} />
              <span>Run AI Alignment Analysis</span>
              <ArrowRight size={15} className="opacity-90" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
