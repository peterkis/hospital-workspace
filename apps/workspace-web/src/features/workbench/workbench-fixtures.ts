import type { WorkbenchItem } from "./workbench-model";

/** Read-only layout sample, never a Ticket aggregate or server event. */
export const readonlyWorkbenchSamples: readonly WorkbenchItem[] = [{
  id: "demo-workbench-archive-001", threadId: null, spaceId: "demo-space-it-support",
  title: "演示协作指引整理", description: "用于评估已关闭分组的固定只读样例，没有实际发生的后端事件。",
  statusLabel: "已关闭（固定样例）", group: "已关闭", participants: "Demo Coordinator", mine: false,
  source: "demo-workbench-layout-fixture-001", ticket: false,
}];
