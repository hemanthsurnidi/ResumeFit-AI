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
} from 'lucide-react'
import toast from 'react-hot-toast'
import FileDropzone from '../components/FileDropzone'
import { uploadResume, analyzeResume } from '../services/api'

const SAMPLE_PRESETS = [
  {
    name: 'Senior ML / AI Engineer',
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
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-3 sm:p-4 gap-2.5 bg-[#061209] text-[#e2f0e4]">
      {/* 1. Header Bar: Compact, No vertical bloat */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#1c3820] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#143219] border border-[#2e5d34] text-[#86efac]">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#e8f7ea] flex items-center gap-2 leading-tight">
              Resume Alignment Workspace
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#16351c] text-[#86efac] border border-[#2b5c32]">
                Qwen 2.5 LoRA
              </span>
            </h1>
            <p className="text-[11px] text-[#7ea581] hidden sm:block">
              Candidate resume vs job description alignment with fine-tuned PEFT intelligence.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#719574] font-medium mr-0.5">Quick Presets:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="px-2.5 py-1 rounded-md bg-[#132b17] hover:bg-[#1f4224] border border-[#2a5430] hover:border-[#4d8654] text-[11px] text-[#bde3b5] font-medium transition-all shadow-sm"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main 2-Column Grid: Fills remaining viewport flex-1 min-h-0 with internal scroll only */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Card: Candidate Resume */}
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-3 flex flex-col h-full min-h-0 shadow-md">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#18361d]">
            <div className="flex items-center gap-2">
              <FileText className="text-[#86efac]" size={16} />
              <h2 className="text-xs sm:text-sm font-semibold text-[#daf3dc]">Candidate Resume</h2>
              {resumeWords > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14351a] text-[#86efac] border border-[#2f6636] font-medium">
                  {resumeWords} words
                </span>
              )}
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-[#07150a] p-0.5 rounded-lg border border-[#19391e] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#295e2e] text-white shadow-sm font-semibold'
                    : 'text-[#7e9f7b] hover:text-[#c4ecc6]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-[#295e2e] text-white shadow-sm font-semibold'
                    : 'text-[#7e9f7b] hover:text-[#c4ecc6]'
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
                  <div className="shrink-0 p-2.5 bg-[#08170d] border border-[#28572e] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-[#86efac] font-medium flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> Text Extracted Successfully ({resumeWords} words)
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className="text-[11px] text-[#a7f3d0] hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={11} /> Edit text
                      </button>
                    </div>
                    <p className="text-[11px] text-[#86a888] line-clamp-2 font-mono leading-relaxed">
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
                  className="w-full flex-1 min-h-0 bg-[#08150c] border border-[#1c3c21] rounded-lg p-2.5 text-xs sm:text-sm text-[#e0f5e3] placeholder-[#4f7353] focus:outline-none focus:border-[#529757] font-mono resize-none overflow-y-auto leading-relaxed"
                />
                <div className="shrink-0 flex justify-between items-center text-[11px] text-[#719574] pt-1">
                  <span>{resumeWords} words</span>
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => setResumeText('')}
                      className="text-red-400 hover:text-red-300 hover:underline"
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
        <div className="bg-[#0b1c10] border border-[#1d3d23] rounded-xl p-3 flex flex-col h-full min-h-0 shadow-md">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#18361d]">
            <div className="flex items-center gap-2">
              <Briefcase className="text-[#86efac]" size={16} />
              <h2 className="text-xs sm:text-sm font-semibold text-[#daf3dc]">Target Opportunity</h2>
              {jdWords > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#14351a] text-[#86efac] border border-[#2f6636] font-medium">
                  {jdWords} words
                </span>
              )}
            </div>

            {/* Target Role input inside top bar to save vertical height */}
            <div className="w-48 sm:w-60">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target Role (e.g. ML Engineer)"
                className="w-full bg-[#08150c] border border-[#1c3c21] rounded-md px-2.5 py-0.5 text-xs text-[#e0f5e3] placeholder-[#4f7353] focus:outline-none focus:border-[#529757]"
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
              className="w-full flex-1 min-h-0 bg-[#08150c] border border-[#1c3c21] rounded-lg p-2.5 text-xs sm:text-sm text-[#e0f5e3] placeholder-[#4f7353] focus:outline-none focus:border-[#529757] font-mono resize-none overflow-y-auto leading-relaxed"
            />
            <div className="shrink-0 flex justify-between items-center text-[11px] text-[#719574] pt-1">
              <span>{jdWords} words</span>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-red-400 hover:text-red-300 hover:underline"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Bar: Compact, No window scroll */}
      <div className="shrink-0 bg-[#0a1a0e] border border-[#1d3c22] rounded-xl px-3.5 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
        {/* Checklist Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-[#719574] hidden md:inline">Checklist:</span>

          {resumeWords > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#122e18] border border-[#2b6033] text-[#86efac] text-[11px] font-medium">
              <CheckCircle2 size={12} /> Resume Ready ({resumeWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#27210e] border border-[#6b5516] text-[#fcd34d] text-[11px] font-medium">
              <AlertCircle size={12} /> Resume Missing (Upload/Paste)
            </span>
          )}

          {jdWords > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#122e18] border border-[#2b6033] text-[#86efac] text-[11px] font-medium">
              <CheckCircle2 size={12} /> Job Description Ready ({jdWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#27210e] border border-[#6b5516] text-[#fcd34d] text-[11px] font-medium">
              <AlertCircle size={12} /> Job Description Missing
            </span>
          )}
        </div>

        {/* Action Button: Glowing Olive & Pale Light Green */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={analyzing || uploading}
          className={`w-full sm:w-auto px-6 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
            analyzing || uploading
              ? 'bg-[#122616] text-[#638765] cursor-not-allowed border border-[#1e3c23]'
              : isReady
              ? 'bg-gradient-to-r from-[#2c6530] via-[#387e3d] to-[#45954a] hover:from-[#347839] hover:to-[#4fa755] text-white shadow-[#143517]/70 border border-[#58a55d] ring-1 ring-[#86efac]/50 hover:scale-[1.01]'
              : 'bg-[#152e19] hover:bg-[#1d3c22] text-[#bde3b5] border border-[#2f5532]'
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 size={15} className="animate-spin text-[#86efac]" />
              <span>{progressStep || 'Running Alignment Engine...'}</span>
            </>
          ) : uploading ? (
            <>
              <Loader2 size={15} className="animate-spin text-[#86efac]" />
              <span>Extracting Resume...</span>
            </>
          ) : (
            <>
              <Sparkles size={15} className={isReady ? 'text-[#bbf7d0]' : 'text-[#86efac]'} />
              <span>Run AI Alignment Analysis</span>
              <ArrowRight size={14} className="opacity-80" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
