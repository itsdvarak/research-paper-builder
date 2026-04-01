import { NextResponse } from "next/server"
import { generateResearchPaper } from "@/lib/ai"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const messages = Array.isArray(body.messages) ? body.messages : []

        if (!messages.length) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 })
        }

        const userMessages = messages
            .filter((m: { role?: string; text?: string }) => m.role === "user" && typeof m.text === "string")
            .map((m: { text: string }) => m.text)

        if (!userMessages.length) {
            return NextResponse.json({ error: "No user evidence found" }, { status: 400 })
        }

        const paper = await generateResearchPaper(userMessages)

        return NextResponse.json({ paper })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate research paper"
        console.error("Research API Error:", message)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}