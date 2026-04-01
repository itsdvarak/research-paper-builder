"use client"

import { useMemo, useRef, useState } from "react"
import { ChatMessage, PaperFormatting, ResearchPaper } from "@/lib/types"

const defaultFormatting: PaperFormatting = {
  fileName: "research-paper",
  fontFamily: "Times New Roman",
  bodyFontSize: 12,
  headingFontSize: 14,
  titleFontSize: 16,
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

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", text: value },
      { role: "assistant", text: "Evidence?" }
    ]

    setMessages(next)
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
        throw new Error(data.error || "Failed")
      }

      setPaper(data.paper)
      setStatus("Research paper ready. Set formatting and download.")
    } catch (e) {
      setStatus("Failed to generate research paper.")
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
        throw new Error(data.error || "Failed")
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
      setStatus("Failed to create Word document.")
    } finally {
      setDownloading(false)
    }
  }

  function updateFormatting<K extends keyof PaperFormatting>(key: K, value: PaperFormatting[K]) {
    setFormatting((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="page">
      <h1 className="title">Evidence-First Research Paper Builder</h1>
      <p className="sub">
        Enter ideas freely. The app keeps asking for evidence. When ready, it turns your notes into a research paper and exports it as a Word document.
      </p>

      <div className="grid">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Chat</h2>

          <div className="chatBox" ref={chatRef}>
            {messages.length === 0 && (
              <div className="msg assistant">Start with any idea. I will ask: Evidence?</div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`msg ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div style={{ height: 12 }} />

          <div className="row">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your idea or evidence"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage()
              }}
            />
            <button className="btn secondary" onClick={sendMessage}>
              Send
            </button>
          </div>

          <div style={{ height: 12 }} />

          <div className="row">
            <button className="btn primary" onClick={handleEnough} disabled={!hasUserMessages || loadingPaper}>
              {loadingPaper ? "Building..." : "Enough"}
            </button>
            <button
              className="btn dark"
              onClick={() => {
                setMessages([])
                setPaper(null)
                setStatus("")
              }}
            >
              Reset
            </button>
          </div>

          {status && <div className="status">{status}</div>}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Paper + Word Formatting</h2>

          {!paper && (
            <div className="preview">
              Your research paper will appear here after you click Enough.
            </div>
          )}

          {paper && (
            <>
              <div className="preview">
                <strong>{paper.title}</strong>

                {"\n\n"}Abstract{"\n"}
                {paper.abstract}

                {"\n\n"}Keywords{"\n"}
                {paper.keywords.join(", ")}

                {"\n\n"}Introduction{"\n"}
                {paper.introduction}

                {"\n\n"}Literature Review{"\n"}
                {paper.literatureReview}

                {"\n\n"}Methodology{"\n"}
                {paper.methodology}

                {"\n\n"}Analysis{"\n"}
                {paper.analysis}

                {"\n\n"}Discussion{"\n"}
                {paper.discussion}

                {"\n\n"}Conclusion{"\n"}
                {paper.conclusion}

                {"\n\n"}References{"\n"}
                {paper.references.join("\n")}
              </div>

              <label className="label">File Name</label>
              <input
                className="input"
                value={formatting.fileName}
                onChange={(e) => updateFormatting("fileName", e.target.value)}
              />

              <div className="formGrid">
                <div>
                  <label className="label">Font Family</label>
                  <input
                    className="input"
                    value={formatting.fontFamily}
                    onChange={(e) => updateFormatting("fontFamily", e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Alignment</label>
                  <select
                    className="input"
                    value={formatting.alignment}
                    onChange={(e) => updateFormatting("alignment", e.target.value as PaperFormatting["alignment"])}
                  >
                    <option value="left">Left</option>
                    <option value="justify">Justify</option>
                    <option value="center">Center</option>
                  </select>
                </div>

                <div>
                  <label className="label">Body Font Size</label>
                  <input
                    className="input"
                    type="number"
                    value={formatting.bodyFontSize}
                    onChange={(e) => updateFormatting("bodyFontSize", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Heading Font Size</label>
                  <input
                    className="input"
                    type="number"
                    value={formatting.headingFontSize}
                    onChange={(e) => updateFormatting("headingFontSize", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Title Font Size</label>
                  <input
                    className="input"
                    type="number"
                    value={formatting.titleFontSize}
                    onChange={(e) => updateFormatting("titleFontSize", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Line Spacing</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.lineSpacing}
                    onChange={(e) => updateFormatting("lineSpacing", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Paragraph Spacing</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.paragraphSpacing}
                    onChange={(e) => updateFormatting("paragraphSpacing", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Top Margin</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.marginTop}
                    onChange={(e) => updateFormatting("marginTop", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Right Margin</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.marginRight}
                    onChange={(e) => updateFormatting("marginRight", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Bottom Margin</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.marginBottom}
                    onChange={(e) => updateFormatting("marginBottom", Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="label">Left Margin</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={formatting.marginLeft}
                    onChange={(e) => updateFormatting("marginLeft", Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ height: 14 }} />

              <button className="btn primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? "Preparing..." : "Download Word File"}
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  )
}