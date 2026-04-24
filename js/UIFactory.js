import ProductRepository from './ProductRepository.js';
import PortalEngine from './PortalEngine.js';

const UIFactory = (() => {

    const createSidebarControls = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const products = ProductRepository.getAllProducts();
        
        // Accordion Container for SPONSOR OGGETTI
        const accordionWrapper = document.createElement('div');
        accordionWrapper.className = 'w-full mb-4';

        const btnSponsor = document.createElement('button');
        btnSponsor.className = 'w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono text-sm transition-all flex justify-between items-center group';
        btnSponsor.innerHTML = `
            <div class="flex flex-col gap-1">
                <span class="text-white/50 text-[10px] tracking-widest uppercase">Interactive Canvas</span>
                <span class="text-lg font-bold group-hover:translate-x-1 transition-transform">SPONSOR OGGETTI</span>
            </div>
            <svg class="w-5 h-5 text-white/50 transition-transform duration-300" id="accordion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        `;

        const subMenu = document.createElement('div');
        subMenu.className = 'overflow-hidden transition-all duration-300 max-h-0 opacity-0 flex flex-col gap-2 mt-2 pl-4 border-l border-white/10 ml-2';

        const btnFirma = document.createElement('button');
        btnFirma.className = 'w-full text-left p-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 font-mono text-sm transition-all flex flex-col gap-1 group';
        btnFirma.innerHTML = `
            <span class="text-[10px] tracking-widest uppercase opacity-70">Coffee Premium</span>
            <span class="font-bold group-hover:translate-x-1 transition-transform">MACCHINA DA CAFFÈ</span>
        `;
        btnFirma.onclick = () => PortalEngine.getInstance().loadProduct('firma');

        const btnAikon = document.createElement('button');
        btnAikon.className = 'w-full text-left p-3 rounded-lg border border-lime-400/30 bg-lime-400/10 hover:bg-lime-400/20 text-lime-300 font-mono text-sm transition-all flex flex-col gap-1 group';
        btnAikon.innerHTML = `
            <span class="text-[10px] tracking-widest uppercase opacity-70">Masterpiece</span>
            <span class="font-bold group-hover:translate-x-1 transition-transform">OROLOGIO LUSSO</span>
        `;
        btnAikon.onclick = () => PortalEngine.getInstance().loadProduct('aikon');

        subMenu.appendChild(btnFirma);
        subMenu.appendChild(btnAikon);
        
        // Accordion logic
        let isExpanded = false;
        btnSponsor.onclick = () => {
            isExpanded = !isExpanded;
            const icon = btnSponsor.querySelector('#accordion-icon');
            if (isExpanded) {
                subMenu.classList.remove('max-h-0', 'opacity-0');
                subMenu.classList.add('max-h-[500px]', 'opacity-100');
                icon.classList.add('rotate-180');
            } else {
                subMenu.classList.remove('max-h-[500px]', 'opacity-100');
                subMenu.classList.add('max-h-0', 'opacity-0');
                icon.classList.remove('rotate-180');
            }
        };

        accordionWrapper.appendChild(btnSponsor);
        accordionWrapper.appendChild(subMenu);

        // Accordion Container for POPUP ANIMATO
        const popupWrapper = document.createElement('div');
        popupWrapper.className = 'w-full mb-4';

        const btnPopup = document.createElement('button');
        btnPopup.className = 'w-full text-left p-4 rounded-xl border border-purple-400/30 bg-purple-400/10 hover:bg-purple-400/20 text-purple-300 font-mono text-sm transition-all flex justify-between items-center group';
        btnPopup.innerHTML = `
            <div class="flex flex-col gap-1">
                <span class="text-white/50 text-[10px] tracking-widest uppercase">Experiential Scroll</span>
                <span class="text-lg font-bold group-hover:translate-x-1 transition-transform">POPUP ANIMATO</span>
            </div>
            <svg class="w-5 h-5 text-purple-400/50 transition-transform duration-300" id="accordion-icon-popup" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        `;

        const subMenuPopup = document.createElement('div');
        subMenuPopup.className = 'overflow-hidden transition-all duration-300 max-h-0 opacity-0 flex flex-col gap-2 mt-2 pl-4 border-l border-purple-400/30 ml-2';

        const btnWine = document.createElement('button');
        btnWine.className = 'w-full text-left p-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-sm transition-all flex flex-col gap-1 group';
        btnWine.innerHTML = `
            <span class="text-[10px] tracking-widest uppercase opacity-70">Luxury Wine</span>
            <span class="font-bold group-hover:translate-x-1 transition-transform">WINE BOTTLE</span>
        `;
        btnWine.onclick = () => PortalEngine.getInstance().loadProduct('wine');

        subMenuPopup.appendChild(btnWine);

        // Accordion logic for POPUP ANIMATO
        let isPopupExpanded = false;
        btnPopup.onclick = () => {
            isPopupExpanded = !isPopupExpanded;
            const icon = btnPopup.querySelector('#accordion-icon-popup');
            if (isPopupExpanded) {
                subMenuPopup.classList.remove('max-h-0', 'opacity-0');
                subMenuPopup.classList.add('max-h-[500px]', 'opacity-100');
                icon.classList.add('rotate-180');
            } else {
                subMenuPopup.classList.remove('max-h-[500px]', 'opacity-100');
                subMenuPopup.classList.add('max-h-0', 'opacity-0');
                icon.classList.remove('rotate-180');
            }
        };

        popupWrapper.appendChild(btnPopup);
        popupWrapper.appendChild(subMenuPopup);

        container.appendChild(accordionWrapper);
        container.appendChild(popupWrapper);
    };

    return {
        createSidebarControls
    };
})();

export default UIFactory;
