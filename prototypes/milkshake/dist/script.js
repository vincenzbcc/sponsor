const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const cursor = document.getElementById("cursor");
const cursorPreference = window.matchMedia("(hover: hover) and (pointer: fine)");

document.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse" || !cursorPreference.matches) return;
  document.body.classList.add("has-custom-cursor");
  cursor.classList.add("is-visible");
  cursor.classList.toggle("is-action", !!event.target.closest("a, button, summary, .flavor-fruit"));
  cursor.style.setProperty("--cursor-x", event.clientX + "px");
  cursor.style.setProperty("--cursor-y", event.clientY + "px");
});

document.documentElement.addEventListener("pointerleave", () => {
  cursor.classList.remove("is-visible");
  document.body.classList.remove("has-custom-cursor");
});

const flavors = {
  classic: {
    name: "Classico",
    description: "Un milkshake dal gusto morbido del latte. Il Classico mette al centro la cremosità e un finale delicato."
  },
  fragola: {
    name: "Fragola",
    description: "La fragola guida il gusto di questo milkshake. Il suo profilo dolce e fresco si fa sentire fin dal primo sorso, con un finale morbido."
  },
  banana: {
    name: "Banana",
    description: "La banana matura è il riferimento per il gusto più rotondo della linea. La sua dolcezza si sposa con la consistenza cremosa del milkshake."
  },
  mirtillo: {
    name: "Mirtillo",
    description: "Il mirtillo dà carattere alla ricetta. Abbiamo cercato un equilibrio tra il gusto intenso del frutto e una nota fresca sul finale."
  },
  kiwi: {
    name: "Kiwi",
    description: "Il kiwi ispira il gusto più vivace della linea. La sua nota leggermente acidula alleggerisce il finale del milkshake."
  }
};

const showcase = document.querySelector(".flavor-hero");
const assetPath = showcase.dataset.assets;
const flavorButtons = Array.from(showcase.querySelectorAll(".flavor-option"));
const brick = showcase.querySelector(".brick");
const brickMedia = brick.querySelector(".brick-media");
const classicClip = brickMedia.querySelector("video");
const brickHint = brick.querySelector(".brick-hint");
const replayHint = brickHint.textContent;
const detailTitle = showcase.querySelector("#flavor-title");
const description = showcase.querySelector(".flavor-description");
const fruitContainer = showcase.querySelector(".flavor-fruits");
const clips = new Map();
const animationFiles = new Map();
const fruitSets = new Map();
const flavorOrder = Object.keys(flavors);
const fruitFlavors = Object.keys(flavors).filter((key) => key !== "classic");
const localPage = location.protocol === "file:";
// Some Apple players decode VP9 without its transparency. The same frames are also available as WebP.
const useVideo = navigator.vendor !== "Apple Computer, Inc." && !!classicClip.canPlayType('video/webm; codecs="vp9"');

let selected = showcase.dataset.flavor;
let playbackRequest = 0;
let animationUrl;
let autoActive = false;
let autoTimer;
let autoEpoch = 0;
let autoIndex = 0;
let manualSelection = false;
let brickVisible = false;

if (!useVideo) classicClip.remove();

for (const key of Object.keys(flavors)) {
  const still = assetPath + key + "-contour-start.webp";
  const clip = useVideo ? (key === "classic" ? classicClip : document.createElement("video")) : new Image();
  clip.classList.add("flavor-motion");
  clip.setAttribute("aria-hidden", "true");
  if (useVideo) {
    clip.muted = true;
    clip.playsInline = true;
    clip.preload = "auto";
    clip.poster = still;
    clip.src = assetPath + key + "-contour.webm";
  } else {
    clip.alt = "";
    clip.src = still;
    if (!localPage) {
      const file = fetch(assetPath + key + "-contour-animation.webp")
        .then((response) => response.ok ? response.blob() : null)
        .catch(() => null);
      animationFiles.set(key, file);
    }
  }
  if (clip !== classicClip) brickMedia.append(clip);
  clips.set(key, clip);

  const set = document.createElement("div");
  set.className = "flavor-fruit-set";
  const ingredients = key === "classic" ? fruitFlavors : Array(4).fill(key);
  for (const ingredient of ingredients) {
    const fruit = document.createElement("span");
    fruit.className = "flavor-fruit";
    const image = new Image();
    image.src = assetPath + "fruit-" + ingredient + ".webp";
    image.alt = "";
    image.draggable = false;
    fruit.append(image);
    set.append(fruit);
  }
  fruitSets.set(key, set);
  fruitContainer.append(set);
}

function releaseAnimationUrl() {
  if (animationUrl) URL.revokeObjectURL(animationUrl);
  animationUrl = undefined;
}

function playBrick() {
  const clip = clips.get(selected);
  const key = selected;
  const request = ++playbackRequest;
  brickHint.textContent = replayHint;

  if (!useVideo) {
    const source = assetPath + key + "-contour-animation.webp?play=" + request;
    releaseAnimationUrl();
    const cached = animationFiles.get(key);
    if (!cached) {
      clip.src = source;
      return Promise.resolve();
    }
    return cached.then((file) => {
      if (request !== playbackRequest) return;
      if (file) animationUrl = URL.createObjectURL(file);
      clip.src = animationUrl || source;
    });
    return;
  }

  clip.currentTime = 0;
  return clip.play().catch((error) => {
    if (request === playbackRequest && error.name !== "AbortError") {
      brickHint.textContent = "Tocca il brick per riprovare";
    }
  });
}

function stopAuto() {
  autoActive = false;
  ++autoEpoch;
  clearTimeout(autoTimer);
  autoTimer = undefined;
  if (useVideo) clips.get(selected)?.pause();
}

async function playAutoFlavor() {
  const epoch = ++autoEpoch;
  const key = flavorOrder[autoIndex];
  if (key !== selected) renderFlavor(key);
  const playback = playBrick();
  brickHint.textContent = "Anteprima automatica · scegli un gusto";
  await playback;
  if (!autoActive || epoch !== autoEpoch) return;
  autoTimer = setTimeout(() => {
    autoIndex = (autoIndex + 1) % flavorOrder.length;
    playAutoFlavor();
  }, 6000);
}

function startAuto() {
  if (autoActive || manualSelection || !brickVisible || document.hidden || motionPreference.matches) return;
  autoActive = true;
  playAutoFlavor();
}

function renderFlavor(key) {
  fruitSets.get(selected)?.classList.remove("is-visible");
  fruitSets.get(key)?.classList.add("is-visible");
  const previousClip = clips.get(selected);
  if (useVideo) {
    previousClip.pause();
  } else {
    releaseAnimationUrl();
    previousClip.src = assetPath + selected + "-contour-start.webp";
  }
  previousClip.classList.remove("is-visible");
  clips.get(key).classList.add("is-visible");
  selected = key;
  showcase.dataset.flavor = key;
  const flavor = flavors[key];
  detailTitle.textContent = flavor.name;
  brick.setAttribute("aria-label", "Riproduci l'animazione del brick " + flavor.name);
  for (const button of flavorButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.selectFlavor === key));
  }
  description.textContent = flavor.description;
}

for (const button of flavorButtons) {
  button.addEventListener("click", () => {
    manualSelection = true;
    stopAuto();
    const key = button.dataset.selectFlavor;
    if (key !== selected) renderFlavor(key);
    playBrick();
  });
}

brick.addEventListener("click", () => {
  playBrick();
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    brickVisible = entries[0]?.isIntersecting ?? false;
    if (brickVisible) startAuto();
    else if (autoActive) stopAuto();
  }, { threshold: 0.4 });
  observer.observe(brick);
} else {
  brickVisible = true;
  startAuto();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && autoActive) stopAuto();
  else if (!document.hidden) startAuto();
});

function setParallax(event, target, prefix, drift) {
  if (motionPreference.matches || event.pointerType !== "mouse") return;
  const bounds = target.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  target.style.setProperty(prefix + "-x", x * drift + "px");
  target.style.setProperty(prefix + "-y", y * drift + "px");
}

function clearParallax(target, prefix) {
  target.style.removeProperty(prefix + "-x");
  target.style.removeProperty(prefix + "-y");
}

showcase.addEventListener("pointermove", (event) => setParallax(event, showcase, "--drift", 24));
showcase.addEventListener("pointerleave", () => clearParallax(showcase, "--drift"));

fruitContainer.addEventListener("click", (event) => {
  const image = event.target.closest(".flavor-fruit img");
  if (image && !motionPreference.matches) image.classList.add("is-bouncing");
});

fruitContainer.addEventListener("animationend", (event) => {
  event.target.classList.remove("is-bouncing");
});

motionPreference.addEventListener("change", ({ matches }) => {
  if (matches) clearParallax(showcase, "--drift");
  if (matches && autoActive) stopAuto();
  else if (!matches) startAuto();
});

renderFlavor(selected);
