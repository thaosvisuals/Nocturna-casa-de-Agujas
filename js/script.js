const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const header = document.querySelector(".site-header");
const pageTexture = document.querySelector(".page-texture");
const revealItems = document.querySelectorAll("[data-reveal]");
const jitterItems = document.querySelectorAll("[data-jitter]");
const hoverDistortionItems = document.querySelectorAll(".button, .poster, .paper-card, .collage-fragment, .symbol-chip, .site-nav a");
const textJitterItems = document.querySelectorAll(".brand-mark, h1, h2, .section-tag, .poster-kicker, .quote-mark");
const glitchItems = document.querySelectorAll(".poster, .manifesto-article, .symbol-board, .collage-fragment");
const yearTarget = document.querySelector("#current-year");
const backLink = document.querySelector("[data-go-back]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const compactViewportQuery = window.matchMedia("(max-width: 900px)");
const rootElement = document.documentElement;
const rootStyle = rootElement.style;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const lowPowerDevice = Boolean(
    connection?.saveData ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);

const parallaxState = {
    pointerX: 0,
    pointerY: 0,
    scrollDepth: 0,
    pageX: 0,
    pageY: 0,
    noiseX: 0,
    noiseY: 0,
    grainX: 0,
    grainY: 0,
    copyX: 0,
    copyY: 0,
    wrinkleX: 0,
    wrinkleY: 0,
    collageX: 0,
    collageY: 0
};

let isPerformanceLite = false;
let parallaxFrame = 0;
let textJitterTimer = 0;
let textJitterResetTimer = 0;
let copyGlitchTimer = 0;
let copyGlitchResetTimer = 0;
let scrollFrame = 0;
let scrollStateTimer = 0;
let isHeaderCondensed = false;

const addMediaChangeListener = (query, listener) => {
    if ("addEventListener" in query) {
        query.addEventListener("change", listener);
        return;
    }

    query.addListener(listener);
};

const computePerformanceMode = () => {
    isPerformanceLite = lowPowerDevice || compactViewportQuery.matches;
    rootElement.classList.toggle("is-performance-lite", isPerformanceLite);
};

const canRunAtmosphericMotion = () => !reducedMotionQuery.matches && !isPerformanceLite;
const canRunParallax = () => canRunAtmosphericMotion() && Boolean(pageTexture) && finePointerQuery.matches;
const canRunHoverDistortion = () => canRunAtmosphericMotion() && finePointerQuery.matches;

const resetParallaxVariables = () => {
    [
        "--parallax-page-x",
        "--parallax-page-y",
        "--parallax-noise-x",
        "--parallax-noise-y",
        "--parallax-grain-x",
        "--parallax-grain-y",
        "--parallax-copy-x",
        "--parallax-copy-y",
        "--parallax-wrinkle-x",
        "--parallax-wrinkle-y",
        "--parallax-collage-x",
        "--parallax-collage-y"
    ].forEach((property) => {
        rootStyle.setProperty(property, "0px");
    });
};

const resetParallaxState = () => {
    Object.keys(parallaxState).forEach((key) => {
        parallaxState[key] = 0;
    });
};

const stopParallax = () => {
    if (parallaxFrame) {
        window.cancelAnimationFrame(parallaxFrame);
        parallaxFrame = 0;
    }
};

const updateScrollDepth = () => {
    const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    parallaxState.scrollDepth = Math.min(window.scrollY / scrollRange, 1);
};

const clearHoverEffect = (element) => {
    element.classList.remove("is-hover-distorted");
    element.style.setProperty("--hover-x", "0px");
    element.style.setProperty("--hover-y", "0px");
    element.style.setProperty("--hover-rotate", "0deg");
    element.style.setProperty("--button-hover-x", "0px");
    element.style.setProperty("--button-hover-y", "0px");
    element.style.setProperty("--button-hover-rotate", "0deg");
    element.style.setProperty("--nav-hover-x", "0px");
    element.style.setProperty("--nav-hover-y", "0px");
    element.style.setProperty("--chip-hover-x", "0px");
    element.style.setProperty("--chip-hover-y", "0px");
};

const clearTextJitterNow = () => {
    window.clearTimeout(textJitterTimer);
    window.clearTimeout(textJitterResetTimer);

    textJitterItems.forEach((item) => {
        item.style.setProperty("--text-jitter-x", "0em");
        item.style.setProperty("--text-jitter-y", "0em");
        item.classList.remove("is-text-jittering");
    });
};

const clearCopyGlitchNow = () => {
    window.clearTimeout(copyGlitchTimer);
    window.clearTimeout(copyGlitchResetTimer);
    pageTexture?.classList.remove("is-copy-glitch");
    glitchItems.forEach((item) => item.classList.remove("is-copy-glitch"));
};

const clearAtmosphericEffects = () => {
    stopParallax();
    resetParallaxState();
    resetParallaxVariables();
    clearTextJitterNow();
    clearCopyGlitchNow();
    hoverDistortionItems.forEach((item) => clearHoverEffect(item));
};

if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
}

if (backLink) {
    backLink.addEventListener("click", (event) => {
        event.preventDefault();

        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        const topTarget = document.querySelector("#top");
        if (topTarget) {
            topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

computePerformanceMode();

if (menuToggle && siteNav) {
    const closeMenu = () => {
        menuToggle.setAttribute("aria-expanded", "false");
        siteNav.classList.remove("is-open");
    };

    menuToggle.addEventListener("click", () => {
        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isExpanded));
        siteNav.classList.toggle("is-open", !isExpanded);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeMenu();
        }
    });
}

jitterItems.forEach((item, index) => {
    const rotation = (Math.random() * 5 - 2.5).toFixed(2);
    const shift = (Math.random() * 18 - 9).toFixed(0);
    const delay = (index * 0.22).toFixed(2);

    item.style.setProperty("--tilt", `${rotation}deg`);
    item.style.setProperty("--shift", `${shift}px`);
    item.style.setProperty("--delay", `${delay}s`);
});

const stepParallax = () => {
    parallaxFrame = 0;

    if (!canRunParallax()) {
        resetParallaxState();
        resetParallaxVariables();
        return;
    }

    const targets = {
        pageX: parallaxState.pointerX * 2.4,
        pageY: parallaxState.pointerY * 1.8 - parallaxState.scrollDepth * 5,
        noiseX: parallaxState.pointerX * 4.2,
        noiseY: parallaxState.pointerY * 3.6 - parallaxState.scrollDepth * 7,
        grainX: parallaxState.pointerX * -2.8,
        grainY: parallaxState.pointerY * -2.2 + parallaxState.scrollDepth * 4,
        copyX: parallaxState.pointerX * 1.8,
        copyY: parallaxState.pointerY * 1.4 - parallaxState.scrollDepth * 2.6,
        wrinkleX: parallaxState.pointerX * 0.9,
        wrinkleY: parallaxState.pointerY * 0.7 - parallaxState.scrollDepth * 1.8,
        collageX: parallaxState.pointerX * 2.2,
        collageY: parallaxState.pointerY * 1.8 - parallaxState.scrollDepth * 3
    };
    const smoothing = 0.14;

    let maxDelta = 0;

    Object.entries(targets).forEach(([key, value]) => {
        const nextValue = parallaxState[key] + (value - parallaxState[key]) * smoothing;
        maxDelta = Math.max(maxDelta, Math.abs(nextValue - value));
        parallaxState[key] = nextValue;
    });

    rootStyle.setProperty("--parallax-page-x", `${parallaxState.pageX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-page-y", `${parallaxState.pageY.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-noise-x", `${parallaxState.noiseX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-noise-y", `${parallaxState.noiseY.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-grain-x", `${parallaxState.grainX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-grain-y", `${parallaxState.grainY.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-copy-x", `${parallaxState.copyX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-copy-y", `${parallaxState.copyY.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-wrinkle-x", `${parallaxState.wrinkleX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-wrinkle-y", `${parallaxState.wrinkleY.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-collage-x", `${parallaxState.collageX.toFixed(2)}px`);
    rootStyle.setProperty("--parallax-collage-y", `${parallaxState.collageY.toFixed(2)}px`);

    if (maxDelta > 0.08) {
        parallaxFrame = window.requestAnimationFrame(stepParallax);
    }
};

const scheduleParallax = () => {
    if (!canRunParallax()) {
        return;
    }

    if (!parallaxFrame) {
        parallaxFrame = window.requestAnimationFrame(stepParallax);
    }
};

const scheduleTextJitter = () => {
    window.clearTimeout(textJitterTimer);

    if (!canRunAtmosphericMotion() || !textJitterItems.length) {
        return;
    }

    textJitterTimer = window.setTimeout(() => {
        if (document.hidden || !canRunAtmosphericMotion()) {
            scheduleTextJitter();
            return;
        }

        const target = textJitterItems[Math.floor(Math.random() * textJitterItems.length)];
        const nudgeX = (Math.random() * 0.04 - 0.02).toFixed(3);
        const nudgeY = (Math.random() * 0.03 - 0.015).toFixed(3);

        target.style.setProperty("--text-jitter-x", `${nudgeX}em`);
        target.style.setProperty("--text-jitter-y", `${nudgeY}em`);
        target.classList.add("is-text-jittering");

        textJitterResetTimer = window.setTimeout(() => {
            target.style.setProperty("--text-jitter-x", "0em");
            target.style.setProperty("--text-jitter-y", "0em");
            target.classList.remove("is-text-jittering");
            scheduleTextJitter();
        }, 90);
    }, 5200 + Math.random() * 5200);
};

const scheduleCopyGlitch = () => {
    window.clearTimeout(copyGlitchTimer);

    if (!canRunAtmosphericMotion() || !pageTexture || !glitchItems.length) {
        return;
    }

    copyGlitchTimer = window.setTimeout(() => {
        if (document.hidden || !canRunAtmosphericMotion()) {
            scheduleCopyGlitch();
            return;
        }

        const target = glitchItems[Math.floor(Math.random() * glitchItems.length)];
        const duration = 70 + Math.random() * 70;

        pageTexture.classList.add("is-copy-glitch");
        target.classList.add("is-copy-glitch");

        copyGlitchResetTimer = window.setTimeout(() => {
            pageTexture.classList.remove("is-copy-glitch");
            target.classList.remove("is-copy-glitch");
            scheduleCopyGlitch();
        }, duration);
    }, 11000 + Math.random() * 9000);
};

const applyScrollEffects = () => {
    scrollFrame = 0;
    const shouldCondense = window.scrollY > 24;

    if (header && shouldCondense !== isHeaderCondensed) {
        header.classList.toggle("is-condensed", shouldCondense);
        isHeaderCondensed = shouldCondense;
    }

    if (!canRunParallax()) {
        return;
    }

    updateScrollDepth();
    scheduleParallax();
};

const scheduleScrollEffects = () => {
    if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(applyScrollEffects);
    }
};

const markScrolling = () => {
    rootElement.classList.add("is-scrolling");
    window.clearTimeout(scrollStateTimer);
    scrollStateTimer = window.setTimeout(() => {
        rootElement.classList.remove("is-scrolling");
    }, 130);
};

window.addEventListener("scroll", () => {
    markScrolling();
    scheduleScrollEffects();
}, { passive: true });

window.addEventListener("resize", () => {
    scheduleScrollEffects();
});

if (pageTexture) {
    if (canRunParallax()) {
        updateScrollDepth();
    }

    window.addEventListener("pointermove", (event) => {
        if (!canRunParallax()) {
            return;
        }

        const offsetX = event.clientX / window.innerWidth - 0.5;
        const offsetY = event.clientY / window.innerHeight - 0.5;

        parallaxState.pointerX = offsetX * 2;
        parallaxState.pointerY = offsetY * 2;
        scheduleParallax();
    }, { passive: true });

    document.addEventListener("mouseout", (event) => {
        if (event.relatedTarget || !canRunParallax()) {
            return;
        }

        parallaxState.pointerX = 0;
        parallaxState.pointerY = 0;
        scheduleParallax();
    });
}

hoverDistortionItems.forEach((item) => {
    const updateHoverEffect = (event) => {
        if (!canRunHoverDistortion()) {
            return;
        }

        const rect = item.getBoundingClientRect();
        const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
        const ratioY = (event.clientY - rect.top) / rect.height - 0.5;

        item.classList.add("is-hover-distorted");

        if (item.matches(".button")) {
            item.style.setProperty("--button-hover-x", `${(ratioX * 2.2).toFixed(2)}px`);
            item.style.setProperty("--button-hover-y", `${(ratioY * 1.8).toFixed(2)}px`);
            item.style.setProperty("--button-hover-rotate", `${(ratioX * 0.45).toFixed(2)}deg`);
            return;
        }

        if (item.matches(".site-nav a")) {
            item.style.setProperty("--nav-hover-x", `${(ratioX * 1.4).toFixed(2)}px`);
            item.style.setProperty("--nav-hover-y", `${(ratioY * 1.2).toFixed(2)}px`);
            return;
        }

        if (item.matches(".symbol-chip")) {
            item.style.setProperty("--chip-hover-x", `${(ratioX * 1.5).toFixed(2)}px`);
            item.style.setProperty("--chip-hover-y", `${(ratioY * 1.3).toFixed(2)}px`);
            return;
        }

        item.style.setProperty("--hover-x", `${(ratioX * 2.6).toFixed(2)}px`);
        item.style.setProperty("--hover-y", `${(ratioY * 2.2).toFixed(2)}px`);
        item.style.setProperty("--hover-rotate", `${(ratioX * 0.45).toFixed(2)}deg`);
    };

    item.addEventListener("pointermove", updateHoverEffect);
    item.addEventListener("pointerleave", () => clearHoverEffect(item));
    item.addEventListener("blur", () => clearHoverEffect(item), true);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopParallax();
        clearCopyGlitchNow();
        rootElement.classList.remove("is-scrolling");
        window.clearTimeout(scrollStateTimer);
        return;
    }

    scheduleScrollEffects();

    scheduleTextJitter();
    scheduleCopyGlitch();
});

const handleEnvironmentChange = () => {
    computePerformanceMode();

    if (!canRunAtmosphericMotion()) {
        clearAtmosphericEffects();
        return;
    }

    updateScrollDepth();
    scheduleParallax();
    scheduleTextJitter();
    scheduleCopyGlitch();
};

addMediaChangeListener(reducedMotionQuery, handleEnvironmentChange);
addMediaChangeListener(finePointerQuery, handleEnvironmentChange);
addMediaChangeListener(compactViewportQuery, handleEnvironmentChange);

const startAtmosphericEffects = () => {
    scheduleScrollEffects();
    scheduleTextJitter();
    scheduleCopyGlitch();
    scheduleParallax();
};

if ("requestIdleCallback" in window) {
    window.requestIdleCallback(startAtmosphericEffects, { timeout: 900 });
} else {
    window.setTimeout(startAtmosphericEffects, 220);
}

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: "0px 0px -40px 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}
