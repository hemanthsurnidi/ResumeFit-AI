import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  FileText,
  Briefcase,
  Upload,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FileCode,
  ArrowRight,
  Info,
  Check,
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
      toast.error('Resume is required. Please upload a PDF/DOCX or paste text into the Resume section.')
      if (activeTab === 'text' && resumeTextareaRef.current) {
        resumeTextareaRef.current.focus()
      }
      return
    }

    if (!jobDescription.trim()) {
      toast.error('Job description is required. Please paste the job requirements in the Target Opportunity box.')
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-blue-400" size={24} /> Resume Alignment Workspace
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Provide your candidate resume and target job description for fine-tuned LLM intelligence.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium mr-1">Quick Presets:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleLoadPreset(preset)}
              className="px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-xs text-blue-300 font-medium transition-colors hover:border-blue-500/50"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Resume Input */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileText className="text-blue-400" size={18} /> Candidate Resume
              {resumeWords > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-950/70 text-green-400 border border-green-700/50 font-normal">
                  {resumeWords} words
                </span>
              )}
            </h2>
            <div className="flex bg-gray-800 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {activeTab === 'upload' ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
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

              {resumeText && !uploadError && (
                <div className="p-3 bg-gray-800/40 border border-green-800/40 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> Text Extracted Successfully ({resumeWords} words)
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('text')}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Edit extracted text
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-3 font-mono">
                    {resumeText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-2">
              <textarea
                ref={resumeTextareaRef}
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value)
                  if (uploadError) setUploadError(null)
                }}
                placeholder="Paste candidate resume content here (Summary, Skills, Work Experience, Education)..."
                rows={14}
                className="w-full flex-1 bg-gray-950/70 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{resumeWords} words</span>
                {resumeText && (
                  <button
                    type="button"
                    onClick={() => setResumeText('')}
                    className="text-red-400 hover:underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Job Description & Role */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Briefcase className="text-purple-400" size={18} /> Target Opportunity
              {jdWords > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-950/70 text-green-400 border border-green-700/50 font-normal">
                  {jdWords} words
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">
              Target Role / Job Title (Optional)
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Machine Learning Engineer"
              className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col">
            <label className="text-xs font-medium text-gray-300">
              Job Description (Requirements, Responsibilities, Qualifications)
            </label>
            <textarea
              ref={jdTextareaRef}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste company job posting requirements here..."
              rows={11}
              className="w-full flex-1 bg-gray-950/70 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono resize-none leading-relaxed"
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{jdWords} words</span>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-red-400 hover:underline"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Trigger Banner */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        {/* Status Checklist Badges */}
        <div className="space-y-2 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400">Analysis Checklist:</span>
            {resumeWords > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-950/80 border border-green-700/60 text-green-300 text-xs font-medium">
                <CheckCircle2 size={12} /> Resume Ready ({resumeWords}w)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-medium">
                <AlertCircle size={12} /> Resume Missing (Upload/Paste)
              </span>
            )}

            {jdWords > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-950/80 border border-green-700/60 text-green-300 text-xs font-medium">
                <CheckCircle2 size={12} /> Job Description Ready ({jdWords}w)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-medium">
                <AlertCircle size={12} /> Job Description Missing
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Calculates overall alignment, skill gaps, ATS keywords, bullet improvements, and actionable steps.
          </p>
        </div>

        {/* Action Button: Always clickable, provides explicit guidance if fields are missing */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={analyzing || uploading}
          className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all text-sm cursor-pointer ${
            analyzing || uploading
              ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700'
              : isReady
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-500/50 hover:scale-[1.02]'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
          }`}
        >
          {analyzing ? (
            <>
              <Loader2 size={18} className="animate-spin text-blue-400" />
              <span>{progressStep || 'Running Alignment Analysis...'}</span>
            </>
          ) : uploading ? (
            <>
              <Loader2 size={18} className="animate-spin text-blue-400" />
              <span>Processing Resume File...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className={isReady ? 'text-white' : 'text-blue-400'} />
              <span>Run AI Alignment Analysis</span>
              <ArrowRight size={16} className="opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
