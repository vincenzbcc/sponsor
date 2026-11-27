(() => {
  const byId = id => document.getElementById(id);
  const day = byId('day');
  const barber = byId('barber');
  const dialog = byId('details');
  const detail = byId('detail-content');
  const status = byId('status');
  const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', dateStyle: 'short' });
  const money = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
  const today = () => dateFormat.format(new Date());
  const time = minutes => [Math.floor(minutes / 60), minutes % 60].map(n => String(n).padStart(2, '0')).join(':');
  const minute = value => value.split(':').map(Number).reduce((hours, mins) => hours * 60 + mins);
  const euro = cents => money.format(cents / 100);
  let roster;
  let panel = 'agenda';
  let loadId = 0;
  let loaded;

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function button(label, run) {
    const control = element('button', label);
    control.type = 'button';
    control.addEventListener('click', run);
    return control;
  }

  function field(label, type, name, value = '', required = true) {
    const control = element('input');
    control.type = type;
    control.name = name;
    control.value = value;
    control.required = required;
    return labelField(label, control);
  }

  function labelField(label, control) {
    const container = element('label', label);
    container.append(control);
    return container;
  }

  function selectField(label, name, entries, selected) {
    const select = element('select');
    select.name = name;
    for (const item of entries) {
      const text = item.minutes ? `${item.name} (${item.minutes} min)` : item.name;
      select.add(new Option(text, item.id));
    }
    select.value = selected || entries[0]?.id || '';
    return labelField(label, select);
  }

  async function api(path, data) {
    return window.barberDemoApi(path, data);
  }

  function form(label, fields, submit) {
    const node = element('form');
    const submitButton = element('button', label);
    submitButton.type = 'submit';
    node.append(...fields, submitButton);
    node.addEventListener('submit', async event => {
      event.preventDefault();
      submitButton.disabled = true;
      byId('detail-status').textContent = '';
      try {
        await submit(Object.fromEntries(new FormData(node)));
      } catch (error) {
        byId('detail-status').textContent = error.message;
      } finally {
        submitButton.disabled = false;
      }
    });
    return node;
  }

  function showDetail(title) {
    byId('detail-title').textContent = title;
    byId('detail-status').textContent = '';
    detail.replaceChildren();
    if (!dialog.open) dialog.showModal();
  }

  const overlaps = (item, start, end) => item.start < end && item.end > start;
  const captions = { served: 'Servito', no_show: 'Non presentato', confirmed: 'Prenotato' };

  function renderGrid({ shifts, appointments, blocks }) {
    const grid = byId('grid');
    grid.replaceChildren();
    const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', timeStyle: 'short' }).format(new Date());
    const isFuture = start => day.value > today() || (day.value === today() && start > minute(now));
    const people = roster.barbers.find(item => item.id === barber.value);
    const active = appointments.filter(item => item.status !== 'cancelled');
    const cancelled = appointments.filter(item => item.status === 'cancelled');

    function fullRow(label, message) {
      const row = element('tr');
      const heading = element('th', label);
      heading.scope = 'row';
      row.append(heading, element('td', message, 'closed'));
      grid.append(row);
    }

    function slotRow(start, end, item, old, block, canBook) {
      const row = element('tr');
      const heading = element('th', `${time(start)}–${time(end)}`);
      heading.scope = 'row';
      const createdToday = item && dateFormat.format(new Date(item.created * 1000)) === today();
      const cell = element('td', '', item ? (createdToday ? 'new' : 'current') : (old ? 'cancelled' : 'free'));
      if (item) {
        const title = item.status === 'confirmed' && createdToday ? 'Nuovo oggi' : captions[item.status];
        cell.append(button(`${title} · ${item.client} · ${item.service} (${time(item.start)}–${time(item.end)})`, () => edit(item)));
      } else if (block) {
        cell.className = 'closed';
        cell.append(button(`Bloccato · ${block.reason}`, () => manageBlock(block)));
      } else {
        const title = old ? `Disdetto · ${old.client} · ${old.service} · Libero` : 'Libero';
        const control = button(`${title} · Aggiungi`, () => add(start));
        control.disabled = !canBook;
        cell.append(control);
      }
      row.append(heading, cell);
      grid.append(row);
    }

    if (!shifts.length) fullRow('Lunedì', 'Chiuso');
    for (const [index, [opening, closing]] of shifts.entries()) {
      if (index) fullRow(`${time(shifts[index - 1][1])}–${time(opening)}`, 'Pausa pranzo');
      for (let start = opening; start < closing; start += 30) {
        const at = point => active.find(item => overlaps(item, point, point + 15));
        const oldAt = point => cancelled.findLast(item => overlaps(item, point, point + 15));
        const blockAt = point => blocks.find(block => block.first_minute <= point && block.last_minute > point);
        const first = at(start), second = at(start + 15), oldFirst = oldAt(start), oldSecond = oldAt(start + 15);
        const firstBlock = blockAt(start), secondBlock = blockAt(start + 15);
        const split = first !== second || firstBlock !== secondBlock || (!first && oldFirst !== oldSecond);
        slotRow(start, start + (split ? 15 : 30), first, oldFirst, firstBlock, Boolean(people?.active));
        if (split) {
          slotRow(start + 15, start + 30, second, oldSecond, secondBlock, Boolean(people?.active));
        }
      }
    }
    byId('history-list').replaceChildren(...(cancelled.length ? cancelled.map(item =>
      element('li', `${time(item.start)} · ${item.client} · ${item.service}`)) : [element('li', 'Nessuna disdetta.')]));
  }

  function renderReport(report) {
    function list(title, values) {
      const group = element('section');
      const items = element('ul');
      items.append(...(values.length ? values : ['Nessuno.']).map(value => element('li', value)));
      group.append(element('h3', title), items);
      return group;
    }
    const describe = item => `${time(item.start)} · ${item.client} · ${item.service}`;
    const idle = report.idle.reduce((sum, [start, end]) => sum + end - start, 0);
    const duration = m => `${Math.floor(m / 60)} h ${m % 60} min`;
    byId('report-content').replaceChildren(
      element('p', `Ore lavorate: ${duration(report.minutes)} · Turni coperti: ${report.served.length} · Incassato: ${euro(report.paid)}`),
      list('Clienti serviti', report.served.map(describe)), list('Clienti non presentati', report.absent.map(describe)),
      list(`Buchi trascorsi · ${duration(idle)}`, report.idle.map(([start, end]) => `${time(start)}–${time(end)} · ${end - start} min`)),
    );
  }

  async function loadAgenda({ quiet = false } = {}) {
    if (!day.value || !barber.value) return;
    const id = ++loadId;
    try {
      const result = await api('/staff/appointments?' + new URLSearchParams({ day: day.value, barber: barber.value }));
      if (id !== loadId) return;
      loaded = result;
      byId('schedule-title').textContent = `${barber.selectedOptions[0].textContent} · ${day.value.split('-').reverse().join('/')}`;
      renderGrid(result);
      renderReport(result.report);
      if (!quiet) status.textContent = '';
    } catch (error) {
      if (id === loadId && !quiet) status.textContent = error.message;
    }
  }

  function servicesFor(id, minutes = null) {
    const person = roster.barbers.find(item => item.id === id);
    return roster.services.filter(item => person?.services.includes(item.id) && (!minutes || item.minutes === minutes));
  }

  function manageBlock(block) {
    const target = { barber: barber.value, day: day.value };
    if (block) {
      showDetail(`Fascia bloccata · ${time(block.first_minute)}–${time(block.last_minute)}`);
      detail.append(element('p', block.reason), form('Rendi la fascia disponibile', [], async () => {
        await api('/staff/blocks', { ...target, action: 'remove', id: block.id });
        dialog.close();
        await loadAgenda();
      }));
      return;
    }
    showDetail('Blocca fascia');
    const start = field('Dalle', 'time', 'start', '08:00');
    const end = field('Alle', 'time', 'end', '08:30');
    start.lastChild.step = end.lastChild.step = '900';
    detail.append(form('Blocca', [start, end, field('Motivo', 'text', 'reason', '', false)], async values => {
      await api('/staff/blocks', { ...target, start: minute(values.start), end: minute(values.end), reason: values.reason });
      dialog.close();
      await loadAgenda();
    }));
  }

  function availableMinutes(start) {
    const active = loaded?.appointments.filter(item => item.status !== 'cancelled') || [];
    const blocks = loaded?.blocks || [];
    const nextAppt = active.filter(item => item.start > start).sort((a, b) => a.start - b.start)[0];
    const nextBlock = blocks.filter(b => b.first_minute > start).sort((a, b) => a.first_minute - b.first_minute)[0];
    let limit = 24 * 60;
    if (nextAppt) limit = Math.min(limit, nextAppt.start);
    if (nextBlock) limit = Math.min(limit, nextBlock.first_minute);
    const shift = (loaded?.shifts || []).find(([op, cl]) => op <= start && cl > start);
    if (shift) limit = Math.min(limit, shift[1]);
    return Math.max(0, limit - start);
  }

  function add(start) {
    const target = barber.value, date = day.value;
    const maxMins = availableMinutes(start);
    const allServices = servicesFor(target, start % 30 ? 15 : null);
    const filtered = allServices.filter(s => !maxMins || s.minutes <= maxMins);
    const services = filtered.length ? filtered : allServices;
    showDetail(`Aggiungi appuntamento · ${time(start)}`);

    const serviceField = selectField('Servizio', 'service', services);
    const serviceSelect = serviceField.querySelector('select');
    let prevVal = serviceSelect.value;
    let confirmed15 = false;

    serviceSelect.addEventListener('change', () => {
      const chosen = services.find(s => s.id === serviceSelect.value);
      if (chosen?.minutes === 15) {
        const ok = confirm('Sei sicuro di voler prendere in carico un servizio di 15 minuti?\nSe lo fai si creerà un altro slot subito dopo di 15 minuti.');
        if (!ok) {
          serviceSelect.value = prevVal;
          return;
        }
        confirmed15 = true;
      } else {
        confirmed15 = false;
      }
      prevVal = serviceSelect.value;
    });

    detail.append(form('Conferma appuntamento', [
      field('Nome del cliente', 'text', 'first'), field('Cognome del cliente', 'text', 'last'),
      field('Email del cliente, se già registrato', 'email', 'email', '', false),
      serviceField,
    ], async data => {
      const chosen = services.find(s => s.id === data.service);
      if (chosen?.minutes === 15 && !confirmed15) {
        const ok = confirm('Sei sicuro di voler prendere in carico un servizio di 15 minuti?\nSe lo fai si creerà un altro slot subito dopo di 15 minuti.');
        if (!ok) return;
      }
      await api('/staff/appointments', { ...data, day: date, barber: target, start });
      dialog.close();
      await loadAgenda();
    }));
  }

  function edit(item) {
    const path = '/staff/appointments/' + encodeURIComponent(item.id);
    showDetail(item.client);
    detail.append(element('p', `${item.service} · ${time(item.start)}–${time(item.end)} · ${captions[item.status]}`));
    async function update(action, data) {
      await api(path + '/' + action, data);
      dialog.close();
      await loadAgenda();
    }

    if (item.status === 'confirmed') {
      const people = roster.barbers.filter(person => person.active);
      if (people.length) {
        const target = selectField('Barbiere', 'barber', people, item.barberId);
        const service = selectField('Servizio', 'service', servicesFor(target.lastChild.value), item.serviceId);
        target.lastChild.addEventListener('change', () => {
          service.lastChild.replaceChildren(...servicesFor(target.lastChild.value).map(offer =>
            new Option(offer.minutes ? `${offer.name} (${offer.minutes} min)` : offer.name, offer.id)
          ));
        });
        const start = field('Nuovo orario', 'time', 'start', time(item.start));
        start.lastChild.step = '900';
        detail.append(form('Salva modifica', [field('Nuova data', 'date', 'day', item.day), start, target, service],
          data => update('move', { ...data, start: minute(data.start) })));
      }
      const controls = element('div', '', 'actions');
      const actions = [
        ['Annulla appuntamento', 'cancel', {}, 'Annullare l’appuntamento e liberare l’orario?'],
        ['Segna come servito', 'outcome', { outcome: 'served' }],
        ['Segna come non presentato', 'outcome', { outcome: 'no_show' }],
      ];
      for (const [label, action, data, question] of actions) {
        const control = button(label, async () => {
          if (question && !confirm(question)) return;
          control.disabled = true;
          try { await update(action, data); }
          catch (error) { byId('detail-status').textContent = error.message; }
          finally { control.disabled = false; }
        });
        if (action === 'outcome' && Date.parse(item.datetime) > Date.now()) control.disabled = true;
        controls.append(control);
      }
      detail.append(controls);
    } else if (item.status === 'served') {
      const listPrice = roster.services.find(service => service.id === item.serviceId)?.price || 0;
      const amount = field('Importo incassato in euro', 'number', 'amount',
        String((item.paid ?? item.price ?? listPrice * 100) / 100));
      amount.lastChild.step = '0.01';
      amount.lastChild.min = '0';
      detail.append(form('Registra incasso', [amount], data => update('payment', { paid: Math.round(Number(data.amount) * 100) })));
    }
  }

  async function loadAlerts() {
    const { events } = await api('/staff/events');
    const list = byId('alert-list');
    list.replaceChildren();
    if (!events.length) list.append(element('p', 'Non ci sono notifiche.'));
    for (const event of events) {
      const entry = element('article', '', 'entry');
      entry.append(element('p', event.message), button('Apri in agenda', async () => {
        barber.value = event.barber;
        day.value = event.day;
        await show('agenda');
        const item = loaded?.appointments.find(appointment => appointment.id === event.appointment);
        if (item && item.status !== 'cancelled') edit(item);
        else if (item) {
          showDetail('Appuntamento disdetto');
          detail.append(element('p', `${item.client} · ${item.service} · ${time(item.start)}`));
        }
      }));
      list.append(entry);
    }
  }

  async function loadRoster() {
    const previous = barber.value;
    roster = await api('/staff/roster');
    barber.replaceChildren(...roster.barbers.map(person => new Option(person.name + (person.active ? '' : ' (disattivato)'), person.id)));
    barber.value = previous && roster.barbers.some(person => person.id === previous) ?
      previous : (roster.barber || roster.barbers[0].id);
    barber.disabled = roster.barbers.length === 1;
    byId('roster-nav').hidden = !roster.owner;
    if (!roster.owner) return;
    const list = byId('roster-list');
    list.replaceChildren(...roster.barbers.map(person => {
      const entry = element('div', '', 'entry');
      entry.append(element('p', `${person.name} · ${person.active ? 'Attivo' : 'Disattivato'}`));
      if (person.active && person.id !== roster.barber) {
        entry.append(button('Disattiva profilo', async () => {
          if (!confirm(`Rimuovere ${person.name} dal sito? Gli appuntamenti già fissati restano nell’agenda.`)) return;
          try {
            await api('/staff/roster', { action: 'deactivate', barber: person.id });
            await loadRoster();
          } catch (error) { status.textContent = error.message; }
        }));
      }
      return entry;
    }));
  }

  async function photo(file) {
    const image = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 760 / Math.max(image.width, image.height));
      const canvas = element('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [.82, .65, .45]) {
        const url = canvas.toDataURL('image/webp', quality);
        if (url.startsWith('data:image/webp;base64,') && url.length <= 350000) return url.split(',')[1];
      }
      throw new Error('Usa una foto più piccola.');
    } finally { image.close(); }
  }

  byId('new-barber').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('[type="submit"]');
    const data = new FormData(form);
    submit.disabled = true;
    status.textContent = '';
    try {
      const files = [data.get('avatar'), ...data.getAll('photos')];
      if (files.length !== 4 || files.some(file => !file.size)) throw new Error('Carica la foto profilo e tre foto dei tagli.');
      const images = await Promise.all(files.map(photo));
      await api('/staff/roster', { action: 'add', id: data.get('id'), name: data.get('name'),
        bio: data.get('bio'), services: data.getAll('service'), images });
      byId('new-credentials').textContent = 'Profilo aggiunto solo in questa anteprima. Nessun account creato.';
      form.reset();
      await loadRoster();
    } catch (error) { status.textContent = error.message; }
    finally { submit.disabled = false; }
  });

  async function show(section) {
    panel = section;
    status.textContent = '';
    for (const name of ['agenda', 'alerts', 'roster']) {
      byId(name).hidden = name !== section;
      byId(name + '-nav').setAttribute('aria-current', name === section ? 'page' : 'false');
    }
    try {
      if (section === 'agenda') await loadAgenda();
      if (section === 'alerts') await loadAlerts();
    } catch (error) { status.textContent = error.message; }
  }

  function changeDay(offset) {
    const date = new Date((day.value || today()) + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + offset);
    day.value = date.toISOString().slice(0, 10);
    loadAgenda();
  }

  for (const name of ['agenda', 'alerts', 'roster']) byId(name + '-nav').addEventListener('click', () => show(name));
  day.addEventListener('change', loadAgenda);
  barber.addEventListener('change', loadAgenda);
  byId('prev').addEventListener('click', () => changeDay(-1));
  byId('next').addEventListener('click', () => changeDay(1));
  byId('today').addEventListener('click', () => { day.value = today(); loadAgenda(); });
  byId('reload').addEventListener('click', loadAgenda);
  byId('add-block').addEventListener('click', () => manageBlock());
  byId('close').addEventListener('click', () => dialog.close());
  byId('exit').addEventListener('click', async () => {
    try {
      await api('/logout', {});
      location.assign('index.html');
    } catch (error) { status.textContent = error.message; }
  });

  async function init() {
    try {
      const { user } = await api('/session');
      if (!user?.staff) {
        status.replaceChildren('Area riservata al personale. ', button('Torna al sito', () => location.assign('index.html')));
        return;
      }
      await loadRoster();
      const checks = roster.services.map(service => {
        const label = field(service.name, 'checkbox', 'service', service.id, false);
        label.lastChild.checked = true;
        return label;
      });
      byId('roster-services').append(...checks);
      byId('workspace').hidden = false;
      day.value = today();
      await show('agenda');
      setInterval(() => {
        if (document.hidden || dialog.open) return;
        if (panel === 'agenda') loadAgenda({ quiet: true });
        if (panel === 'alerts') loadAlerts().catch(() => {});
      }, 20000);
    } catch (error) { status.textContent = error.message; }
  }
  init();
})();
