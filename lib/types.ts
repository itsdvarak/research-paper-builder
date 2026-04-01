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
    heading1FontSize: number
    heading2FontSize: number
    heading3FontSize: number
    titleFontSize: number
    lineSpacing: number
    paragraphSpacing: number
    marginTop: number
    marginRight: number
    marginBottom: number
    marginLeft: number
    alignment: "left" | "justify" | "center"
    titleColor: string
    heading1Color: string
    heading2Color: string
    heading3Color: string
    bodyColor: string
    pageBackground: string
    boldHeadings: boolean
    uppercaseHeadings: boolean
}