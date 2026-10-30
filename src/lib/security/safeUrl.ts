import dns from 'node:dns/promises';
import net from 'node:net';

export class UnsafeOutboundUrlError extends Error {
  public readonly code: string;
  constructor(message: string, code = 'UNSAFE_OUTBOUND_URL') {
    super(message);
    this.name = 'UnsafeOutboundUrlError';
    this.code = code;
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'kubernetes',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  '.localhost',
  '.local',
  '.internal',
  '.intranet',
  '.corp',
  '.home.arpa',
  '.svc.cluster.local',
];

function parseIpv4Octets(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith('0')) return null;
    const n = Number(part);
    if (!Number.isInteger(n) || n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

/**
 * Kiểm tra địa chỉ IPv4 hoặc IPv6 có nằm trong dải nội bộ, loopback, link-local,
 * cloud metadata hoặc dải dự trữ không được phép truy cập từ phía server (SSRF protection).
 */
export function isPrivateOrReservedIp(rawIp: string): boolean {
  let ip = rawIp.trim().toLowerCase();
  if (ip.startsWith('[') && ip.endsWith(']')) {
    ip = ip.slice(1, -1);
  }
  // Bỏ zone index IPv6 (ví dụ fe80::1%eth0)
  const zoneIdx = ip.indexOf('%');
  if (zoneIdx !== -1) {
    ip = ip.slice(0, zoneIdx);
  }

  const family = net.isIP(ip);
  if (family === 0) {
    // Không phải IP hợp lệ -> coi là không an toàn (fail-closed)
    return true;
  }

  if (family === 4) {
    const octets = parseIpv4Octets(ip);
    if (!octets) return true;
    const [a, b, c] = octets;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 10.0.0.0/8 (Private RFC1918)
    if (a === 10) return true;
    // 100.64.0.0/10 (Carrier-Grade NAT RFC6598)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 (Private RFC1918)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.0.0.0/24 (IETF Protocol Assignments) & 192.0.2.0/24 (TEST-NET-1)
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true;
    // 192.168.0.0/16 (Private RFC1918)
    if (a === 192 && b === 168) return true;
    // 198.18.0.0/15 (Benchmarking)
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 198.51.100.0/24 (TEST-NET-2)
    if (a === 198 && b === 51 && c === 100) return true;
    // 203.0.113.0/24 (TEST-NET-3)
    if (a === 203 && b === 0 && c === 113) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved / Broadcast)
    if (a >= 224) return true;

    return false;
  }

  // IPv6
  if (ip === '::' || ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // IPv4-mapped IPv6 dạng chấm (::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    const tail = ip.slice('::ffff:'.length);
    if (net.isIP(tail) === 4) {
      return isPrivateOrReservedIp(tail);
    }
    // Dạng hex ::ffff:7f00:1
    const hexParts = tail.split(':');
    if (hexParts.length === 2) {
      const hi = parseInt(hexParts[0], 16);
      const lo = parseInt(hexParts[1], 16);
      if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        const ipv4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return isPrivateOrReservedIp(ipv4);
      }
    }
    return true;
  }

  // Unique Local fc00::/7 (fc.. hoặc fd..)
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
  // Link-local fe80::/10 (fe8., fe9., fea., feb.)
  if (/^fe[89ab][0-9a-f]:/.test(ip)) return true;
  // Multicast ff00::/8
  if (ip.startsWith('ff')) return true;
  // Documentation 2001:db8::/32
  if (ip.startsWith('2001:db8:') || ip.startsWith('2001:0db8:')) return true;
  // 6to4 2002::/16 (có thể bọc IPv4 nội bộ)
  if (ip.startsWith('2002:')) return true;

  return false;
}

export interface ValidateOutboundUrlOptions {
  resolveDns?: (hostname: string) => Promise<string[]>;
}

async function defaultResolveDns(hostname: string): Promise<string[]> {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  return records.map((r) => r.address);
}

/**
 * Xác thực URL outbound trước khi gọi fetch:
 * 1. Chỉ cho phép giao thức http: và https:
 * 2. Không cho phép thông tin đăng nhập nhúng trong URL (user:pass@host)
 * 3. Chỉ cho phép cổng mặc định (80 / 443)
 * 4. Chặn tên miền nội bộ / localhost / metadata
 * 5. Phân giải DNS và chặn toàn bộ IP nội bộ / loopback / link-local / dự trữ
 */
export async function validateOutboundUrl(
  rawUrl: string,
  options?: ValidateOutboundUrlOptions
): Promise<URL> {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new UnsafeOutboundUrlError('URL không được để trống.', 'EMPTY_URL');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new UnsafeOutboundUrlError('URL không đúng định dạng.', 'INVALID_URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeOutboundUrlError(
      'Chỉ hỗ trợ đường dẫn chuẩn http:// hoặc https://.',
      'INVALID_PROTOCOL'
    );
  }

  if (parsed.username || parsed.password) {
    throw new UnsafeOutboundUrlError(
      'Không cho phép truyền thông tin xác thực trong URL.',
      'CREDENTIALS_IN_URL'
    );
  }

  if (parsed.port !== '' && parsed.port !== '80' && parsed.port !== '443') {
    throw new UnsafeOutboundUrlError(
      'Không cho phép kết nối tới cổng mạng phi tiêu chuẩn.',
      'NON_STANDARD_PORT'
    );
  }

  const rawHost = parsed.hostname.trim().toLowerCase().replace(/\.+$/, '');
  if (!rawHost) {
    throw new UnsafeOutboundUrlError('Tên miền URL không hợp lệ.', 'INVALID_HOST');
  }

  const cleanHost = rawHost.startsWith('[') && rawHost.endsWith(']') ? rawHost.slice(1, -1) : rawHost;

  if (
    BLOCKED_HOSTNAMES.has(cleanHost) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => cleanHost.endsWith(suffix))
  ) {
    throw new UnsafeOutboundUrlError(
      'Từ chối kết nối tới máy chủ nội bộ hoặc tên miền hệ thống.',
      'BLOCKED_HOSTNAME'
    );
  }

  // Chặn biểu diễn IPv4 dạng số nguyên hoặc octal/hex (ví dụ http://2130706433 hoặc http://0x7f.0.0.1)
  if (/^\d+$/.test(cleanHost) || /^0x[0-9a-f]+/i.test(cleanHost)) {
    throw new UnsafeOutboundUrlError(
      'Không cho phép địa chỉ IP dạng số nguyên hoặc hệ cơ số đặc biệt.',
      'OBFUSCATED_IP'
    );
  }

  if (net.isIP(cleanHost) !== 0) {
    if (isPrivateOrReservedIp(cleanHost)) {
      throw new UnsafeOutboundUrlError(
        'Từ chối kết nối tới dải địa chỉ IP nội bộ hoặc dự trữ.',
        'PRIVATE_IP_LITERAL'
      );
    }
    return parsed;
  }

  const resolver = options?.resolveDns ?? defaultResolveDns;
  let addresses: string[];
  try {
    addresses = await resolver(cleanHost);
  } catch {
    throw new UnsafeOutboundUrlError(
      'Không thể phân giải tên miền nguồn công thức.',
      'DNS_RESOLUTION_FAILED'
    );
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new UnsafeOutboundUrlError(
      'Tên miền không có bản ghi địa chỉ IP hợp lệ.',
      'DNS_EMPTY'
    );
  }

  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr)) {
      throw new UnsafeOutboundUrlError(
        'Tên miền trỏ về địa chỉ IP nội bộ hoặc dự trữ bị cấm.',
        'PRIVATE_RESOLVED_IP'
      );
    }
  }

  return parsed;
}

export interface SafeFetchTextOptions extends ValidateOutboundUrlOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

const DEFAULT_MAX_BYTES = 1_500_000; // 1.5 MB
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 3;

async function readResponseTextCapped(res: Response, maxBytes: number): Promise<string> {
  const contentLengthHeader = res.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new UnsafeOutboundUrlError(
        `Phản hồi vượt quá giới hạn dung lượng an toàn (${maxBytes} bytes).`,
        'RESPONSE_TOO_LARGE'
      );
    }
  }

  if (!res.body) {
    const text = await res.text();
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      throw new UnsafeOutboundUrlError(
        `Phản hồi vượt quá giới hạn dung lượng an toàn (${maxBytes} bytes).`,
        'RESPONSE_TOO_LARGE'
      );
    }
    return text;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel().catch(() => {});
          throw new UnsafeOutboundUrlError(
            `Phản hồi vượt quá giới hạn dung lượng an toàn (${maxBytes} bytes).`,
            'RESPONSE_TOO_LARGE'
          );
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(merged);
}

/**
 * Tải nội dung văn bản/HTML từ URL bên ngoài với đầy đủ lớp bảo vệ SSRF:
 * - Kiểm tra URL và IP qua DNS trước mỗi hop
 * - Chặn redirect sang IP nội bộ / metadata (`redirect: 'manual'`)
 * - Giới hạn số lần redirect và dung lượng phản hồi tối đa
 */
export async function safeFetchText(
  rawUrl: string,
  options?: SafeFetchTextOptions
): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options?.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const fetchFn = options?.fetchImpl ?? fetch;

  let currentUrl = (await validateOutboundUrl(rawUrl, options)).toString();

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetchFn(currentUrl, {
        method: 'GET',
        headers: options?.headers ?? {
          'User-Agent': 'Mozilla/5.0 (compatible; AnGiMomRecipeBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) {
        throw new UnsafeOutboundUrlError('Phản hồi chuyển hướng thiếu header Location.', 'INVALID_REDIRECT');
      }
      if (hop === maxRedirects) {
        throw new UnsafeOutboundUrlError('URL chuyển hướng quá số lần cho phép.', 'TOO_MANY_REDIRECTS');
      }
      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = (await validateOutboundUrl(nextUrl, options)).toString();
      continue;
    }

    if (!res.ok) {
      return { ok: false, status: res.status, text: '', finalUrl: currentUrl };
    }

    const text = await readResponseTextCapped(res, maxBytes);
    return { ok: true, status: res.status, text, finalUrl: currentUrl };
  }

  throw new UnsafeOutboundUrlError('URL chuyển hướng quá số lần cho phép.', 'TOO_MANY_REDIRECTS');
}
