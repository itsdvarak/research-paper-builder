"use client"

import { useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatMessage, PaperFormatting, ResearchPaper } from "@/lib/types"

const defaultFormatting: PaperFormatting = {
  fileName: "research-paper",
  fontFamily: "Times New Roman",
  bodyFontSize: 12,
  heading1FontSize: 18,
  heading2FontSize: 16,
  heading3FontSize: 14,
  titleFontSize: 22,
  lineSpacing: 1.5,
  paragraphSpacing: 0.5,
  marginTop: 1,
  marginRight: 1,
  marginBottom: 1,
  marginLeft: 1,
  alignment: "justify",
  titleColor: "#e2e8f0",
  heading1Color: "#60a5fa",
  heading2Color: "#a78bfa",
  heading3Color: "#34d399",
  bodyColor: "#cbd5e1",
  pageBackground: "#020617",
  boldHeadings: true,
  uppercaseHeadings: false
}

const presets = [
  {
    name: "Classic Academic",
    values: {
      fontFamily: "Times New Roman",
      titleColor: "#e2e8f0",
      heading1Color: "#60a5fa",
      heading2Color: "#a78bfa",
      heading3Color: "#34d399",
      bodyColor: "#cbd5e1",
      pageBackground: "#020617"
    }
  },
  {
    name: "Modern Blue",
    values: {
      fontFamily: "Georgia",
      titleColor: "#ffffff",
      heading1Color: "#38bdf8",
      heading2Color: "#818cf8",
      heading3Color: "#22c55e",
      bodyColor: "#e2e8f0",
      pageBackground: "#0f172a"
    }
  },
  {
    name: "Warm Paper",
    values: {
      fontFamily: "Cambria",
      titleColor: "#f8fafc",
      heading1Color: "#f59e0b",
      heading2Color: "#fb7185",
      heading3Color: "#10b981",
      bodyColor: "#e5e7eb",
      pageBackground: "#111827"
    }
  }
]

function sectionHeading(text: string, level: 1 | 2 | 3, formatting: PaperFormatting) {
  const size =
    level === 1
      ? formatting.heading1FontSize
      : level === 2
        ? formatting.heading2FontSize
        : formatting.heading3FontSize

  const color =
    level === 1
      ? formatting.heading1Color
      : level === 2
        ? formatting.heading2Color
        : formatting.heading3Color

  return (
    <div
      style={{
        fontFamily: formatting.fontFamily,
        fontSize: `${size}px`,
        color,
        fontWeight: formatting.boldHeadings ? 700 : 500,
        textTransform: formatting.uppercaseHeadings ? "uppercase" : "none"
      }}
      className="mb-2 mt-5 tracking-wide"
    >
      {text}
    </div>
  )
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [paper, setPaper] = useState<ResearchPaper | null>(null)
  const [formatting, setFormatting] = useState<PaperFormatting>(defaultFormatting)
  const [loadingPaper, setLoadingPaper] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [status, setStatus] = useState("")
  const [activeTab, setActiveTab] = useState<"preview" | "formatting">("preview")
  const chatRef = useRef<HTMLDivElement | null>(null)

  const hasUserMessages = useMemo(() => messages.some((m) => m.role === "user"), [messages])
  const userMessageCount = useMemo(() => messages.filter((m) => m.role === "user").length, [messages])

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    })
  }

  function sendMessage() {
    const value = input.trim()
    if (!value) return

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", text: value },
      { role: "assistant", text: "Evidence?" }
    ]

    setMessages(nextMessages)
    setInput("")
    setStatus("")
    scrollToBottom()
  }

  async function handleEnough() {
    if (!hasUserMessages) return

    setLoadingPaper(true)
    setStatus("Generating research paper...")

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate research paper.")
      }

      setPaper(data.paper)
      setActiveTab("preview")
      setStatus("Research paper generated.")
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to generate research paper.")
    } finally {
      setLoadingPaper(false)
    }
  }

  async function handleDownload() {
    if (!paper) return

    setDownloading(true)
    setStatus("Generating Word document...")

    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paper, formatting })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to export Word file.")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${formatting.fileName || "research-paper"}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setStatus("Download started.")
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed to export Word file.")
    } finally {
      setDownloading(false)
    }
  }

  function updateFormatting<K extends keyof PaperFormatting>(key: K, value: PaperFormatting[K]) {
    setFormatting((prev) => ({ ...prev, [key]: value }))
  }

  function resetAll() {
    setMessages([])
    setInput("")
    setPaper(null)
    setFormatting(defaultFormatting)
    setStatus("")
    setActiveTab("preview")
  }

  function applyPreset(name: string) {
    const preset = presets.find((p) => p.name === name)
    if (!preset) return
    setFormatting((prev) => ({
      ...prev,
      ...preset.values
    }))
  }

  return (
    <main
      className="min-h-screen overflow-hidden"
      style={{
        background: `radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 30%), radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 30%), radial-gradient(circle at bottom, rgba(16,185,129,0.12), transparent 25%), ${formatting.pageBackground}`
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, 12, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-10 top-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -18, 0], x: [0, -10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-10 top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 25, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/3 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold text-blue-200">
                Evidence Driven Writing System
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
                Evidence-First Research Paper Builder
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300 md:text-base">
                Start with any idea. The app keeps asking for evidence. When you click Enough, all your messages are structured into a research paper and exported into a downloadable Word file with deeper formatting controls.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
                <div className="text-xl font-bold text-white">{userMessageCount}</div>
                <div className="text-xs text-slate-400">Claims</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
                <div className="text-xl font-bold text-white">{Math.floor(userMessageCount / 2)}</div>
                <div className="text-xs text-slate-400">Evidence Blocks</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
                <div className="text-xl font-bold text-white">{paper ? "Yes" : "No"}</div>
                <div className="text-xs text-slate-400">Paper Ready</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
                <div className="text-xl font-bold text-white">DOCX</div>
                <div className="text-xs text-slate-400">Export Mode</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <motion.section
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Chat Workspace</h2>
                <p className="text-sm text-slate-400">Drop claims, notes, proofs, observations, or examples. The system always asks for evidence.</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                Live Evidence Loop
              </div>
            </div>

            <div
              ref={chatRef}
              className="relative flex h-[560px] flex-col gap-4 overflow-y-auto rounded-[28px] border border-white/10 bg-slate-950/50 p-4"
            >
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="m-auto max-w-lg rounded-[28px] border border-dashed border-white/10 bg-white/5 p-8 text-center"
                >
                  <div className="mb-3 text-2xl font-bold text-white">Start typing</div>
                  <div className="text-sm leading-7 text-slate-400">
                    Example: “AI improves education outcomes.”<br />
                    The system replies: “Evidence?”
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.role}-${index}-${message.text}`}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.22 }}
                    className={`max-w-[86%] rounded-[24px] px-4 py-4 text-sm leading-7 shadow-[0_14px_30px_rgba(0,0,0,0.25)] ${message.role === "user"
                        ? "self-end border border-blue-400/20 bg-gradient-to-br from-blue-600 to-cyan-500 text-white"
                        : "self-start border border-white/10 bg-white/10 text-slate-100 backdrop-blur-md"
                      }`}
                  >
                    <div className="mb-2 text-[11px] uppercase tracking-[0.18em] opacity-70">
                      {message.role === "user" ? "Your Input" : "System Prompt"}
                    </div>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-3">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-emerald-500/5" />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your idea or evidence..."
                  className="relative min-h-[130px] w-full resize-none rounded-[20px] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm text-white outline-none transition focus:border-blue-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button whileTap={{ scale: 0.98 }} onClick={sendMessage} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
                  Send
                </motion.button>

                <motion.button whileTap={{ scale: 0.98 }} onClick={handleEnough} disabled={!hasUserMessages || loadingPaper} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
                  {loadingPaper ? "Building..." : "Enough"}
                </motion.button>

                <motion.button whileTap={{ scale: 0.98 }} onClick={resetAll} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Reset
                </motion.button>
              </div>

              <motion.div
                key={status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-slate-300"
              >
                {status || "Status will appear here."}
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">Paper Studio</h2>
                <p className="text-sm text-slate-400">Preview the paper and control advanced Word styling.</p>
              </div>

              <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === "preview" ? "bg-white text-slate-950" : "text-slate-300"}`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("formatting")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === "formatting" ? "bg-white text-slate-950" : "text-slate-300"}`}
                >
                  Formatting
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "preview" ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-[28px] border border-white/10 p-5"
                  style={{ background: "rgba(2,6,23,0.6)" }}
                >
                  {!paper ? (
                    <div className="flex h-[620px] items-center justify-center text-center text-sm text-slate-400">
                      Your research paper preview will appear here after you click Enough.
                    </div>
                  ) : (
                    <div
                      className="max-h-[620px] overflow-y-auto rounded-[20px] p-4"
                      style={{
                        background: "rgba(15,23,42,0.55)",
                        color: formatting.bodyColor,
                        fontFamily: formatting.fontFamily,
                        lineHeight: formatting.lineSpacing,
                        fontSize: `${formatting.bodyFontSize}px`,
                        textAlign: formatting.alignment as "left" | "center" | "justify"
                      }}
                    >
                      <div
                        className="mb-6 text-center"
                        style={{
                          fontSize: `${formatting.titleFontSize}px`,
                          color: formatting.titleColor,
                          fontWeight: 800,
                          fontFamily: formatting.fontFamily
                        }}
                      >
                        {paper.title}
                      </div>

                      {sectionHeading("Abstract", 1, formatting)}
                      <div>{paper.abstract}</div>

                      {sectionHeading("Keywords", 2, formatting)}
                      <div>{paper.keywords.join(", ")}</div>

                      {sectionHeading("Body Sections", 3, formatting)}
                      <div className="mb-2 text-slate-400">Preview with multi-level heading design</div>

                      {sectionHeading("Introduction", 1, formatting)}
                      <div>{paper.introduction}</div>

                      {sectionHeading("Literature Review", 1, formatting)}
                      <div>{paper.literatureReview}</div>

                      {sectionHeading("Methodology", 1, formatting)}
                      <div>{paper.methodology}</div>

                      {sectionHeading("Analysis", 1, formatting)}
                      <div>{paper.analysis}</div>

                      {sectionHeading("Discussion", 1, formatting)}
                      <div>{paper.discussion}</div>

                      {sectionHeading("Conclusion", 1, formatting)}
                      <div>{paper.conclusion}</div>

                      {sectionHeading("References", 1, formatting)}
                      <div className="whitespace-pre-wrap">{paper.references.join("\n")}</div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="formatting"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                    <label className="mb-2 block text-sm font-medium text-slate-300">Style Preset</label>
                    <select
                      onChange={(e) => applyPreset(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      defaultValue=""
                    >
                      <option value="" disabled>Select preset</option>
                      {presets.map((preset) => (
                        <option key={preset.name} value={preset.name} className="text-slate-950">
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4 md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300">File Name</label>
                      <input
                        value={formatting.fileName}
                        onChange={(e) => updateFormatting("fileName", e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Font Family</label>
                      <input
                        value={formatting.fontFamily}
                        onChange={(e) => updateFormatting("fontFamily", e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Alignment</label>
                      <select
                        value={formatting.alignment}
                        onChange={(e) => updateFormatting("alignment", e.target.value as PaperFormatting["alignment"])}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      >
                        <option value="left" className="text-slate-950">Left</option>
                        <option value="justify" className="text-slate-950">Justify</option>
                        <option value="center" className="text-slate-950">Center</option>
                      </select>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Title Size</label>
                      <input
                        type="number"
                        value={formatting.titleFontSize}
                        onChange={(e) => updateFormatting("titleFontSize", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Body Size</label>
                      <input
                        type="number"
                        value={formatting.bodyFontSize}
                        onChange={(e) => updateFormatting("bodyFontSize", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 1 Size</label>
                      <input
                        type="number"
                        value={formatting.heading1FontSize}
                        onChange={(e) => updateFormatting("heading1FontSize", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 2 Size</label>
                      <input
                        type="number"
                        value={formatting.heading2FontSize}
                        onChange={(e) => updateFormatting("heading2FontSize", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 3 Size</label>
                      <input
                        type="number"
                        value={formatting.heading3FontSize}
                        onChange={(e) => updateFormatting("heading3FontSize", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Line Spacing</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.lineSpacing}
                        onChange={(e) => updateFormatting("lineSpacing", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Paragraph Spacing</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.paragraphSpacing}
                        onChange={(e) => updateFormatting("paragraphSpacing", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Top Margin</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.marginTop}
                        onChange={(e) => updateFormatting("marginTop", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Right Margin</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.marginRight}
                        onChange={(e) => updateFormatting("marginRight", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Bottom Margin</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.marginBottom}
                        onChange={(e) => updateFormatting("marginBottom", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Left Margin</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formatting.marginLeft}
                        onChange={(e) => updateFormatting("marginLeft", Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Title Color</label>
                      <input
                        type="color"
                        value={formatting.titleColor}
                        onChange={(e) => updateFormatting("titleColor", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 1 Color</label>
                      <input
                        type="color"
                        value={formatting.heading1Color}
                        onChange={(e) => updateFormatting("heading1Color", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 2 Color</label>
                      <input
                        type="color"
                        value={formatting.heading2Color}
                        onChange={(e) => updateFormatting("heading2Color", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Heading 3 Color</label>
                      <input
                        type="color"
                        value={formatting.heading3Color}
                        onChange={(e) => updateFormatting("heading3Color", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Body Color</label>
                      <input
                        type="color"
                        value={formatting.bodyColor}
                        onChange={(e) => updateFormatting("bodyColor", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300">Page Background</label>
                      <input
                        type="color"
                        value={formatting.pageBackground}
                        onChange={(e) => updateFormatting("pageBackground", e.target.value)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={formatting.boldHeadings}
                        onChange={(e) => updateFormatting("boldHeadings", e.target.checked)}
                        className="h-5 w-5"
                      />
                      Bold headings
                    </label>

                    <label className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={formatting.uppercaseHeadings}
                        onChange={(e) => updateFormatting("uppercaseHeadings", e.target.checked)}
                        className="h-5 w-5"
                      />
                      Uppercase headings
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              disabled={!paper || downloading}
              className="mt-4 w-full rounded-[24px] bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-4 text-sm font-bold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Preparing Word File..." : "Download Word File"}
            </motion.button>
          </motion.section>
        </div>
      </div>
    </main>
  )
}