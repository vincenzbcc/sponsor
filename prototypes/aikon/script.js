// --- WatchRepository (Repository Pattern) ---
const WatchRepository = (() => {
    // Generate frame paths
    const getFrames = () => {
        const frames = [];
        for (let i = 0; i <= 191; i++) {
            const paddedNum = i.toString().padStart(3, '0');
            frames.push(`aikon-frames/frame_${paddedNum}_delay-0.041s.jpg`);
        }
        return frames;
    };

    const getFeatures = () => [
        {
            type: 'feature',
            tag: '◆ Calibro automatico',
            title: 'Movimento automatico svizzero',
            desc: 'Precisione ±2 sec/giorno. Carica automatica al movimento del polso. Zero batterie.'
        },
        {
            type: 'feature',
            tag: '◆ Anti-graffio',
            title: 'Cristallo zaffiro doppio dome',
            desc: 'Resistenza agli urti. Anti-riflesso multistrato. Visibilità in ogni condizione.'
        },
        {
            type: 'feature',
            tag: '◆ Waterproof 100m',
            title: 'Acciaio chirurgico 316L',
            desc: 'Satinato e lucidato a mano. Bracciale integrato. Resistente all\'acqua fino a 100 metri.'
        }
    ];

    const getComponents = () => [
        {
            type: 'component',
            num: '01',
            title: 'Vetro zaffiro',
            desc: 'Trasparente, doppia curvatura, antigraffio assoluto'
        },
        {
            type: 'component',
            num: '02',
            title: 'Quadrante guilloche',
            desc: 'Texture incisa a mano, 1.247 incroci per cm²'
        },
        {
            type: 'component',
            num: '03',
            title: 'Movimento automatico',
            desc: '192 componenti, assemblati a mano in Svizzera'
        },
        {
            type: 'component',
            num: '04',
            title: 'Cassa acciaio 316L',
            desc: 'Finitura satinata + lucidatura a specchio sulle anse'
        },
        {
            type: 'component',
            num: '05',
            title: 'Bracciale integrato',
            desc: 'Link fresati, sistema di regolazione micro-millimetrico'
        },
        {
            type: 'special',
            title: 'Fatto a mano. Per durare secoli.',
            link: 'Scopri il movimento →'
        }
    ];

    return { getFrames, getFeatures, getComponents };
})();

// --- Factory Pattern ---
function createWatchCard(data) {
    const el = document.createElement('div');
    
    if (data.type === 'feature') {
        el.className = 'feature-card';
        el.innerHTML = `
            <div class="feature-tag">${data.tag}</div>
            <h3>${data.title}</h3>
            <p>${data.desc}</p>
        `;
    } else if (data.type === 'component') {
        el.className = 'component-card';
        el.innerHTML = `
            <div class="comp-num">${data.num}</div>
            <div class="comp-title">${data.title}</div>
            <div class="comp-desc">${data.desc}</div>
        `;
    } else if (data.type === 'special') {
        el.className = 'component-special';
        el.innerHTML = `
            <h3>${data.title}</h3>
            <a href="#movimento">${data.link}</a>
        `;
    }
    return el;
}

// --- CanvasEngine (Singleton Pattern) ---
const CanvasEngine = (() => {
    let instance;

    function init(canvasEl, framesArr) {
        const ctx = canvasEl.getContext('2d', { alpha: false });
        const images = [];
        let loadedCount = 0;
        
        let currentProgress = 0;
        let targetProgress = 0;
        let isVisible = false;
        let animationFrameId = null;

        const loader = document.getElementById('loader');
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const scrollIndicator = document.getElementById('scroll-indicator');

        // Beats mapping
        const beats = [
            { el: document.getElementById('beat-a'), start: 0.00, end: 0.20 },
            { el: document.getElementById('beat-b'), start: 0.25, end: 0.45 },
            { el: document.getElementById('beat-c'), start: 0.50, end: 0.70 },
            { el: document.getElementById('beat-d'), start: 0.75, end: 0.95 },
        ];

        // Resize Canvas
        const resizeCanvas = () => {
            const ratio = window.devicePixelRatio || 1;
            canvasEl.width = window.innerWidth * ratio;
            canvasEl.height = window.innerHeight * ratio;
            ctx.scale(ratio, ratio);
            renderFrame(Math.floor(currentProgress * (framesArr.length - 1)));
        };

        window.addEventListener('resize', resizeCanvas);

        // Preload Images
        const preload = () => {
            const handleFrameDone = () => {
                loadedCount++;
                const percent = Math.floor((loadedCount / framesArr.length) * 100);
                progressBar.style.width = percent + '%';
                loadingText.innerText = `CARICAMENTO — ${percent}%`;

                if (loadedCount === framesArr.length) {
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        setTimeout(() => {
                            loader.style.display = 'none';
                            resizeCanvas();
                            startAnimation();
                        }, 1000);
                    }, 500);
                }
            };

            framesArr.forEach((src, index) => {
                const img = new Image();
                img.onload = handleFrameDone;
                img.onerror = () => {
                    console.warn('Failed to load frame:', src);
                    handleFrameDone();
                };
                img.src = src;
                images[index] = img;
            });
        };

        // Draw Image with contain logic
        const renderFrame = (index) => {
            if (!images[index]) return;
            const img = images[index];
            if (!img.complete || img.naturalHeight === 0) return; // Prevent IndexSizeError

            const cw = window.innerWidth;
            const ch = window.innerHeight;
            
            // Background color
            ctx.fillStyle = '#0A0804';
            ctx.fillRect(0, 0, cw, ch);

            // Crop the bottom part to remove the watermark
            const cropRatio = 0.92; // Keep top 92% of the image
            const sWidth = img.naturalWidth;
            const sHeight = img.naturalHeight * cropRatio;

            const imgRatio = sWidth / sHeight;
            const canvasRatio = cw / ch;
            let drawWidth = cw;
            let drawHeight = ch;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > canvasRatio) {
                // Image is wider
                drawWidth = cw;
                drawHeight = cw / imgRatio;
                offsetY = (ch - drawHeight) / 2;
            } else {
                // Image is taller
                drawHeight = ch;
                drawWidth = ch * imgRatio;
                offsetX = (cw - drawWidth) / 2;
            }

            ctx.drawImage(img, 0, 0, sWidth, sHeight, offsetX, offsetY, drawWidth, drawHeight);
        };

        // Map function for beats
        const mapRange = (value, inMin, inMax, outMin, outMax) => {
            return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
        };

        const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

        const updateBeats = (prog) => {
            // Scroll indicator logic
            scrollIndicator.style.opacity = prog < 0.1 ? 1 - (prog / 0.1) : 0;

            beats.forEach(beat => {
                const { el, start, end } = beat;
                if (!el) return;
                
                const dur = end - start;
                const fadeInEnd = start + 0.1;
                const fadeOutStart = end - 0.1;

                if (prog >= start && prog <= end) {
                    let opacity = 0;
                    let translateY = 20;

                    if (prog <= fadeInEnd) {
                        // Fading in
                        opacity = mapRange(prog, start, fadeInEnd, 0, 1);
                        translateY = mapRange(prog, start, fadeInEnd, 20, 0);
                    } else if (prog >= fadeOutStart) {
                        // Fading out
                        opacity = mapRange(prog, fadeOutStart, end, 1, 0);
                        translateY = mapRange(prog, fadeOutStart, end, 0, -20);
                    } else {
                        // Fully visible
                        opacity = 1;
                        translateY = 0;
                    }

                    el.style.opacity = clamp(opacity, 0, 1);
                    el.style.transform = `translateY(${translateY}px)`;
                } else {
                    el.style.opacity = 0;
                    el.style.transform = `translateY(20px)`;
                }
            });
        };

        const renderLoop = () => {
            if (!isVisible) {
                animationFrameId = requestAnimationFrame(renderLoop);
                return;
            }
            
            // Manual spring
            currentProgress += (targetProgress - currentProgress) * 0.08;
            
            // Render specific frame
            const frameIndex = Math.floor(clamp(currentProgress, 0, 1) * (framesArr.length - 1));
            renderFrame(frameIndex);
            
            updateBeats(currentProgress);

            animationFrameId = requestAnimationFrame(renderLoop);
        };

        const startAnimation = () => {
            if (!animationFrameId) {
                renderLoop();
            }
        };

        const updateScroll = () => {
            const wrapper = document.getElementById('hero');
            const rect = wrapper.getBoundingClientRect();
            const wrapperTop = rect.top + window.scrollY;
            const wrapperHeight = rect.height;
            const viewportHeight = window.innerHeight;

            const scrolled = window.scrollY - wrapperTop;
            const maxScroll = wrapperHeight - viewportHeight;

            let progress = scrolled / maxScroll;
            targetProgress = clamp(progress, 0, 1);
        };

        // Initialize events
        window.addEventListener('scroll', updateScroll);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
            });
        });
        observer.observe(document.getElementById('hero'));

        // Start preloading
        preload();

        return {
            destroy: () => {
                window.removeEventListener('resize', resizeCanvas);
                window.removeEventListener('scroll', updateScroll);
                observer.disconnect();
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
            }
        };
    }

    return {
        getInstance: (canvasEl, framesArr) => {
            if (!instance) {
                // Check prefers-reduced-motion
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (!prefersReducedMotion) {
                    instance = init(canvasEl, framesArr);
                } else {
                    // Fallback for reduced motion: just load first image
                    const loader = document.getElementById('loader');
                    loader.style.display = 'none';
                    const ctx = canvasEl.getContext('2d');
                    const img = new Image();
                    img.src = framesArr[0];
                    img.onload = () => {
                        canvasEl.width = window.innerWidth;
                        canvasEl.height = window.innerHeight;
                        ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
                    }
                    document.getElementById('hero').style.height = '100vh';
                    document.querySelector('.canvas-sticky').style.position = 'relative';
                }
            }
            return instance;
        }
    };
})();

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Populate Slider Features
    const track = document.getElementById('features-track');
    WatchRepository.getFeatures().forEach(feature => {
        track.appendChild(createWatchCard(feature));
    });

    // 2. Populate Grid Components
    const grid = document.getElementById('components-grid');
    WatchRepository.getComponents().forEach(comp => {
        grid.appendChild(createWatchCard(comp));
    });

    // 3. Init Canvas Engine
    const canvas = document.getElementById('watch-canvas');
    CanvasEngine.getInstance(canvas, WatchRepository.getFrames());

    // 4. Custom Cursor Logic
    const cursor = document.getElementById('custom-cursor');
    let cursorInitialized = false;

    window.addEventListener('mousemove', (e) => {
        if (!cursorInitialized) {
            cursor.style.display = 'block';
            document.body.classList.add('cursor-active');
            cursorInitialized = true;
        }
        cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    // Hover logic for cursor
    const interactiveElements = document.querySelectorAll('a, button, .feature-card, .component-card, .nav-mobile-btn');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });

    // 5. Slider Drag Logic
    const sliderContainer = document.getElementById('features-slider');
    let isDown = false;
    let startX;
    let scrollLeft;

    sliderContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - sliderContainer.offsetLeft;
        scrollLeft = sliderContainer.scrollLeft;
    });
    sliderContainer.addEventListener('mouseleave', () => {
        isDown = false;
    });
    sliderContainer.addEventListener('mouseup', () => {
        isDown = false;
    });
    sliderContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - sliderContainer.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast
        sliderContainer.scrollLeft = scrollLeft - walk;
    });

    // Touch support for slider
    sliderContainer.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - sliderContainer.offsetLeft;
        scrollLeft = sliderContainer.scrollLeft;
    }, {passive: true});
    sliderContainer.addEventListener('touchend', () => {
        isDown = false;
    });
    sliderContainer.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - sliderContainer.offsetLeft;
        const walk = (x - startX) * 2;
        sliderContainer.scrollLeft = scrollLeft - walk;
    }, {passive: true});
});
