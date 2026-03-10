import { buildSystemPrompt } from "./chat-prompts.js";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="underline decoration-2" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = String(markdown || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let i = 0;
  let inCode = false;
  let codeLines = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (inCode) {
        blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        inCode = true;
      }
      i += 1;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      i += 1;
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(`<h3>${renderInline(line.slice(4))}</h3>`);
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h2>${renderInline(line.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h1>${renderInline(line.slice(2))}</h1>`);
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push(`<blockquote>${renderInline(line.slice(2))}</blockquote>`);
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(`<li>${renderInline(lines[i].slice(2))}</li>`);
        i += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    blocks.push(`<p>${renderInline(line)}</p>`);
    i += 1;
  }
  return blocks.join("");
}

export function setupChatModule({ siteConfig } = {}) {
  const panel = document.querySelector("[data-chat-panel]");
  const bubblesEl = document.querySelector("[data-chat-bubbles]");
  const questionsEl = document.querySelector("[data-chat-questions]");
  const mergedEl = document.querySelector("[data-chat-merged]");
  const toggleEl = document.querySelector("[data-chat-toggle]");
  const clearEl = document.querySelector("[data-chat-clear]");
  const inputEl = document.querySelector("[data-chat-input]");
  const sendEl = document.querySelector("[data-chat-send]");
  const mouthTop = document.querySelector(".mouth-lip--top");
  const mouthBottom = document.querySelector(".mouth-lip--bottom");
  if (!panel || !bubblesEl || !questionsEl || !mergedEl || !toggleEl || !clearEl || !inputEl || !sendEl) {
    return;
  }
  const storageKey = "heroChatHistory";
  const chatApiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  const chatModel = "glm-4.6";
  const maxContextMessages = 10;
  const systemPrompt = buildSystemPrompt({ siteConfig });
  let expanded = false;
  let bubbleScrollTop = 0;
  let questionsScrollTop = 0;
  let mergedScrollTop = 0;
  let mouthResetId = 0;
  let cachedApiKey = "";
  const loadHistory = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };
  const saveHistory = (nextHistory) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextHistory));
    } catch (error) {
      void error;
    }
  };
  let history = loadHistory();
  const loadApiKey = async () => {
    if (cachedApiKey) {
      return cachedApiKey;
    }
    const runtimeKey = (window.GLM_API_KEY || window.API_KEY || "").trim();
    if (runtimeKey) {
      cachedApiKey = runtimeKey;
      return cachedApiKey;
    }
    const importMetaEnv = typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : null;
    const envKey = importMetaEnv
      ? (importMetaEnv.GLM_API_KEY || importMetaEnv.VITE_GLM_API_KEY || importMetaEnv.API_KEY || importMetaEnv.VITE_API_KEY || "").trim()
      : "";
    if (envKey) {
      cachedApiKey = envKey;
      return cachedApiKey;
    }
    const envPaths = ["/.env", "../.env", "./.env"];
    for (const envPath of envPaths) {
      try {
        const response = await fetch(envPath, { cache: "no-store" });
        if (!response.ok) {
          continue;
        }
        const content = await response.text();
        const match = content.match(/^\s*API_KEY\s*=\s*(.+)\s*$/m);
        if (match && match[1]) {
          cachedApiKey = match[1].trim();
          return cachedApiKey;
        }
      } catch (error) {
        void error;
      }
    }
    throw new Error("未找到 API_KEY，请确认 .env 可访问并包含 API_KEY");
  };
  const buildConversationMessages = (historySnapshot, currentUserText) => {
    const transcript = [];
    historySnapshot.forEach((item) => {
      if (item.userText) {
        transcript.push({ role: "user", content: item.userText });
      }
      if (item.botText) {
        transcript.push({ role: "assistant", content: item.botText });
      }
    });
    const inheritedMessages = transcript.slice(-maxContextMessages);
    return [{ role: "system", content: systemPrompt }, ...inheritedMessages, { role: "user", content: currentUserText }];
  };
  const requestGlmReply = async (userText, historySnapshot) => {
    const apiKey = await loadApiKey();
    const response = await fetch(chatApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: chatModel,
        messages: buildConversationMessages(historySnapshot, userText),
        thinking: { type: "disabled" },
        max_tokens: 65536,
        temperature: 1.0
      })
    });
    if (!response.ok) {
      let errorText = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        const apiMessage = errorBody?.error?.message || errorBody?.message;
        if (apiMessage) {
          errorText = apiMessage;
        }
      } catch (error) {
        void error;
      }
      throw new Error(errorText);
    }
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) {
      return content.trim();
    }
    if (Array.isArray(content)) {
      const joined = content
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item.text === "string") {
            return item.text;
          }
          return "";
        })
        .join("")
        .trim();
      if (joined) {
        return joined;
      }
    }
    throw new Error("模型返回内容为空");
  };
  const updateSendState = () => {
    const hasText = inputEl.value.trim().length > 0;
    sendEl.disabled = !hasText;
  };
  const renderBotContent = (text) => `<div class="chat-bubble-content chat-markdown">${markdownToHtml(text)}</div>`;
  const render = () => {
    const shouldStickBubbles = bubblesEl.scrollTop + bubblesEl.clientHeight >= bubblesEl.scrollHeight - 4;
    const shouldStickQuestions = questionsEl.scrollTop + questionsEl.clientHeight >= questionsEl.scrollHeight - 4;
    const shouldStickMerged = mergedEl.scrollTop + mergedEl.clientHeight >= mergedEl.scrollHeight - 4;
    bubblesEl.innerHTML = "";
    questionsEl.innerHTML = "";
    mergedEl.innerHTML = "";
    const bubbleItems = history.map((item, index) => {
      const bubble = document.createElement("div");
      const isLatest = index === history.length - 1;
      bubble.className = "chat-bubble";
      if (isLatest) {
        bubble.classList.add("chat-bubble--latest");
      }
      bubble.dataset.replyId = item.id;
      if (!item.botText) {
        bubble.classList.add("chat-bubble--loading");
        bubble.innerHTML = `
          <div class="chat-bubble-content">Thinking...</div>
          <div class="chat-loader"></div>
        `;
      } else {
        bubble.innerHTML = renderBotContent(item.botText);
      }
      return bubble;
    });
    bubbleItems.forEach((bubble) => bubblesEl.appendChild(bubble));
    const questionItems = history.map((item) => {
      const entry = document.createElement("button");
      entry.type = "button";
      entry.className = "chat-question-item";
      entry.dataset.replyId = item.id;
      entry.textContent = item.userText;
      entry.addEventListener("click", () => {
        const target = bubblesEl.querySelector(`[data-reply-id="${item.id}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      return entry;
    });
    questionItems.forEach((entry) => questionsEl.appendChild(entry));
    history.forEach((item) => {
      const userRow = document.createElement("div");
      userRow.className = "chat-question-item chat-merged-bubble chat-merged-bubble--user";
      userRow.innerHTML = `<div class="chat-bubble-content">${escapeHtml(item.userText)}</div>`;
      mergedEl.appendChild(userRow);
      const botRow = document.createElement("div");
      botRow.className = "chat-bubble chat-merged-bubble chat-merged-bubble--bot";
      if (!item.botText) {
        botRow.classList.add("chat-bubble--loading");
        botRow.innerHTML = `
          <div class="chat-bubble-content">Thinking...</div>
          <div class="chat-loader"></div>
        `;
      } else {
        botRow.innerHTML = renderBotContent(item.botText);
      }
      mergedEl.appendChild(botRow);
    });
    if (shouldStickBubbles) {
      bubblesEl.scrollTop = bubblesEl.scrollHeight;
    }
    if (shouldStickQuestions) {
      questionsEl.scrollTop = questionsEl.scrollHeight;
    }
    if (shouldStickMerged) {
      mergedEl.scrollTop = mergedEl.scrollHeight;
    }
    updateSendState();
  };
  const animateMouth = (text) => {
    if (!mouthTop || !mouthBottom) {
      return;
    }
    const length = text.replace(/\s+/g, "").length;
    const cycles = Math.max(2, Math.min(40, Math.ceil(length / 3)));
    const duration = 120;
    const openAmount = Math.min(12, 4 + Math.floor(length / 10));
    const total = cycles * duration;
    mouthTop.style.animation = "none";
    mouthBottom.style.animation = "none";
    mouthTop.style.setProperty("--mouth-open", `${openAmount}px`);
    mouthBottom.style.setProperty("--mouth-open", `${openAmount}px`);
    if (mouthResetId) {
      window.clearTimeout(mouthResetId);
    }
    window.requestAnimationFrame(() => {
      mouthTop.style.animation = `mouth-talk-top ${duration}ms ease-in-out ${cycles}`;
      mouthBottom.style.animation = `mouth-talk-bottom ${duration}ms ease-in-out ${cycles}`;
    });
    mouthResetId = window.setTimeout(() => {
      mouthTop.style.animation = "none";
      mouthBottom.style.animation = "none";
    }, total + 50);
  };
  const addMessage = async (text) => {
    const previousHistory = history;
    const id = `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    history = [...previousHistory, { id, userText: text, botText: "" }];
    saveHistory(history);
    render();
    try {
      const replyText = await requestGlmReply(text, previousHistory);
      history = history.map((item) => item.id === id
        ? { ...item, botText: replyText }
        : item);
      saveHistory(history);
      render();
      animateMouth(replyText);
    } catch (error) {
      const replyText = `请求失败：${error instanceof Error ? error.message : "未知错误"}`;
      history = history.map((item) => item.id === id
        ? { ...item, botText: replyText }
        : item);
      saveHistory(history);
      render();
      animateMouth(replyText);
    }
  };
  const submitInput = () => {
    const text = inputEl.value.trim();
    if (!text) {
      return;
    }
    inputEl.value = "";
    void addMessage(text);
  };
  const clearHistory = () => {
    history = [];
    saveHistory(history);
    render();
  };
  const setExpanded = (nextExpanded) => {
    if (expanded === nextExpanded) {
      return;
    }
    if (expanded) {
      mergedScrollTop = mergedEl.scrollTop;
    } else {
      bubbleScrollTop = bubblesEl.scrollTop;
      questionsScrollTop = questionsEl.scrollTop;
    }
    expanded = nextExpanded;
    panel.dataset.expanded = expanded ? "true" : "false";
    toggleEl.innerHTML = expanded
      ? `<span class="material-symbols-outlined">unfold_less</span><span>Collapse</span>`
      : `<span class="material-symbols-outlined">unfold_more</span><span>Expand</span>`;
    window.requestAnimationFrame(() => {
      if (expanded) {
        mergedEl.scrollTop = mergedScrollTop;
      } else {
        bubblesEl.scrollTop = bubbleScrollTop;
        questionsEl.scrollTop = questionsScrollTop;
      }
    });
  };
  toggleEl.addEventListener("click", () => setExpanded(!expanded));
  clearEl.addEventListener("click", clearHistory);
  sendEl.addEventListener("click", submitInput);
  inputEl.addEventListener("input", updateSendState);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitInput();
    }
  });
  render();
  setExpanded(false);
}
