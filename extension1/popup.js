console.log('🚀 Popup script loaded');

const API_BASE_URL = 'http://localhost:3000';

// DOM elements
const parseBtn = document.getElementById('parseBtn');
const spinner = document.getElementById('spinner');
const buttonText = document.querySelector('.button-text');
const status = document.getElementById('status');
const currentUrl = document.getElementById('currentUrl');
const resultContainer = document.getElementById('resultContainer');
const resultContent = document.getElementById('resultContent');
const resultInfo = document.getElementById('resultInfo');

// Get current tab URL and display it
async function getCurrentTabUrl() {
    try {
        console.log('📋 Getting current tab URL');
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;
        console.log('✅ Current URL:', url);
        currentUrl.textContent = url;
        return url;
    } catch (error) {
        console.error('❌ Error getting current tab URL:', error);
        currentUrl.textContent = 'Error getting URL';
        showStatus('Error getting current URL', 'error');
        return null;
    }
}

// Show status message
function showStatus(message, type = 'info') {
    console.log(`📢 Status [${type}]:`, message);
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    // Auto-hide after 5 seconds for non-error messages
    if (type !== 'error') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// Toggle loading state
function setLoading(isLoading) {
    console.log('🔄 Setting loading state:', isLoading);
    parseBtn.disabled = isLoading;
    
    if (isLoading) {
        spinner.classList.add('show');
        buttonText.textContent = 'Parsing...';
    } else {
        spinner.classList.remove('show');
        buttonText.textContent = 'Parse Current Website';
    }
}

// Parse website function
async function parseWebsite(url) {
    console.log('🔍 Starting website parsing for:', url);
    setLoading(true);
    showStatus('Sending request to server...', 'info');
    
    try {
        console.log('📡 Making API request to:', `${API_BASE_URL}/parse-website`);
        
        const response = await fetch(`${API_BASE_URL}/parse-website`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        console.log('📨 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Response received:', {
            success: data.success,
            contentLength: data.content?.length || 0,
            url: data.url
        });
        
        if (data.success) {
            showStatus('✅ Website parsed successfully!', 'success');
            displayResult(data);
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('❌ Error parsing website:', error);
        
        let errorMessage = 'Failed to parse website';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Cannot connect to server. Make sure the Express server is running on localhost:3000';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showStatus(`❌ ${errorMessage}`, 'error');
        resultContainer.style.display = 'none';
    } finally {
        setLoading(false);
    }
}

// Display parsing result
function displayResult(data) {
    console.log('📄 Displaying result');
    
    const contentPreview = data.content.substring(0, 500) + 
        (data.content.length > 500 ? '...' : '');
    
    resultContent.textContent = contentPreview;
    resultInfo.textContent = `${data.content.length} characters • ${new Date(data.timestamp).toLocaleTimeString()}`;
    resultContainer.style.display = 'block';
    
    console.log('✅ Result displayed successfully');
}

// Event listeners
parseBtn.addEventListener('click', async () => {
    console.log('🔘 Parse button clicked');
    const url = await getCurrentTabUrl();
    
    if (!url) {
        console.log('❌ No URL available');
        return;
    }
    
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.log('❌ Invalid URL protocol:', url);
        showStatus('❌ Can only parse HTTP/HTTPS websites', 'error');
        return;
    }
    
    await parseWebsite(url);
});

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Popup DOM loaded');
    await getCurrentTabUrl();
    
    // Test server connection
    try {
        console.log('🔗 Testing server connection');
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Server connection successful');
            showStatus('Ready to parse websites', 'success');
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        console.error('❌ Server connection failed:', error);
        showStatus('⚠️ Server connection failed. Make sure Express server is running.', 'error');
    }
});