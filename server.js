import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';

const PORT = 8080;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/message", (req, res) => {
  res.json({ message: "Hello from server!" });
});

const con = mysql.createConnection({
  host: "backend_mtg-db_1",
  port : '3306',
  user: "user",
  password: "pass",
  dbName : 'db'
});


app.get("/query", (req, res) => {
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
  res.json({ message: "attempt to query!" });
});

app.get("/deck/:list", (req, res) => {
  let deck = req.params.list;
  deck = deck.match(/\d[^\d]*/g)
  let newDeck = [];
  for (const card of deck) {
    newDeck.push(card.trim())
    console.log(typeof(card), card)
  }
  console.log(typeof(newDeck))
  const out = getDeck(newDeck)
  res.end( JSON.stringify(out));
  console.log(typeof(out))
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

function getDeck(deck) {
  const response = []
  for(let card of deck) {
    response.push(sqlQuery(card))
  }
  return response
}

function sqlQuery(card){
  const num = card.substring(0, card.indexOf(' '))
  card = card.substring(card.indexOf(' ') + 1);
  console.log(num + " copies of " + card)
  const image = getCardArt(card)
  console.log(image)
  return card
}

async function getCardArt(cardText) {
  cardText = cardText.replace(/ /g,"+")
  let apiUrl = "https://api.scryfall.com/cards/named?fuzzy=" + cardText
  const response = await fetch(apiUrl);
  const image = await response.json()

  console.log(image.image_uris.small)
}