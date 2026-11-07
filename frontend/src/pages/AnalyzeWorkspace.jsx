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
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col p-3 sm:p-4 gap-2.5 bg-[#dbe6d6] text-[#142e17]">
      {/* 1. Header Bar: Light Olive Green background, Dark Green text */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#b7ccb2] pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#c8ddc2] border border-[#a2be9b] text-[#1e4822] shadow-2xs">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#112d14] flex items-center gap-2 leading-tight">
              Resume Alignment Workspace
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#c8ddc2] text-[#1b431e] border border-[#9ebb96]">
                Qwen 2.5 LoRA
              </span>
            </h1>
            <p className="text-[11px] text-[#486b45] hidden sm:block">
              Candidate resume vs job description alignment with fine-tuned PEFT intelligence.
            </p>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-[#486b45] font-semibold mr-0.5">Quick Presets:</span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(preset)}
              className="px-2.5 py-1 rounded-md bg-[#e6f0e2] hover:bg-[#d8e8d3] border border-[#a6c49f] hover:border-[#6f9867] text-[11px] text-[#183d1b] font-medium transition-all shadow-2xs"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main 2-Column Grid: Pale light green cards, olive borders, dark green typography */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Card: Candidate Resume */}
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-3 flex flex-col h-full min-h-0 shadow-sm">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#c8ddc4]">
            <div className="flex items-center gap-2">
              <FileText className="text-[#285d2c]" size={16} />
              <h2 className="text-xs sm:text-sm font-bold text-[#122e15]">Candidate Resume</h2>
              {resumeWords > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d9ecd4] text-[#1c481f] border border-[#9fbf9a] font-semibold">
                  {resumeWords} words
                </span>
              )}
            </div>

            {/* Toggle Tabs */}
            <div className="flex bg-[#dfeadc] p-0.5 rounded-lg border border-[#bad1b7] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#245828] text-white shadow-xs font-semibold'
                    : 'text-[#466944] hover:text-[#143217]'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTab === 'text'
                    ? 'bg-[#245828] text-white shadow-xs font-semibold'
                    : 'text-[#466944] hover:text-[#143217]'
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
                  <div className="shrink-0 p-2.5 bg-[#f4f9f2] border border-[#a6c49e] rounded-lg shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] text-[#1d5221] font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-[#2e7434]" /> Text Extracted Successfully ({resumeWords} words)
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className="text-[11px] text-[#245828] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Edit3 size={11} /> Edit text
                      </button>
                    </div>
                    <p className="text-[11px] text-[#365733] line-clamp-2 font-mono leading-relaxed">
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
                  className="w-full flex-1 min-h-0 bg-[#ffffff] border border-[#afc9ac] rounded-lg p-2.5 text-xs sm:text-sm text-[#122e15] placeholder-[#71936e] focus:outline-none focus:border-[#3d743a] focus:ring-1 focus:ring-[#3d743a]/30 font-mono resize-none overflow-y-auto leading-relaxed shadow-inner"
                />
                <div className="shrink-0 flex justify-between items-center text-[11px] text-[#4d714a] pt-1">
                  <span className="font-medium">{resumeWords} words</span>
                  {resumeText && (
                    <button
                      type="button"
                      onClick={() => setResumeText('')}
                      className="text-red-600 hover:text-red-700 hover:underline font-medium"
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
        <div className="bg-[#eef5ec] border border-[#b2cbb0] rounded-xl p-3 flex flex-col h-full min-h-0 shadow-sm">
          {/* Card Top Row */}
          <div className="shrink-0 flex items-center justify-between pb-2 border-b border-[#c8ddc4]">
            <div className="flex items-center gap-2">
              <Briefcase className="text-[#285d2c]" size={16} />
              <h2 className="text-xs sm:text-sm font-bold text-[#122e15]">Target Opportunity</h2>
              {jdWords > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d9ecd4] text-[#1c481f] border border-[#9fbf9a] font-semibold">
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
                className="w-full bg-[#ffffff] border border-[#afc9ac] rounded-md px-2.5 py-0.5 text-xs text-[#122e15] placeholder-[#71936e] focus:outline-none focus:border-[#3d743a] focus:ring-1 focus:ring-[#3d743a]/30 shadow-inner"
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
              className="w-full flex-1 min-h-0 bg-[#ffffff] border border-[#afc9ac] rounded-lg p-2.5 text-xs sm:text-sm text-[#122e15] placeholder-[#71936e] focus:outline-none focus:border-[#3d743a] focus:ring-1 focus:ring-[#3d743a]/30 font-mono resize-none overflow-y-auto leading-relaxed shadow-inner"
            />
            <div className="shrink-0 flex justify-between items-center text-[11px] text-[#4d714a] pt-1">
              <span className="font-medium">{jdWords} words</span>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-red-600 hover:text-red-700 hover:underline font-medium"
                >
                  Clear text
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Bar: Light olive background with rich dark green button */}
      <div className="shrink-0 bg-[#e7f1e4] border border-[#b4ccb1] rounded-xl px-3.5 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        {/* Checklist Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-[#3d5e3a] hidden md:inline">Checklist:</span>

          {resumeWords > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#dcf0d9] border border-[#8ec089] text-[#134916] text-[11px] font-semibold">
              <CheckCircle2 size={12} className="text-[#206925]" /> Resume Ready ({resumeWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] text-[11px] font-semibold">
              <AlertCircle size={12} className="text-[#b45309]" /> Resume Missing (Upload/Paste)
            </span>
          )}

          {jdWords > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#dcf0d9] border border-[#8ec089] text-[#134916] text-[11px] font-semibold">
              <CheckCircle2 size={12} className="text-[#206925]" /> Job Description Ready ({jdWords}w)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#92400e] text-[11px] font-semibold">
              <AlertCircle size={12} className="text-[#b45309]" /> Job Description Missing
            </span>
          )}
        </div>

        {/* Action Button: Dark Forest Green with pale green hover */}
        <button
          type="button"
          onClick={handleRunAnalysis}
          disabled={analyzing || uploading}
          className={`w-full sm:w-auto px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-xs sm:text-sm transition-all shadow-sm cursor-pointer ${
            analyzing || uploading
              ? 'bg-[#d0dfcd] text-[#698865] cursor-not-allowed border border-[#b2c8af]'
              : isReady
              ? 'bg-gradient-to-r from-[#1b441d] via-[#245827] to-[#2e6d32] hover:from-[#245827] hover:to-[#387e3d] text-white shadow-md shadow-[#1b441d]/20 border border-[#48824b] ring-1 ring-[#86efac]/40 hover:scale-[1.01]'
              : 'bg-[#d8e7d4] hover:bg-[#cbdec6] text-[#183f1b] border border-[#9cbe97]'
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
              <Sparkles size={15} className={isReady ? 'text-[#bbf7d0]' : 'text-[#2e6d32]'} />
              <span>Run AI Alignment Analysis</span>
              <ArrowRight size={14} className="opacity-90" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
