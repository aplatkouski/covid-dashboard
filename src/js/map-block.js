import L from 'leaflet';
import countryFeatureCollection from './countries-feature-colletion';
import typeDescription from './type-description';

const settings = {
  defaultCountryAlpha2Code: 'BY',
  flagIconCSSClass: 'flag-icon',
  mapOptions: {
    attribution: 'Map data &copy; <a'
    + ' href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    + ' contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 5,
    minZoom: 2,
    id: 'mapbox/dark-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoiYXBsYXRrb3Vza2kiLCJhIjoiY2tpemR0ZGJsMmdnMzJ4c2N5MnNiYm1tNCJ9.qj4V3FNrWCMNM58tR-iV8Q',
  },
  featureStyle: {
    color: 'white',
    dashArray: '3',
    fillColor: 'grey',
    fillOpacity: 0,
    opacity: 0,
    weight: 1,
  },
  selectedFeatureStyle: {
    color: 'white',
    dashArray: '3',
    fillColor: 'grey',
    stroke: true,
    fillOpacity: 0.2,
    opacity: 0.2,
    weight: 2,
  },
  calculationRadius: {
    min: 10000,
    max: 400000,
    base: 4,
  },
};

export default class MapBlock {
  constructor({
    htmlContainer: $mainContainer,
    casesByCountry,
    options = {
      dataType: 'lastDay',
      caseType: 'confirmed',
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
    this.maxValues = {};
    this.assignMaxValues();

    const defaultCountry = this.casesByCountry[this.settings.defaultCountryAlpha2Code];

    this.map = L.map('covid-map').addLayer(
      L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        this.settings.mapOptions,
      ),
    ).setView(
      [defaultCountry.latitude, defaultCountry.longitude], 6,
    );
    const southWest = L.latLng(-70, 180);
    const northEast = L.latLng(85, -180);
    this.map.setMaxBounds(L.latLngBounds(southWest, northEast));

    this.getPopupContent = (country) => {
      const covidStatisticsData = country[this.options.dataType][this.options.caseType];
      const popupMessage = typeDescription[this.options.dataType][this.options.caseType];

      const $flagImage = document.createElement('img');
      $flagImage.src = country.flagUrl;
      $flagImage.alt = `${country.alpha2Code || 'country'} flag`;
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
        country[Symbol.for('layer')] = layer;

        this.addCircle(country);

        const popup = L.popup();
        popup.setContent(this.getPopupContent(country));
        country[Symbol.for('popup')] = popup;
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
      mouseover: (e) => {
        this.map.closePopup();
        if (this.selectedCountry) {
          this.geoJSONLayerGroup.resetStyle(
            this.selectedCountry[Symbol.for('layer')],
          );
        }
        const props = e.layer.feature.properties;
        if (
          props.alpha2Code
          && {}.hasOwnProperty.call(this.casesByCountry, props.alpha2Code)
        ) {
          const country = this.casesByCountry[props.alpha2Code];
          this.selectedCountry = country;
          country[Symbol.for('popup')]?.setLatLng(
            [country.latitude, country.longitude],
          ).openOn(this.map);
          country[Symbol.for('layer')]?.setStyle(
            this.settings.selectedFeatureStyle,
          );
        }
      },
      click: (e) => {
        const props = e.layer.feature.properties;
        if (props.alpha2Code) this.selectCountryCallback(props.alpha2Code);
      },
    });
  }

  assignMaxValues() {
    ['lastDay', 'lastDayComparative', 'total', 'totalComparative'].forEach(
      (dataType) => {
        if (!this.maxValues[dataType]) {
          this.maxValues[dataType] = {};
        }
        ['confirmed', 'deaths', 'recovered'].forEach((caseType) => {
          this.maxValues[dataType][caseType] = Math.max(
            ...Object.values(this.casesByCountry)
              .map((country) => country[dataType][caseType]),
          );
        });
      },
    );
  }

  selectCountry(alpha2Code) {
    const country = this.casesByCountry[alpha2Code];

    this.map.flyTo([country.latitude, country.longitude]);
    // restore previous hidden circle
    if (this.selectedCountry) {
      this.geoJSONLayerGroup.resetStyle(
        this.selectedCountry[Symbol.for('layer')],
      );
    }

    this.selectedCountry = country;
    country[Symbol.for('layer')]?.setStyle(this.settings.selectedFeatureStyle);

    country[Symbol.for('popup')]?.setLatLng(
      [country.latitude, country.longitude],
    ).openOn(this.map);
  }

  selectType({ dataType, caseType }) {
    this.options.dataType = dataType;
    this.options.caseType = caseType;

    Object.values(this.casesByCountry).forEach((country) => {
      if (country[Symbol.for('popup')]) {
        const covidStatisticsData = country[this.options.dataType][this.options.caseType];
        const popupMessage = typeDescription[this.options.dataType][this.options.caseType];
        const $popupContent = country[Symbol.for('popup')]?.getContent();
        const $p = $popupContent.querySelector('p');
        $p.innerHTML = '';
        $p.appendChild(document.createTextNode(
          `${covidStatisticsData} - ${popupMessage}`,
        ));
      }

      if (country[Symbol.for('circle')]) {
        this.map.removeLayer(country[Symbol.for('circle')]);
        this.addCircle(country);
      }
    });
  }

  addCircle(country) {
    const value = country[this.options.dataType][this.options.caseType];
    const radius = value
      ? (this.settings.calculationRadius.base ** (
        country[this.options.dataType][this.options.caseType]
        / this.maxValues[this.options.dataType][this.options.caseType]
      ) * (
        this.settings.calculationRadius.max
        / this.settings.calculationRadius.base
      ))
      : this.settings.calculationRadius.min;

    const currentCountry = country;
    currentCountry[Symbol.for('circle')] = L.circle(
      [country.latitude, country.longitude],
      {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius,
      },
    ).addTo(this.map);

    currentCountry[Symbol.for('circle')].on({
      mouseover: () => {
        this.map.closePopup();
        if (this.selectedCountry) {
          this.geoJSONLayerGroup.resetStyle(
            this.selectedCountry[Symbol.for('layer')],
          );
          this.selectedCountry = currentCountry;
        }

        currentCountry[Symbol.for('popup')]?.setLatLng(
          [currentCountry.latitude, currentCountry.longitude],
        ).openOn(this.map);
        currentCountry[Symbol.for('layer')]?.setStyle(
          this.settings.selectedFeatureStyle,
        );
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
