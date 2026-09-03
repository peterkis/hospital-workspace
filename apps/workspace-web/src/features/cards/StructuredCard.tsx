import type { PrototypeCardEnvelope } from "./card-model";
import { registeredCardRenderer } from "./card-registry";
import "./cards.css";

export function StructuredCard({ card, onOpenCanvas, onSubmit, receiptStatus, onRefreshConflict }: {
  card: PrototypeCardEnvelope;
  onOpenCanvas: (route: string, trigger: HTMLButtonElement) => void;
  onSubmit: (actionId: string) => void;
  receiptStatus: (actionId: string) => "ready" | "pending" | "accepted" | "rejected" | "conflict";
  onRefreshConflict: (actionId: string) => void;
}) {
  const Renderer = registeredCardRenderer(card);
  if (!Renderer) return <section aria-label="Unsupported synthetic card" className="structured-card unsupported"><p className="card-kicker">只读安全回退</p><h4>{card.title}</h4><p>Unsupported synthetic card。类型 {card.cardType}，版本 {card.cardVersion} 尚未注册，不能提供命令或导航。</p></section>;
  return <section className="structured-card"><p className="card-kicker">结构化卡片 · public-synthetic</p><h4>{card.title}</h4><Renderer card={card} onOpenCanvas={onOpenCanvas} onRefreshConflict={onRefreshConflict} onSubmit={onSubmit} receiptStatus={receiptStatus} />{card.canvasRoute && <button className="card-detail" onClick={(event) => onOpenCanvas(card.canvasRoute!, event.currentTarget)} type="button">查看已注册详情</button>}</section>;
}
