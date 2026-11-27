(() => {
  document.querySelectorAll('.tour .story').forEach(story => {
    const nodes = [...story.children].filter(node =>
      (node.matches('p') && !node.classList.contains('eyebrow')) || node.matches('details'));
    const live = story.querySelector('.live-card');
    const pages = document.createElement('div'); pages.className = 'guide-pages';
    for (let index = 0; index < nodes.length; index += 2) {
      const page = document.createElement('div'); page.className = 'guide-page';
      page.hidden = index !== 0; page.append(...nodes.slice(index, index + 2)); pages.append(page);
    }
    story.insertBefore(pages, live);
    const nav = document.createElement('div'); nav.className = 'guide-page-nav';
    const prev = document.createElement('button'), next = document.createElement('button'), count = document.createElement('span');
    prev.type = next.type = 'button'; prev.textContent = '← Precedente'; next.textContent = 'Continua →';
    let index = 0;
    const update = () => { [...pages.children].forEach((page, i) => { page.hidden = i !== index; }); prev.disabled = index === 0; next.disabled = index === pages.children.length - 1; count.textContent = `${index + 1} / ${pages.children.length}`; };
    prev.addEventListener('click', () => { index--; update(); }); next.addEventListener('click', () => { index++; update(); });
    nav.append(prev, count, next); story.insertBefore(nav, live); update();
  });
  const explanations = {
    apertura: ['La prima impressione', 'Fotografia, nome e invito a scoprire la storia introducono l’identità della cantina.'],
    famiglia: ['La famiglia', 'Il racconto delle generazioni dà un volto al marchio e spiega la continuità del lavoro.'],
    vigna: ['La vigna', 'Il territorio e il lavoro tra i filari diventano parte dell’esperienza di visita.'],
    cantina: ['La cantina', 'Luoghi, strumenti e gesti mostrano come il prodotto nasce e matura.'],
    vino: ['Il vino', 'La presentazione del vino unisce immagine, carattere e dettagli del prodotto.'],
    contatti: ['Contatti', 'Il visitatore può trovare i recapiti. Il modulo di questa demo mostra soltanto una conferma locale e non invia messaggi.'],
  };
  const adminTopics = {
    visite: ['Prenotazioni dei tour', 'Ogni richiesta mostra data, gruppo e numero di ospiti. Prova a confermare o annullare: il contatore si aggiorna e l’azione compare nelle notifiche.'],
    messaggi: ['Centro notifiche', 'Qui trovi le azioni sui tour e gli avvisi di scorta. Usa «Segna come letto» per aggiornare il contatore.'],
    vini: ['Inventario bottiglie', 'Ogni riga mostra vino, lotto e disponibilità. Modifica la quantità con + o −. Sotto le 20 bottiglie appare un avviso di scorta.'],
    contenuti: ['Storia e contenuti', 'Il riepilogo distingue i contenuti pubblicati dalle bozze, dalle schede dei vini al diario della vendemmia.'],
  };
  const clientFrame = document.getElementById('client-frame');
  function update(role, item) {
    document.getElementById(`wine-${role}-title`).textContent = item[0];
    document.getElementById(`wine-${role}-text`).textContent = item[1];
    const card = document.getElementById(`wine-${role}-title`).closest('.live-card');
    card.classList.remove('is-changing'); void card.offsetWidth; card.classList.add('is-changing');
  }
  let current = 'client', moving = false;
  const curtain = document.getElementById('tour-curtain');
  const sections = { client: document.getElementById('cliente'), admin: document.getElementById('amministrazione') };
  sections.admin.setAttribute('aria-hidden', 'true');
  function switchView(next) {
    if (moving || next === current) return;
    moving = true;
    const reveal = () => {
      sections[current].classList.remove('is-active'); sections[current].setAttribute('aria-hidden', 'true');
      sections[next].classList.add('is-active'); sections[next].removeAttribute('aria-hidden');
      document.getElementById('view-label').textContent = next === 'admin' ? 'VISTA ADMIN' : 'VISTA VISITATORE';
      current = next;
      sections[next].querySelector('[data-switch]').focus({ preventScroll: true });
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { reveal(); moving = false; return; }
    curtain.classList.remove('is-moving'); void curtain.offsetWidth; curtain.classList.add('is-moving');
    setTimeout(reveal, 390);
    setTimeout(() => { curtain.classList.remove('is-moving'); moving = false; }, 810);
  }
  document.querySelectorAll('[data-switch]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); switchView(link.dataset.switch); }));
  document.querySelectorAll('[data-topic]').forEach(button => button.addEventListener('click', () => {
    const item = adminTopics[button.dataset.topic]; update('admin', item);
  }));
  document.querySelector('[data-reload="client"]').addEventListener('click', () => { clientFrame.src = clientFrame.src; update('client', explanations.apertura); });
  window.addEventListener('message', event => {
    if (event.source !== clientFrame.contentWindow || event.data?.source !== 'wine-guide') return;
    if (event.data.section && explanations[event.data.section]) update('client', explanations[event.data.section]);
  });
  document.getElementById('guide-back').addEventListener('click', event => {
    if (window.parent === window) return;
    event.preventDefault(); window.parent.postMessage({ source: 'barber-tour', action: 'close' }, '*');
  });
})();
