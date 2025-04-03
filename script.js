// DOM Elements
const downloadForm = document.getElementById('download-form');
const videoUrlInput = document.getElementById('video-url');
const errorMessage = document.getElementById('error-message');
const loader = document.getElementById('loader');
const result = document.getElementById('result');
const videoThumbnail = document.getElementById('video-thumbnail');
const videoTitle = document.getElementById('video-title');
const hdButton = document.getElementById('hd-btn');
const sdButton = document.getElementById('sd-btn');

// API endpoint for Facebook video downloads
const API_ENDPOINT = 'https://facebook-downloader.apis-bj-devs.workers.dev/?url=';

// Event listeners
downloadForm.addEventListener('submit', handleDownload);
hdButton.addEventListener('click', () => handleQualitySelection('hd'));
sdButton.addEventListener('click', () => handleQualitySelection('sd'));

// Store video data
let currentVideoData = null;

/**
 * Handles the form submission to download a Facebook video
 * @param {Event} event - The form submit event
 */
async function handleDownload(event) {
    event.preventDefault();
    
    const videoUrl = videoUrlInput.value.trim();
    
    // Reset UI
    resetUI();
    
    // Validate URL
    if (!validateFacebookUrl(videoUrl)) {
        displayError('Please enter a valid Facebook video URL');
        return;
    }
    
    try {
        // Show loader
        loader.style.display = 'flex';
        
        // Fetch video information
        const videoData = await fetchVideoInfo(videoUrl);
        
        // Store video data for later use
        currentVideoData = videoData;
        
        // Display video information
        displayVideoInfo(videoData);
    } catch (error) {
        displayError('Failed to fetch video information. Please try again.');
        console.error('Error:', error);
    } finally {
        // Hide loader
        loader.style.display = 'none';
    }
}

/**
 * Validates if a given URL is a valid Facebook video URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateFacebookUrl(url) {
    if (!url) return false;
    
    // Regex pattern for Facebook video URLs
    const patterns = [
        /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/.*\/videos\/.*$/i,
        /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/watch\?v=.*$/i,
        /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/.*\/videos\/.*\/.*$/i,
        /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/.*\/posts\/.*$/i,
        /^https?:\/\/(www\.|m\.|web\.)?(facebook|fb)\.com\/.*\/reels\/.*$/i
    ];
    
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Fetches Facebook video information using the provided URL
 * @param {string} videoUrl - The Facebook video URL
 * @returns {Promise<object>} - Promise resolving to video data
 */
async function fetchVideoInfo(videoUrl) {
    const response = await fetch(`${API_ENDPOINT}${encodeURIComponent(videoUrl)}`);
    
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.status) {
        throw new Error('API returned an unsuccessful response');
    }
    
    return processApiResponse(data);
}

/**
 * Processes the API response to extract video information
 * @param {object} apiResponse - The API response
 * @returns {object} - Processed video data
 */
function processApiResponse(apiResponse) {
    // Extract data from API response
    const { data } = apiResponse;
    
    if (!data) {
        throw new Error('No data found in API response');
    }
    
    // Create download qualities
    const downloadQualities = [];
    
    // If HD quality is available
    if (data.url && data.quality === 'HD') {
        downloadQualities.push({
            label: 'HD Quality',
            quality: 'hd',
            url: data.url
        });
        
        // Add SD quality option (same URL for now, API doesn't provide separate SD URL)
        downloadQualities.push({
            label: 'SD Quality',
            quality: 'sd',
            url: data.url
        });
    } else if (data.url) {
        // If only one quality is available
        downloadQualities.push({
            label: 'Standard Quality',
            quality: 'sd',
            url: data.url
        });
    }
    
    return {
        success: true,
        title: 'Facebook Video', // API doesn't provide title
        thumbnail: data.thumbnail || '',
        downloadQualities
    };
}

/**
 * Displays video information in the UI
 * @param {object} videoData - The video data to display
 */
function displayVideoInfo(videoData) {
    if (!videoData.success || !videoData.downloadQualities.length) {
        displayError('No download options available for this video');
        return;
    }
    
    // Set thumbnail
    if (videoData.thumbnail) {
        videoThumbnail.src = videoData.thumbnail;
        videoThumbnail.alt = videoData.title || 'Facebook Video';
    } else {
        videoThumbnail.src = 'https://via.placeholder.com/200x200?text=No+Thumbnail';
    }
    
    // Set title
    videoTitle.textContent = videoData.title || 'Facebook Video';
    
    // Show/hide quality buttons based on available options
    const hasHD = videoData.downloadQualities.some(q => q.quality === 'hd');
    const hasSD = videoData.downloadQualities.some(q => q.quality === 'sd');
    
    hdButton.style.display = hasHD ? 'inline-flex' : 'none';
    sdButton.style.display = hasSD ? 'inline-flex' : 'none';
    
    // Show result container
    result.style.display = 'block';
}

/**
 * Handles quality selection and initiates download
 * @param {string} quality - The selected quality (hd or sd)
 */
function handleQualitySelection(quality) {
    if (!currentVideoData || !currentVideoData.downloadQualities.length) {
        displayError('No video data available');
        return;
    }
    
    const selectedQuality = currentVideoData.downloadQualities.find(q => q.quality === quality);
    
    if (!selectedQuality) {
        displayError(`${quality.toUpperCase()} quality not available for this video`);
        return;
    }
    
    // Create a download link and trigger it
    const downloadLink = document.createElement('a');
    downloadLink.href = selectedQuality.url;
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener noreferrer';
    downloadLink.download = `facebook-video-${quality}.mp4`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Displays an error message in the UI
 * @param {string} message - The error message to display
 */
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Resets the UI state
 */
function resetUI() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    result.style.display = 'none';
    videoThumbnail.src = '';
    videoTitle.textContent = '';
    currentVideoData = null;
}