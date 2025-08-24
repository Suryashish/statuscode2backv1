# HealthWise - Smart Food Analyzer Extension

A professional Chrome extension that provides comprehensive health analysis of food products using AI technology.

## Features

### 🍃 Smart Food Analysis
- **Food Category Detection**: Automatically identifies vegetarian, non-vegetarian, or egg-containing products
- **Health Grading**: Assigns grades from A-E based on nutritional value and ingredients
- **Risk Assessment**: Provides personalized health risk evaluation with visual risk meter
- **Allergen Detection**: Identifies potential allergens and provides specific warnings
- **Nutrition Facts**: Extracts detailed nutritional information per serving
- **Visual Charts**: Interactive charts showing nutritional breakdown

### 🎨 Modern UI/UX
- Clean, white theme with professional SaaS-like design
- Modular component architecture
- Smooth animations and transitions
- Responsive design optimized for extension popup
- Color-coded indicators for different food types:
  - 🌱 Green: Vegetarian
  - 🍖 Red: Non-vegetarian  
  - 🥚 Orange: Contains eggs

### 🔧 Technical Architecture
- **Modular API Calls**: Separate API calls for each analysis component
- **Parallel Processing**: Multiple analyses run simultaneously for better performance
- **Structured Prompts**: Specific prompts for each analysis type with expected JSON formats
- **Error Handling**: Robust error handling with fallback displays

## Installation

### Prerequisites
- Node.js and npm/pnpm installed
- Chrome browser
- Backend server running on localhost:3000

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd bkend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env` file with required API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   PINECONE_API_KEY=your_pinecone_api_key
   # Add other required environment variables
   ```

4. Start the server:
   ```bash
   node server.js
   ```

### Extension Installation
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension1` folder
4. The HealthWise extension will appear in your extensions toolbar

## Usage

### Analyzing Food Products
1. Navigate to a food product page (supports Flipkart, Amazon, and general websites)
2. Click the HealthWise extension icon in your toolbar
3. Click "Analyze Product" button
4. Wait for comprehensive analysis to complete
5. Review the detailed health insights provided

### Analysis Components

#### Food Preference
- Shows whether the product is vegetarian, non-vegetarian, or contains eggs
- Color-coded badge with explanation

#### Health Grade (A-E Scale)
- **Grade A**: Excellent nutritional choice
- **Grade B**: Good with minor concerns
- **Grade C**: Moderate quality
- **Grade D**: Poor nutritional value
- **Grade E**: Avoid if possible

#### Risk Assessment
- Visual gauge showing risk level from Low to High
- Considers user's allergy profile and health conditions
- Specific risk factors and concerns listed

#### Allergen Alerts
- Identifies allergens matching user's profile
- Severity levels: High (🚨), Medium (⚠️), Low (⚡)
- Specific warnings and recommendations

#### Nutrition Facts
- Detailed nutritional information per serving
- Calories, protein, fat, carbohydrates, fiber, sugar, sodium
- Visual charts showing percentage breakdown

## API Endpoints

### `/llm-call` (POST)
Main endpoint for AI analysis. Expects:
```json
{
  "query": "analysis request with specific format requirements"
}
```

### `/parse-website` (POST)
Scrapes product information from supported websites:
```json
{
  "url": "https://example.com/product"
}
```

### `/health` (GET)
Health check endpoint for server status

## Supported Websites
- **Flipkart**: Products with valid PIDs
- **Amazon India**: Product detail pages
- **General websites**: Any website with food product information

## JSON Response Formats

The extension uses structured JSON responses for each analysis type:

### Food Preference
```json
{
  "category": "veg|non-veg|egg",
  "description": "Brief explanation",
  "confidence": "high|medium|low"
}
```

### Health Grade
```json
{
  "grade": "A|B|C|D|E",
  "title": "Grade description",
  "description": "Detailed explanation",
  "factors": ["factor1", "factor2"]
}
```

### Risk Assessment
```json
{
  "riskScore": 25,
  "riskLevel": "low|medium|high", 
  "description": "Risk explanation",
  "primaryConcerns": ["concern1", "concern2"]
}
```

## Development

### File Structure
```
extension1/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI structure
├── popup.js          # JavaScript logic and API calls
├── styles.css        # Modern CSS styling
└── content.js        # Content script

bkend/
├── server.js         # Express server with endpoints
├── services/         # AI and external services
├── routes/           # API route handlers
└── documents/        # Scraped content storage
```

### Key Technologies
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js
- **AI**: Google Gemini API
- **Web Scraping**: Playwright
- **Styling**: Modern CSS with Inter font

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License
This project is licensed under the MIT License.

## Support
For issues or questions, please create an issue in the repository or contact the development team.
