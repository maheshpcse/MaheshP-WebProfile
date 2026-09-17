import { animate, createTimeline, onScroll, stagger, svg } from "animejs";

const root = document.documentElement;
const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
const isReload = navigation?.type === "reload";
if (isReload) {
  history.scrollRestoration = "manual";
  history.replaceState(history.state, "", location.pathname + location.search);
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}
const panels = [...document.querySelectorAll<HTMLElement>(".scene")];
const track = document.querySelector<HTMLElement>("#scene-track")!;
const picker = document.querySelector<HTMLElement>(".scene-picker")!;
const footer = document.querySelector<HTMLElement>(".scene-footer")!;
const previous = document.querySelector<HTMLButtonElement>("#scene-prev")!;
const next = document.querySelector<HTMLButtonElement>("#scene-next")!;
const motion = document.querySelector<HTMLButtonElement>("#scene-motion")!;
const theme = document.querySelector<HTMLButtonElement>("#scene-theme")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let paused = false;
try {
  paused = localStorage.getItem("mahesh-scenes-paused") === "true";
} catch {}
const enabled = () => !paused && !reduced.matches;
let active = -1;
let time = 0;
let master: ReturnType<typeof createTimeline> | undefined;
let observer: ReturnType<typeof onScroll> | undefined;
let introduction: ReturnType<typeof createTimeline> | undefined;
let playAnimation: ReturnType<typeof animate> | undefined;
const MAX = (panels.length - 1) * 1000;
root.classList.add("scene-mode");
picker.hidden = footer.hidden = motion.hidden = theme.hidden = false;

// Keep the scene canvas between the real controls, including zoom and font changes.
const header = document.querySelector<HTMLElement>(".scene-header")!;
panels.forEach((panel) => {
  const layout = document.createElement("div");
  layout.className = "scene-layout";
  layout.append(...panel.childNodes);
  panel.append(layout);
  const copy = panel.querySelector<HTMLElement>(".scene-copy")!;
  const content = document.createElement("div");
  content.className = "copy-content";
  content.append(...copy.childNodes);
  copy.append(content);
});
function fitScenes() {
  root.style.setProperty("--header-height", `${header.offsetHeight}px`);
  root.style.setProperty("--footer-height", `${footer.offsetHeight}px`);
  const reference = document.querySelector<HTMLElement>("#journey")!;
  const layout = reference.querySelector<HTMLElement>(".scene-layout")!;
  const copy = reference.querySelector<HTMLElement>(".scene-copy")!;
  const art = reference.querySelector<HTMLElement>(".scene-art")!;
  root.style.setProperty("--scene-height", `${layout.offsetHeight}px`);
  root.style.setProperty("--copy-height", `${copy.offsetHeight}px`);
  root.style.setProperty("--art-height", `${art.offsetHeight}px`);
  root.style.setProperty("--scene-fit", String(
    innerWidth > 760 ? Math.min(1, (reference.clientHeight - 80) / Math.max(1, layout.offsetHeight + 60)) : 1,
  ));
  panels.forEach(panel => {
    const content = panel.querySelector<HTMLElement>(".copy-content")!;
    content.style.setProperty("--copy-fit", String(
      Math.min(1, copy.offsetHeight / Math.max(1, content.offsetHeight)),
    ));
  });
}
const layoutObserver = new ResizeObserver(fitScenes);
[header, footer, ...document.querySelectorAll(".scene-layout, .copy-content")].forEach(el => layoutObserver.observe(el));
addEventListener("resize", fitScenes);
document.fonts.ready.then(fitScenes);
fitScenes();

function setActive(index: number) {
  if (active === index) return;
  active = index;
  panels.forEach((panel, i) => {
    panel.inert = i !== index;
    panel.setAttribute("aria-hidden", String(i !== index));
    panel.style.pointerEvents = i === index ? "auto" : "none";
  });
  picker.querySelectorAll("a").forEach((a, i) => {
    if (i === index) a.setAttribute("aria-current", "true");
    else a.removeAttribute("aria-current");
  });
  const label = panels[index].dataset.label!;
  const count = document.querySelector("#scene-count")!;
  count.replaceChildren(
    document.createTextNode(`${String(index + 1).padStart(2, "0")} / 06 `),
  );
  const bold = document.createElement("b");
  bold.textContent = label;
  count.append(bold);
  previous.disabled = index === 0;
  next.disabled = index === panels.length - 1;
  root.dataset.scene = panels[index].id;
}
function render(value: number) {
  time = Math.max(0, Math.min(MAX, value));
  const index = Math.min(panels.length - 1, Math.floor((time + 260) / 1000));
  if (enabled()) master?.seek(time);
  else
    panels.forEach(
      (panel, i) => (panel.style.opacity = i === index ? "1" : "0"),
    );
  setActive(index);
  document.querySelector<HTMLElement>(".scene-progress i")!.style.transform =
    `scaleX(${time / MAX})`;
  root.dataset.transitioning = String(
    enabled() && time % 1000 > 470 && time % 1000 < 980,
  );
}
function buildMotion() {
  observer?.revert();
  introduction?.revert();
  playAnimation?.revert();
  master?.revert();
  root.dataset.motion = enabled() ? "on" : "off";
  motion.textContent = reduced.matches
    ? "Reduced motion"
    : paused
      ? "Play motion"
      : "Pause motion";
  motion.disabled = reduced.matches;
  motion.setAttribute("aria-pressed", String(!enabled()));
  if (enabled()) {
    // Independent timeline values keep reverse seeking deterministic; sibling
    // replacement must not retain a later scene's partial closing state.
    master = createTimeline({
      autoplay: false,
      defaults: { ease: "inOutCubic", composition: "none" },
    });
    panels.forEach((panel, i) => {
      const copy = panel.querySelector(".scene-copy")!;
      const art = panel.querySelector(".scene-art")!;
      const pieces = panel.querySelectorAll(".piece");
      if (i > 0) {
        master!.add(panel, { opacity: [0, 1], duration: 260 }, i * 1000 - 380);
        master!.add(
          copy,
          {
            y: [60, 0],
            clipPath: ["inset(0% 0% 100% 0%)", "inset(0% 0% 0% 0%)"],
            duration: 300,
            ease: "outExpo",
          },
          i * 1000 - 380,
        );
        master!.add(
          art,
          { scale: [0.4, 1], x: [90, 0], duration: 300, ease: "outExpo" },
          i * 1000 - 380,
        );
        master!.add(
          pieces,
          {
            scale: [0.2, 1],
            y: [65, 0],
            duration: 250,
            delay: stagger(5),
            ease: "outBack",
          },
          i * 1000 - 380,
        );
        const paths = panel.querySelectorAll<SVGPathElement>(".draw-line");
        if (paths.length)
          master!.add(
            svg.createDrawable(paths),
            { draw: ["0 0", "0 1"], duration: 280 },
            i * 1000 - 340,
          );
      }
      if (i < panels.length - 1) {
        master!.add(
          copy,
          {
            y: [0, -55],
            clipPath: ["inset(0% 0% 0% 0%)", "inset(100% 0% 0% 0%)"],
            duration: 260,
          },
          i * 1000 + 470,
        );
        master!.add(
          pieces,
          {
            scale: [1, 0.08],
            y: [0, -60],
            duration: 250,
            delay: stagger(5, { from: "last" }),
            ease: "inBack",
          },
          i * 1000 + 480,
        );
        master!.add(
          art,
          { scale: [1, 0.5], x: [0, -90], duration: 280 },
          i * 1000 + 490,
        );
        master!.add(panel, { opacity: [1, 0], duration: 100 }, i * 1000 + 680);

      }
    });
  }
  observer = onScroll({
    target: track,
    enter: "top top",
    leave: "bottom bottom",
    onUpdate: () =>
      render((scrollY / Math.max(1, track.offsetHeight - innerHeight)) * MAX),
  });
  // Render explicitly as well, including when motion settings change mid-scroll.
  render((scrollY / Math.max(1, track.offsetHeight - innerHeight)) * MAX);
}
addEventListener("scrollend", () =>
  render((scrollY / Math.max(1, track.offsetHeight - innerHeight)) * MAX),
);
function go(index: number, updateHash = true, instant = false) {
  const target = Math.max(0, Math.min(panels.length - 1, index));
  const end = track.offsetHeight - innerHeight;
  if (updateHash) history.pushState(null, "", `#${panels[target].id}`);
  window.scrollTo({
    top: (end * target) / (panels.length - 1),
    behavior: enabled() && !instant ? "smooth" : "instant",
  });
  if (!enabled()) render(target * 1000);
}
motion.onclick = () => {
  paused = !paused;
  try {
    localStorage.setItem("mahesh-scenes-paused", String(paused));
  } catch {}
  buildMotion();
};
reduced.addEventListener("change", buildMotion);
previous.onclick = () => go(active - 1);
next.onclick = () => go(active + 1);
document.addEventListener("click", (event) => {
  const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
    'a[href^="#"]',
  );
  if (
    !anchor ||
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return;
  const index = panels.findIndex(
    (p) => `#${p.id}` === anchor.getAttribute("href"),
  );
  if (index < 0) return;
  event.preventDefault();
  go(index);
});
addEventListener("keydown", (event) => {
  if (
    document.querySelector("dialog[open]") ||
    (event.target as HTMLElement).closest("input,textarea,select,button,a")
  )
    return;
  const offset = ["ArrowDown", "PageDown"].includes(event.key)
    ? 1
    : ["ArrowUp", "PageUp"].includes(event.key)
      ? -1
      : 0;
  if (offset) {
    event.preventDefault();
    go(active + offset);
  }
  if (event.key === "Home") {
    event.preventDefault();
    go(0);
  }
  if (event.key === "End") {
    event.preventDefault();
    go(panels.length - 1);
  }
});
function applyTheme() {
  theme.textContent = root.dataset.theme === "light" ? "☾" : "☀";
  theme.setAttribute(
    "aria-label",
    `Switch to ${root.dataset.theme === "light" ? "dark" : "light"} theme`,
  );
}
theme.onclick = () => {
  root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  applyTheme();
  try {
    localStorage.setItem("mahesh-scenes-theme", root.dataset.theme);
  } catch {}
};
applyTheme();
buildMotion();
if (isReload) {
  const resetScene = () => requestAnimationFrame(() => {
    panels.forEach(panel => { panel.scrollTop = 0; });
    go(0, false, true);
    render(0);
  });
  if (document.readyState === "complete") resetScene();
  else addEventListener("load", resetScene, { once: true });
}
function followHash() {
  const i = panels.findIndex((p) => `#${p.id}` === location.hash);
  if (i >= 0) requestAnimationFrame(() => go(i, false, true));
}
addEventListener("popstate", followHash);
addEventListener("hashchange", followHash);
// Native fragment scrolling cannot target an absolutely positioned scene.
if (location.hash) {
  const initialScene = panels.findIndex(p => `#${p.id}` === location.hash);
  // Resolve the fragment after native anchor positioning and font layout settle.
  const loaded = document.readyState === "complete" ? Promise.resolve() :
    new Promise<void>(resolve => addEventListener("load", () => resolve(), { once: true }));
  Promise.all([loaded, document.fonts.ready]).then(() => requestAnimationFrame(() => {
    fitScenes();
    if (initialScene >= 0) {
      go(initialScene, false, true);
      render(initialScene * 1000);
    }
  }));
}
else if (enabled() && scrollY < 10)
  introduction = createTimeline()
    .add(
      "#hello .copy-bit",
      {
        opacity: [0, 1],
        y: [25, 0],
        duration: 650,
        delay: stagger(65),
        ease: "outExpo",
      },
      0,
    )
    .add(
      "#hello .portrait-card",
      { scale: [0.85, 1], duration: 900, ease: "outBack" },
      100,
    );

const shuffle = document.querySelector<HTMLButtonElement>("#tool-play")!;
shuffle.hidden = false;
let shuffled = false;
shuffle.onclick = () => {
  shuffled = !shuffled;
  playAnimation?.revert();
  if (enabled())
    playAnimation = animate(".tools-art .tool-card", {
      x: [0, (_el, i) => ((i ?? 0) % 2 ? -1 : 1) * 12, 0],
      y: [0, -20, 0],
      rotate: [0, shuffled ? 8 : -8, 0],
      delay: stagger(60),
      duration: 800,
      ease: "inOutSine",
    });
  shuffle.textContent = shuffled
    ? "A good mix of tools ↻"
    : "Shuffle my toolbox ↻";
};
const send = document.querySelector<HTMLButtonElement>("#send-hello")!;
send.hidden = false;
let greeting = 0;
send.onclick = () => {
  const bubble = document.querySelector("#hello-message")!;
  bubble.textContent = [
    "Hello, nice to meet you!",
    "A small hello. A new connection.",
  ][greeting++ % 2];
  playAnimation?.revert();
  if (enabled())
    playAnimation = animate(bubble, {
      scale: [0.8, 1],
      y: [12, 0],
      duration: 500,
      ease: "outBack",
    });
};

const details = {
  journey: {
    title: "A few chapters so far.",
    body: "<h3>911 Fintech Solutions</h3><p>May 2022–June 2026 · Senior Full Stack Developer · Bengaluru</p><p>I worked on merchant onboarding, billing, and chargebacks. My work included Angular screens, Node.js services, MySQL, Redis, tests, and deployments with Jenkins and AWS.</p><h3>Akrivia Automation</h3><p>August 2019–April 2022 · MEAN Stack Developer · Visakhapatnam</p><p>I built responsive web apps and APIs, worked on authentication and data, and deployed applications on AWS and Heroku.</p><h3>Where it started</h3><p>B.Tech in Computer Science at IIIT (RGUKT), RK Valley, 2014–2018. CGPA: 7.9/10.</p>",
  },
  tools: {
    title: "What I work with.",
    body: "<h3>The screen</h3><p>Angular, TypeScript, RxJS, NgRx, and Angular Material.</p><h3>Behind the screen</h3><p>Node.js, Express, REST APIs, MySQL, MongoDB, and Redis.</p><h3>Getting it out there</h3><p>AWS EC2, Jenkins, CI/CD, and RabbitMQ.</p><p>My résumé also includes Python, Hapi, GraphQL, PostgreSQL, MSSQL, GCP, Kafka, Docker, S3, Lambda, and CloudWatch.</p><h3>The way I like to build</h3><p>Simple screens, clear choices, and small details that make an app feel better. That is what Vibe Coder &amp; Stylish UI/UX Designer means to me.</p>",
  },
  chat: {
    title: "Chat System.",
    body: '<p>I built the frontend and backend as one connected project.</p><h3>On the screen</h3><p>An Angular app for private chats, group conversations, and live presence. It uses TypeScript, RxJS, and shared components.</p><h3>Behind it</h3><p>Node.js, Express, and Socket.IO handle the conversations. JWT handles sign-in access; MySQL, MongoDB, and Redis support messages, caching, and events. The backend also includes analytics services and AWS integrations.</p><p><a href="https://maheshpcse.github.io/chat-app/" target="_blank" rel="noopener noreferrer">Open Chat System ↗</a></p>',
  },
  bank: {
    title: "Banking System.",
    body: '<p>I built both the Angular app and the Node.js backend.</p><h3>Everyday banking</h3><p>Account activity, deposits, withdrawals, transfers, card controls, and billing in one application.</p><h3>How it fits together</h3><p>Angular forms and guarded routes connect to Express services. JWT and role-based access control who can do what. MongoDB supports the account data and transaction history.</p><p><a href="https://maheshpcse.github.io/banking-system/" target="_blank" rel="noopener noreferrer">Open Banking System ↗</a></p>',
  },
};
const dialog = document.querySelector<HTMLDialogElement>("#scene-detail")!;
const close = document.querySelector<HTMLButtonElement>("#detail-close")!;
let modalAnimation: ReturnType<typeof animate> | undefined;
let closing = false;
function finishClose() {
  dialog.close();
  root.classList.remove("detail-open");
  closing = false;
}
function closeDetails() {
  if (closing || !dialog.open) return;
  closing = true;
  modalAnimation?.cancel();
  if (!enabled()) {
    finishClose();
    return;
  }
  modalAnimation = animate(dialog, {
    scale: [1, 0.8],
    opacity: [1, 0],
    clipPath: [
      "inset(0% 0% 0% 0% round 20px)",
      "inset(50% 0% 50% 0% round 20px)",
    ],
    duration: 320,
    ease: "inOutCubic",
    onComplete: finishClose,
  });
}
document
  .querySelectorAll<HTMLButtonElement>("[data-detail]")
  .forEach((button) => {
    button.hidden = false;
    button.onclick = () => {
      const detail = details[button.dataset.detail as keyof typeof details];
      if (dialog.open) return;
      modalAnimation?.cancel();
      closing = false;
      document.querySelector("#detail-title")!.textContent = detail.title;
      document.querySelector("#detail-content")!.innerHTML = detail.body;
      dialog.removeAttribute("style");
      dialog.showModal();
      dialog.scrollTop = 0;
      root.classList.add("detail-open");
      if (enabled())
        modalAnimation = animate(dialog, {
          scale: [0.7, 1],
          opacity: [0, 1],
          clipPath: [
            "inset(50% 0% 50% 0% round 20px)",
            "inset(0% 0% 0% 0% round 20px)",
          ],
          duration: 550,
          ease: "outExpo",
        });
    };
  });
close.onclick = closeDetails;
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDetails();
});
reduced.addEventListener("change", () => {
  if (reduced.matches && dialog.open) {
    modalAnimation?.cancel();
    if (closing) finishClose();
    else dialog.removeAttribute("style");
  }
});
addEventListener("pagehide", () => {
  observer?.revert();
  master?.revert();
  introduction?.revert();
  playAnimation?.revert();
  modalAnimation?.cancel();
  if (dialog.open) finishClose();
});
addEventListener("pageshow", (event) => {
  if (event.persisted) buildMotion();
});
