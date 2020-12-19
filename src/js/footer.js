import gitHubIcon from '../images/github-icon.png';
import rsSchoolJsLogo from '../images/rs-school-js.png';

const settings = {
  contributorsBlockCSSClass: 'contributors-block',
  rsSchoolBlockCSSClass: 'rs-school-block',
  contributors: [
    {
      name: 'Alex Gordeev',
      gitHubLink: 'https://github.com/g0rdeich',
    },
    {
      name: 'Artsiom Platkouski',
      gitHubLink: 'https://github.com/aplatkouski',
    },
    {
      name: 'Viktor Avdeev',
      gitHubLink: 'https://github.com/thrvrce',
    },
  ],
  gitHubLinkCSSClass: 'github-link',
  gitHubIconCSSClass: 'github-icon',
  mainCSSClass: 'footer-background',
  yearBlockCSSClass: 'year-block',
};

export default class Footer {
  constructor() {
    this.settings = settings;
    this.$mainBlock = document.createElement('div');
    this.$mainBlock.classList.add(this.settings.mainCSSClass);
    let contributors = '';
    this.settings.contributors.forEach((contributor) => {
      contributors += `<a
            href="${contributor.gitHubLink}"
            class="${this.settings.gitHubLinkCSSClass}">
          ${contributor.name}
          <img
            alt="GitHub"
            src="${gitHubIcon}"
            class="${this.settings.gitHubIconCSSClass}"/>
        </a>`;
    });
    this.$mainBlock.innerHTML = `
      <footer>
          <div class="${this.settings.contributorsBlockCSSClass}">
              ${contributors}
          </div>
          <div class="${this.settings.rsSchoolBlockCSSClass}">
              <a href="https://rs.school/js/" class="rs-school-link">
                  <img class="rs-school-logo" src="${rsSchoolJsLogo}" alt="rs.school">
              </a>
          </div>
          <div class="${this.settings.yearBlockCSSClass}">
              <a href="https://en.wikipedia.org/wiki/2020" class="year-link">2020</a>
          </div>
      </footer>
    `;
  }

  get htmlFragment() {
    const $fragment = document.createDocumentFragment();
    $fragment.appendChild(this.$mainBlock);
    return $fragment;
  }
}
