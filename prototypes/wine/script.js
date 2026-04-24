gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const WineEngine = (() => {
    // DOM Elements
    const canvas = document.getElementById("wine-canvas");
    const ctx = canvas ? canvas.getContext("2d", { alpha: true }) : null;
    const phase1 = document.getElementById("phase-1");
    const phase2 = document.getElementById("phase-2");
    
    // SVG Path
    const pathSvg = document.getElementById("path-svg");
    const glowPath = document.getElementById("glow-path");
    const tracePath = document.getElementById("trace-path");
    
    // DOM Bottle (Phase 2)
    const domBottleWrapper = document.getElementById("bottle");
    const domBottleImg = document.getElementById("bottle-img");
    const stopCards = gsap.utils.toArray('.card');
    
    // Beats
    const beats = {
        a: document.getElementById('beat-a'),
        b: document.getElementById('beat-b'),
        c: document.getElementById('beat-c'),
        d: document.getElementById('beat-d')
    };

    // State
    const totalFrames = 192;
    const frameCache = new Array(totalFrames); // Stores ImageBitmaps or Canvases
    let framesLoaded = 0;
    
    let currentFrame = 0;
    let targetFrame = 0;
    let currentScale = 0.4;
    let targetScale = 0.4;
    let mainRaf;
    
    // Spring settings
    const spring = {
        stiffness: 0.08,
        damping: 0.25
    };

    // --- CHROMA KEY PROCESSING ---
    const targetColor = { r: 237, g: 224, b: 204 }; // #EDE0CC
    const tolerance = 32; // Conservativo per preservare i riflessi del vetro

    const processImageChromaKey = (img) => {
        // Usa OffscreenCanvas se supportato, altrimenti un normale canvas nascosto
        let oc, octx;
        if (typeof OffscreenCanvas !== 'undefined') {
            oc = new OffscreenCanvas(img.width, img.height);
            octx = oc.getContext('2d', { willReadFrequently: true });
        } else {
            oc = document.createElement('canvas');
            oc.width = img.width;
            oc.height = img.height;
            octx = oc.getContext('2d', { willReadFrequently: true });
        }
        
        octx.drawImage(img, 0, 0);
        const imageData = octx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            let diffR = Math.abs(r - targetColor.r);
            let diffG = Math.abs(g - targetColor.g);
            let diffB = Math.abs(b - targetColor.b);
            
            if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
                // Calcola quanto siamo lontani dal colore puro
                let maxDiff = Math.max(diffR, diffG, diffB);
                
                // Mappatura Alpha morbida:
                // Se maxDiff == 0 (colore perfetto), alpha = 0
                // Se maxDiff == tolerance, alpha = 255
                // Usiamo una curva per ammorbidire il bordo senza mangiare troppo vetro
                let alphaRatio = maxDiff / tolerance;
                let alpha = Math.min(255, Math.pow(alphaRatio, 1.5) * 255);
                
                // Applica l'alpha
                data[i + 3] = alpha;
            }
        }
        
        octx.putImageData(imageData, 0, 0);
        
        // Estrai il bitmap se possibile per alte performance GPU
        if (oc.transferToImageBitmap) {
            return oc.transferToImageBitmap();
        } else {
            return oc; // Fallback al canvas classico
        }
    };

    // --- PRELOADER ---
    const preloadFrames = async () => {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        
        // Carica sequenzialmente o in batch piccoli per non bloccare il thread
        for (let i = 0; i < totalFrames; i++) {
            const paddedNum = i.toString().padStart(3, '0');
            const src = `frames/frame_${paddedNum}_delay-0.04s.jpg`;
            
            await new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    // Processa subito il chroma key prima di salvare in cache
                    frameCache[i] = processImageChromaKey(img);
                    
                    framesLoaded++;
                    const progress = (framesLoaded / totalFrames) * 100;
                    if (progressBar) progressBar.style.width = `${progress}%`;
                    if (loadingText) loadingText.innerText = `CHROMA KEY PROCESSING — ${Math.round(progress)}%`;
                    
                    resolve();
                };
                img.onerror = () => {
                    console.warn("Failed to load frame", src);
                    framesLoaded++;
                    resolve();
                };
            });
        }
        
        // Finito caricamento
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                initScrollEngine();
            }, 1000);
        }
    };

    // --- PHASE 1: CANVAS ENGINE ---
    const drawCanvasFrame = (index, scaleValue) => {
        if (!ctx || !frameCache[index]) return;
        
        const cw = canvas.width;
        const ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);
        
        const img = frameCache[index];
        const sWidth = img.width;
        const sHeight = img.height;
        
        // "Contain" logic but with our dynamic scale
        const imgRatio = sWidth / sHeight;
        const canvasRatio = cw / ch;
        
        let drawWidth, drawHeight;
        if (canvasRatio > imgRatio) {
            drawHeight = ch * scaleValue;
            drawWidth = imgRatio * drawHeight;
        } else {
            drawWidth = cw * scaleValue;
            drawHeight = drawWidth / imgRatio;
        }
        
        const offsetX = (cw - drawWidth) / 2;
        const offsetY = (ch - drawHeight) / 2;
        
        ctx.drawImage(img, 0, 0, sWidth, sHeight, offsetX, offsetY, drawWidth, drawHeight);
    };

    const loop = () => {
        // Interpolazione Spring (Spring physics)
        currentFrame += (targetFrame - currentFrame) * spring.stiffness;
        currentScale += (targetScale - currentScale) * spring.stiffness;
        
        drawCanvasFrame(Math.round(currentFrame), currentScale);
        
        mainRaf = requestAnimationFrame(loop);
    };

    const setupPhase1 = () => {
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawCanvasFrame(Math.round(currentFrame), currentScale);
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Anima Frame (0 -> 191) e Scale (0.4 -> 1.8) con GSAP
        ScrollTrigger.create({
            trigger: phase1,
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // Smoothing di GSAP oltre alla spring
            onUpdate: (self) => {
                // Calcola il target
                targetFrame = self.progress * (totalFrames - 1);
                // Scale progress: da 0.4 a 1.8
                targetScale = 0.4 + (self.progress * 1.4);
                
                // Dissolvenza dei Beats
                updateBeats(self.progress);
            }
        });
        
        loop();
    };

    // Helper Beats FASE 1
    const updateBeats = (p) => {
        const mapOpacity = (val, inMin, inMax, outMin, outMax) => {
            return ((val - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
        };

        const applyBeat = (beat, start, fadeIn, fadeOut, end) => {
            if (!beat) return;
            let opacity = 0;
            let y = 20;

            if (p >= start && p <= end) {
                if (p < fadeIn) {
                    opacity = mapOpacity(p, start, fadeIn, 0, 1);
                    y = mapOpacity(p, start, fadeIn, 20, 0);
                } else if (p > fadeOut) {
                    opacity = mapOpacity(p, fadeOut, end, 1, 0);
                    y = mapOpacity(p, fadeOut, end, 0, -20);
                } else {
                    opacity = 1;
                    y = 0;
                }
            }
            
            beat.style.opacity = Math.max(0, Math.min(1, opacity));
            beat.style.transform = `translateY(${y}px)`;
            
            if (beat.id === 'beat-d') {
                beat.style.pointerEvents = opacity > 0.8 ? 'auto' : 'none';
            }
        };

        // Come da direttive
        applyBeat(beats.a, 0.00, 0.02, 0.18, 0.20);
        applyBeat(beats.b, 0.25, 0.27, 0.43, 0.45);
        applyBeat(beats.c, 0.50, 0.52, 0.68, 0.70);
        applyBeat(beats.d, 0.75, 0.77, 0.93, 0.95);
    };

    // --- PHASE 2: SVG MOTION PATH ---
    const drawTrace = () => {
        const width = window.innerWidth;
        const height = window.innerHeight * 4; // 400vh
        
        pathSvg.style.height = `${height}px`;
        phase2.style.height = `${height + window.innerHeight}px`;

        const points = [];
        const segments = 5; 
        const segmentHeight = height / segments;

        points.push(`M ${width/2} 0`);
        
        for (let i = 1; i <= segments; i++) {
            let prevY = (i - 1) * segmentHeight;
            let targetY = i * segmentHeight;
            let midY = prevY + segmentHeight / 2;
            
            let targetX = (i % 2 !== 0) ? width * 0.75 : width * 0.25;
            let prevX = (i === 1) ? width/2 : ((i-1) % 2 !== 0) ? width * 0.75 : width * 0.25;
            
            let cp1X = prevX;
            let cp1Y = midY;
            let cp2X = targetX;
            let cp2Y = midY;
            
            points.push(`C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`);
            
            // Offset cards
            if (stopCards[i-1]) {
                const yOffset = window.innerWidth > 768 ? 150 : 100;
                stopCards[i-1].style.top = `${targetY - yOffset}px`;
            }
        }

        const pathData = points.join(" ");
        tracePath.setAttribute("d", pathData);
        glowPath.setAttribute("d", pathData);
    };

    const setupPhase2 = () => {
        drawTrace();

        // Usa l'ultimo frame del Canvas come sorgente per l'img DOM
        // Questo garantisce una transizione senza stacchi grafici (il chroma key c'è già!)
        // Trick: dipingiamo l'ultimo frame processato su un canvas temporaneo ed estraiamo l'URL base64
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = frameCache[191].width;
        tempCanvas.height = frameCache[191].height;
        const tcCtx = tempCanvas.getContext('2d');
        tcCtx.drawImage(frameCache[191], 0, 0);
        domBottleImg.src = tempCanvas.toDataURL();
        
        // Transizione Scale (1.8 -> 0.6) gestita da GSAP
        // Il CSS di base ha domBottleWrapper nascosto (opacity 0)
        
        const phase2Tl = gsap.timeline({
            scrollTrigger: {
                trigger: phase2,
                start: "top bottom", // Inizia appena phase2 tocca il bottom della viewport
                end: "bottom bottom",
                scrub: 1
            }
        });

        // Appena entriamo in Phase 2:
        // 1. Mostriamo il DOM element
        // 2. Lo scaliamo giù da 1.8 a 0.6 in un istante, oppure gradualmente
        // Secondo le istruzioni: "la bottiglia scala verso il basso a scale(0.6) mentre diventa elemento DOM"
        
        phase2Tl.fromTo(domBottleWrapper, 
            { opacity: 1, scale: 1.8 },
            { scale: 0.6, duration: 0.1, ease: "power2.out" }
        )
        // Dopodiché inizia il MotionPath
        .to(domBottleWrapper, {
            motionPath: {
                path: tracePath,
                align: tracePath,
                alignOrigin: [0.5, 0.5],
                autoRotate: 8
            },
            duration: 0.9,
            ease: "none"
        });

        // Nascondi il Canvas quando domBottle entra in scena
        ScrollTrigger.create({
            trigger: phase2,
            start: "top center", 
            onEnter: () => gsap.to(canvas, { opacity: 0, duration: 0.2 }),
            onLeaveBack: () => gsap.to(canvas, { opacity: 1, duration: 0.2 })
        });

        // Apparizione Stop Cards
        stopCards.forEach((card) => {
            gsap.to(card, {
                scrollTrigger: {
                    trigger: phase2,
                    start: () => `top+=${card.offsetTop - window.innerHeight * 0.75} top`,
                    end: () => `top+=${card.offsetTop - window.innerHeight * 0.4} top`,
                    scrub: 1
                },
                opacity: 1,
                y: 0,
                ease: "power2.out"
            });
        });
    };

    const setupGlobalEffects = () => {
        // Effetto Sepia su body per tutto lo scorrimento
        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                const warmth = self.progress * 0.15;
                document.body.style.filter = `saturate(${1 + warmth}) sepia(${warmth * 0.4})`;
            }
        });
    };

    const initScrollEngine = () => {
        setupPhase1();
        setupPhase2();
        setupGlobalEffects();
    };

    return {
        init: () => {
            // Avvia il caricamento
            preloadFrames();
        }
    };
})();

// Start Engine
document.addEventListener('DOMContentLoaded', () => {
    WineEngine.init();
});
