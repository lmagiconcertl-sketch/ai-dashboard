// AI 서비스 관리 대시보드 JavaScript

// 기본 AI 서비스 데이터
const defaultServices = {
    agent: [
        { name: '마누스', url: 'https://manus.im' },
        { name: '챗지피티', url: 'https://chat.openai.com' },
        { name: '재미나이', url: 'https://gemini.google.com' },
        { name: '플로우이스', url: 'https://flowith.io/blank' }
    ],
    image: [
        { name: '힉스필드', url: 'https://higgsfield.ai/' },
        { name: '미드저니', url: 'https://midjourney.com' },
        { name: '구글AI스튜디오', url: 'https://aistudio.google.com' }
    ],
    video: [
        { name: '힉스필드', url: 'https://higgsfield.ai/' },
        { name: '플로우', url: 'https://labs.google/fx/ko/tools/flow' },
        { name: '소라2', url: 'https://openai.com/sora' },
        { name: '밈', url: 'https://meme-gen.ai/' },
        { name: '15초 동작', url: 'https://wan.video/' },
        { name: '탑뷰', url: 'https://www.topview.ai/' },
        { name: '하이루오', url: 'https://hailuoai.video/' },
        { name: '런웨이', url: 'https://runwayml.com/' }
    ],
    tts: [
        { name: '미니맥스', url: 'https://www.minimax.io/audio' }
    ],
    music: [
        { name: '수노', url: 'https://suno.ai' }
    ],
    editing: [
        { name: '캡컷', url: 'https://capcut.com' },
        { name: '브루', url: 'https://vrew.ai/ko/try/index.html' },
        { name: '에디메이커', url: 'https://edimakor.hitpaw.kr/' }
    ]
};

// 전역 변수
let services = {};
let subscriptions = [];
let exchangeRate = 1300; // 기본 환율

// DOM 요소
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const serviceModal = document.getElementById('serviceModal');
const subscriptionModal = document.getElementById('subscriptionModal');
const modalOverlay = document.getElementById('modalOverlay');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    addEditModalEventListeners();
    loadData();
    renderServices();
    renderSubscriptions();
    fetchExchangeRate();
});

// 앱 초기화
function initializeApp() {
    // localStorage에서 데이터 로드, 없으면 기본 데이터 사용
    const savedServices = localStorage.getItem('aiServices');
    if (savedServices) {
        services = JSON.parse(savedServices);
    } else {
        services = { ...defaultServices };
        saveServices();
    }

    const savedSubscriptions = localStorage.getItem('aiSubscriptions');
    if (savedSubscriptions) {
        subscriptions = JSON.parse(savedSubscriptions);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 탭 전환
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // 서비스 추가 모달
    document.getElementById('addServiceBtn').addEventListener('click', () => {
        openModal('service');
    });

    // 구독 추가 모달
    document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
        openModal('subscription');
    });

    // 모달 닫기
    document.getElementById('closeServiceModal').addEventListener('click', () => {
        closeModal('service');
    });

    document.getElementById('closeSubscriptionModal').addEventListener('click', () => {
        closeModal('subscription');
    });

    document.getElementById('cancelServiceBtn').addEventListener('click', () => {
        closeModal('service');
    });

    document.getElementById('cancelSubscriptionBtn').addEventListener('click', () => {
        closeModal('subscription');
    });

    modalOverlay.addEventListener('click', () => {
        closeModal('service');
        closeModal('subscription');
    });

    // 폼 제출
    document.getElementById('serviceForm').addEventListener('submit', handleServiceSubmit);
    document.getElementById('subscriptionForm').addEventListener('submit', handleSubscriptionSubmit);

    // 환율 새로고침
    document.getElementById('refreshRateBtn').addEventListener('click', fetchExchangeRate);

    // 통화 변경 시 라벨 및 심볼 업데이트
    document.getElementById('subscriptionCurrency').addEventListener('change', function() {
        const currency = this.value;
        const currencySymbol = document.getElementById('currencySymbol');
        const priceInput = document.getElementById('subscriptionPrice');
        
        if (currency === 'KRW') {
            currencySymbol.textContent = '₩';
            priceInput.step = '1';
        } else {
            currencySymbol.textContent = '$';
            priceInput.step = '0.01';
        }
    });
}

// 탭 전환
function switchTab(tabName) {
    // 탭 버튼 활성화
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // 탭 콘텐츠 표시
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });
}

// 모달 열기
function openModal(type) {
    if (type === 'service') {
        serviceModal.classList.add('active');
        document.getElementById('serviceForm').reset();
    } else if (type === 'subscription') {
        subscriptionModal.classList.add('active');
        document.getElementById('subscriptionForm').reset();
        document.getElementById('currencySymbol').textContent = '$';
    } else if (type === 'editSubscription') {
        document.getElementById('editSubscriptionModal').classList.add('active');
    }
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal(type) {
    if (type === 'service') {
        serviceModal.classList.remove('active');
    } else if (type === 'subscription') {
        subscriptionModal.classList.remove('active');
    } else if (type === 'editSubscription') {
        document.getElementById('editSubscriptionModal').classList.remove('active');
    }
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 서비스 폼 제출 처리
function handleServiceSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('serviceName').value.trim();
    const url = document.getElementById('serviceUrl').value.trim();
    const category = document.getElementById('serviceCategory').value;

    if (!name || !url || !category) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    // URL 형식 검증
    try {
        new URL(url);
    } catch {
        alert('올바른 URL을 입력해주세요.');
        return;
    }

    // 서비스 추가
    if (!services[category]) {
        services[category] = [];
    }

    services[category].push({ name, url });
    saveServices();
    renderServices();
    closeModal('service');

    // 성공 메시지
    showNotification(`${name} 서비스가 추가되었습니다.`);
}

// 구독 폼 제출 처리
function handleSubscriptionSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('subscriptionName').value.trim();
    const price = parseFloat(document.getElementById('subscriptionPrice').value);
    const period = document.getElementById('subscriptionPeriod').value;
    const currency = document.getElementById('subscriptionCurrency').value;
    const startDate = document.getElementById('subscriptionStartDate').value;

    if (!name || !price || !period || !currency || !startDate) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (price <= 0) {
        alert('구독료는 0보다 큰 값을 입력해주세요.');
        return;
    }

    // 구독 추가
    const subscription = {
        id: Date.now(),
        name,
        price,
        period,
        currency,
        startDate
    };

    subscriptions.push(subscription);
    saveSubscriptions();
    renderSubscriptions();
    updateStats();
    closeModal('subscription');

    // 폼 초기화
    document.getElementById('subscriptionForm').reset();
    document.getElementById('currencySymbol').textContent = '$';

    // 성공 메시지
    showNotification(`${name} 구독이 추가되었습니다.`);
}

// 서비스 렌더링
function renderServices() {
    const categories = ['agent', 'image', 'video', 'tts', 'music', 'editing'];
    const categoryIds = ['agent-services', 'image-services', 'video-services', 'tts-services', 'music-services', 'editing-services'];

    categories.forEach((category, index) => {
        const container = document.getElementById(categoryIds[index]);
        if (!container) return;

        container.innerHTML = '';

        if (services[category] && services[category].length > 0) {
            services[category].forEach((service, serviceIndex) => {
                const serviceCard = createServiceCard(service, category, serviceIndex);
                container.appendChild(serviceCard);
            });
        } else {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center; padding: 2rem;">등록된 서비스가 없습니다.</p>';
        }
    });
}

// 서비스 카드 생성
function createServiceCard(service, category, index) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    // 도메인에서 파비콘 URL 생성
    const faviconUrl = getFaviconUrl(service.url);
    
    card.innerHTML = `
        <div class="service-card-header">
            <img src="${faviconUrl}" alt="${service.name} 로고" class="service-logo" onerror="this.style.display='none'">
            <h4>${service.name}</h4>
        </div>
        <p>AI 서비스에 빠르게 접속하세요</p>
        <div class="service-actions">
            <a href="${service.url}" target="_blank" class="service-url">
                ${service.url}
            </a>
            <button class="delete-service" onclick="deleteService('${category}', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // 카드 클릭 시 새 창으로 열기
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-service') && !e.target.closest('.service-url')) {
            window.open(service.url, '_blank');
        }
    });

    return card;
}

// 파비콘 URL 생성 함수
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        // Google의 파비콘 서비스 사용 (무료)
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
        // URL 파싱 실패 시 기본 아이콘 반환
        return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234f46e5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    }
}

// 서비스 삭제
function deleteService(category, index) {
    if (confirm('이 서비스를 삭제하시겠습니까?')) {
        services[category].splice(index, 1);
        saveServices();
        renderServices();
        showNotification('서비스가 삭제되었습니다.');
    }
}

// 구독 렌더링
function renderSubscriptions() {
    const tbody = document.getElementById('subscriptions-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (subscriptions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                    등록된 구독이 없습니다.
                </td>
            </tr>
        `;
        return;
    }

    subscriptions.forEach((subscription, index) => {
        const row = createSubscriptionRow(subscription, index);
        tbody.appendChild(row);
    });

    updateStats();
}

// 구독 행 생성
function createSubscriptionRow(subscription, index) {
    const row = document.createElement('tr');
    
    // 통화별 처리
    const currency = subscription.currency || 'USD'; // 기존 데이터 호환성
    let usdPrice, krwPrice;
    
    if (currency === 'KRW') {
        // 원화인 경우
        usdPrice = (subscription.price / exchangeRate).toFixed(2);
        krwPrice = subscription.price.toLocaleString();
    } else {
        // 달러인 경우
        usdPrice = subscription.price.toFixed(2);
        krwPrice = (subscription.price * exchangeRate).toLocaleString();
    }

    // 갱신일 처리
    const startDate = subscription.startDate || subscription.renewalDate || '';
    const nextRenewalDate = calculateNextRenewalDate(startDate, subscription.period);
    const renewalStatus = getRenewalStatus(nextRenewalDate);
    const startDateFormatted = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : '-';
    const nextRenewalDateFormatted = nextRenewalDate ? new Date(nextRenewalDate).toLocaleDateString('ko-KR') : '-';

    row.innerHTML = `
        <td><strong>${subscription.name}</strong></td>
        <td>$${usdPrice}</td>
        <td>₩${krwPrice}</td>
        <td>${subscription.period === 'monthly' ? '월간' : '연간'}</td>
        <td>${startDateFormatted}</td>
        <td class="renewal-date ${renewalStatus.class}">${nextRenewalDateFormatted}</td>
        <td><span class="subscription-status ${renewalStatus.statusClass}">${renewalStatus.text}</span></td>
        <td>
            <div class="subscription-actions">
                <button class="btn btn-edit" onclick="editSubscription(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger" onclick="deleteSubscription(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// 구독 삭제
function deleteSubscription(index) {
    if (confirm('이 구독을 삭제하시겠습니까?')) {
        subscriptions.splice(index, 1);
        saveSubscriptions();
        renderSubscriptions();
        showNotification('구독이 삭제되었습니다.');
    }
}

// 통계 업데이트
function updateStats() {
    let monthlyTotalUSD = 0;
    let yearlyTotalUSD = 0;
    let monthlyTotalKRW = 0;
    let yearlyTotalKRW = 0;

    subscriptions.forEach(subscription => {
        const currency = subscription.currency || 'USD';
        
        if (currency === 'KRW') {
            // 원화 구독
            if (subscription.period === 'monthly') {
                monthlyTotalKRW += subscription.price;
                yearlyTotalKRW += subscription.price * 12;
                monthlyTotalUSD += subscription.price / exchangeRate;
                yearlyTotalUSD += (subscription.price * 12) / exchangeRate;
            } else {
                monthlyTotalKRW += subscription.price / 12;
                yearlyTotalKRW += subscription.price;
                monthlyTotalUSD += subscription.price / 12 / exchangeRate;
                yearlyTotalUSD += subscription.price / exchangeRate;
            }
        } else {
            // 달러 구독
            if (subscription.period === 'monthly') {
                monthlyTotalUSD += subscription.price;
                yearlyTotalUSD += subscription.price * 12;
                monthlyTotalKRW += subscription.price * exchangeRate;
                yearlyTotalKRW += (subscription.price * 12) * exchangeRate;
            } else {
                monthlyTotalUSD += subscription.price / 12;
                yearlyTotalUSD += subscription.price;
                monthlyTotalKRW += (subscription.price / 12) * exchangeRate;
                yearlyTotalKRW += subscription.price * exchangeRate;
            }
        }
    });

    // USD 표시
    document.getElementById('monthly-usd').textContent = `$${monthlyTotalUSD.toFixed(2)}`;
    document.getElementById('yearly-usd').textContent = `$${yearlyTotalUSD.toFixed(2)}`;

    // KRW 표시
    document.getElementById('monthly-krw').textContent = `₩${monthlyTotalKRW.toLocaleString()}`;
    document.getElementById('yearly-krw').textContent = `₩${yearlyTotalKRW.toLocaleString()}`;
}

// 환율 가져오기
async function fetchExchangeRate() {
    try {
        document.getElementById('current-rate').textContent = '로딩 중...';
        document.getElementById('rate-updated').textContent = '업데이트: 로딩 중...';

        // 무료 환율 API 사용
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data.rates && data.rates.KRW) {
            exchangeRate = data.rates.KRW;
            document.getElementById('current-rate').textContent = exchangeRate.toFixed(2);
            
            const updateTime = new Date().toLocaleString('ko-KR');
            document.getElementById('rate-updated').textContent = `업데이트: ${updateTime}`;
            
            // 환율이 업데이트되면 구독 정보도 다시 렌더링
            renderSubscriptions();
            
            // 환율 정보 저장
            localStorage.setItem('exchangeRate', exchangeRate);
            localStorage.setItem('exchangeRateUpdated', updateTime);
        } else {
            throw new Error('환율 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.error('환율 가져오기 실패:', error);
        
        // 저장된 환율 정보 사용
        const savedRate = localStorage.getItem('exchangeRate');
        const savedTime = localStorage.getItem('exchangeRateUpdated');
        
        if (savedRate) {
            exchangeRate = parseFloat(savedRate);
            document.getElementById('current-rate').textContent = exchangeRate.toFixed(2);
            document.getElementById('rate-updated').textContent = `업데이트: ${savedTime || '알 수 없음'}`;
        } else {
            document.getElementById('current-rate').textContent = '1300.00 (기본값)';
            document.getElementById('rate-updated').textContent = '업데이트: 실패';
        }
        
        showNotification('환율 정보를 가져오는데 실패했습니다. 기본값을 사용합니다.', 'error');
    }
}

// 데이터 저장
function saveServices() {
    localStorage.setItem('aiServices', JSON.stringify(services));
}

function saveSubscriptions() {
    localStorage.setItem('aiSubscriptions', JSON.stringify(subscriptions));
}

function loadData() {
    // 환율 정보 로드
    const savedRate = localStorage.getItem('exchangeRate');
    const savedTime = localStorage.getItem('exchangeRateUpdated');
    
    if (savedRate) {
        exchangeRate = parseFloat(savedRate);
        document.getElementById('current-rate').textContent = exchangeRate.toFixed(2);
        document.getElementById('rate-updated').textContent = `업데이트: ${savedTime || '알 수 없음'}`;
    }
}

// 알림 표시
function showNotification(message, type = 'success') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    // 애니메이션 CSS 추가
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape') {
        closeModal('service');
        closeModal('subscription');
    }
    
    // Ctrl/Cmd + N으로 서비스 추가
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openModal('service');
    }
    
    // Ctrl/Cmd + S로 구독 추가
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        openModal('subscription');
    }
});


// 추가 UI 개선 기능들

// 검색 기능 추가
function addSearchFunctionality() {
    // 검색 입력 필드 생성
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = `
        margin-bottom: 2rem;
        text-align: center;
    `;
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'AI 서비스 검색...';
    searchInput.className = 'search-input';
    searchInput.style.cssText = `
        width: 100%;
        max-width: 400px;
        padding: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.9);
        font-size: 1rem;
        text-align: center;
        transition: all 0.3s ease;
    `;
    
    searchInput.addEventListener('focus', () => {
        searchInput.style.borderColor = '#4f46e5';
        searchInput.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)';
    });
    
    searchInput.addEventListener('blur', () => {
        searchInput.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        searchInput.style.boxShadow = 'none';
    });
    
    searchInput.addEventListener('input', (e) => {
        filterServices(e.target.value);
    });
    
    searchContainer.appendChild(searchInput);
    
    // 서비스 탭의 섹션 헤더 다음에 검색 컨테이너 추가
    const servicesTab = document.getElementById('services-tab');
    const sectionHeader = servicesTab.querySelector('.section-header');
    sectionHeader.after(searchContainer);
}

// 서비스 필터링
function filterServices(searchTerm) {
    const categories = ['agent', 'image', 'video', 'tts', 'music', 'editing'];
    const categoryContainers = categories.map(cat => 
        document.querySelector(`.service-category:has(#${cat}-services)`)
    );
    
    if (!searchTerm.trim()) {
        // 검색어가 없으면 모든 카테고리 표시
        categoryContainers.forEach(container => {
            if (container) container.style.display = 'block';
        });
        renderServices();
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    categories.forEach((category, index) => {
        const container = categoryContainers[index];
        if (!container) return;
        
        const categoryServices = services[category] || [];
        const matchingServices = categoryServices.filter(service => 
            service.name.toLowerCase().includes(searchLower)
        );
        
        if (matchingServices.length > 0) {
            container.style.display = 'block';
            const serviceGrid = container.querySelector(`#${category}-services`);
            serviceGrid.innerHTML = '';
            
            matchingServices.forEach((service, serviceIndex) => {
                const originalIndex = categoryServices.indexOf(service);
                const serviceCard = createServiceCard(service, category, originalIndex);
                serviceGrid.appendChild(serviceCard);
            });
        } else {
            container.style.display = 'none';
        }
    });
}

// 다크 모드 토글 기능
function addDarkModeToggle() {
    const darkModeBtn = document.createElement('button');
    darkModeBtn.className = 'btn btn-outline dark-mode-toggle';
    darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    `;
    
    darkModeBtn.addEventListener('click', toggleDarkMode);
    document.body.appendChild(darkModeBtn);
    
    // 저장된 다크 모드 설정 로드
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        enableDarkMode();
    }
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    if (isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
    
    const darkModeBtn = document.querySelector('.dark-mode-toggle');
    if (darkModeBtn) {
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // 다크 모드 스타일 추가
    if (!document.querySelector('#dark-mode-styles')) {
        const darkStyles = document.createElement('style');
        darkStyles.id = 'dark-mode-styles';
        darkStyles.textContent = `
            .dark-mode {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
            }
            .dark-mode .header {
                background: rgba(0, 0, 0, 0.8) !important;
            }
            .dark-mode .nav-tabs {
                background: rgba(0, 0, 0, 0.7) !important;
            }
            .dark-mode .service-card,
            .dark-mode .exchange-rate-card,
            .dark-mode .stat-card,
            .dark-mode .subscription-list {
                background: rgba(0, 0, 0, 0.8) !important;
                color: white !important;
            }
            .dark-mode .service-card h4,
            .dark-mode .stat-content h3,
            .dark-mode .list-header h3 {
                color: white !important;
            }
            .dark-mode th {
                background: rgba(0, 0, 0, 0.5) !important;
                color: white !important;
            }
            .dark-mode td {
                color: #d1d5db !important;
            }
        `;
        document.head.appendChild(darkStyles);
    }
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
    
    const darkModeBtn = document.querySelector('.dark-mode-toggle');
    if (darkModeBtn) {
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// 데이터 내보내기/가져오기 기능
function addDataManagement() {
    const dataManagementContainer = document.createElement('div');
    dataManagementContainer.className = 'data-management';
    dataManagementContainer.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 1000;
    `;
    
    // 데이터 내보내기 버튼
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary';
    exportBtn.innerHTML = '<i class="fas fa-download"></i>';
    exportBtn.title = '데이터 내보내기';
    exportBtn.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    `;
    exportBtn.addEventListener('click', exportData);
    
    // 데이터 가져오기 버튼
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-secondary';
    importBtn.innerHTML = '<i class="fas fa-upload"></i>';
    importBtn.title = '데이터 가져오기';
    importBtn.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    `;
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', importData);
        input.click();
    });
    
    dataManagementContainer.appendChild(exportBtn);
    dataManagementContainer.appendChild(importBtn);
    document.body.appendChild(dataManagementContainer);
}

function exportData() {
    const data = {
        services: services,
        subscriptions: subscriptions,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ai-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('데이터가 성공적으로 내보내졌습니다.');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.services && data.subscriptions) {
                if (confirm('기존 데이터를 덮어쓰시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    services = data.services;
                    subscriptions = data.subscriptions;
                    
                    saveServices();
                    saveSubscriptions();
                    
                    renderServices();
                    renderSubscriptions();
                    
                    showNotification('데이터가 성공적으로 가져와졌습니다.');
                }
            } else {
                throw new Error('올바르지 않은 데이터 형식입니다.');
            }
        } catch (error) {
            showNotification('데이터 가져오기에 실패했습니다: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// 통계 차트 추가 (간단한 도넛 차트)
function addSubscriptionChart() {
    if (subscriptions.length === 0) return;
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 2rem;
        text-align: center;
    `;
    
    const chartTitle = document.createElement('h3');
    chartTitle.textContent = '구독 비용 분포';
    chartTitle.style.cssText = `
        margin-bottom: 1.5rem;
        color: #1f2937;
    `;
    
    const chartCanvas = document.createElement('canvas');
    chartCanvas.width = 300;
    chartCanvas.height = 300;
    chartCanvas.style.cssText = `
        max-width: 100%;
        height: auto;
    `;
    
    chartContainer.appendChild(chartTitle);
    chartContainer.appendChild(chartCanvas);
    
    // 구독 관리 탭의 통계 그리드 다음에 추가
    const subscriptionsTab = document.getElementById('subscriptions-tab');
    const statsGrid = subscriptionsTab.querySelector('.stats-grid');
    statsGrid.after(chartContainer);
    
    // 간단한 도넛 차트 그리기
    drawSubscriptionChart(chartCanvas);
}

function drawSubscriptionChart(canvas) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 100;
    const innerRadius = 60;
    
    // 구독별 비용 계산
    const chartData = subscriptions.map(sub => ({
        name: sub.name,
        value: sub.period === 'monthly' ? sub.price : sub.price / 12,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // 도넛 차트 그리기
    chartData.forEach(item => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        
        currentAngle += sliceAngle;
    });
    
    // 범례 그리기
    const legendY = canvas.height - 80;
    chartData.forEach((item, index) => {
        const legendX = 20 + (index % 2) * 140;
        const legendYPos = legendY + Math.floor(index / 2) * 20;
        
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendYPos, 15, 15);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Inter';
        ctx.fillText(`${item.name} ($${item.value.toFixed(2)})`, legendX + 20, legendYPos + 12);
    });
}

// 향상된 초기화 함수
function enhancedInitialization() {
    // 기존 초기화 후 추가 기능들 활성화
    setTimeout(() => {
        addSearchFunctionality();
        addDarkModeToggle();
        addDataManagement();
        
        // 구독이 있을 때만 차트 추가
        if (subscriptions.length > 0) {
            addSubscriptionChart();
        }
    }, 100);
}

// 기존 초기화에 향상된 기능 추가
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadData();
    renderServices();
    renderSubscriptions();
    fetchExchangeRate();
    enhancedInitialization();
});

// 갱신 상태 확인
// 다음 갱신일 계산
function calculateNextRenewalDate(startDate, period) {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
    start.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
    
    if (period === 'monthly') {
        // 월간 구독: 시작일로부터 다음 월
        let nextRenewal = new Date(start);
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        
        // 만약 계산된 날짜가 오늘보다 이전이면 계속 월을 추가
        while (nextRenewal <= today) {
            nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        }
        
        return nextRenewal.toISOString().split('T')[0];
    } else if (period === 'yearly') {
        // 연간 구독: 시작일로부터 다음 년
        let nextRenewal = new Date(start);
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        
        // 만약 계산된 날짜가 오늘보다 이전이면 계속 년을 추가
        while (nextRenewal <= today) {
            nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        }
        
        return nextRenewal.toISOString().split('T')[0];
    }
    
    return null;
}

function getRenewalStatus(renewalDate) {
    if (!renewalDate) {
        return {
            class: '',
            statusClass: 'status-active',
            text: '활성'
        };
    }

    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            class: 'expired',
            statusClass: 'status-expired',
            text: '만료'
        };
    } else if (diffDays <= 7) {
        return {
            class: 'warning',
            statusClass: 'status-warning',
            text: `${diffDays}일 후 갱신`
        };
    } else if (diffDays <= 30) {
        return {
            class: '',
            statusClass: 'status-active',
            text: `${diffDays}일 후 갱신`
        };
    } else {
        return {
            class: '',
            statusClass: 'status-active',
            text: '활성'
        };
    }
}

// 구독 수정
function editSubscription(index) {
    const subscription = subscriptions[index];
    
    // 수정 모달에 기존 데이터 채우기
    document.getElementById('editSubscriptionId').value = index;
    document.getElementById('editSubscriptionName').value = subscription.name;
    document.getElementById('editSubscriptionCurrency').value = subscription.currency || 'USD';
    document.getElementById('editSubscriptionPrice').value = subscription.price;
    document.getElementById('editSubscriptionPeriod').value = subscription.period;
    document.getElementById('editSubscriptionStartDate').value = subscription.startDate || subscription.renewalDate || '';
    
    // 통화 심볼 업데이트
    const currency = subscription.currency || 'USD';
    const editCurrencySymbol = document.getElementById('editCurrencySymbol');
    const editPriceInput = document.getElementById('editSubscriptionPrice');
    
    if (currency === 'KRW') {
        editCurrencySymbol.textContent = '₩';
        editPriceInput.step = '1';
    } else {
        editCurrencySymbol.textContent = '$';
        editPriceInput.step = '0.01';
    }
    
    openModal('editSubscription');
}

// 구독 수정 폼 제출 처리
function handleEditSubscriptionSubmit(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('editSubscriptionId').value);
    const name = document.getElementById('editSubscriptionName').value.trim();
    const price = parseFloat(document.getElementById('editSubscriptionPrice').value);
    const period = document.getElementById('editSubscriptionPeriod').value;
    const currency = document.getElementById('editSubscriptionCurrency').value;
    const startDate = document.getElementById('editSubscriptionStartDate').value;

    if (!name || !price || !period || !currency || !startDate) {
        alert('모든 필드를 입력해주세요.');
        return;
    }

    if (price <= 0) {
        alert('구독료는 0보다 큰 값을 입력해주세요.');
        return;
    }

    // 구독 수정
    subscriptions[index] = {
        ...subscriptions[index],
        name,
        price,
        period,
        currency,
        startDate
    };

    saveSubscriptions();
    renderSubscriptions();
    updateStats();
    closeModal('editSubscription');

    // 성공 메시지
    showNotification(`${name} 구독이 수정되었습니다.`);
}

// 수정 모달 관련 이벤트 리스너 추가
function addEditModalEventListeners() {
    // 수정 모달 닫기
    document.getElementById('closeEditSubscriptionModal').addEventListener('click', () => {
        closeModal('editSubscription');
    });

    document.getElementById('cancelEditSubscriptionBtn').addEventListener('click', () => {
        closeModal('editSubscription');
    });

    // 수정 폼 제출
    document.getElementById('editSubscriptionForm').addEventListener('submit', handleEditSubscriptionSubmit);

    // 수정 모달 통화 변경 시 심볼 업데이트
    document.getElementById('editSubscriptionCurrency').addEventListener('change', function() {
        const currency = this.value;
        const editCurrencySymbol = document.getElementById('editCurrencySymbol');
        const editPriceInput = document.getElementById('editSubscriptionPrice');
        
        if (currency === 'KRW') {
            editCurrencySymbol.textContent = '₩';
            editPriceInput.step = '1';
        } else {
            editCurrencySymbol.textContent = '$';
            editPriceInput.step = '0.01';
        }
    });
}
