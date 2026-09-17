import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("profile, navigation, and resume work without exploration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("main > section")).toHaveCount(7);
  await expect(
    page.locator("canvas, #world-stage, #discovery-dialog, #living-cursor"),
  ).toHaveCount(0);
  await expect(page.getByText(/Vibe Coder/).first()).toBeVisible();
  await expect(page.locator("#projects article")).toHaveCount(2);
  await expect(page.locator("#projects article a")).toHaveCount(6);
  await expect(page.locator("#chat-system .project-live")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/chat-app/",
  );
  await expect(page.locator("#banking-system .project-live")).toHaveAttribute(
    "href",
    "https://maheshpcse.github.io/banking-system/",
  );
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Experience" })
    .click();
  await expect(page).toHaveURL(/#career$/);
  await expect(page.locator("#career-title")).toBeInViewport();
  const download = page.waitForEvent("download");
  await page.locator(".resume-link").click();
  expect((await download).suggestedFilename()).toBe("Mahesh-Resume.pdf");
  expect(errors).toEqual([]);
});

test("themes persist and both palettes are accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("#cinema-intro")).not.toBeVisible({
    timeout: 8000,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#cinema-intro")).not.toBeVisible({
    timeout: 8000,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("mobile layout fits and scroll progress reaches the bottom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Contact" })
    .click();
  await expect(page.locator("#contact-title")).toBeInViewport();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(page.locator("#reading-progress")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
});

test("content remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await expect(page.locator("#identity-title")).toBeVisible();
  await expect(page.locator("#contact-title")).toBeVisible();
  await expect(page.locator("#theme-toggle")).toBeHidden();
  await context.close();
});

test("landing titles auto-reveal, skip, and respect direct reading and reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#cinema-intro")).toBeVisible();
  await page.evaluate(() => {
    document
      .querySelector("#cinema-intro")!
      .getAnimations({ subtree: true })
      .forEach((animation) => {
        if (
          ["cinema-letter", "cinema-rise"].includes(
            (animation as CSSAnimation).animationName,
          )
        )
          animation.finish();
      });
  });
  expect(
    (await new AxeBuilder({ page }).include("#cinema-intro").analyze())
      .violations,
  ).toEqual([]);
  await expect(page.locator("#cinema-intro")).not.toBeVisible({
    timeout: 8000,
  });
  await expect(page.locator("html")).not.toHaveClass(/cinema-playing/);
  await expect(page.locator("#identity-title")).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await expect(page.locator("#cinema-intro")).not.toBeVisible();
  await page.reload();
  await page.keyboard.press("Escape");
  await expect(page.locator("#cinema-intro")).not.toBeVisible();
  await page.goto("/#projects");
  await expect(page.locator("#cinema-intro")).not.toBeVisible();
  await page.goto("/portfolio.html");
  await expect(page.locator("#cinema-intro")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#cinema-intro")).not.toBeVisible();
});

test("classic back to top appears after scrolling and returns focus to the introduction", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const url of ["/", "/portfolio.html"]) {
    await page.goto(url);
    await expect(page.locator("#back-to-top")).toBeHidden();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.locator("#back-to-top")).toBeVisible();
    await page.locator("#back-to-top").click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(page.locator("#identity-title")).toBeFocused();
    await expect(page.locator("#back-to-top")).toBeHidden();
  }
});

test("classic links open both animated editions without changing the intro", async ({ page }) => {
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const source = readFileSync("index.html", "utf8").replace(/\r\n/g, "\n");
  const intro = source.match(/    <dialog[\s\S]*?<\/dialog>/)![0];
  expect(createHash("sha256").update(intro).digest("hex")).toBe(readFileSync("docs/intro-preserved.sha256", "utf8").trim());
  await page.setViewportSize({width:375,height:812});
  await page.goto("/");
  await expect(page.locator("#cinema-intro")).toBeVisible();
  await page.getByRole("button", {name:"Skip intro"}).click();
  const versions = page.getByRole("group", {name:"Portfolio versions"});
  await expect(versions.getByRole("link", {name:"In Motion"})).toBeInViewport();
  await expect(versions.getByRole("link", {name:"Scenes"})).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await versions.getByRole("link", {name:"In Motion"}).click();
  await expect(page).toHaveURL(/motion.html$/);
  await page.goto("/portfolio.html");
  await page.getByRole("group", {name:"Portfolio versions"}).getByRole("link", {name:"Scenes"}).click();
  await expect(page).toHaveURL(/scenes.html$/);
});
