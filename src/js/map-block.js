import L from 'leaflet';
import countryFeatureCollection from './countries-feature-colletion';

const settings = {
  mapbox: 'pk.eyJ1IjoiYXBsYXRrb3Vza2kiLCJhIjoiY2tpeHlyOWZwMThtYjJxbXd2cHRwajIyNyJ9.jbgJSxSYgjaS_moNI_RLgw',
  defaultCountryAlpha2Code: 'BY',
  flagIconCSSClass: 'flag-icon',
  tileLayerAttribution: 'Map data &copy; <a'
    + ' href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    + ' contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  // eslint-disable-next-line no-unused-vars
  featureStyle: {
    color: 'white',
    dashArray: '3',
    fillColor: 'grey',
    fillOpacity: 0,
    opacity: 0,
    weight: 1,
  },
  // eslint-disable-next-line no-unused-vars
  selectedFeatureStyle: {
    color: 'white',
    dashArray: '3',
    fillColor: 'grey',
    stroke: true,
    fillOpacity: 0.2,
    opacity: 0.2,
    weight: 2,
  },
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
  constructor({
    htmlContainer: $mainContainer,
    casesByCountry,
    options = {
      group: 'total',
      subGroup: 'confirmed',
    },
    selectCountryCallback,
  }) {
    this.settings = settings;
    this.options = options;
    this.$mainContainer = $mainContainer;
    this.casesByCountry = casesByCountry;
    this.selectCountryCallback = typeof selectCountryCallback === 'function'
      ? selectCountryCallback
      : () => {};
    this.selectedCountry = undefined;

    const defaultCountry = this.casesByCountry[this.settings.defaultCountryAlpha2Code];
    this.map = L.map('covid-map').setView(
      [defaultCountry.latitude, defaultCountry.longitude], 6,
    );

    L.tileLayer(
      'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
      {
        attribution: this.settings.tileLayerAttribution,
        maxZoom: 6,
        minZoom: 3,
        id: 'mapbox/dark-v10',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: this.settings.mapbox,
      },
    ).addTo(this.map);

    this.getPopupContent = (country) => {
      const covidStatisticsData = country[this.options.group][this.options.subGroup];
      const popupMessage = this.settings[this.options.group][this.options.subGroup];

      const $flagImage = document.createElement('img');
      $flagImage.src = country.flagUrl;
      $flagImage.alt = `${country.alpha2Code} flag`;
      $flagImage.classList.add(this.settings.flagIconCSSClass);

      const $h2 = document.createElement('h2');
      $h2.appendChild($flagImage);
      $h2.appendChild(document.createTextNode(country.name));
      $h2.dataset.alpha2Code = country.alpha2Code;

      const $p = document.createElement('p');
      $p.appendChild(document.createTextNode(
        `${covidStatisticsData} - ${popupMessage}`,
      ));

      const $container = document.createElement('div');
      $container.appendChild($h2);
      $container.appendChild($p);
      return $container;
    };

    this.onEachFeature = (feature, layer) => {
      const props = feature.properties;
      if (
        props.alpha2Code
        && {}.hasOwnProperty.call(this.casesByCountry, props.alpha2Code)
      ) {
        const country = this.casesByCountry[props.alpha2Code];
        country.layer = layer;

        const popup = L.popup();
        popup.setContent(this.getPopupContent(country));
        country.popup = popup;
      }
    };

    this.geoJSONLayerGroup = L.geoJson(
      countryFeatureCollection,
      {
        onEachFeature: this.onEachFeature,
        style: this.settings.featureStyle,
      },
    ).addTo(this.map);

    this.geoJSONLayerGroup.on({
      click: (e) => {
        if (e.layer.feature.properties.alpha2Code) {
          this.selectCountryCallback(e.layer.feature.properties.alpha2Code);
        }
      },
    });

    Object.values(this.casesByCountry).forEach((country) => {
      this.addCircle(country);
    });
  }

  selectCountry(alpha2Code) {
    const country = this.casesByCountry[alpha2Code];

    this.map.flyTo([country.latitude, country.longitude]);
    // restore previous hidden circle
    if (this.selectedCountry) {
      this.addCircle(this.selectedCountry);
      this.geoJSONLayerGroup.resetStyle(this.selectedCountry.layer);
    }

    this.map.removeLayer(country.circle);
    country.circle = undefined;

    this.selectedCountry = country;
    country.layer?.setStyle(this.settings.selectedFeatureStyle);

    country.popup?.setLatLng([country.latitude, country.longitude]).openOn(this.map);
  }

  addCircle(country) {
    const radius = country[this.options.group][this.options.subGroup] / 10;

    const currentCountry = country;
    currentCountry.circle = L.circle(
      [country.latitude, country.longitude],
      {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius,
      },
    ).addTo(this.map);

    currentCountry.circle.on({
      mouseover: (e) => {
        this.map.closePopup();
        if (this.selectedCountry) {
          this.addCircle(this.selectedCountry);
          this.geoJSONLayerGroup.resetStyle(this.selectedCountry.layer);
          this.selectedCountry = undefined;
        }
        currentCountry.popup?.setLatLng(e.latlng).openOn(this.map);
      },
      mouseout: () => {
        this.map.closePopup();
      },
      click: () => {
        if (currentCountry.alpha2Code) {
          this.selectCountryCallback(currentCountry.alpha2Code);
        }
      },
    });
  }

  render() {
    this.$mainContainer.innerHTML = '';
  }
}
