const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS numeros (
      id SERIAL PRIMARY KEY,
      numero VARCHAR(20) NOT NULL,
      salvoEm TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  client.release();
})();

app.post("/salvar", async (req, res) => {
  const { numero } = req.body;
  if (!numero || !/^\d{1,20}$/.test(numero)) return res.status(400).json({ mensagem: "Número inválido" });
  try {
    const result = await pool.query("INSERT INTO numeros (numero) VALUES ($1) RETURNING id", [numero]);
    res.json({ mensagem: "Número salvo!", id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao salvar" });
  }
});

app.get("/listar", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM numeros ORDER BY id DESC LIMIT 100");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao listar" });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
