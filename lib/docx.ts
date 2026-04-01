import {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    PageMargin,
    Paragraph,
    TextRun
} from "docx"
import { PaperFormatting, ResearchPaper } from "@/lib/types"

function pxToHalfPoints(size: number) {
    return Math.round(size * 2)
}

function spacingValue(value: number) {
    return Math.round(value * 240)
}

function marginValue(value: number) {
    return Math.round(value * 567)
}

function mapAlignment(value: PaperFormatting["alignment"]) {
    if (value === "center") return AlignmentType.CENTER
    if (value === "justify") return AlignmentType.JUSTIFIED
    return AlignmentType.LEFT
}

function para(text: string, formatting: PaperFormatting) {
    return new Paragraph({
        alignment: mapAlignment(formatting.alignment),
        spacing: {
            after: spacingValue(formatting.paragraphSpacing),
            line: spacingValue(formatting.lineSpacing)
        },
        children: [
            new TextRun({
                text,
                font: formatting.fontFamily,
                size: pxToHalfPoints(formatting.bodyFontSize)
            })
        ]
    })
}

function heading(text: string, formatting: PaperFormatting) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: {
            before: 240,
            after: 180
        },
        children: [
            new TextRun({
                text,
                bold: true,
                font: formatting.fontFamily,
                size: pxToHalfPoints(formatting.headingFontSize)
            })
        ]
    })
}

export async function buildPaperDocx(paper: ResearchPaper, formatting: PaperFormatting) {
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: marginValue(formatting.marginTop),
                            right: marginValue(formatting.marginRight),
                            bottom: marginValue(formatting.marginBottom),
                            left: marginValue(formatting.marginLeft)
                        } as PageMargin
                    }
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 240 },
                        children: [
                            new TextRun({
                                text: paper.title,
                                bold: true,
                                font: formatting.fontFamily,
                                size: pxToHalfPoints(formatting.titleFontSize)
                            })
                        ]
                    }),
                    heading("Abstract", formatting),
                    para(paper.abstract, formatting),
                    heading("Keywords", formatting),
                    para(paper.keywords.join(", "), formatting),
                    heading("Introduction", formatting),
                    para(paper.introduction, formatting),
                    heading("Literature Review", formatting),
                    para(paper.literatureReview, formatting),
                    heading("Methodology", formatting),
                    para(paper.methodology, formatting),
                    heading("Analysis", formatting),
                    para(paper.analysis, formatting),
                    heading("Discussion", formatting),
                    para(paper.discussion, formatting),
                    heading("Conclusion", formatting),
                    para(paper.conclusion, formatting),
                    heading("References", formatting),
                    ...paper.references.map((ref) => para(ref, formatting))
                ]
            }
        ]
    })

    return Packer.toBuffer(doc)
}