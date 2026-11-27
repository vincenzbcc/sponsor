(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // 1. Navigazione mobile essenziale e stato dello header allo scorrimento
    const header = document.querySelector("[data-header]");
    const navToggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector("#site-nav");

    if (navToggle && nav) {
        root.classList.add("js-nav");
        navToggle.hidden = false;

        const closeMenu = () => {
            navToggle.setAttribute("aria-expanded", "false");
            nav.classList.remove("is-open");
        };

        navToggle.addEventListener("click", () => {
            const expanded = navToggle.getAttribute("aria-expanded") === "true";
            navToggle.setAttribute("aria-expanded", String(!expanded));
            nav.classList.toggle("is-open", !expanded);
        });

        for (const link of nav.querySelectorAll("a")) {
            link.addEventListener("click", closeMenu);
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMenu();
        });
    }

    const syncHeaderState = () => {
        if (!header) return;
        header.classList.toggle("is-scrolled", window.scrollY > 48);
    };

    window.addEventListener("scroll", syncHeaderState, { passive: true });
    syncHeaderState();

    // 2. Movimenti discreti su fotografie e testi, rispettando prefers-reduced-motion
    const revealNodes = Array.from(document.querySelectorAll("[data-reveal]"));

    if (!reducedMotion.matches && "IntersectionObserver" in window) {
        root.classList.add("motion-ready");

        const observer = new IntersectionObserver(
            (entries, obs) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add("is-visible");
                    obs.unobserve(entry.target);
                }
            },
            {
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.15
            }
        );

        for (const node of revealNodes) {
            observer.observe(node);
        }
    } else {
        for (const node of revealNodes) {
            node.classList.add("is-visible");
        }
    }

    reducedMotion.addEventListener("change", (event) => {
        if (event.matches) {
            root.classList.remove("motion-ready");
            for (const node of revealNodes) {
                node.classList.add("is-visible");
            }
        }
    });

    setupWineExperience(reducedMotion);

    // 4. Gestione cortese del modulo di contatto
    const contactForm = document.querySelector("[data-contact-form]");
    const formStatus = document.querySelector("[data-form-status]");

    if (contactForm && formStatus) {
        contactForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(contactForm);
            const guestName = String(data.get("name") || "").trim();
            formStatus.textContent = guestName
                ? `Grazie ${guestName}, abbiamo registrato il tuo messaggio. Ti risponderemo al più presto.`
                : "Grazie, abbiamo registrato il tuo messaggio. Ti risponderemo al più presto.";
            contactForm.reset();
        });
    }
})();

function setupWineExperience(reducedMotion) {
    const wines = {
        rosso: {
            hoverEnd: 62, glass: 76, right: 22, left: 45,
            name: "Vespera Rosso",
            chapters: [
                ["La scelta dei grappoli", "Seguiamo la maturazione tra i filari e assaggiamo gli acini. Per il Rosso cerchiamo grappoli integri e ben maturi."],
                ["Il tempo in cantina", "Assaggiamo il Rosso durante l’affinamento e gli diamo il tempo di trovare equilibrio."],
                ["La cura della bottiglia", "Custodiamo il Rosso al riparo dalla luce diretta e dagli sbalzi di temperatura."]
            ],
            notes: [
                ["Al primo sorso", "Il vino prende aria nel calice e il profumo emerge poco a poco."],
                ["Il colore del Rosso", "Un rubino scuro che cambia mentre il vino scorre lungo il vetro."],
                ["Il riposo in cantina", "Prima di aprire la bottiglia, lasciamo che il Rosso trovi equilibrio al fresco e al riparo dalla luce."],
                ["A tavola", "È il vino che apriamo con calma, quando c’è tempo per stare insieme."]
            ]
        },
        bianco: {
            hoverEnd: 78, glass: 59, right: 21, left: 45,
            name: "Vespera Bianco",
            chapters: [
                ["L’equilibrio dell’uva bianca", "Assaggiamo gli acini per scegliere il momento in cui maturità e freschezza si incontrano."],
                ["Il tempo di affinamento", "Torniamo ad assaggiare il Bianco durante il riposo, seguendo come evolve il profumo del frutto."],
                ["Custodire il Bianco", "Teniamo le bottiglie al fresco, protette dalla luce e dalle variazioni di temperatura."]
            ],
            notes: [
                ["La luce nel calice", "Il vino prende un riflesso dorato quando si muove vicino alla luce."],
                ["Un sorso fresco", "Lo serviamo fresco, lasciando al profumo il tempo di aprirsi."],
                ["Il riposo in cantina", "Custodiamo il Bianco lontano dalla luce diretta e lo rinfreschiamo prima di servirlo."],
                ["A tavola", "Ci piace versarlo all’inizio, quando in tavola arrivano i primi piatti."]
            ]
        },
        rosato: {
            hoverEnd: 76, glass: 76, right: 22, left: 40,
            name: "Vespera Rosato",
            chapters: [
                ["L’uva per il Rosato", "Scegliamo grappoli integri, nel momento in cui il frutto maturo conserva ancora vivacità."],
                ["La cura durante il riposo", "Assaggiamo il Rosato durante l’affinamento per seguire l’evoluzione dei suoi profumi."],
                ["Custodire il Rosato", "Le bottiglie riposano al fresco e lontano dalla luce diretta fino al momento di servirle."]
            ],
            notes: [
                ["Il colore del Rosato", "La luce attraversa il vino e lascia sul vetro un riflesso rosa."],
                ["Il calice si muove", "Una lieve oscillazione libera il profumo, mentre il vino torna a posarsi nella coppa."],
                ["Il riposo in cantina", "Lasciamo riposare il Rosato al fresco finché arriva il momento di portarlo in tavola."],
                ["A tavola", "Lo versiamo fresco quando la cena comincia all’aperto e la sera è ancora lunga."]
            ]
        }
    };

    const selection = document.querySelector(".wine-selection");
    const experience = document.querySelector(".wine-experience");
    const cards = Array.from(selection.querySelectorAll(".wine-card"));
    const title = experience.querySelector("#wine-experience-title");
    const chapters = Array.from(experience.querySelectorAll(".wine-chapters li"));
    const bottleSection = experience.querySelector(".wine-sequence-bottle");
    const journey = experience.querySelector(".wine-journey");
    const stage = journey.querySelector(".wine-stage");
    const route = journey.querySelector(".wine-route");
    const trail = stage.querySelector(".wine-glass-trail");
    const svg = route.querySelector("svg");
    const path = svg.querySelector("path");
    const notes = Array.from(route.querySelectorAll("li"));
    const fruits = Array.from(trail.querySelectorAll(".wine-grapes img"));
    const portraitPhone = window.matchMedia("(max-width: 600px) and (orientation: portrait)");
    const menuLinks = document.querySelector(".wine-menu-links");

    const clamp = (number) => Math.min(1, Math.max(0, number));
    const mix = (a, b, progress) => a + (b - a) * progress;
    const smooth = (progress) => progress * progress * (3 - 2 * progress);
    const scenes = {
        bottiglia: { width: 172, height: 540, columns: 8, slots: 16 },
        calice: { width: 340, height: 540, columns: 4, slots: 8 }
    };
    const photos = [
        "foto%20vigna.jpg",
        "bottiglie/{vino}/sequenze/uva.webp",
        "botti%20vino.jpg",
        "foto%20tavola.jpg"
    ];
    const canvases = {
        bottiglia: experience.querySelector("[data-wine-bottle]"),
        calice: stage.querySelector("[data-wine-glass]")
    };
    const contexts = Object.fromEntries(Object.entries(canvases).map(([scene, canvas]) => [
        scene, canvas.getContext("2d")
    ]));
    canvases.calice.width = scenes.calice.width;
    canvases.calice.height = scenes.calice.height;
    const sheetCache = new Map();
    const lastPaint = new Map();
    let selected;
    let update = 0;
    let geometry;
    let displayedTurn;
    let lastTick = 0;
    const pourVideo = stage.querySelector("[data-wine-pour]");
    const completedPours = new Set();
    let activePour = null;

    function sheetFor(wine, scene, page) {
        const url = `bottiglie/${wine}/animazione/${scene}-${String(page).padStart(2, "0")}.webp`;
        const existing = sheetCache.get(url);
        if (existing) return existing;
        const image = new Image();
        const entry = { image, ready: false, scene };
        sheetCache.set(url, entry);
        image.src = url;
        image.decode().then(() => {
            entry.ready = true;
            schedule();
        }).catch(() => {});
        return entry;
    }

    function getFrame(wine, scene, frame, count) {
        const { columns, slots, width, height } = scenes[scene];
        const page = Math.floor(frame / slots);
        const last = Math.floor((count - 1) / slots);
        const sheet = sheetFor(wine, scene, page);
        if (page < last) sheetFor(wine, scene, page + 1);
        if (page > 0) sheetFor(wine, scene, page - 1);
        const index = frame % slots;
        if (!sheet.ready) return null;
        return [sheet.image, index % columns * width, Math.floor(index / columns) * height, width, height];
    }

    function paint(scene, index, count, angle = 0, zoom = 1) {
        const position = Math.max(0, Math.min(count - 1, index));
        const frame = Math.floor(position);
        const fraction = Math.round((position - frame) * 12) / 12;
        const canvas = canvases[scene];
        const signature = `${selected.key}|${frame}|${fraction}|${canvas.width}|${canvas.height}|${angle.toFixed(3)}|${zoom.toFixed(3)}`;
        if (lastPaint.get(scene) === signature) return;
        const source = getFrame(selected.key, scene, frame, count);
        if (!source) return;
        const next = fraction && frame + 1 < count ? getFrame(selected.key, scene, frame + 1, count) : null;
        const context = contexts[scene];
        const { width, height } = canvas;
        context.clearRect(0, 0, width, height);
        let destination = [0, 0, width, height];
        context.save();
        if (scene === "bottiglia") {
            const w = scenes.bottiglia.width;
            const h = scenes.bottiglia.height;
            const sin = Math.abs(Math.sin(angle));
            const cos = Math.abs(Math.cos(angle));
            const fit = Math.min(width / (w * cos + h * sin), height / (h * cos + w * sin));
            const natural = Math.min(height / h, width / w);
            const scale = Math.min(fit, natural * zoom) * .98;
            context.translate(width / 2, height / 2);
            context.rotate(angle);
            destination = [-w * scale / 2, -h * scale / 2, w * scale, h * scale];
        }
        context.globalAlpha = next ? 1 - fraction : 1;
        context.drawImage(...source, ...destination);
        if (next) {
            // Interpolate premultiplied color and alpha together, including the glass rim.
            context.globalCompositeOperation = "lighter";
            context.globalAlpha = fraction;
            context.drawImage(...next, ...destination);
        }
        context.restore();
        if (!fraction || next) lastPaint.set(scene, signature);
        else lastPaint.delete(scene);
    }

    function setupPreview(card) {
        const key = card.dataset.wine;
        const count = wines[key].hoverEnd + 1;
        const root = card.querySelector(".wine-preview");
        const button = card.querySelector(".wine-choice");
        const canvas = document.createElement("canvas");
        canvas.width = scenes.bottiglia.width;
        canvas.height = scenes.bottiglia.height;
        canvas.className = "wine-preview-motion";
        canvas.setAttribute("aria-hidden", "true");
        canvas.hidden = true;
        root.append(canvas);
        const context = canvas.getContext("2d");
        let request = 0;
        let progress = 0;
        let direction = 1;
        let previous = 0;
        let shown = -1;

        function stop() {
            cancelAnimationFrame(request);
            request = 0;
            canvas.hidden = true;
        }

        function animate(time) {
            const elapsed = previous ? Math.min(50, time - previous) : 0;
            previous = time;
            const frame = Math.round(mix(24, count - 1, progress));
            const source = getFrame(key, "bottiglia", frame, count);
            if (source) {
                if (frame !== shown || canvas.hidden) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(...source, 0, 0, canvas.width, canvas.height);
                    canvas.hidden = false;
                    shown = frame;
                }
                progress = clamp(progress + direction * elapsed / 1100);
                if (progress === 1 && frame === count - 1) direction = -1;
            }
            if (!progress && direction < 0) {
                stop();
                return;
            }
            request = requestAnimationFrame(animate);
        }

        function enter() {
            if (reducedMotion.matches) return;
            direction = 1;
            if (request) return;
            progress = 0;
            previous = 0;
            request = requestAnimationFrame(animate);
        }

        function leave() {
            direction = -1;
        }

        root.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") enter(); });
        root.addEventListener("pointerleave", event => { if (event.pointerType !== "touch") leave(); });
        root.addEventListener("click", enter);
        button.addEventListener("focus", enter);
        button.addEventListener("blur", leave);
        reducedMotion.addEventListener("change", stop);
        button.hidden = false;
        button.addEventListener("click", () => selectWine(key, button));
    }

    function selectWine(key, button) {
        finishPour(false);
        const sameWine = selected?.button === button;
        selected?.button.setAttribute("aria-expanded", "false");
        if (sameWine) {
            experience.hidden = true;
            menuLinks.hidden = true;
            selected = undefined;
            return;
        }

        for (const [url, sheet] of sheetCache) if (sheet.scene !== "bottiglia") sheetCache.delete(url);
        lastPaint.clear();
        for (const scene of Object.keys(contexts)) {
            const canvas = canvases[scene];
            contexts[scene].clearRect(0, 0, canvas.width, canvas.height);
        }
        selected = { key, button, wine: wines[key] };
        displayedTurn = undefined;
        menuLinks.hidden = false;
        button.setAttribute("aria-expanded", "true");
        experience.dataset.wine = key;
        title.textContent = selected.wine.name;
        canvases.bottiglia.setAttribute("aria-label", `Bottiglia di ${selected.wine.name}`);
        pourVideo.setAttribute("aria-label", `Mescita di ${selected.wine.name}`);
        if (!reducedMotion.matches && !completedPours.has(key)) {
            pourVideo.src = `bottiglie/${key}/video/mescita-demo.mp4`;
            pourVideo.load();
        }
        canvases.calice.setAttribute("aria-label", `Calice di ${selected.wine.name}`);

        for (const [items, copy] of [[chapters, selected.wine.chapters], [notes, selected.wine.notes]]) {
            items.forEach((item, index) => {
                item.querySelector("h4").textContent = copy[index][0];
                item.querySelector("p").textContent = copy[index][1];
            });
        }

        const grapes = `bottiglie/${key}/sequenze/uva.webp`;
        for (const fruit of fruits) fruit.src = grapes;
        notes.forEach((note, index) => {
            const photo = note.querySelector("img");
            photo.src = photos[index].replace("{vino}", key);
            photo.classList.toggle("wine-route-grape", index === 1);
        });
        experience.hidden = false;
        measure();
        getFrame(key, "bottiglia", 0, selected.wine.hoverEnd + 1);
        getFrame(key, "calice", 0, selected.wine.glass);
        title.focus({ preventScroll: true });
        title.scrollIntoView({ block: "start", behavior: "instant" });
        schedule();
    }

    function measure() {
        if (!selected) return;
        const stageHeight = stage.clientHeight;
        const routeBounds = route.getBoundingClientRect();
        const width = routeBounds.width;
        const ratio = Math.min(devicePixelRatio || 1, 1.6);
        const bottle = canvases.bottiglia;
        if (!width || !bottle.clientWidth || !bottle.clientHeight) return;
        const drawWidth = Math.round(bottle.clientWidth * ratio);
        const drawHeight = Math.round(bottle.clientHeight * ratio);
        if (bottle.width !== drawWidth || bottle.height !== drawHeight) {
            bottle.width = drawWidth;
            bottle.height = drawHeight;
            lastPaint.delete("bottiglia");
        }

        const stops = notes.map((note, index) => {
            const box = note.getBoundingClientRect();
            return {
                x: width * (index % 2 ? .73 : .27),
                y: box.top - routeBounds.top + box.height / 2,
                fade: box.height * .68
            };
        });
        const points = [{ x: width / 2, y: 0 }, ...stops];
        const line = stops.reduce((data, point, index) => {
            const previous = points[index];
            return data + ` C ${previous.x} ${mix(previous.y, point.y, 1 / 3)}, ${point.x} ${mix(previous.y, point.y, 2 / 3)}, ${point.x} ${point.y}`;
        }, `M ${points[0].x} 0`);
        svg.setAttribute("viewBox", `0 0 ${width} ${routeBounds.height}`);
        path.setAttribute("d", line);
        geometry = {
            width,
            stageHeight,
            top: parseFloat(getComputedStyle(document.querySelector(".site-header")).height),
            bottleTravel: Math.max(1, bottleSection.offsetHeight - bottleSection.firstElementChild.offsetHeight),
            points,
            stops
        };
        if (activePour) {
            activePour.scrollY = Math.max(0, window.scrollY + journey.getBoundingClientRect().top - geometry.top);
            window.scrollTo({ top: activePour.scrollY, behavior: "instant" });
        }
        schedule();
    }

    function renderBottle(wine, progress) {
        const back = wine.hoverEnd;
        const incline = smooth(clamp((progress - .36) / .27));
        const flip = smooth(clamp((progress - .65) / .35));
        const frontToBack = smooth(clamp(progress / .35));
        const frame = progress < .65 ? back * frontToBack : mix(back, 0, flip);
        paint("bottiglia", frame, back + 1, incline * .73, mix(.92, 1.06, incline));

        chapters.forEach((chapter, index) => {
            const cuts = [.32, .68];
            const active = progress < cuts[0] ? 0 : progress < cuts[1] ? 1 : 2;
            const distance = Math.min(Math.abs(progress - cuts[0]), Math.abs(progress - cuts[1]));
            chapter.style.opacity = index === active ? .30 + .70 * clamp(distance / .055) : 0;
        });
    }

    function renderRoute(wine, distance, cameraY) {
        const { width, stageHeight, points, stops } = geometry;
        const next = stops.findIndex((point) => distance < point.y);
        const section = next < 0 ? stops.length - 1 : next;
        const from = points[section];
        const to = points[section + 1];
        const part = clamp((distance - from.y) / (to.y - from.y));
        const x = mix(from.x, to.x, smooth(part));
        const y = cameraY + Math.min(0, to.y - distance);
        const routeScale = portraitPhone.matches ? 1.32 : width < 760 ? .85 : .56;
        const scale = mix(1, routeScale, smooth(clamp(distance / (stageHeight * .52))));
        canvases.calice.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
        const frames = [0, wine.left, wine.right, wine.left, wine.right];
        paint("calice", mix(frames[section], frames[section + 1], smooth(part)), wine.glass);
        trail.style.setProperty("--trail-opacity", clamp(distance / (stageHeight * .29)));

        notes.forEach((note, index) => {
            const stop = stops[index];
            const visible = smooth(clamp(1 - Math.abs(distance - stop.y) / stop.fade));
            note.style.setProperty("--scene-opacity", visible.toFixed(3));
            note.style.setProperty("--scene-shift", `${(1 - visible) * 20}px`);
        });
    }

    function follow(previous, target, elapsed) {
        if (previous === undefined || Math.abs(previous - target) > .22) return target;
        if (Math.abs(target - previous) < .0006) return target;
        schedule();
        return mix(previous, target, 1 - Math.exp(-elapsed / 46));
    }

    function finishPour(remember = true) {
        const playback = activePour;
        if (!playback) return;
        activePour = null;
        playback.events.abort();
        clearTimeout(playback.timeout);
        if (remember) completedPours.add(playback.key);
        pourVideo.pause();
        pourVideo.hidden = true;
        document.documentElement.classList.remove("is-pouring");
        trail.hidden = false;
        schedule();
    }

    function startPour(worldTop, headerHeight) {
        const source = `bottiglie/${selected.key}/video/mescita-demo.mp4`;
        if (pourVideo.getAttribute("src") !== source) pourVideo.src = source;
        const playback = {
            key: selected.key,
            scrollY: Math.max(0, window.scrollY + worldTop - headerHeight),
            events: new AbortController()
        };
        activePour = playback;
        document.documentElement.classList.add("is-pouring");
        window.scrollTo({ top: playback.scrollY, behavior: "instant" });
        trail.hidden = true;
        pourVideo.hidden = false;
        const options = { signal: playback.events.signal };
        const finish = () => { if (activePour === playback) finishPour(); };
        pourVideo.addEventListener("ended", finish, options);
        pourVideo.addEventListener("error", finish, options);
        // A missing or stalled clip must not leave the visit locked.
        playback.timeout = setTimeout(finish, 14000);
        pourVideo.play().catch(finish);
    }

    function draw(now) {
        update = 0;
        if (!selected || !geometry) return;
        const { wine } = selected;
        const elapsed = Math.min(65, Math.max(1, now - lastTick));
        lastTick = now;
        if (reducedMotion.matches) {
            finishPour(false);
            trail.hidden = false;
            pourVideo.hidden = true;
            paint("bottiglia", 0, wine.hoverEnd + 1);
            paint("calice", 0, wine.glass);
            return;
        }

        const bottle = bottleSection.getBoundingClientRect();
        const world = journey.getBoundingClientRect();
        const routeTop = route.getBoundingClientRect().top;
        const { top, stageHeight, bottleTravel } = geometry;
        if (bottle.bottom > top && bottle.top < window.innerHeight) {
            displayedTurn = follow(displayedTurn, clamp((top - bottle.top) / bottleTravel), elapsed);
            renderBottle(wine, displayedTurn);
        }
        if (world.bottom <= top || world.top >= window.innerHeight) return;

        if (activePour) return;
        const center = stageHeight / 2;
        const distance = top + center - routeTop;
        if (!completedPours.has(selected.key) && world.top <= top + 1) {
            startPour(world.top, top);
            return;
        }
        trail.hidden = !completedPours.has(selected.key);
        const stickyTop = Math.min(top, world.bottom - stageHeight);
        renderRoute(wine, Math.max(0, distance), top + center - stickyTop);
    }

    function schedule() {
        if (!update) update = requestAnimationFrame(draw);
    }

    for (const card of cards) setupPreview(card);
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            if (!reducedMotion.matches) for (const card of cards) {
                const key = card.dataset.wine;
                getFrame(key, "bottiglia", 24, wines[key].hoverEnd + 1);
            }
            observer.disconnect();
        }, { rootMargin: "250px" });
        observer.observe(selection);
    }

    journey.addEventListener("pointermove", (event) => {
        if (trail.hidden || reducedMotion.matches || event.pointerType === "touch") return;
        const bounds = stage.getBoundingClientRect();
        const x = clamp((event.clientX - bounds.left) / bounds.width) - .5;
        const y = clamp((event.clientY - bounds.top) / bounds.height) - .5;
        fruits.forEach((fruit, index) => {
            const side = index % 2 ? -1 : 1;
            fruit.style.setProperty("--fruit-transform", `translate(${x * 42 * side}px, ${y * 32}px)`);
        });
    });
    journey.addEventListener("pointerleave", () => {
        for (const fruit of fruits) fruit.style.removeProperty("--fruit-transform");
    });

    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(route);
    window.addEventListener("scroll", () => {
        if (activePour && Math.abs(window.scrollY - activePour.scrollY) > 1) {
            window.scrollTo({ top: activePour.scrollY, behavior: "instant" });
        }
        schedule();
    }, { passive: true });
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", measure);
}
