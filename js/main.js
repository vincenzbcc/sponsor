document.addEventListener('DOMContentLoaded', () => {
    // Initialize Portal Controls
    UIFactory.createSidebarControls('lab-controls');

    // Load initial product in Portal
    PortalEngine.getInstance().loadProduct('aikon');

    // Setup interactive swipe up arrow
    const swipeUpBtn = document.getElementById('swipe-up-btn');
    if (swipeUpBtn) {
        swipeUpBtn.addEventListener('click', () => {
            document.getElementById('section-lab').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Generate Skeleton grid for Web Prototypes section
    const webGrid = document.getElementById('web-prototypes-grid');
    if (webGrid) {
        for (let i = 0; i < 6; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'border-2 border-black bg-acid-yellow h-64 p-4 flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 cursor-pointer';
            skeleton.innerHTML = `
                <div class="w-full h-32 bg-black/10 animate-pulse"></div>
                <div class="space-y-2">
                    <div class="h-4 bg-black w-3/4"></div>
                    <div class="h-4 bg-black w-1/2"></div>
                </div>
            `;
            webGrid.appendChild(skeleton);
        }
    }
});
