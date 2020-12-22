import L from 'leaflet';
import countryFeatureCollection from './countries-feature-colletion';

const settings = {
  mapbox: 'pk.eyJ1IjoiYXBsYXRrb3Vza2kiLCJhIjoiY2tpemR0ZGJsMmdnMzJ4c2N5MnNiYm1tNCJ9.qj4V3FNrWCMNM58tR-iV8Q',
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
      dataType: 'total',
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

    const defaultCountry = this.casesByCountry[this.settings.defaultCountryAlpha2Code];

    this.map = L.map('covid-map').addLayer(
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
      ),
    ).setView(
      [defaultCountry.latitude, defaultCountry.longitude], 6,
    );
    const southWest = L.latLng(-70, 170);
    const northEast = L.latLng(85, -160);
    this.map.setMaxBounds(L.latLngBounds(southWest, northEast));

    this.getPopupContent = (country) => {
      const covidStatisticsData = country[this.options.dataType][this.options.caseType];
      const popupMessage = this.settings[this.options.dataType][this.options.caseType];

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
  }

  addCircle(country) {
    const radius = country[this.options.dataType][this.options.caseType] / 10;

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
