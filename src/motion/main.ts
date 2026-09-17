import { initEngine } from "./engine";
import {
  animate,
  createTimeline,
  createScope,
  stagger,
  onScroll,
  svg,
} from "animejs";

const root = document.documentElement;
// A refresh begins at the introduction; new section links still open directly.
const navigation = performance.getEntriesByType("navigation")[0] as
  | PerformanceNavigationTiming
  | undefined;
if (navigation?.type === "reload") {
  const restoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  if (location.hash)
    history.replaceState(history.state, "", location.pathname + location.search);
  const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  resetScroll();
  addEventListener("pageshow", (event) => {
    if (!event.persisted) requestAnimationFrame(() => {
      resetScroll();
      history.scrollRestoration = restoration;
    });
  }, { once: true });
}
const themeButton = document.querySelector<HTMLButtonElement>("#motion-theme")!;
const motionButton =
  document.querySelector<HTMLButtonElement>("#motion-toggle")!;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
let manualPause = false;
try {
  manualPause = localStorage.getItem("mahesh-motion-paused") === "true";
} catch {}
const motionAllowed = () => !manualPause && !reduced.matches;
function applyTheme(theme: string) {
  root.dataset.theme = theme;
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
  );
  themeButton.textContent = theme === "dark" ? "☀" : "☾";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#14131b" : "#f2efe9");
}
applyTheme(root.dataset.theme || "dark");
themeButton.hidden = false;
themeButton.onclick = () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(theme);
  try {
    localStorage.setItem("mahesh-motion-theme", theme);
  } catch {}
};

let scope: ReturnType<typeof createScope> | undefined;
let loopObserver: IntersectionObserver | undefined;
let demoAnimation: ReturnType<typeof animate> | undefined;
let messageAnimation: ReturnType<typeof animate> | undefined;
let remixAnimation: ReturnType<typeof animate> | undefined;
let filterAnimation: ReturnType<typeof animate> | undefined;
let pointerAnimation: ReturnType<typeof animate> | undefined;
let enterOnce = true;
const heroArt = document.querySelector<HTMLElement>(".hero-art")!;
function configureMotion() {
  loopObserver?.disconnect();
  scope?.revert();
  demoAnimation?.revert();
  messageAnimation?.revert();
  remixAnimation?.revert();
  filterAnimation?.revert();
  pointerAnimation?.revert();
  document.querySelector<HTMLButtonElement>("#transfer-demo")!.disabled = false;
  document.querySelector("#transfer-status")!.textContent =
    "Account → authorization → billing";
  root.dataset.motion = motionAllowed() ? "on" : "off";
  motionButton.textContent = reduced.matches
    ? "Reduced motion"
    : manualPause
      ? "Play motion"
      : "Pause motion";
  motionButton.setAttribute("aria-pressed", String(!motionAllowed()));
  motionButton.disabled = reduced.matches;
  if (!motionAllowed()) return;
  scope = createScope().add(() => {
    if (enterOnce && !location.hash) {
      createTimeline({ defaults: { ease: "outExpo", duration: 1100 } })
        .add(
          ".title-line",
          { y: [65, 0], opacity: [0, 1], delay: stagger(130) },
          0,
        )
        .add(
          ".intro-item",
          { y: [24, 0], opacity: [0, 1], delay: stagger(100) },
          300,
        )
        .add(
          ".bloom",
          {
            scale: [0.72, 1],
            opacity: [0, 1],
            rotate: [-35, 0],
            duration: 1600,
          },
          150,
        );
    }
    enterOnce = false;
    const rotation = animate(".bloom-lines", {
      rotate: [0, 360],
      duration: 90000,
      ease: "linear",
      loop: true,
    });
    const pulse = animate(".bloom-spark", {
      scale: [1, 0.75],
      rotate: [0, 90],
      duration: 3200,
      alternate: true,
      ease: "inOutSine",
      loop: true,
    });
    loopObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        rotation.resume();
        pulse.resume();
      } else {
        rotation.pause();
        pulse.pause();
      }
    });
    loopObserver.observe(heroArt);
    document
      .querySelectorAll<HTMLElement>(
        ".section-heading, .manifesto-bottom, .work-copy, .timeline article, .design-note, .contact-row",
      )
      .forEach((element) => {
        animate(element, {
          y: [35, 0],
          duration: 850,
          ease: "outExpo",
          autoplay: onScroll({
            target: element,
            enter: "bottom-=40 top",
            repeat: false,
          }),
        });
      });
    animate(".big-asterisk", {
      rotate: [0, 120],
      ease: "linear",
      autoplay: onScroll({
        target: "#manifesto",
        enter: "bottom top",
        leave: "top bottom",
        sync: true,
      }),
    });
    animate(".timeline-track i", {
      scaleY: [0, 1],
      ease: "linear",
      autoplay: onScroll({
        target: ".timeline",
        enter: "bottom center",
        leave: "center bottom",
        sync: true,
      }),
    });
    animate(svg.createDrawable(".transfer-line"), {
      draw: ["0 0", "0 1"],
      duration: 1600,
      ease: "inOutQuad",
      autoplay: onScroll({
        target: ".bank-work",
        enter: "bottom top",
        repeat: false,
      }),
    });
    animate(".chat-study", {
      rotate: [-3, 1],
      y: [20, -15],
      ease: "linear",
      autoplay: onScroll({
        target: ".chat-work",
        enter: "bottom top",
        leave: "top bottom",
        sync: true,
      }),
    });
    animate(".bank-card", {
      rotate: [-8, 3],
      y: [16, -8],
      ease: "linear",
      autoplay: onScroll({
        target: ".bank-work",
        enter: "bottom top",
        leave: "top bottom",
        sync: true,
      }),
    });
  });
}
motionButton.hidden = false;
motionButton.onclick = () => {
  manualPause = !manualPause;
  try {
    localStorage.setItem("mahesh-motion-paused", String(manualPause));
  } catch {}
  configureMotion();
};
reduced.addEventListener("change", configureMotion);
configureMotion();

const remix = document.querySelector<HTMLButtonElement>("#remix")!;
remix.hidden = false;
let remixCount = 0;
remix.onclick = () => {
  remixCount++;
  remixAnimation?.cancel();
  const petals = document.querySelectorAll<SVGEllipseElement>(".petal");
  const radius = remixCount % 2 ? 130 : 74;
  if (motionAllowed())
    remixAnimation = animate(petals, {
      rx: radius,
      duration: 1100,
      delay: stagger(35, { from: "center" }),
      ease: "outElastic(1, .6)",
    });
  else petals.forEach((p) => p.setAttribute("rx", String(radius)));
  remix.setAttribute(
    "aria-label",
    `Remix the geometric artwork, variation ${remixCount + 1}`,
  );
};
heroArt.addEventListener("pointermove", (event) => {
  if (!motionAllowed() || !finePointer.matches || event.pointerType === "touch")
    return;
  const box = heroArt.getBoundingClientRect();
  pointerAnimation?.cancel();
  pointerAnimation = animate(".art-note", {
    x: (event.clientX - box.left - box.width / 2) * 0.035,
    y: (event.clientY - box.top - box.height / 2) * 0.035,
    duration: 650,
    ease: "outExpo",
  });
});
heroArt.addEventListener("pointerleave", () => {
  if (!motionAllowed()) return;
  pointerAnimation?.cancel();
  pointerAnimation = animate(".art-note", {
    x: 0,
    y: 0,
    duration: 650,
    ease: "outExpo",
  });
});

const send = document.querySelector<HTMLButtonElement>("#send-demo")!;
send.hidden = false;
let messageIndex = 0;
const messages = [
  "Hello, connection made. ✓",
  "From an idea to an interface. ✓",
  "Good systems bring people together. ✓",
];
send.onclick = () => {
  const bubble = document.querySelector<HTMLElement>("#message-demo")!;
  bubble.textContent = messages[messageIndex++ % messages.length];
  if (motionAllowed()) {
    messageAnimation?.revert();
    messageAnimation = animate(bubble, {
      y: [14, 0],
      scale: [0.94, 1],
      duration: 500,
      ease: "outExpo",
    });
  }
};
const transfer = document.querySelector<HTMLButtonElement>("#transfer-demo")!;
const transferStatus = document.querySelector<HTMLElement>("#transfer-status")!;
transfer.hidden = false;
transfer.onclick = () => {
  demoAnimation?.revert();
  if (!motionAllowed()) {
    transferStatus.textContent =
      "Demo complete: account → authorization → billing. No money is moved.";
    return;
  }
  transfer.disabled = true;
  transferStatus.textContent = "Following the connection…";
  demoAnimation = animate(".transfer-dot", {
    ...svg.createMotionPath(".transfer-line"),
    duration: 1800,
    ease: "inOutSine",
    onComplete: () => {
      transfer.disabled = false;
      transferStatus.textContent =
        "Demo complete: account → authorization → billing. No money is moved.";
    },
  });
};
const filters = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
filters.forEach((button) => {
  button.hidden = false;
  button.onclick = () => {
    filterAnimation?.revert();
    const selected = button.dataset.filter;
    filters.forEach((b) =>
      b.setAttribute("aria-pressed", String(b === button)),
    );
    const cards = [...document.querySelectorAll<HTMLElement>(".tool-card")];
    cards.forEach(
      (card) =>
        (card.hidden = selected !== "all" && card.dataset.layer !== selected),
    );
    const visible = cards.filter((card) => !card.hidden);
    document.querySelector("#tool-status")!.textContent =
      `${visible.length} connections · ${button.textContent}. Additional resume-listed skills include Python, Hapi, GraphQL, PostgreSQL, MSSQL, GCP, Kafka, and Docker.`;
    if (motionAllowed())
      filterAnimation = animate(visible, {
        y: [16, 0],
        scale: [0.97, 1],
        delay: stagger(45),
        duration: 450,
        ease: "outExpo",
      });
  };
});

const progress = document.querySelector<HTMLElement>(".page-progress")!;
function updateProgress() {
  const maximum = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${maximum > 0 ? Math.min(1, scrollY / maximum) : 0})`;
}
addEventListener("scroll", updateProgress, { passive: true });
addEventListener("resize", updateProgress);
new ResizeObserver(updateProgress).observe(document.body);
updateProgress();
addEventListener("pagehide", () => {
  loopObserver?.disconnect();
  scope?.revert();
  demoAnimation?.revert();
  messageAnimation?.revert();
  remixAnimation?.revert();
  filterAnimation?.revert();
  pointerAnimation?.revert();
});
addEventListener("pageshow", (event) => {
  if (event.persisted) configureMotion();
});

initEngine();
