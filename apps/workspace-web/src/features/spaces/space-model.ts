/** Prototype-local presentation model; not a production capability contract. */
export type PrototypeSpaceIconKey = "home" | "wrench" | "receipt" | "spark" | "book";

export interface PrototypeSpace {
  id: `demo-space-${string}`;
  label: string;
  description: string;
  iconKey: PrototypeSpaceIconKey;
  presentationCount: string;
  unreadPresentationCount: number;
}
