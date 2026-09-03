from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
CAPTURES = ROOT / "documentatie" / "capturi-ghid-vizual"
OUTPUT = Path.home() / "Desktop" / "Ghid_vizual_pentru_prezentarea_PC_Forge.pdf"

RED = colors.HexColor("#E1012F")
DARK_RED = colors.HexColor("#84051F")
INK = colors.HexColor("#25252B")
MUTED = colors.HexColor("#666872")
LIGHT = colors.HexColor("#F4F4F7")
PINK = colors.HexColor("#FFF0F4")
GREEN = colors.HexColor("#176B4D")
BLUE = colors.HexColor("#225C91")
WHITE = colors.white


def register_fonts():
    fonts = Path("C:/Windows/Fonts")
    mapping = {
        "Guide": "arial.ttf",
        "Guide-Bold": "arialbd.ttf",
        "Guide-Italic": "ariali.ttf",
        "GuideMono": "consola.ttf",
    }
    for name, filename in mapping.items():
        pdfmetrics.registerFont(TTFont(name, str(fonts / filename)))
    pdfmetrics.registerFontFamily("Guide", normal="Guide", bold="Guide-Bold", italic="Guide-Italic")


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle("cover_kicker", parent=base["Normal"], fontName="Guide-Bold", fontSize=10,
                                         leading=13, textColor=RED, alignment=TA_CENTER, spaceAfter=16),
        "cover_title": ParagraphStyle("cover_title", parent=base["Title"], fontName="Guide-Bold", fontSize=30,
                                        leading=34, textColor=INK, alignment=TA_CENTER, spaceAfter=12),
        "cover_sub": ParagraphStyle("cover_sub", parent=base["Normal"], fontName="Guide", fontSize=14,
                                      leading=19, textColor=MUTED, alignment=TA_CENTER, spaceAfter=22),
        "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Guide-Bold", fontSize=22,
                               leading=26, textColor=RED, spaceAfter=10),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Guide-Bold", fontSize=15,
                               leading=18, textColor=DARK_RED, spaceBefore=8, spaceAfter=5, keepWithNext=True),
        "h3": ParagraphStyle("h3", parent=base["Heading3"], fontName="Guide-Bold", fontSize=11.5,
                               leading=14, textColor=INK, spaceBefore=5, spaceAfter=3, keepWithNext=True),
        "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Guide", fontSize=10.7,
                                 leading=14.4, textColor=INK, spaceAfter=6),
        "small": ParagraphStyle("small", parent=base["BodyText"], fontName="Guide", fontSize=9.1,
                                  leading=12, textColor=MUTED, spaceAfter=4),
        "callout": ParagraphStyle("callout", parent=base["BodyText"], fontName="Guide", fontSize=10.4,
                                    leading=14, textColor=INK, backColor=PINK, borderColor=RED,
                                    borderWidth=1, borderPadding=8, spaceBefore=7, spaceAfter=8),
        "memory": ParagraphStyle("memory", parent=base["BodyText"], fontName="Guide-Bold", fontSize=10.5,
                                   leading=14, textColor=WHITE, backColor=DARK_RED, borderPadding=9,
                                   spaceBefore=6, spaceAfter=8),
        "code": ParagraphStyle("code", parent=base["Code"], fontName="GuideMono", fontSize=7.8,
                                 leading=10, textColor=INK, backColor=LIGHT, borderColor=colors.HexColor("#D8D8DE"),
                                 borderWidth=.7, borderPadding=8, leftIndent=4, rightIndent=4,
                                 spaceBefore=5, spaceAfter=8, splitLongWords=True),
        "card_title": ParagraphStyle("card_title", parent=base["Normal"], fontName="Guide-Bold", fontSize=10,
                                       leading=12, textColor=DARK_RED, spaceAfter=2),
        "card_body": ParagraphStyle("card_body", parent=base["Normal"], fontName="Guide", fontSize=8.8,
                                      leading=11.3, textColor=INK),
        "flow": ParagraphStyle("flow", parent=base["Normal"], fontName="Guide-Bold", fontSize=9.2,
                                 leading=11, textColor=INK, alignment=TA_CENTER),
        "question": ParagraphStyle("question", parent=base["Normal"], fontName="Guide-Bold", fontSize=10.4,
                                     leading=13.5, textColor=DARK_RED, spaceAfter=2),
    }


S = None


def p(text, style="body"):
    return Paragraph(text, S[style])


def page_title(story, stage, title, intro=None):
    story.append(p(stage.upper(), "small"))
    story.append(p(title, "h1"))
    if intro:
        story.append(p(intro, "body"))


def callout(story, label, text):
    story.append(p(f"<b>{escape(label)}:</b> {text}", "callout"))


def memory(story, text):
    story.append(p(f"IDEA DE ȚINUT MINTE · {text}", "memory"))


def code(story, text):
    story.append(Paragraph(escape(text).replace("\n", "<br/>"), S["code"]))


def flow(story, labels, color=RED):
    cells = []
    for i, label in enumerate(labels):
        cells.append(Paragraph(escape(label), S["flow"]))
        if i < len(labels) - 1:
            cells.append(Paragraph("→", S["flow"]))
    widths = []
    usable = 17.2 * cm
    arrow_width = .55 * cm
    box_width = (usable - arrow_width * (len(labels) - 1)) / len(labels)
    for i in range(len(cells)):
        widths.append(arrow_width if i % 2 else box_width)
    table = Table([cells], colWidths=widths, hAlign="CENTER")
    style = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 4),
             ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 8),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]
    for i in range(0, len(cells), 2):
        style.extend([("BACKGROUND", (i, 0), (i, 0), colors.Color(color.red, color.green, color.blue, alpha=.10)),
                      ("BOX", (i, 0), (i, 0), 1, color)])
    table.setStyle(TableStyle(style))
    story.append(table)
    story.append(Spacer(1, 9))


def cards(story, items, columns=2):
    data = []
    for start in range(0, len(items), columns):
        row = []
        for title, body in items[start:start + columns]:
            content = [Paragraph(escape(title), S["card_title"]), Paragraph(body, S["card_body"])]
            row.append(content)
        while len(row) < columns:
            row.append("")
        data.append(row)
    width = 17.2 * cm / columns
    table = Table(data, colWidths=[width] * columns, hAlign="CENTER")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), .6, colors.HexColor("#D7D7DD")),
        ("INNERGRID", (0, 0), (-1, -1), .6, colors.HexColor("#D7D7DD")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(table)
    story.append(Spacer(1, 7))


def screenshot(story, filename, caption, max_h=9.2 * cm):
    path = CAPTURES / filename
    if not path.exists():
        story.append(p(f"Captura «{escape(caption)}» nu a fost găsită.", "small"))
        return
    img = Image(str(path))
    max_w = 17.2 * cm
    scale = min(max_w / img.imageWidth, max_h / img.imageHeight)
    img.drawWidth = img.imageWidth * scale
    img.drawHeight = img.imageHeight * scale
    img.hAlign = "CENTER"
    story.append(img)
    story.append(p(caption, "small"))


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=1.7 * cm, rightMargin=1.7 * cm,
                         topMargin=1.6 * cm, bottomMargin=1.5 * cm,
                         title="Ghid vizual pentru prezentarea PC Forge", author="Popa Bogdan")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates(PageTemplate(id="guide", frames=[frame], onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Guide-Bold", 7.8)
        canvas.setFillColor(MUTED)
        canvas.drawString(doc.leftMargin, A4[1] - .75 * cm, "PC FORGE  |  GHID VIZUAL DE PREZENTARE")
        canvas.setStrokeColor(colors.HexColor("#E5E5E8"))
        canvas.line(doc.leftMargin, A4[1] - .88 * cm, A4[0] - doc.rightMargin, A4[1] - .88 * cm)
        canvas.setFont("Guide", 8)
        canvas.drawRightString(A4[0] - doc.rightMargin, .62 * cm, f"Pagina {doc.page}")
        canvas.restoreState()


def build_story():
    story = []

    story += [Spacer(1, 2.1 * cm), p("PC FORGE · RECAPITULARE ÎNAINTE DE PREZENTARE", "cover_kicker"),
              p("Ghid vizual de înțelegere", "cover_title"),
              p("Etapele 5, 6, 7, 8 și 10 explicate ca o poveste tehnică, cu imagini reale, cod și formulări pentru profesoară.", "cover_sub")]
    flow(story, ["Ce vede utilizatorul", "Ce face JavaScript", "Ce decide serverul", "Ce păstrează baza"])
    story += [Spacer(1, 1.0 * cm), p("Popa Bogdan", "cover_sub"),
              p("Citește câte 2-3 pagini, apoi încearcă să explici cu voce tare fără să te uiți.", "callout"), PageBreak()]

    page_title(story, "Înainte să începi", "Povestea proiectului în 60 de secunde",
               "PC Forge nu este doar o colecție de pagini. Browserul afișează interfața, JavaScript reacționează la utilizator, Express decide ce date sunt necesare, EJS generează HTML, iar PostgreSQL păstrează informația persistentă.")
    flow(story, ["Browser", "Rută Express", "Query parametrizat", "PostgreSQL", "EJS / JSON"])
    story.append(p("Când utilizatorul deschide <b>/produse</b>, serverul cere produsele din bază și trimite rezultatul către un template EJS. EJS creează cardurile. Apoi JavaScript poate ascunde, sorta și pagina cardurile deja existente sau poate cere serverului o filtrare nouă prin fetch.", "body"))
    story.append(p("În prezentare pornești întotdeauna de la rezultat. Arăți pagina, explici ce acțiune faci și abia după aceea deschizi fișierul în care se află mecanismul.", "body"))
    cards(story, [("1. Ce problemă rezolv?", "Spune cerința în cuvinte simple."),
                  ("2. Unde este codul?", "Numește fișierul și funcția principală."),
                  ("3. Cum circulă datele?", "Browser → server → bază → rezultat."),
                  ("4. Ce vede utilizatorul?", "Descrie efectul final și cazul-limită.")])
    memory(story, "Dacă poți explica aceste patru întrebări, demonstrezi înțelegerea chiar dacă nu memorezi fiecare linie.")
    story.append(PageBreak())

    page_title(story, "Etapa 5", "SCSS și Bootstrap personalizat",
               "SCSS este sursa mai expresivă din care se generează CSS. Bootstrap este importat după ce variabilele temei au fost schimbate, astfel încât componentele lui să moștenească identitatea PC Forge.")
    screenshot(story, "bootstrap-custom.png", "Captură reală: componentele Bootstrap au conținut legat de configurarea unui PC, nu text placeholder.", 8.1 * cm)
    story.append(p("Butonul plin și butonul outline sunt intenționat diferite: primul indică acțiunea principală, iar al doilea este secundar și se umple la hover. Cardurile, gridul și alerta provin din Bootstrap, însă culorile și razele provin din variabilele Sass suprascrise.", "body"))
    memory(story, "Nu am colorat manual fiecare componentă. Am schimbat variabilele înainte de import, apoi am recompilat Bootstrap.")
    story.append(PageBreak())

    page_title(story, "Etapa 5", "Compilarea automată SCSS",
               "Browserul nu știe să citească SCSS. De aceea serverul îl transformă în CSS la pornire și urmărește fișierele pentru recompilare automată.")
    code(story, "function compileazaScss(caleScss, caleCss) {\n  // determină căile sursă și destinație\n  // salvează CSS-ul vechi în backup\n  const rezultat = sass.compile(caleScssAbs);\n  fs.writeFileSync(caleCssAbs, rezultat.css);\n}\n\nfs.watch(folderScss, ..., numeFisier => compileazaScss(numeFisier));")
    flow(story, ["Fișier .scss", "sass.compile", "Backup CSS vechi", "Fișier .css", "Browser"])
    story.append(p("<b>De ce backup?</b> Compilarea suprascrie fișierul CSS. Versiunea veche este salvată înainte, cu timestamp, ca să nu fie pierdută. <b>De ce fs.watch?</b> Este un observator al folderului: când apare o modificare, se recompilează doar fișierul afectat.", "body"))
    callout(story, "Formulare pentru profesoară", "SCSS este sursa, CSS este rezultatul consumat de browser. La pornire compilez toate sursele, apoi urmăresc modificările și păstrez versiunea anterioară înainte de suprascriere.")
    story.append(PageBreak())

    page_title(story, "Etapa 5", "Galeria statică: date separate de aspect",
               "Galeria nu este scrisă imagine cu imagine în HTML. Datele stau în galerie.json, serverul selectează imaginile potrivite orei, iar EJS generează elementele.")
    screenshot(story, "galerie-statica.png", "Captură reală: numărul de coloane este controlat de SCSS, iar imaginile provin din JSON.", 8.8 * cm)
    flow(story, ["galerie.json", "Filtrare pe server", "EJS", "Grid SCSS"])
    story.append(p("Validarea la pornire verifică dacă folderul și fiecare fișier declarat există. Astfel, o cale greșită produce imediat o explicație clară în consolă, nu o imagine lipsă observată mai târziu de utilizator.", "body"))
    memory(story, "JSON păstrează datele; EJS produce HTML; SCSS decide așezarea. Fiecare tehnologie are un rol separat.")
    story.append(PageBreak())

    page_title(story, "Etapa 5", "Galeria animată și efectele CSS",
               "Galeria animată primește un număr aleator de imagini. Sass generează pozițiile animației în funcție de numărul real, iar hoverul oprește animația.")
    screenshot(story, "efect-duotone.png", "Efectul duotone: pseudo-elementele colorează aceeași imagine, iar hoverul o duce progresiv spre grayscale.", 6.4 * cm)
    screenshot(story, "efect-reflexie.png", "Reflexia textului este construită portabil prin pseudo-element, transformare, opacitate și blur.", 3.2 * cm)
    cards(story, [("Pseudo-element", "::before și ::after creează straturi vizuale fără HTML suplimentar."),
                  ("mix-blend-mode", "Stabilește cum se combină culoarea stratului cu pixelii imaginii."),
                  ("filter", "grayscale() și blur() schimbă prezentarea, nu fișierul original."),
                  ("@keyframes", "Descrie stările animației; transform mută eficient elementul.")])
    callout(story, "Caz-limită important", "La hover folosesc animation-play-state: paused, nu recreez animația. Numărul și offsetul imaginilor sunt alese de program, nu scrise manual.")
    story.append(PageBreak())

    page_title(story, "Etapa 6", "PostgreSQL și pagina dinamică de produse",
               "Din această etapă produsele devin înregistrări într-o bază distinctă pentru proiect. Serverul citește date reale, iar interfața se adaptează fără duplicarea manuală a HTML-ului.")
    flow(story, ["Tabela produse", "modul acces-produse", "Ruta /produse", "produse.ejs", "Carduri"])
    story.append(p("Tabela conține id numeric, nume, descriere, imagine, categorii ENUM, preț, scor, stoc și caracteristici variate. Utilizatorul aplicației are doar drepturile necesare, nu drepturi de superuser.", "body"))
    code(story, "const rezultat = await pool.query(\n  \"SELECT * FROM produse WHERE id = $1\",\n  [idProdus]\n);\n\n// $1 ține valoarea separată de textul SQL")
    story.append(p("Un query parametrizat nu lipește textul utilizatorului în SQL. Motorul primește instrucțiunea și valorile separat, ceea ce previne interpretarea datelor ca parte din comandă.", "body"))
    memory(story, "PostgreSQL păstrează datele, Express decide ce cere, EJS generează prezentarea.")
    story.append(PageBreak())

    page_title(story, "Etapa 6", "Cele opt filtre și validarea",
               "Pagina folosește tipuri diferite de input pentru proprietăți diferite: text, range, datalist, radio, checkbox, textarea, select simplu și select multiplu.")
    screenshot(story, "produse-filtre.png", "Captură reală: panoul de filtre este populat din datele PostgreSQL și folosește componente Bootstrap personalizate.", 11.0 * cm)
    story.append(p("Funcția comună citește toate controalele și construiește condiții booleene. Un card rămâne vizibil doar dacă toate condițiile active sunt adevărate. Filtrele fără selecție sunt tratate ca «oricare», iar valorile invalide opresc operația și primesc explicație prin mecanismul nativ al browserului.", "body"))
    callout(story, "Demonstrație", "Introdu o parte din numele produsului, schimbă range-ul, selectează o categorie și arată că numărul produselor și paginarea se actualizează împreună.")
    story.append(PageBreak())

    page_title(story, "Etapa 6", "Sortare, calcul și carduri generate",
               "Sortarea are două chei. Cheia a doua este folosită numai când prima produce egalitate. Calculul se aplică exclusiv produselor vizibile după filtrare.")
    screenshot(story, "produse-carduri.png", "Captură reală: carduri Bootstrap generate din date; produsele ascunse rămân în DOM pentru resetare.", 9.4 * cm)
    code(story, "const rezultat = compara(a, b, cheia1);\nif (rezultat === 0) return compara(a, b, cheia2);\nreturn sens === \"desc\" ? -rezultat : rezultat;\n\nconst preturi = carduriVizibile.map(card => Number(card.dataset.pret));")
    story.append(p("Mesajul cu suma, media, minimul sau maximul este creat dinamic prin document.createElement(), rămâne două secunde și este apoi eliminat. Resetarea reface valorile, vizibilitatea și ordinea inițială memorată prin data-index-initial.", "body"))
    memory(story, "Filtrarea decide ce rămâne; paginarea decide ce parte se vede; calculul folosește rezultatul filtrării.")
    story.append(PageBreak())

    page_title(story, "Etapa 6", "Bonusurile 1-10: ce trebuie să recunoști")
    cards(story, [
        ("1 · Opțiuni din date", "Min/max și listele distincte sunt calculate din produse, nu copiate manual."),
        ("2 · A treia temă", "Contrast Forge este o valoare suplimentară a aceleiași chei de temă."),
        ("3 · Fără rezultate", "Numărul zero produce un mesaj explicit; lista goală nu pare eroare."),
        ("4 · Filtrare imediată", "Evenimentele input/change reaplică aceeași funcție comună."),
        ("5 · Paginare", "K=6; numărul controalelor este ceil(N/K) după filtrare."),
        ("6 · Fixare și ascundere", "Trei comportamente distincte; ascunderea persistentă folosește sessionStorage."),
        ("7 · Diacritice", "normalize('NFD') permite căutarea echivalentă fără a modifica textul afișat."),
        ("8 · Chei alese", "Utilizatorul alege ambele criterii și sensul comparatorului."),
        ("9 · Imagini multiple", "Carousel Bootstrap pe pagina produsului; imaginile vin din catalog."),
        ("10 · Fetch server", "Criteriile merg la endpoint, PostgreSQL filtrează și răspunsul JSON actualizează pagina."),
    ])
    memory(story, "La bonusuri spune întotdeauna ce stare se păstrează și unde: DOM, sessionStorage, localStorage, JSON sau PostgreSQL.")
    story.append(PageBreak())

    page_title(story, "Etapa 6", "Bonusurile 11-20: ce trebuie să recunoști")
    cards(story, [
        ("11 · Modal", "Un singur modal reutilizabil primește datele cardului prin dataset."),
        ("12 · Oferte periodice", "Serverul generează categoria, procentul și intervalul; browserul doar numără secundele."),
        ("13 · Ștergere backup", "Neimplementat deliberat: operația este distructivă și cere o politică de păstrare."),
        ("14 · Cel mai ieftin", "MIN(preț) pe categorie produce badge calculat din bază."),
        ("15 · Număr vizibil", "Contorul se actualizează în aceeași funcție care schimbă vizibilitatea."),
        ("16 · Produse similare", "Aceeași categorie/subcategorie și apropiere de preț; produsul curent este exclus."),
        ("17 · Seturi", "Relație many-to-many; reducerea se calculează din numărul produselor."),
        ("18 · Produse noi", "Marcajul este derivat din data_adăugare și dispare automat."),
        ("19 · Orar global", "Fragment comun; ora este transformată în minute pentru comparație."),
        ("20 · Comparare", "Două id-uri persistă o zi în localStorage și sunt afișate paralel din baza reală."),
    ])
    callout(story, "Onestitate la prezentare", "Nu prezenta Bonusul 13 ca implementat. Este mai convingător să explici de ce ai evitat o ștergere automată nesigură decât să pretinzi o funcție inexistentă.")
    story.append(PageBreak())

    page_title(story, "Etapa 7", "Bootstrap JavaScript și cookie-uri",
               "Etapa 7 introduce stări în browser: bannerul cookie, ultima pagină, ultimul produs și filtrele. Cardurile Bootstrap apar succesiv cu setTimeout.")
    flow(story, ["Banner animat CSS", "Click OK", "seteazaCookie", "Refresh", "Banner ascuns"])
    code(story, "function citesteCookie(nume) {\n  const prefix = `${encodeURIComponent(nume)}=`;\n  const pereche = document.cookie.split(\"; \" )\n    .find(element => element.startsWith(prefix));\n  return pereche ? decodeURIComponent(pereche.slice(prefix.length)) : null;\n}\n\nfunction seteazaCookie(nume, valoare, zile = 7) {\n  document.cookie = `${nume}=${valoare}; expires=${expirare}; path=/; SameSite=Lax`;\n}")
    story.append(p("CSS poate anima bannerul, dar nu știe dacă utilizatorul a acceptat anterior. JavaScript citește cookie-ul și decide dacă elementul trebuie afișat. Cookie-ul este trimis domeniului și are expirare; localStorage rămâne doar în browser; sessionStorage aparține unui singur tab.", "body"))
    memory(story, "Animația este CSS; decizia persistentă este JavaScript + cookie.")
    story.append(PageBreak())

    page_title(story, "Etapa 7", "AccesBD, Singleton, roluri și Utilizator",
               "Clasele separă responsabilitățile: AccesBD construiește query-uri sigure, RolFactory creează rolul potrivit, iar Utilizator aplică regulile entității.")
    flow(story, ["Rută", "Utilizator", "AccesBD Singleton", "Pool PostgreSQL"])
    code(story, "class AccesBD {\n  static #instanta = null;\n  #client;\n\n  static getInstanta() {\n    if (!AccesBD.#instanta) AccesBD.#instanta = new AccesBD();\n    return AccesBD.#instanta;\n  }\n}")
    story.append(p("Singleton înseamnă un singur obiect principal responsabil de Pool și query builder, nu o singură conexiune fizică. Pool-ul gestionează conexiuni reutilizabile. Valorile sunt păstrate ca parametri, iar identificatorii de tabel/câmp sunt validați înainte de a intra în SQL.", "body"))
    story.append(p("Drepturile sunt simboluri unice. RolFactory primește codul rolului și întoarce subclasa potrivită. Metoda areDreptul verifică Set-ul drepturilor, nu compară texte împrăștiate prin aplicație.", "body"))
    callout(story, "Formulare pentru profesoară", "Am separat numele rolului de drepturile efective. Factory ascunde alegerea constructorului, iar Singleton centralizează accesul la baza de date.")
    story.append(PageBreak())

    page_title(story, "Etapa 7", "Bonusuri și persistența filtrelor")
    cards(story, [
        ("Operator OR", "Vectorul exterior reprezintă alternative OR; fiecare vector interior conține condiții AND. Parantezele păstrează prioritatea."),
        ("ORM Sequelize", "ProdusORM mapează tabela la un model și demonstrează findAll fără a elimina query builderul cerut la bază."),
        ("Filtre persistente", "JSON.stringify salvează valorile celor opt controale; JSON.parse le reconstruiește la revenire."),
    ], columns=1)
    flow(story, ["Valori input", "Obiect JS", "JSON.stringify", "localStorage", "JSON.parse"])
    story.append(p("Resetarea filtrelor șterge cheia și debifează opțiunea. Nu salvez rezultatul HTML, ci starea formularului; aceeași funcție de filtrare regenerează rezultatul când pagina este redeschisă.", "body"))
    memory(story, "Persistăm cauza - valorile filtrelor - nu efectul temporar - cardurile deja ascunse.")
    story.append(PageBreak())

    page_title(story, "Etapa 8", "Înregistrarea și confirmarea contului",
               "Fluxul real are mai multe bariere: validare client, validare server, unicitate în bază, hash al parolei, salvare, e-mail și confirmare prin token.")
    flow(story, ["Formular", "Validare dublă", "Upload imagine", "Hash + salt", "INSERT", "Token e-mail"])
    story.append(p("Formularul multipart/form-data permite trimiterea fișierului. Multer separă fișierul de câmpurile text, Sharp verifică și redimensionează imaginea, iar baza păstrează doar calea imaginii. Serverul repetă validarea deoarece JavaScript din browser poate fi dezactivat sau modificat.", "body"))
    story.append(p("Linkul de confirmare conține două tokenuri greu de ghicit. Contul există după înregistrare, dar loginul rămâne blocat până când valorile din link coincid cu cele salvate.", "body"))
    callout(story, "Formulare pentru profesoară", "Validez de două ori din motive diferite: clientul oferă feedback rapid, iar serverul este autoritatea care protejează aplicația și baza.")
    story.append(PageBreak())

    page_title(story, "Etapa 8", "Parola, saltul, sesiunea și autorizarea")
    code(story, "function cripteazaParola(parola, salt) {\n  return crypto.scryptSync(parola, salt, 64).toString(\"hex\");\n}\n\nfunction verificaParola(parola, salt, hashSalvat) {\n  const calculat = Buffer.from(cripteazaParola(parola, salt), \"hex\");\n  const salvat = Buffer.from(hashSalvat, \"hex\");\n  return calculat.length === salvat.length &&\n         crypto.timingSafeEqual(calculat, salvat);\n}")
    story.append(p("Hashul este un proces unidirecțional: aplicația nu recuperează parola. Saltul diferit pentru fiecare utilizator face ca două parole identice să aibă rezultate diferite. La login se recalculează hashul cu saltul utilizatorului și se compară în timp constant.", "body"))
    flow(story, ["Username + parolă", "Caut utilizatorul", "Verific confirmat/blocat", "Recalculez hash", "Creez sesiunea"])
    story.append(p("Sesiunea este starea păstrată pe server. Browserul are doar cookie-ul cu identificatorul sesiunii. Ascunderea linkurilor de admin îmbunătățește interfața, dar protecția reală este middleware-ul care oprește ruta cu HTTP 403.", "body"))
    memory(story, "Autentificare = cine ești. Autorizare = ce ai voie să faci.")
    story.append(PageBreak())

    page_title(story, "Etapa 8", "Profil, administrare și utilizatori online")
    cards(story, [
        ("Profil", "Date precompletate, username readonly, parola curentă cerută pentru orice modificare sensibilă."),
        ("Administrare utilizatori", "Adminul vede lista, blochează/deblochează prin fetch; verificarea rolului este pe server."),
        ("Administrare produse", "CRUD cu query-uri parametrizate, tipuri ENUM și validare. Stocul poate declanșa notificări."),
        ("Utilizatori online", "ultima_activitate se actualizează limitat; endpointul întoarce administratorii activi în ultimele 10 minute."),
        ("Ștergere cont", "Parola este cerută din nou; utilizatorul este șters și sesiunea este distrusă."),
        ("Politica", "Pagina explică datele, cookie-urile și drepturile; linkul este vizibil în formular și footer."),
    ])
    story.append(p("Actualizarea cu fetch este potrivită pentru blocare și lista online deoarece schimbă doar o parte a paginii. Serverul răspunde JSON, iar JavaScript actualizează rândul sau lista fără refresh complet.", "body"))
    callout(story, "Caz-limită", "Un utilizator poate scrie manual URL-ul unei pagini admin. De aceea middleware-ul trebuie executat înaintea handlerului, indiferent dacă linkul este ascuns în meniu.")
    story.append(PageBreak())

    page_title(story, "Etapa 8", "Bonusurile 1-7")
    cards(story, [
        ("1 · Salt unic", "randomBytes generează un salt separat pentru fiecare utilizator."),
        ("2 · Temă pe server", "Pentru utilizatorul logat, baza este sursa preferinței; localStorage rămâne fallback."),
        ("3 · Conturi neconfirmate", "Notificarea rulează; ștergerea implicită este oprită prin opțiune pentru demonstrație sigură."),
        ("4 · Recuperare parolă", "Token temporar, expirare 30 minute, utilizare unică și salt nou."),
        ("5 · Sugestii username", "Variantele sunt verificate în PostgreSQL; nu sunt doar nume generate aleator."),
        ("6 · Blocarea loginului", "Cinci încercări într-o fereastră de zece minute blochează o oră și trimit avertizare."),
        ("7 · Mentenanță", "Un flag JSON activează central pagina 503 înaintea rutelor obișnuite."),
    ])
    memory(story, "Securitatea bună înseamnă limite, expirări și stări controlate, nu doar un mesaj de eroare.")
    story.append(PageBreak())

    page_title(story, "Etapa 8", "Bonusurile 8-13")
    cards(story, [
        ("8 · Timp de la login", "Diferența Date.now() - ultima_logare este exprimată în zile, ore și minute."),
        ("9 · Reține-mă", "maxAge extinde durata cookie-ului de sesiune; parola nu este salvată în browser."),
        ("10 · E-mail promoțional", "Conturi inactive selectate periodic; ultima_promoție previne trimiterea repetată."),
        ("11 · Roluri în DB", "Relații many-to-many cu perioade de valabilitate; NULL înseamnă nedeterminat."),
        ("12 · Site actualizat", "Maximul dintre cea mai nouă modificare EJS și cea mai nouă dată de produs."),
        ("13 · Favorite", "Pereche unică utilizator-produs, COUNT pentru top și actualizare fetch; legătura spre coș nu există încă."),
    ])
    story.append(p("La bonusurile parțiale trebuie să delimitezi exact ce funcționează și ce nu. De exemplu, favoritele sunt persistente și au top, dar e-mailul nu poate duce la un coș virtual care nu a fost implementat.", "body"))
    callout(story, "Formulare sigură", "Am implementat partea X, iar partea Y rămâne limitată deoarece proiectul nu are încă infrastructura necesară. Pot demonstra exact rezultatul existent.")
    story.append(PageBreak())

    page_title(story, "Etapa 10", "Finisarea vizuală și responsive",
               "Etapa 10 nu schimbă arhitectura. Centralizează detaliile vizuale și repară punctual elementele care depășesc ecranul.")
    code(story, ":root {\n  --forge-rosu: #e1012f;\n  --forge-raza: 1rem;\n  --forge-umbra: 0 .8rem 2rem rgba(35,0,8,.12);\n}\n\n@media (max-width: 759px) {\n  .card:hover { transform: none; }\n  .zona, .panou-filtre { border-radius: .9rem; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  * { animation-duration: .01ms !important; }\n}")
    story.append(p("Variabilele CSS păstrează aceeași rază, umbră și paletă. :focus-visible oferă tastaturii un contur clar. prefers-reduced-motion respectă utilizatorii care cer mai puțină mișcare. Problema scrollului orizontal este reparată la elementul care are min-width prea mare, nu ascunsă prin overflow pe întreaga pagină.", "body"))
    screenshot(story, "produs-detaliu.png", "Captură reală: pagina individuală refolosește datele produsului și componente responsive.", 7.2 * cm)
    memory(story, "Responsive înseamnă adaptarea structurii, nu micșorarea mecanică a întregii pagini.")
    story.append(PageBreak())

    page_title(story, "Întrebări probabile", "Răspunsuri pe care trebuie să le poți formula")
    qas = [
        ("De ce EJS și nu HTML static?", "Pentru că același template poate afișa orice produs primit din bază; evit duplicarea structurii."),
        ("De ce validezi și în client, și în server?", "Clientul oferă feedback rapid. Serverul nu poate avea încredere în browser și protejează datele."),
        ("De ce query parametrizat?", "Separă instrucțiunea SQL de valorile utilizatorului și previne interpretarea lor ca SQL."),
        ("Ce diferență este între cookie și localStorage?", "Cookie-ul are reguli de trimitere și expirare; localStorage rămâne local browserului până este șters."),
        ("Ce este Singleton?", "Un singur obiect responsabil de Pool și construirea query-urilor, nu o singură conexiune fizică."),
        ("De ce parola nu se decriptează?", "Stocăm un hash derivat unidirecțional. La login derivăm din nou și comparăm rezultatele."),
        ("De ce ascunderea meniului nu este autorizare?", "URL-ul poate fi scris manual. Middleware-ul serverului trebuie să verifice rolul înaintea rutei."),
        ("Ce ai lăsat neimplementat?", "Ștergerea automată a backupurilor, pentru a nu introduce o operație distructivă fără politică de păstrare."),
    ]
    for question, answer in qas:
        story.append(KeepTogether([p(question, "question"), p(answer, "body")]))
    story.append(PageBreak())

    page_title(story, "Ziua prezentării", "Ordinea demonstrației")
    cards(story, [
        ("1 · Acasă", "Bootstrap personalizat, galerie, duotone, reflexie și animații."),
        ("2 · SCSS", "Schimbare mică, recompilare și backup cu timestamp."),
        ("3 · Produse", "Filtre, validare, sortare cu două chei, calcul, resetare și paginare."),
        ("4 · Produs", "Carousel, produse similare, seturi și query după id."),
        ("5 · Stare browser", "Cookie banner, temă și filtre persistente."),
        ("6 · Arhitectură", "AccesBD → Utilizator → RolFactory → Drepturi."),
        ("7 · Cont", "Înregistrare, confirmare, login, profil, recuperarea parolei și logout."),
        ("8 · Admin", "Blocare, produse, roluri, favorite și utilizatori online."),
        ("9 · Responsive", "Redimensionează fereastra și explică lipsa scrollului orizontal."),
    ])
    story.append(p("Nu deschide zece fișiere simultan. Pentru fiecare demonstrație: rezultat în browser → un fișier principal → explicația mecanismului → cazul-limită. Dacă profesoara schimbă direcția, răspunde la întrebare și revino la traseu.", "body"))
    memory(story, "Arată, explică, indică fișierul, spune de ce ai ales soluția.")
    story.append(PageBreak())

    page_title(story, "Recapitulare înainte de somn", "Cele 15 propoziții pe care trebuie să le știi")
    statements = [
        "SCSS se compilează în CSS, iar versiunea veche este salvată înainte de suprascriere.",
        "Bootstrap este personalizat prin variabile Sass definite înainte de import.",
        "JSON conține datele galeriei, EJS produce HTML, iar SCSS produce gridul și animația.",
        "Produsele sunt în PostgreSQL; utilizatorul aplicației are privilegii limitate.",
        "Query-urile parametrizate separă SQL-ul de valorile utilizatorului.",
        "Filtrarea ascunde cardurile fără să le șteargă, astfel încât resetarea le poate readuce.",
        "Sortarea folosește cheia a doua numai când prima cheie este egală.",
        "Cookie-ul păstrează acceptul; localStorage păstrează teme/filtre; sessionStorage păstrează starea tabului.",
        "AccesBD este Singleton și centralizează Pool-ul și query builderul.",
        "RolFactory creează rolul potrivit, iar drepturile sunt simboluri unice.",
        "Validarea clientului ajută utilizatorul; validarea serverului protejează aplicația.",
        "Parola este derivată cu scrypt și salt unic, nu stocată sau decriptată.",
        "Sesiunea este pe server; cookie-ul browserului conține doar identificatorul ei.",
        "Autentificarea spune cine ești; autorizarea spune ce ai voie să faci.",
        "Responsive și accesibilitate înseamnă breakpointuri, focus vizibil și respectarea reduced motion.",
    ]
    for i, statement in enumerate(statements, 1):
        story.append(p(f"<b>{i}.</b> {escape(statement)}", "body"))
    callout(story, "Ultimul exercițiu", "Închide documentul și explică traseul unui produs: din rândul PostgreSQL, prin query și EJS, până la cardul din browser și filtrarea JavaScript.")

    return story


def main():
    global S
    register_fonts()
    S = styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = GuideDoc(str(OUTPUT))
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
