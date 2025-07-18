(function() {
    'use strict';
    
    // Prevent multiple widget instances
    if (window.MissedHVACWidget) {
        console.warn('MissedHVAC Widget already loaded');
        return;
    }

    // Configuration
    const config = {
        apiEndpoint: document.currentScript?.getAttribute('data-api-endpoint') || 'https://missedhvac-api.vercel.app/api/chat',
        customerId: document.currentScript?.getAttribute('data-customer-id') || 'demo',
        emergencyPhone: document.currentScript?.getAttribute('data-emergency-phone') || '(555) 987-6543',
        theme: document.currentScript?.getAttribute('data-theme') || 'orange',
        position: document.currentScript?.getAttribute('data-position') || 'bottom-right',
        assistantName: document.currentScript?.getAttribute('data-assistant-name') || 'HVAC Assistant'
    };

    // CSS Styles (unchanged, but confirming overflow-y: auto on .chat-messages)
    const styles = `
        #hvac-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            z-index: 10000;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        #hvac-chat-widget.open {
            display: flex;
        }

        .chat-header {
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .chat-title {
            font-weight: 600;
            font-size: 16px;
        }

        .chat-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .chat-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            max-height: none;  /* Removed max-height restriction to allow full scrolling */
            scroll-behavior: smooth;
            display: flex;
            flex-direction: column;
        }

        .message {
            margin-bottom: 16px;
            max-width: 85%;
            word-wrap: break-word;
        }

        .message.user {
            margin-left: auto;
        }

        .message.assistant {
            margin-right: auto;
        }

        .message-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.4;
    white-space: pre-wrap;
    text-align: left;
    list-style-position: inside;
    text-indent: 0;
}

        .message.user .message-bubble {
            background: #f97316;
            color: white;
            border-bottom-right-radius: 6px;
        }

        .message.assistant .message-bubble {
            background: #f3f4f6;
            color: #374151;
            border-bottom-left-radius: 6px;
        }

        .chat-input-container {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
        }

        .chat-input-wrapper {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }

        .chat-input {
            flex: 1;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            padding: 10px 16px;
            font-size: 14px;
            resize: none;
            max-height: 100px;
            min-height: 40px;
            outline: none;
        }

        .chat-input:focus {
            border-color: #f97316;
            box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }

        .chat-send {
            background: #f97316;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .chat-send:hover {
            background: #ea580c;
        }

        .chat-send:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        #hvac-chat-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            border-radius: 50%;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            color: white;
            font-size: 24px;
            z-index: 9999;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        #hvac-chat-button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
        }

        .typing-indicator {
            display: none;
            padding: 12px 16px;
            font-style: italic;
            color: #6b7280;
            font-size: 13px;
        }

        .typing-dots {
            display: inline-flex;
            gap: 4px;
        }

        .typing-dot {
            width: 6px;
            height: 6px;
            background: #6b7280;
            border-radius: 50%;
            animation: typingBounce 1.4s infinite;
        }

        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }

        .powered-by {
            text-align: center;
            padding: 8px;
            font-size: 11px;
            color: #9ca3af;
            background: #f9fafb;
        }

        .powered-by a {
            color: #f97316;
            text-decoration: none;
        }

        @media (max-width: 480px) {
            #hvac-chat-widget {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                bottom: 20px;
                right: 20px;
            }
        }
    `;

    // Create and inject styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create chat widget HTML
    const widgetHTML = `
        <button id="hvac-chat-button">💬</button>
        <div id="hvac-chat-widget">
            <div class="chat-header">
                <div class="chat-title">🔧 ${config.assistantName}</div>
                <button class="chat-close">×</button>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <div class="message assistant">
                    <div class="message-bubble">
                      Hi! I'm your 24/7 HVAC assistant. I can help with:
                        <br><br>• Emergency diagnostics
                        <br>• Service appointments 
                        <br>• Pricing estimates
                        <br>• Troubleshooting
                        <br><br>What's going on with your HVAC system?
                    </div>
                </div>
            </div>

            <div class="typing-indicator" id="typing-indicator">
                AI is typing
                <span class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </span>
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-wrapper">
                    <textarea 
                        id="chat-input" 
                        class="chat-input" 
                        placeholder="Describe your HVAC issue..."
                        rows="1"
                    ></textarea>
                    <button id="chat-send" class="chat-send">➤</button>
                </div>
            </div>

            <div class="powered-by">
                Powered by <a href="https://missedhvac.com" target="_blank">MissedHVAC</a>
            </div>
        </div>
    `;

    // Add HTML to page
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    let isOpen = false;
    let conversationHistory = [];

    // IMPROVED SCROLL TO BOTTOM WITH DELAY AND REFLOW HANDLING
    function scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            // Immediate scroll
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Scroll again after reflow (for long messages that take time to render)
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 0);
            
            // Third scroll after short delay for safety
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    function toggleChat() {
        const widget = document.getElementById('hvac-chat-widget');
        const button = document.getElementById('hvac-chat-button');
        
        isOpen = !isOpen;
        
        if (isOpen) {
            widget.classList.add('open');
            button.style.display = 'none';
            document.getElementById('chat-input').focus();
            setTimeout(scrollToBottom, 100);  // Ensure scroll on open
        } else {
            widget.classList.remove('open');
            button.style.display = 'flex';
        }
    }

    function showTypingIndicator() {
        document.getElementById('typing-indicator').style.display = 'block';
        scrollToBottom();
    }

    function hideTypingIndicator() {
        document.getElementById('typing-indicator').style.display = 'none';
    }

    function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = content;
    
    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    
    scrollToBottom();
    
    // Return the bubble so we can update it
    return bubbleDiv; 
}

    async function sendMessage() {
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send');
    const message = input.value.trim();

    if (!message) return;

    // --- UI updates ---
    addMessage(message, true);
    conversationHistory.push({ role: 'user', content: message });
    input.value = '';
    input.style.height = 'auto';
    sendButton.disabled = true;
    showTypingIndicator();

    try {
        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: conversationHistory,
                customerId: config.customerId
            })
        });

        hideTypingIndicator();

        if (!response.body) {
            throw new Error('Response body is empty.');
        }

        // --- Stream Processing Logic ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        // Create an empty bubble for the assistant's message
        const assistantBubble = addMessage('', false); 

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            fullResponse += decoder.decode(value, { stream: true });
            assistantBubble.textContent = fullResponse; // Update bubble text
            
            // Keep scrolling to the bottom as new text arrives
            scrollToBottom(); 
        }

        conversationHistory.push({ role: 'assistant', content: fullResponse });

    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        addMessage(`I apologize, but I'm having trouble connecting right now. For immediate HVAC assistance, please call ${config.emergencyPhone}.`);
    } finally {
        sendButton.disabled = false;
        input.focus();
    }
}

    // Event listeners
    document.getElementById('hvac-chat-button').addEventListener('click', toggleChat);
    document.querySelector('.chat-close').addEventListener('click', toggleChat);
    document.getElementById('chat-send').addEventListener('click', sendMessage);

    // Auto-resize textarea
    document.getElementById('chat-input').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });

    // Send on Enter
    document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Mark as loaded
    window.MissedHVACWidget = true;

})();