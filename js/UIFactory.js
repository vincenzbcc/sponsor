const UIFactory = (() => {

    const createSidebarControls = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        const list = document.createElement('div');
        list.className = 'w-full flex flex-col gap-3';

        const items = [
            {
                id: 'firma',
                subtitle: 'Coffee Premium',
                title: 'MACCHINA DA CAFFÈ',
                classes: 'border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300'
            },
            {
                id: 'aikon',
                subtitle: 'Masterpiece',
                title: 'OROLOGIO LUSSO',
                classes: 'border-lime-400/30 bg-lime-400/10 hover:bg-lime-400/20 text-lime-300'
            },
            {
                id: 'wine',
                subtitle: 'Luxury Wine',
                title: 'WINE BOTTLE',
                classes: 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300'
            }
        ];

        items.forEach((item) => {
            const btn = document.createElement('button');
            btn.className = `w-full text-left p-4 rounded-xl border ${item.classes} font-mono text-sm transition-all flex flex-col gap-1 group cursor-pointer`;
            btn.innerHTML = `
                <span class="text-[10px] tracking-widest uppercase opacity-70">${item.subtitle}</span>
                <span class="text-base font-bold group-hover:translate-x-1 transition-transform">${item.title}</span>
            `;
            btn.onclick = () => PortalEngine.getInstance().loadProduct(item.id);
            list.appendChild(btn);
        });

        container.appendChild(list);
    };

    return {
        createSidebarControls
    };
})();
