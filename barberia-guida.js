(() => {
  document.querySelectorAll('.tour .story').forEach(story => {
    const parts = [...story.children].filter(node =>
      (node.matches('p') && !node.classList.contains('eyebrow')) || node.matches('details'));
    const liveCard = story.querySelector('.live-card');
    const pages = document.createElement('div');
    pages.className = 'guide-pages';
    for (let index = 0; index < parts.length; index += 2) {
      const page = document.createElement('div');
      page.className = 'guide-page';
      page.hidden = index !== 0;
      page.append(...parts.slice(index, index + 2));
      pages.append(page);
    }
    story.insertBefore(pages, liveCard);
    const nav = document.createElement('div');
    nav.className = 'guide-page-nav';
    const previous = document.createElement('button');
    const next = document.createElement('button');
    previous.type = next.type = 'button';
    previous.textContent = '← Precedente';
    next.textContent = 'Continua →';
    const count = document.createElement('span');
    let currentPage = 0;
    const update = () => {
      [...pages.children].forEach((page, index) => { page.hidden = index !== currentPage; });
      previous.disabled = currentPage === 0;
      next.disabled = currentPage === pages.children.length - 1;
      count.textContent = `${currentPage + 1} / ${pages.children.length}`;
    };
    previous.addEventListener('click', () => { currentPage--; update(); });
    next.addEventListener('click', () => { currentPage++; update(); });
    nav.append(previous, count, next);
    story.insertBefore(nav, liveCard);
    update();
  });
  const descriptions = {
    client: {
      welcome: ['Ingresso nel salone', 'La prima schermata presenta il marchio. Un clic avvia l’animazione e porta alle due aree principali.'],
      menu: ['Scegli un percorso', 'Tagli & barbieri apre il portfolio e la prenotazione; Merch & prodotti presenta il catalogo. Anche il gesto di scorrimento può cambiare ambiente.'],
      sinistra: ['Tagli & barbieri', 'Qui il cliente confronta i professionisti, vede i lavori e sceglie chi prenotare. Giorno, servizio e orario vengono proposti in sequenza.'],
      destra: ['Merch & prodotti', 'Il catalogo mostra prodotti, descrizioni e prezzi. Il carrello è una dimostrazione: la modalità di vendita si definisce con l’attività.'],
      barber: ['Il professionista', 'La scelta del barbiere mostra foto profilo, lavori e descrizione. La disponibilità è calcolata per la sua poltrona.'],
      calendar: ['Giorno e servizio', 'Il calendario permette di cercare una data; il servizio determina la durata necessaria. Sono mostrati solo gli orari compatibili.'],
      time: ['Orari disponibili', 'La lista cambia in base al giorno, alla durata del servizio e al professionista scelto. Una fascia di 15 minuti può essere proposta quando resta libera.'],
      account: ['Area personale', 'Nel sito reale ogni cliente accederebbe al proprio profilo, allo storico, agli avvisi e ai dati personali. Qui l’account è soltanto dimostrativo.'],
      cart: ['Carrello prodotti', 'Gli articoli selezionati appaiono nel carrello con quantità e prezzo. Spedizione e ritiro in negozio sono due possibili percorsi per un progetto reale.'],
      product: ['Il prodotto', 'Ogni articolo presenta immagine, caratteristiche e prezzo. Il cliente può confrontarlo con gli altri e aggiungerlo al carrello dimostrativo.'],
      confirm: ['Conferma della prenotazione', 'Nel sito reale la conferma controllerebbe ancora una volta la disponibilità, registrerebbe la scelta nell’agenda e invierebbe un avviso al cliente e al barbiere. Qui l’esito è simulato.'],
      register: ['Accesso e registrazione', 'Un account reale richiederebbe email verificata, password, recupero credenziali e un profilo legato soltanto ai propri appuntamenti. Nella copia locale non vengono creati account.'],
      notices: ['Avvisi del cliente', 'Qui apparirebbero conferme, modifiche e promemoria associati ai suoi appuntamenti. Questa demo mostra soltanto esempi locali.'],
      back: ['Torna al salone', 'Il comando riporta alla scelta principale mantenendo la continuità dell’animazione.'],
    },
    admin: {
      agenda: ['Agenda del titolare', 'La griglia presenta la giornata del barbiere selezionato. Le righe distinguono fasce libere, prenotazioni, disdette e intervalli da 15 minuti.'],
      appointment: ['Dettaglio appuntamento', 'Aprendo una casella si possono consultare cliente, servizio e orario. Le azioni previste includono spostamento, disdetta ed esito della visita.'],
      day: ['Navigazione del calendario', 'Il titolare può cambiare data e scegliere l’agenda di Gianluca, Andrea o Matteo. Ogni professionista dispone della propria giornata.'],
      notices: ['Notifiche del team', 'Gli avvisi rendono visibili nuove prenotazioni, spostamenti e disdette. Nel sistema reale possono essere sincronizzati con l’agenda e inviati via email.'],
      roster: ['Barbieri e portfolio', 'Il titolare può aggiungere o disattivare un collaboratore e associare servizi, foto profilo, tagli e descrizione. I permessi dello staff restano distinti da quelli del proprietario.'],
      report: ['Resoconto giornata', 'Il riepilogo calcola ore da agenda, appuntamenti serviti, incassi registrati, assenze e intervalli rimasti liberi.'],
      block: ['Blocca una fascia', 'Pause e indisponibilità possono essere segnate in agenda per evitare nuove prenotazioni in quell’intervallo.'],
      add: ['Aggiungi appuntamento', 'Una casella libera può accogliere una prenotazione ricevuta per telefono o in negozio. Un’agenda reale controllerebbe disponibilità e durata prima di confermarla.'],
      cancel: ['Disdetta', 'L’appuntamento annullato resta nello storico e la fascia torna disponibile. In un sito collegato cliente e barbiere riceverebbero gli avvisi previsti.'],
      move: ['Sposta appuntamento', 'Data, orario, servizio o professionista possono cambiare, rispettando la disponibilità. Gli avvisi e il promemoria verrebbero aggiornati.'],
      outcome: ['Esito della visita', 'Il barbiere può segnare il cliente come servito o non presentato. Questo dato aggiorna il resoconto e distingue le assenze dalle disdette.'],
      payment: ['Incasso registrato', 'Dopo il servizio il titolare o il barbiere autorizzato può indicare l’importo pagato; il resoconto somma gli incassi effettivamente registrati.'],
    },
  };
  function show(role, key) {
    const item = descriptions[role]?.[key] || descriptions[role]?.[role === 'client' ? 'menu' : 'agenda'];
    document.getElementById(`${role}-action-title`).textContent = item[0];
    document.getElementById(`${role}-action-text`).textContent = item[1];
    const card = document.getElementById(`${role}-action-title`).closest('.live-card');
    card.classList.remove('is-changing');
    void card.offsetWidth;
    card.classList.add('is-changing');
  }
  const client = document.getElementById('client-frame');
  const admin = document.getElementById('admin-frame');
  const sections = { client: document.getElementById('cliente'), admin: document.getElementById('amministrazione') };
  const curtain = document.getElementById('tour-curtain');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 'client';
  let moving = false;
  function switchView(next) {
    if (moving || next === current) return;
    moving = true;
    if (next === 'admin' && !admin.getAttribute('src')) admin.src = admin.dataset.src;
    const reveal = () => {
      sections[current].classList.remove('is-active');
      sections[current].setAttribute('aria-hidden', 'true');
      sections[next].classList.add('is-active');
      sections[next].removeAttribute('aria-hidden');
      document.getElementById('view-label').textContent = next === 'admin' ? 'VISTA ADMIN' : 'VISTA CLIENTE';
      current = next;
      sections[next].querySelector('[data-switch]').focus({ preventScroll: true });
    };
    if (reducedMotion) { reveal(); moving = false; return; }
    curtain.classList.remove('is-moving');
    void curtain.offsetWidth;
    curtain.classList.add('is-moving');
    setTimeout(reveal, 390);
    setTimeout(() => { curtain.classList.remove('is-moving'); moving = false; }, 810);
  }
  sections.admin.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('[data-switch]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    switchView(link.dataset.switch);
  }));
  document.getElementById('guide-back').addEventListener('click', event => {
    if (window.parent === window) return;
    event.preventDefault();
    window.parent.postMessage({ source: 'barber-tour', action: 'close' }, '*');
  });
  window.addEventListener('message', event => {
    if (!event.data || event.data.source !== 'barber-guide') return;
    const role = event.source === client.contentWindow ? 'client' : event.source === admin.contentWindow ? 'admin' : null;
    if (!role || event.data.role !== role) return;
    if (event.data.type === 'action') show(role, event.data.key);
    if (event.data.type === 'backend') {
      const note = document.getElementById(`${role}-backend`);
      const text = document.getElementById(`${role}-backend-text`);
      note.hidden = false;
      text.textContent = role === 'client'
        ? 'Questa azione è simulata. Nel sito completo account e prenotazioni si collegano a un’agenda, con email di conferma, avvisi per le modifiche e promemoria configurabili (per esempio 8 ore prima). Nessuna email parte da questa anteprima.'
        : 'Questa modifica esiste soltanto nell’anteprima e sparisce ricaricando. Nel sito completo l’agenda condivisa registra l’azione e aggiorna gli avvisi per cliente e personale.';
    }
  });
  document.querySelectorAll('[data-reload]').forEach(button => button.addEventListener('click', () => {
    const frame = button.dataset.reload === 'client' ? client : admin;
    frame.src = frame.src;
    const role = button.dataset.reload;
    document.getElementById(`${role}-backend`).hidden = true;
    show(role, role === 'client' ? 'welcome' : 'agenda');
  }));
})();
