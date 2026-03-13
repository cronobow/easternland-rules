/**
 * parser.js — 解析 comparison.md 與 principles.md
 *
 * parseComparison(mdText) → Array<ComparisonItem>
 *   ComparisonItem: {
 *     oldNums: number[],   // 空陣列表示新增
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

function parseComparison(mdText) {
  // 以獨立一行的 --- 切分（前後空行）
  const blocks = mdText
    .split(/\n---\n/)
    .filter(s => s.trim());

  return blocks.map((block, index) => {
    const headerMatch = block.match(/##\s*\[舊:([^\]]+)\]\[新:([^\]]+)\]\s*(.+)/);
    if (!headerMatch) {
      console.warn(`[parser] Block ${index}: 無法解析標頭，已跳過`);
      return null;
    }

    const [, rawOld, rawNew, rawType] = headerMatch;

    const isDashOld = /^[—–\-\s]+$/.test(rawOld.trim());
    const isDashNew = /^[—–\-\s]+$/.test(rawNew.trim());

    const oldNums = isDashOld
      ? []
      : rawOld.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

    const newNum = isDashNew ? null : parseInt(rawNew.trim()) || null;

    // 解析三個區塊（修改前、修改後、備註/原則）
    // 使用 (?=\n\*\*|\s*$) 做 lookahead 避免貪婪吃掉下一欄
    const beforeMatch = block.match(/\*\*修改前\*\*\n([\s\S]*?)(?=\n\*\*修改後\*\*|\n\*\*備註|\s*$)/);
    const afterMatch  = block.match(/\*\*修改後\*\*\n([\s\S]*?)(?=\n\*\*修改前\*\*|\n\*\*備註|\s*$)/);
    const notesMatch  = block.match(/\*\*備註\/原則\*\*\n([\s\S]*?)(?=\n\*\*修改前\*\*|\n\*\*修改後\*\*|\s*$)/);

    return {
      oldNums,
      newNum,
      type: rawType.trim(),
      before: beforeMatch ? beforeMatch[1].trim() : null,
      after:  afterMatch  ? afterMatch[1].trim()  : null,
      notes:  notesMatch  ? notesMatch[1].trim()  : null,
    };
  }).filter(Boolean);
}

function sortItems(items, sortBy) {
  const getKey = (item) => {
    if (sortBy === 'new') return item.newNum  ?? Infinity;
    return item.oldNums.length > 0 ? item.oldNums[0] : Infinity;
  };
  return [...items].sort((a, b) => getKey(a) - getKey(b));
}
