import type { SyntheticTicketPersona } from "./ticket-model";

const personas: readonly { id: SyntheticTicketPersona; label: string; note: string }[] = [
  { id: "reporter", label: "Synthetic Reporter", note: "可提交、确认关闭或重新打开演示状态" },
  { id: "engineer", label: "Demo IT Engineer", note: "可分诊、分派、接受、开始处理或解决演示状态" },
];

/** Browser-only, public-synthetic, noncanonical, non-authoritative persona selector. */
export function TicketPersonaSwitcher({ persona, onChange }: { persona: SyntheticTicketPersona; onChange: (persona: SyntheticTicketPersona) => void }) {
  return <fieldset className="ticket-persona-switcher"><legend>演示角色</legend><p id="ticket-persona-help">这是呈现视角，不代表登录、身份或真实授权。</p><div aria-describedby="ticket-persona-help" aria-label="演示角色" className="ticket-persona-options">{personas.map((entry) => <button aria-pressed={persona === entry.id} className={persona === entry.id ? "ticket-persona selected" : "ticket-persona"} key={entry.id} onClick={() => onChange(entry.id)} type="button"><strong>{entry.label}</strong><span className="sr-only">{entry.note}</span></button>)}</div></fieldset>;
}
