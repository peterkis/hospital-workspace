const IPV4_OR_CIDR = /(?:\d+\.){3}\d+(?:\/[^\s,;:"'`.\]}\)<>]*)?/g;

function parseIpv4(value) {
  const octets = value.split(".");
  if (octets.length !== 4 || octets.some((octet) => !/^(?:0|[1-9]\d{0,2})$/.test(octet))) return null;
  const numbers = octets.map(Number);
  return numbers.every((octet) => octet >= 0 && octet <= 255) ? numbers : null;
}

function isPrivateOrReserved([first, second]) {
  return first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function isApprovedSyntheticNetworkReference(value) {
  const parts = value.split("/");
  if (parts.length > 2) return false;
  const [address, prefix] = parts;
  const ipv4 = parseIpv4(address);
  if (!ipv4 || (prefix !== undefined && !/^(?:0|[1-9]\d{0,1})$/.test(prefix))) return false;
  if (prefix !== undefined && (Number(prefix) < 0 || Number(prefix) > 32)) return false;
  if (prefix !== undefined) return address === "10.0.0.0" && prefix === "24";
  return ipv4[0] === 10 && ipv4[1] === 0 && ipv4[2] === 0;
}

export function containsProhibitedNetworkReference(text) {
  for (const match of text.matchAll(IPV4_OR_CIDR)) {
    const value = match[0];
    const next = text[(match.index ?? 0) + value.length] ?? "";
    const afterNext = text[(match.index ?? 0) + value.length + 1] ?? "";
    if (/[0-9A-Za-z_/-]/.test(next) || (next === "." && /[0-9A-Za-z]/.test(afterNext))) return true;
    const [address, prefix] = value.split("/");
    const ipv4 = parseIpv4(address);
    if (!ipv4) return true;
    if (prefix !== undefined) {
      if (isApprovedSyntheticNetworkReference(value)) continue;
      return true;
    }
    if (isApprovedSyntheticNetworkReference(value)) continue;
    if (isPrivateOrReserved(ipv4)) return true;
  }
  return false;
}
