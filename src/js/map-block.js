import L from 'leaflet';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoiYXBsYXRrb3Vza2kiLCJhIjoiY2tpeHlyOWZwMThtYjJxbXd2cHRwajIyNyJ9.jbgJSxSYgjaS_moNI_RLgw';

const settings = {
  mapbox: 'pk.eyJ1IjoiYXBsYXRrb3Vza2kiLCJhIjoiY2tpeHlyOWZwMThtYjJxbXd2cHRwajIyNyJ9.jbgJSxSYgjaS_moNI_RLgw',
  lastDay: {
    confirmed: 'количество случаев заболевания за последний день в абсолютных величинах',
    deaths: 'количество летальных исходов за последний день в абсолютных величинах',
    recovered: 'количество выздоровевших за последний день в абсолютных величинах',
  },
  lastDayComparative: {
    confirmed: 'количество случаев заболевания за последний день из расчёта на 100 тыс. населения',
    deaths: 'количество летальных исходов за последний день из расчёта на 100 тыс. населения',
    recovered: 'количество выздоровевших за последний день из расчёта на 100 тыс. населения',
  },
  total: {
    confirmed: 'количество случаев заболевания за весь период пандемии в абсолютных величинах',
    deaths: 'количество летальных исходов за весь период пандемии в абсолютных величинах',
    recovered: 'количество выздоровевших за весь период пандемии в абсолютных величинах',
  },
  totalComparative: {
    confirmed: 'количество случаев заболевания за весь период пандемии из расчёта на 100 тыс. населения',
    deaths: 'количество летальных исходов за весь период пандемии из расчёта на 100 тыс. населения',
    recovered: 'количество выздоровевших за весь период пандемии из расчёта на 100 тыс. населения',
  },
};

export default class MapBlock {
  constructor($mainContainer, dataSource, options = ['total', 'confirmed']) {
    this.settings = settings;
    this.options = options;
    this.$mainContainer = $mainContainer;
    this.casesByCountry = dataSource;
    this.map = L.map('covid-map').setView(
      [this.casesByCountry.BY.latitude, this.casesByCountry.BY.longitude],
      5,
    );
    L.tileLayer(
      'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
      {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.settings.mapbox,
      },
    ).addTo(this.map);
    Object.keys(this.casesByCountry).forEach((key) => {
      this.addCircle(this.casesByCountry[key]);
    });
  }

  addCircle(country) {
    const radius = country[this.options[0]][this.options[1]] / 10;
    const message = this.settings[this.options[0]][this.options[1]];
    const {
      name,
      latitude,
      longitude,
    } = country;

    const circle = L.circle(
      [latitude, longitude],
      {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius,
      },
    ).addTo(this.map);
    const popup = L.popup();
    popup.setContent(`${name}\n${message}`);
    circle.on('mouseover', (e) => {
      popup.setLatLng(e.latlng).openOn(this.map);
    });
    circle.on('mouseout', () => {
      this.map.closePopup();
    });
  }

  render() {
    this.$mainContainer.innerHTML = '';
  }
}
