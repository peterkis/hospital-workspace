import type { PrototypeThread } from "./thread-model";
import "./threads.css";

function statusText(thread: PrototypeThread) {
  return thread.projectedDisplayStatus === "in-progress" ? "进行中（演示）" : thread.projectedDisplayStatus === "review" ? "等待评审（演示）" : "已就绪（演示）";
}

export function ThreadSelector({ threads, selectedThreadId, onSelect }: { threads: readonly PrototypeThread[]; selectedThreadId: string | null; onSelect: (threadId: string) => void }) {
  return <div aria-label="演示线程列表" className="thread-strip">{threads.map((thread) => <button aria-pressed={thread.id === selectedThreadId} className={thread.id === selectedThreadId ? "thread-tab selected" : "thread-tab"} key={thread.id} onClick={() => onSelect(thread.id)} type="button"><span>{thread.title}</span><small>{statusText(thread)}</small></button>)}</div>;
}

export { statusText };
