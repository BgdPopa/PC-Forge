from pathlib import Path
from html import escape

from docx import Document
from docx.oxml.ns import qn
from docx.table import Table as DocxTable
from docx.text.paragraph import Paragraph as DocxParagraph
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    CondPageBreak,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "documentatie" / "Ghid_prezentare_PC_Forge_Etapele_5_8_si_10.docx"
OUTPUT = Path.home() / "Desktop" / "Ghid_prezentare_PC_Forge_Etapele_5_8_si_10.pdf"

RED = colors.HexColor("#E1012F")
DARK_RED = colors.HexColor("#9E0022")
DARK = colors.HexColor("#242428")
GRAY = colors.HexColor("#5F6368")
LIGHT = colors.HexColor("#F5F6F8")
PINK = colors.HexColor("#FDE8ED")
WHITE = colors.white


def register_fonts():
    font_dir = Path("C:/Windows/Fonts")
    variants = {
        "GuideSans": "arial.ttf",
        "GuideSans-Bold": "arialbd.ttf",
        "GuideSans-Italic": "ariali.ttf",
        "GuideSans-BoldItalic": "arialbi.ttf",
        "GuideMono": "consola.ttf",
    }
    for name, filename in variants.items():
        path = font_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Font lipsa: {path}")
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(
        "GuideSans",
        normal="GuideSans",
        bold="GuideSans-Bold",
        italic="GuideSans-Italic",
        boldItalic="GuideSans-BoldItalic",
    )


def make_styles():
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "GuideBody", parent=base["BodyText"], fontName="GuideSans",
            fontSize=10.2, leading=13.2, textColor=DARK, spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "GuideH1", parent=base["Heading1"], fontName="GuideSans-Bold",
            fontSize=16, leading=19, textColor=RED, spaceBefore=14,
            spaceAfter=8, keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "GuideH2", parent=base["Heading2"], fontName="GuideSans-Bold",
            fontSize=13, leading=16, textColor=RED, spaceBefore=11,
            spaceAfter=6, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "GuideH3", parent=base["Heading3"], fontName="GuideSans-Bold",
            fontSize=11.5, leading=14, textColor=DARK_RED, spaceBefore=8,
            spaceAfter=5, keepWithNext=True,
        ),
        "bullet": ParagraphStyle(
            "GuideBullet", parent=base["BodyText"], fontName="GuideSans",
            fontSize=10.1, leading=13, textColor=DARK, leftIndent=18,
            firstLineIndent=-9, bulletIndent=0, spaceAfter=4,
        ),
        "number": ParagraphStyle(
            "GuideNumber", parent=base["BodyText"], fontName="GuideSans",
            fontSize=10.1, leading=13, textColor=DARK, leftIndent=22,
            firstLineIndent=-14, bulletIndent=0, spaceAfter=4,
        ),
        "code": ParagraphStyle(
            "GuideCode", parent=base["Code"], fontName="GuideMono",
            fontSize=8.1, leading=10.2, textColor=DARK, backColor=LIGHT,
            leftIndent=10, rightIndent=6, borderPadding=7, spaceBefore=3,
            spaceAfter=8, splitLongWords=True,
        ),
        "callout": ParagraphStyle(
            "GuideCallout", parent=base["BodyText"], fontName="GuideSans",
            fontSize=9.8, leading=12.5, textColor=DARK, backColor=PINK,
            borderColor=RED, borderWidth=1.2, borderPadding=8,
            leftIndent=4, rightIndent=2, spaceBefore=12, spaceAfter=9,
        ),
        "cover_kicker": ParagraphStyle(
            "CoverKicker", parent=base["Normal"], fontName="GuideSans-Bold",
            fontSize=11, leading=14, textColor=RED, alignment=TA_CENTER,
            spaceBefore=80, spaceAfter=14,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Title"], fontName="GuideSans-Bold",
            fontSize=31, leading=36, textColor=DARK, alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle", parent=base["Normal"], fontName="GuideSans",
            fontSize=14, leading=18, textColor=GRAY, alignment=TA_CENTER,
            spaceAfter=36,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta", parent=base["Normal"], fontName="GuideSans",
            fontSize=10.5, leading=14, textColor=GRAY, alignment=TA_CENTER,
            spaceAfter=8,
        ),
        "table_head": ParagraphStyle(
            "TableHead", parent=base["Normal"], fontName="GuideSans-Bold",
            fontSize=8.2, leading=10, textColor=WHITE,
        ),
        "table_body": ParagraphStyle(
            "TableBody", parent=base["Normal"], fontName="GuideSans",
            fontSize=8.1, leading=10.2, textColor=DARK,
        ),
    }


def iter_blocks(parent):
    parent_elm = parent.element.body
    for child in parent_elm.iterchildren():
        if child.tag == qn("w:p"):
            yield DocxParagraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield DocxTable(child, parent)


def paragraph_markup(paragraph):
    pieces = []
    for run in paragraph.runs:
        value = escape(run.text).replace("\n", "<br/>")
        if not value:
            continue
        is_mono = (run.font.name or "") == "Consolas"
        if is_mono:
            value = f'<font name="GuideMono">{value}</font>'
        if run.bold:
            value = f"<b>{value}</b>"
        if run.italic:
            value = f"<i>{value}</i>"
        pieces.append(value)
    return "".join(pieces) or escape(paragraph.text)


def has_page_break(paragraph):
    return bool(paragraph._p.xpath('.//w:br[@w:type="page"]'))


def has_shading(paragraph):
    p_pr = paragraph._p.pPr
    return p_pr is not None and p_pr.find(qn("w:shd")) is not None


def docx_table_to_pdf(table, styles, usable_width):
    col_count = len(table.rows[0].cells)
    grid = table._tbl.tblGrid
    dxa_widths = []
    if grid is not None:
        for col in grid.findall(qn("w:gridCol")):
            dxa_widths.append(int(col.get(qn("w:w"), "0")))
    if len(dxa_widths) != col_count or sum(dxa_widths) <= 0:
        dxa_widths = [1] * col_count
    total = sum(dxa_widths)
    widths = [usable_width * value / total for value in dxa_widths]

    data = []
    for row_index, row in enumerate(table.rows):
        values = []
        for cell in row.cells:
            text = "<br/>".join(escape(p.text) for p in cell.paragraphs if p.text)
            values.append(Paragraph(text, styles["table_head" if row_index == 0 else "table_body"]))
        data.append(values)

    result = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), RED),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#D7D9DE")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFB")]),
    ]))
    return result


class GuideDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="content",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(PageTemplate(id="guide", frames=[frame], onPage=self.draw_page))

    def draw_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("GuideSans-Bold", 7.8)
        canvas.setFillColor(GRAY)
        canvas.drawString(doc.leftMargin, LETTER[1] - 0.55 * inch, "PC FORGE  |  GHID DE PREZENTARE")
        canvas.setFont("GuideSans", 8)
        canvas.drawRightString(LETTER[0] - doc.rightMargin, 0.48 * inch, f"Pagina {doc.page}")
        canvas.restoreState()


def build_pdf():
    register_fonts()
    styles = make_styles()
    source = Document(SOURCE)
    pdf = GuideDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        leftMargin=0.78 * inch,
        rightMargin=0.78 * inch,
        topMargin=0.76 * inch,
        bottomMargin=0.72 * inch,
        title="Ghid de prezentare PC Forge - Etapele 5-8",
        author="Popa Bogdan",
        subject="Explicarea cerintelor si implementarii proiectului PC Forge",
    )

    story = []
    number_counter = 0
    cover_paragraph_index = 0

    for block in iter_blocks(source):
        if isinstance(block, DocxTable):
            story.append(docx_table_to_pdf(block, styles, pdf.width))
            story.append(Spacer(1, 7))
            number_counter = 0
            continue

        if has_page_break(block):
            story.append(PageBreak())
            number_counter = 0
            continue

        text = block.text.strip()
        if not text:
            continue

        style_name = block.style.name
        markup = paragraph_markup(block)

        if style_name == "Heading 1":
            story.append(Paragraph(markup, styles["h1"]))
            number_counter = 0
        elif style_name == "Heading 2":
            # DOCUMENTAȚIE ETAPELE 5-8 ȘI 10: rezervăm loc pentru titlu și începutul explicației,
            # evitând ca primul cuvânt al paragrafului să rămână singur sub marginea paginii.
            story.append(CondPageBreak(1.15 * inch))
            story.append(Paragraph(markup, styles["h2"]))
            number_counter = 0
        elif style_name == "Heading 3":
            story.append(Paragraph(markup, styles["h3"]))
            number_counter = 0
        elif style_name.startswith("List Bullet"):
            story.append(Paragraph(markup, styles["bullet"], bulletText="•"))
            number_counter = 0
        elif style_name == "List Number":
            number_counter += 1
            story.append(Paragraph(markup, styles["number"], bulletText=f"{number_counter}."))
        elif any((run.font.name or "") == "Consolas" for run in block.runs):
            story.append(Paragraph(markup, styles["code"]))
            number_counter = 0
        elif has_shading(block):
            story.append(Paragraph(markup, styles["callout"]))
            number_counter = 0
        elif cover_paragraph_index == 0 and text == "GHID DE PREZENTARE":
            story.append(Paragraph(markup, styles["cover_kicker"]))
            cover_paragraph_index += 1
        elif cover_paragraph_index == 1 and text == "PC Forge":
            story.append(Paragraph(markup, styles["cover_title"]))
            cover_paragraph_index += 1
        elif cover_paragraph_index == 2:
            story.append(Paragraph(markup, styles["cover_subtitle"]))
            cover_paragraph_index += 1
        elif cover_paragraph_index in (3, 4):
            story.append(Paragraph(markup, styles["cover_meta"]))
            cover_paragraph_index += 1
        else:
            # DOCUMENTAȚIE ETAPELE 5-8 ȘI 10: păstrăm fiecare explicație scurtă pe aceeași pagină,
            # ca etichete precum „Ce am făcut” să nu rămână singure la finalul paginii anterioare.
            story.append(KeepTogether([Paragraph(markup, styles["body"])]))
            number_counter = 0

    pdf.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
