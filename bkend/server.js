const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;

let context = '';
let userDetals = '';

const API_BASE_URL = 'http://localhost:3000';
// Middleware
app.use(cors());
app.use(express.json());
require('dotenv').config();

const userRoutes = require("./routes/user");
app.use("/", userRoutes);

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
    context = textContent;


    // add a logic to check the size of context if its beyond a certain words, we will use LLM processing to get the meanign ful data from it
    const contextWords = context.split(" ").length;
    if (contextWords > 2500) {
      console.log(`⚠️ Context is too long (${contextWords} words), summarizing...`);
      prompt = `Summarize the following context to retain relevant information for answering queries about Health, wellness, ingredients,dietery specifications, caloris and other relevant datas. It might contain details about a log of produts also, find the importand product from it based on the amount of content given for each product. If the product is not related to food and such health related stuff then strictly Return "Product not valid text":\n\n${context}\n\nSummary:`;

      context = await generateText(prompt);
      console.log(`✅ Context summarized to ${context.split(" ").length} words`);
    }

    // await axios.post(`${API_BASE_URL}/ingest-documents`);
    // context = await axios.post(`${API_BASE_URL}/query`);
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
  res.status(200).json({
    hasContext: !!context,
    contextLength: context ? context.length : 0,
    contextPreview: context ? context.substring(0, 200) + '...' : null
  });
});



app.post('/llm-call', async (req, res) => {
  const { query } = req.body;
  
  console.log('📥 LLM call received');
  console.log('Query length:', query ? query.length : 0);
  console.log('Context available:', !!context);
  console.log('Context length:', context ? context.length : 0);

  if (!context) {
    console.log('❌ No context available');
    return res.status(400).json({ error: "Context is required. Please parse a website first." });
  }
  
  if (!query) {
    console.log('❌ No query provided');
    return res.status(400).json({ error: "Query is required." });
  }

  try {
    userDetals = await axios.get(
      `${API_BASE_URL}/api/profiles/68aac71f8768849a549a722a`
    );

    userDetals = JSON.stringify(userDetals.data);
    const prompt = `User: ${userDetals}\n\nContext:\n${context}\n\nQuestion: ${query}\n\nAnswer: 
    - STRICTLY MAINTAIN JSON FORMAT 
    - DO NOT ANSWER FOR NON FOOD ITEMS
    - IF YOU DONT GET NUTRITIONAL INFO, UNDERSTAND AND FORM THE NUTRITIONAL INFO BASED ON KNOWLEDGE
    - DO NOT USE MARKDOWN 
    - RETURN ONLY VALID JSON`;
    
    console.log('🤖 Calling Gemini API...');
    // Call the LLM with the context and query
    const answer = await generateText(prompt);
    console.log(`✅ LLM response received, length: ${answer.length}`);

    // Clean the response to extract JSON
    let cleanedAnswer = answer;
    if (typeof cleanedAnswer === "string") {
      cleanedAnswer = cleanedAnswer.trim();
      
      // Remove markdown code blocks
      if (cleanedAnswer.startsWith("```json")) {
        cleanedAnswer = cleanedAnswer.replace(/^```json/, "").trim();
      }
      if (cleanedAnswer.startsWith("```")) {
        cleanedAnswer = cleanedAnswer.replace(/^```/, "").trim();
      }
      if (cleanedAnswer.endsWith("```")) {
        cleanedAnswer = cleanedAnswer.replace(/```$/, "").trim();
      }
    }

    console.log('🧹 Cleaned response:', cleanedAnswer.substring(0, 200) + '...');

    // Return in the expected format for the frontend
    res.status(200).json({ answer: cleanedAnswer });
  } catch (error) {
    console.error("❌ Error during LLM call:", error);
    res.status(500).json({ error: "Failed to call LLM: " + error.message });
  }
});
// Health check endpoint
app.get('/health', (req, res) => {
  console.log('📊 Health check requested');
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Test endpoint for extension
app.get('/test', (req, res) => {
  res.json({ message: 'HealthWise backend is running!', context: !!context });
});

const ragRoute = require('./routes/rag');
app.use('/', ragRoute);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: POST http://localhost:${PORT}/parse-website`);
});