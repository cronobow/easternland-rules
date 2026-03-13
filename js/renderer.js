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
  const oldStr = item.oldNums.length > 0
    ? `舊第${item.oldNums.join('、')}條`
    : '（無）';
  const newStr = item.newNum != null
    ? `新第${item.newNum}條`
    : '（刪除）';
  return `${oldStr} → ${newStr}`;
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

  const notesHtml = item.notes ? marked.parse(item.notes) : '';

  return `
    <div class="comparison-item" id="${id}">
      <div class="item-header" onclick="toggleItem('${id}')">
        <span class="item-title">${title}</span>
        <span class="type-badge ${cfg.cls}">${item.type}</span>
        <span class="expand-icon">▶</span>
      </div>
      <div class="item-body" hidden>
        <div class="columns">
          <div class="col col-before">
            <div class="col-header">修改前</div>
            <div class="col-content">${beforeHtml}</div>
          </div>
          <div class="col col-after">
            <div class="col-header">修改後</div>
            <div class="col-content">${afterHtml}</div>
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
