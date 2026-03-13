/**
 * renderer.js — DOM 渲染
 *
 * renderPrinciples(mdText, container)
 * renderComparison(items, container)
 * getItemId(item) → string   (供 sidebar.js 使用)
 */

const TYPE_CONFIG = {
  '修改': { cls: 'type-modify' },
  '新增': { cls: 'type-add'    },
  '刪除': { cls: 'type-delete' },
  '合併': { cls: 'type-merge'  },
};

function renderPrinciples(mdText, container) {
  container.innerHTML = marked.parse(mdText);
}

function getItemId(item) {
  const o = item.oldNums.length > 0 ? item.oldNums.join('-') : 'x';
  const n = item.newNum != null ? item.newNum : 'x';
  return `item-o${o}-n${n}`;
}

function getItemTitle(item) {
  if (item.newNum != null) {
    return `第${item.newNum}條`;
  }
  return `舊規約第${item.oldNums[0]}條 → (刪除)`;
}

function renderComparisonItem(item) {
  const id    = getItemId(item);
  const title = getItemTitle(item);
  const cfg   = TYPE_CONFIG[item.type] || { cls: 'type-modify' };

  // 空欄位佔位符（JS 自動補入）
  const beforeHtml = item.before
    ? marked.parse(item.before)
    : '<em class="placeholder">（此為新增條文，無修改前內容）</em>';

  const afterHtml = item.after
    ? marked.parse(item.after)
    : '<em class="placeholder">（此條文已刪除）</em>';

  const notesHtml = item.notes ? addPrincipleTooltips(marked.parse(item.notes)) : '';

  return `
    <div class="comparison-item expanded" id="${id}">
      <div class="item-header" onclick="toggleItem('${id}')">
        <span class="item-title-group">
          <span class="item-title">${title}</span>
          <span class="type-badge ${cfg.cls}">${item.type}</span>
        </span>
        <button class="share-btn" onclick="shareItem(event, '${id}')" title="複製連結"><i data-lucide="share-2"></i></button>
        <span class="expand-icon"><i data-lucide="chevron-right"></i></span>
      </div>
      <div class="item-body">
        <div class="columns">
          <div class="col col-after">
            <div class="col-header">新條文</div>
            <div class="col-content">${afterHtml}</div>
          </div>
          <div class="col col-before">
            <div class="col-header">舊條文</div>
            <div class="col-content">${beforeHtml}</div>
          </div>
          <div class="col col-notes">
            <div class="col-header">備註/原則</div>
            <div class="col-content">${notesHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComparison(items, container) {
  container.innerHTML = items.map(renderComparisonItem).join('');
}

function addPrincipleTooltips(html) {
  // 比對「套用原則 1」「原則1、4」「原則 1,4」等格式
  return html.replace(
    /原則\s*([\d][、,，\d\s]*)/g,
    (match, nums) => {
      const numList = nums.match(/\d+/g) || [];
      return `<span class="principle-ref" data-principles="${numList.join(',')}">${match}</span>`;
    }
  );
}
