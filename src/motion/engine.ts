import { animate, createTimeline, onScroll, stagger } from "animejs";

export function initEngine() {
  const root = document.documentElement;
  const enabled = () => root.dataset.motion === "on";
  const compact = matchMedia("(max-width: 760px), (max-height: 700px)");
  const layers = [...document.querySelectorAll<SVGGElement>(".engine-layer")];
  const slider = document.querySelector<HTMLInputElement>("#engine-scrub")!;
  const toggle = document.querySelector<HTMLButtonElement>("#engine-toggle")!;
  const followButton =
    document.querySelector<HTMLButtonElement>("#engine-scroll")!;
  const stateLabel = document.querySelector("#engine-state")!;
  let progress = 0;
  let following = true;
  let scroll: ReturnType<typeof onScroll> | undefined;
  let driver: ReturnType<typeof animate> | undefined;
  const state = { value: 0 };
  const assembly = createTimeline({ autoplay: false });
  layers.forEach((layer, index) =>
    assembly.add(
      layer,
      {
        x: [(index - 1.5) * 30, (index - 1.5) * 180],
        duration: 1000,
        ease: "inOutCubic",
      },
      0,
    ),
  );
  assembly.add(
    ".engine-disc",
    { scaleX: [1, 0.55], duration: 1000, ease: "inOutCubic" },
    0,
  );
  assembly.add(".disc-label", { opacity: [0, 1], duration: 350 }, 650);
  function render(value: number) {
    progress = Math.max(0, Math.min(100, value));
    assembly.seek(progress * 10);
    slider.value = String(Math.round(progress));
    toggle.setAttribute("aria-expanded", String(progress > 50));
    toggle.innerHTML =
      progress > 50
        ? "Close the system <span>↙</span>"
        : "Open the system <span>↗</span>";
    stateLabel.textContent = `${progress < 5 ? "ASSEMBLED" : progress > 95 ? "OPEN SYSTEM" : "CONNECTING"} / ${String(Math.round(progress)).padStart(2, "0")}%`;
  }
  function setFollow(value: boolean) {
    following = value;
    followButton.setAttribute("aria-pressed", String(value));
    followButton.textContent = value ? "Following scroll" : "Follow scroll";
  }
  function move(value: number) {
    driver?.cancel();
    setFollow(false);
    if (!enabled()) {
      render(value);
      return;
    }
    state.value = progress;
    driver = animate(state, {
      value,
      duration: 1200,
      ease: "inOutCubic",
      onUpdate: () => render(state.value),
    });
  }
  function configure() {
    driver?.cancel();
    scroll?.revert();
    const scrolling = enabled() && !compact.matches;
    root.classList.toggle("engine-scroll-enabled", scrolling);
    followButton.hidden = !scrolling;
    if (scrolling)
      scroll = onScroll({
        target: "#engine-track",
        enter: "top top+=100",
        leave: "bottom bottom",
        onUpdate: (observer) => {
          if (!following) return;
          const t = observer.progress;
          render(t < 0.5 ? t * 200 : (1 - t) * 200);
        },
      });
    render(progress);
  }
  document.querySelector<HTMLElement>(".engine-controls")!.hidden = false;
  toggle.onclick = () => move(progress > 50 ? 0 : 100);
  slider.oninput = () => {
    driver?.cancel();
    setFollow(false);
    render(Number(slider.value));
  };
  followButton.onclick = () => {
    setFollow(!following);
    if (following) {
      driver?.cancel();
      configure();
    }
  };
  const descriptions = [
    "Angular, TypeScript, and RxJS turn workflows into responsive interfaces.",
    "Node.js and Express connect authentication, business logic, and real-time events.",
    "MySQL, MongoDB, and Redis support structured data, message history, and caching.",
    "AWS EC2 and Jenkins connect tested changes to application delivery.",
  ];
  document
    .querySelectorAll<HTMLButtonElement>("[data-layer-detail]")
    .forEach((button) => {
      button.hidden = false;
      button.onclick = () => {
        const index = Number(button.dataset.layerDetail);
        document
          .querySelectorAll("[data-layer-detail]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        layers.forEach((layer, i) =>
          layer.classList.toggle("layer-selected", i === index),
        );
        document.querySelector("#engine-description")!.textContent =
          descriptions[index];
        move(100);
      };
    });
  const modeObserver = new MutationObserver(configure);
  modeObserver.observe(root, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  compact.addEventListener("change", configure);
  configure();

  const dialog = document.querySelector<HTMLDialogElement>("#project-story")!;
  const closeButton =
    document.querySelector<HTMLButtonElement>("#story-close")!;
  let storyTimeline: ReturnType<typeof createTimeline> | undefined;
  let closing = false;
  const stories = {
    chat: {
      title: "Chat System",
      kicker: "01 / CONVERSATIONS, CONNECTED",
      intro:
        "A message looks simple. Behind it, an interface, authenticated services, and persistent data work together.",
      rows: [
        [
          "01 / INTERFACE",
          "Angular, TypeScript, and RxJS",
          "Private conversations, group messaging, shared components, and live presence.",
        ],
        [
          "02 / SERVICES",
          "Node.js, Express, and Socket.IO",
          "JWT authentication and primary and analytics services connect real-time events.",
        ],
        [
          "03 / DATA",
          "MySQL, MongoDB, and Redis",
          "Message history, caching, pub/sub, and event-driven notifications.",
        ],
      ],
      front: "chat-app",
      back: "chat-system",
    },
    bank: {
      title: "Banking System",
      kicker: "02 / EVERY TRANSACTION, CONNECTED",
      intro:
        "An account view is the beginning. Follow the layers that connect an interface to authenticated banking and billing workflows.",
      rows: [
        [
          "01 / INTERFACE",
          "Angular, TypeScript, and RxJS",
          "Reactive forms, guarded routes, account activity, and financial operations.",
        ],
        [
          "02 / SERVICES",
          "Node.js, Express, and JWT",
          "Role-based access for deposits, withdrawals, peer transfers, and billing.",
        ],
        [
          "03 / DATA",
          "MongoDB and transaction history",
          "Account workflows, card controls, and a connected record of activity.",
        ],
      ],
      front: "banking-system",
      back: "banking-system-server",
    },
  };
  function finishClose() {
    dialog.close();
    root.classList.remove("story-open");
    closing = false;
  }
  function closeStory() {
    if (closing || !dialog.open) return;
    closing = true;
    storyTimeline?.cancel();
    if (!enabled()) {
      finishClose();
      return;
    }
    storyTimeline = createTimeline({ onComplete: finishClose })
      .add(
        ".story-shutters i",
        {
          scaleY: [0, 1],
          duration: 470,
          delay: stagger(35, { from: "center" }),
          ease: "inOutCubic",
        },
        0,
      )
      .add(
        ".story-shell",
        { opacity: [1, 0], y: [0, -18], duration: 240 },
        130,
      );
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-project]")
    .forEach((button) => {
      button.hidden = false;
      button.onclick = () => {
        const story = stories[button.dataset.project as keyof typeof stories];
        if (!story || dialog.open) return;
        storyTimeline?.cancel();
        closing = false;
        document.querySelector("#story-title")!.textContent = story.title;
        document.querySelector("#story-kicker")!.textContent = story.kicker;
        document.querySelector("#story-intro")!.textContent = story.intro;
        document.querySelector("#story-layers")!.innerHTML = story.rows
          .map(
            ([label, title, copy]) =>
              `<article class="story-row"><p class="eyebrow">${label}</p><h3>${title}</h3><p>${copy}</p></article>`,
          )
          .join("");
        document.querySelector("#story-links")!.innerHTML =
          `<a class="pill primary" href="https://maheshpcse.github.io/${story.front}/" target="_blank" rel="noopener noreferrer">Open live app ↗</a><a href="https://github.com/maheshpcse/${story.front}" target="_blank" rel="noopener noreferrer">Frontend ↗</a><a href="https://github.com/maheshpcse/${story.back}" target="_blank" rel="noopener noreferrer">Backend ↗</a>`;
        dialog.showModal();
        dialog.scrollTop = 0;
        root.classList.add("story-open");
        if (!enabled()) {
          document
            .querySelector<HTMLElement>(".story-shell")!
            .removeAttribute("style");
          document
            .querySelectorAll<HTMLElement>(".story-shutters i")
            .forEach((el) => (el.style.transform = "scaleY(0)"));
          return;
        }
        storyTimeline = createTimeline()
          .add(
            ".story-shutters i",
            {
              scaleY: [1, 0],
              duration: 700,
              delay: stagger(45, { from: "center" }),
              ease: "inOutCubic",
            },
            0,
          )
          .add(
            ".story-shell",
            { opacity: [0, 1], y: [25, 0], duration: 600, ease: "outExpo" },
            230,
          )
          .add(
            ".story-row",
            { x: [45, 0], duration: 650, delay: stagger(90), ease: "outExpo" },
            400,
          );
      };
    });
  closeButton.onclick = closeStory;
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeStory();
  });
  const dialogMode = new MutationObserver(() => {
    if (enabled() || !dialog.open) return;
    storyTimeline?.revert();
    if (closing) finishClose();
    else {
      document
        .querySelector<HTMLElement>(".story-shell")!
        .removeAttribute("style");
      document
        .querySelectorAll<HTMLElement>(".story-shutters i")
        .forEach((el) => (el.style.transform = "scaleY(0)"));
    }
  });
  dialogMode.observe(root, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });
  addEventListener("pagehide", () => {
    driver?.cancel();
    scroll?.revert();
    storyTimeline?.cancel();
    if (dialog.open) finishClose();
  });
  addEventListener("pageshow", (event) => {
    if (event.persisted) configure();
  });
}
