// ============================================================================
// Shared Utilities for AI Discovery Tour
// ============================================================================

// Proxy server deployed on Railway
const PROXY_URL = 'https://kierinfgithubio-production.up.railway.app/api/messages';

// Storage keys
const STORAGE_KEYS = {
    VIDEOS: 'discovery_tour_videos',
    PDFS: 'discovery_tour_pdfs',
    INTENTS: 'discovery_tour_intents',
    TOUR_STATE: 'discovery_tour_state'
};

// ============================================================================
// LocalStorage Utilities
// ============================================================================

function getStoredData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
    }
}

function setStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
    }
}

// ============================================================================
// Content Management
// ============================================================================

function getAllVideos() {
    return getStoredData(STORAGE_KEYS.VIDEOS) || [];
}

function saveVideo(videoData) {
    const videos = getAllVideos();
    videoData.id = Date.now();
    videoData.createdAt = new Date().toISOString();
    videos.push(videoData);
    return setStoredData(STORAGE_KEYS.VIDEOS, videos);
}

function updateVideo(id, updates) {
    const videos = getAllVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
        videos[index] = { ...videos[index], ...updates, updatedAt: new Date().toISOString() };
        return setStoredData(STORAGE_KEYS.VIDEOS, videos);
    }
    return false;
}

function deleteVideo(id) {
    const videos = getAllVideos();
    const filtered = videos.filter(v => v.id !== id);
    return setStoredData(STORAGE_KEYS.VIDEOS, filtered);
}

function getAllPDFs() {
    return getStoredData(STORAGE_KEYS.PDFS) || [];
}

function savePDF(pdfData) {
    const pdfs = getAllPDFs();
    pdfData.id = Date.now();
    pdfData.createdAt = new Date().toISOString();
    pdfs.push(pdfData);
    return setStoredData(STORAGE_KEYS.PDFS, pdfs);
}

function deletePDF(id) {
    const pdfs = getAllPDFs();
    const filtered = pdfs.filter(p => p.id !== id);
    return setStoredData(STORAGE_KEYS.PDFS, filtered);
}

function getIntents() {
    return getStoredData(STORAGE_KEYS.INTENTS) || [];
}

function saveIntents(intents) {
    return setStoredData(STORAGE_KEYS.INTENTS, intents);
}

// ============================================================================
// Transcript Parsing
// ============================================================================

function parseTranscript(transcriptText) {
    const lines = transcriptText.split('\n');
    const segments = [];
    let currentSegment = null;

    for (const line of lines) {
        // Match timestamp pattern: "0:00 | Speaker"
        const timestampMatch = line.match(/^(\d+):(\d+)\s*\|\s*(.+)$/);

        if (timestampMatch) {
            // Save previous segment
            if (currentSegment) {
                segments.push(currentSegment);
            }

            // Start new segment
            const minutes = parseInt(timestampMatch[1]);
            const seconds = parseInt(timestampMatch[2]);
            const speaker = timestampMatch[3].trim();

            currentSegment = {
                timestamp: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                timeInSeconds: minutes * 60 + seconds,
                speaker: speaker,
                text: ''
            };
        } else if (currentSegment && line.trim()) {
            // Add text to current segment
            currentSegment.text += (currentSegment.text ? ' ' : '') + line.trim();
        }
    }

    // Add last segment
    if (currentSegment) {
        segments.push(currentSegment);
    }

    return segments;
}

function segmentsToText(segments) {
    return segments.map(s => `${s.timestamp} | ${s.speaker}\n${s.text}`).join('\n\n');
}

// ============================================================================
// Claude API Integration
// ============================================================================

async function callClaudeAPI(systemPrompt, userMessage, conversationHistory = []) {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 3000,
                system: systemPrompt,
                messages: [
                    ...conversationHistory,
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw error;
    }
}

// ============================================================================
// Video URL Processing
// ============================================================================

function getVideoEmbedURL(url) {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null;
    }

    // Vimeo
    if (url.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
        return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
    }

    return url; // Direct video URL
}

function getPDFEmbedURL(url) {
    // Google Drive
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
        return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    }

    return url;
}

// ============================================================================
// UI Utilities
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="loading">${message}</div>`;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    }
}

// ============================================================================
// Export
// ============================================================================

function exportAllData() {
    const data = {
        videos: getAllVideos(),
        pdfs: getAllPDFs(),
        intents: getIntents(),
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discovery-tour-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
