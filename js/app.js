// ATELIER NOOK (아틀리에 눅) - 핵심 스크립트 & 실시간 디자인 커스터마이저

const STATE = {
  cart: JSON.parse(localStorage.getItem('atelier_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('atelier_wishlist')) || [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'popular',
  quickViewProduct: null,
  selectedOption: '',
  // 디자인 테마 설정 (서버에 저장된 값을 불러옴. 관리자만 변경 가능)
  themeSettings: null,
  isAdmin: false
};

const DEFAULT_THEME_SETTINGS = {
  theme: 'default',
  radius: 'medium',
  gridCols: 4,
  brandName: 'ATELIER NOOK',
  heroTitle: ''
};
STATE.themeSettings = { ...DEFAULT_THEME_SETTINGS };

const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 3000;

// 유틸리티 함수: 원화 포맷
function formatPrice(number) {
  return new Intl.NumberFormat('ko-KR').format(number) + '원';
}

// 로컬스토리지 저장
function saveState() {
  localStorage.setItem('atelier_cart', JSON.stringify(STATE.cart));
  localStorage.setItem('atelier_wishlist', JSON.stringify(STATE.wishlist));
  updateBadges();
}

// 뱃지 업데이트
function updateBadges() {
  const totalCartCount = STATE.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartBadge = document.getElementById('cart-badge');
  const cartDrawerCount = document.getElementById('cart-drawer-count');
  
  if (cartBadge) {
    cartBadge.textContent = totalCartCount;
    cartBadge.classList.toggle('hidden', totalCartCount === 0);
  }
  if (cartDrawerCount) {
    cartDrawerCount.textContent = totalCartCount;
  }

  const wishCount = STATE.wishlist.length;
  const wishBadge = document.getElementById('wish-badge');
  if (wishBadge) {
    wishBadge.textContent = wishCount;
    wishBadge.classList.toggle('hidden', wishCount === 0);
  }
}

// 토스트 알림
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-sm font-medium animate-fade-in bg-stone-900 text-white border border-stone-700`;
  
  let iconName = 'check-circle';
  if (type === 'wish') iconName = 'heart';
  if (type === 'cart') iconName = 'shopping-bag';
  if (type === 'theme') iconName = 'palette';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-4 h-4 text-amber-300"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

/* ==========================================================================
   실시간 디자인 커스터마이저 로직 (간편 테마 변경)
   ========================================================================== */

function applySavedTheme() {
  const { theme, radius, gridCols, brandName, heroTitle } = STATE.themeSettings;
  
  // 1. 테마 클래스 적용
  document.body.className = '';
  if (theme !== 'default') {
    document.body.classList.add(`theme-${theme}`);
  }

  // 2. 모서리 둥글기 적용
  if (radius) {
    document.documentElement.style.setProperty(
      '--card-radius', 
      radius === 'sharp' ? '0.2rem' : (radius === 'soft' ? '1.5rem' : '0.85rem')
    );
  }

  // 3. 그리드 컬럼 적용
  const gridEl = document.getElementById('product-grid');
  if (gridEl) {
    // 모바일은 항상 2열 (한 화면에 상품 4개), 데스크톱은 설정값
    gridEl.className = `grid grid-cols-2 lg:grid-cols-${gridCols || 4} gap-x-3 gap-y-4 sm:gap-6`;
  }

  // 4. 브랜드명 & 타이틀 적용
  if (brandName) {
    document.querySelectorAll('.brand-logo-text').forEach(el => el.textContent = brandName);
  }
  const heroTitleEl = document.getElementById('hero-title-main');
  if (heroTitleEl) {
    if (!heroTitleEl.dataset.original) heroTitleEl.dataset.original = heroTitleEl.innerHTML;
    if (heroTitle) heroTitleEl.textContent = heroTitle;
    else heroTitleEl.innerHTML = heroTitleEl.dataset.original;
  }
}

// 관리자가 바꾼 디자인 설정을 서버에 저장 (모든 방문자에게 적용)
let themeSaveTimer = null;
function saveThemeSettings() {
  if (!STATE.isAdmin) return;
  clearTimeout(themeSaveTimer);
  themeSaveTimer = setTimeout(async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: STATE.themeSettings })
      });
      if (!res.ok) throw new Error();
    } catch {
      showToast('디자인 설정 저장에 실패했습니다. 관리자 로그인을 확인해 주세요.', 'info');
    }
  }, 400);
}

function resetThemeSettings() {
  STATE.themeSettings = { ...DEFAULT_THEME_SETTINGS };
  applySavedTheme();
  saveThemeSettings();
  showToast('기본 디자인으로 되돌렸습니다.', 'theme');
}

// 저장된 디자인 설정 불러오기 + 관리자면 '디자인 스타일 변경' 버튼 표시
async function loadSiteSettings() {
  try {
    const res = await fetch('/api/settings', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.settings) {
        STATE.themeSettings = { ...DEFAULT_THEME_SETTINGS, ...data.settings };
        applySavedTheme();
      }
    }
  } catch {}

  try {
    const res = await fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' });
    const me = res.ok ? await res.json() : {};
    STATE.isAdmin = Boolean(me.loggedIn);
  } catch {}

  const trigger = document.getElementById('theme-trigger-btn');
  if (trigger) trigger.classList.toggle('hidden', !STATE.isAdmin);
  if (STATE.isAdmin && new URLSearchParams(location.search).has('design')) toggleThemePanel();
}

function selectTheme(themeName) {
  STATE.themeSettings.theme = themeName;
  saveThemeSettings();
  applySavedTheme();
  showToast(`'${getThemeNameKR(themeName)}' 스타일이 적용되었습니다.`, 'theme');

  // 활성 뱃지 UI 갱신
  document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-stone-900', 'font-semibold');
  });
  const activeBtn = document.getElementById(`theme-btn-${themeName}`);
  if (activeBtn) activeBtn.classList.add('ring-2', 'ring-stone-900', 'font-semibold');
}

function selectRadius(radiusType) {
  STATE.themeSettings.radius = radiusType;
  saveThemeSettings();
  applySavedTheme();
  showToast('카드 모서리 형태가 변경되었습니다.', 'theme');
}

function selectGridCols(cols) {
  STATE.themeSettings.gridCols = cols;
  saveThemeSettings();
  applySavedTheme();
  showToast(`${cols}열 그리드로 변경되었습니다.`, 'theme');
}

function updateBrandText(input) {
  const val = input.value.trim() || 'ATELIER NOOK';
  STATE.themeSettings.brandName = val;
  saveThemeSettings();
  applySavedTheme();
}

function updateHeroTitle(input) {
  const val = input.value.trim();
  STATE.themeSettings.heroTitle = val;
  saveThemeSettings();
  applySavedTheme();
}

function getThemeNameKR(name) {
  switch(name) {
    case 'mono': return '모던 모노크롬';
    case 'sage': return '내추럴 세이지';
    case 'midnight': return '미드나잇 럭셔리';
    case 'butter': return '코지 버터';
    default: return '웜 미니멀';
  }
}

function toggleThemePanel() {
  if (!STATE.isAdmin) return;
  const panel = document.getElementById('theme-customizer-drawer');
  const backdrop = document.getElementById('theme-backdrop');
  if (!panel) return;

  const isOpen = !panel.classList.contains('translate-x-full');
  if (isOpen) {
    panel.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
  } else {
    panel.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
  }
}

/* ==========================================================================
   쇼핑몰 핵심 기능 (카테고리, 상품, 장바구니, 위시리스트)
   ========================================================================== */

function renderCategories() {
  const container = document.getElementById('category-pills');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => `
    <button 
      onclick="setCategory('${cat.id}')"
      class="category-btn whitespace-nowrap px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
        STATE.currentCategory === cat.id 
          ? 'bg-stone-900 text-white shadow-sm' 
          : 'bg-stone-200/60 text-stone-700 hover:bg-stone-300/70'
      }"
    >
      ${cat.name}
    </button>
  `).join('');
}

function setCategory(catId) {
  STATE.currentCategory = catId;
  renderCategories();
  renderProducts();
}

function getFilteredProducts() {
  let list = [...PRODUCTS];

  if (STATE.currentCategory !== 'all') {
    list = list.filter(p => p.category === STATE.currentCategory);
  }

  if (STATE.searchQuery.trim() !== '') {
    const q = STATE.searchQuery.trim().toLowerCase();
    list = list.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.summary.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }

  if (STATE.sortBy === 'popular') {
    list.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || b.rating - a.rating);
  } else if (STATE.sortBy === 'new') {
    list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else if (STATE.sortBy === 'price-low') {
    list.sort((a, b) => a.price - b.price);
  } else if (STATE.sortBy === 'price-high') {
    list.sort((a, b) => b.price - a.price);
  }

  return list;
}

function renderProducts() {
  const container = document.getElementById('product-grid');
  const countEl = document.getElementById('product-count');
  if (!container) return;

  const products = getFilteredProducts();
  if (countEl) {
    countEl.textContent = `${products.length}개의 오브제`;
  }

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-20 text-center text-stone-400">
        <i data-lucide="search-x" class="w-12 h-12 mx-auto mb-3 opacity-60"></i>
        <p class="text-base font-medium">검색 조건에 일치하는 상품이 없습니다.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 border border-stone-300 rounded-md text-sm text-stone-700 hover:bg-stone-50">
          전체 상품 보기
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = products.map(product => {
    const isWished = STATE.wishlist.includes(product.id);
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountRate = hasDiscount ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    return `
      <div class="product-card group flex flex-col overflow-hidden border border-stone-200/70 hover:shadow-xl transition-all duration-300">
        <!-- 이미지 영역 -->
        <div class="image-container aspect-[4/5] w-full relative cursor-pointer" onclick="openQuickView(${product.id})">
          <img 
            src="${product.images[0]}" 
            alt="${product.name}" 
            loading="lazy"
            class="main-image w-full h-full object-cover"
          />
          <img 
            src="${product.images[1] || product.images[0]}" 
            alt="${product.name} alternate view" 
            loading="lazy"
            class="hover-image w-full h-full object-cover"
          />

          <!-- 뱃지 -->
          <div class="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col items-start gap-1 sm:gap-1.5 z-10">
            ${product.tag ? `<span class="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold tracking-wider uppercase rounded-full ${product.badgeColor || 'bg-stone-900 text-white'}">${product.tag}</span>` : ''}
            ${hasDiscount ? `<span class="px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-bold bg-amber-600 text-white rounded-full">${discountRate}% OFF</span>` : ''}
          </div>

          <!-- 위시리스트 버튼 -->
          <button 
            type="button"
            onclick="event.stopPropagation(); toggleWishlist(${product.id})"
            aria-label="찜하기"
            class="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${isWished ? 'text-red-500' : 'text-stone-400 hover:text-stone-700'}"
          >
            <i data-lucide="heart" class="w-4 h-4 ${isWished ? 'fill-current' : ''}"></i>
          </button>

          <!-- 호버 시 빠른 보기 / 카트 담기 오버레이 버튼 (데스크톱) -->
          <div class="absolute inset-x-3 bottom-3 hidden md:flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              type="button"
              onclick="event.stopPropagation(); openQuickView(${product.id})"
              class="flex-1 py-2.5 bg-white/95 backdrop-blur text-xs font-medium text-stone-800 rounded-lg hover:bg-stone-900 hover:text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              상세보기
            </button>
            <button 
              type="button"
              onclick="event.stopPropagation(); quickAddToCart(${product.id})"
              class="w-10 py-2.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors shadow-sm flex items-center justify-center"
              title="장바구니 담기"
            >
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- 상품 텍스트 정보 -->
        <div class="pt-2 px-0.5 sm:p-4 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center justify-between text-[11px] sm:text-xs text-stone-400 mb-0.5 sm:mb-1">
              <span class="hidden sm:inline">${product.categoryName}</span>
              <div class="flex items-center gap-1 text-amber-500">
                <i data-lucide="star" class="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current"></i>
                <span class="font-medium text-stone-600">${product.rating}</span>
                <span class="text-stone-400">(${product.reviewCount})</span>
              </div>
            </div>
            <h3 
              onclick="openQuickView(${product.id})" 
              class="font-medium text-stone-900 text-[15px] sm:text-sm md:text-base leading-snug truncate hover:text-stone-600 cursor-pointer"
            >
              ${product.name}
            </h3>
            <p class="hidden sm:block text-xs text-stone-500 line-clamp-2 mt-1.5 mb-3 leading-relaxed">
              ${product.summary}
            </p>
          </div>

          <div class="sm:pt-2 sm:border-t border-stone-100 flex items-center justify-between gap-1">
            <div class="min-w-0 leading-tight truncate">
              <span class="text-base font-bold sm:font-semibold ${hasDiscount ? 'text-amber-700 sm:text-stone-900' : 'text-stone-900'} tracking-tight">${formatPrice(product.price)}</span>
              ${hasDiscount ? `<span class="text-[11px] sm:text-xs text-stone-400 line-through ml-1 sm:ml-1.5">${formatPrice(product.originalPrice)}</span>` : ''}
            </div>
            <button 
              type="button"
              onclick="event.stopPropagation(); quickAddToCart(${product.id})"
              class="md:hidden shrink-0 p-1.5 sm:p-2 rounded-lg sm:bg-stone-100 text-stone-600 active:bg-stone-200"
              aria-label="장바구니 담기"
            >
              <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function resetFilters() {
  STATE.currentCategory = 'all';
  STATE.searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  renderCategories();
  renderProducts();
}

function toggleWishlist(productId) {
  const index = STATE.wishlist.indexOf(productId);
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (index > -1) {
    STATE.wishlist.splice(index, 1);
    showToast(`'${product.name}'을(를) 위시리스트에서 제외했습니다.`);
  } else {
    STATE.wishlist.push(productId);
    showToast(`'${product.name}'을(를) 위시리스트에 담았습니다.`, 'wish');
  }

  saveState();
  renderProducts();
}

function quickAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const defaultOption = product.options[0] || '단일상품';
  addToCart(product, defaultOption, 1);
}

function addToCart(product, option, quantity = 1) {
  const existingIndex = STATE.cart.findIndex(
    item => item.id === product.id && item.option === option
  );

  if (existingIndex > -1) {
    STATE.cart[existingIndex].quantity += quantity;
  } else {
    STATE.cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      option: option,
      quantity: quantity
    });
  }

  saveState();
  renderCart();
  openCartDrawer();
  showToast(`장바구니에 상품을 담았습니다.`, 'cart');
}

function renderCart() {
  const listContainer = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty');
  const footerEl = document.getElementById('cart-footer');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const totalEl = document.getElementById('cart-total');
  const progressText = document.getElementById('shipping-progress-text');
  const progressBar = document.getElementById('shipping-progress-bar');

  if (!listContainer) return;

  if (STATE.cart.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    footerEl.classList.add('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.innerHTML = `<strong>50,000원</strong> 이상 구매 시 무료배송`;
    return;
  }

  emptyState.classList.add('hidden');
  footerEl.classList.remove('hidden');

  listContainer.innerHTML = STATE.cart.map((item, index) => `
    <div class="flex gap-4 p-4 bg-stone-50/70 rounded-xl border border-stone-200/60">
      <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-white" />
      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-sm font-medium text-stone-900 leading-snug">${item.name}</h4>
            <button onclick="removeCartItem(${index})" class="text-stone-400 hover:text-stone-700 p-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-stone-500 mt-0.5">옵션: ${item.option}</p>
        </div>

        <div class="flex items-center justify-between mt-3">
          <div class="flex items-center border border-stone-300 rounded-md bg-white">
            <button onclick="updateCartQuantity(${index}, -1)" class="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-l-md text-xs">-</button>
            <span class="w-8 text-center text-xs font-semibold text-stone-800">${item.quantity}</span>
            <button onclick="updateCartQuantity(${index}, 1)" class="w-7 h-7 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-r-md text-xs">+</button>
          </div>
          <span class="text-sm font-semibold text-stone-900">${formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  `).join('');

  const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = isFreeShipping ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const progressPercent = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  if (progressBar) progressBar.style.width = `${progressPercent}%`;

  if (progressText) {
    if (isFreeShipping) {
      progressText.innerHTML = `🎉 축하합니다! <strong class="text-emerald-700">무료배송</strong> 혜택이 적용되었습니다.`;
    } else {
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      progressText.innerHTML = `<strong class="text-stone-900">${formatPrice(remaining)}</strong> 추가 시 <span class="text-amber-800 font-semibold">무료배송</span>`;
    }
  }

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = isFreeShipping ? '무료' : formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(total);

  lucide.createIcons();
}

function updateCartQuantity(index, delta) {
  if (!STATE.cart[index]) return;
  STATE.cart[index].quantity += delta;
  if (STATE.cart[index].quantity <= 0) {
    STATE.cart.splice(index, 1);
  }
  saveState();
  renderCart();
}

function removeCartItem(index) {
  STATE.cart.splice(index, 1);
  saveState();
  renderCart();
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.remove('pointer-events-none');
    document.getElementById('cart-backdrop').classList.remove('opacity-0');
    document.getElementById('cart-panel').classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    document.getElementById('cart-backdrop').classList.add('opacity-0');
    document.getElementById('cart-panel').classList.add('translate-x-full');
    setTimeout(() => {
      drawer.classList.add('pointer-events-none');
      document.body.style.overflow = '';
    }, 300);
  }
}

// 퀵 뷰 모달
let modalQuantity = 1;
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  STATE.quickViewProduct = product;
  STATE.selectedOption = product.options[0] || '단일상품';
  modalQuantity = 1;

  const modal = document.getElementById('quick-modal');
  const content = document.getElementById('quick-modal-content');

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-3">
        <div class="aspect-square bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
          <img id="modal-main-img" src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover transition-all duration-300" />
        </div>
        <div class="flex gap-2.5">
          ${product.images.map((img, idx) => `
            <button 
              onclick="document.getElementById('modal-main-img').src = '${img}'; this.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('ring-2', 'ring-stone-900')); this.classList.add('ring-2', 'ring-stone-900');" 
              class="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 bg-white ${idx === 0 ? 'ring-2 ring-stone-900' : ''}"
            >
              <img src="${img}" alt="thumbnail" class="w-full h-full object-cover" />
            </button>
          `).join('')}
        </div>
      </div>

      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">${product.categoryName}</span>
            ${product.tag ? `<span class="text-xs font-semibold px-2 py-0.5 rounded-full ${product.badgeColor || 'bg-stone-900 text-white'}">${product.tag}</span>` : ''}
          </div>

          <h2 class="text-2xl font-serif font-semibold text-stone-900 leading-tight mb-2">${product.name}</h2>
          
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl font-semibold text-stone-900">${formatPrice(product.price)}</span>
            ${product.originalPrice ? `<span class="text-sm text-stone-400 line-through">${formatPrice(product.originalPrice)}</span>` : ''}
            <div class="flex items-center gap-1 text-xs text-amber-500 ml-auto">
              <i data-lucide="star" class="w-4 h-4 fill-current"></i>
              <span class="font-bold text-stone-700">${product.rating}</span>
              <span class="text-stone-400">(${product.reviewCount}개 리뷰)</span>
            </div>
          </div>

          <p class="text-sm text-stone-600 leading-relaxed mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200/60">
            ${product.description}
          </p>

          <div class="space-y-1.5 text-xs text-stone-500 mb-6">
            <div class="flex"><span class="w-20 font-medium text-stone-700">소재</span><span>${product.material}</span></div>
            <div class="flex"><span class="w-20 font-medium text-stone-700">규격</span><span>${product.dimensions}</span></div>
            <div class="flex"><span class="w-20 font-medium text-stone-700">배송안내</span><span>오후 2시 이전 결제 시 당일 출고</span></div>
          </div>

          <div class="mb-5">
            <label class="block text-xs font-semibold text-stone-800 mb-2">옵션 선택</label>
            <div class="grid grid-cols-2 gap-2" id="modal-option-list">
              ${product.options.map((opt, i) => `
                <button 
                  type="button" 
                  onclick="selectModalOption('${opt}', this)" 
                  class="option-pill px-3 py-2 text-xs text-left rounded-lg border transition-all ${
                    i === 0 
                      ? 'border-stone-900 bg-stone-900 text-white font-medium' 
                      : 'border-stone-200 text-stone-700 hover:border-stone-400'
                  }"
                >
                  ${opt}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="flex items-center justify-between py-3 border-y border-stone-200 mb-6">
            <span class="text-xs font-semibold text-stone-800">주문 수량</span>
            <div class="flex items-center border border-stone-300 rounded-md bg-white">
              <button onclick="changeModalQuantity(-1)" class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-l-md text-sm">-</button>
              <span id="modal-qty-display" class="w-10 text-center text-sm font-semibold text-stone-800">1</span>
              <button onclick="changeModalQuantity(1)" class="w-8 h-8 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded-r-md text-sm">+</button>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button 
            type="button"
            onclick="toggleWishlist(${product.id})"
            class="px-4 py-3.5 border border-stone-300 rounded-xl hover:bg-stone-50 text-stone-700 flex items-center justify-center"
            title="찜하기"
          >
            <i data-lucide="heart" class="w-5 h-5 ${STATE.wishlist.includes(product.id) ? 'text-red-500 fill-current' : ''}"></i>
          </button>
          <button 
            type="button"
            onclick="addModalProductToCart()"
            class="flex-1 py-3.5 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            장바구니 담기
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function selectModalOption(option, el) {
  STATE.selectedOption = option;
  const parent = document.getElementById('modal-option-list');
  if (parent) {
    parent.querySelectorAll('button').forEach(btn => {
      btn.className = 'option-pill px-3 py-2 text-xs text-left rounded-lg border transition-all border-stone-200 text-stone-700 hover:border-stone-400';
    });
    el.className = 'option-pill px-3 py-2 text-xs text-left rounded-lg border transition-all border-stone-900 bg-stone-900 text-white font-medium';
  }
}

function changeModalQuantity(delta) {
  modalQuantity = Math.max(1, modalQuantity + delta);
  const display = document.getElementById('modal-qty-display');
  if (display) display.textContent = modalQuantity;
}

function addModalProductToCart() {
  if (!STATE.quickViewProduct) return;
  addToCart(STATE.quickViewProduct, STATE.selectedOption, modalQuantity);
  closeQuickView();
}

function closeQuickView() {
  const modal = document.getElementById('quick-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

// 주문/결제 모달
function openCheckoutModal() {
  if (STATE.cart.length === 0) return;
  closeCartDrawer();

  const modal = document.getElementById('checkout-modal');
  const summaryList = document.getElementById('checkout-summary-items');
  const totalAmountEl = document.getElementById('checkout-final-total');

  const subtotal = STATE.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  if (summaryList) {
    summaryList.innerHTML = STATE.cart.map(item => `
      <div class="flex justify-between items-center text-xs py-1.5 border-b border-stone-100">
        <span class="text-stone-700 truncate max-w-[200px]">${item.name} (${item.option}) × ${item.quantity}</span>
        <span class="font-medium text-stone-900">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  if (totalAmountEl) {
    totalAmountEl.textContent = formatPrice(total);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

function processPayment(event) {
  event.preventDefault();
  
  const submitBtn = document.getElementById('pay-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `결제 진행 중...`;
  }

  setTimeout(() => {
    STATE.cart = [];
    saveState();
    renderCart();
    closeCheckoutModal();

    const successModal = document.getElementById('success-modal');
    if (successModal) {
      successModal.classList.remove('hidden');
      successModal.classList.add('flex');
      lucide.createIcons();
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '결제하기';
    }
  }, 1000);
}

function closeSuccessModal() {
  const successModal = document.getElementById('success-modal');
  if (successModal) {
    successModal.classList.add('hidden');
    successModal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

// 위시리스트 모달
function openWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  const container = document.getElementById('wishlist-items-container');

  const wishedProducts = PRODUCTS.filter(p => STATE.wishlist.includes(p.id));

  if (wishedProducts.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-stone-400">
        <i data-lucide="heart-off" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p class="text-sm">찜한 오브제가 아직 없습니다.</p>
        <p class="text-xs text-stone-400 mt-1">마음에 드는 상품의 하트 아이콘을 눌러보세요.</p>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        ${wishedProducts.map(p => `
          <div class="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <img src="${p.images[0]}" alt="${p.name}" class="w-16 h-16 object-cover rounded-lg bg-white" />
            <div class="flex-1 min-w-0">
              <h5 class="text-xs font-medium text-stone-900 truncate">${p.name}</h5>
              <p class="text-xs font-semibold text-stone-800 mt-0.5">${formatPrice(p.price)}</p>
              <button onclick="quickAddToCart(${p.id}); closeWishlistModal();" class="mt-2 text-[11px] font-medium text-stone-900 underline hover:text-amber-800">
                장바구니 담기
              </button>
            </div>
            <button onclick="toggleWishlist(${p.id}); openWishlistModal();" class="text-stone-400 hover:text-red-500 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  lucide.createIcons();
}

function closeWishlistModal() {
  const modal = document.getElementById('wishlist-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }
}

function handleSearch(e) {
  STATE.searchQuery = e.target.value;
  renderProducts();
}

function handleSortChange(e) {
  STATE.sortBy = e.target.value;
  renderProducts();
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// 관리자 모드에서 저장한 상품 목록 불러오기 (없거나 실패하면 data.js 기본 상품 사용)
async function loadSavedProducts() {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.products)) {
      PRODUCTS = data.products;
      renderProducts();
      updateBadges();
    }
  } catch {
    // 로컬 파일로 열었거나 서버가 없을 때는 기본 상품 그대로
  }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  applySavedTheme();
  renderCategories();
  renderProducts();
  renderCart();
  updateBadges();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSortChange);
  }

  lucide.createIcons();
  loadSavedProducts();
  loadSiteSettings();
});
