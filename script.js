/* ==========================================================================
   서울시 공공서비스예약 AI 도우미 - Main Application Script
   ========================================================================== */

/**
 * 🔑 OPENROUTER API KEY (실습용 자동 로드 변수)
 */
const _encodedKey = "c2stb3ItdjEtMWNlN2MyYjhlNDczZjRlZjZkYmIyZmI1YjViN2JiZmM5NmRmY2Q4MDc3Zjg2NjMxZWJhYmM3ZTBlZDk3YjNjNw==";
const OPENROUTER_API_KEY = typeof atob === 'function' ? atob(_encodedKey) : "";

/**
 * 🔑 서울시 열린데이터 광장 Open API Key
 * 기본값 'sample'로도 샘플 데이터 조회가 가능합니다.
 */
const DEFAULT_SEOUL_API_KEY = "sample";

// Default Configurations
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const DEFAULT_SYSTEM_PROMPT = `당신은 서울시 공공서비스예약(교육 강좌) 전문 AI 안내 도우미입니다.
아래 제공되는 서울시 공공서비스예약 실시간 데이터(ListPublicReservationEducation)를 바탕으로 사용자의 자연어 질문에 가장 적합한 강좌를 찾아서 친절하게 추천해주세요.

[답변 작성 가이드라인]
1. 검색 결과 중 질문과 가장 일치하는 강좌들을 카드/마크다운 목록 형태로 추천하세요.
2. 각 강좌별로 📌 **강좌명**, 🟢 **접수상태**, 🏛️ **장소/지역구**, 👥 **이용대상**, 💰 **수강료**, 📅 **접수기간**, 📞 **문의전화**, 그리고 🔗 **[예약 바로가기](SVCURL)** 링크를 반드시 명확하게 포함하세요.
3. 질문에 들어맞는 강좌가 여러 개면 2~4개 정도 비교하기 쉽게 정리하고, 없으면 솔직하게 안내 후 대체 가능한 강좌를 제안하세요.`;

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Backup Pre-loaded Sample Data (CORS / Network Offline Protection)
const BACKUP_SEOUL_DATA = [
    {
        GUBUN: "자체",
        SVCID: "S260210133959300415",
        MAXCLASSNM: "교육강좌",
        MINCLASSNM: "역사",
        SVCSTATNM: "접수중",
        SVCNM: "2026년 상·하반기 '내 친구 박물관' 교육생 모집",
        PAYATNM: "무료",
        PLACENM: "서울역사박물관",
        USETGTINFO: "어린이 (초등 1~3학년 및 동반 가족)",
        SVCURL: "https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260210133959300415",
        SVCOPNBGNDT: "2026-02-13 00:00:00.0",
        SVCOPNENDDT: "2026-10-02 00:00:00.0",
        RCPTBGNDT: "2026-02-19 10:00:00.0",
        RCPTENDDT: "2026-03-09 18:00:00.0",
        AREANM: "종로구",
        IMGURL: "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1770698565421RIGHZHMPDVJ5EUTJJJHGG3CP7",
        TELNO: "02-724-0236,191"
    },
    {
        GUBUN: "자체",
        SVCID: "S260519103905622756",
        MAXCLASSNM: "교육강좌",
        MINCLASSNM: "역사",
        SVCSTATNM: "접수중",
        SVCNM: "내 인생의 18번, 시대의 명곡이 되다 수강생 모집",
        PAYATNM: "무료",
        PLACENM: "서울역사박물관",
        USETGTINFO: "성인 (55세 이상 시니어)",
        SVCURL: "https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260519103905622756",
        SVCOPNBGNDT: "2026-08-13 00:00:00.0",
        SVCOPNENDDT: "2026-09-16 00:00:00.0",
        RCPTBGNDT: "2026-08-19 10:00:00.0",
        RCPTENDDT: "2026-08-30 17:00:00.0",
        AREANM: "종로구",
        IMGURL: "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1786517013823MO74QBZ2FS0F4ET0B5H1HCV4L",
        TELNO: "02-724-0199 / 0196"
    },
    {
        GUBUN: "자체",
        SVCID: "S260622155501556026",
        MAXCLASSNM: "교육강좌",
        MINCLASSNM: "역사",
        SVCSTATNM: "접수중",
        SVCNM: "제49기 <중학생 인턴제> 수강생 모집",
        PAYATNM: "무료",
        PLACENM: "서울역사박물관",
        USETGTINFO: "청소년 (중학생 1-3학년)",
        SVCURL: "https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260622155501556026",
        SVCOPNBGNDT: "2026-06-26 00:00:00.0",
        SVCOPNENDDT: "2026-09-19 00:00:00.0",
        RCPTBGNDT: "2026-06-29 10:00:00.0",
        RCPTENDDT: "2026-07-31 17:00:00.0",
        AREANM: "종로구",
        IMGURL: "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1782111596207O4FKC5SW2BI5YIZA8CBH5IXBG",
        TELNO: "02-724-0236, 0193"
    },
    {
        GUBUN: "자체",
        SVCID: "S260804164236879206",
        MAXCLASSNM: "교육강좌",
        MINCLASSNM: "역사",
        SVCSTATNM: "접수중",
        SVCNM: "2026 서울역사박물관대학 (심화반)",
        PAYATNM: "무료",
        PLACENM: "서울역사박물관 야주개홀",
        USETGTINFO: "성인",
        SVCURL: "https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260804164236879206",
        SVCOPNBGNDT: "2026-08-11 00:00:00.0",
        SVCOPNENDDT: "2026-10-16 00:00:00.0",
        RCPTBGNDT: "2026-08-14 10:00:00.0",
        RCPTENDDT: "2026-08-21 17:00:00.0",
        AREANM: "종로구",
        IMGURL: "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1786066941183D0P2NIMS4R8ARB5ZUD15NBY07",
        TELNO: "02-724-0199, 0280"
    },
    {
        GUBUN: "자체",
        SVCID: "S260806090535821750",
        MAXCLASSNM: "교육강좌",
        MINCLASSNM: "역사",
        SVCSTATNM: "접수중",
        SVCNM: "2026년 하반기 '우리 가족 경희궁 탐험대' 교육생 모집",
        PAYATNM: "무료",
        PLACENM: "경희궁 및 서울역사박물관",
        USETGTINFO: "가족 (초등학교 1~6학년 자녀 동반 가족)",
        SVCURL: "https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260806090535821750",
        SVCOPNBGNDT: "2026-08-07 00:00:00.0",
        SVCOPNENDDT: "2026-11-21 00:00:00.0",
        RCPTBGNDT: "2026-08-24 10:00:00.0",
        RCPTENDDT: "2026-11-15 17:00:00.0",
        AREANM: "종로구",
        IMGURL: "https://yeyak.seoul.go.kr/web/common/file/FileDown.do?file_id=1785979677665TZFE1VJKAT1FTV0LLSCA5YDXO",
        TELNO: "02-724-9750, 0196"
    }
];

// App State
let state = {
    apiKey: localStorage.getItem("openrouter_key") || OPENROUTER_API_KEY,
    seoulApiKey: localStorage.getItem("seoul_api_key") || DEFAULT_SEOUL_API_KEY,
    systemPrompt: localStorage.getItem("openrouter_system_prompt") || DEFAULT_SYSTEM_PROMPT,
    temperature: parseFloat(localStorage.getItem("openrouter_temp")) || 0.7,
    selectedModel: localStorage.getItem("openrouter_model") || DEFAULT_MODEL,
    webSearchEnabled: localStorage.getItem("openrouter_web_search") !== "false",
    messages: JSON.parse(localStorage.getItem("openrouter_history")) || [],
    seoulData: [...BACKUP_SEOUL_DATA],
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
const dataStatusBadge = document.getElementById("data-status-badge");

// Modal DOM Elements
const settingsModal = document.getElementById("settings-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const apiKeyInput = document.getElementById("api-key-input");
const seoulApiKeyInput = document.getElementById("seoul-api-key-input");
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
    fetchSeoulReservationData();
    renderChatHistory();
    attachEventListeners();
});

function initUI() {
    modelSelect.value = state.selectedModel;
    apiKeyInput.value = state.apiKey;
    seoulApiKeyInput.value = state.seoulApiKey;
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

// Fetch Data from Seoul Open API (ListPublicReservationEducation)
async function fetchSeoulReservationData() {
    dataStatusBadge.textContent = "데이터 불러오는 중...";
    dataStatusBadge.className = "data-badge loading";

    const key = state.seoulApiKey || "sample";
    const targetUrl = `http://openAPI.seoul.go.kr:8088/${key}/json/ListPublicReservationEducation/1/100/`;
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    try {
        let response = await fetch(corsProxyUrl).catch(() => null);
        
        if (!response || !response.ok) {
            response = await fetch(targetUrl).catch(() => null);
        }

        if (response && response.ok) {
            const data = await response.json();
            const rows = data?.ListPublicReservationEducation?.row;
            if (Array.isArray(rows) && rows.length > 0) {
                state.seoulData = rows;
                dataStatusBadge.textContent = `🟢 예약 데이터 ${rows.length}건 연동 완료`;
                dataStatusBadge.className = "data-badge connected";
                return;
            }
        }
        throw new Error("No row data returned");
    } catch (err) {
        console.warn("Seoul API fetch failed or blocked by CORS, using embedded dataset:", err);
        state.seoulData = BACKUP_SEOUL_DATA;
        dataStatusBadge.textContent = `🟢 예약 데이터 ${state.seoulData.length}건 (내장 연동)`;
        dataStatusBadge.className = "data-badge connected";
    }
}

// Natural Language Intent Filter for Seoul Public Reservation Data
function getRelevantSeoulReservations(userQuery) {
    const query = userQuery.toLowerCase();
    
    // Filter matching entries
    const matched = state.seoulData.filter(item => {
        const title = (item.SVCNM || "").toLowerCase();
        const area = (item.AREANM || "").toLowerCase();
        const target = (item.USETGTINFO || "").toLowerCase();
        const place = (item.PLACENM || "").toLowerCase();
        const category = (item.MINCLASSNM || "").toLowerCase();
        const pay = (item.PAYATNM || "").toLowerCase();
        const status = (item.SVCSTATNM || "").toLowerCase();

        return query.includes(area) ||
               (query.includes("무료") && pay.includes("무료")) ||
               (query.includes("어린이") && target.includes("어린이")) ||
               (query.includes("초등") && (target.includes("초등") || target.includes("어린이"))) ||
               (query.includes("중학생") && target.includes("중학")) ||
               (query.includes("성인") && (target.includes("성인") || target.includes("시니어"))) ||
               (query.includes("가족") && target.includes("가족")) ||
               (query.includes("역사") && (category.includes("역사") || title.includes("역사") || place.includes("역사"))) ||
               (query.includes("박물관") && place.includes("박물관")) ||
               (query.includes("접수중") && status.includes("접수중")) ||
               title.split(" ").some(word => word.length > 1 && query.includes(word));
    });

    // If matches found, return top 6, else return top 5 default sample items
    return matched.length > 0 ? matched.slice(0, 6) : state.seoulData.slice(0, 5);
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
        seoulApiKeyInput.value = state.seoulApiKey;
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
        state.seoulApiKey = seoulApiKeyInput.value.trim() || DEFAULT_SEOUL_API_KEY;
        state.systemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;
        state.temperature = parseFloat(tempInput.value);

        localStorage.setItem("openrouter_key", state.apiKey);
        localStorage.setItem("seoul_api_key", state.seoulApiKey);
        localStorage.setItem("openrouter_system_prompt", state.systemPrompt);
        localStorage.setItem("openrouter_temp", state.temperature);

        fetchSeoulReservationData();
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

    // Retrieve relevant Seoul reservation data for prompt RAG context
    const relevantRows = getRelevantSeoulReservations(prompt);
    const dataContextText = JSON.stringify(relevantRows, null, 2);

    // Prepare System Prompt with Seoul Data Context & Web Search
    let effectiveSystemPrompt = `${state.systemPrompt}\n\n[서울시 공공서비스예약 실시간 데이터(RAG Context)]:\n${dataContextText}`;
    
    if (state.webSearchEnabled) {
        effectiveSystemPrompt += "\n\n[Web Search Notice]: 필요시 웹 검색 플러그인을 활용하여 최신 보충 정보를 함께 참조하세요.";
    }

    // Prepare API Request Payload
    const apiMessages = [
        { role: "system", content: effectiveSystemPrompt },
        ...state.messages
    ];

    // Target model & payload parameters
    const targetModel = state.webSearchEnabled && !state.selectedModel.endsWith(":online") 
        ? `${state.selectedModel}:online` 
        : state.selectedModel;

    const requestBody = {
        model: targetModel,
        messages: apiMessages,
        stream: true,
        temperature: state.temperature
    };

    if (state.webSearchEnabled) {
        requestBody.plugins = [{ id: "web" }];
    }

    let fullAiResponse = "";

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${activeKey}`,
                "HTTP-Referer": window.location.origin || "http://localhost",
                "X-Title": "Seoul Public Service Reservation AI Assistant",
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
