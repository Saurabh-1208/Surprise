"use strict";

/* ================================================================
   Shared state and element references
================================================================ */

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

const state = {
    currentScreen: 1,
    isTransitioning: false,
    yesLocked: false,
    selectedDate: "",
    selectedPlan: "",
    noAttempts: 0,
    noPosition: { x: 0, y: 0 },
    noInitialized: false,
    soundEnabled: true,
    audioContext: null,
    ambientTimer: null,
    typingToken: 0,
    lastFocusedElement: null
};

const elements = {
    game: document.getElementById("game"),
    screens: [...document.querySelectorAll(".screen")],
    progressDots: [...document.querySelectorAll("#progressDots span")],
    particleCanvas: document.getElementById("particleCanvas"),
    burstLayer: document.getElementById("burstLayer"),
    yesBtn: document.getElementById("yesBtn"),
    noBtn: document.getElementById("noBtn"),
    noEscapeZone: document.getElementById("noEscapeZone"),
    pleaseText: document.getElementById("pleaseText"),
    mainCharacterCard: document.getElementById("mainCharacterCard"),
    dateInput: document.getElementById("dateInput"),
    dateContinue: document.getElementById("dateContinue"),
    datePickerCard: document.getElementById("datePickerCard"),
    dateHint: document.getElementById("dateHint"),
    calendarDay: document.getElementById("calendarDay"),
    calendarMonth: document.getElementById("calendarMonth"),
    activityCards: [...document.querySelectorAll(".activity-card")],
    lockBtn: document.getElementById("lockBtn"),
    finalDate: document.getElementById("finalDate"),
    finalPlan: document.getElementById("finalPlan"),
    toMessageBtn: document.getElementById("toMessageBtn"),
    messageBtn: document.getElementById("messageBtn"),
    letterModal: document.getElementById("letterModal"),
    closeLetter: document.getElementById("closeLetter"),
    typedLetter: document.getElementById("typedLetter"),
    soundToggle: document.getElementById("soundToggle"),
    customCursor: document.getElementById("customCursor"),
    cursorGlow: document.getElementById("cursorGlow")
};

const noMessages = [
    "Babe please :( ",
    "Are you sure? 🥺",
    "Hey! I saw that 😭",
    "Wrong button 😂",
    "You really tried that?",
    "Stop chasing me 😭",
    "Just press YES already 💕",
    "I'm faster than you 😌",
    "Nice try 😂"
];

const letterText = `hey you,

you're really cute no matter what.
don't let anyone tell you any different, okay?

you make every ordinary day feel special.

today and every day,
I celebrate you and us.

                         DEAR BABY,
                  YOUR Yashmit Lover  ♥`;

/* ================================================================
   Website bootstrapping
================================================================ */

function initializeWebsite() {
    initializeParticles();
    initializeParallax();
    initializeNoButton();
    initializeDatePicker();
    initializeActivities();
    initializeSound();
    initializeCustomCursor();
    initializeLoveLetter();

    elements.yesBtn.addEventListener("click", animateYesButton);
    elements.toMessageBtn.addEventListener("click", () => changeScreen(5));
    elements.messageBtn.addEventListener("click", showLoveLetter);
    elements.lockBtn.addEventListener("click", lockDate);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            elements.game.classList.add("is-ready");
            positionNoButtonAtStart();
        });
    });

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            if (state.currentScreen === 1) positionNoButtonAtStart();
        });
    }
}

/* ================================================================
   Lightweight canvas atmosphere and celebration bursts
================================================================ */

function initializeParticles() {
    const canvas = elements.particleCanvas;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles = [];
    let bursts = [];
    let animationFrame = 0;
    let lastTime = performance.now();

    const colors = ["#fff5f8", "#ffd2e0", "#ff9bbb", "#fff2ad"];
    const symbols = ["heart", "sparkle", "petal"];

    function resizeParticles() {
        const bounds = elements.game.getBoundingClientRect();
        width = Math.max(1, bounds.width);
        height = Math.max(1, bounds.height);
        pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const count = reducedMotion.matches ? 15 : (width < 600 ? 30 : 50);
        particles = Array.from({ length: count }, createAmbientParticle);
    }

    function createAmbientParticle() {
        const depth = 0.35 + Math.random() * 0.65;
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size: (2.5 + Math.random() * 5.5) * depth,
            speedY: (4 + Math.random() * 10) * depth,
            drift: (Math.random() - 0.5) * 7,
            wobble: Math.random() * Math.PI * 2,
            alpha: 0.2 + Math.random() * 0.48,
            rotation: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.55,
            color: colors[Math.floor(Math.random() * colors.length)],
            symbol: symbols[Math.floor(Math.random() * symbols.length)]
        };
    }

    function drawHeart(x, y, size, color, alpha, rotation = 0) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.scale(size / 18, size / 18);
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(0, 5);
        context.bezierCurveTo(-11, -3, -10, -11, -4, -11);
        context.bezierCurveTo(0, -11, 0, -7, 0, -5);
        context.bezierCurveTo(0, -7, 0, -11, 4, -11);
        context.bezierCurveTo(10, -11, 11, -3, 0, 5);
        context.fill();
        context.restore();
    }

    function drawSparkle(x, y, size, color, alpha, rotation = 0) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.beginPath();
        for (let point = 0; point < 8; point += 1) {
            const radius = point % 2 === 0 ? size : size * 0.24;
            const angle = (Math.PI / 4) * point;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (point === 0) context.moveTo(px, py);
            else context.lineTo(px, py);
        }
        context.closePath();
        context.fill();
        context.restore();
    }

    function drawPetal(x, y, size, color, alpha, rotation = 0) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.scale(1, 0.56);
        context.globalAlpha = alpha;
        context.fillStyle = color;
        context.beginPath();
        context.ellipse(0, 0, size, size * 0.58, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawParticle(particle) {
        if (particle.symbol === "heart") {
            drawHeart(particle.x, particle.y, particle.size * 2.2, particle.color, particle.alpha, particle.rotation);
        } else if (particle.symbol === "sparkle") {
            drawSparkle(particle.x, particle.y, particle.size, particle.color, particle.alpha, particle.rotation);
        } else {
            drawPetal(particle.x, particle.y, particle.size, particle.color, particle.alpha, particle.rotation);
        }
    }

    function animateParticles(time) {
        const delta = Math.min((time - lastTime) / 1000, 0.04);
        lastTime = time;
        context.clearRect(0, 0, width, height);

        for (const particle of particles) {
            particle.y -= particle.speedY * delta;
            particle.x += (particle.drift + Math.sin(time * 0.0007 + particle.wobble) * 3) * delta;
            particle.rotation += particle.spin * delta;

            if (particle.y < -20) {
                particle.y = height + 20;
                particle.x = Math.random() * width;
            }
            if (particle.x < -30) particle.x = width + 20;
            if (particle.x > width + 30) particle.x = -20;
            drawParticle(particle);
        }

        bursts = bursts.filter((particle) => {
            particle.age += delta;
            if (particle.age >= particle.life) return false;
            particle.vy += 130 * delta;
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            particle.rotation += particle.spin * delta;
            particle.alpha = 1 - particle.age / particle.life;
            drawParticle(particle);
            return true;
        });

        animationFrame = requestAnimationFrame(animateParticles);
    }

    window.createCanvasBurst = (x, y, options = {}) => {
        const count = reducedMotion.matches ? Math.min(options.count || 8, 8) : (options.count || 22);
        const kind = options.kind || "heart";
        for (let index = 0; index < count; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const force = 55 + Math.random() * (options.force || 135);
            const symbol = kind === "confetti"
                ? symbols[Math.floor(Math.random() * symbols.length)]
                : (Math.random() > 0.28 ? "heart" : "sparkle");
            bursts.push({
                x,
                y,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force - 42,
                size: 4 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                rotation: Math.random() * Math.PI,
                spin: (Math.random() - 0.5) * 8,
                symbol,
                age: 0,
                life: 0.75 + Math.random() * 0.75
            });
        }
    };

    resizeParticles();
    animationFrame = requestAnimationFrame(animateParticles);

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(resizeParticles);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else {
            lastTime = performance.now();
            animationFrame = requestAnimationFrame(animateParticles);
        }
    });
}

function createDOMBurst(x, y, count = 14) {
    const actualCount = reducedMotion.matches ? Math.min(count, 6) : count;
    const gameRect = elements.game.getBoundingClientRect();
    for (let index = 0; index < actualCount; index += 1) {
        const particle = document.createElement("i");
        const angle = (Math.PI * 2 * index) / actualCount + (Math.random() - 0.5) * 0.35;
        const distance = 55 + Math.random() * 75;
        particle.className = "burst-particle";
        particle.textContent = Math.random() > 0.28 ? "♥" : "✦";
        particle.style.left = `${x - gameRect.left}px`;
        particle.style.top = `${y - gameRect.top}px`;
        particle.style.fontSize = `${9 + Math.random() * 13}px`;
        particle.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
        particle.style.setProperty("--burst-y", `${Math.sin(angle) * distance - 28}px`);
        particle.style.setProperty("--burst-color", ["#fff", "#ff4f86", "#ffd3e1", "#fff1a7"][index % 4]);
        elements.burstLayer.appendChild(particle);
        particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }
}

/* ================================================================
   Mouse parallax, 3D cards, and tilt highlights
================================================================ */

function initializeParallax() {
    const layers = [...document.querySelectorAll(".parallax-layer")];
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };

    window.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || reducedMotion.matches) return;
        pointer.targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        pointer.targetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    }, { passive: true });

    function updateParallax() {
        pointer.x += (pointer.targetX - pointer.x) * 0.055;
        pointer.y += (pointer.targetY - pointer.y) * 0.055;

        if (!reducedMotion.matches) {
            for (const layer of layers) {
                const depth = Number(layer.dataset.depth || 0.1);
                layer.style.setProperty("--parallax-x", `${pointer.x * depth * -42}px`);
                layer.style.setProperty("--parallax-y", `${pointer.y * depth * -30}px`);
            }
        }
        requestAnimationFrame(updateParallax);
    }
    requestAnimationFrame(updateParallax);

    const character = elements.mainCharacterCard;
    character.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || reducedMotion.matches) return;
        const rect = character.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;
        character.style.setProperty("--tilt-y", `${(relativeX - 0.5) * 10}deg`);
        character.style.setProperty("--tilt-x", `${(0.5 - relativeY) * 9}deg`);
        character.querySelector(".card-shine").style.setProperty("--shine-x", `${relativeX * 100}%`);
        character.querySelector(".card-shine").style.setProperty("--shine-y", `${relativeY * 100}%`);
    }, { passive: true });

    character.addEventListener("pointerleave", () => {
        character.style.setProperty("--tilt-x", "-2deg");
        character.style.setProperty("--tilt-y", "2deg");
    });

    document.querySelectorAll(".tilt-card").forEach((card) => initializeTiltCard(card));
}

function initializeTiltCard(card) {
    card.addEventListener("pointermove", (event) => {
        if (!finePointer.matches || reducedMotion.matches) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--card-tilt-y", `${x * 7}deg`);
        card.style.setProperty("--card-tilt-x", `${y * -7}deg`);
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
        card.style.setProperty("--card-tilt-x", "0deg");
        card.style.setProperty("--card-tilt-y", "0deg");
    });
}

/* ================================================================
   Instant, proximity-aware NO button escape system
================================================================ */

function initializeNoButton() {
    const pointer = { x: -1000, y: -1000, previousX: -1000, previousY: -1000, speed: 0 };
    let pointerFrame = 0;
    let resizeFrame = 0;

    const evaluatePointer = () => {
        pointerFrame = 0;
        if (state.currentScreen !== 1 || !state.noInitialized) return;

        const rect = elements.noBtn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
        const detectionRadius = Math.min(145, 118 + pointer.speed * 0.65);

        if (distance < detectionRadius) {
            moveNoButton(pointer.x, pointer.y);
        }
    };

    window.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.speed = Math.min(45, Math.hypot(pointer.x - pointer.previousX, pointer.y - pointer.previousY));
        if (!pointerFrame) pointerFrame = requestAnimationFrame(evaluatePointer);
    }, { passive: true, capture: true });

    elements.noBtn.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") moveNoButton(event.clientX, event.clientY);
    });

    elements.noBtn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveNoButton(event.clientX, event.clientY, true);
    }, { capture: true });

    elements.noBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveNoButton(pointer.x, pointer.y, true);
    });

    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            if (state.currentScreen === 1) positionNoButtonAtStart();
        });
    }, { passive: true });
}

function positionNoButtonAtStart() {
    if (state.currentScreen !== 1) return;
    const zoneRect = elements.noEscapeZone.getBoundingClientRect();
    const yesRect = elements.yesBtn.getBoundingClientRect();
    const buttonRect = elements.noBtn.getBoundingClientRect();
    if (!zoneRect.width || !yesRect.width || !buttonRect.width) return;

    const margin = Math.max(12, Math.min(24, zoneRect.width * 0.035));
    const x = clamp(yesRect.right - zoneRect.left + 22, margin, zoneRect.width - buttonRect.width - margin);
    const y = clamp(
        yesRect.top - zoneRect.top + (yesRect.height - buttonRect.height) / 2,
        64,
        zoneRect.height - buttonRect.height - 74
    );

    state.noPosition = { x, y };
    applyNoPosition();
    state.noInitialized = true;
    elements.noBtn.classList.add("is-positioned");
}

function moveNoButton(cursorX, cursorY, forceMove = false) {
    if (state.currentScreen !== 1 || !state.noInitialized) return;

    const zoneRect = elements.noEscapeZone.getBoundingClientRect();
    const buttonRect = elements.noBtn.getBoundingClientRect();
    const width = buttonRect.width;
    const height = buttonRect.height;
    const safeMargin = Math.max(10, Math.min(22, zoneRect.width * 0.03));
    const bounds = {
        minX: safeMargin,
        maxX: Math.max(safeMargin, zoneRect.width - width - safeMargin),
        minY: Math.max(58, safeMargin),
        maxY: Math.max(60, zoneRect.height - height - Math.max(66, safeMargin))
    };

    const pointerLocalX = Number.isFinite(cursorX) ? cursorX - zoneRect.left : zoneRect.width / 2;
    const pointerLocalY = Number.isFinite(cursorY) ? cursorY - zoneRect.top : zoneRect.height / 2;
    const centerX = state.noPosition.x + width / 2;
    const centerY = state.noPosition.y + height / 2;
    let awayX = centerX - pointerLocalX;
    let awayY = centerY - pointerLocalY;
    let length = Math.hypot(awayX, awayY);

    if (length < 1) {
        awayX = Math.random() > 0.5 ? 1 : -1;
        awayY = Math.random() - 0.5;
        length = Math.hypot(awayX, awayY);
    }
    awayX /= length;
    awayY /= length;

    const obstacleSelectors = [
        ".character-stage",
        ".proposal-title",
        ".proposal-subtitle",
        "#yesBtn",
        "#pleaseText",
        ".sound-toggle",
        ".progress-dots"
    ];
    const obstacles = obstacleSelectors
        .map((selector) => document.querySelector(selector)?.getBoundingClientRect())
        .filter(Boolean)
        .map((rect) => ({
            left: rect.left - zoneRect.left - 10,
            top: rect.top - zoneRect.top - 8,
            right: rect.right - zoneRect.left + 10,
            bottom: rect.bottom - zoneRect.top + 8
        }));

    const candidateIsSafe = (candidate) => {
        const box = {
            left: candidate.x,
            top: candidate.y,
            right: candidate.x + width,
            bottom: candidate.y + height
        };
        return !obstacles.some((obstacle) => rectanglesOverlap(box, obstacle));
    };

    const candidates = [];
    const baseAngle = Math.atan2(awayY, awayX);
    const angleOffsets = [0, .22, -.22, .48, -.48, .82, -.82, 1.2, -1.2];
    const steps = [150, 205, 265, 105];

    for (const step of steps) {
        for (const offset of angleOffsets) {
            const randomness = (Math.random() - 0.5) * 0.16;
            const angle = baseAngle + offset + randomness;
            const candidate = {
                x: clamp(state.noPosition.x + Math.cos(angle) * step, bounds.minX, bounds.maxX),
                y: clamp(state.noPosition.y + Math.sin(angle) * step, bounds.minY, bounds.maxY)
            };
            if (!candidateIsSafe(candidate)) continue;

            const candidateCenterX = candidate.x + width / 2;
            const candidateCenterY = candidate.y + height / 2;
            const cursorDistance = Math.hypot(candidateCenterX - pointerLocalX, candidateCenterY - pointerLocalY);
            const movedDistance = Math.hypot(candidate.x - state.noPosition.x, candidate.y - state.noPosition.y);
            const edgeRoom = Math.min(
                candidate.x - bounds.minX,
                bounds.maxX - candidate.x,
                candidate.y - bounds.minY,
                bounds.maxY - candidate.y
            );
            candidate.score = cursorDistance + movedDistance * 0.3 + Math.min(edgeRoom, 36) * 0.25;
            candidates.push(candidate);
        }
    }

    if (!candidates.length) {
        for (let index = 0; index < 42; index += 1) {
            const candidate = {
                x: bounds.minX + Math.random() * Math.max(1, bounds.maxX - bounds.minX),
                y: bounds.minY + Math.random() * Math.max(1, bounds.maxY - bounds.minY)
            };
            if (!candidateIsSafe(candidate)) continue;
            candidate.score = Math.hypot(candidate.x + width / 2 - pointerLocalX, candidate.y + height / 2 - pointerLocalY);
            candidates.push(candidate);
        }
    }

    let nextPosition;
    if (candidates.length) {
        candidates.sort((a, b) => b.score - a.score);
        nextPosition = candidates[0];
    } else {
        nextPosition = {
            x: pointerLocalX < zoneRect.width / 2 ? bounds.maxX : bounds.minX,
            y: pointerLocalY < zoneRect.height / 2 ? bounds.maxY : bounds.minY
        };
    }

    const hasMoved = Math.hypot(nextPosition.x - state.noPosition.x, nextPosition.y - state.noPosition.y) > 5;
    if (!hasMoved && !forceMove) return;

    state.noPosition = nextPosition;
    applyNoPosition();
    updateNoPersonality();
    elements.noBtn.classList.add("is-escaping");
    window.setTimeout(() => elements.noBtn.classList.remove("is-escaping"), 110);
}

function applyNoPosition() {
    elements.noBtn.style.transform = `translate3d(${state.noPosition.x.toFixed(1)}px, ${state.noPosition.y.toFixed(1)}px, 0)`;
}

function updateNoPersonality() {
    state.noAttempts += 1;

    const messageIndex = state.noAttempts % noMessages.length;
    elements.pleaseText.textContent = noMessages[messageIndex];

    elements.pleaseText.classList.remove("is-reacting");
    requestAnimationFrame(() => elements.pleaseText.classList.add("is-reacting"));
    window.setTimeout(() => elements.pleaseText.classList.remove("is-reacting"), 220);

    const reactions = ["reaction-nervous", "reaction-surprised", "reaction-crying", "reaction-laughing"];
    elements.mainCharacterCard.classList.remove(...reactions);
    const reactionIndex = Math.min(Math.floor((state.noAttempts - 1) / 2), reactions.length - 1);
    elements.mainCharacterCard.classList.add(reactions[reactionIndex]);
}

function rectanglesOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/* ================================================================
   Cinematic scene transitions and YES interaction
================================================================ */

function changeScreen(nextScreenNumber) {
    if (state.isTransitioning || nextScreenNumber === state.currentScreen) return Promise.resolve(false);
    const current = document.getElementById(`screen${state.currentScreen}`);
    const next = document.getElementById(`screen${nextScreenNumber}`);
    if (!current || !next) return Promise.resolve(false);

    state.isTransitioning = true;
    state.currentScreen = nextScreenNumber;
    current.classList.remove("is-active");
    current.classList.add("is-leaving");
    current.setAttribute("aria-hidden", "true");

    next.scrollTop = 0;
    next.setAttribute("aria-hidden", "false");
    next.classList.add("is-active");
    updateProgress(nextScreenNumber);

    if (nextScreenNumber !== 1) elements.noBtn.classList.remove("is-positioned");

    const duration = reducedMotion.matches ? 20 : 720;
    return new Promise((resolve) => {
        window.setTimeout(() => {
            current.classList.remove("is-leaving");
            state.isTransitioning = false;
            runScreenEntrance(nextScreenNumber);
            resolve(true);
        }, duration);
    });
}

function updateProgress(screenNumber) {
    elements.progressDots.forEach((dot, index) => {
        dot.classList.toggle("is-current", index === screenNumber - 1);
    });
}

function runScreenEntrance(screenNumber) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    if (screenNumber === 4) {
        window.createCanvasBurst?.(centerX, centerY * 0.76, { count: 44, force: 190, kind: "confetti" });
        playSound("celebrate");
    }
    if (screenNumber === 5) {
        window.createCanvasBurst?.(centerX, centerY, { count: 16, force: 105, kind: "heart" });
        playSound("message");
    }
}

function animateYesButton() {
    if (state.yesLocked || state.isTransitioning) return;
    state.yesLocked = true;
    const rect = elements.yesBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    elements.yesBtn.classList.add("is-pressed");
    elements.mainCharacterCard.classList.add("reaction-happy");
    elements.noBtn.classList.remove("is-positioned");
    createDOMBurst(x, y, 18);
    window.createCanvasBurst?.(x, y, { count: 24, force: 160, kind: "heart" });
    playSound("yes");

    window.setTimeout(() => {
        elements.yesBtn.classList.remove("is-pressed");
        changeScreen(2);
    }, reducedMotion.matches ? 30 : 470);
}

/* ================================================================
   Date selection
================================================================ */

function initializeDatePicker() {
    const today = getLocalISODate(new Date());
    elements.dateInput.min = today;

    elements.dateInput.addEventListener("input", handleDateSelection);
    elements.dateInput.addEventListener("change", handleDateSelection);
    elements.dateContinue.addEventListener("click", () => {
        if (!isDateValid(elements.dateInput.value)) return;
        state.selectedDate = elements.dateInput.value;
        playSound("soft");
        changeScreen(3);
    });
}

function handleDateSelection() {
    const value = elements.dateInput.value;
    const valid = isDateValid(value);
    const isNewSelection = valid && value !== state.selectedDate;
    state.selectedDate = valid ? value : "";
    elements.dateContinue.disabled = !valid;
    elements.datePickerCard.classList.toggle("has-date", valid);

    if (!valid) {
        elements.calendarDay.textContent = "♥";
        elements.calendarMonth.textContent = "OUR DAY";
        elements.dateHint.textContent = value ? "Let's choose today or a future day 💕" : "Only future adventures are allowed ✨";
        return;
    }

    const date = parseLocalDate(value);
    elements.calendarDay.textContent = String(date.getDate()).padStart(2, "0");
    elements.calendarMonth.textContent = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    elements.dateHint.textContent = "Perfect. That day already feels special ♥";
    if (isNewSelection) {
        const rect = elements.datePickerCard.getBoundingClientRect();
        window.createCanvasBurst?.(rect.left + rect.width / 2, rect.top + rect.height / 2, { count: 12, force: 75 });
        playSound("select");
    }
}

function isDateValid(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= getLocalISODate(new Date());
}

function getLocalISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
}

/* ================================================================
   Activity selection and lock celebration
================================================================ */

function initializeActivities() {
    elements.activityCards.forEach((card) => {
        card.setAttribute("aria-pressed", "false");
        card.addEventListener("click", () => selectActivity(card));
    });
}

function selectActivity(selectedCard) {
    elements.activityCards.forEach((card) => {
        const isSelected = card === selectedCard;
        card.classList.toggle("is-selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
    });

    state.selectedPlan = selectedCard.dataset.activity || selectedCard.textContent.trim();
    elements.lockBtn.disabled = false;
    const rect = selectedCard.getBoundingClientRect();
    window.createCanvasBurst?.(rect.right - 28, rect.top + 28, { count: 9, force: 62 });
    playSound("select");
}

function lockDate() {
    if (!state.selectedPlan || !state.selectedDate || state.isTransitioning || elements.lockBtn.classList.contains("is-locking")) return;

    elements.lockBtn.classList.add("is-locking", "is-pressed");
    elements.lockBtn.disabled = true;
    const buttonRect = elements.lockBtn.getBoundingClientRect();
    window.createCanvasBurst?.(buttonRect.left + buttonRect.width / 2, buttonRect.top + buttonRect.height / 2, { count: 26, force: 140, kind: "confetti" });
    createDOMBurst(buttonRect.left + buttonRect.width / 2, buttonRect.top + buttonRect.height / 2, 15);
    playSound("lock");

    elements.finalDate.textContent = parseLocalDate(state.selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    elements.finalPlan.textContent = state.selectedPlan;

    window.setTimeout(() => {
        elements.lockBtn.classList.remove("is-pressed");
        changeScreen(4);
    }, reducedMotion.matches ? 40 : 620);
}

/* ================================================================
   Love note window and typing animation
================================================================ */

function initializeLoveLetter() {
    elements.closeLetter.addEventListener("click", closeLoveLetter);
    elements.letterModal.addEventListener("pointerdown", (event) => {
        if (event.target === elements.letterModal) closeLoveLetter();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && elements.letterModal.classList.contains("is-open")) {
            closeLoveLetter();
            return;
        }

        if (event.key === "Tab" && elements.letterModal.classList.contains("is-open")) {
            event.preventDefault();
            elements.closeLetter.focus();
        }
    });
}

function showLoveLetter() {
    if (elements.letterModal.classList.contains("is-open")) return;
    state.lastFocusedElement = document.activeElement;
    elements.letterModal.classList.add("is-open");
    elements.letterModal.setAttribute("aria-hidden", "false");
    elements.typedLetter.textContent = "";
    playSound("letter");

    window.setTimeout(() => {
        elements.closeLetter.focus({ preventScroll: true });
        typeLoveLetter();
    }, reducedMotion.matches ? 0 : 360);
}

function closeLoveLetter() {
    if (!elements.letterModal.classList.contains("is-open")) return;
    state.typingToken += 1;
    elements.letterModal.classList.remove("is-open");
    elements.letterModal.setAttribute("aria-hidden", "true");
    if (state.lastFocusedElement instanceof HTMLElement) {
        state.lastFocusedElement.focus({ preventScroll: true });
    }
}

function typeLoveLetter() {
    state.typingToken += 1;
    const token = state.typingToken;
    if (reducedMotion.matches) {
        elements.typedLetter.textContent = letterText;
        return;
    }

    const start = performance.now();
    let lastVisibleCharacters = -1;
    const millisecondsPerCharacter = 20;

    function typeFrame(time) {
        if (token !== state.typingToken || !elements.letterModal.classList.contains("is-open")) return;
        const visibleCharacters = Math.min(letterText.length, Math.floor((time - start) / millisecondsPerCharacter));
        if (visibleCharacters !== lastVisibleCharacters) {
            elements.typedLetter.textContent = letterText.slice(0, visibleCharacters);
            lastVisibleCharacters = visibleCharacters;
        }
        if (visibleCharacters < letterText.length) requestAnimationFrame(typeFrame);
    }
    requestAnimationFrame(typeFrame);
}

/* ================================================================
   Optional Web Audio ambience and gentle UI sounds
================================================================ */

function initializeSound() {
    const bgMusic = document.getElementById("bgMusic");

    async function startMusic() {
        if (state.soundEnabled && bgMusic) {
            bgMusic.volume = 0.35;
            await bgMusic.play().catch(() => {});
        }
    }

    // Start music after the user's first interaction
    document.addEventListener("click", startMusic, { once: true });

    elements.soundToggle.addEventListener("click", async () => {
        state.soundEnabled = !state.soundEnabled;

        elements.soundToggle.setAttribute(
            "aria-pressed",
            String(state.soundEnabled)
        );

        elements.soundToggle.querySelector(".sound-icon").textContent =
            state.soundEnabled ? "🔊" : "🔇";

        elements.soundToggle.setAttribute(
            "aria-label",
            state.soundEnabled
                ? "Turn romantic sounds off"
                : "Turn romantic sounds on"
        );

        if (state.soundEnabled) {
            ensureAudioContext();
            await state.audioContext?.resume();

            if (bgMusic) {
                bgMusic.volume = 0.35;
                await bgMusic.play().catch(() => {});
            }

            playSound("toggle");
        } else {
            if (bgMusic) bgMusic.pause();
            stopAmbientMusic();
        }
    });
}

function ensureAudioContext() {
    if (state.audioContext) return state.audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    state.audioContext = new AudioContextClass();
    return state.audioContext;
}

function playSound(name) {
    if (!state.soundEnabled) return;
    const audio = ensureAudioContext();
    if (!audio) return;

    const soundMap = {
        toggle: [[523.25, .08, .03], [659.25, .12, .024]],
        soft: [[493.88, .1, .018]],
        select: [[659.25, .08, .025], [783.99, .13, .018]],
        yes: [[523.25, .11, .035], [659.25, .16, .03], [783.99, .22, .025]],
        lock: [[392, .08, .028], [523.25, .16, .026]],
        celebrate: [[523.25, .14, .026], [659.25, .2, .026], [783.99, .27, .022]],
        message: [[783.99, .13, .025], [987.77, .23, .02]],
        letter: [[440, .15, .018], [554.37, .24, .016]]
    };
    const notes = soundMap[name] || soundMap.soft;
    const now = audio.currentTime;
    notes.forEach(([frequency, duration, volume], index) => {
        scheduleTone(frequency, now + index * 0.065, duration, volume, "sine");
    });
}

function scheduleTone(frequency, startTime, duration, volume, type = "sine") {
    const audio = state.audioContext;
    if (!audio || !state.soundEnabled) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), startTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
}

function startAmbientMusic() {
    stopAmbientMusic();
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    let noteIndex = 0;

    const playAmbientNote = () => {
        if (!state.soundEnabled || !state.audioContext) return;
        const now = state.audioContext.currentTime;
        scheduleTone(notes[noteIndex % notes.length], now, 1.3, .008, "sine");
        scheduleTone(notes[(noteIndex + 2) % notes.length] / 2, now, 1.7, .004, "triangle");
        noteIndex += 1;
        state.ambientTimer = window.setTimeout(playAmbientNote, 1750);
    };
    playAmbientNote();
}

function stopAmbientMusic() {
    if (state.ambientTimer) window.clearTimeout(state.ambientTimer);
    state.ambientTimer = null;
}

/* ================================================================
   GPU-transformed desktop cursor
================================================================ */

function initializeCustomCursor() {
    if (!finePointer.matches || reducedMotion.matches) return;
    elements.game.classList.add("has-custom-cursor");
    const pointer = { x: -100, y: -100, cursorX: -100, cursorY: -100, glowX: -100, glowY: -100 };

    window.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
    }, { passive: true });

    window.addEventListener("pointerout", (event) => {
        if (!event.relatedTarget) {
            pointer.x = -100;
            pointer.y = -100;
        }
    }, { passive: true });

    document.addEventListener("pointerover", (event) => {
        const target = event.target instanceof Element ? event.target.closest("button, input, .tilt-card") : null;
        elements.customCursor.classList.toggle("is-hovering", Boolean(target));
        elements.customCursor.classList.toggle("is-happy", Boolean(event.target instanceof Element && event.target.closest("#yesBtn")));
    }, { passive: true });

    function renderCursor() {
        pointer.cursorX += (pointer.x - pointer.cursorX) * 0.34;
        pointer.cursorY += (pointer.y - pointer.cursorY) * 0.34;
        pointer.glowX += (pointer.x - pointer.glowX) * 0.12;
        pointer.glowY += (pointer.y - pointer.glowY) * 0.12;
        const cursorSize = elements.customCursor.classList.contains("is-happy") ? 38 : (elements.customCursor.classList.contains("is-hovering") ? 34 : 25);
        elements.customCursor.style.transform = `translate3d(${(pointer.cursorX - cursorSize / 2).toFixed(1)}px, ${(pointer.cursorY - cursorSize / 2).toFixed(1)}px, 0)`;
        elements.cursorGlow.style.transform = `translate3d(${(pointer.glowX - 37).toFixed(1)}px, ${(pointer.glowY - 37).toFixed(1)}px, 0)`;
        requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);
}

initializeWebsite();
