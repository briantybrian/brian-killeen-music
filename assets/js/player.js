// Brian Killeen Music — setlist player (listen.html only)
// Reads track data from TRACKS (defined in audio/tracks.js),
// builds the list, then wires up a shared <audio> element.

(function () {
  const container = document.getElementById('track-list');
  if (!container || typeof TRACKS === 'undefined' || !TRACKS.length) return;

  const audioEl = document.getElementById('player-audio');
  const bar     = document.getElementById('player-bar');
  const btnPlay = document.getElementById('player-play');
  const btnPrev = document.getElementById('player-prev');
  const btnNext = document.getElementById('player-next');
  const titleEl = document.getElementById('player-title');
  const fillEl  = document.getElementById('player-fill');
  const seekEl  = document.getElementById('player-progress');
  const timeCur = document.getElementById('player-time-cur');
  const timeTot = document.getElementById('player-time-tot');

  /* ---- build track list from TRACKS array ---- */

  const PLAY_SVG  = `<svg class="icon-play"  viewBox="0 0 10 12" fill="currentColor" width="11" height="13" aria-hidden="true"><path d="M0 0l10 6-10 6z"/></svg>`;
  const PAUSE_SVG = `<svg class="icon-pause" viewBox="0 0 10 12" fill="currentColor" width="11" height="13" aria-hidden="true" style="display:none"><rect x="0" y="0" width="3.5" height="12" rx="1"/><rect x="6.5" y="0" width="3.5" height="12" rx="1"/></svg>`;

  container.innerHTML = TRACKS.map((t, i) => `
    <li class="track-item"
        data-src="/audio/${t.file}"
        data-title="${t.title.replace(/"/g, '&quot;')}"
        role="button"
        tabindex="0"
        aria-label="Play ${t.title.replace(/"/g, '&quot;')}">
      <span class="track-num"       aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
      <span class="track-title">${t.title}</span>
      <span class="track-duration"  aria-hidden="true">–:––</span>
      <span class="track-play-icon" aria-hidden="true">${PLAY_SVG}${PAUSE_SVG}</span>
    </li>`).join('');

  const tracks = Array.from(container.querySelectorAll('.track-item'));
  let currentIndex = -1;
  let isSeeking = false;

  /* ---- helpers ---- */

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) return '–:––';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function setPlayState(playing) {
    btnPlay.querySelector('.icon-play').style.display  = playing ? 'none' : '';
    btnPlay.querySelector('.icon-pause').style.display = playing ? '' : 'none';
    btnPlay.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    if (currentIndex >= 0) {
      const t = tracks[currentIndex];
      t.querySelector('.icon-play').style.display  = playing ? 'none' : '';
      t.querySelector('.icon-pause').style.display = playing ? '' : 'none';
      t.classList.toggle('is-playing', playing);
    }
  }

  function loadTrack(index, autoPlay) {
    if (index < 0 || index >= tracks.length) return;
    if (currentIndex >= 0 && currentIndex !== index) {
      const prev = tracks[currentIndex];
      prev.classList.remove('is-active', 'is-playing');
      prev.querySelector('.icon-play').style.display  = '';
      prev.querySelector('.icon-pause').style.display = 'none';
    }
    currentIndex = index;
    const t = tracks[index];
    t.classList.add('is-active');
    t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    audioEl.src = t.dataset.src || '';
    titleEl.textContent = t.dataset.title || '';
    fillEl.style.width = '0%';
    timeCur.textContent = '0:00';
    timeTot.textContent = '–:––';
    seekEl.setAttribute('aria-valuenow', '0');

    bar.classList.add('is-visible');
    document.body.classList.add('player-open');

    if (autoPlay) {
      audioEl.load();
      audioEl.play().catch(() => {});
    } else {
      setPlayState(false);
    }
  }

  /* ---- track list clicks ---- */

  tracks.forEach((item, i) => {
    item.addEventListener('click', () => {
      if (i === currentIndex) {
        audioEl.paused ? audioEl.play().catch(() => {}) : audioEl.pause();
      } else {
        loadTrack(i, true);
      }
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });

  /* ---- player controls ---- */

  btnPlay.addEventListener('click', () => {
    if (currentIndex < 0) { loadTrack(0, true); return; }
    audioEl.paused ? audioEl.play().catch(() => {}) : audioEl.pause();
  });
  btnPrev.addEventListener('click', () => { if (currentIndex > 0) loadTrack(currentIndex - 1, true); });
  btnNext.addEventListener('click', () => { if (currentIndex < tracks.length - 1) loadTrack(currentIndex + 1, true); });

  /* ---- audio events ---- */

  audioEl.addEventListener('play',  () => setPlayState(true));
  audioEl.addEventListener('pause', () => setPlayState(false));
  audioEl.addEventListener('ended', () => {
    setPlayState(false);
    if (currentIndex < tracks.length - 1) loadTrack(currentIndex + 1, true);
    else tracks[currentIndex]?.classList.remove('is-playing');
  });
  audioEl.addEventListener('timeupdate', () => {
    if (isSeeking || !audioEl.duration) return;
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    fillEl.style.width = `${pct}%`;
    timeCur.textContent = fmt(audioEl.currentTime);
    seekEl.setAttribute('aria-valuenow', Math.round(pct));
  });
  audioEl.addEventListener('loadedmetadata', () => {
    timeTot.textContent = fmt(audioEl.duration);
    if (currentIndex >= 0) {
      const d = tracks[currentIndex].querySelector('.track-duration');
      if (d) d.textContent = fmt(audioEl.duration);
    }
  });

  /* ---- seek bar ---- */

  function seek(e) {
    if (!audioEl.duration) return;
    const rect = seekEl.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    audioEl.currentTime = pct * audioEl.duration;
    fillEl.style.width = `${pct * 100}%`;
    timeCur.textContent = fmt(audioEl.currentTime);
  }

  seekEl.addEventListener('click', seek);
  seekEl.addEventListener('mousedown',  () => { isSeeking = true; });
  document.addEventListener('mouseup',  () => { isSeeking = false; });
  seekEl.addEventListener('mousemove',  (e) => { if (isSeeking) seek(e); });
  seekEl.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });
  document.addEventListener('touchend', () => { isSeeking = false; });
  seekEl.addEventListener('touchmove',  (e) => { if (isSeeking) seek(e); }, { passive: true });

  /* ---- preload durations silently ---- */

  tracks.forEach((t) => {
    const src = t.dataset.src;
    if (!src) return;
    const tmp = new Audio();
    tmp.preload = 'metadata';
    tmp.addEventListener('loadedmetadata', () => {
      const d = t.querySelector('.track-duration');
      const dur = fmt(tmp.duration);
      if (d && dur !== '–:––') d.textContent = dur;
      tmp.src = '';
    });
    tmp.src = src;
  });
})();
