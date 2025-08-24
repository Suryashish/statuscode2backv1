const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

let context = '';

const API_BASE_URL = 'http://localhost:3000';
// Middleware
app.use(cors());
app.use(express.json());
require('dotenv').config();

const {
  generateEmbedding,
  generateText,
} = require("./services/geminiService");


// Create documents directory if it doesn't exist
const documentsDir = path.join(__dirname, 'documents');
if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir);
    console.log('✅ Created documents directory');
}

const playwright_function = async (url) => {
    console.log(`🔍 Starting to parse URL: ${url}`);
    let browser;
    
    try {
      browser = await chromium.launch({ headless: true });
      console.log("✅ Browser launched successfully");

      const page = await browser.newPage();
      console.log("✅ New page created");

      await page.goto(url, { waitUntil: "domcontentloaded" });
      console.log("✅ Page loaded successfully");

      // if the pages url starts with https://www.flipkart.com/ then run a different wy to get the text from the page and if its https://www.amazon.in/ then a different way
      // if it starts with flipkart one then we need to scrap the content of the whole parent div where the class name is DOjaWF YJG4Cf 
      // if it starts with amazon then sccrap the parent div where the class name is ppd
        //write the logic

        let textContent;
        if (
          url.startsWith("https://www.flipkart.com/")
        ) {
          if (!url.includes("pid=")) {
            throw new Error("Invalid URL");
          }
          // Flipkart: scrape parent div with class "DOjaWF YJG4Cf"
          const flipkartSelector = ".DOjaWF.YJG4Cf";

          const exists = await page.$(flipkartSelector);
          if (exists) {
            textContent = await page.innerText(flipkartSelector);
          } else {
            textContent = await page.innerText("body");
          }
        } else if (url.startsWith("https://www.amazon.in/")) {
            // if (!url.includes("/dp/")) {
            //   throw new Error("Invalid URL");
            // }
          // Amazon: scrape parent div with class "ppd"
          const amazonSelector = "#ppd";
          const exists = await page.$(amazonSelector);
          if (exists) {
            textContent = await page.innerText(amazonSelector);
          } else {
            // textContent = await page.innerText("body");
            throw new Error("Invalid URL");
          }
        } else {
          // Default: scrape all visible text from body
          textContent = await page.innerText("body");
        }
        


      // Extract all visible text from the body
    //   const textContent = await page.innerText("body");

      console.log(
        `✅ Text content extracted, length: ${textContent.length} characters`
      );

      // Save into a TXT file
      const filePath = path.join(documentsDir, "page_content.txt");
      fs.writeFileSync(filePath, textContent, "utf-8");
      console.log(`✅ Full text content of ${url} saved to page_content.txt`);

      return textContent;
    } catch (error) {
        console.error('❌ Error in playwright_function:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('✅ Browser closed');
        }
    }
};

// API endpoint to parse website
app.post('/parse-website', async (req, res) => {
    console.log('📥 Received request to /parse-website');
    console.log('Request body:', req.body);
    
    try {
        const { url } = req.body;
        
        if (!url) {
            console.log('❌ No URL provided in request body');
            return res.status(400).json({ 
                error: 'URL is required', 
                success: false 
            });
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch (urlError) {
            console.log('❌ Invalid URL format:', url);
            return res.status(400).json({ 
                error: 'Invalid URL format', 
                success: false 
            });
        }

        console.log(`🚀 Processing URL: ${url}`);
        const textContent = await playwright_function(url);
        
        console.log('✅ Successfully parsed website');
        // await axios.post(`${API_BASE_URL}/ingest-documents`);
        // context = await axios.post(`${API_BASE_URL}/query`);
        context = textContent;
        res.json({ 
            success: true, 
            content: textContent,
            url: url,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error processing request:', error);
        res.status(500).json({ 
            error: 'Failed to parse website: ' + error.message, 
            success: false 
        });
    }
});

app.get('/get-context', (req, res) => {
    console.log('📥 Received request to /get-context');
    res.status(200).json(context);
});




app.post('/llm-call',async(req,res)=>{
  const { query } = req.body;

  if (!context || !query) {
    return res.status(400).json({ error: "Context and query are required." });
  }

  try {
    const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`
    // Call the LLM with the context and query
    const answer = await generateText(prompt);

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error during LLM call:", error);
    res.status(500).json({ error: "Failed to call LLM." });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
    console.log('📊 Health check requested');
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

const ragRoute = require('./routes/rag');
app.use('/', ragRoute);

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: POST http://localhost:${PORT}/parse-website`);
});