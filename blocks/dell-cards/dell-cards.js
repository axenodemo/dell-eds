export default function decorate(block) {
  const rows = [...block.children];

  /*
    Row Mapping
    0 = eyebrow
    1 = heading
    2 = images
    3 = titles
    4 = links
    5 = footer links
  */

  // ===== EYEBROW =====

  rows[0].classList.add('eyebrow');

  // ===== HEADING =====

  const headingText = rows[1].textContent.trim();

  const heading = document.createElement('h2');
  heading.textContent = headingText;

  rows[1].replaceWith(heading);

  // ===== CARDS WRAPPER =====

  const cardsWrapper = document.createElement('div');
  cardsWrapper.className = 'cards';

  const imageCols = [...rows[2].children];
  const titleCols = [...rows[3].children];
  const linkCols = [...rows[4].children];

  imageCols.forEach((imgCol, index) => {
    const card = document.createElement('article');
    card.className = 'card';

    // image

    const picture = imgCol.querySelector('picture');

    // body

    const body = document.createElement('div');
    body.className = 'card-body';

    // title

    const title = document.createElement('h3');
    title.textContent = titleCols[index].textContent.trim();

    // spacer

    const spacer = document.createElement('div');
    spacer.className = 'spacer';

    // CTA

    const link = linkCols[index].querySelector('a');

    body.append(title);
    body.append(spacer);

    if (link) {
      body.append(link);
    }

    if (picture) {
      card.append(picture);
    }

    card.append(body);

    cardsWrapper.append(card);
  });

  // remove old rows

  rows[2].remove();
  rows[3].remove();
  rows[4].remove();

  block.append(cardsWrapper);

  // ===== FOOTER LINKS =====

  const footerRow = rows[5];

  const footerLinks = document.createElement('div');
  footerLinks.className = 'footer-links';

  const footerAnchors = footerRow.querySelectorAll('a');

  footerAnchors.forEach((anchor) => {
    footerLinks.append(anchor);
  });

  footerRow.remove();

  block.append(footerLinks);
}
