export const mvpApiClientErrorCodes = [
  "TIMEOUT",
  "CANCELLED",
  "UNAVAILABLE",
  "INVALID_RESPONSE",
] as const;

export type MvpApiClientErrorCode = (typeof mvpApiClientErrorCodes)[number];

export type MvpApiClientError = {
  readonly name: "MvpApiClientError";
  readonly code: MvpApiClientErrorCode;
  readonly message: string;
  readonly status?: number;
};

const publicMessages: Readonly<Record<MvpApiClientErrorCode, string>> = {
  TIMEOUT: "The local prototype request timed out.",
  CANCELLED: "The local prototype request was cancelled.",
  UNAVAILABLE: "The local prototype service is unavailable.",
  INVALID_RESPONSE: "The local prototype returned an invalid response.",
};
const createdClientErrors = new WeakSet<object>();

export function createMvpApiClientError(
  code: MvpApiClientErrorCode,
  details?: { readonly status?: number },
): MvpApiClientError {
  const error = Object.freeze({
    name: "MvpApiClientError" as const,
    code,
    message: publicMessages[code],
    ...(details?.status === undefined ? {} : { status: details.status }),
  });
  createdClientErrors.add(error);
  return error;
}

export function isMvpApiClientError(value: unknown): value is MvpApiClientError {
  return typeof value === "object" && value !== null && createdClientErrors.has(value);
}
