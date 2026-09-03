import { useEffect, useRef } from "react";
import type { PrototypeCommandReceiptState } from "./card-model";
import type { PrototypeReceipt } from "../threads/workspace-runtime";

export const SYNTHETIC_RECEIPT_DELAY_MS = 180;

export function useSyntheticReceiptDelay(receipts: Readonly<Record<string, PrototypeReceipt>>, generation: string, settle: (actionId: string) => void) {
  const generationRef = useRef(generation);
  generationRef.current = generation;

  useEffect(() => {
    const timers = Object.values(receipts)
      .filter((receipt) => receipt.status === "pending")
      .map((receipt) => window.setTimeout(() => {
        if (generationRef.current === generation) settle(receipt.actionId);
      }, SYNTHETIC_RECEIPT_DELAY_MS));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [generation, receipts, settle]);
}

export function receiptStatus(receipt: PrototypeReceipt | undefined): PrototypeCommandReceiptState {
  return receipt?.status ?? "ready";
}
