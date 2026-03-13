/**
 * sidebar.js — 側邊欄 TOC、目錄摺疊、IntersectionObserver 高亮
 *
 * buildTOC(items, tocContainer)
 * setupSidebarToggle()
 * setupIntersectionObserver() → IntersectionObserver
 * setupMobileToggle()
 */

function getArticleTitle(item) {
  const content = item.after || item.before || '';
  const firstLine = content.split('\n')[0].trim();
  // 移除「第X條」開頭，只留標題部分；若無標題則 fallback
  const titleMatch = firstLine.match(/第[^條]+條\s+(.+)/);
  return titleMatch ? titleMatch[1].trim() : firstLine;
}

function buildTOC(items, tocContainer) {
  tocContainer.innerHTML = items.map(item => {
    const id = getItemId(item);
    const displayNum = item.newNum != null ? item.newNum : (item.oldCodes[0] ?? '?');
    const articleTitle = getArticleTitle(item);
    const displayText = item.newNum != null
      ? `第${item.newNum}條　${articleTitle}`
      : `${item.oldCodes[0] ?? '舊條文'} → (刪除)`;

    return `
      <div class="toc-item" data-target="${id}" onclick="jumpToItem('${id}')">
        <span class="toc-num">${displayNum}</span>
        <span class="toc-text">${displayText}</span>
      </div>
    `;
  }).join('');
}

function setupSidebarToggle() {
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
}

function setupIntersectionObserver() {
  const container = document.querySelector('.comparison-main');
  let currentHighlight = null;

  function updateActive() {
    const containerTop = container.getBoundingClientRect().top;
    const headerHeight = document.querySelector('.comparison-header')?.offsetHeight ?? 0;
    const threshold = containerTop + headerHeight;
    const items = document.querySelectorAll('.comparison-item');
    let activeItem = null;

    for (const item of items) {
      // 條文上格線碰到 comparison-header 下格線時切換
      if (item.getBoundingClientRect().top <= threshold + 2) {
        activeItem = item;
      }
    }

    const activeId = activeItem ? activeItem.id : (items[0] ? items[0].id : null);
    if (!activeId || activeId === currentHighlight) return;

    currentHighlight = activeId;
    document.querySelectorAll('.toc-item').forEach(el => {
      el.classList.toggle('active', el.dataset.target === activeId);
    });
    const activeToc = document.querySelector(`.toc-item[data-target="${activeId}"]`);
    if (activeToc) activeToc.scrollIntoView({ block: 'nearest' });
  }

  container.addEventListener('scroll', updateActive);
  updateActive();

  return { disconnect: () => container.removeEventListener('scroll', updateActive) };
}

function setupMobileToggle() {
  const fab     = document.getElementById('mobile-toc-btn');
  const sidebar = document.getElementById('sidebar');
  if (!fab) return;

  fab.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // 點擊遮罩（非 sidebar 區域）關閉
  document.addEventListener('click', (e) => {
    if (
      window.innerWidth < 768 &&
      !sidebar.contains(e.target) &&
      e.target !== fab
    ) {
      sidebar.classList.remove('mobile-open');
    }
  });
}
