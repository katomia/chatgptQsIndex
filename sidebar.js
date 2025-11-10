// 侧边栏功能
class Sidebar {
    constructor() {
        this.questions = [];
        this.activeIndex = -1;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupMessageListener();
        this.createStars(); // 创建星空背景
    }
    
    // 创建星空效果
    createStars() {
        const starsContainer = document.getElementById('stars');
        const starCount = 50;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // 随机位置和大小
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            
            // 随机动画延迟和持续时间
            const delay = Math.random() * 5;
            const duration = 3 + Math.random() * 4;
            star.style.animationDelay = `${delay}s`;
            star.style.animationDuration = `${duration}s`;
            
            starsContainer.appendChild(star);
        }
    }
    
    bindEvents() {
        // 关闭按钮事件
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
            });
        }
    }
    
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data.type === 'UPDATE_QUESTIONS') {
                this.updateQuestions(event.data.questions);
            } else if (event.data.type === 'SET_ACTIVE_QUESTION') {
                this.setActiveQuestion(event.data.index);
            }
        });
    }
    
    updateQuestions(questions) {
        this.questions = questions;
        this.renderQuestions();
    }
    
    renderQuestions() {
        const questionList = document.getElementById('questionList');
        
        if (this.questions.length === 0) {
            questionList.innerHTML = '<li class="empty-state">暂无问题，开始对话后这里会显示导航</li>';
            return;
        }
        
        questionList.innerHTML = this.questions.map((question, index) => `
            <li class="question-item ${index === this.activeIndex ? 'active' : ''}" 
                data-index="${index}">
                <div class="question-header">
                    <div class="question-number">${index + 1}</div>
                    <div class="question-label">问题 ${index + 1}</div>
                </div>
                <div class="question-text">${this.escapeHtml(question.text)}</div>
            </li>
        `).join('');
        
        // 绑定点击事件
        questionList.querySelectorAll('.question-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                this.scrollToQuestion(index);
            });
        });
    }
    
    setActiveQuestion(index) {
        this.activeIndex = index;
        this.renderQuestions();
    }
    
    scrollToQuestion(index) {
        window.parent.postMessage({
            type: 'SCROLL_TO_QUESTION',
            index: index
        }, '*');
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// 初始化侧边栏
new Sidebar();
// 初始化侧边栏
new Sidebar();