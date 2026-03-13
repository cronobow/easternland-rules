/**
 * parser.js — 解析 comparison.md 與 principles.md
 *
 * parseComparison(mdText) → Array<ComparisonItem>
 *   ComparisonItem: {
 *     oldCodes: string[],  // 空陣列表示新增，例如 ['A-2-3','A-2-4'] 或 ['C-1-12']
 *     newNum: number|null, // null 表示刪除
 *     type: string,        // '修改'|'新增'|'刪除'|'合併'
 *     before: string|null,
 *     after: string|null,
 *     notes: string|null,
 *   }
 *
 * sortItems(items, sortBy) → Array<ComparisonItem>
 *   sortBy: 'new' | 'old'
 */

/**
 * 將 A-1-1 格式的舊條號轉換成可排序的數值
 * A=1, B=2, C=3；A-2-3 → 1_002_003 → 1002003
 */
function oldCodeSortKey(code) {
  const m = code.match(/^([A-Z])-(\d+)-(\d+)$/);
  if (m) {
    const ch = m[1].charCodeAt(0) - 64; // A→1, B→2, C→3
    return ch * 100000 + parseInt(m[2]) * 1000 + parseInt(m[3]);
  }
  // 純數字格式（向下相容）
  const n = parseInt(code);
  return isNaN(n) ? Infinity : n;
}

function parseComparison(mdText) {
  // 以獨立一行的 --- 切分（前後空行）
  const blocks = mdText
    .split(/\n---\n/)
    .filter(s => s.trim());

  return blocks.map((block, index) => {
    // 跳過 HTML 註解區塊
    if (block.trimStart().startsWith('<!--')) return null;

    const headerMatch = block.match(/##\s*\[舊:([^\]]+)\]\[新:([^\]]+)\]\s*(.+)/);
    if (!headerMatch) {
      // 非條文區塊（如檔案說明、標題）靜默略過
      if (block.includes('[舊:') || block.includes('[新:')) {
        console.warn(`[parser] Block ${index}: 無法解析標頭，已跳過`);
      }
      return null;
    }

    const [, rawOld, rawNew, rawType] = headerMatch;

    const isDashOld = /^[—–\-\s]+$/.test(rawOld.trim());
    const isDashNew = /^[—–\-\s]+$/.test(rawNew.trim());

    // 支援 A-1-1 格式與純數字格式
    const oldCodes = isDashOld
      ? []
      : rawOld.split(',').map(s => s.trim()).filter(Boolean);

    const newNum = isDashNew ? null : parseInt(rawNew.trim()) || null;

    // 解析三個區塊（修改前、修改後、備註/原則）
    // 使用 (?=\n\*\*|\s*$) 做 lookahead 避免貪婪吃掉下一欄
    const beforeMatch = block.match(/\*\*修改前\*\*\n([\s\S]*?)(?=\n\*\*修改後\*\*|\n\*\*備註|\s*$)/);
    const afterMatch  = block.match(/\*\*修改後\*\*\n([\s\S]*?)(?=\n\*\*修改前\*\*|\n\*\*備註|\s*$)/);
    const notesMatch  = block.match(/\*\*備註\/原則\*\*\n([\s\S]*?)(?=\n\*\*修改前\*\*|\n\*\*修改後\*\*|\s*$)/);

    return {
      oldCodes,
      newNum,
      type: rawType.trim(),
      before: beforeMatch ? beforeMatch[1].trim() : null,
      after:  afterMatch  ? afterMatch[1].trim()  : null,
      notes:  notesMatch  ? notesMatch[1].trim()  : null,
    };
  }).filter(Boolean);
}

function parsePrinciples(mdText) {
  const map = {};
  const re = /###\s*(\d+)\.\s*(.+)\n([\s\S]*?)(?=\n###|\n##|$)/g;
  let m;
  while ((m = re.exec(mdText)) !== null) {
    map[parseInt(m[1])] = { title: m[2].trim(), body: m[3].trim() };
  }
  return map;
}

function sortItems(items, sortBy) {
  const getKey = (item) => {
    if (sortBy === 'new') return item.newNum ?? Infinity;
    return item.oldCodes.length > 0 ? oldCodeSortKey(item.oldCodes[0]) : Infinity;
  };
  return [...items].sort((a, b) => getKey(a) - getKey(b));
}
