// Reload starts a fresh reading session, including URLs with a section hash.
const navigation = performance.getEntriesByType("navigation")[0] as
  | PerformanceNavigationTiming
  | undefined;
if (navigation?.type === "reload") {
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  if (location.hash)
    history.replaceState(
      history.state,
      "",
      location.pathname + location.search,
    );
  const resetScroll = () =>
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  resetScroll();
  addEventListener(
    "pageshow",
    (event) => {
      if (!event.persisted)
        requestAnimationFrame(() => {
          resetScroll();
          history.scrollRestoration = restoration;
        });
    },
    { once: true },
  );
}
const header = document.querySelector<HTMLElement>(".site-header")!;
new ResizeObserver(() => {
  document.documentElement.style.setProperty(
    "--header-height",
    `${header.getBoundingClientRect().height}px`,
  );
}).observe(header);

const toggle = document.querySelector<HTMLButtonElement>("#theme-toggle")!;
const preference = matchMedia("(prefers-color-scheme: light)");
function savedTheme() {
  try {
    return localStorage.getItem("mahesh-theme");
  } catch {
    return null;
  }
}
function applyTheme(theme: string) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  toggle.textContent = dark ? "☀" : "☾";
  toggle.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? "#15151f" : "#f4f1ed");
}
toggle.hidden = false;
applyTheme(
  document.documentElement.dataset.theme ||
    (preference.matches ? "light" : "dark"),
);
toggle.addEventListener("click", () => {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem("mahesh-theme", next);
  } catch {}
});
preference.addEventListener("change", (event) => {
  if (!["light", "dark"].includes(savedTheme() || ""))
    applyTheme(event.matches ? "light" : "dark");
});
const backToTop = document.createElement("button");
backToTop.id = "back-to-top";
backToTop.type = "button";
backToTop.innerHTML = '<span aria-hidden="true">?</span> Back to top';
backToTop.hidden = true;
document.body.append(backToTop);
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  const title = document.querySelector<HTMLElement>("#identity-title")!;
  title.setAttribute("tabindex", "-1");
  title.focus({ preventScroll: true });
});
const progress = document.querySelector<HTMLElement>("#reading-progress")!;
function updateProgress() {
  backToTop.hidden = scrollY < Math.min(400, innerHeight / 2);
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
}
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
new ResizeObserver(updateProgress).observe(document.body);
updateProgress();

const artworkToggle =
  document.querySelector<HTMLButtonElement>("#artwork-toggle")!;
artworkToggle.hidden = false;
artworkToggle.addEventListener("click", () => {
  const paused = document
    .querySelector("#projects")!
    .classList.toggle("artwork-paused");
  artworkToggle.setAttribute("aria-pressed", String(paused));
  artworkToggle.textContent = paused ? "Resume artwork" : "Pause artwork";
});

// The landing title sequence enhances the home page; direct section links and
// the dedicated reading page stay immediate. No assets or storage are required.
const cinema = document.querySelector<HTMLDialogElement>("#cinema-intro");
const reducedIntro = matchMedia("(prefers-reduced-motion: reduce)");
if (
  cinema &&
  !location.hash &&
  !reducedIntro.matches &&
  navigation?.type !== "back_forward"
) {
  let closing = false;
  let exitTimer: ReturnType<typeof setTimeout>;
  const finishIntro = () => {
    clearTimeout(exitTimer);
    cinema.close();
    document.documentElement.classList.remove("cinema-playing");
    const title = document.querySelector<HTMLElement>("#identity-title")!;
    title.setAttribute("tabindex", "-1");
    title.focus({ preventScroll: true });
  };
  const leaveIntro = (immediate = false) => {
    if (closing && !immediate) return;
    closing = true;
    clearTimeout(autoExit);
    if (immediate) {
      finishIntro();
      return;
    }
    cinema.classList.add("cinema-leaving");
    exitTimer = setTimeout(finishIntro, 650);
  };
  cinema.showModal();
  document.documentElement.classList.add("cinema-playing");
  const autoExit = setTimeout(() => leaveIntro(), 4200);
  document
    .querySelector("#cinema-skip")!
    .addEventListener("click", () => leaveIntro(true));
  cinema.addEventListener("cancel", (event) => {
    event.preventDefault();
    leaveIntro(true);
  });
  reducedIntro.addEventListener("change", (event) => {
    if (event.matches && cinema.open) leaveIntro(true);
  });
  addEventListener(
    "pagehide",
    () => {
      clearTimeout(autoExit);
      clearTimeout(exitTimer);
      cinema.close();
      document.documentElement.classList.remove("cinema-playing");
    },
    { once: true },
  );
}
