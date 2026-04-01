import ollama from "ollama"

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

export async function generateResearchPaper(messages: string[]): Promise<ResearchPaper> {
    const prompt = `
Convert these notes into a structured research paper.

Return ONLY valid JSON.
No markdown.
No code fences.

Use this exact shape:
{
  "title": "string",
  "abstract": "string",
  "keywords": ["string"],
  "introduction": "string",
  "literatureReview": "string",
  "methodology": "string",
  "analysis": "string",
  "discussion": "string",
  "conclusion": "string",
  "references": ["string"]
}

Notes:
${messages.map((m, i) => `${i + 1}. ${m}`).join("\n")}
`

    const response = await ollama.chat({
        model: "gemma3",
        stream: false,
        messages: [
            { role: "system", content: "Return strict JSON only." },
            { role: "user", content: prompt }
        ]
    })

    const raw = response.message.content || ""

    let jsonText = raw

    if (raw.includes("```")) {
        jsonText = raw.replace(/```json|```/g, "").trim()
    }

    try {
        return JSON.parse(jsonText)
    } catch {
        return {
            title: "Error generating paper",
            abstract: raw,
            keywords: [],
            introduction: raw,
            literatureReview: "",
            methodology: "",
            analysis: "",
            discussion: "",
            conclusion: "",
            references: []
        }
    }
}