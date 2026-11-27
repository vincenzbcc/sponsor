(() => {
  if (window.parent === window) return;
  const sections = ['apertura','famiglia','vigna','cantina','vino','contatti'];
  function send(section) { window.parent.postMessage({ source: 'wine-guide', section }, '*'); }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    const section = link?.getAttribute('href').slice(1);
    if (section && sections.includes(section)) send(section);
  }, true);
  const observer = new IntersectionObserver(entries => {
    const top = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (top) send(top.target.id);
  }, { threshold: [.35,.6] });
  sections.forEach(id => { const node = document.getElementById(id); if (node) observer.observe(node); });
})();
