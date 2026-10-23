/**
 * Serves the production build and runs axe on every route, in dark and light mode.
 * Exits with 1 on any violation. Run `pnpm build` first; `pnpm a11y` does both.
 */
import { AxeBuilder } from '@axe-core/playwright';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize } from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import { chromium, type Page } from 'playwright';

const ROOT = join(import.meta.dirname, '../dist/palette-previewer/browser');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const MODES = ['dark', 'light'] as const;
/**
 * Elements whose colors come from the user's palette, not from the app. They still get every
 * other rule; only color-contrast skips them, since the app cannot guarantee it for any palette (see #16).
 */
const PALETTE_COLORED = ['app-primeng-preview'];

type Mode = (typeof MODES)[number];

interface Scenario {
  name: string;
  path: string;
  /** Brings the page into the state to scan, once it has loaded. */
  setup?: (page: Page, mode: Mode) => Promise<void>;
}

const SCENARIOS: Scenario[] = [
  { name: 'accent', path: '/tools/accent', setup: selectMode },
  { name: 'colorize, no image', path: '/tools/colorize', setup: selectMode },
  {
    name: 'colorize, with image',
    path: '/tools/colorize',
    setup: async (page, mode) => {
      await selectMode(page, mode);
      await page.locator('input[type=file]').setInputFiles({
        name: 'gradient.png',
        mimeType: 'image/png',
        buffer: gradientPng(64, 48),
      });
      await page.locator('app-image-compare').waitFor();
    },
  },
];

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.svg': 'image/svg+xml',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`No build in ${ROOT}; run \`pnpm build\` first.`);
  process.exit(1);
}

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
  let file = join(ROOT, path);
  // Like GitHub Pages' 404.html fallback: unknown paths are app routes.
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    file = join(ROOT, 'index.html');
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

const browser = await chromium.launch();
let total = 0;

try {
  for (const mode of MODES) {
    // The app chrome follows the system scheme, the previews follow the Mode switch: scan matching pairs.
    const context = await browser.newContext({ colorScheme: mode });
    for (const scenario of SCENARIOS) {
      const page = await context.newPage();
      await page.goto(origin + scenario.path, { waitUntil: 'networkidle' });
      await page.locator('main h2').waitFor();
      await scenario.setup?.(page, mode);
      // Let transitions (hover, toggle, theme swap) settle so contrast is measured on final colors.
      await page.waitForTimeout(500);

      const violations = [
        ...(await new AxeBuilder({ page }).withTags(TAGS).disableRules('color-contrast').analyze())
          .violations,
        ...(
          await new AxeBuilder({ page })
            .withRules('color-contrast')
            .exclude(PALETTE_COLORED)
            .analyze()
        ).violations,
      ];
      const label = `${scenario.name} (${mode})`;
      if (violations.length === 0) {
        console.log(`✓ ${label}`);
      } else {
        console.log(`✗ ${label}`);
        for (const v of violations) {
          total += v.nodes.length;
          console.log(`  ${v.id} [${v.impact}] ${v.help} (${v.nodes.length})`);
          for (const node of v.nodes) {
            console.log(`    ${node.target.join(' ')}`);
            console.log(`      ${node.failureSummary?.replaceAll('\n', '\n      ')}`);
          }
        }
      }
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(total === 0 ? '\nNo accessibility violations.' : `\n${total} violating nodes.`);
process.exit(total === 0 ? 0 : 1);

/** Clicks the page's Mode switch, when it has one. */
async function selectMode(page: Page, mode: Mode): Promise<void> {
  const option = page
    .locator(':has(> #mode-label) > p-selectbutton')
    .getByText(mode === 'dark' ? 'Dark' : 'Light', { exact: true });
  if ((await option.count()) > 0) await option.click();
}

/** A small RGB gradient PNG, so the colorizer has something to recolor without a fixture file. */
function gradientPng(width: number, height: number): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) {
      raw.set([(x * 255) / width, (y * 255) / height, 128], row + 1 + x * 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // 8-bit RGB, no interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}
