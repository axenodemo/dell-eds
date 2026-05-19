const PLAY_ICON = `<svg class="hero-video-banner__play-icon" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.5"/>
  <path d="M9.5 7.5L15.5 11L9.5 14.5V7.5Z" fill="currentColor"/>
</svg>`;

export default function decorate(block) {
  const rows = [...block.children];

  const eyebrow = rows[0]?.querySelector("p")?.textContent?.trim();
  const title = rows[1]?.querySelector("p")?.textContent?.trim();
  const desc = rows[2]?.querySelector("p")?.textContent?.trim();
  const playVideo = rows[3]?.querySelector("p")?.textContent?.trim();
  const learnMore = rows[4]?.querySelector("p")?.textContent?.trim();
  const viewAll = rows[5]?.querySelector("p")?.textContent?.trim();
  const videoSrc =
    rows[6]?.querySelector("a")?.href ||
    rows[6]?.querySelector("p")?.textContent?.trim();
  const posterSrc =
    rows[7]?.querySelector("a")?.href ||
    rows[7]?.querySelector("p")?.textContent?.trim();

  function parseCTA(str) {
    if (!str) return null;
    const [label, url] = str.split("|").map((s) => s.trim());
    return { label, url: url || "#" };
  }

  const playCTA = parseCTA(playVideo);
  const learnCTA = parseCTA(learnMore);
  const viewCTA = parseCTA(viewAll);

  block.innerHTML = `
    <div class="hero-video-banner__bg">
      ${
        videoSrc
          ? `<video autoplay muted loop playsinline${posterSrc ? ` poster="${posterSrc}"` : ""}>
          <source src="${videoSrc}" type="video/mp4">
        </video>`
          : ""
      }
      <div class="hero-video-banner__overlay"></div>
    </div>
    <div class="hero-video-banner__content">
      ${eyebrow ? `<p class="hero-video-banner__eyebrow">${eyebrow}</p>` : ""}
      ${title ? `<h1 class="hero-video-banner__title">${title}</h1>` : ""}
      ${desc ? `<p class="hero-video-banner__desc">${desc}</p>` : ""}
      <div class="hero-video-banner__actions">
        ${playCTA ? `<button class="hero-video-banner__btn hero-video-banner__btn--primary" type="button">${PLAY_ICON}${playCTA.label || "Play Video"}</button>` : ""}
        <div class="hero-video-banner__links">
          ${learnCTA ? `<a class="hero-video-banner__btn hero-video-banner__btn--link" href="${learnCTA.url}">${learnCTA.label} &rarr;</a>` : ""}
          ${viewCTA ? `<a class="hero-video-banner__btn hero-video-banner__btn--link" href="${viewCTA.url}">${viewCTA.label} &rarr;</a>` : ""}
        </div>
      </div>
    </div>
    <button class="hero-video-banner__pause" aria-label="Pause background video">Pause &nbsp;||</button>
    <div class="hero-video-banner__modal" aria-hidden="true" role="dialog" aria-modal="true" tabindex="-1">
      <div class="hero-video-banner__modal-backdrop"></div>
      <div class="hero-video-banner__modal-panel" role="document">
        <button class="hero-video-banner__modal-close" type="button" aria-label="Close video">&times;</button>
        <div class="hero-video-banner__modal-video">
          <video controls playsinline${posterSrc ? ` poster="${posterSrc}"` : ""}>
            <source src="${videoSrc || ""}" type="video/mp4">
            Sorry, your browser does not support embedded videos.
          </video>
        </div>
      </div>
    </div>
  `;

  const backgroundVideo = block.querySelector(".hero-video-banner__bg video");
  const pauseBtn = block.querySelector(".hero-video-banner__pause");
  const playBtn = block.querySelector(".hero-video-banner__btn--primary");
  const modal = block.querySelector(".hero-video-banner__modal");
  const modalClose = block.querySelector(".hero-video-banner__modal-close");
  const modalBackdrop = block.querySelector(
    ".hero-video-banner__modal-backdrop",
  );
  const modalVideo = block.querySelector(
    ".hero-video-banner__modal-video video",
  );

  const toggleBackgroundVideo = () => {
    if (!backgroundVideo) return;
    if (backgroundVideo.paused) {
      backgroundVideo.play();
      pauseBtn.innerHTML = "Pause &nbsp;||";
    } else {
      backgroundVideo.pause();
      pauseBtn.innerHTML = "Play &nbsp;&#9654;";
    }
  };

  const openModal = () => {
    if (!modal || !modalVideo || !videoSrc) return;
    modal.classList.add("hero-video-banner__modal--open");
    modal.setAttribute("aria-hidden", "false");
    modalVideo.currentTime = 0;
    const promise = modalVideo.play();
    if (promise?.catch) promise.catch(() => {});
    document.body.style.overflow = "hidden";
    modal.focus();
  };

  const closeModal = () => {
    if (!modal || !modalVideo) return;
    modal.classList.remove("hero-video-banner__modal--open");
    modal.setAttribute("aria-hidden", "true");
    modalVideo.pause();
    document.body.style.overflow = "";
  };

  if (pauseBtn) pauseBtn.addEventListener("click", toggleBackgroundVideo);
  if (playBtn) playBtn.addEventListener("click", openModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }
}
