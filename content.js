// 创建侧边栏
function createSidebar() {
    // 检查是否已存在侧边栏
    if (document.getElementById('chatgpt-sidebar')) {
        return;
    }

    // 创建iframe来加载侧边栏
    const sidebar = document.createElement('iframe');
    sidebar.id = 'chatgpt-sidebar';
    sidebar.src = chrome.runtime.getURL('sidebar.html');
    sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 300px;
        height: 100vh;
        border: none;
        z-index: 9999;
        background: white;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    `;
    
    document.body.appendChild(sidebar);
    
    // 添加页面内容右边距，避免被侧边栏遮挡
    adjustPageMargin();
    
    // 监听来自侧边栏的消息
    window.addEventListener('message', handleSidebarMessage);
    
    // 初始收集问题
    setTimeout(collectQuestions, 1000);
    
    // 监听DOM变化，自动更新问题列表
    observeDOMChanges();
}

// 调整页面边距
function adjustPageMargin() {
    const mainContent = document.querySelector('main') || document.querySelector('.flex-1');
    if (mainContent) {
        mainContent.style.marginRight = '300px';
        mainContent.style.transition = 'margin-right 0.3s ease-in-out';
    }
}

// 处理来自侧边栏的消息
function handleSidebarMessage(event) {
    if (event.data.type === 'SCROLL_TO_QUESTION') {
        scrollToQuestion(event.data.index);
    } else if (event.data.type === 'CLOSE_SIDEBAR') {
        closeSidebar();
    }
}

// 滚动到指定问题
function scrollToQuestion(index) {
    const questions = getAllQuestions();
    if (questions[index]) {
        const questionElement = questions[index];
        
        // 平滑滚动到问题位置
        questionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // 添加临时高亮效果
        highlightElement(questionElement);
        
        // 通知侧边栏更新活跃状态
        const sidebar = document.getElementById('chatgpt-sidebar');
        if (sidebar && sidebar.contentWindow) {
            sidebar.contentWindow.postMessage({
                type: 'SET_ACTIVE_QUESTION',
                index: index
            }, '*');
        }
    }
}

// 高亮元素
function highlightElement(element) {
    const originalBackground = element.style.backgroundColor;
    element.style.backgroundColor = '#ebf8ff';
    element.style.transition = 'background-color 0.3s ease';
    
    setTimeout(() => {
        element.style.backgroundColor = originalBackground || '';
    }, 2000);
}

function getAllQuestions() {
    // ChatGPT页面的问题选择器 - 可能需要根据实际页面结构调整
    const selectors = [
        '[data-testid^="conversation-turn-"]', // 新的ChatGPT界面
        '[data-message-author-role="user"]', // 用户角色消息
        '.group .whitespace-pre-wrap', // 用户消息
        '.prose .whitespace-pre-wrap' // 消息内容
    ];
    
    let questions = [];
    
    for (const selector of selectors) {
        questions = Array.from(document.querySelectorAll(selector));
        if (questions.length > 0) {
            break;
        }
    }
    
    // 过滤出用户的问题（排除助手的回复）
    return questions.filter(question => {
        const text = question.textContent.trim();
        return text && text.length > 0 && 
               !question.closest('[data-message-author-role="assistant"]') &&
               !question.textContent.includes('ChatGPT');
    });
}

// 收集问题并发送到侧边栏
function collectQuestions() {
    const questions = getAllQuestions();
    const questionData = questions.map((question, index) => {
        // 清理问题文本，移除"You said"等前缀
        let text = question.textContent.trim();
        
        // 移除常见的前缀
        const prefixes = [
            'You said:',
            'You:',
            'User:',
            'Human:',
            'You said',
            '你说：',
            '你：'
        ];
        
        prefixes.forEach(prefix => {
            if (text.startsWith(prefix)) {
                text = text.substring(prefix.length).trim();
            }
        });
        
        // 移除开头的引号或其他特殊字符
        text = text.replace(/^["'「」【】]|["'「」【】]$/g, '').trim();
        
        return {
            index: index,
            text: text.substring(0, 120) + (text.length > 120 ? '...' : ''),
            originalText: text // 保存完整文本用于调试
        };
    });
    
    const sidebar = document.getElementById('chatgpt-sidebar');
    if (sidebar && sidebar.contentWindow) {
        sidebar.contentWindow.postMessage({
            type: 'UPDATE_QUESTIONS',
            questions: questionData
        }, '*');
    }
}
// 监听DOM变化
function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && (
                        node.querySelector?.('[data-testid^="conversation-turn-"]') ||
                        node.classList?.contains('group') ||
                        node.getAttribute?.('data-message-author-role') === 'user'
                    )) {
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
        subtree: true
    });
}

// 关闭侧边栏
function closeSidebar() {
    const sidebar = document.getElementById('chatgpt-sidebar');
    if (sidebar) {
        sidebar.remove();
        
        // 恢复页面边距
        const mainContent = document.querySelector('main') || document.querySelector('.flex-1');
        if (mainContent) {
            mainContent.style.marginRight = '0';
        }
    }
}

// 初始化侧边栏
function init() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createSidebar);
    } else {
        createSidebar();
    }
}

// 启动插件
init();