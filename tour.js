// ============================================================================
// Tour Experience JavaScript
// ============================================================================

let tourState = {
    active: false,
    selectedIntent: null,
    conversationHistory: [],
    shownContent: [],
    currentScreen: 'landing'
};

let currentVideoPlayer = null;

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadIntentOptions();
});

// ============================================================================
// Tour Flow Control
// ============================================================================

function startTour() {
    document.getElementById('landing-view').style.display = 'none';
    document.getElementById('tour-view').style.display = 'block';
    document.getElementById('intent-screen').style.display = 'block';

    tourState.active = true;
    tourState.currentScreen = 'intent';
}

function exitTour() {
    if (confirm('Are you sure you want to exit the tour?')) {
        location.reload();
    }
}

function restartTour() {
    location.reload();
}

// ============================================================================
// Intent Selection
// ============================================================================

function loadIntentOptions() {
    const intents = getIntents();
    const container = document.getElementById('intent-options');

    if (!intents || intents.length === 0) {
        container.innerHTML = `
            <div class="intent-placeholder">
                <p>No intent options configured yet.</p>
                <p>Visit the <a href="admin.html">Admin Panel</a> to set up your content.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = intents.slice(0, 4).map((intent, i) => `
        <button class="intent-option" onclick="selectIntent(${i})">
            <h3>${escapeHtml(intent.title)}</h3>
            <p>${escapeHtml(intent.description)}</p>
        </button>
    `).join('');
}

async function selectIntent(index) {
    const intents = getIntents();
    tourState.selectedIntent = intents[index];

    // Show main screen
    document.getElementById('intent-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    tourState.currentScreen = 'main';

    // Add AI welcome message
    addAgentMessage(`Perfect! Let me show you how we ${tourState.selectedIntent.title.toLowerCase()}.`);

    // Start the tour based on selected intent
    await handleIntentStart();
}

async function submitCustomIntent() {
    const input = document.getElementById('custom-intent-input');
    const customIntent = input.value.trim();

    if (!customIntent) {
        alert('Please enter your question');
        return;
    }

    tourState.selectedIntent = {
        title: customIntent,
        description: 'Custom buyer question',
        isCustom: true
    };

    // Show main screen
    document.getElementById('intent-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    tourState.currentScreen = 'main';

    // Add AI welcome message
    addAgentMessage(`Great question! Let me find the most relevant information to answer: "${customIntent}"`);

    // Handle custom intent
    await handleCustomIntent(customIntent);
}

// ============================================================================
// Intent Handling
// ============================================================================

async function handleIntentStart() {
    updateTourStatus('Finding relevant content...');

    try {
        const videos = getAllVideos();
        const pdfs = getAllPDFs();

        // Ask AI to decide what to show first
        const systemPrompt = getAgentSystemPrompt();
        const userMessage = `User selected intent: "${tourState.selectedIntent.title}". What should I show them first?`;

        const aiResponse = await callClaudeAPI(systemPrompt, userMessage, tourState.conversationHistory);

        // Update conversation history
        tourState.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        );

        // Execute AI's decision
        await executeAIResponse(aiResponse);

    } catch (error) {
        console.error('Error handling intent:', error);
        addAgentMessage('I encountered an error. Please try asking your question in the chat below.');
    }
}

async function handleCustomIntent(question) {
    updateTourStatus('Analyzing your question...');

    try {
        const systemPrompt = getAgentSystemPrompt();
        const userMessage = question;

        const aiResponse = await callClaudeAPI(systemPrompt, userMessage, tourState.conversationHistory);

        tourState.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
        );

        await executeAIResponse(aiResponse);

    } catch (error) {
        console.error('Error handling custom intent:', error);
        addAgentMessage('I encountered an error processing your question. Please try rephrasing it.');
    }
}

// ============================================================================
// AI System Prompt
// ============================================================================

function getAgentSystemPrompt() {
    const videos = getAllVideos();
    const pdfs = getAllPDFs();

    const contentLibrary = {
        videos: videos.map((v, i) => ({
            id: i,
            title: v.title,
            tags: v.tags,
            segments: v.analyzedSegments || [],
            hasTranscript: !!v.transcript
        })),
        pdfs: pdfs.map((p, i) => ({
            id: i,
            title: p.title,
            type: p.type,
            topics: p.topics,
            tags: p.tags
        }))
    };

    return `You are an AI guide for a product discovery tour. Your role is to help buyers understand if this product fits their needs by showing them relevant demo content.

**Available Content:**
${JSON.stringify(contentLibrary, null, 2)}

**Your Capabilities:**
1. SHOW_VIDEO: Display a video clip (specify video ID and optional timestamp)
2. SHOW_PDF: Display a document (specify PDF ID)
3. RESPOND: Answer with text only

**Instructions:**
- ALWAYS show visual proof when possible (video clips or PDFs)
- Keep responses concise (2-3 sentences)
- After showing content, ask if they want to see more or have questions
- Track what you've shown to avoid repetition
- When you have enough signal (4-5 interactions), suggest ending with a fit assessment

**Response Format:**
When you want to show content, use this format:
<action>SHOW_VIDEO:0:1:30</action>
This shows video ID 0 starting at timestamp 1:30

<action>SHOW_PDF:0</action>
This shows PDF ID 0

Then provide your narration explaining what they're about to see.

**Fit Assessment:**
After 4-5 meaningful interactions, if you have enough information, suggest:
<action>FIT_ASSESSMENT</action>

Then provide your assessment in this format:
VERDICT: Good Fit | Mixed Fit | Poor Fit
KEY POINTS: [3-4 bullet points]
RISKS: [Any concerns or limitations]
RECOMMENDATION: [Next step]

**Current State:**
- Content shown so far: ${tourState.shownContent.length} items
- Conversation turns: ${tourState.conversationHistory.length / 2}`;
}

// ============================================================================
// AI Response Execution
// ============================================================================

async function executeAIResponse(response) {
    // Check for action tags
    const actionMatch = response.match(/<action>(.*?)<\/action>/);

    if (actionMatch) {
        const action = actionMatch[1].trim();

        if (action.startsWith('SHOW_VIDEO:')) {
            const parts = action.split(':');
            const videoId = parseInt(parts[1]);
            const timestamp = parts[2] || '0:00';
            await showVideo(videoId, timestamp);
        } else if (action.startsWith('SHOW_PDF:')) {
            const pdfId = parseInt(action.split(':')[1]);
            showPDF(pdfId);
        } else if (action === 'FIT_ASSESSMENT') {
            showFitAssessment(response);
            return;
        }
    }

    // Extract narration (remove action tags)
    const narration = response.replace(/<action>.*?<\/action>/g, '').trim();

    if (narration) {
        addAgentMessage(narration);
    }

    updateTourStatus('Ready for your questions');
}

// ============================================================================
// Content Display
// ============================================================================

async function showVideo(videoId, timestamp = '0:00') {
    const videos = getAllVideos();
    const video = videos[videoId];

    if (!video) {
        addAgentMessage("Sorry, I couldn't find that video.");
        return;
    }

    const embedURL = getVideoEmbedURL(video.url);
    const videoContainer = document.getElementById('video-player');
    const controls = document.getElementById('video-controls');

    // Parse timestamp
    const [minutes, seconds] = timestamp.split(':').map(Number);
    const startSeconds = (minutes || 0) * 60 + (seconds || 0);

    // Create iframe with timestamp
    let finalURL = embedURL;
    if (embedURL.includes('youtube.com')) {
        finalURL += `&start=${startSeconds}&autoplay=1`;
    } else if (embedURL.includes('vimeo.com')) {
        finalURL += `#t=${startSeconds}s`;
    }

    videoContainer.innerHTML = `
        <iframe
            src="${finalURL}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            style="width: 100%; height: 100%;">
        </iframe>
    `;

    controls.style.display = 'flex';

    // Track shown content
    tourState.shownContent.push({
        type: 'video',
        id: videoId,
        title: video.title,
        timestamp
    });

    updateTourStatus(`Showing: ${video.title}`);
}

function showPDF(pdfId) {
    const pdfs = getAllPDFs();
    const pdf = pdfs[pdfId];

    if (!pdf) {
        addAgentMessage("Sorry, I couldn't find that document.");
        return;
    }

    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfFrame = document.getElementById('pdf-frame');
    const pdfDownload = document.getElementById('pdf-download');

    const embedURL = getPDFEmbedURL(pdf.url);

    pdfFrame.src = embedURL;
    pdfDownload.href = pdf.url;
    pdfViewer.style.display = 'block';

    // Track shown content
    tourState.shownContent.push({
        type: 'pdf',
        id: pdfId,
        title: pdf.title
    });

    updateTourStatus(`Showing: ${pdf.title}`);
}

function closePDF() {
    document.getElementById('pdf-viewer').style.display = 'none';
}

function replayVideo() {
    // Reload iframe to restart video
    const iframe = document.querySelector('#video-player iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
}

function skipVideo() {
    addAgentMessage('What else would you like to know?');
}

// ============================================================================
// Chat Handling
// ============================================================================

async function handleChatSubmit(event) {
    event.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message
    addUserMessage(message);
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        const systemPrompt = getAgentSystemPrompt();
        const aiResponse = await callClaudeAPI(systemPrompt, message, tourState.conversationHistory);

        tourState.conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse }
        );

        hideTypingIndicator();
        await executeAIResponse(aiResponse);

    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addAgentMessage('I encountered an error. Please try again.');
    }
}

function addUserMessage(text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
}

function addAgentMessage(html) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            ${html}
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message agent-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollChatToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================================================
// Fit Assessment
// ============================================================================

function showFitAssessment(aiResponse) {
    // Hide main screen, show fit screen
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('fit-screen').style.display = 'flex';
    tourState.currentScreen = 'fit';

    // Parse AI response
    const verdictMatch = aiResponse.match(/VERDICT:\s*(.+)/);
    const keyPointsMatch = aiResponse.match(/KEY POINTS:\s*([\s\S]*?)(?:RISKS:|RECOMMENDATION:|$)/);
    const risksMatch = aiResponse.match(/RISKS:\s*([\s\S]*?)(?:RECOMMENDATION:|$)/);
    const recommendationMatch = aiResponse.match(/RECOMMENDATION:\s*(.+)/);

    const verdict = verdictMatch ? verdictMatch[1].trim() : 'Mixed Fit';
    const keyPoints = keyPointsMatch ? keyPointsMatch[1].trim() : '';
    const risks = risksMatch ? risksMatch[1].trim() : '';
    const recommendation = recommendationMatch ? recommendationMatch[1].trim() : 'Schedule a demo to learn more';

    // Determine verdict class
    let verdictClass = 'mixed';
    if (verdict.toLowerCase().includes('good')) verdictClass = 'good';
    if (verdict.toLowerCase().includes('poor')) verdictClass = 'poor';

    // Display verdict
    document.getElementById('fit-verdict').innerHTML = `
        <div class="verdict-badge ${verdictClass}">${verdict}</div>
    `;

    // Display details
    document.getElementById('fit-details').innerHTML = `
        ${keyPoints ? `
            <div class="fit-section">
                <h3>Key Insights</h3>
                <div class="fit-text">${keyPoints.replace(/\n/g, '<br>')}</div>
            </div>
        ` : ''}

        ${risks ? `
            <div class="fit-section">
                <h3>Considerations</h3>
                <div class="fit-text">${risks.replace(/\n/g, '<br>')}</div>
            </div>
        ` : ''}

        <div class="fit-section">
            <h3>Recommended Next Step</h3>
            <div class="fit-text">${recommendation}</div>
        </div>

        <div class="fit-section">
            <h3>What You Explored</h3>
            <ul class="content-summary">
                ${tourState.shownContent.map(item => `
                    <li>${item.type === 'video' ? '🎥' : '📄'} ${escapeHtml(item.title)}</li>
                `).join('')}
            </ul>
        </div>
    `;
}

function requestDemo() {
    alert('Demo request functionality would connect to your calendar/CRM here');
    // In production, this would trigger a calendar booking or form
}

// ============================================================================
// Utilities
// ============================================================================

function updateTourStatus(status) {
    const statusEl = document.getElementById('tour-status');
    if (statusEl) {
        statusEl.textContent = status;
    }
}
