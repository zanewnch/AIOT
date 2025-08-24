/**
 * AIOT 內部文檔系統前端腳本
 * 提供動態功能和互動體驗
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AIOT 內部文檔系統已載入');
    
    // 初始化各種功能
    initializeSearch();
    initializeThemeToggle();
    initializeCardAnimations();
    initializeAPITesting();
});

/**
 * 搜索功能初始化
 */
function initializeSearch() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    
    searchBox.addEventListener('input', debounce(function(e) {
        const query = e.target.value.toLowerCase().trim();
        if (query.length > 0) {
            performSearch(query);
        }
    }, 300));
}

/**
 * 執行搜索
 */
async function performSearch(query) {
    try {
        // 可以擴展為從多個 JSON 文件搜索
        const [gatewayData, servicesData] = await Promise.all([
            fetch('/static/data/gateway-docs.json').then(r => r.json()),
            fetch('/static/data/services-docs.json').then(r => r.json())
        ]);
        
        const results = [];
        
        // 搜索 Gateway 內容
        if (gatewayData.name.toLowerCase().includes(query)) {
            results.push({
                type: 'gateway',
                title: gatewayData.name,
                description: gatewayData.description,
                url: '/docs/gateway'
            });
        }
        
        // 搜索功能
        gatewayData.features?.forEach(feature => {
            if (feature.name.toLowerCase().includes(query) || 
                feature.description.toLowerCase().includes(query)) {
                results.push({
                    type: 'feature',
                    title: `${feature.name} (Gateway Feature)`,
                    description: feature.description,
                    url: '/docs/gateway#features'
                });
            }
        });
        
        // 搜索服務
        servicesData.services?.forEach(service => {
            if (service.displayName.toLowerCase().includes(query) ||
                service.description.toLowerCase().includes(query)) {
                results.push({
                    type: 'service',
                    title: service.displayName,
                    description: service.description,
                    url: `/docs/services/${service.name}`
                });
            }
        });
        
        displaySearchResults(results, query);
        
    } catch (error) {
        console.error('搜索失敗:', error);
    }
}

/**
 * 顯示搜索結果
 */
function displaySearchResults(results, query) {
    const resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>沒有找到與 "${query}" 相關的內容</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(result => `
        <div class="search-result-item">
            <h3><a href="${result.url}">${result.title}</a></h3>
            <p>${result.description}</p>
            <span class="result-type">${result.type}</span>
        </div>
    `).join('');
}

/**
 * 主題切換功能
 */
function initializeThemeToggle() {
    // 可以添加暗色主題切換
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    prefersDark.addEventListener('change', function(e) {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

/**
 * 卡片動畫效果
 */
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.card');
    
    // 添加滑動進入動畫
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
}

/**
 * API 測試功能
 */
function initializeAPITesting() {
    // 為 API 端點添加測試按鈕
    const endpoints = document.querySelectorAll('.endpoint-list li');
    
    endpoints.forEach(endpoint => {
        const endpointText = endpoint.textContent;
        const testButton = document.createElement('button');
        testButton.className = 'test-api-btn';
        testButton.textContent = '測試';
        testButton.onclick = () => testEndpoint(endpointText);
        
        endpoint.appendChild(testButton);
    });
}

/**
 * 測試 API 端點
 */
async function testEndpoint(endpointText) {
    // 簡單的 API 測試功能
    const urlMatch = endpointText.match(/→ (.+)/);
    if (!urlMatch) return;
    
    const url = urlMatch[1].replace(/aiot-\w+:/, 'localhost:');
    
    try {
        const response = await fetch(url);
        const status = response.ok ? '✅ 可用' : '❌ 不可用';
        
        showNotification(`API 測試結果: ${status} (${response.status})`);
    } catch (error) {
        showNotification(`API 測試失敗: ${error.message}`, 'error');
    }
}

/**
 * 顯示通知
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#dc2626' : '#16a34a'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 動畫進入
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動移除
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * 防抖函數
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 複製到剪貼板
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('已複製到剪貼板');
    }).catch(() => {
        showNotification('複製失敗', 'error');
    });
}

/**
 * 為代碼塊添加複製按鈕
 */
document.querySelectorAll('.code-block, .code-snippet').forEach(codeBlock => {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = '複製';
    copyBtn.onclick = () => copyToClipboard(codeBlock.textContent);
    
    codeBlock.style.position = 'relative';
    copyBtn.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s;
    `;
    
    codeBlock.appendChild(copyBtn);
    
    codeBlock.addEventListener('mouseenter', () => {
        copyBtn.style.opacity = '1';
    });
    
    codeBlock.addEventListener('mouseleave', () => {
        copyBtn.style.opacity = '0';
    });
});