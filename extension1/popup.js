console.log('🚀 HealthWise Extension loaded');

// API Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/llm-call';

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const currentUrl = document.getElementById('currentUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const spinner = document.getElementById('spinner');
const buttonText = document.querySelector('.button-text');
const loadingContainer = document.getElementById('loadingContainer');
const loadingText = document.getElementById('loadingText');
const resultsContainer = document.getElementById('resultsContainer');
const statusMessage = document.getElementById('statusMessage');

// Result elements
const foodPreference = document.getElementById('foodPreference');
const preferenceBadge = document.getElementById('preferenceBadge');
const preferenceDescription = document.getElementById('preferenceDescription');
const healthGrade = document.getElementById('healthGrade');
const gradeCircle = document.getElementById('gradeCircle');
const gradeLetter = document.getElementById('gradeLetter');
const gradeTitle = document.getElementById('gradeTitle');
const gradeDescription = document.getElementById('gradeDescription');
const riskMeter = document.getElementById('riskMeter');
const meterNeedle = document.getElementById('meterNeedle');
const riskDescription = document.getElementById('riskDescription');
const allergenCard = document.getElementById('allergenCard');
const allergenAlerts = document.getElementById('allergenAlerts');
const nutritionTable = document.getElementById('nutritionTable');
const nutritionCharts = document.getElementById('nutritionCharts');

// Prompts for different analysis components
const PROMPTS = {
    foodPreference: {
        query: "Analyze the food product and determine if it's vegetarian, non-vegetarian, or contains eggs. Provide a clear classification.",
        expectedFormat: `Return JSON in this exact format:
{
  "category": "veg|non-veg|egg",
  "description": "Brief explanation of why this classification was chosen",
  "confidence": "high|medium|low"
}`
    },
    
    healthGrade: {
        query: "Grade this food product's healthiness from A (excellent) to E (poor) based on ingredients, nutritional value, processing level, and overall health impact.",
        expectedFormat: `Return JSON in this exact format:
{
  "grade": "A|B|C|D|E",
  "title": "Short title like 'Excellent Choice' or 'Poor Quality'",
  "description": "2-3 sentence explanation of why this grade was given",
  "factors": ["factor1", "factor2", "factor3"]
}`
    },
    
    riskAssessment: {
        query: "Assess the health risk level of this product for the user considering their allergies and health profile. Rate from 1-100 where 1 is lowest risk and 100 is highest risk.",
        expectedFormat: `Return JSON in this exact format:
{
  "riskScore": 25,
  "riskLevel": "low|medium|high",
  "description": "Brief explanation of the risk factors",
  "primaryConcerns": ["concern1", "concern2"]
}`
    },
    
    allergenAnalysis: {
        query: "Identify potential allergens in this product that match the user's allergy profile. Provide specific warnings and severity levels.",
        expectedFormat: `Return JSON in this exact format:
{
  "hasAllergens": true,
  "alerts": [
    {
      "allergen": "allergen name",
      "severity": "high|medium|low",
      "description": "Specific warning message",
      "icon": "⚠️|🚨|⚡"
    }
  ]
}`
    },
    
    nutritionFacts: {
        query: "Extract and calculate nutritional information per serving including calories, protein, fat, carbohydrates, fiber, sugar, sodium, etc. Provide accurate values.",
        expectedFormat: `Return JSON in this exact format:
{
  "servingSize": "100g",
  "nutrients": {
    "calories": 250,
    "protein": "12g",
    "fat": "8g",
    "carbohydrates": "35g",
    "fiber": "3g",
    "sugar": "5g",
    "sodium": "450mg"
  }
}`
    },
    
    nutritionalBreakdown: {
        query: "Provide percentage breakdown of macronutrients (protein, fat, carbs) and key micronutrients for visual chart representation.",
        expectedFormat: `Return JSON in this exact format:
{
  "macronutrients": {
    "protein": { "percentage": 25, "amount": "12g" },
    "fat": { "percentage": 30, "amount": "8g" },
    "carbohydrates": { "percentage": 45, "amount": "35g" }
  },
  "micronutrients": {
    "fiber": { "percentage": 15, "amount": "3g" },
    "sodium": { "percentage": 85, "amount": "450mg" }
  }
}`
    }
};

// Utility Functions
function showStatus(message, type = 'info', duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type} show`;
    
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, duration);
}

function setConnectionStatus(connected) {
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('span');
    
    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

function setLoading(isLoading, stage = 'Processing ingredients...') {
    analyzeBtn.disabled = isLoading;
    
    if (isLoading) {
        spinner.classList.add('show');
        buttonText.textContent = 'Analyzing...';
        loadingText.textContent = stage;
        loadingContainer.style.display = 'block';
        resultsContainer.style.display = 'none';
    } else {
        spinner.classList.remove('show');
        buttonText.textContent = 'Analyze Product';
        loadingContainer.style.display = 'none';
    }
}

async function getCurrentTabUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        // currentUrl.textContent = url;
        return url;
    } catch (error) {
        console.error('Error getting URL:', error);
        // currentUrl.textContent = 'Error loading URL';
        return null;
    }
}

// API Call Function
async function makeAPICall(query, expectedFormat) {
    const fullPrompt = `${query}

${expectedFormat}

IMPORTANT: Return ONLY valid JSON without any additional text, markdown, or explanations.`;

    try {
        console.log('Making API call with query:', query.substring(0, 100) + '...');
        
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: fullPrompt })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API call failed with status ${response.status}:`, errorText);
            throw new Error(`API call failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response received:', data);
        
        // Parse the response to get JSON
        let jsonData;
        try {
            // If the response is already JSON
            if (typeof data.answer === 'object') {
                jsonData = data.answer;
            } else {
                // Try to extract JSON from string response
                const jsonMatch = data.answer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[0]);
                } else {
                    console.error('No JSON found in response:', data.answer);
                    throw new Error('No valid JSON found in response');
                }
            }
        } catch (e) {
            console.error('JSON parsing error:', e);
            console.log('Raw response:', data.answer);
            throw new Error('Invalid JSON response from API');
        }

        return jsonData;
        
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Analysis Functions
async function analyzeFoodPreference() {
    setLoading(true, 'Analyzing food category...');
    try {
        const data = await makeAPICall(PROMPTS.foodPreference.query, PROMPTS.foodPreference.expectedFormat);
        
        preferenceBadge.className = `preference-badge ${data.category}`;
        preferenceBadge.querySelector('.preference-text').textContent = 
            data.category === 'veg' ? '🌱 Vegetarian' : 
            data.category === 'non-veg' ? '🍖 Non-Vegetarian' : '🥚 Contains Eggs';
        
        preferenceDescription.textContent = data.description;
        
    } catch (error) {
        console.error('Food preference analysis failed:', error);
        preferenceBadge.querySelector('.preference-text').textContent = 'Analysis Failed';
        preferenceDescription.textContent = 'Unable to determine food category';
    }
}

async function analyzeHealthGrade() {
    setLoading(true, 'Calculating health grade...');
    try {
        const data = await makeAPICall(PROMPTS.healthGrade.query, PROMPTS.healthGrade.expectedFormat);
        
        gradeCircle.className = `grade-circle grade-${data.grade.toLowerCase()}`;
        gradeLetter.textContent = data.grade;
        gradeTitle.textContent = data.title;
        gradeDescription.textContent = data.description;
        
    } catch (error) {
        console.error('Health grade analysis failed:', error);
        gradeLetter.textContent = '?';
        gradeTitle.textContent = 'Analysis Failed';
        gradeDescription.textContent = 'Unable to calculate health grade';
    }
}

async function analyzeRiskAssessment() {
    setLoading(true, 'Assessing health risks...');
    try {
        const data = await makeAPICall(PROMPTS.riskAssessment.query, PROMPTS.riskAssessment.expectedFormat);
        
        // Convert risk score (1-100) to needle rotation (-90 to 90 degrees)
        const rotation = (data.riskScore - 50) * 1.8; // -90 to +90 degrees
        meterNeedle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        
        riskDescription.textContent = `${data.riskLevel.toUpperCase()} RISK: ${data.description}`;
        
    } catch (error) {
        console.error('Risk assessment failed:', error);
        riskDescription.textContent = 'Risk assessment unavailable';
    }
}

async function analyzeAllergens() {
    setLoading(true, 'Checking for allergens...');
    try {
        const data = await makeAPICall(PROMPTS.allergenAnalysis.query, PROMPTS.allergenAnalysis.expectedFormat);
        
        if (data.hasAllergens && data.alerts.length > 0) {
            allergenCard.style.display = 'block';
            
            allergenAlerts.innerHTML = data.alerts.map(alert => `
                <div class="allergen-alert ${alert.severity === 'high' ? '' : 'warning'}">
                    <span class="allergen-icon">${alert.icon}</span>
                    <div class="allergen-text">
                        <strong>${alert.allergen}</strong><br>
                        ${alert.description}
                    </div>
                </div>
            `).join('');
        } else {
            allergenCard.style.display = 'none';
        }
        
    } catch (error) {
        console.error('Allergen analysis failed:', error);
        allergenCard.style.display = 'none';
    }
}

async function analyzeNutritionFacts() {
    setLoading(true, 'Extracting nutrition facts...');
    try {
        const data = await makeAPICall(PROMPTS.nutritionFacts.query, PROMPTS.nutritionFacts.expectedFormat);
        
        nutritionTable.innerHTML = Object.entries(data.nutrients).map(([key, value]) => `
            <div class="nutrition-row">
                <span class="nutrition-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span class="nutrition-value">${value}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Nutrition facts analysis failed:', error);
        nutritionTable.innerHTML = '<div class="nutrition-row"><span>Nutrition data unavailable</span></div>';
    }
}

async function analyzeNutritionalBreakdown() {
    setLoading(true, 'Creating nutritional charts...');
    try {
        const data = await makeAPICall(PROMPTS.nutritionalBreakdown.query, PROMPTS.nutritionalBreakdown.expectedFormat);
        
        const allNutrients = { ...data.macronutrients, ...data.micronutrients };
        
        nutritionCharts.innerHTML = Object.entries(allNutrients).map(([nutrient, info]) => `
            <div class="chart-item">
                <div class="chart-circle" style="--percentage: ${info.percentage}%">
                    <div class="chart-value">${info.percentage}%</div>
                </div>
                <div class="chart-label">${nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Nutritional breakdown failed:', error);
        nutritionCharts.innerHTML = '<div class="chart-item"><div>Charts unavailable</div></div>';
    }
}

// Main Analysis Function
async function analyzeProduct() {
    const url = await getCurrentTabUrl();
    if (!url) {
        showStatus('Unable to get current page URL', 'error');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showStatus('Please navigate to a product page to analyze', 'error');
        return;
    }

    try {
        setLoading(true, 'Parsing website content...');
        
        // First, parse the website to get context
        const parseResponse = await fetch(`${API_BASE_URL}/parse-website`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });

        if (!parseResponse.ok) {
            const errorData = await parseResponse.json().catch(() => ({ error: 'Parse failed' }));
            throw new Error(errorData.error || 'Failed to parse website');
        }

        const parseData = await parseResponse.json();
        if (!parseData.success) {
            throw new Error('Website parsing failed');
        }

        showStatus('Website parsed successfully! Starting analysis...', 'info');
        setLoading(true, 'Running comprehensive analysis...');
        
        // Now run all analyses in parallel
        await Promise.allSettled([
            analyzeFoodPreference(),
            analyzeHealthGrade(),
            analyzeRiskAssessment(),
            analyzeAllergens(),
            analyzeNutritionFacts(),
            analyzeNutritionalBreakdown()
        ]);

        setLoading(false);
        resultsContainer.style.display = 'block';
        showStatus('Analysis complete!', 'success');
        
    } catch (error) {
        console.error('Analysis failed:', error);
        setLoading(false);
        showStatus(`Analysis failed: ${error.message}`, 'error');
    }
}

// Event Listeners
analyzeBtn.addEventListener('click', analyzeProduct);

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 HealthWise Extension initialized');
    
    await getCurrentTabUrl();
    
    // Test server connection
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            setConnectionStatus(true);
            
            // Check if context is available
            const contextResponse = await fetch(`${API_BASE_URL}/get-context`);
            const contextData = await contextResponse.json();
            
            if (contextData.hasContext) {
                showStatus(`Ready! Context loaded (${contextData.contextLength} chars)`, 'success');
            } else {
                showStatus('Connected. Navigate to a product page to analyze.', 'info');
            }
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        console.error('Server connection failed:', error);
        setConnectionStatus(false);
        showStatus('Server connection failed. Please start the backend server.', 'error', 5000);
    }
});