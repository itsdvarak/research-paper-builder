"use client"

import { useMemo, useRef, useState } from "react"

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

type ResearchPaper = {
  title: string
  abstract: string
  keywords: string[]
  introduction: string
  literatureReview: string
  methodology: string
  analysis: string
  discussion: string
  conclusion: string
  references: string[]
}

type PaperFormatting = {
  fileName: string
  fontFamily: string
  bodyFontSize: number
  headingFontSize: number
  titleFontSize: number
  lineSpacing: number
  paragraphSpacing: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  alignment: "left" | "justify" | "center"
}

const defaultFormatting: PaperFormatting = {
  fileName: "research-paper",
  fontFamily: "Times New Roman",
  bodyFontSize: 12,
  headingFontSize: 14,
  titleFontSize: 18,
  lineSpacing: 1.5,
  paragraphSpacing: 0.5,
  marginTop: 1,
  marginRight: 1,
  marginBottom: 1,
  marginLeft: 1,
  alignment: "justify"
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [paper, setPaper] = useState<ResearchPaper | null>(null)
  const [formatting, setFormatting] = useState<PaperFormatting>(defaultFormatting)
  const [loadingPaper, setLoadingPaper] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [status, setStatus] = useState("")
  const chatRef = useRef<HTMLDivElement | null>(null)

  const hasUserMessages = useMemo(() => messages.some((m) => m.role === "user"), [messages])

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
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Evidence-First Research Paper Builder</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-400">
                Start with any idea. The app keeps asking for evidence. When you click Enough, all your messages are turned into a research paper, then exported into a Word document with your chosen formatting.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Chat → Evidence → AI Paper → Word Download
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Chat</h2>
                <p className="text-sm text-slate-400">Enter ideas and evidence. The app always asks for more evidence.</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300">
                {messages.filter((m) => m.role === "user").length} user messages
              </div>
            </div>

            <div
              ref={chatRef}
              className="flex h-[520px] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              {messages.length === 0 && (
                <div className="mx-auto my-auto max-w-md rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center">
                  <div className="mb-2 text-lg font-semibold text-slate-200">Start typing your idea</div>
                  <div className="text-sm text-slate-400">Every time you send a message, the system replies with: Evidence?</div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${message.role === "user"
                      ? "self-end bg-blue-600 text-white"
                      : "self-start border border-slate-700 bg-slate-800 text-slate-100"
                    }`}
                >
                  <div className="mb-1 text-[11px] uppercase tracking-wider opacity-70">
                    {message.role === "user" ? "You" : "System"}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{message.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your idea or evidence..."
                className="min-h-[110px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={sendMessage}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Send
                </button>

                <button
                  onClick={handleEnough}
                  disabled={!hasUserMessages || loadingPaper}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingPaper ? "Building..." : "Enough"}
                </button>

                <button
                  onClick={resetAll}
                  className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
                >
                  Reset
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
                {status || "Status will appear here."}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Paper + Word Formatting</h2>
              <p className="text-sm text-slate-400">Preview the generated paper and choose formatting for the downloadable Word file.</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              {!paper ? (
                <div className="flex h-[280px] items-center justify-center text-center text-sm text-slate-400">
                  Your research paper preview will appear here after you click Enough.
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  <div className="mb-5 text-center text-2xl font-bold">{paper.title}</div>

                  <div className="mb-2 text-lg font-semibold">Abstract</div>
                  <div className="mb-5">{paper.abstract}</div>

                  <div className="mb-2 text-lg font-semibold">Keywords</div>
                  <div className="mb-5">{paper.keywords.join(", ")}</div>

                  <div className="mb-2 text-lg font-semibold">Introduction</div>
                  <div className="mb-5">{paper.introduction}</div>

                  <div className="mb-2 text-lg font-semibold">Literature Review</div>
                  <div className="mb-5">{paper.literatureReview}</div>

                  <div className="mb-2 text-lg font-semibold">Methodology</div>
                  <div className="mb-5">{paper.methodology}</div>

                  <div className="mb-2 text-lg font-semibold">Analysis</div>
                  <div className="mb-5">{paper.analysis}</div>

                  <div className="mb-2 text-lg font-semibold">Discussion</div>
                  <div className="mb-5">{paper.discussion}</div>

                  <div className="mb-2 text-lg font-semibold">Conclusion</div>
                  <div className="mb-5">{paper.conclusion}</div>

                  <div className="mb-2 text-lg font-semibold">References</div>
                  <div>{paper.references.join("\n")}</div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">File Name</label>
                <input
                  value={formatting.fileName}
                  onChange={(e) => updateFormatting("fileName", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Font Family</label>
                <input
                  value={formatting.fontFamily}
                  onChange={(e) => updateFormatting("fontFamily", e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Alignment</label>
                <select
                  value={formatting.alignment}
                  onChange={(e) => updateFormatting("alignment", e.target.value as PaperFormatting["alignment"])}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="justify">Justify</option>
                  <option value="center">Center</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Body Font Size</label>
                <input
                  type="number"
                  value={formatting.bodyFontSize}
                  onChange={(e) => updateFormatting("bodyFontSize", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Heading Font Size</label>
                <input
                  type="number"
                  value={formatting.headingFontSize}
                  onChange={(e) => updateFormatting("headingFontSize", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Title Font Size</label>
                <input
                  type="number"
                  value={formatting.titleFontSize}
                  onChange={(e) => updateFormatting("titleFontSize", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Line Spacing</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.lineSpacing}
                  onChange={(e) => updateFormatting("lineSpacing", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Paragraph Spacing</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.paragraphSpacing}
                  onChange={(e) => updateFormatting("paragraphSpacing", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Top Margin</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.marginTop}
                  onChange={(e) => updateFormatting("marginTop", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Right Margin</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.marginRight}
                  onChange={(e) => updateFormatting("marginRight", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Bottom Margin</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.marginBottom}
                  onChange={(e) => updateFormatting("marginBottom", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Left Margin</label>
                <input
                  type="number"
                  step="0.1"
                  value={formatting.marginLeft}
                  onChange={(e) => updateFormatting("marginLeft", Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleDownload}
              disabled={!paper || downloading}
              className="mt-4 w-full rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? "Preparing Word File..." : "Download Word File"}
            </button>
          </section>
        </div>
      </div>
    </main>
  )
}