// ============================================================================
// Admin Panel JavaScript
// ============================================================================

let currentUploadTab = 'video';
let currentLibraryTab = 'videos';
let analyzedSegments = [];

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    renderLibrary();
    updateStats();
});

// ============================================================================
// Tab Management
// ============================================================================

function switchUploadTab(tab) {
    currentUploadTab = tab;

    // Update tab buttons
    document.querySelectorAll('.upload-section .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show/hide forms
    document.getElementById('video-upload').classList.toggle('active', tab === 'video');
    document.getElementById('pdf-upload').classList.toggle('active', tab === 'pdf');
}

function switchLibraryTab(tab) {
    currentLibraryTab = tab;

    // Update tab buttons
    document.querySelectorAll('.library-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Show/hide library sections
    document.getElementById('videos-library').classList.toggle('active', tab === 'videos');
    document.getElementById('pdfs-library').classList.toggle('active', tab === 'pdfs');
    document.getElementById('intents-library').classList.toggle('active', tab === 'intents');
}

// ============================================================================
// Video Upload & Analysis
// ============================================================================

async function analyzeVideoTranscript() {
    const transcript = document.getElementById('video-transcript').value.trim();

    if (!transcript) {
        alert('Please paste a transcript first');
        return;
    }

    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span>⏳ Analyzing...</span>';

    try {
        // Parse transcript
        const segments = parseTranscript(transcript);

        // Call AI to analyze and suggest segments
        const systemPrompt = `You are analyzing a sales demo transcript to identify key segments for an AI-guided product tour.

Your task:
1. Identify 3-5 key demo segments (topics/themes discussed)
2. For each segment, provide:
   - A descriptive title
   - Start timestamp (approximate)
   - Key topics covered
   - What buyer questions this answers

Format your response as JSON:
[
  {
    "title": "Segment title",
    "timestamp": "2:30",
    "topics": ["topic1", "topic2"],
    "answers": "What buyer question this answers"
  }
]`;

        const userMessage = `Analyze this demo transcript and suggest key segments:\n\n${segmentsToText(segments.slice(0, 50))}`; // First 50 segments to avoid token limits

        const aiResponse = await callClaudeAPI(systemPrompt, userMessage);

        // Parse AI response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            analyzedSegments = JSON.parse(jsonMatch[0]);
            displaySuggestedSegments(analyzedSegments);
        } else {
            throw new Error('Could not parse AI response');
        }

    } catch (error) {
        console.error('Error analyzing transcript:', error);
        alert('Error analyzing transcript: ' + error.message);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span>🤖 Analyze Transcript (AI)</span>';
    }
}

function displaySuggestedSegments(segments) {
    const container = document.getElementById('suggested-segments');
    const suggestionsDiv = document.getElementById('ai-suggestions');

    container.innerHTML = segments.map((seg, i) => `
        <div class="segment-suggestion">
            <div class="segment-header">
                <strong>${seg.title}</strong>
                <span class="timestamp">@ ${seg.timestamp}</span>
            </div>
            <div class="segment-details">
                <p><strong>Topics:</strong> ${seg.topics.join(', ')}</p>
                <p><strong>Answers:</strong> ${seg.answers}</p>
            </div>
        </div>
    `).join('');

    suggestionsDiv.style.display = 'block';
}

function saveVideo() {
    const url = document.getElementById('video-url').value.trim();
    const title = document.getElementById('video-title').value.trim();
    const transcript = document.getElementById('video-transcript').value.trim();
    const tagsInput = document.getElementById('video-tags').value.trim();

    if (!url || !title || !transcript) {
        alert('Please fill in URL, title, and transcript');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    const videoData = {
        url,
        title,
        transcript,
        segments: parseTranscript(transcript),
        analyzedSegments: analyzedSegments,
        tags
    };

    if (saveVideo(videoData)) {
        alert('Video saved successfully!');
        // Clear form
        document.getElementById('video-url').value = '';
        document.getElementById('video-title').value = '';
        document.getElementById('video-transcript').value = '';
        document.getElementById('video-tags').value = '';
        document.getElementById('ai-suggestions').style.display = 'none';
        analyzedSegments = [];

        renderLibrary();
        updateStats();
    } else {
        alert('Error saving video');
    }
}

// ============================================================================
// PDF Upload
// ============================================================================

function savePDF() {
    const url = document.getElementById('pdf-url').value.trim();
    const title = document.getElementById('pdf-title').value.trim();
    const type = document.getElementById('pdf-type').value;
    const topics = document.getElementById('pdf-topics').value.trim();
    const tagsInput = document.getElementById('pdf-tags').value.trim();

    if (!url || !title) {
        alert('Please fill in URL and title');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    const pdfData = {
        url,
        title,
        type,
        topics,
        tags
    };

    if (savePDF(pdfData)) {
        alert('Document saved successfully!');
        // Clear form
        document.getElementById('pdf-url').value = '';
        document.getElementById('pdf-title').value = '';
        document.getElementById('pdf-topics').value = '';
        document.getElementById('pdf-tags').value = '';

        renderLibrary();
        updateStats();
    } else {
        alert('Error saving document');
    }
}

// ============================================================================
// Library Rendering
// ============================================================================

function renderLibrary() {
    renderVideos();
    renderPDFs();
    renderIntents();
}

function renderVideos() {
    const videos = getAllVideos();
    const container = document.getElementById('videos-list');

    if (videos.length === 0) {
        container.innerHTML = '<div class="empty-state">No videos uploaded yet. Add your first video above!</div>';
        return;
    }

    container.innerHTML = videos.map(video => `
        <div class="content-card">
            <div class="card-header">
                <h4>${escapeHtml(video.title)}</h4>
                <button onclick="deleteVideoById(${video.id})" class="btn-delete">×</button>
            </div>
            <div class="card-body">
                <p class="card-meta">${video.segments?.length || 0} segments • ${video.tags?.length || 0} tags</p>
                ${video.tags && video.tags.length > 0 ? `
                    <div class="tags">
                        ${video.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                ${video.analyzedSegments && video.analyzedSegments.length > 0 ? `
                    <div class="segments-preview">
                        <strong>Key Segments:</strong>
                        ${video.analyzedSegments.map(s => `<span class="segment-tag">${escapeHtml(s.title)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <a href="${video.url}" target="_blank" class="btn-link">View Video</a>
            </div>
        </div>
    `).join('');
}

function renderPDFs() {
    const pdfs = getAllPDFs();
    const container = document.getElementById('pdfs-list');

    if (pdfs.length === 0) {
        container.innerHTML = '<div class="empty-state">No documents uploaded yet. Add your first document above!</div>';
        return;
    }

    container.innerHTML = pdfs.map(pdf => `
        <div class="content-card">
            <div class="card-header">
                <h4>${escapeHtml(pdf.title)}</h4>
                <button onclick="deletePDFById(${pdf.id})" class="btn-delete">×</button>
            </div>
            <div class="card-body">
                <p class="card-meta"><span class="type-badge">${pdf.type}</span></p>
                ${pdf.topics ? `<p class="topics">${escapeHtml(pdf.topics)}</p>` : ''}
                ${pdf.tags && pdf.tags.length > 0 ? `
                    <div class="tags">
                        ${pdf.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <a href="${pdf.url}" target="_blank" class="btn-link">View Document</a>
            </div>
        </div>
    `).join('');
}

function renderIntents() {
    const intents = getIntents();
    const container = document.getElementById('intents-list');

    if (intents.length === 0) {
        return;
    }

    container.innerHTML = intents.map((intent, i) => `
        <div class="intent-card">
            <h4>${escapeHtml(intent.title)}</h4>
            <p>${escapeHtml(intent.description)}</p>
            <div class="intent-meta">
                <span>${intent.relevantContent?.length || 0} related items</span>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// Delete Functions
// ============================================================================

function deleteVideoById(id) {
    if (confirm('Are you sure you want to delete this video?')) {
        deleteVideo(id);
        renderLibrary();
        updateStats();
    }
}

function deletePDFById(id) {
    if (confirm('Are you sure you want to delete this document?')) {
        deletePDF(id);
        renderLibrary();
        updateStats();
    }
}

// ============================================================================
// Generate Intents
// ============================================================================

async function generateIntents() {
    const videos = getAllVideos();
    const pdfs = getAllPDFs();

    if (videos.length === 0 && pdfs.length === 0) {
        alert('Please add some content first before generating intents');
        return;
    }

    showLoading('intents-list', 'Generating intent options...');

    try {
        // Prepare content summary for AI
        const contentSummary = {
            videos: videos.map(v => ({
                title: v.title,
                tags: v.tags,
                segments: v.analyzedSegments?.map(s => s.title) || []
            })),
            pdfs: pdfs.map(p => ({
                title: p.title,
                type: p.type,
                topics: p.topics,
                tags: p.tags
            }))
        };

        const systemPrompt = `You are analyzing a company's demo content library to suggest buyer intent options for a self-guided product tour.

Based on the content available, suggest 4 buyer intent options that:
1. Are outcome-focused (not feature-focused)
2. Represent common buyer questions
3. Can be answered by the available content
4. Cover different use cases/personas

Format your response as JSON:
[
  {
    "title": "Short intent title (4-6 words)",
    "description": "One sentence describing what they'll learn",
    "relevantContent": ["video/pdf titles that address this"]
  }
]`;

        const userMessage = `Based on this content library, suggest 4 buyer intent options:\n\n${JSON.stringify(contentSummary, null, 2)}`;

        const aiResponse = await callClaudeAPI(systemPrompt, userMessage);

        // Parse AI response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const intents = JSON.parse(jsonMatch[0]);
            saveIntents(intents);
            renderIntents();
        } else {
            throw new Error('Could not parse AI response');
        }

    } catch (error) {
        console.error('Error generating intents:', error);
        showError('intents-list', 'Error generating intents: ' + error.message);
    }
}

// ============================================================================
// Stats
// ============================================================================

function updateStats() {
    const videos = getAllVideos();
    const pdfs = getAllPDFs();

    document.getElementById('video-count').textContent = `${videos.length} video${videos.length !== 1 ? 's' : ''}`;
    document.getElementById('pdf-count').textContent = `${pdfs.length} document${pdfs.length !== 1 ? 's' : ''}`;
}

// ============================================================================
// Export
// ============================================================================

function exportContent() {
    exportAllData();
}
