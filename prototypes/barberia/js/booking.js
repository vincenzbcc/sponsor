(async () => {
  const status = document.getElementById('booking-status');
  let data;
  try {
    data = await window.barberDemoApi('/catalog');
  } catch {
    status.textContent = 'Impossibile caricare l’agenda. Ricarica la pagina.';
    return;
  }
  const { services } = data;
  let { barbers } = data;
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome', dateStyle: 'short' }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  const firstDay = new Date(year, month - 1, day);
  const firstMonth = new Date(year, month - 1, 1);
  const fullDate = new Intl.DateTimeFormat('it-IT', { dateStyle: 'full' });
  const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });

  const byId = id => document.getElementById(id);
  const barberOptions = byId('barber-options');
  const booking = barberOptions.closest('.booking');
  const bios = byId('barber-bios');
  const workSection = byId('booking-work');
  const portfolio = byId('barber-portfolio');
  const photoWindow = portfolio.querySelector('.booking-photo-window');
  const photoDots = portfolio.querySelector('.booking-photo-dots');
  const photoToggle = portfolio.querySelector('.booking-photo-toggle');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = matchMedia('(max-width: 610px), (max-height: 500px) and (max-width: 950px)');
  const calendar = document.querySelector('.booking-calendar');
  const step = byId('booking-step');
  const prompt = byId('booking-prompt');
  const choices = byId('booking-choices');
  const back = byId('booking-back');
  const shortDate = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const calendarDays = byId('calendar-days');
  const calendarMonth = byId('calendar-month');
  const serviceField = byId('booking-service-field');
  const serviceSelect = byId('booking-service');
  const search = byId('booking-search');
  const previousMonth = byId('month-prev');
  const nextMonth = byId('month-next');
  const summary = byId('booking-summary');

  let barber = null;
  let selectedDay = null;
  let visibleMonth = firstMonth;
  let selectedTime = null;
  let selectedBarber = null;
  let selectedService = null;
  let stage = 'day';
  let photos = [];
  let photoIndex = 0;
  let photoTimer;
  let galleryVisible = false;
  let autoplay = !reducedMotion.matches;

  const time = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  const price = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  const dateKey = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(value => String(value).padStart(2, '0')).join('-');
  let requestVersion = 0;

  function button(label, onClick) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = label;
    element.addEventListener('click', onClick);
    return element;
  }

  function schedulePhoto() {
    clearTimeout(photoTimer);
    if (photos.length && autoplay && galleryVisible && !document.hidden && document.body.dataset.screen === 'sinistra') {
      photoTimer = setTimeout(() => showPhoto((photoIndex + 1) % photos.length, true), 5000);
    }
  }

  function showPhoto(index, slide = false) {
    const outgoing = photoWindow.lastElementChild;
    const frame = document.createElement('figure');
    frame.className = 'booking-photo';
    frame.append(photos[index]);
    photoWindow.replaceChildren(frame);

    if (slide && outgoing && !reducedMotion.matches && index !== photoIndex) {
      const duration = { duration: 420, easing: 'cubic-bezier(.3,.7,.25,1)' };
      outgoing.classList.add('booking-photo-outgoing');
      outgoing.setAttribute('aria-hidden', 'true');
      photoWindow.prepend(outgoing);
      frame.animate([{ transform: 'translateX(-105%)' }, { transform: 'translateX(0)' }], duration);
      outgoing.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(105%)' }], duration)
        .finished.then(() => outgoing.remove());
    }

    photoIndex = index;
    for (const [position, dot] of Array.from(photoDots.children).entries()) {
      dot.setAttribute('aria-pressed', String(position === index));
    }
    schedulePhoto();
  }

  function renderPortfolio() {
    workSection.hidden = !barber;
    if (!barber) {
      photos = [];
      photoWindow.replaceChildren();
      photoDots.replaceChildren();
      schedulePhoto();
      return;
    }

    photos = barber.photos.map(path => {
      const image = new Image(810, 452);
      image.alt = `Taglio di ${barber.name}`;
      image.src = path;
      return image;
    });
    photoDots.replaceChildren(...photos.map((photo, index) => {
      const dot = button('', () => {
        if (photoIndex !== index) showPhoto(index, true);
        else schedulePhoto();
      });
      dot.setAttribute('aria-label', `Foto ${index + 1} di ${photos.length}, ${photo.alt.toLowerCase()}`);
      return dot;
    }));
    showPhoto(0);
  }

  function updatePhotoToggle() {
    photoToggle.textContent = autoplay ? 'Pausa' : 'Riprendi';
    schedulePhoto();
  }

  photoToggle.addEventListener('click', () => {
    autoplay = !autoplay;
    updatePhotoToggle();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      autoplay = false;
      updatePhotoToggle();
    }
  });
  document.addEventListener('visibilitychange', schedulePhoto);
  new MutationObserver(schedulePhoto).observe(document.body, { attributeFilter: ['data-screen'] });
  new IntersectionObserver(([entry]) => {
    galleryVisible = entry.isIntersecting;
    schedulePhoto();
  }).observe(photoWindow);
  updatePhotoToggle();

  function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const offset = (visibleMonth.getDay() + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => document.createElement('span'));
    calendarMonth.textContent = monthName.format(visibleMonth);
    previousMonth.disabled = visibleMonth <= firstMonth;
    for (let number = 1; number <= count; number++) {
      const date = new Date(year, month, number);
      const control = button(String(number), () => {
        selectedDay = date;
        calendarDays.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
        control.setAttribute('aria-pressed', 'true');
        updateSummary();
        search.disabled = !selectedService;
      });
      control.disabled = date < firstDay || date.getDay() === 1;
      control.setAttribute('aria-label', fullDate.format(date));
      control.setAttribute('aria-pressed', String(+date === +selectedDay));
      cells.push(control);
    }
    calendarDays.replaceChildren(...cells);
  }

  function updateSummary() {
    const person = selectedBarber ?? barber;
    const when = [selectedDay && shortDate.format(selectedDay), selectedTime !== null && time(selectedTime)]
      .filter(Boolean).join(' ');
    const treatment = [selectedService?.name, person && `con ${person.name}`].filter(Boolean).join(' ');
    summary.textContent = [when, treatment].filter(Boolean).join(' · ');
  }

  const prompts = {
    day: 'Scegli giorno e servizio',
    time: 'Scegli un orario disponibile',
    review: 'Sei sicuro di voler confermare l’appuntamento?',
    done: 'Appuntamento confermato',
  };

  function show(next, focus = true) {
    const version = ++requestVersion;
    stage = next;
    if (next === 'day' || next === 'time') {
      selectedTime = null;
      selectedBarber = null;
    }
    updateSummary();
    prompt.textContent = prompts[next];
    calendar.hidden = serviceField.hidden = search.hidden = next !== 'day';
    back.hidden = next !== 'time';
    choices.replaceChildren();
    choices.dataset.step = next;
    status.textContent = '';

    if (next === 'day') {
      renderCalendar();
      search.disabled = !selectedDay || !selectedService;
    }
    if (next === 'time') loadTimes(version);
    if (next === 'review') {
      choices.append(button('Sì, conferma', confirmAppointment), button('No, cambia orario', () => show('time')));
      choices.firstElementChild.classList.add('booking-next');
    }
    if (next === 'done') {
      status.textContent = 'Trovi i dettagli e la conferma nella tua Area personale.';
      choices.append(button('I miei appuntamenti', () => window.barberAccount.open()), button('Nuovo appuntamento', () => show('day')));
    }
    step.scrollTop = 0;
    if (focus) step.focus({ preventScroll: true });
  }

  async function loadTimes(version) {
    status.textContent = 'Verifica della disponibilità…';
    const query = new URLSearchParams({ day: dateKey(selectedDay), service: selectedService.id, barber: barber?.id ?? '' });
    try {
      const { slots } = await window.barberAccount.api('/availability?' + query);
      if (version !== requestVersion) return;
      status.textContent = slots.length ? '' : 'Nessun orario per questo servizio. Cambia giorno o servizio.';
      function choose(slot) {
        selectedTime = slot.start;
        selectedBarber = barbers.find(person => person.id === slot.barber) ?? { id: slot.barber, name: slot.name };
        show('review');
      }
      const labelFor = slot => barber ? time(slot.start) : `${time(slot.start)} · ${slot.name}`;
      for (const slot of slots) {
        const control = button(labelFor(slot), () => choose(slot));
        control.className = 'booking-desktop-time';
        choices.append(control);
      }
      if (slots.length) {
        const label = document.createElement('label');
        const select = document.createElement('select');
        label.className = 'booking-mobile-only booking-mobile-picker';
        label.append('Orari disponibili', select);
        select.add(new Option('Seleziona l’orario', ''));
        slots.forEach((slot, index) => select.add(new Option(labelFor(slot), String(index))));
        select.addEventListener('change', () => {
          if (select.value !== '') choose(slots[Number(select.value)]);
        });
        choices.append(label);
      }
    } catch (error) {
      if (version === requestVersion) status.textContent = error.message;
    }
  }

  async function confirmAppointment() {
    if (stage !== 'review') return;
    const controls = [...choices.children, ...barberOptions.children];
    for (const control of controls) control.disabled = true;
    try {
      await window.barberAccount.api('/appointments', {
        day: dateKey(selectedDay), service: selectedService.id, barber: selectedBarber.id, start: selectedTime,
      });
      show('done');
      celebrate();
    } catch (error) {
      if (error.status === 401) {
        window.barberAccount.open({
          message: 'Accedi o registrati per confermare. Giorno, servizio e orario resteranno selezionati.',
          onLogin: () => { status.textContent = 'Accesso effettuato. Conferma per verificare di nuovo l’orario.'; },
        });
      } else if (error.status === 409) {
        show('time');
      } else {
        status.textContent = error.message;
      }
    } finally {
      for (const control of controls) control.disabled = false;
    }
  }

  function celebrate() {
    if (reducedMotion.matches) return;
    const layer = document.createElement('div');
    layer.className = 'booking-confetti';
    layer.setAttribute('aria-hidden', 'true');
    const colors = ['#f3ca8a', '#fff3d6', '#b86738', '#9db391', '#e18b81'];
    for (let index = 0; index < 40; index++) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', Math.random() * 100 + '%');
      piece.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
      piece.style.setProperty('--delay', Math.random() * 420 + 'ms');
      piece.style.backgroundColor = colors[index % colors.length];
      layer.append(piece);
    }
    document.querySelector('.booking').append(layer);
    setTimeout(() => layer.remove(), 2100);
  }

  function renderBio() {
    const profile = bios.closest('section');
    profile.hidden = !barber;
    bios.replaceChildren();
    if (barber) {
      const name = document.createElement('h4');
      const description = document.createElement('p');
      name.textContent = barber.name;
      bios.append(name, description);
      window.typeDescription(description, barber.bio);
    }
  }

  function renderBarber(chosen) {
    barber = chosen;
    renderPortfolio();
    renderBio();
    const offered = services.filter(service => !barber || barber.services.includes(service.id));
    if (!offered.includes(selectedService)) selectedService = null;
    serviceSelect.replaceChildren(new Option('Scegli un servizio', ''), ...offered.map(item =>
      new Option(`${item.name} · ${item.minutes} min · ${price(item.price)}`, item.id)
    ));
    serviceSelect.value = selectedService?.id ?? '';
    show('day', false);
  }

  function renderOptions() {
  barberOptions.replaceChildren();
  for (const professional of [null, ...barbers]) {
    const option = button(professional?.name ?? 'Qualsiasi barbiere', () => {
      if (professional === barber) return;
      barberOptions.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false');
      option.setAttribute('aria-pressed', 'true');
      renderBarber(professional);
    });
    const avatar = professional ? new Image(32, 32) : document.createElement('span');
    avatar.className = 'booking-avatar';
    if (professional) {
      avatar.alt = '';
      avatar.dataset.barber = professional.id;
      avatar.src = professional.avatar;
    } else {
      avatar.textContent = '✦';
      avatar.setAttribute('aria-hidden', 'true');
    }
    option.prepend(avatar);
    option.setAttribute('aria-pressed', String(professional === barber));
    if (barbers.length > 4) option.classList.add('booking-desktop-roster');
    barberOptions.append(option);
  }
  if (barbers.length > 4) {
    const label = document.createElement('label');
    const select = document.createElement('select');
    label.className = 'booking-mobile-only booking-mobile-picker';
    select.add(new Option('Qualsiasi barbiere', ''));
    barbers.forEach(person => select.add(new Option(person.name, person.id)));
    select.value = barber?.id ?? '';
    select.addEventListener('change', () => {
      renderBarber(barbers.find(person => person.id === select.value) ?? null);
      for (const [index, control] of Array.from(barberOptions.querySelectorAll('button')).entries()) {
        control.setAttribute('aria-pressed', String(([null, ...barbers][index]) === barber));
      }
    });
    label.append('Barbiere', select);
    barberOptions.append(label);
  }
  }

  new MutationObserver(async () => {
    if (document.body.dataset.screen !== 'sinistra') return;
    try {
      const fresh = await window.barberAccount.api('/catalog');
      if (JSON.stringify(fresh.barbers) === JSON.stringify(barbers)) return;
      barbers = fresh.barbers;
      renderBarber(barbers.find(person => person.id === barber?.id) ?? null);
      renderOptions();
    } catch { /* Keep the current catalog if the refresh fails. */ }
  }).observe(document.body, { attributeFilter: ['data-screen'] });

  function moveMonth(offset) {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    renderCalendar();
    if (offset < 0 && previousMonth.disabled) nextMonth.focus({ preventScroll: true });
  }

  previousMonth.addEventListener('click', () => moveMonth(-1));
  nextMonth.addEventListener('click', () => moveMonth(1));
  serviceSelect.addEventListener('change', () => {
    selectedService = services.find(item => item.id === serviceSelect.value) ?? null;
    search.disabled = !selectedDay || !selectedService;
    updateSummary();
  });
  search.addEventListener('click', () => show('time'));
  back.addEventListener('click', () => show('day'));
  byId('booking-mobile-next').addEventListener('click', () => {
    booking.dataset.mobileStep = 'schedule';
    step.focus({ preventScroll: true });
  });
  byId('booking-mobile-team').addEventListener('click', () => {
    booking.dataset.mobileStep = 'team';
    const control = phone.matches && barbers.length > 4 ? barberOptions.querySelector('select') :
      barberOptions.querySelector('[aria-pressed="true"]');
    control?.focus({ preventScroll: true });
  });
  renderBarber(null);
  renderOptions();
})();
