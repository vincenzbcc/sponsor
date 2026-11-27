document.addEventListener('DOMContentLoaded', () => {
    UIFactory.createSidebarControls('lab-controls');
    const productPortal = PortalEngine.getInstance();
    const labSection = document.getElementById('section-lab');
    if ('IntersectionObserver' in window) {
        const labObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                if (!productPortal.getCurrentProduct()) productPortal.loadProduct('milkshake');
                labObserver.disconnect();
            }
        }, { threshold: 0.1 });
        labObserver.observe(labSection);
    } else {
        productPortal.loadProduct('milkshake');
    }

    const webSection = document.getElementById('section-web');
    document.getElementById('swipe-up-btn')?.addEventListener('click', () => {
        webSection.scrollIntoView({ behavior: 'smooth' });
    });

    const subtitle = document.getElementById('web-subtitle');
    const subtitleText = subtitle.dataset.text;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let typingStarted = false;
    function typeSubtitle() {
        if (typingStarted) return;
        typingStarted = true;
        if (reducedMotion.matches) {
            subtitle.textContent = subtitleText;
            return;
        }
        let position = 0;
        const tick = () => {
            subtitle.textContent = subtitleText.slice(0, ++position);
            if (position < subtitleText.length) setTimeout(tick, 65);
        };
        tick();
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                typeSubtitle();
                observer.disconnect();
            }
        }, { threshold: 0.25 });
        observer.observe(webSection);
    } else {
        typeSubtitle();
    }

    const projects = [
        {
            name: 'Cantina Vespera',
            guideUrl: 'vineria-guida.html',
            kind: 'Sito per attività · Concept',
            image: 'prototypes/wine/foto vigna.jpg',
            url: 'prototypes/wine/index.html',
            description: 'Un sito narrativo per una cantina: presenta la famiglia, il territorio, i vini e le esperienze in vigna. Il percorso accompagna il visitatore dalla storia del marchio fino ai contatti.',
            features: [
                'Navigazione tra le sezioni della cantina e presentazione dei vini.',
                'Fotografie e animazioni che raccontano la vigna e il prodotto.',
                'Layout adattato agli schermi piccoli e modulo di contatto dimostrativo.'
            ],
            note: 'Prototipo: il modulo di contatto mostra una conferma locale e non invia messaggi.'
        },
        {
            name: 'Forbici & Pettini',
            guideUrl: 'barberia-guida.html',
            kind: 'Sito per attività · Demo interattiva',
            image: 'prototypes/barberia/assets/salon-poster.webp',
            url: 'prototypes/barberia/index.html',
            adminUrl: 'prototypes/barberia/staff.html',
            description: 'Un salone virtuale con navigazione animata, portfolio dei barbieri e catalogo prodotti. La vista cliente mostra la scelta del taglio e un’area personale; la vista admin apre l’agenda del salone.',
            features: [
                'Navigazione animata tra salone, prenotazioni e prodotti.',
                'Scelta di barbiere, giorno, servizio e orario con disponibilità dimostrativa.',
                'Area personale con appuntamenti e avvisi simulati.',
                'Agenda admin con gestione dimostrativa di prenotazioni, disdette e resoconto.'
            ],
            note: 'Copia locale indipendente: non si collega al backend, non invia email e non salva le modifiche. Ricaricando la pagina si ripristinano i dati iniziali.'
        },
        ...Array.from({ length: 4 }, (_, index) => ({
            name: `Prossimo progetto ${String(index + 3).padStart(2, '0')}`,
            kind: 'Sito per attività · In preparazione',
            description: 'Questo spazio è riservato a un futuro sito per un’attività commerciale.',
            features: [],
            note: 'La demo sarà disponibile quando il progetto verrà inserito nella vetrina.'
        }))
    ];

    const grid = document.getElementById('web-prototypes-grid');
    const details = document.getElementById('project-dialog');
    const previewButton = document.getElementById('project-preview');
    const adminPreviewButton = document.getElementById('project-admin-preview');
    let selectedProject = null;
    let lastFocus = null;

    function openDetails(project, launcher) {
        selectedProject = project;
        lastFocus = launcher;
        document.getElementById('project-kind').textContent = project.kind;
        document.getElementById('project-name').textContent = project.name;
        document.getElementById('project-description').textContent = project.description;
        document.getElementById('project-note').textContent = project.note;
        const featureList = document.getElementById('project-features');
        featureList.replaceChildren();
        for (const feature of project.features) {
            const li = document.createElement('li');
            li.textContent = feature;
            featureList.appendChild(li);
        }
        featureList.previousElementSibling.hidden = project.features.length === 0;
        previewButton.hidden = !project.url;
        previewButton.textContent = project.adminUrl ? 'Vista cliente ↗' : 'Apri a schermo intero ↗';
        adminPreviewButton.hidden = !project.adminUrl;
        details.showModal();
    }

    projects.forEach((project) => {
        const card = document.createElement('div');
        card.className = 'business-card relative w-full border-2 border-black bg-[#f8d6bc] hover:-translate-y-1 transition-transform';
        if (project.image) {
            card.classList.add('text-white', 'business-card-image');
            card.style.backgroundImage = `linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.1)), url("${project.image}")`;
        }
        const detailButton = document.createElement('button');
        detailButton.type = 'button';
        detailButton.className = 'w-full h-full min-h-[170px] text-left p-4 md:p-5 flex flex-col justify-between';
        const label = document.createElement('span');
        label.className = 'text-xs font-bold uppercase tracking-widest';
        label.textContent = project.url ? 'Sito per attività · Concept' : 'Spazio per un nuovo sito';
        const footer = document.createElement('span');
        footer.className = 'flex items-end justify-between gap-3';
        const title = document.createElement('strong');
        title.className = 'text-xl md:text-2xl lg:text-3xl font-black uppercase leading-tight';
        title.textContent = project.name;
        const arrow = document.createElement('span');
        arrow.className = 'text-2xl font-bold';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '↗';
        footer.append(title, arrow);
        detailButton.append(label, footer);
        detailButton.setAttribute('aria-label', `Dettagli: ${project.name}`);
        detailButton.addEventListener('click', () => {
            if (project.guideUrl) {
                openBarberGuide(detailButton, project.guideUrl);
                return;
            }
            openDetails(project, detailButton);
        });
        card.appendChild(detailButton);
        if (project.url) {
            const fullButton = document.createElement('button');
            fullButton.type = 'button';
            fullButton.className = 'project-action absolute top-3 right-3 w-10 h-10 border-2 border-black bg-white text-black text-xl font-bold';
            fullButton.textContent = '⛶';
            fullButton.setAttribute('aria-label', `Apri ${project.name} a schermo intero`);
            fullButton.addEventListener('click', () => {
                if (project.guideUrl) openBarberGuide(fullButton, project.guideUrl);
                else window.openProjectPreview(project.url, project.name, fullButton);
            });
            card.appendChild(fullButton);
        }
        grid.appendChild(card);
    });

    document.getElementById('project-close').addEventListener('click', () => details.close());
    details.addEventListener('close', () => {
        if (document.getElementById('preview-overlay').hidden) lastFocus?.focus();
    });
    details.addEventListener('click', (event) => {
        if (event.target === details) details.close();
    });

    const overlay = document.getElementById('preview-overlay');
    const barberGuide = document.getElementById('barber-guide-overlay');
    const barberGuideFrame = document.getElementById('barber-guide-frame');
    let barberGuideLauncher = null;
    function openBarberGuide(launcher, guideUrl = 'barberia-guida.html') {
        barberGuideLauncher = launcher;
        barberGuideFrame.src = guideUrl;
        barberGuide.hidden = false;
        document.querySelector('main').inert = true;
        document.body.style.overflow = 'hidden';
        document.getElementById('barber-guide-close').focus();
    }
    function closeBarberGuide() {
        barberGuide.hidden = true;
        barberGuide.classList.remove('is-preview-expanded');
        barberGuideFrame.removeAttribute('src');
        document.querySelector('main').inert = false;
        document.body.style.overflow = '';
        barberGuideLauncher?.focus();
    }
    document.getElementById('barber-guide-close').addEventListener('click', closeBarberGuide);
    barberGuide.addEventListener('click', event => { if (event.target === barberGuide) closeBarberGuide(); });
    window.addEventListener('message', event => {
        if (barberGuide.hidden || event.source !== barberGuideFrame.contentWindow || event.data?.source !== 'barber-tour') return;
        if (event.data.action === 'close') closeBarberGuide();
        if (event.data.action === 'preview-size') {
            barberGuide.classList.toggle('is-preview-expanded', event.data.expanded === true);
        }
    });
    const frame = document.getElementById('preview-frame');
    const clientSwitch = document.getElementById('preview-client');
    const adminSwitch = document.getElementById('preview-admin');
    let previewLauncher = null;
    window.openProjectPreview = (url, title, launcher) => {
        previewLauncher = launcher;
        if (details.open) details.close();
        document.getElementById('preview-title').textContent = title;
        frame.src = url;
        const barberPreview = url.startsWith('prototypes/barberia/');
        clientSwitch.hidden = adminSwitch.hidden = !barberPreview;
        overlay.hidden = false;
        document.getElementById('preview-close').focus();
    };
    document.getElementById('portal-fullscreen').addEventListener('click', (event) => {
        const product = productPortal.getCurrentProduct();
        if (product) window.openProjectPreview(product.url, product.name, event.currentTarget);
    });
    function closePreview() {
        overlay.hidden = true;
        frame.removeAttribute('src');
        previewLauncher?.focus();
    }
    document.getElementById('preview-close').addEventListener('click', closePreview);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !overlay.hidden) closePreview();
        if (event.key === 'Escape' && !barberGuide.hidden) closeBarberGuide();
    });
    previewButton.addEventListener('click', () => {
        if (selectedProject?.url) window.openProjectPreview(selectedProject.url, selectedProject.name, lastFocus);
    });
    adminPreviewButton.addEventListener('click', () => {
        if (selectedProject?.adminUrl) window.openProjectPreview(selectedProject.adminUrl, selectedProject.name + ' · Admin', lastFocus);
    });
    clientSwitch.addEventListener('click', () => {
        frame.src = 'prototypes/barberia/index.html';
        document.getElementById('preview-title').textContent = 'Forbici & Pettini · Cliente';
    });
    adminSwitch.addEventListener('click', () => {
        frame.src = 'prototypes/barberia/staff.html';
        document.getElementById('preview-title').textContent = 'Forbici & Pettini · Admin';
    });
});
