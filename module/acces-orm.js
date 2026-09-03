// Etapa 7 - Bonus 2: Sequelize ORM, folosit alaturi de Singleton-ul AccesBD.
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, { host: process.env.DB_HOST || "localhost", port: Number(process.env.DB_PORT || 5432), dialect: "postgres", logging: false });
const ProdusORM = sequelize.define("Produs", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nume: DataTypes.STRING, descriere: DataTypes.TEXT, imagine: DataTypes.STRING,
  categorie: DataTypes.STRING, subcategorie: DataTypes.STRING,
  pret: DataTypes.DECIMAL(10,2), scor_performanta: DataTypes.INTEGER,
  data_adaugare: DataTypes.DATEONLY, culoare: DataTypes.STRING,
  conectivitate: DataTypes.ARRAY(DataTypes.TEXT), in_stoc: DataTypes.BOOLEAN, stoc: DataTypes.INTEGER,
}, { tableName: "produse", timestamps: false });
/** @param {number} limita Limita de randuri. @returns {Promise<object[]>} Produse ORM. */
async function obtineProduseNoiOrm(limita) {
  const randuri = await ProdusORM.findAll({ order: [["data_adaugare","DESC"],["id","DESC"]], limit: limita, raw: true });
  return randuri.map((rand) => ({ ...rand, pret: Number(rand.pret) }));
}
module.exports = { sequelize, ProdusORM, obtineProduseNoiOrm };
