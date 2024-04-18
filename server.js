const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors());
app.use(express.json());


app.get("/message", (req, res) => {
  res.json({ message: "Hello from server!" });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});