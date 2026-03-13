/**
 * app.js — 主進入點
 * 協調 fetch、初始渲染、排序切換、全域 DOM 函式
 */

// Toast 通知
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// 全域 DOM 互動函式（從 HTML onclick 呼叫）
function expandAll() {
  document.querySelectorAll('.comparison-item').forEach(el => {
    el.querySelector('.item-body').hidden = false;
    el.classList.add('expanded');
  });
}

function collapseAll() {
  document.querySelectorAll('.comparison-item').forEach(el => {
    el.querySelector('.item-body').hidden = true;
    el.classList.remove('expanded');
  });
}

function shareItem(event, id) {
  event.stopPropagation();
  const url = location.origin + location.pathname + '#' + id;
  navigator.clipboard.writeText(url)
    .then(() => showToast('連結已複製！'))
    .catch(() => showToast('複製失敗，請手動複製網址'));
}

function toggleItem(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const body = item.querySelector('.item-body');
  const willExpand = body.hidden;
  body.hidden = !willExpand;
  item.classList.toggle('expanded', willExpand);
}

function jumpToItem(id) {
  const item = document.getElementById(id);
  if (!item) return;
  item.querySelector('.item-body').hidden = false;
  item.classList.add('expanded');

  const container = document.querySelector('.comparison-main');
  const headerHeight = document.querySelector('.comparison-header')?.offsetHeight ?? 0;
  const itemTop = item.getBoundingClientRect().top;
  const containerTop = container.getBoundingClientRect().top;
  container.scrollBy({ top: itemTop - containerTop - headerHeight, behavior: 'smooth' });

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
}

// 主程式
async function init() {
  // CDN 檢查
  if (typeof marked === 'undefined') {
    document.body.innerHTML =
      '<div class="fatal-error">頁面資源載入失敗，請檢查網路後重新整理</div>';
    return;
  }

  marked.use({ breaks: true });

  const state = {
    items: [],
    sortBy: 'new',
    observer: null,
  };

  const principlesContainer = document.getElementById('principles-content');
  const comparisonContainer = document.getElementById('comparison-list');
  const tocContainer        = document.getElementById('toc-list');
  const sortBtns            = document.querySelectorAll('.sort-btn');

  // 同時 fetch 兩個 MD 檔案
  const [principlesResult, comparisonResult] = await Promise.allSettled([
    fetch('./data/principles.md').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    }),
    fetch('./data/comparison.md').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    }),
  ]);

  // 解析原則並建立 tooltip
  window.principlesMap = {};
  if (principlesResult.status === 'fulfilled') {
    window.principlesMap = parsePrinciples(principlesResult.value);
    renderPrinciples(principlesResult.value, principlesContainer);
  } else {
    principlesContainer.innerHTML =
      '<div class="load-error">資料載入失敗，請重新整理頁面</div>';
    console.error('[app] principles.md 載入失敗:', principlesResult.reason);
  }

  // 渲染條列比較
  function applySort() {
    const sorted = sortItems(state.items, state.sortBy);
    renderComparison(sorted, comparisonContainer);
    buildTOC(sorted, tocContainer);
    if (state.observer) state.observer.disconnect();
    state.observer = setupIntersectionObserver();
    sortBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === state.sortBy));
    lucide.createIcons();
  }

  if (comparisonResult.status === 'fulfilled') {
    state.items = parseComparison(comparisonResult.value);
    applySort();
    // 處理分享連結 hash
    const hash = location.hash.slice(1);
    if (hash) {
      document.querySelectorAll('.comparison-item').forEach(el => {
        const isTarget = el.id === hash;
        el.querySelector('.item-body').hidden = !isTarget;
        el.classList.toggle('expanded', isTarget);
      });
      const target = document.getElementById(hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  } else {
    comparisonContainer.innerHTML =
      '<div class="load-error">資料載入失敗，請重新整理頁面</div>';
    console.error('[app] comparison.md 載入失敗:', comparisonResult.reason);
  }

  // 排序切換
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.sortBy = btn.dataset.sort;
      applySort();
    });
  });

  // 初始化側邊欄
  setupSidebarToggle();
  setupMobileToggle();
  lucide.createIcons();

  // Tooltip for 原則 refs
  const tooltip = document.createElement('div');
  tooltip.className = 'principle-tooltip';
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  document.addEventListener('mouseover', (e) => {
    const ref = e.target.closest('.principle-ref');
    if (!ref) { tooltip.hidden = true; return; }
    const nums = ref.dataset.principles.split(',').map(Number);
    tooltip.innerHTML = nums.map(n => {
      const p = window.principlesMap[n];
      return p ? `<strong>原則${n}：${p.title}</strong>${p.body}` : '';
    }).filter(Boolean).join('<hr>');
    tooltip.hidden = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (tooltip.hidden) return;
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    const rect = tooltip.getBoundingClientRect();
    tooltip.style.left = (x + rect.width > window.innerWidth ? e.clientX - rect.width - 8 : x) + 'px';
    tooltip.style.top  = (y + rect.height > window.innerHeight ? e.clientY - rect.height - 8 : y) + 'px';
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.principle-ref') && !e.relatedTarget?.closest('.principle-ref')) {
      tooltip.hidden = true;
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
