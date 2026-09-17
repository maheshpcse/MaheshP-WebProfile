import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
test("both existing portfolio versions stay unchanged", () => {
  const baseline = JSON.parse(
    readFileSync("docs/production-preserved.json", "utf8"),
  );
  for (const [file, hash] of Object.entries(baseline))
    expect(
      createHash("sha256").update(readFileSync(file, "utf8").replace(/\r\n/g, "\n")).digest("hex"),
      file,
    ).toBe(hash);
});
const ids = ["hello", "journey", "tools", "chat", "bank", "contact"];
test("six scenes open forward and close in reverse with real scrolling", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/scenes.html");
  await expect(page.locator("html")).toHaveAttribute("data-scene", "hello");
  await page.waitForTimeout(1000);
  for (let i = 1; i < 6; i++) {
    await page.locator("#scene-next").click();
    await expect(page.locator("html")).toHaveAttribute("data-scene", ids[i]);
    await expect(page.locator("#" + ids[i])).toHaveCSS("opacity", "1");
    await expect(page.locator("#" + ids[i])).toHaveAttribute(
      "aria-hidden",
      "false",
    );
  }
  await expect(page.locator("#scene-next")).toBeDisabled();
  for (let i = 4; i >= 0; i--) {
    await page.locator("#scene-prev").click();
    await expect(page.locator("html")).toHaveAttribute("data-scene", ids[i]);
    await expect(page.locator("#" + ids[i])).toHaveCSS("opacity", "1");
  }
  await expect(page.locator("#scene-prev")).toBeDisabled();
  await page.evaluate(() =>
    scrollTo({
      top:
        ((document.querySelector<HTMLElement>("#scene-track")!.offsetHeight -
          innerHeight) *
          0.7) /
        5,
      behavior: "instant",
    }),
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-transitioning",
    "true",
  );
  await expect(page.locator(".scene-wipe")).toHaveCount(0);
  const closing = await page.locator("#hello .scene-art").getAttribute("style");
  expect(closing).toContain("scale");
  await page.evaluate(() => scrollTo({top: 0, behavior: "instant"}));
  await expect(page.locator("#hello")).toHaveCSS("opacity", "1");
  expect(errors).toEqual([]);
});
test("scene project links, details, themes and accessibility", async ({
  page,
}) => {
  await page.goto("/scenes.html");
  await page.locator("#scene-motion").click();
  for (const id of ids) {
    await page.locator(`.scene-picker a[href="#${id}"]`).click();
    await expect(page.locator("html")).toHaveAttribute("data-scene", id);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.locator("#scene-theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const id of ids) {
    await page.locator(`.scene-picker a[href="#${id}"]`).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.locator('.scene-picker a[href="#chat"]').click();
  await page.locator("#send-hello").click();
  await expect(page.locator("#hello-message")).toContainText(
    "nice to meet you",
  );
  const trigger = page.locator('[data-detail="chat"]');
  await trigger.click();
  await expect(page.locator("#scene-detail")).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).include("#scene-detail").analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator("#scene-detail")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("#chat .primary")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/chat-app/",
  );
  await expect(page.locator("#bank .primary")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/banking-system/",
  );
});
test("scenes work on mobile, with reduced motion, and on direct entry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/scenes.html#bank");
  await expect(page.locator("html")).toHaveAttribute("data-scene", "bank");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator("#scene-prev").click();
  await expect(page.locator("html")).toHaveAttribute("data-scene", "chat");
  await page.locator('[data-detail="chat"]').click();
  await expect(page.locator("#scene-detail")).toBeVisible();
  await page.locator("#detail-close").click();
  await expect(page.locator("#scene-detail")).not.toBeVisible();
  await page.locator('.scene-picker a[href="#hello"]').click();
  await expect(page.locator("#hello-title")).toBeInViewport();
});
test("scene content is still readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/scenes.html");
  await expect(page.locator(".scene")).toHaveCount(6);
  await expect(page.locator("#chat .primary")).toBeVisible();
  await expect(page.locator("#scene-motion")).toBeHidden();
  await context.close();
});

test("controls never overlap the scene canvas at desktop, mobile or short heights", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [{width:1920,height:900}, {width:1280,height:720}, {width:844,height:390}, {width:375,height:812}]) {
    await page.setViewportSize(viewport);
    await page.goto("/scenes.html");
    for (const id of ids) {
      await page.locator(`.scene-picker a[href="#${id}"]`).click();
      const bounds = await page.evaluate((id) => {
        const panel = document.getElementById(id)!;
        const box = panel.getBoundingClientRect();
        const header = document.querySelector(".scene-header")!.getBoundingClientRect();
        const footer = document.querySelector(".scene-footer")!.getBoundingClientRect();
        const copy = panel.querySelector(".scene-copy")!.getBoundingClientRect();
        return { top:box.top, bottom:box.bottom, header:header.bottom, footer:footer.top, copyTop:copy.top, copyBottom:copy.bottom };
      }, id);
      expect(bounds.top).toBeGreaterThanOrEqual(bounds.header);
      expect(bounds.bottom).toBeLessThanOrEqual(bounds.footer);
      if (viewport.width > 760) {
        expect(bounds.copyTop).toBeGreaterThanOrEqual(bounds.header);
        expect(bounds.copyBottom).toBeLessThanOrEqual(bounds.footer);
      }
    }
  }
});

test("direct scene URLs settle on the requested content with motion enabled", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const id of ["tools", "journey", "contact"]) {
    await page.goto("/scenes.html#" + id);
    await expect(page.locator("html")).toHaveAttribute("data-scene", id);
    await expect(page.locator("#" + id)).toHaveCSS("opacity", "1");
    await page.waitForTimeout(400);
    await expect(page.locator("html")).toHaveAttribute("data-scene", id);
  }
});

test("every scene keeps Journey's content frame at desktop and mobile sizes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const size of [{width:1280,height:900}, {width:1280,height:720}, {width:375,height:812}]) {
    await page.setViewportSize(size);
    await page.goto("/scenes.html#journey");
    await expect(page.locator("html")).toHaveAttribute("data-scene", "journey");
    const measure = () => page.evaluate(() => [...document.querySelectorAll(".scene")].map(panel =>
      [".scene-layout", ".scene-copy", ".scene-art"].map(selector => {
        const r = panel.querySelector(selector)!.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map(n => Math.round(n));
      })));
    await expect.poll(async () => {
      const boxes = await measure();
      return boxes.every(box => JSON.stringify(box) === JSON.stringify(boxes[1]));
    }).toBe(true);
    for (const id of ids) {
      await page.locator(`.scene-picker a[href="#${id}"]`).click();
      const boxes = await measure();
      expect(boxes[ids.indexOf(id)]).toEqual(boxes[1]);
    }
  }
});
test("refresh returns to Hello with or without a scene hash and uses themed scrollbars", async ({ page }) => {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/scenes.html#bank");
    await expect(page.locator("html")).toHaveAttribute("data-scene", "bank");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-scene", "hello");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page).not.toHaveURL(/#/);
    await page.evaluate(() => scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
    await expect(page.locator("html")).toHaveAttribute("data-scene", "contact");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-scene", "hello");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  }
  await expect(page.locator("html")).toHaveCSS("scrollbar-width", "thin");
  const before = await page.locator("html").evaluate(el => getComputedStyle(el).scrollbarColor);
  await page.locator("#scene-theme").click();
  await expect.poll(() => page.locator("html").evaluate(el => getComputedStyle(el).scrollbarColor)).not.toBe(before);
});
