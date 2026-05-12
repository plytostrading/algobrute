import { expect, test, type Page } from '@playwright/test';

/**
 * /originate page — Wave 1.A (F.1.A) skeleton smoke.
 *
 * Verifies:
 *   1. The route renders without error when authenticated.
 *   2. The sidebar exposes an "Originate" entry that navigates here.
 *   3. The composer accepts text + send button is clickable + a user
 *      message lands in the transcript after send.
 *
 * The WebSocket itself is intentionally NOT exercised end-to-end here —
 * Wave 1.A only commits to a skeleton + the connection attempt. Routing
 * the WS through page.route() in Playwright is fragile (CDP intercepts
 * only some WS lifecycles), so we instead stub the underlying
 * ``WebSocket`` global inside the page context via ``addInitScript``.
 * The stub records the connection attempt + URL on the window so the
 * test can assert the client did try to open the right socket.
 */

async function withAuth(page: Page) {
  await page.context().addCookies([
    {
      name: 'logged_in',
      value: 'true',
      url: 'http://localhost:5173',
    },
  ]);
}

async function stubWebSocket(page: Page) {
  await page.addInitScript(() => {
    const recorded: Array<{ url: string; sentMessages: string[] }> = [];
    interface RecorderWindow extends Window {
      __dialogueWsRecorder?: typeof recorded;
    }
    (window as RecorderWindow).__dialogueWsRecorder = recorded;

    class StubWebSocket {
      static CONNECTING = 0 as const;
      static OPEN = 1 as const;
      static CLOSING = 2 as const;
      static CLOSED = 3 as const;

      readonly CONNECTING = 0;
      readonly OPEN = 1;
      readonly CLOSING = 2;
      readonly CLOSED = 3;

      readyState: number = 0;
      url: string;
      onopen: ((this: WebSocket, ev: Event) => unknown) | null = null;
      onmessage: ((this: WebSocket, ev: MessageEvent<string>) => unknown) | null = null;
      onerror: ((this: WebSocket, ev: Event) => unknown) | null = null;
      onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null = null;

      private record: { url: string; sentMessages: string[] };

      constructor(url: string) {
        this.url = url;
        this.record = { url, sentMessages: [] };
        recorded.push(this.record);
        // Defer "open" so the caller can wire up handlers first.
        setTimeout(() => {
          this.readyState = 1;
          this.onopen?.call(this as unknown as WebSocket, new Event('open'));
        }, 0);
      }

      send(data: string) {
        this.record.sentMessages.push(data);
      }

      close() {
        if (this.readyState === 3) return;
        this.readyState = 3;
        const closeEvent = new CloseEvent('close', { code: 1000, reason: 'stub-close', wasClean: true });
        this.onclose?.call(this as unknown as WebSocket, closeEvent);
      }

      addEventListener() {
        /* not used by useDialogueSession */
      }

      removeEventListener() {
        /* not used by useDialogueSession */
      }
    }

    // Cast through unknown — the stub matches the surface the hook touches
    // without re-implementing the full WebSocket interface.
    (window as unknown as { WebSocket: typeof WebSocket }).WebSocket =
      StubWebSocket as unknown as typeof WebSocket;
  });
}

test.describe('/originate', () => {
  test('renders without error when authenticated', async ({ page }) => {
    await withAuth(page);
    await stubWebSocket(page);

    const response = await page.goto('/originate');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Originate', level: 2 })).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText('Internal Server Error');
    await expect(body).not.toContainText('Application error');

    await expect(page.getByTestId('originate-page')).toBeVisible();
    await expect(page.getByTestId('originate-chat')).toBeVisible();
    await expect(page.getByTestId('originate-status-panel')).toBeVisible();
  });

  test('exposes Originate in the sidebar and navigates from another page', async ({ page }) => {
    await withAuth(page);
    await stubWebSocket(page);

    await page.goto('/');
    const sidebarLink = page.getByRole('link', { name: 'Originate' });
    await expect(sidebarLink).toBeVisible();
    await sidebarLink.click();
    await expect(page).toHaveURL(/\/originate$/);
    await expect(page.getByRole('heading', { name: 'Originate', level: 2 })).toBeVisible();
  });

  test('accepts a user message and shows it in the transcript', async ({ page }) => {
    await withAuth(page);
    await stubWebSocket(page);

    await page.goto('/originate');
    await expect(page.getByTestId('originate-page')).toBeVisible();

    const input = page.getByTestId('originate-input');
    await input.fill('I want a momentum strategy on SPY');

    const sendBtn = page.getByTestId('originate-send');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // The user message should land in the transcript.
    await expect(page.getByTestId('originate-message-user').first()).toContainText(
      'I want a momentum strategy on SPY',
    );

    // And the input field should be cleared so a follow-up can be typed.
    await expect(input).toHaveValue('');
  });
});
