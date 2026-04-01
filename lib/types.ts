export type ChatMessage = {
    role: "user" | "assistant"
    text: string
}

export type ResearchPaper = {
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

export type PaperFormatting = {
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