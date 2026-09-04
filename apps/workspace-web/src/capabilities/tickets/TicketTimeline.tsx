import { ActivityTimeline } from "../../features/timeline/ActivityTimeline";
import type { SyntheticTicket, SyntheticTicketReceipt } from "./ticket-model";
import { ticketTimelineActivities } from "./ticket-projection";

/** Browser-only, public-synthetic, noncanonical, non-authoritative Timeline projection. */
export function TicketTimeline({ ticket, receiptLedger }: { ticket: SyntheticTicket; receiptLedger: readonly SyntheticTicketReceipt[] }) {
  return <section aria-label="Ticket Timeline" className="ticket-timeline"><h3>Ticket Timeline <small>固定 Asia/Shanghai 演示记录</small></h3><ActivityTimeline activities={ticketTimelineActivities(ticket, receiptLedger)} receipts={{}} onOpenCanvas={() => {}} onSubmit={() => {}} onRefreshConflict={() => {}} /></section>;
}
