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

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    initializeApp();
    setupEventListeners();
    loadData();
    renderServices();
    renderSubscriptions();
    fetchExchangeRate();
});

// 앱 초기화
function initializeApp() {
    console.log('Initializing app...');
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
    console.log('Setting up event listeners...');
    
    // 탭 전환
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            switchTab(tabName);
        });
    });

    // 서비스 추가 모달
    const addServiceBtn = document.getElementById('addServiceBtn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            openModal('service');
        });
    }

    // 구독 추가 모달
    const addSubscriptionBtn = document.getElementById('addSubscriptionBtn');
    if (addSubscriptionBtn) {
        addSubscriptionBtn.addEventListener('click', () => {
            openModal('subscription');
        });
    }

    // 모달 닫기 버튼들
    const closeServiceModal = document.getElementById('closeServiceModal');
    if (closeServiceModal) {
        closeServiceModal.addEventListener('click', () => {
            closeModal('service');
        });
    }

    const closeSubscriptionModal = document.getElementById('closeSubscriptionModal');
    if (closeSubscriptionModal) {
        closeSubscriptionModal.addEventListener('click', () => {
            closeModal('subscription');
        });
    }

    const closeEditSubscriptionModal = document.getElementById('closeEditSubscriptionModal');
    if (closeEditSubscriptionModal) {
        closeEditSubscriptionModal.addEventListener('click', () => {
            closeModal('editSubscription');
        });
    }

    // 취소 버튼들
    const cancelServiceBtn = document.getElementById('cancelServiceBtn');
    if (cancelServiceBtn) {
        cancelServiceBtn.addEventListener('click', () => {
            closeModal('service');
        });
    }

    const cancelSubscriptionBtn = document.getElementById('cancelSubscriptionBtn');
    if (cancelSubscriptionBtn) {
        cancelSubscriptionBtn.addEventListener('click', () => {
            closeModal('subscription');
        });
    }

    const cancelEditSubscriptionBtn = document.getElementById('cancelEditSubscriptionBtn');
    if (cancelEditSubscriptionBtn) {
        cancelEditSubscriptionBtn.addEventListener('click', () => {
            closeModal('editSubscription');
        });
    }

    // 모달 오버레이 클릭
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeModal('service');
            closeModal('subscription');
            closeModal('editSubscription');
        });
    }

    // 폼 제출
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceSubmit);
    }

    const subscriptionForm = document.getElementById('subscriptionForm');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', handleSubscriptionSubmit);
    }

    const editSubscriptionForm = document.getElementById('editSubscriptionForm');
    if (editSubscriptionForm) {
        editSubscriptionForm.addEventListener('submit', handleEditSubscriptionSubmit);
    }

    // 통화 변경 시 라벨 및 심볼 업데이트
    const subscriptionCurrency = document.getElementById('subscriptionCurrency');
    if (subscriptionCurrency) {
        subscriptionCurrency.addEventListener('change', function() {
            updateCurrencyDisplay(this.value, 'currencySymbol', 'subscriptionPrice');
        });
    }

    const editSubscriptionCurrency = document.getElementById('editSubscriptionCurrency');
    if (editSubscriptionCurrency) {
        editSubscriptionCurrency.addEventListener('change', function() {
            updateCurrencyDisplay(this.value, 'editCurrencySymbol', 'editSubscriptionPrice');
        });
    }

    // 다크 모드 토글
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
}

// 통화 표시 업데이트
function updateCurrencyDisplay(currency, symbolId, inputId) {
    const currencySymbol = document.getElementById(symbolId);
    const priceInput = document.getElementById(inputId);
    
    if (currencySymbol && priceInput) {
        if (currency === 'KRW') {
            currencySymbol.textContent = '₩';
            priceInput.step = '1';
        } else {
            currencySymbol.textContent = '$';
            priceInput.step = '0.01';
        }
    }
}

// 탭 전환
function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // 탭 버튼 활성화
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // 탭 콘텐츠 표시
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });
}

// 모달 열기
function openModal(type) {
    console.log('Opening modal:', type);
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
    }
    
    if (type === 'service') {
        const serviceModal = document.getElementById('serviceModal');
        if (serviceModal) {
            serviceModal.classList.add('active');
            const serviceForm = document.getElementById('serviceForm');
            if (serviceForm) {
                serviceForm.reset();
            }
        }
    } else if (type === 'subscription') {
        const subscriptionModal = document.getElementById('subscriptionModal');
        if (subscriptionModal) {
            subscriptionModal.classList.add('active');
            const subscriptionForm = document.getElementById('subscriptionForm');
            if (subscriptionForm) {
                subscriptionForm.reset();
            }
            updateCurrencyDisplay('USD', 'currencySymbol', 'subscriptionPrice');
        }
    } else if (type === 'editSubscription') {
        const editSubscriptionModal = document.getElementById('editSubscriptionModal');
        if (editSubscriptionModal) {
            editSubscriptionModal.classList.add('active');
        }
    }
    
    document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal(type) {
    console.log('Closing modal:', type);
    
    if (type === 'service') {
        const serviceModal = document.getElementById('serviceModal');
        if (serviceModal) {
            serviceModal.classList.remove('active');
        }
    } else if (type === 'subscription') {
        const subscriptionModal = document.getElementById('subscriptionModal');
        if (subscriptionModal) {
            subscriptionModal.classList.remove('active');
        }
    } else if (type === 'editSubscription') {
        const editSubscriptionModal = document.getElementById('editSubscriptionModal');
        if (editSubscriptionModal) {
            editSubscriptionModal.classList.remove('active');
        }
    }
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    
    document.body.style.overflow = 'auto';
}

// 서비스 폼 제출 처리
function handleServiceSubmit(e) {
    e.preventDefault();
    console.log('Handling service submit');
    
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
    console.log('Handling subscription submit');
    
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

    // 성공 메시지
    showNotification(`${name} 구독이 추가되었습니다.`);
}

// 구독 수정 폼 제출 처리
function handleEditSubscriptionSubmit(e) {
    e.preventDefault();
    console.log('Handling edit subscription submit');
    
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

// 서비스 렌더링
function renderServices() {
    console.log('Rendering services');
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
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
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
    console.log('Rendering subscriptions');
    const tbody = document.getElementById('subscriptionTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (subscriptions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 2rem; color: #6b7280;">
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
    const currency = subscription.currency || 'USD';
    let usdPrice, krwPrice, monthlyUsd, monthlyKrw;
    
    if (currency === 'KRW') {
        usdPrice = (subscription.price / exchangeRate).toFixed(2);
        krwPrice = subscription.price.toLocaleString();
    } else {
        usdPrice = subscription.price.toFixed(2);
        krwPrice = (subscription.price * exchangeRate).toLocaleString();
    }

    // 월간 환산
    if (subscription.period === 'monthly') {
        monthlyUsd = usdPrice;
        monthlyKrw = krwPrice;
    } else {
        monthlyUsd = (parseFloat(usdPrice) / 12).toFixed(2);
        monthlyKrw = Math.round(parseInt(krwPrice.replace(/,/g, '')) / 12).toLocaleString();
    }

    // 갱신일 처리
    const startDate = subscription.startDate || '';
    const nextRenewalDate = calculateNextRenewalDate(startDate, subscription.period);
    const renewalStatus = getRenewalStatus(nextRenewalDate);
    const startDateFormatted = startDate ? new Date(startDate).toLocaleDateString('ko-KR') : '-';
    const nextRenewalDateFormatted = nextRenewalDate ? new Date(nextRenewalDate).toLocaleDateString('ko-KR') : '-';

    row.innerHTML = `
        <td><strong>${subscription.name}</strong></td>
        <td>$${usdPrice}</td>
        <td>₩${krwPrice}</td>
        <td>${subscription.period === 'monthly' ? '월간' : '연간'}</td>
        <td>$${monthlyUsd}</td>
        <td>₩${monthlyKrw}</td>
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

// 구독 수정
function editSubscription(index) {
    console.log('Editing subscription:', index);
    const subscription = subscriptions[index];
    
    // 수정 모달에 기존 데이터 채우기
    document.getElementById('editSubscriptionId').value = index;
    document.getElementById('editSubscriptionName').value = subscription.name;
    document.getElementById('editSubscriptionCurrency').value = subscription.currency || 'USD';
    document.getElementById('editSubscriptionPrice').value = subscription.price;
    document.getElementById('editSubscriptionPeriod').value = subscription.period;
    document.getElementById('editSubscriptionStartDate').value = subscription.startDate || '';
    
    // 통화 심볼 업데이트
    const currency = subscription.currency || 'USD';
    updateCurrencyDisplay(currency, 'editCurrencySymbol', 'editSubscriptionPrice');
    
    openModal('editSubscription');
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
    console.log('Updating stats');
    let monthlyTotalUSD = 0;
    let yearlyTotalUSD = 0;
    let monthlyTotalKRW = 0;
    let yearlyTotalKRW = 0;

    subscriptions.forEach(subscription => {
        const currency = subscription.currency || 'USD';
        
        if (currency === 'KRW') {
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

    // 통계 표시 업데이트
    const totalUsdMonth = document.getElementById('totalUsdMonth');
    const totalKrwMonth = document.getElementById('totalKrwMonth');
    const totalUsdYear = document.getElementById('totalUsdYear');
    const exchangeRateElement = document.getElementById('exchangeRate');

    if (totalUsdMonth) totalUsdMonth.textContent = `$${monthlyTotalUSD.toFixed(2)}`;
    if (totalKrwMonth) totalKrwMonth.textContent = `₩${monthlyTotalKRW.toLocaleString()}`;
    if (totalUsdYear) totalUsdYear.textContent = `$${yearlyTotalUSD.toFixed(2)}`;
    if (exchangeRateElement) exchangeRateElement.textContent = `₩${exchangeRate.toFixed(2)}`;
}

// 환율 가져오기
async function fetchExchangeRate() {
    console.log('Fetching exchange rate');
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data.rates && data.rates.KRW) {
            exchangeRate = data.rates.KRW;
            localStorage.setItem('exchangeRate', exchangeRate);
            localStorage.setItem('exchangeRateUpdated', new Date().toISOString());
            
            renderSubscriptions();
            showNotification('환율이 업데이트되었습니다.');
        } else {
            throw new Error('환율 데이터를 가져올 수 없습니다.');
        }
    } catch (error) {
        console.error('환율 가져오기 실패:', error);
        
        const savedRate = localStorage.getItem('exchangeRate');
        if (savedRate) {
            exchangeRate = parseFloat(savedRate);
        }
        
        showNotification('환율 정보를 가져오는데 실패했습니다. 기본값을 사용합니다.', 'error');
    }
}

// 다음 갱신일 계산
function calculateNextRenewalDate(startDate, period) {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (period === 'monthly') {
        let nextRenewal = new Date(start);
        nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        
        while (nextRenewal <= today) {
            nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        }
        
        return nextRenewal.toISOString().split('T')[0];
    } else if (period === 'yearly') {
        let nextRenewal = new Date(start);
        nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        
        while (nextRenewal <= today) {
            nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        }
        
        return nextRenewal.toISOString().split('T')[0];
    }
    
    return null;
}

// 갱신 상태 확인
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

// 다크 모드 토글
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
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
    console.log('Loading data');
    // 다크 모드 설정 로드
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // 환율 정보 로드
    const savedRate = localStorage.getItem('exchangeRate');
    if (savedRate) {
        exchangeRate = parseFloat(savedRate);
    }
}

// 알림 표시
function showNotification(message, type = 'success') {
    console.log('Showing notification:', message, type);
    
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
        closeModal('editSubscription');
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

console.log('Script loaded successfully');
