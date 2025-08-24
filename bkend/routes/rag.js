const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;

const { upsertVectors, queryPinecone } = require("../services/pineconeService");
const {
  generateEmbedding,
  generateText,
} = require("../services/geminiService");
const { processDocument } = require("../utils/documentProcessor");
// const { playwright_function } = require("../services/play_write");

const API_BASE_URL = 'http://localhost:3000';

router.get("/", (req, res) => {
  res.send("RAG Server is running!");
})

// router.get("/crawll", async (req, res) => {
//     const {url} = req.body
//   try {
//     await playwright_function(url);
//     res.status(200).json({ message: "Crawling completed." });
//   } catch (error) {
//     console.error("Error during crawling:", error);
//     res.status(500).json({ error: "Failed to crawl." });
//   }
// })
// Ingest documents endpoint

router.post("/ingest-documents", async (req, res) => {
  const documentsDir = path.join(__dirname, "../documents");
  try {
    const files = await fs.readdir(documentsDir);
    let allVectors = [];
    for (const file of files) {
      if (file.endsWith(".txt")) {
        // Process only text files for now
        const filePath = path.join(documentsDir, file);
        const vectors = await processDocument(filePath);
        allVectors = allVectors.concat(vectors);
      }
    }
    if (allVectors.length > 0) {
      await upsertVectors(allVectors);
      res
        .status(200)
        .json({
          message: `Successfully ingested ${allVectors.length} document chunks.`,
        });
    } else {
      res.status(200).json({ message: "No documents found to ingest." });
    }
  } catch (error) {
    console.error("Error during document ingestion:", error);
    res.status(500).json({ error: "Failed to ingest documents." });
  }
});

// router.get("/get-context",async(req,res)=>{
//   // 1. Generate embedding for the user query
//     const queryEmbedding = await generateEmbedding(query);

//     // 2. Query Pinecone for relevant document chunks
//     const relevantChunks = await queryPinecone(queryEmbedding, 2); // Get top 3 relevant chunks

//     if (relevantChunks.length === 0) {
//       return res
//         .status(200)
//         .json({
//           answer:
//             "I couldn't find any relevant information in my knowledge base for your query.",
//         });
//     }

//     const context = relevantChunks.map((chunk) => chunk.text).join("\n\n");
//     res.status(200).json({ context })
// })
// Query RAG endpoint
router.post("/query", async (req, res) => {
  // const { query } = req.body;
  query = "Provide all medical-related details of this product, including composition, health benefits, risks, and usage warnings.";

  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  try {
    // 1. Generate embedding for the user query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Query Pinecone for relevant document chunks
    const relevantChunks = await queryPinecone(queryEmbedding, 100); // Get top 3 relevant chunks

    if (relevantChunks.length === 0) {
      return res
        .status(200)
        .json({
          answer:
            "I couldn't find any relevant information in my knowledge base for your query.",
        });
    }

    // 3. Construct the prompt for Gemini with context
    // const context = relevantChunks.map((chunk) => chunk.text).join("\n\n");
    // const prompt = `Based on the following context, answer the question comprehensively.
    // you are an expert nutritionist and 
    // If the information is not in the context, state that you don't know.\n\nContext:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;

        const context = relevantChunks.map((chunk) => chunk.text).join("\n\n");
        // const prompt = `Give a score between A- B based on the health score and healthy factor of the product. \n\nContext:\n${context}\n\n\nAnswer:`;


    // 4. Generate answer using Gemini
    // const answer = await generateText(prompt);

    // res.status(200).json({ answer, source_chunks: relevantChunks });
    res.status(200).json({ context, source_chunks: relevantChunks });
  } catch (error) {
    console.error("Error during RAG query:", error);
    res.status(500).json({ error: "Failed to process query." });
  }
});






module.exports = router;
