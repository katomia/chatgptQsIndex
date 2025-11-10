// 创建侧边栏
function createSidebar() {
  if (document.getElementById("chatgpt-sidebar")) {
    return;
  }

  const sidebar = document.createElement("iframe");

  sidebar.id = "chatgpt-sidebar";
  sidebar.src = chrome.runtime.getURL("sidebar.html");
  sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100vh;
        border: none;
        z-index: 9999;
        background: white;
    `;

  const toggleButton = document.createElement("button");
  toggleButton.textContent = "Hide";
  toggleButton.style.cssText = `
  position: fixed;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  z-index: 10000;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
  cursor: pointer;
  font-size: 10px;
  transition: all 0.25s ease;
    `;

  toggleButton.addEventListener("mouseenter", () => {
    toggleButton.style.transform = "translateY(-50%) scale(1.1)";
    toggleButton.style.boxShadow = "0 6px 15px rgba(139,92,246,0.6)";
  });
  toggleButton.addEventListener("mouseleave", () => {
    toggleButton.style.transform = "translateY(-50%) scale(1)";
    toggleButton.style.boxShadow = "0 4px 12px rgba(99,102,241,0.4)";
  });

  function toggleSidebar() {
    sidebar.classList.toggle("hidden");

    if (sidebar.classList.contains("hidden")) {
      toggleButton.textContent = "Show";
    } else {
      toggleButton.textContent = "Hide";
    }
  }

  // 监听按钮点击事件
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleSidebar);
  }

  document.body.appendChild(sidebar);
  document.body.appendChild(toggleButton);

  // 添加页面内容右边距，避免被侧边栏遮挡
  adjustPageMargin();

  // 监听来自侧边栏的消息
  window.addEventListener("message", handleSidebarMessage);

  // 初始收集问题
  setTimeout(collectQuestions, 1000);

  // 监听DOM变化，自动更新问题列表
  observeDOMChanges();
}

// 调整页面边距
function adjustPageMargin() {
  const mainContent =
    document.querySelector("main") || document.querySelector(".flex-1");
  if (mainContent) {
    mainContent.style.marginRight = "300px";
    mainContent.style.transition = "margin-right 0.3s ease-in-out";
  }
}

// 处理来自侧边栏的消息
function handleSidebarMessage(event) {
  if (event.data.type === "SCROLL_TO_QUESTION") {
    scrollToQuestion(event.data.index);
  } else if (event.data.type === "CLOSE_SIDEBAR") {
    closeSidebar();
  } else if (event.data.type === "HIDE_SIDEBAR") {
    hideSidebar();
  }
}

// 滚动到指定问题
async function scrollToQuestion(index) {
  const questions = Array.from(
    document.querySelectorAll(".whitespace-pre-wrap")
  );
  if (questions[index]) {
    const questionElement = questions[index];

    // 平滑滚动到问题位置
    questionElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // 添加临时高亮效果
    highlightElement(questionElement);

    // 通知侧边栏更新活跃状态
    const sidebar = document.getElementById("chatgpt-sidebar");
    if (sidebar && sidebar.contentWindow) {
      sidebar.contentWindow.postMessage(
        {
          type: "SET_ACTIVE_QUESTION",
          index: index,
        },
        "*"
      );
    }
  }
}

// 高亮元素
function highlightElement(element) {
  const originalBackground = element.style.backgroundColor;
  element.style.transition = "background-color 0.3s ease";

  setTimeout(() => {
    element.style.backgroundColor = originalBackground || "";
  }, 2000);
}

async function getAllQuestions() {
  if (document.readyState === "loading") {
    await new Promise((res) =>
      window.addEventListener("DOMContentLoaded", res, { once: true })
    );
  }
  return Array.from(document.querySelectorAll('[class="whitespace-pre-wrap"]')).map(
    (el) => el.textContent.trim()
  );
}

// 收集问题并发送到侧边栏
async function collectQuestions() {
  const questions = await getAllQuestions();

  const questionData = questions.map((question, index) => ({
    id: index + 1,
    text: question,
    length: question.length,
  }));

  const sidebar = document.getElementById("chatgpt-sidebar");
  if (sidebar && sidebar.contentWindow) {
    sidebar.contentWindow.postMessage(
      {
        type: "UPDATE_QUESTIONS",
        questions: questionData,
      },
      "*"
    );
  }
}

// 监听DOM变化
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.querySelector?.('[data-testid^="conversation-turn-"]') ||
              node.classList?.contains("group") ||
              node.getAttribute?.("data-message-author-role") === "user")
          ) {
            shouldUpdate = true;
          }
        });
      }
    });

    if (shouldUpdate) {
      setTimeout(collectQuestions, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 关闭侧边栏
function closeSidebar() {
  const sidebar = document.getElementById("chatgpt-sidebar");
  if (sidebar) {
    sidebar.remove();

    // 恢复页面边距
    const mainContent =
      document.querySelector("main") || document.querySelector(".flex-1");
    if (mainContent) {
      mainContent.style.marginRight = "0";
    }
  }
}

//隐藏侧边栏
function hideSidebar() {
  const sidebar = document.getElementById("chatgpt-sidebar");
  if (sidebar) {
    sidebar.classList.toggle("hidden");
  }
}

// 初始化侧边栏
function init() {
  // 等待页面加载完成
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createSidebar);
  } else {
    createSidebar();
  }
}

// 启动插件
init();
