import { spaceLabel, type WorkbenchItem } from "./workbench-model";
import type { WorkspaceSpace } from "../../fixtures/workspace-fixtures";

export function WorkItemList({ items, spaces, onSelect }: { items: readonly WorkbenchItem[]; spaces: readonly WorkspaceSpace[]; onSelect: (item: WorkbenchItem, trigger: HTMLButtonElement) => void }) {
  return <section aria-label="事项列表" className="wb-list">{items.map((item) => <button className="wb-list-row" id={`wb-list-${item.id}`} key={item.id} onClick={(event) => onSelect(item, event.currentTarget)} type="button"><span><strong>{item.title}</strong><small>{item.description}</small></span><span>{item.statusLabel}</span><span>{spaceLabel(spaces.find((space) => space.id === item.spaceId)?.label ?? "合成空间")}</span><small>{item.participants}</small></button>)}</section>;
}
