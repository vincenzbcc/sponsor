/**
 * FIRMA PROJECT - Scroll Canvas Engine
 * Design Patterns: Repository, Factory, Singleton
 */

// --- REPOSITORY PATTERN ---
const FirmaRepository = (() => {
    // Canvas frames configuration
    const frameConfig = {
        totalFrames: 192,
        folder: 'firma-frames',
        prefix: 'frame_',
        suffix: '_delay-0.041s.jpg'
    };

    // Features data
    const features = [
        {
            title: "Thermoblock istantaneo",
            points: ["Riscaldamento in 30 secondi", "Temperatura costante per ogni estrazione", "Zero attesa"]
        },
        {
            title: "Pompa a 19 bar",
            points: ["Pressione professionale", "Crema densa e persistente", "Estrazione da bar"]
        },
        {
            title: "Pannello touch a 8 bevande",
            points: ["Espresso, lungo, cappuccino, americano e altro", "Un tocco, la tua bevanda"]
        }
    ];

    // Build frame URLs
    const getFrameUrls = () => {
        const frames = [];
        for (let i = 0; i < frameConfig.totalFrames; i++) {
            const paddedNum = i.toString().padStart(3, '0');
            frames.push(`${frameConfig.folder}/${frameConfig.prefix}${paddedNum}${frameConfig.suffix}`);
        }
        return frames;
    };

    return {
        getFrameUrls,
        getFeatures: () => features,
        getTotalFrames: () => frameConfig.totalFrames
    };
})();

// --- FACTORY PATTERN ---
const UIFactory = (() => {
    const createFeatureCard = (feature) => {
        const card = document.createElement('div');
        card.className = 'ctrl-group';
        card.style.background = 'var(--surface-2)';
        
        const title = document.createElement('div');
        title.className = 'ctrl-label';
        title.innerText = feature.title;
        
        const list = document.createElement('ul');
        list.className = 'features-list';
        list.style.marginTop = '1rem';
        
        feature.points.forEach(point => {
            const li = document.createElement('li');
            li.innerText = point;
            list.appendChild(li);
        });

        card.appendChild(title);
        card.appendChild(list);
        
        return card;
    };

    const buildFeaturesGrid = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const features = FirmaRepository.getFeatures();
        features.forEach(f => {
            container.appendChild(createFeatureCard(f));
        });
    };

    return {
        buildFeaturesGrid
    };
})();

// --- SINGLETON PATTERN: CANVAS ENGINE ---
const CanvasEngine = (() => {
    let instance;

    const init = (canvasEl, frameUrls) => {
        const ctx = canvasEl.getContext('2d', { alpha: false });
        const images = [];
        let loadedImages = 0;
        
        // State
        let currentFrame = 0;
        let targetFrame = 0;
        
        // DOM Elements
        const heroWrapper = document.querySelector('.hero-wrapper');
        const loader = document.getElementById('loader');
        const progressBar = document.getElementById('progress-bar');
        const indicator = document.getElementById('scroll-indicator');
        const beats = {
            a: document.getElementById('beat-a'),
            b: document.getElementById('beat-b'),
            c: document.getElementById('beat-c'),
            d: document.getElementById('beat-d')
        };

        // Spring physics config
        const spring = {
            stiffness: 0.1, // Adjusted for manual requestAnimationFrame (similar to Framer Motion stiffness 90 / damping 28)
            friction: 0.12  // Soft, liquid-like friction
        };

        // Preload images
        const preload = () => {
            for (let i = 0; i < frameUrls.length; i++) {
                const img = new Image();
                img.src = frameUrls[i];
                img.onload = () => {
                    loadedImages++;
                    const progress = (loadedImages / frameUrls.length) * 100;
                    progressBar.style.width = `${progress}%`;
                    document.getElementById('loading-text').innerText = `PREPARAZIONE — ${Math.round(progress)}%`;
                    
                    if (loadedImages === frameUrls.length) {
                        setTimeout(() => {
                            loader.style.opacity = '0';
                            setTimeout(() => {
                                loader.style.display = 'none';
                                resize();
                                renderLoop();
                            }, 1000);
                        }, 500);
                    }
                };
                images[i] = img;
            }
        };

        const resize = () => {
            canvasEl.width = window.innerWidth;
            canvasEl.height = window.innerHeight;
            renderFrame(Math.round(currentFrame));
        };

        // Helper for Beat opacity mapping: [start, in, out, end] -> [0, 1, 1, 0]
        const mapRange = (value, inMin, inMax, outMin, outMax) => {
            return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        };

        const updateBeats = (progress) => {
            // progress is 0.0 to 1.0
            
            // Indicator
            if (progress > 0.1) indicator.style.opacity = '0';
            else indicator.style.opacity = '1';

            const updateBeat = (beat, start, fadeIn, fadeOut, end) => {
                let opacity = 0;
                let y = 20;

                if (progress >= start && progress <= end) {
                    if (progress < fadeIn) {
                        opacity = mapRange(progress, start, fadeIn, 0, 1);
                        y = mapRange(progress, start, fadeIn, 20, 0);
                    } else if (progress > fadeOut) {
                        opacity = mapRange(progress, fadeOut, end, 1, 0);
                        y = mapRange(progress, fadeOut, end, 0, -20);
                    } else {
                        opacity = 1;
                        y = 0;
                    }
                }
                
                beat.style.opacity = Math.max(0, Math.min(1, opacity));
                beat.style.transform = `translateY(${y}px)`;
                
                // Make CTA clickable only when fully visible
                if (beat.id === 'beat-d') {
                    beat.style.pointerEvents = opacity > 0.8 ? 'auto' : 'none';
                }
            };

            // Beat A: 0.00 - 0.24
            updateBeat(beats.a, 0.0, 0.02, 0.22, 0.24);
            
            // Beat B: 0.25 - 0.49
            updateBeat(beats.b, 0.25, 0.27, 0.47, 0.49);
            
            // Beat C: 0.50 - 0.74
            updateBeat(beats.c, 0.50, 0.52, 0.72, 0.74);
            
            // Beat D: 0.75 - 1.00
            updateBeat(beats.d, 0.75, 0.77, 0.95, 1.00);
        };

        const onScroll = () => {
            if (!heroWrapper) return;
            
            // Check if we are inside an iframe and have custom scrolling mechanism
            // For now, assume standard scroll inside the iframe
            const rect = heroWrapper.getBoundingClientRect();
            const scrollY = window.scrollY;
            
            // Calculate progress 0 to 1 relative to heroWrapper
            const wrapperTop = 0; // Since it's at the top of the body
            const wrapperHeight = heroWrapper.offsetHeight - window.innerHeight;
            
            let progress = scrollY / wrapperHeight;
            progress = Math.max(0, Math.min(1, progress));
            
            targetFrame = progress * (FirmaRepository.getTotalFrames() - 1);
            
            updateBeats(progress);
        };

        // Draw Image with contain logic
        const renderFrame = (index) => {
            if (!images[index]) return;
            const img = images[index];
            if (!img.complete || img.naturalHeight === 0) return; // Prevent IndexSizeError

            const cw = window.innerWidth;
            const ch = window.innerHeight;
            
            // Background color (Sfondo nero per fondersi con i fotogrammi)
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, cw, ch);

            // Crop the bottom part to remove the watermark
            const cropRatio = 0.92; // Keep top 92% of the image
            const sWidth = img.naturalWidth;
            const sHeight = img.naturalHeight * cropRatio;

            const imgRatio = sWidth / sHeight;
            const canvasRatio = cw / ch;

            let drawWidth, drawHeight, offsetX, offsetY;

            // Contain logic (scale to fit, keep aspect ratio)
            if (canvasRatio > imgRatio) {
                // Canvas is wider than image (fit to height)
                drawHeight = ch;
                drawWidth = imgRatio * ch;
                offsetX = (cw - drawWidth) / 2;
                offsetY = 0;
            } else {
                // Canvas is taller than image (fit to width)
                drawWidth = cw;
                drawHeight = cw / imgRatio;
                offsetX = 0;
                offsetY = (ch - drawHeight) / 2;
            }

            ctx.drawImage(img, 0, 0, sWidth, sHeight, offsetX, offsetY, drawWidth, drawHeight);
        };

        const renderLoop = () => {
            // Spring interpolation
            currentFrame += (targetFrame - currentFrame) * spring.friction;
            
            if (Math.abs(targetFrame - currentFrame) > 0.01) {
                renderFrame(Math.round(currentFrame));
            }

            requestAnimationFrame(renderLoop);
        };

        // Attach events
        window.addEventListener('resize', resize);
        window.addEventListener('scroll', onScroll, { passive: true });

        // Start preload
        preload();

        return {
            cleanup: () => {
                window.removeEventListener('resize', resize);
                window.removeEventListener('scroll', onScroll);
            }
        };
    };

    return {
        getInstance: (canvasEl, frameUrls) => {
            if (!instance) {
                instance = init(canvasEl, frameUrls);
            }
            return instance;
        }
    };
})();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Build UI Components
    UIFactory.buildFeaturesGrid('features-grid');

    // 2. Initialize Canvas Engine
    const canvas = document.getElementById('product-canvas');
    if (canvas) {
        const frameUrls = FirmaRepository.getFrameUrls();
        CanvasEngine.getInstance(canvas, frameUrls);
    }
});
