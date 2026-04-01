import { NextResponse } from "next/server"
import { buildPaperDocx } from "@/lib/docx"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const paper = body.paper
        const formatting = body.formatting

        if (!paper || !formatting) {
            return NextResponse.json({ error: "Paper and formatting are required" }, { status: 400 })
        }

        const buffer = await buildPaperDocx(paper, formatting)
        const fileName = `${formatting.fileName || "research-paper"}.docx`

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${fileName}"`
            }
        })
    } catch (error) {
        return NextResponse.json({ error: "Failed to export docx" }, { status: 500 })
    }
}