(() => {
  let expandedPane;
  let opener;

  function resizeGuide(expanded) {
    // Direct access is available when the guide and portfolio share an origin.
    window.frameElement?.closest('.barber-guide-overlay')?.classList.toggle('is-preview-expanded', expanded);
    window.parent.postMessage({ source: 'barber-tour', action: 'preview-size', expanded }, '*');
  }

  function restore() {
    if (!expandedPane) return;
    expandedPane.classList.remove('is-expanded');
    expandedPane = undefined;
    resizeGuide(false);
    opener?.focus({ preventScroll: true });
  }

  async function close() {
    if (document.fullscreenElement === expandedPane) await document.exitFullscreen();
    restore();
  }

  document.querySelectorAll('.demo-pane').forEach(pane => {
    const exit = document.createElement('button');
    exit.type = 'button';
    exit.className = 'exit-expanded';
    exit.textContent = 'Torna alla guida';
    exit.addEventListener('click', close);
    pane.append(exit);

    pane.querySelector('[data-expand]').addEventListener('click', async event => {
      opener = event.currentTarget;
      expandedPane = pane;
      pane.classList.add('is-expanded');
      exit.focus({ preventScroll: true });
      resizeGuide(true);
      try {
        await pane.requestFullscreen?.();
      } catch { /* The guide can fill the browser viewport without the Fullscreen API. */ }
    });
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) restore();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expandedPane && !document.fullscreenElement) close();
  });
})();
