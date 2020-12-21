import CovidDashboard from './js/covid-dashboard';
import Footer from './js/footer';

import './styles/styles.css';

window.addEventListener(
  'DOMContentLoaded',
  () => {
    const covidDashboard = new CovidDashboard();
    const footer = new Footer();
    document.body.appendChild(covidDashboard.htmlFragment);
    document.body.appendChild(footer.htmlFragment);
  },
);
