import express from "express";
import pg from "pg";
import { databaseConfig } from "./connection.js";

const { Pool } = pg;

const app = express();
const port = 3000;

const pool = new Pool(databaseConfig);

app.get("/maxPricePairs/:from/:to", async (req, res) => {
  const { from, to } = req.params;

  try {
    const query = `
        SELECT 
          pair.id, 
          pair.name, 
          pair.symbol, 
          MAX(price) - MIN(price) AS price_increase 
        FROM 
          pair 
          INNER JOIN pairprice ON pair.id = pairprice.pairId 
        WHERE 
          pairprice.createdAt >= $1::timestamp AND pairprice.createdAt <= $2::timestamp 
        GROUP BY 
          pair.id, pair.name, pair.symbol 
        ORDER BY 
          price_increase DESC`;

    const result = await pool.query(query, [from, to]);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

function insertPairPrice(pairId, price) {
  const query = `INSERT INTO PairPrice (pairId, price) VALUES (${pairId}, ${price})`;

  pool
    .query(query, [pairId, price])
    .catch((error) => console.error("Error inserting pair price:", error));
}

app.listen(port, () => {
  console.log("Server is now listening at port 3000");
});
