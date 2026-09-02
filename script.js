/* ==========================================================================
   OpenRouter AI Assistant - Main Application Script
   ========================================================================== */

/**
 * 🔑 OPENROUTER API KEY (실습용 하드코딩 변수)
 * 아래 백틱("") 사이에 발급받은 OpenRouter API 키를 직접 넣어주세요.
 * 예: const OPENROUTER_API_KEY = "sk-or-v1-abcdef123456...";
 */
const OPENROUTER_API_KEY = ""; 

// Default Configurations
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const DEFAULT_SYSTEM_PROMPT = "You are a helpful, smart, and friendly AI assistant. Answer in clear Markdown formatting.";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// App State
let state = {
    apiKey: localStorage.getItem("openrouter_key") || OPENROUTER_API_KEY,
    systemPrompt: localStorage.getItem("openrouter_system_prompt") || DEFAULT_SYSTEM_PROMPT,
    temperature: parseFloat(localStorage.getItem("openrouter_temp")) || 0.7,
    selectedModel: localStorage.getItem("openrouter_model") || DEFAULT_MODEL,
    webSearchEnabled: localStorage.getItem("openrouter_web_search") !== "false", // Default ON
    messages: JSON.parse(localStorage.getItem("openrouter_history")) || [],
    isGenerating: false
};

// DOM Elements
const chatMessagesContainer = document.getElementById("chat-messages");
const welcomeScreen = document.getElementById("welcome-screen");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const modelSelect = document.getElementById("model-select");
const webSearchToggleBtn = document.getElementById("web-search-toggle");
const clearBtn = document.getElementById("clear-btn");
const settingsBtn = document.getElementById("settings-btn");
const scrollBottomBtn = document.getElementById("scroll-bottom-btn");
const chatViewport = document.querySelector(".chat-viewport");

// Modal DOM Elements
const settingsModal = document.getElementById("settings-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const apiKeyInput = document.getElementById("api-key-input");
const toggleKeyBtn = document.getElementById("toggle-key-visibility");
const systemPromptInput = document.getElementById("system-prompt-input");
const tempInput = document.getElementById("temperature-input");
const tempValueSpan = document.getElementById("temp-value");

// Configure Marked Renderer for Markdown Code Blocks
const customRenderer = new marked.Renderer();
customRenderer.code = function({ text, lang }) {
    const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    let highlightedCode = text;
    try {
        highlightedCode = hljs.highlight(text, { language: validLang }).value;
    } catch (e) {
        highlightedCode = text;
    }
    
    return `
    <div class="code-block-wrapper">
        <div class="code-header">
            <span>${validLang}</span>
            <button class="copy-code-btn" onclick="copyCodeSnippet(this)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                복사
            </button>
        </div>
        <pre><code class="hljs ${validLang}">${highlightedCode}</code></pre>
    </div>`;
};

marked.setOptions({
    renderer: customRenderer,
    gfm: true,
    breaks: true
});

// Copy Code Snippet Helper Function
window.copyCodeSnippet = function(buttonEl) {
    const wrapper = buttonEl.closest('.code-block-wrapper');
    const codeEl = wrapper.querySelector('code');
    const textToCopy = codeEl.innerText;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalHTML = buttonEl.innerHTML;
        buttonEl.innerHTML = `✓ 완료`;
        buttonEl.style.color = '#4ade80';
        setTimeout(() => {
            buttonEl.innerHTML = originalHTML;
            buttonEl.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initUI();
    renderChatHistory();
    attachEventListeners();
});

function initUI() {
    modelSelect.value = state.selectedModel;
    apiKeyInput.value = state.apiKey;
    systemPromptInput.value = state.systemPrompt;
    tempInput.value = state.temperature;
    tempValueSpan.textContent = state.temperature;
    updateWebSearchToggleUI();
}

function updateWebSearchToggleUI() {
    if (state.webSearchEnabled) {
        webSearchToggleBtn.classList.add("active");
        webSearchToggleBtn.querySelector(".search-label").textContent = "웹 검색 ON";
    } else {
        webSearchToggleBtn.classList.remove("active");
        webSearchToggleBtn.querySelector(".search-label").textContent = "웹 검색 OFF";
    }
}

function attachEventListeners() {
    // Web Search Toggle Click
    webSearchToggleBtn.addEventListener("click", () => {
        state.webSearchEnabled = !state.webSearchEnabled;
        localStorage.setItem("openrouter_web_search", state.webSearchEnabled);
        updateWebSearchToggleUI();
    });

    // Input Area Resizing & Submission
    userInput.addEventListener("input", autoResizeTextarea);
    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event("submit"));
        }
    });

    chatForm.addEventListener("submit", handleChatSubmit);

    // Prompt Chips Click
    document.querySelectorAll(".prompt-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const promptText = chip.getAttribute("data-prompt");
            userInput.value = promptText;
            autoResizeTextarea();
            userInput.focus();
        });
    });

    // Model Selector Change
    modelSelect.addEventListener("change", (e) => {
        state.selectedModel = e.target.value;
        localStorage.setItem("openrouter_model", state.selectedModel);
    });

    // Clear Chat History
    clearBtn.addEventListener("click", () => {
        if (confirm("모든 대화 내역을 삭제하시겠습니까?")) {
            state.messages = [];
            localStorage.removeItem("openrouter_history");
            renderChatHistory();
        }
    });

    // Settings Modal Handlers
    settingsBtn.addEventListener("click", () => {
        apiKeyInput.value = state.apiKey;
        systemPromptInput.value = state.systemPrompt;
        tempInput.value = state.temperature;
        tempValueSpan.textContent = state.temperature;
        settingsModal.classList.remove("hidden");
    });

    closeModalBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));

    toggleKeyBtn.addEventListener("click", () => {
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            toggleKeyBtn.textContent = "숨기기";
        } else {
            apiKeyInput.type = "password";
            toggleKeyBtn.textContent = "표시";
        }
    });

    tempInput.addEventListener("input", (e) => {
        tempValueSpan.textContent = e.target.value;
    });

    saveSettingsBtn.addEventListener("click", () => {
        state.apiKey = apiKeyInput.value.trim() || OPENROUTER_API_KEY;
        state.systemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;
        state.temperature = parseFloat(tempInput.value);

        localStorage.setItem("openrouter_key", state.apiKey);
        localStorage.setItem("openrouter_system_prompt", state.systemPrompt);
        localStorage.setItem("openrouter_temp", state.temperature);

        settingsModal.classList.add("hidden");
    });

    // Auto-scroll button logic
    chatViewport.addEventListener("scroll", () => {
        const isNearBottom = chatViewport.scrollHeight - chatViewport.scrollTop - chatViewport.clientHeight < 100;
        if (isNearBottom) {
            scrollBottomBtn.classList.add("hidden");
        } else {
            scrollBottomBtn.classList.remove("hidden");
        }
    });

    scrollBottomBtn.addEventListener("click", scrollToBottom);
}

function autoResizeTextarea() {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
}

function scrollToBottom() {
    chatViewport.scrollTo({
        top: chatViewport.scrollHeight,
        behavior: 'smooth'
    });
}

// Render Saved Messages
function renderChatHistory() {
    chatMessagesContainer.innerHTML = "";
    if (state.messages.length === 0) {
        chatMessagesContainer.appendChild(welcomeScreen);
        welcomeScreen.style.display = "flex";
        return;
    }

    welcomeScreen.style.display = "none";
    state.messages.forEach(msg => {
        appendMessageUI(msg.role, msg.content);
    });
    scrollToBottom();
}

// Append Message UI Element
function appendMessageUI(role, content = "") {
    const isUser = role === "user";
    const row = document.createElement("div");
    row.className = `message-row ${isUser ? "user" : "ai"}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = isUser ? "YOU" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (isUser) {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = content ? marked.parse(content) : getTypingIndicatorHTML();
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatMessagesContainer.appendChild(row);

    scrollToBottom();
    return bubble;
}

function getTypingIndicatorHTML() {
    return `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
}

// Main Chat Handling with Streaming
async function handleChatSubmit(e) {
    e.preventDefault();
    const prompt = userInput.value.trim();
    if (!prompt || state.isGenerating) return;

    // Check API Key
    const activeKey = state.apiKey || OPENROUTER_API_KEY;
    if (!activeKey) {
        alert("OpenRouter API Key가 설정되지 않았습니다.\nscript.js 상단의 OPENROUTER_API_KEY 상수에 입력하거나 우측 상단 ⚙️ 설정에서 입력해주세요.");
        settingsBtn.click();
        return;
    }

    // Hide welcome screen if first message
    if (state.messages.length === 0) {
        welcomeScreen.style.display = "none";
    }

    // User Message
    state.messages.push({ role: "user", content: prompt });
    appendMessageUI("user", prompt);
    
    // Clear Input
    userInput.value = "";
    autoResizeTextarea();

    // Prepare UI for AI Response
    state.isGenerating = true;
    sendBtn.disabled = true;
    const aiBubble = appendMessageUI("assistant", "");

    // Prepare System Prompt with Web Search instruction if enabled
    let effectiveSystemPrompt = state.systemPrompt;
    if (state.webSearchEnabled) {
        effectiveSystemPrompt += "\n\n[Web Search Notice]: Real-time web search capabilities are enabled via OpenRouter. Always perform web search for recent events, facts, real-time info, documentation, or verifiable data to avoid hallucinations and provide strictly accurate, up-to-date information.";
    }

    // Prepare API Request Payload
    const apiMessages = [
        { role: "system", content: effectiveSystemPrompt },
        ...state.messages
    ];

    // Determine target model & payload parameters
    const targetModel = state.webSearchEnabled && !state.selectedModel.endsWith(":online") 
        ? `${state.selectedModel}:online` 
        : state.selectedModel;

    const requestBody = {
        model: targetModel,
        messages: apiMessages,
        stream: true,
        temperature: state.temperature
    };

    // Add OpenRouter Web Search plugin payload if enabled
    if (state.webSearchEnabled) {
        requestBody.plugins = [
            { id: "web" }
        ];
    }

    let fullAiResponse = "";

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${activeKey}`,
                "HTTP-Referer": window.location.origin || "http://localhost",
                "X-Title": "OpenRouter AI Assistant",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(":")) continue;

                if (trimmed === "data: [DONE]") {
                    break;
                }

                if (trimmed.startsWith("data: ")) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const contentChunk = json.choices?.[0]?.delta?.content || "";
                        if (contentChunk) {
                            fullAiResponse += contentChunk;
                            aiBubble.innerHTML = marked.parse(fullAiResponse);
                            scrollToBottom();
                        }
                    } catch (err) {
                        console.warn("Error parsing stream SSE JSON:", err);
                    }
                }
            }
        }

        // Save AI Response to state and localStorage
        if (fullAiResponse) {
            state.messages.push({ role: "assistant", content: fullAiResponse });
            localStorage.setItem("openrouter_history", JSON.stringify(state.messages));
        } else {
            aiBubble.innerHTML = "<p><em>[답변이 비어 있습니다.]</em></p>";
        }

    } catch (err) {
        console.error("OpenRouter API Call Error:", err);
        aiBubble.innerHTML = `
            <div style="color: #ef4444; border-left: 3px solid #ef4444; padding-left: 10px;">
                <strong>⚠️ 오류가 발생했습니다:</strong><br>
                ${err.message}
            </div>
        `;
    } finally {
        state.isGenerating = false;
        sendBtn.disabled = false;
    }
}
