// Etapa 7 – Cerință: Roluri și drepturi.
const Drepturi = require("./drepturi");

/** Clasa de baza pentru rolurile utilizatorilor. */
class Rol {
  constructor(cod, drepturi = []) {
    this.cod = cod;
    this.drepturi = new Set(drepturi);
  }

  /** @param {symbol} drept Drept din obiectul Drepturi. */
  areDreptul(drept) {
    return this.drepturi.has(drept);
  }

  get listaDrepturi() {
    return [...this.drepturi];
  }
}

/** Rol implicit, cu privilegiul minim de vizualizare. */
class RolComun extends Rol {
  constructor() { super("comun", [Drepturi.vizualizareProduse]); }
}

/** Rol pentru clientul autentificat care poate vizualiza si cumpara. */
class RolClient extends Rol {
  constructor() { super("client", [Drepturi.vizualizareProduse, Drepturi.cumparareProduse]); }
}

/** Rol editorial care poate adauga si modifica produsele. */
class RolModerator extends Rol {
  constructor() {
    super("moderator", [Drepturi.vizualizareProduse, Drepturi.vizualizareUtilizatori, Drepturi.administrareUtilizatori, Drepturi.stergereUtilizatori]);
  }
}

/* Etapa 8 – Bonus 11: Roluri și drepturi. */
class RolManagerProduse extends Rol {
  constructor() { super("manager_produse", [Drepturi.vizualizareProduse, Drepturi.adaugareProduse, Drepturi.modificareProduse, Drepturi.stergereProduse]); }
}

/** Rol administrativ care primeste toate drepturile definite. */
class RolAdmin extends Rol {
  constructor() { super("admin", Object.values(Drepturi)); }
}

/** Factory care transforma codul salvat in baza de date intr-un obiect Rol. */
class RolFactory {
  /**
   * @param {string} tip Codul rolului citit din baza de date.
   * @returns {Rol} Instanta subclasei potrivite sau RolComun.
   */
  static creeazaRol(tip) {
    const roluri = { client: RolClient, moderator: RolModerator, manager_produse: RolManagerProduse, admin: RolAdmin };
    const ClasaRol = roluri[String(tip || "").toLowerCase()] || RolComun;
    return new ClasaRol();
  }
}

module.exports = { Rol, RolComun, RolClient, RolModerator, RolManagerProduse, RolAdmin, RolFactory };
