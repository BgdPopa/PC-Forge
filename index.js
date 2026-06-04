// Etapa 4 - task 1:
// Importul modulelor necesare pentru server: express, path si fs
const express = require("express");
const path = require("path");
const fs = require("fs");

// Etapa 4 - task 2:
// Crearea obiectului server express si setarea portului 8080
const app = express();
const port = 8080;

// Etapa 4 - task 4:
// Setarea EJS ca view engine si a folderului "views" pentru template-uri
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Etapa 4 - task 6:
// Definirea folderului "resurse" ca folder static.
// Astfel, in pagini se folosesc cai de tip /resurse/... (cereri catre server)
app.use("/resurse", express.static(path.join(__dirname, "resurse")));

// Etapa 4 - task 17:
// Cererile catre o cale din /resurse fara fisier specificat (catre un folder,
// ex. /resurse/css/) nu sunt servite de express.static si ajung aici.
// Pentru ele se returneaza eroarea 403 Forbidden.
app.get(/^\/resurse(\/.*)?$/, function (req, res) {
    afisareEroare(res, 403);
});

// Etapa 4 - task 3:
// Afisarea cailor utile in consola.
// __dirname     -> calea folderului in care se afla fisierul index.js
// __filename    -> calea completa a fisierului curent (index.js)
// process.cwd() -> folderul de lucru curent, din care a fost pornit procesul node
//
// Sunt __dirname si process.cwd() acelasi lucru intotdeauna? NU.
// __dirname este mereu folderul fizic al fisierului index.js, indiferent de unde
// pornim procesul. process.cwd() depinde de directorul curent din care rulam comanda.
// Daca pornim "node index.js" chiar din folderul proiectului, cele doua coincid, dar
// daca pornim din alt director (ex. "node proiect/index.js"), atunci difera.
console.log("__dirname     = " + __dirname);
console.log("__filename    = " + __filename);
console.log("process.cwd() = " + process.cwd());

// Etapa 4 - task 20:
// Vector cu folderele de creat la pornirea aplicatiei.
// Se itereaza prin vector si se creeaza folderele care nu exista,
// folosind path.join() pentru concatenarea cailor
const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];

vect_foldere.forEach(function (numeFolder) {
    const caleFolder = path.join(__dirname, numeFolder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log("Folder creat: " + caleFolder);
    }
});

// Etapa 4 - task 13:
// Variabila globala in care se incarca datele despre erori din erori.json.
// Implicit, proprietatea obErori are valoarea null.
let obGlobal = {
    obErori: null
};

// Etapa 4 - task 13:
// initErori() citeste si parseaza erori.json, seteaza calea absoluta (servita de
// server) pentru fiecare imagine folosind cale_baza si salveaza obiectul in obGlobal.obErori
function initErori() {
    const caleErori = path.join(__dirname, "resurse", "json", "erori.json");
    const continut = fs.readFileSync(caleErori, "utf8");
    const obErori = JSON.parse(continut);

    // setarea caii imaginilor pentru fiecare eroare din vector
    for (let eroare of obErori.info_erori) {
        eroare.imagine = obErori.cale_baza + eroare.imagine;
    }
    // setarea caii imaginii si pentru eroarea default
    obErori.eroare_default.imagine = obErori.cale_baza + obErori.eroare_default.imagine;

    obGlobal.obErori = obErori;
}

// Etapa 4 - task 14:
// afisareEroare() afiseaza o pagina de eroare folosind template-ul eroare.ejs.
// Daca exista o eroare cu identificatorul dat, preia titlul/textul/imaginea din JSON,
// dar argumentele titlu/text/imagine au prioritate daca sunt precizate.
// Daca identificatorul lipseste sau nu este gasit, se foloseste eroarea default.
// Statusul HTTP se seteaza doar daca eroarea are status: true.
function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroareInfo = null;

    if (identificator) {
        eroareInfo = obGlobal.obErori.info_erori.find(function (e) {
            return e.identificator == identificator;
        });
    }

    if (eroareInfo) {
        if (eroareInfo.status) {
            res.status(identificator);
        }
    } else {
        // nu s-a gasit identificatorul (sau nu a fost dat) -> eroarea default
        eroareInfo = obGlobal.obErori.eroare_default;
    }

    res.render("pagini/eroare", {
        titlu: titlu || eroareInfo.titlu,
        text: text || eroareInfo.text,
        imagine: imagine || eroareInfo.imagine,
        ip: res.req.ip
    });
}

// Etapa 4 - task 13:
// Incarcarea datelor despre erori la pornirea aplicatiei
initErori();

// Etapa 4 - task 19:
// Ruta pentru /favicon.ico. Browserele cer faviconul pentru diverse raspunsuri,
// nu doar pentru pagini html. Il trimitem cu sendFile() din calea reala existenta.
app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse", "favicons", "favicon.ico"));
});

// Etapa 4 - task 18:
// La cererea oricarui fisier cu extensia .ejs se returneaza eroarea 400 Bad Request.
// Fisierele EJS nu pot fi accesate direct, ci doar randate de server.
app.get(/\.ejs$/, function (req, res) {
    afisareEroare(res, 400);
});

// Etapa 4 - task 8:
// Prima pagina (index) este accesibila prin "/", "/index" si "/home",
// folosind un vector de cai in apelul app.get(). Se transmite ip-ul utilizatorului.
app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index", { ip: req.ip });
});

// Etapa 4 - task 15:
// Ruta pentru pagina suplimentara "Despre"
app.get("/despre", function (req, res) {
    res.render("pagini/despre", { ip: req.ip });
});

// Etapa 4 - task 9 si 10:
// Ruta generala pentru "/*" - trebuie sa fie ultima ruta de pagini.
// Incearca sa randeze pagina ceruta; daca view-ul nu exista (mesajul incepe cu
// "Failed to lookup view") se afiseaza eroarea 404, altfel o eroare generica.
app.get("/*", function (req, res) {
    let pagina = req.params[0];

    // Unele cai (de exemplu cele cu extensia .html) fac ca express sa caute un motor
    // de randare inexistent si sa arunce eroarea sincron, inainte de callback. Folosim
    // try/catch ca serverul sa nu crashe, ci sa afiseze pagina de eroare 404.
    try {
        res.render("pagini/" + pagina, { ip: req.ip }, function (eroare, rezultatRandare) {
            if (eroare) {
                if (eroare.message.startsWith("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezultatRandare);
            }
        });
    } catch (eroare) {
        afisareEroare(res, 404);
    }
});

// Etapa 4 - task 2:
// Pornirea serverului pe portul setat
app.listen(port, function () {
    console.log("Serverul PC Forge ruleaza la adresa http://localhost:" + port);
});
