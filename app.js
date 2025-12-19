// ============================================================================
// SalesFlow CRM - AI Demo Agent
// ============================================================================

// IMPORTANT: Replace this URL with your deployed proxy server URL
// See /proxy/README.md for deployment instructions
const PROXY_URL = 'https://https://railway.com/project/f3d278cb-e34a-47f3-b9ba-821e95cdb15a/service/ec0ba83d-9da6-4907-98c3-aab5f602d6ab/variables?environmentId=a38bc849-ed5b-4ff0-91b0-44b0ab61a3f8/api/messages';

// State Management
const state = {
    contacts: [],
    deals: [],
    activity: [],
    currentTab: 'dashboard',
    apiKey: localStorage.getItem('anthropic_api_key') || '',
    conversationHistory: [],
    isProcessing: false
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeDemo();
    setupEventListeners();
    checkApiKey();
    loadInitialData();
});

// ============================================================================
// Initialization
// ============================================================================

function initializeDemo() {
    console.log('SalesFlow CRM Demo Agent initialized');
    renderDashboard();
    renderContacts();
    renderDeals();
}

function loadInitialData() {
    // Load some initial demo data
    state.contacts = [
        {
            id: 1,
            name: 'Sarah Johnson',
            company: 'Acme Corp',
            email: 'sarah@acme.com',
            phone: '(555) 123-4567',
            status: 'customer'
        },
        {
            id: 2,
            name: 'Michael Chen',
            company: 'TechStart Inc',
            email: 'michael@techstart.io',
            phone: '(555) 234-5678',
            status: 'prospect'
        },
        {
            id: 3,
            name: 'Emily Rodriguez',
            company: 'Global Solutions',
            email: 'emily@globalsolutions.com',
            phone: '(555) 345-6789',
            status: 'lead'
        }
    ];

    state.deals = [
        {
            id: 1,
            name: 'Enterprise Package',
            contactId: 1,
            value: 50000,
            stage: 'proposal'
        },
        {
            id: 2,
            name: 'Starter Plan',
            contactId: 2,
            value: 15000,
            stage: 'prospecting'
        }
    ];

    state.activity = [
        'Sarah Johnson was added as a customer',
        'Deal "Enterprise Package" created for Acme Corp',
        'Michael Chen was added as a prospect'
    ];

    renderDashboard();
    renderContacts();
    renderDeals();
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Chat form
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', handleChatSubmit);

    // Contact search
    const contactSearch = document.getElementById('contact-search');
    if (contactSearch) {
        contactSearch.addEventListener('input', (e) => {
            filterContacts(e.target.value);
        });
    }

    // Modal forms
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleAddContact);
    }

    const dealForm = document.getElementById('deal-form');
    if (dealForm) {
        dealForm.addEventListener('submit', handleAddDeal);
    }
}

// ============================================================================
// Tab Management
// ============================================================================

function switchTab(tabName) {
    state.currentTab = tabName;

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// ============================================================================
// Rendering Functions
// ============================================================================

function renderDashboard() {
    const totalContacts = state.contacts.length;
    const activeDeals = state.deals.length;
    const pipelineValue = state.deals.reduce((sum, deal) => sum + deal.value, 0);
    const wonDeals = state.deals.filter(d => d.stage === 'won').length;
    const conversionRate = totalContacts > 0 ? Math.round((wonDeals / totalContacts) * 100) : 0;

    document.getElementById('total-contacts').textContent = totalContacts;
    document.getElementById('active-deals').textContent = activeDeals;
    document.getElementById('pipeline-value').textContent = `$${pipelineValue.toLocaleString()}`;
    document.getElementById('conversion-rate').textContent = `${conversionRate}%`;

    renderActivityFeed();
}

function renderActivityFeed() {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    if (state.activity.length === 0) {
        feed.innerHTML = '<div class="activity-item">No recent activity</div>';
        return;
    }

    feed.innerHTML = state.activity
        .slice(-10)
        .reverse()
        .map(item => `<div class="activity-item">${item}</div>`)
        .join('');
}

function renderContacts() {
    const tbody = document.getElementById('contacts-table');
    if (!tbody) return;

    if (state.contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No contacts yet</td></tr>';
        return;
    }

    tbody.innerHTML = state.contacts.map(contact => `
        <tr data-contact-id="${contact.id}">
            <td><strong>${contact.name}</strong></td>
            <td>${contact.company}</td>
            <td>${contact.email}</td>
            <td>${contact.phone || '-'}</td>
            <td><span class="status-badge status-${contact.status}">${capitalizeFirst(contact.status)}</span></td>
            <td>
                <button class="btn-action" onclick="viewContact(${contact.id})">View</button>
            </td>
        </tr>
    `).join('');

    // Update deal contact dropdown
    updateDealContactDropdown();
}

function renderDeals() {
    const stages = ['prospecting', 'proposal', 'negotiation', 'won'];

    stages.forEach(stage => {
        const container = document.getElementById(`deals-${stage}`);
        if (!container) return;

        const dealsInStage = state.deals.filter(d => d.stage === stage);

        if (dealsInStage.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-light); font-size: 0.875rem;">No deals</div>';
            return;
        }

        container.innerHTML = dealsInStage.map(deal => {
            const contact = state.contacts.find(c => c.id === deal.contactId);
            return `
                <div class="deal-card" data-deal-id="${deal.id}">
                    <div class="deal-card-name">${deal.name}</div>
                    <div class="deal-card-company">${contact ? contact.company : 'Unknown'}</div>
                    <div class="deal-card-value">$${deal.value.toLocaleString()}</div>
                </div>
            `;
        }).join('');
    });
}

function filterContacts(query) {
    const tbody = document.getElementById('contacts-table');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
    });
}

function updateDealContactDropdown() {
    const select = document.getElementById('deal-contact');
    if (!select) return;

    select.innerHTML = '<option value="">Select Contact</option>' +
        state.contacts.map(c => `<option value="${c.id}">${c.name} (${c.company})</option>`).join('');
}

// ============================================================================
// Modal Management
// ============================================================================

function showApiKeyModal() {
    const modal = document.getElementById('api-key-modal');
    modal.classList.add('active');
    document.getElementById('api-key-input').value = state.apiKey;
}

function closeApiKeyModal() {
    document.getElementById('api-key-modal').classList.remove('active');
}

function saveApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        state.apiKey = apiKey;
        localStorage.setItem('anthropic_api_key', apiKey);
        checkApiKey();
        closeApiKeyModal();
        addAgentMessage('API key saved! I\'m ready to help. Ask me to show you around the CRM.');
    }
}

function showAddContactModal() {
    document.getElementById('contact-modal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contact-modal').classList.remove('active');
    document.getElementById('contact-form').reset();
}

function showAddDealModal() {
    document.getElementById('deal-modal').classList.add('active');
}

function closeDealModal() {
    document.getElementById('deal-modal').classList.remove('active');
    document.getElementById('deal-form').reset();
}

function checkApiKey() {
    const notice = document.getElementById('api-key-notice');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    // Check if proxy URL has been configured
    const PROXY_CONFIGURED = !PROXY_URL.includes('YOUR-PROXY-URL-HERE');

    if (PROXY_CONFIGURED) {
        notice.classList.add('hidden');
        chatInput.disabled = false;
        sendBtn.disabled = false;
    } else {
        // Show proxy setup notice
        notice.classList.remove('hidden');
        chatInput.disabled = false; // Allow chat for better UX, will show error if proxy not set
        sendBtn.disabled = false;
    }
}

// ============================================================================
// Form Handlers
// ============================================================================

function handleAddContact(e) {
    e.preventDefault();

    const contact = {
        id: Date.now(),
        name: document.getElementById('contact-name').value,
        company: document.getElementById('contact-company').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        status: document.getElementById('contact-status').value
    };

    state.contacts.push(contact);
    addActivity(`<strong>${contact.name}</strong> was added as a ${contact.status}`);

    renderContacts();
    renderDashboard();
    closeContactModal();
}

function handleAddDeal(e) {
    e.preventDefault();

    const deal = {
        id: Date.now(),
        name: document.getElementById('deal-name').value,
        contactId: parseInt(document.getElementById('deal-contact').value),
        value: parseInt(document.getElementById('deal-value').value),
        stage: document.getElementById('deal-stage').value
    };

    const contact = state.contacts.find(c => c.id === deal.contactId);

    state.deals.push(deal);
    addActivity(`Deal "<strong>${deal.name}</strong>" created for ${contact ? contact.company : 'Unknown'}`);

    renderDeals();
    renderDashboard();
    closeDealModal();
}

function viewContact(id) {
    const contact = state.contacts.find(c => c.id === id);
    if (contact) {
        alert(`Contact Details:\n\nName: ${contact.name}\nCompany: ${contact.company}\nEmail: ${contact.email}\nPhone: ${contact.phone}\nStatus: ${contact.status}`);
    }
}

// ============================================================================
// Chat Functions
// ============================================================================

async function handleChatSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message || state.isProcessing) return;

    // Add user message
    addUserMessage(message);
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Process with AI
    await processUserMessage(message);

    // Hide typing indicator
    hideTypingIndicator();
}

function addUserMessage(text) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">You</div>
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addAgentMessage(html) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">AI</div>
        <div class="message-content">
            ${html}
        </div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message agent-message';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">AI</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ============================================================================
// AI Integration
// ============================================================================

async function processUserMessage(userMessage) {
    state.isProcessing = true;

    try {
        // Build conversation context
        const systemPrompt = getSystemPrompt();

        // Call Claude API
        const response = await callClaudeAPI(systemPrompt, userMessage);

        // Parse response and execute actions
        await executeAgentResponse(response);

    } catch (error) {
        console.error('Error processing message:', error);
        addAgentMessage(`<p>I encountered an error: ${error.message}</p><p>Please try again or check your API key.</p>`);
    } finally {
        state.isProcessing = false;
    }
}

function getSystemPrompt() {
    return `You are an AI demo assistant for SalesFlow CRM. Your role is to help users understand how this CRM works by performing real actions in the interface.

**Current CRM State:**
- Contacts: ${state.contacts.length} (${JSON.stringify(state.contacts.map(c => ({ name: c.name, company: c.company, status: c.status })))})
- Deals: ${state.deals.length} (${JSON.stringify(state.deals.map(d => {
    const contact = state.contacts.find(c => c.id === d.contactId);
    return { name: d.name, company: contact?.company, value: d.value, stage: d.stage };
}))})
- Current tab: ${state.currentTab}

**Available Actions:**
1. SWITCH_TAB: {tab: "dashboard"|"contacts"|"deals"} - Navigate to a different tab
2. ADD_CONTACT: {name, company, email, phone, status: "lead"|"prospect"|"customer"} - Add a new contact
3. ADD_DEAL: {name, contactId, value, stage: "prospecting"|"proposal"|"negotiation"|"won"} - Create a new deal
4. MOVE_DEAL: {dealId, stage} - Move a deal to a different stage
5. HIGHLIGHT_CONTACT: {contactId} - Highlight a specific contact in the table
6. HIGHLIGHT_DEAL: {dealId} - Highlight a specific deal card
7. SHOW_CONTACT: {contactId} - Show contact details

**Instructions:**
- Respond in a friendly, helpful tone
- ALWAYS explain what you're doing and why
- When performing actions, use this JSON format:
  <actions>
  [{"action": "ACTION_NAME", "params": {...}}, ...]
  </actions>
- After the actions block, provide narration explaining what you did
- If the user's request is unclear, ask a clarifying question
- If you can't do something, explain why clearly
- Keep responses concise (2-3 sentences for narration)
- Never hallucinate features that don't exist

**Example Response:**
<actions>
[{"action": "SWITCH_TAB", "params": {"tab": "contacts"}}, {"action": "HIGHLIGHT_CONTACT", "params": {"contactId": 1}}]
</actions>

I've switched to the Contacts tab and highlighted Sarah Johnson from Acme Corp. This is where you can see all your customers and prospects in one place.`;
}

async function callClaudeAPI(systemPrompt, userMessage) {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    ...state.conversationHistory,
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const assistantMessage = data.content[0].text;

        // Update conversation history
        state.conversationHistory.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: assistantMessage }
        );

        // Keep history manageable
        if (state.conversationHistory.length > 20) {
            state.conversationHistory = state.conversationHistory.slice(-20);
        }

        return assistantMessage;
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Network error: Unable to reach Anthropic API. This may be due to CORS restrictions. Please check your browser console for details.');
        }
        throw error;
    }
}

async function executeAgentResponse(response) {
    // Parse actions from response
    const actionsMatch = response.match(/<actions>\s*([\s\S]*?)\s*<\/actions>/);
    let actions = [];

    if (actionsMatch) {
        try {
            actions = JSON.parse(actionsMatch[1]);
        } catch (e) {
            console.error('Failed to parse actions:', e);
        }
    }

    // Execute actions with delays for visual effect
    for (const actionObj of actions) {
        await executeAction(actionObj.action, actionObj.params);
        await sleep(500); // Small delay between actions
    }

    // Extract narration (everything outside <actions> tags)
    let narration = response.replace(/<actions>[\s\S]*?<\/actions>/, '').trim();

    // Convert markdown to HTML
    narration = formatNarration(narration);

    // Add agent message with narration
    if (narration) {
        addAgentMessage(narration);
    }
}

async function executeAction(action, params) {
    console.log('Executing action:', action, params);

    switch (action) {
        case 'SWITCH_TAB':
            switchTab(params.tab);
            break;

        case 'ADD_CONTACT':
            const contact = {
                id: Date.now(),
                name: params.name,
                company: params.company,
                email: params.email,
                phone: params.phone || '',
                status: params.status
            };
            state.contacts.push(contact);
            addActivity(`<strong>${contact.name}</strong> was added as a ${contact.status}`);
            renderContacts();
            renderDashboard();
            break;

        case 'ADD_DEAL':
            const deal = {
                id: Date.now(),
                name: params.name,
                contactId: params.contactId,
                value: params.value,
                stage: params.stage
            };
            const dealContact = state.contacts.find(c => c.id === params.contactId);
            state.deals.push(deal);
            addActivity(`Deal "<strong>${deal.name}</strong>" created for ${dealContact ? dealContact.company : 'contact'}`);
            renderDeals();
            renderDashboard();
            break;

        case 'MOVE_DEAL':
            const dealToMove = state.deals.find(d => d.id === params.dealId);
            if (dealToMove) {
                dealToMove.stage = params.stage;
                addActivity(`Deal "<strong>${dealToMove.name}</strong>" moved to ${params.stage}`);
                renderDeals();
                renderDashboard();
            }
            break;

        case 'HIGHLIGHT_CONTACT':
            highlightElement(`[data-contact-id="${params.contactId}"]`);
            break;

        case 'HIGHLIGHT_DEAL':
            highlightElement(`[data-deal-id="${params.dealId}"]`, 'deal-card');
            break;

        case 'SHOW_CONTACT':
            const contactToShow = state.contacts.find(c => c.id === params.contactId);
            if (contactToShow) {
                viewContact(contactToShow.id);
            }
            break;
    }
}

function highlightElement(selector, baseClass = '') {
    // Remove previous highlights
    document.querySelectorAll('.highlight').forEach(el => {
        el.classList.remove('highlight');
    });

    // Add new highlight
    const element = document.querySelector(selector);
    if (element) {
        element.classList.add('highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Remove highlight after 3 seconds
        setTimeout(() => {
            element.classList.remove('highlight');
        }, 3000);
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

function addActivity(text) {
    state.activity.push(text);
    renderActivityFeed();
}

function formatNarration(text) {
    // Simple markdown-like formatting
    return text
        .split('\n\n')
        .map(para => {
            if (para.trim().startsWith('-')) {
                // List
                const items = para.split('\n').map(line =>
                    line.trim().startsWith('-') ? `<li>${line.substring(1).trim()}</li>` : ''
                ).join('');
                return `<ul>${items}</ul>`;
            }
            return `<p>${para}</p>`;
        })
        .join('');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function resetDemo() {
    if (!confirm('This will reset all demo data and start fresh. Continue?')) {
        return;
    }

    state.contacts = [];
    state.deals = [];
    state.activity = [];
    state.conversationHistory = [];

    renderDashboard();
    renderContacts();
    renderDeals();

    // Clear chat except initial message
    const messagesContainer = document.getElementById('chat-messages');
    const initialMessage = messagesContainer.querySelector('.message');
    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(initialMessage);

    addAgentMessage('<p>Demo reset! All data has been cleared. What would you like me to show you?</p>');
}

// Expose functions to global scope for onclick handlers
window.showApiKeyModal = showApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;
window.showAddContactModal = showAddContactModal;
window.closeContactModal = closeContactModal;
window.showAddDealModal = showAddDealModal;
window.closeDealModal = closeDealModal;
window.viewContact = viewContact;
window.resetDemo = resetDemo;

