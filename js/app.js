/**
 * app.js — 主進入點
 * 協調 fetch、初始渲染、排序切換、全域 DOM 函式
 */

// 全域 DOM 互動函式（從 HTML onclick 呼叫）
function toggleItem(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const body = item.querySelector('.item-body');
  const icon = item.querySelector('.expand-icon');
  const willExpand = body.hidden;
  body.hidden = !willExpand;
  icon.textContent = willExpand ? '▼' : '▶';
}

function jumpToItem(id) {
  const item = document.getElementById(id);
  if (!item) return;
  // 展開
  const body = item.querySelector('.item-body');
  const icon = item.querySelector('.expand-icon');
  body.hidden = false;
  icon.textContent = '▼';
  // 捲動
  item.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // 手機版關閉側邊欄
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

  const state = {
    items: [],
    sortBy: 'new',
    observer: null,
  };

  const principlesContainer = document.getElementById('principles-content');
  const comparisonContainer = document.getElementById('comparison-list');
  const tocContainer        = document.getElementById('toc-list');
  const sortToggle          = document.getElementById('sort-toggle');

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

  // 渲染修改原則
  if (principlesResult.status === 'fulfilled') {
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
    sortToggle.textContent = state.sortBy === 'new'
      ? '目前：新規約排序（點擊切換）'
      : '目前：舊規約排序（點擊切換）';
  }

  if (comparisonResult.status === 'fulfilled') {
    state.items = parseComparison(comparisonResult.value);
    applySort();
  } else {
    comparisonContainer.innerHTML =
      '<div class="load-error">資料載入失敗，請重新整理頁面</div>';
    console.error('[app] comparison.md 載入失敗:', comparisonResult.reason);
  }

  // 排序切換
  sortToggle.addEventListener('click', () => {
    state.sortBy = state.sortBy === 'new' ? 'old' : 'new';
    applySort();
  });

  // 初始化側邊欄
  setupSidebarToggle();
  setupMobileToggle();
}

document.addEventListener('DOMContentLoaded', init);
