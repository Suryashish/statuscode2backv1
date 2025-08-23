require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import cors
const ragRoutes = require("./routes/rag");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use("/api", ragRoutes);

app.get("/", (req, res) => {
  res.send("RAG Server is running!");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
