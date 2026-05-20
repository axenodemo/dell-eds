function getYoutubeId(url) {
  const match = url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

function createElement(tag, className) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function parseRow(row) {
  const cols = row.children;

  const title = cols[1]?.textContent.trim() || "";

  const description = cols[2]?.innerHTML || "";

  const thumbnailImage = cols[0]?.querySelector("img");
  const videoLink = cols[0]?.querySelector("a");
  const videoId = getYoutubeId(videoLink?.href || videoLink?.textContent);

  const thumbSrc =
    thumbnailImage?.src ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "");

  return { title, description, videoId, thumbSrc };
}

function showVideoPoster(videoId, title, container, thumbSrc) {
  container.innerHTML = "";

  const poster = createElement("div", "va-video-poster");

  const img = createElement("img");
  img.alt = title;
  img.src = thumbSrc || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  if (thumbSrc) {
    img.onerror = () => {
      img.onerror = () => {
        img.onerror = null;
        img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      };
      img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    };
  }

  const playButton = createElement("div", "va-big-play");
  playButton.innerHTML = `<svg viewBox="0 0 40 40" width="80" height="80">
    <circle cx="20" cy="20" r="19" fill="rgba(0,0,0,0.35)"/>
    <circle cx="20" cy="20" r="14" fill="none" stroke="#ffffff" stroke-width="2"/>
    <polygon points="15,12 30,20 15,28" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;

  poster.append(img, playButton);
  container.appendChild(poster);

  poster.addEventListener("click", (e) => {
    e.stopPropagation();
    container.innerHTML = "";
    const iframe = createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = title;
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
    );
    container.appendChild(iframe);
  });
}

export default function decorate(block) {
  const rows = [...block.querySelectorAll(":scope > div")];
  if (!rows.length) return;

  const heroRow = rows[1];
  const videoRows = rows.slice(2);

  const heroImage = heroRow?.children[0]?.querySelector("img");
  const heroTitleHTML = heroRow?.children[1]?.innerHTML || "";
  const accordionItems = videoRows.map(parseRow);

  block.innerHTML = "";
  block.classList.add("va-block");

  const leftPanel = createElement("div", "va-left");
  const accordionList = createElement("ul", "va-accordion");
  const rightPanel = createElement("div", "va-right");
  const mediaContainer = createElement("div", "va-media-container");
  const heroTitleMobile = createElement("div", "va-hero-mobile");
  heroTitleMobile.innerHTML = heroTitleHTML;

  leftPanel.appendChild(accordionList);
  rightPanel.appendChild(mediaContainer);

  function showHeroImage() {
    mediaContainer.innerHTML = "";
    if (heroImage) mediaContainer.appendChild(heroImage.cloneNode(true));
  }

  const heroItem = createElement("li", "va-item va-hero va-active");
  heroItem.innerHTML = `
    <div class="va-item-header">
      <span class="va-item-title">${heroTitleHTML}</span>
      <span class="va-chevron"></span>
    </div>
    <div class="va-item-body"></div>`;
  accordionList.appendChild(heroItem);
  showHeroImage();

  // Video accordion items
  accordionItems.forEach((item) => {
    const listItem = createElement("li", "va-item va-video");
    listItem.innerHTML = `
      <div class="va-thumb">
        ${item.thumbSrc ? `<img src="${item.thumbSrc}" alt="${item.title}">` : ""}
        <span class="va-play-icon">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="19" fill="rgba(0,0,0,0.35)"/>
            <circle cx="20" cy="20" r="14" fill="none" stroke="#ffffff" stroke-width="2"/>
            <polygon points="15,12 30,20 15,28" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </span>
        <div class="va-overlay"></div>
      </div>
      <div class="va-item-header">
        <span class="va-item-title">${item.title}</span>
        <span class="va-chevron">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
            <path d="M30.48 7.24l-14.48 14.48-14.48-14.48-1.52 1.52 16 16 16-16z"/>
          </svg>
        </span>
      </div>
      <div class="va-item-body">${item.description}</div>`;
    accordionList.appendChild(listItem);

    listItem.addEventListener("click", () => {
      const isAlreadyOpen = listItem.classList.contains("va-active");

      accordionList
        .querySelectorAll(".va-item.va-video")
        .forEach((v) => v.classList.remove("va-active"));

      if (!isAlreadyOpen) {
        listItem.classList.add("va-active");
        heroItem.classList.remove("va-active");

        if (item.videoId) {
          showVideoPoster(
            item.videoId,
            item.title,
            mediaContainer,
            item.thumbSrc,
          );
        } else {
          mediaContainer.innerHTML = `<img src="${item.thumbSrc}" alt="${item.title}">`;
        }
      } else {
        heroItem.classList.add("va-active");
        showHeroImage();
      }
    });
  });

  block.append(leftPanel, rightPanel, heroTitleMobile);
}
