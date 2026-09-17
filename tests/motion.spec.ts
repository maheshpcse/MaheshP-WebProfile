import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
test("classic files remain unchanged", () => {
  const baseline = JSON.parse(
    readFileSync("docs/navigation-preserved.json", "utf8"),
  );
  for (const [name, hash] of Object.entries(baseline))
    expect(
      createHash("sha256").update(readFileSync(name, "utf8").replace(/\r\n/g, "\n")).digest("hex"),
      name,
    ).toBe(hash);
});
test("motion portfolio interactions, themes and accessible content", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/motion.html");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "on");
  await page.locator("#remix").click();
  await expect(page.locator("#remix")).toHaveAttribute(
    "aria-label",
    /variation 2/,
  );
  await page.locator("#send-demo").click();
  await expect(page.locator("#message-demo")).toContainText("connection made");
  await page.locator("#transfer-demo").click();
  await expect(page.locator("#transfer-status")).toContainText("Demo complete");
  await page.locator('[data-filter="interface"]').click();
  await expect(page.locator(".tool-card:visible")).toHaveCount(3);
  await page.locator('[data-filter="services"]').click();
  await expect(page.locator(".tool-card:visible")).toHaveCount(4);
  await page.locator('[data-filter="all"]').click();
  await expect(page.locator(".tool-card:visible")).toHaveCount(10);
  await page.locator("#motion-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.locator("#motion-theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  await expect(page.locator(".project-actions .primary")).toHaveCount(2);
  await expect(page.locator(".chat-work .primary")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/chat-app/",
  );
  await expect(page.locator(".bank-work .primary")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/banking-system/",
  );
  expect(errors).toEqual([]);
});
test("motion mobile, reduced motion and classic escape", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/motion.html");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Toolkit" })
    .click();
  await expect(page.locator("#toolkit-title")).toBeInViewport();
  await page.locator("#transfer-demo").click();
  await expect(page.locator("#transfer-status")).toContainText("Demo complete");
  await page
    .getByRole("link", { name: "Classic portfolio", exact: false })
    .click();
  await expect(page).toHaveURL(/portfolio.html$/);
  await expect(page.locator("#identity-title")).toBeVisible();
});
test("motion content works without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/motion.html");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".work-card")).toHaveCount(2);
  await expect(page.locator(".tool-card")).toHaveCount(10);
  await expect(page.locator("#motion-toggle")).toBeHidden();
  await context.close();
});

test("engine opens, closes, scrubs and project stories restore focus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/motion.html");
  await page.locator("#engine-toggle").click();
  await expect(page.locator("#engine-scrub")).toHaveValue("100");
  await expect(page.locator("#engine-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await page.locator("#engine-toggle").click();
  await expect(page.locator("#engine-scrub")).toHaveValue("0");
  await page.locator("#engine-scrub").fill("65");
  await expect(page.locator("#engine-state")).toContainText("65%");
  await page.locator('[data-layer-detail="2"]').click();
  await expect(page.locator("#engine-description")).toContainText("MongoDB");
  await expect(page.locator("#engine-scrub")).toHaveValue("100");
  for (const key of ["chat", "bank"]) {
    const trigger = page.locator(`[data-project="${key}"]`);
    await trigger.click();
    await expect(page.locator("#project-story")).toBeVisible();
    await expect(page.locator("#story-layers article")).toHaveCount(3);
    await page.waitForTimeout(1100);
    expect(
      (await new AxeBuilder({ page }).include("#project-story").analyze())
        .violations,
    ).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.locator("#project-story")).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  await page.locator('[data-project="chat"]').click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#story-close").click();
  await expect(page.locator("#project-story")).not.toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.locator("#engine-toggle").click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("In Motion refresh resets scroll and the scrollbar follows the theme", async ({ page }) => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/motion.html#toolkit");
    await expect(page.locator("#toolkit-title")).toBeInViewport();
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await page.reload();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page).not.toHaveURL(/#/);
    await expect(page.locator("#hero-title")).toBeInViewport();
    await page.evaluate(() => scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await page.reload();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  }
  await expect(page.locator("html")).toHaveCSS("scrollbar-width", "thin");
  const before = await page.locator("html").evaluate(el => getComputedStyle(el).scrollbarColor);
  await page.locator("#motion-theme").click();
  await expect.poll(() => page.locator("html").evaluate(el => getComputedStyle(el).scrollbarColor)).not.toBe(before);
});
