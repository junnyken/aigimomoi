import module from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

function tryResolveFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return pathToFileURL(c).href;
    }
  }
  return null;
}

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') {
      return { url: 'virtual:///next-server.mjs', shortCircuit: true };
    }
    if (specifier === 'next/headers') {
      return { url: 'virtual:///next-headers.mjs', shortCircuit: true };
    }
    if (specifier === 'next/cache') {
      return { url: 'virtual:///next-cache.mjs', shortCircuit: true };
    }
    if (specifier.startsWith('@/')) {
      const target = path.join(srcDir, specifier.slice(2));
      const resolved = tryResolveFile(target);
      if (resolved) {
        return { url: resolved, shortCircuit: true };
      }
    }
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
      const parentFile = fileURLToPath(context.parentURL);
      if (parentFile.startsWith(srcDir)) {
        const parentDir = path.dirname(parentFile);
        const target = path.resolve(parentDir, specifier);
        const resolved = tryResolveFile(target);
        if (resolved) {
          return { url: resolved, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'virtual:///next-server.mjs') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          function createNextUrl(rawUrl) {
            const u = new URL(rawUrl);
            u.clone = () => createNextUrl(u.toString());
            return u;
          }

          export class NextRequest extends Request {
            constructor(input, init) {
              super(input, init);
              const urlStr = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
              this.nextUrl = createNextUrl(urlStr);
              const cookieHeader = this.headers.get('cookie') || '';
              const map = new Map();
              for (const part of cookieHeader.split(';')) {
                const idx = part.indexOf('=');
                if (idx > 0) {
                  const k = part.slice(0, idx).trim();
                  const v = part.slice(idx + 1).trim();
                  map.set(k, { name: k, value: v });
                }
              }
              this.cookies = {
                get: (name) => map.get(name),
                getAll: () => Array.from(map.values()),
                has: (name) => map.has(name),
                set: (name, value) => map.set(name, { name, value }),
                delete: (name) => map.delete(name),
              };
            }
          }

          export class NextResponse extends Response {
            constructor(body, init) {
              super(body, init);
              const store = new Map();
              this.cookies = {
                set: (name, value, options) => store.set(name, { name, value, ...options }),
                get: (name) => store.get(name),
                delete: (name) => store.delete(name),
              };
            }
            static json(data, init = {}) {
              const headers = new Headers(init.headers || {});
              if (!headers.has('content-type')) {
                headers.set('content-type', 'application/json; charset=utf-8');
              }
              return new NextResponse(JSON.stringify(data), { ...init, headers });
            }
            static redirect(url, init = 307) {
              const status = typeof init === 'number' ? init : (init?.status ?? 307);
              const headers = new Headers(typeof init === 'object' ? init?.headers : undefined);
              headers.set('location', String(url));
              return new NextResponse(null, { status, headers });
            }
            static rewrite(destination, init = {}) {
              const headers = new Headers(init.headers || {});
              headers.set('x-middleware-rewrite', String(destination));
              return new NextResponse(null, { status: init.status ?? 200, headers });
            }
            static next(init = {}) {
              const headers = new Headers(init.headers || {});
              headers.set('x-middleware-next', '1');
              return new NextResponse(null, { status: init.status ?? 200, headers });
            }
          }
        `,
      };
    }
    if (url === 'virtual:///next-headers.mjs') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export async function cookies() {
            const store = new Map();
            return {
              get: (name) => store.get(name),
              set: (name, value) => store.set(name, { name, value }),
              delete: (name) => store.delete(name),
            };
          }
          export async function headers() {
            return new Headers();
          }
        `,
      };
    }
    if (url === 'virtual:///next-cache.mjs') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export function revalidateTag() {}
          export function revalidatePath() {}
          export function cacheLife() {}
          export function cacheTag() {}
          export function unstable_cache(fn) { return fn; }
        `,
      };
    }
    if (url.endsWith('/node_modules/postgres/src/index.js')) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `
          export default function postgres() {
            const client = function() {
              return Promise.reject(new Error('Offline unit test database stub'));
            };
            client.unsafe = () => Promise.reject(new Error('Offline unit test database stub'));
            client.begin = () => Promise.reject(new Error('Offline unit test database stub'));
            client.end = () => Promise.resolve();
            client.options = { parsers: {}, serializers: {} };
            return client;
          }
        `,
      };
    }
    return nextLoad(url, context);
  },
});
