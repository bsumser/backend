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

//const con = mysql.createConnection({
//  host: "backend_mtg-db_1",
//  port : '3306',
//  user: "root",
//  password: "pass",
//});
//
//
//app.get("/query", (req, res) => {
//  con.connect(function(err) {
//    if (err) throw err;
//    console.log("Connected!");
//  });
//  let sql = `SELECT * FROM Customer`;
//  let database = 'Chinook'
//  con.query(`USE ${database}`,sql, function (err, result) {
//    if (err) throw err;
//    console.log("Result: " + result);
//    res.json({ message: result });
//  });
//});

app.get("/deck", (req, res) => {
  let deck = req.originalUrl
  deck = deck.replace("/deck?", "");
  deck = deck.replace(/%27/g, "'");
  deck = deck.replace(/%20/g, " ");
  deck = deck.split(/(?<=\d)(?=[A-Za-z])|(?<=[A-Za-z])(?=\d)/);
  console.log(deck)
  let newDeck = [];
  for (const card of deck) {
    const split = card.split(/ (.*)/);
    let cur_card = [split[0], split[1]]
    newDeck.push(cur_card)
    console.log(cur_card)
  }
  let apiDeckList = getDeck(newDeck)
  let out = getCardArtAll(apiDeckList)
  setTimeout(function(){
    //do what you need here
  }, 2000);
  console.log("return beloew")
  out.then(function(cards) {
    res.json(cards.map(function(card) {
      return {
        name : card.name,
        color : card.color_identity,
      }
    }));
  }).catch(function(err) {console.error(err);});
  //res.json({"message": "deck sent"});
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

function getDeck(deck) {
  const apiDeckList = []
  for(let card of deck) {
    let cardURL = prepCardURL(card[1])
    apiDeckList.push(cardURL)
  }

  console.log("apiDeckList")
  console.log(apiDeckList)
  return apiDeckList
}

function prepCardURL(card){
  const num = card.substring(0, card.indexOf(' '))
  card = card.substring(card.indexOf(' ') + 1);
  console.log(num + " copies of " + card)
  
  //replace space with + for URL
  const cardURL = "https://api.scryfall.com/cards/named?fuzzy=" + card.replace(/ /g,"+")
  return cardURL
}


//function to await promises for entire decklist
async function getCardArtAll(deckList){

  // Map URLs to fetch promises and store in an array
  const fetchPromises = deckList.map(url => fetch(url).then(response => response.json()));
  
  let allPromise = Promise.all(fetchPromises);
  try {
    let out = await allPromise;
    return out;
  } catch (error) {
    console.log(error);
  }
}