const express = require('express');
const cors = require('cors');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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
        console.log('✅ Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('✅ New page created');
        
        await page.goto(url, { waitUntil: "domcontentloaded" });
        console.log('✅ Page loaded successfully');
        
        // Extract all visible text from the body
        const textContent = await page.innerText("body");
        console.log(`✅ Text content extracted, length: ${textContent.length} characters`);
        
        // Save into a TXT file
        const filePath = path.join(documentsDir, 'page_content.txt');
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

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('📊 Health check requested');
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoint: POST http://localhost:${PORT}/parse-website`);
});