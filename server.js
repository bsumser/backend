const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 8081;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/message", (req, res) => {
  res.json({ message: "Hello from server!" });
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
  res.end( JSON.stringify(newDeck));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

function removeSpace(strings) {
    return strings.map((string, i) => src.replace("[ \t]+$", ""));
}