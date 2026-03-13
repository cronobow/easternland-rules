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
    const firstLine = (item.after || item.before || '').split('\n')[0].trim();
    const displayText = firstLine || (item.newNum != null
      ? `第${item.newNum}條`
      : `舊規約${item.oldCodes[0] ?? '（未知）'}`);

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
  const backdrop  = document.getElementById('sidebar-backdrop');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (window.innerWidth < 768) {
      // 手機版：收起即關閉 overlay
      sidebar.classList.remove('mobile-open');
      if (backdrop) backdrop.classList.remove('visible');
    } else {
      sidebar.classList.toggle('collapsed');
    }
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
  const fab      = document.getElementById('mobile-toc-btn');
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!fab) return;

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('visible');
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('visible');
  }

  fab.addEventListener('click', () => {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  });

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // 點擊目錄項目後自動關閉（手機版）
  document.getElementById('toc-list')?.addEventListener('click', () => {
    if (window.innerWidth < 768) closeSidebar();
  });
}
