/**
 * Dell Carousel Block - EDS (Edge Delivery Services)
 *
 * Doc-based authoring structure:
 * Row 0: h1 = section title  ("Featured Products and Solutions")
 * Row 1: h4 = eyebrow        ("Dell Technologies Showcase")
 * Row 2+: Slide rows
 *   Left cell  → <picture>
 *   Right cell → h4 (slide eyebrow), h2 (headline), p (body),
 *                h5 per CTA: "Label<br><a href="…">…</a>"
 *
 * Final layout (matches Dell.com exactly):
 *
 *  ┌─────────────────────────────────────────────────────────────────┐
 *  │                                                                 │
 *  │ ┌────────────────────────────────────────────────────────────┐  │
 *  │ │ ◄peek│  dark left margin  │  IMAGE (right ~70%)  │peek►    │  │
 *  │ │      │  [white card]      │                      │         │  │
 *  │ └────────────────────────────────────────────────────────────┘  │
 *  │              ● ● ● ● ● ●                     [Play ▶]           │
 *  └─────────────────────────────────────────────────────────────────┘
 *
 *  - The carousel track slides are full-width of the inner viewport
 *  - The outer wrapper has overflow:hidden with padding on both sides
 *    so that prev/next slides partially peek
 *  - Prev/next arrows float over the left and right peek zones
 *  - Header (eyebrow + title) is inside the block, above the slide area,
 *    aligned to the same left position as the white card
 */

// ── CTA link builder ──────────────────────────────────────────────────────

function buildCtaLink(label, href) {
  const a = document.createElement('a');
  a.className = 'dc-cta-link';
  a.href = href;

  const span = document.createElement('span');
  span.textContent = label;
  a.appendChild(span);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'dc-cta-icon');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = '<path d="M9.29 6.71a1 1 0 000 1.41L13.17 12l-3.88 3.88a1 1 0 001.41 1.41l4.59-4.59a1 1 0 000-1.41L10.7 6.7a1 1 0 00-1.41.01z"/>';
  a.appendChild(svg);
  return a;
}

// ── Parse CTA from p: "Label<br><a href>url</a>" ────────────────────────

function parseCtaFromAnchor(anchor) {
  const url = anchor.getAttribute('href') || '';
  const label = anchor.textContent.trim();

  return label && url ? { label, url } : null;
}
// ── Parse one slide row ───────────────────────────────────────────────────

function parseSlideRow(row) {
  const cells = row.querySelectorAll(':scope > div');
  if (cells.length < 2) return null;
  const picture = cells[0].querySelector('picture');
  const textCell = cells[1];
  return {
    picture,
    eyebrow: textCell.querySelector('h4')?.textContent?.trim() || '',
    headline: textCell.querySelector('h2')?.textContent?.trim() || '',
    description: textCell.querySelector('p')?.textContent?.trim() || '',
    ctas: [...textCell.querySelectorAll('p > a')].map(parseCtaFromAnchor).filter(Boolean),
  };
}

// ── Build one slide ───────────────────────────────────────────────────────

function buildSlide(data, index, total) {
  const slide = document.createElement('div');
  slide.className = 'dc-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${index + 1} of ${total}`);
  slide.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false');
  if (index === 0) {
    slide.classList.add('dc-slide--active');
    slide.classList.remove('dc-slide--inactive');
  }
  // Image — pushed to the right, leaving dark strip on the left
  const imgWrap = document.createElement('div');
  imgWrap.className = 'dc-slide__image';
  if (data.picture) imgWrap.appendChild(data.picture);
  slide.appendChild(imgWrap);

  // White text card — absolutely positioned over the dark strip / image edge
  const card = document.createElement('div');
  card.className = 'dc-slide__card';

  if (data.eyebrow) {
    const ew = document.createElement('p');
    ew.className = 'dc-card__eyebrow';
    ew.textContent = data.eyebrow;
    card.appendChild(ew);
  }
  if (data.headline) {
    const h = document.createElement('h3');
    h.className = 'dc-card__headline';
    h.textContent = data.headline;
    card.appendChild(h);
  }
  if (data.description) {
    const p = document.createElement('p');
    p.className = 'dc-card__body';
    p.textContent = data.description;
    card.appendChild(p);
  }
  if (data.ctas?.length) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'dc-card__ctas';
    data.ctas.forEach(({ label, url }) => ctaWrap.appendChild(buildCtaLink(label, url)));
    card.appendChild(ctaWrap);
  }

  slide.appendChild(card);
  return slide;
}

// ── State transition ──────────────────────────────────────────────────────

// Matches the CSS --dc-transition duration (450ms)
const TRANSITION_MS = 450;

function goToSlide(index, track, slides, dotEls, state) {
  if (state.transitioning) return; // ignore clicks during animation
  state.index = index;
  state.transitioning = true;

  // Make all slides visible for the duration of the slide animation
  track.classList.add('dc-track--sliding');

  // Move the track — CSS transition handles the animation
  track.style.transform = `translateX(-${index * 100}%)`;

  // Update dots immediately
  dotEls.forEach((dot, i) => {
    const active = i === index;
    dot.classList.toggle('dc-dot--active', active);
    dot.setAttribute('aria-selected', String(active));
    dot.setAttribute('tabindex', active ? '0' : '-1');
  });

  // After transition completes: mark active slide, hide others, unlock
  setTimeout(() => {
    track.classList.remove('dc-track--sliding');
    slides.forEach((s, i) => {
      const active = i === index;
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
      s.classList.toggle('dc-slide--active', active);
    });
    state.transitioning = false;
  }, TRANSITION_MS);
}

// ── Auto-slide ────────────────────────────────────────────────────────────

function setPlayBtnState(btn, playing) {
  btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  btn.setAttribute('aria-pressed', String(playing));
  const labelEl = btn.querySelector('.dc-play__label');
  const pathEl = btn.querySelector('.dc-play__path');
  if (labelEl) labelEl.textContent = playing ? 'Pause' : 'Play';
  if (pathEl) {
    pathEl.setAttribute('d', playing
      ? 'M9 16h2V8H9v8zm4-8v8h2V8h-2z' // pause bars
      : 'M8 5v14l11-7z'); // play triangle
  }
}

function stopAutoSlide(state, playBtn) {
  clearInterval(state.timer);
  state.playing = false;
  if (playBtn) setPlayBtnState(playBtn, false);
}

function startAutoSlide(state, slides, track, dotEls, playBtn) {
  stopAutoSlide(state, playBtn);
  state.playing = true;
  setPlayBtnState(playBtn, true);
  state.timer = setInterval(() => {
    goToSlide((state.index + 1) % slides.length, track, slides, dotEls, state);
  }, 8000);
}

// ── Main decorate ─────────────────────────────────────────────────────────

export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  // const slideRows    = rows.slice(2);

  block.innerHTML = '';
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'Carousel');

  // ── Carousel stage: clips both left and right peek ────────────────────
  // Structure:
  //   .dc-stage (overflow:hidden, adds side padding so prev/next peek)
  //     .dc-track-wrap (full width of stage)
  //       .dc-track (sliding)
  //         .dc-slide × N
  //   .dc-nav--prev (abs, left peek zone)
  //   .dc-nav--next (abs, right peek zone)

  const stage = document.createElement('div');
  stage.className = 'dc-stage';
  stage.setAttribute('aria-live', 'polite');

  const track = document.createElement('div');
  track.className = 'dc-track';

  const slides = rows
    .map(parseSlideRow)
    .filter(Boolean)
    .map((data, i, arr) => {
      const slide = buildSlide(data, i, arr.length);
      track.appendChild(slide);
      return slide;
    });

  stage.appendChild(track);

  // Prev arrow — floats over left peek area
  const prevBtn = document.createElement('button');
  prevBtn.className = 'dc-nav dc-nav--prev';
  prevBtn.setAttribute('aria-label', 'Previous slide');
  prevBtn.textContent = '‹';

  // Next arrow — floats over right peek area
  const nextBtn = document.createElement('button');
  nextBtn.className = 'dc-nav dc-nav--next';
  nextBtn.setAttribute('aria-label', 'Next slide');
  nextBtn.textContent = '›';

  stage.appendChild(prevBtn);
  stage.appendChild(nextBtn);
  block.appendChild(stage);

  // ── Footer: dots (centred) + play (pinned right) ───────────────────────
  const footer = document.createElement('div');
  footer.className = 'dc-footer';

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'dc-dots';
  dotsWrap.setAttribute('role', 'tablist');
  dotsWrap.setAttribute('aria-label', 'Slide Navigation');

  const dotEls = slides.map((_, i) => {
    const btn = document.createElement('button');
    btn.className = `dc-dot${i === 0 ? ' dc-dot--active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', `Go to slide ${i + 1} of ${slides.length}`);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
    dotsWrap.appendChild(btn);
    return btn;
  });

  const playBtn = document.createElement('button');
  playBtn.className = 'dc-play';
  playBtn.setAttribute('aria-label', 'Play');
  playBtn.setAttribute('aria-pressed', 'false');
  playBtn.innerHTML = `
    <span class="dc-play__label">Play</span>
    <svg class="dc-play__icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path class="dc-play__path" d="M8 5v14l11-7z" fill="currentColor"/>
    </svg>`;

  footer.appendChild(dotsWrap);
  footer.appendChild(playBtn);
  block.appendChild(footer);

  // ── Wire interactions ──────────────────────────────────────────────────
  const state = {
    index: 0, playing: false, timer: null, transitioning: false,
  };

  dotEls.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i, track, slides, dotEls, state);
      stopAutoSlide(state, playBtn);
    });
  });

  prevBtn.addEventListener('click', () => {
    goToSlide((state.index - 1 + slides.length) % slides.length, track, slides, dotEls, state);
    stopAutoSlide(state, playBtn);
  });

  nextBtn.addEventListener('click', () => {
    goToSlide((state.index + 1) % slides.length, track, slides, dotEls, state);
    stopAutoSlide(state, playBtn);
  });

  playBtn.addEventListener('click', () => {
    if (state.playing) stopAutoSlide(state, playBtn);
    else startAutoSlide(state, slides, track, dotEls, playBtn);
  });

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prevBtn.click();
    else if (e.key === 'ArrowRight') nextBtn.click();
  });

  // Start auto-play on load
  startAutoSlide(state, slides, track, dotEls, playBtn);
}
