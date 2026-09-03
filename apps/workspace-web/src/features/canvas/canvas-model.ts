/** Fixed local Canvas route identifiers. They are not browser routes or deep links. */
export const REGISTERED_CANVAS_ROUTES = ["work-item-detail", "decision-context", "agent-run-detail", "knowledge-reference"] as const;
export type PrototypeCanvasRoute = (typeof REGISTERED_CANVAS_ROUTES)[number];
