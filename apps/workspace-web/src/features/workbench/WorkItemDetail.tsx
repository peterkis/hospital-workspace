import { useEffect, useRef } from "react";
import type { WorkbenchItem } from "./workbench-model";

export function WorkItemDetail({ item, favorite, onClose, onThread, onToggleFavorite }: { item: WorkbenchItem; favorite: boolean; onClose: () => void; onThread: (threadId: string) => void; onToggleFavorite: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [item.id]);
  return <section aria-label="事项详情" className="wb-detail" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}><button className="wb-secondary" onClick={onClose} type="button">关闭详情</button><button aria-pressed={favorite} className="wb-secondary" onClick={onToggleFavorite} type="button">{favorite ? "取消收藏事项" : "收藏事项"}</button><p className="wb-kicker">只读合成预览</p><h2 ref={heading} tabIndex={-1}>{item.title}</h2><p>{item.description}</p><dl><dt>具体状态</dt><dd>{item.statusLabel}</dd><dt>演示参与者</dt><dd>{item.participants}</dd><dt>来源</dt><dd>{item.source}</dd></dl><p>此处只读，不执行业务状态变更。活动与背景请进入既有讨论查看；固定样例没有实际后端事件。</p>{item.threadId && <button className="wb-secondary" onClick={() => { if (item.threadId) onThread(item.threadId); }} type="button">进入既有讨论与时间线</button>}</section>;
}
