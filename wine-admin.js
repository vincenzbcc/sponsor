(() => {
  const dashboard = document.getElementById('wine-admin-mock');
  const output = dashboard.querySelector('#wine-admin-detail');
  const summary = dashboard.querySelector('#wine-admin-summary');
  const feedback = dashboard.querySelector('#wine-admin-status');
  const tabs = [...dashboard.querySelectorAll('[data-topic]')];
  let stock;
  let tours;
  let notices;
  let activeTopic;

  function reset() {
    stock = [
      { wine: 'Vespera Rosso', lot: 'VR-24', bottles: 128 },
      { wine: 'Vespera Bianco', lot: 'VB-25', bottles: 72 },
      { wine: 'Vespera Rosato', lot: 'VS-25', bottles: 18 }
    ];
    tours = [
      { group: 'Gruppo Olivo', date: 'Sabato · 11:00', people: 4, status: 'Da confermare' },
      { group: 'Gruppo Rovere', date: 'Sabato · 16:30', people: 6, status: 'Confermata' },
      { group: 'Gruppo Ginestra', date: 'Domenica · 10:30', people: 2, status: 'Da confermare' }
    ];
    notices = [
      { title: 'Nuova richiesta · Gruppo Olivo', detail: 'Degustazione per 4 persone', unread: true },
      { title: 'Scorta bassa · Vespera Rosato', detail: '18 bottiglie disponibili', unread: true }
    ];
    show('visite');
  }

  function node(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  }

  function action(label, handler) {
    const button = node('button', label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  function row(title, detail, controls = []) {
    const item = document.createElement('article');
    item.className = 'wine-admin-row';
    const description = document.createElement('div');
    description.append(node('strong', title), node('p', detail));
    item.append(description, ...controls);
    return item;
  }

  function addNotice(title, detail) {
    notices.unshift({ title, detail, unread: true });
    feedback.textContent = title;
  }

  function show(topic) {
    activeTopic = topic;
    const unread = notices.filter(notice => notice.unread).length;
    const pending = tours.filter(tour => tour.status === 'Da confermare').length;
    summary.textContent = `${stock.reduce((total, item) => total + item.bottles, 0)} bottiglie · ${pending} tour da confermare · ${unread} avvisi nuovi`;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.topic === topic)));
    output.replaceChildren();

    if (topic === 'visite') {
      output.append(node('h3', 'Prenotazioni dei tour'));
      tours.forEach(tour => {
        const controls = [];
        if (tour.status === 'Da confermare') {
          controls.push(action('Conferma', () => {
            tour.status = 'Confermata';
            addNotice(`Tour confermato · ${tour.group}`, tour.date);
            show(topic);
          }));
        }
        if (tour.status !== 'Annullata') {
          controls.push(action('Annulla', () => {
            tour.status = 'Annullata';
            addNotice(`Tour annullato · ${tour.group}`, tour.date);
            show(topic);
          }));
        }
        output.append(row(tour.group, `${tour.date} · ${tour.people} ospiti · ${tour.status}`, controls));
      });
    }

    if (topic === 'vini') {
      output.append(node('h3', 'Inventario bottiglie'));
      stock.forEach(item => {
        const adjust = amount => {
          item.bottles += amount;
          if (item.bottles === 19 && amount < 0) addNotice(`Scorta bassa · ${item.wine}`, 'Disponibilità sotto le 20 bottiglie');
          show(topic);
        };
        const remove = action('−', () => adjust(-1));
        remove.disabled = item.bottles === 0;
        remove.setAttribute('aria-label', `Togli una bottiglia di ${item.wine}`);
        const add = action('+', () => adjust(1));
        add.setAttribute('aria-label', `Aggiungi una bottiglia di ${item.wine}`);
        const low = item.bottles < 20 ? ' · Scorta bassa' : '';
        output.append(row(item.wine, `Lotto ${item.lot} · ${item.bottles} bottiglie${low}`, [remove, add]));
      });
    }

    if (topic === 'messaggi') {
      output.append(node('h3', 'Centro notifiche'));
      notices.forEach(notice => {
        const controls = notice.unread ? [action('Segna come letto', () => {
          notice.unread = false;
          show(topic);
        })] : [];
        output.append(row(notice.title, `${notice.unread ? 'Nuovo' : 'Letto'} · ${notice.detail}`, controls));
      });
    }

    if (topic === 'contenuti') {
      output.append(node('h3', 'Contenuti del sito'));
      output.append(
        row('Famiglia, vigna e cantina', 'Pubblicati · racconto e fotografie'),
        row('Schede dei vini', 'Pubblicate · Rosso, Bianco e Rosato'),
        row('Diario della vendemmia', 'Bozza · idea per un aggiornamento stagionale')
      );
    }
  }

  tabs.forEach(tab => tab.addEventListener('click', () => {
    if (activeTopic !== tab.dataset.topic) show(tab.dataset.topic);
  }));
  document.querySelector('[data-reload="admin"]').addEventListener('click', () => {
    feedback.textContent = 'Dati della demo ripristinati.';
    reset();
    tabs[0].click();
  });
  reset();
})();
