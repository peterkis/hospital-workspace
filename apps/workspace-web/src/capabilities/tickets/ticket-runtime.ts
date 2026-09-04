import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { SYNTHETIC_RECEIPT_DELAY_MS } from "../../features/cards/card-runtime";
import { slaForSyntheticTicketStatus, SYNTHETIC_ENGINEER } from "./ticket-fixtures";
import type { SyntheticTicket, SyntheticTicketCommand, SyntheticTicketCommandType, SyntheticTicketPersona, SyntheticTicketReceipt } from "./ticket-model";
import { participantsForTicket } from "./ticket-projection";
import { nextTransitionFor, transitionFor } from "./ticket-transition-table";

export const SYNTHETIC_TICKET_RECEIPT_DELAY_MS = SYNTHETIC_RECEIPT_DELAY_MS;

/** Browser-only, public-synthetic, noncanonical, non-authoritative reducer state. */
export interface SyntheticTicketRuntimeState {
  ticket: SyntheticTicket;
  receiptLedger: readonly SyntheticTicketReceipt[];
  pendingCommand: SyntheticTicketCommand | null;
  visibleReceiptCommandId: SyntheticTicketCommand["commandId"] | null;
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative reducer input. */
type TicketRuntimeEvent =
  | { type: "queue"; command: SyntheticTicketCommand }
  | { type: "settle"; commandId: SyntheticTicketCommand["commandId"] }
  | { type: "clear-receipt" }
  | { type: "cancel-pending" }
  | { type: "reset"; ticket: SyntheticTicket };

function receiptFor(command: SyntheticTicketCommand, ticket: SyntheticTicket, state: SyntheticTicketReceipt["state"], reason: string, resultingStatus?: SyntheticTicketReceipt["resultingStatus"]): SyntheticTicketReceipt {
  return { commandId: command.commandId, idempotencyKey: command.idempotencyKey, expectedVersion: command.expectedVersion, observedVersion: ticket.version, state, reason, resultingStatus, actor: command.actor, recordedAt: command.issuedAt, priorStatus: ticket.status };
}

function receiptAlreadyRecorded(state: SyntheticTicketRuntimeState, command: SyntheticTicketCommand) {
  return state.receiptLedger.some((receipt) => receipt.commandId === command.commandId || receipt.idempotencyKey === command.idempotencyKey);
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative pure state reducer. */
export function syntheticTicketReducer(state: SyntheticTicketRuntimeState, event: TicketRuntimeEvent): SyntheticTicketRuntimeState {
  if (event.type === "reset") return { ticket: event.ticket, receiptLedger: [], pendingCommand: null, visibleReceiptCommandId: null };
  if (event.type === "clear-receipt") return { ...state, visibleReceiptCommandId: null };
  if (event.type === "cancel-pending") {
    if (!state.pendingCommand) return state;
    const receipt = receiptFor(state.pendingCommand, state.ticket, "rejected", "本地演示上下文已切换，未应用待处理命令。");
    const pendingIndex = state.receiptLedger.findIndex((entry) => entry.commandId === state.pendingCommand?.commandId);
    return { ...state, pendingCommand: null, receiptLedger: state.receiptLedger.map((entry, index) => index === pendingIndex ? receipt : entry) };
  }
  if (event.type === "queue") {
    if (state.pendingCommand || receiptAlreadyRecorded(state, event.command)) return state;
    return { ...state, pendingCommand: { ...event.command }, visibleReceiptCommandId: event.command.commandId, receiptLedger: [...state.receiptLedger, receiptFor(event.command, state.ticket, "pending", "正在等待本地合成回执。")] };
  }
  if (!state.pendingCommand || state.pendingCommand.commandId !== event.commandId) return state;
  const command = state.pendingCommand;
  const pendingIndex = state.receiptLedger.findIndex((receipt) => receipt.commandId === command.commandId);
  const finish = (receipt: SyntheticTicketReceipt, ticket = state.ticket): SyntheticTicketRuntimeState => ({ ...state, ticket, pendingCommand: null, visibleReceiptCommandId: command.commandId, receiptLedger: state.receiptLedger.map((entry, index) => index === pendingIndex ? receipt : entry) });
  if (command.expectedVersion !== state.ticket.version) return finish(receiptFor(command, state.ticket, "conflict", `版本不匹配：期望 ${command.expectedVersion}，当前为 ${state.ticket.version}。`));
  const transition = transitionFor(state.ticket.status, command.commandType, command.actor);
  if (!transition) return finish(receiptFor(command, state.ticket, "rejected", "当前演示角色或生命周期状态不能执行这个本地动作。"));
  const nextVersion = state.ticket.version + 1;
  const ticketWithTransition: SyntheticTicket = {
    ...state.ticket,
    status: transition.to,
    version: nextVersion,
    assignedEngineer: transition.to === "assigned" ? { ...SYNTHETIC_ENGINEER } : state.ticket.assignedEngineer,
    sla: slaForSyntheticTicketStatus(transition.to),
    lastUpdated: transition.recordedAt,
  };
  const nextTicket: SyntheticTicket = {
    ...ticketWithTransition,
    participants: participantsForTicket(ticketWithTransition),
    events: [...state.ticket.events, { eventId: `demo-ticket-event-${transition.to}`, eventType: `ticket.${transition.commandType}`, ticketId: state.ticket.id, actor: command.actor, priorStatus: transition.from, resultingStatus: transition.to, resultingVersion: nextVersion, recordedAt: transition.recordedAt, sourceKind: "synthetic-command", sourceId: command.commandId, detail: `${transition.detail} ${ticketWithTransition.sla.presentationState}` }],
  };
  return finish(receiptFor(command, state.ticket, "accepted", "合成命令回执已接受；状态仅存在于浏览器运行时。", transition.to), nextTicket);
}

export function createSyntheticTicketCommand(ticket: SyntheticTicket, commandType: SyntheticTicketCommandType, actor: SyntheticTicketPersona, expectedVersion = ticket.version, attempt = 1): SyntheticTicketCommand {
  return { commandType, commandId: `demo-ticket-command-${commandType}-v${expectedVersion}-a${attempt}`, idempotencyKey: `demo-ticket-idempotency-${commandType}-v${expectedVersion}-a${attempt}`, expectedVersion, actor, issuedAt: nextTransitionFor(ticket.status)?.recordedAt ?? "2026-09-04 09:15" } as SyntheticTicketCommand;
}

/** Browser-only, public-synthetic, noncanonical, non-authoritative Ticket controller with cancellable local receipt settlement. */
export function useSyntheticTicketRuntime(initialTicket: SyntheticTicket, resetKey: string, cancellationKey: string) {
  const [state, dispatch] = useReducer(syntheticTicketReducer, initialTicket, (ticket) => ({ ticket, receiptLedger: [], pendingCommand: null, visibleReceiptCommandId: null }));
  const [persona, setPersona] = useState<SyntheticTicketPersona>("reporter");
  const generation = `${resetKey}:${cancellationKey}`;
  const cancellationRef = useRef(generation);
  cancellationRef.current = generation;
  useEffect(() => { dispatch({ type: "reset", ticket: initialTicket }); setPersona("reporter"); }, [initialTicket, resetKey]);
  useEffect(() => { dispatch({ type: "cancel-pending" }); }, [cancellationKey]);
  useEffect(() => {
    const command = state.pendingCommand;
    if (!command) return undefined;
    const scheduledFor = generation;
    const timer = window.setTimeout(() => {
      if (cancellationRef.current === scheduledFor) dispatch({ type: "settle", commandId: command.commandId });
    }, SYNTHETIC_TICKET_RECEIPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [generation, state.pendingCommand]);
  const submit = useCallback((command: SyntheticTicketCommand) => dispatch({ type: "queue", command }), []);
  const clearReceipt = useCallback(() => dispatch({ type: "clear-receipt" }), []);
  return { ...state, persona, setPersona, currentReceipt: state.visibleReceiptCommandId ? state.receiptLedger.find((receipt) => receipt.commandId === state.visibleReceiptCommandId) : undefined, clearReceipt, submit };
}
