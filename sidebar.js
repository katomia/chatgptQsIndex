// 侧边栏功能
class Sidebar {
    constructor() {
        this.questions = [];
        this.activeIndex = -1;
        this.init();
    }
    
    init() {
        this.setupMessageListener();
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
            questionList.innerHTML = '<li class="empty-state">Nothing here....</li>';
            return;
        }
        
        questionList.innerHTML = this.questions.map((question, index) => `
            <li class="question-item ${index === this.activeIndex ? 'active' : ''}" 
                data-index="${index}">
                <div class="question-header">
                    <div class="question-label">Q ${index + 1}</div>
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

new Sidebar();