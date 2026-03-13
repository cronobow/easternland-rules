/**
 * sidebar.js — 側邊欄 TOC、目錄摺疊、IntersectionObserver 高亮
 *
 * buildTOC(items, tocContainer)
 * setupSidebarToggle()
 * setupIntersectionObserver() → IntersectionObserver
 * setupMobileToggle()
 */

function buildTOC(items, tocContainer) {
  tocContainer.innerHTML = items.map(item => {
    const id = getItemId(item);
    // 顯示新條號（優先），否則顯示第一個舊條號
    const displayNum = item.newNum != null ? item.newNum : (item.oldNums[0] ?? '?');
    const displayText = item.newNum != null
      ? `新第${item.newNum}條`
      : `舊第${item.oldNums[0]}條（刪除）`;

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
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
  });
}

function setupIntersectionObserver() {
  let currentHighlight = null;

  const observer = new IntersectionObserver((entries) => {
    // 收集所有正在 intersecting 的項目，取最靠近頂部的
    const visibleEntries = [];

    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        visibleEntries.push(entry);
      }
    });

    if (visibleEntries.length === 0) return;

    // 排序：依 boundingClientRect.top（最靠近 viewport 頂部）
    visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    const topId = visibleEntries[0].target.id;

    if (topId !== currentHighlight) {
      currentHighlight = topId;
      document.querySelectorAll('.toc-item').forEach(el => {
        el.classList.toggle('active', el.dataset.target === topId);
      });
      // 把高亮項目捲動到目錄可見區域
      const activeToc = document.querySelector(`.toc-item[data-target="${topId}"]`);
      if (activeToc) {
        activeToc.scrollIntoView({ block: 'nearest' });
      }
    }
  }, { threshold: 0.5 });

  document.querySelectorAll('.comparison-item').forEach(el => observer.observe(el));
  return observer;
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
