import Chart from 'chart.js';
import {
  getObjByProperty, createSelectElement, setLabel, setOptionsSelected,
} from './tools';

const settings = {
  chartOptions: {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'aa',
          borderDash: [1, 1],
          showLines: true,
          pointRadius: 1,
          pointHoverBackgroundColor: 'black',
          lineTension: 0,
          backgroundColor: 'transparent',
          borderColor: '',
          borderWidth: 2,
          data: [
            {
              x: new Date('2020-10-01'),
              y: 1,
            },
            {
              x: new Date('2020-12-03'),
              y: 0.5,
            },
            {
              x: new Date('2020-12-04'),
              y: 0.75,
            },
          ],
        },
      ],
    },
    options: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 0,
          fontColor: '#cdcdcd',
        },
      },
      scales: {
        xAxes: [
          {
            type: 'time',
            time: {
              unit: 'month',
            },
            gridLines: {
              color: 'black',
              borderDash: [1, 2],
              display: true,
            },
            scaleLabel: {
              display: true,
              labelString: '' /* 'Month of the year'.toUpperCase() */,
              fontColor: '#cdcdcd',
            },
            ticks: {
              beginAtZero: true,
              fontColor: '#cdcdcd',
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: 'black',
              borderDash: [1, 2],
              display: true,
            },
            scaleLabel: {
              display: true,
              labelString: 'cases'.toUpperCase(),
              fontColor: '#cdcdcd',
            },
            ticks: {
              beginAtZero: true,
              fontColor: '#cdcdcd',
            },
          },
        ],
      },
    },
  },
  caseTypes: {
    confirmed: {
      type: 'confirmed',
      key: 'confirmed',
      color: 'rgba(215, 217, 52, 1)',
    },
    deaths: { type: 'deaths', key: 'deaths', color: 'rgba(194, 54, 54, 1)' },
    recovered: {
      type: 'recovered',
      key: 'recovered',
      color: 'rgba(63, 203, 35, 1)',
    },
  },
  dataTypes: {
    lastDay: { type: 'last day cases', key: 'lastDay' },
    lastDayComparative: {
      type: 'last day cases per 100k',
      key: 'lastDayComparative',
    },
    total: { type: 'total cases', key: 'total' },
    totalComparative: { type: 'total cases per 100k', key: 'totalComparative' },
  },
  CSSClass: {
    chartWrapper: 'chart-block--chartWrapper',
    controlsWrapper: 'chart-block--controlsWrapper',
  },
  API: {
    globalStatistics: 'https://corona-api.com/timeline',
    countrySlug: 'https://api.covid19api.com/countries',
    population: 'https://restcountries.eu/rest/v2/all?fields=alpha2Code;population',
  },
  worldPopulation: 7856691739, // TODO get population by API
  precision: 100000,
};
export default class ChartBlock {
  constructor({
    htmlContainer: $htmlContainer,
    casesByCountry,
    globalCases,
    options = {
      caseType: 'confirmed',
      dataType: 'lastDay',
    },
    selectCountryCallback,
    selectTypeCallback,
  }) {
    this.settings = settings;
    this.options = options;
    this.casesByCountry = casesByCountry;
    this.globalCases = globalCases;
    this.selectCountryCallback = selectCountryCallback;
    this.selectTypeCallback = selectTypeCallback;
    this.currentCaseType = this.settings.caseTypes[options.caseType];
    this.currentDataType = this.settings.dataTypes[options.dataType];
    this.dataSource = null;

    this.chartWrapper = document.createElement('div');
    this.chartWrapper.classList.add(this.settings.CSSClass.chartWrapper);
    this.$chartCanvas = document.createElement('canvas');

    this.controlsWrapper = document.createElement('div');
    this.controlsWrapper.classList.add(this.settings.CSSClass.controlsWrapper);
    this.$caseTypeSelector = createSelectElement(
      this.settings.caseTypes,
      this.currentCaseType.type,
    );
    this.$caseTypeSelector.addEventListener(
      'change',
      (e) => this.eventHandler(e),
    );

    this.$dataTypeSelector = createSelectElement(
      this.settings.dataTypes,
      this.currentDataType.type,
    );
    this.$dataTypeSelector.addEventListener(
      'change',
      (e) => this.eventHandler(e),
    );

    this.updateButton = document.createElement('button');
    this.updateButton.innerText = 'Update Chart';
    this.updateButton.addEventListener(
      'click', (e) => this.eventHandler(e),
    );

    this.$documentFragment = document.createDocumentFragment();
    this.$documentFragment.appendChild(this.chartWrapper);
    this.chartWrapper.appendChild(this.$chartCanvas);
    this.$documentFragment.appendChild(this.controlsWrapper);
    this.controlsWrapper.appendChild(setLabel(this.$caseTypeSelector, 'Case types:'));
    this.controlsWrapper.appendChild(setLabel(this.$dataTypeSelector, 'Data types:'));
    this.controlsWrapper.appendChild(this.updateButton);
    $htmlContainer.appendChild(this.$documentFragment);

    this.$chart = this.$chartCanvas.getContext('2d');
    this.myChart = new Chart(this.$chart, this.settings.chartOptions);
    this.render();
  }

  set setcurrentCaseType(caseType) {
    this.options.caseType = caseType;
  }

  set setcurrentDataType(dataType) {
    this.options.dataType = dataType;
  }

  selectType({ dataType, caseType }) {
    this.currentDataType = getObjByProperty(
      this.settings.dataTypes, 'key', dataType,
    );

    this.currentCaseType = getObjByProperty(
      this.settings.caseTypes, 'key', caseType,
    );

    setOptionsSelected(dataType, this.$dataTypeSelector);
    setOptionsSelected(caseType, this.$caseTypeSelector);

    this.options.dataType = dataType;
    this.options.caseType = caseType;
    this.render();
  }

  eventHandler(e) {
    if (e.target === this.$caseTypeSelector) {
      this.setcurrentCaseType = e.target.value;
    } else if (e.target === this.$dataTypeSelector) {
      this.setcurrentDataType = e.target.value;
    } else if (e.target === this.updateButton) {
      this.selectTypeCallback(this.options);
    }
  }

  selectCountry(newDataSource) {
    this.dataSource = newDataSource;
    this.render();
  }

  async getPopulation(isGlobal) {
    const responsePopulation = await fetch(this.settings.API.population);
    const datapopulation = await responsePopulation.json();
    let population = 0;

    if (isGlobal) {
      population = datapopulation.reduce((acc, value) => acc + value.population, 0);
    } else {
      // eslint-disable-next-line prefer-destructuring
      population = datapopulation
        .filter((country) => country.alpha2Code === this.dataSource)[0].population;
    }
    let i = 0;
    while (i < 10000) {
      i += 1;
    }
    return population;
  }

  async calcGlobalChart(isLastDayMode, isPer100kMode) {
    const response = await fetch(this.settings.API.globalStatistics);
    if (response.ok) {
      const gloPop = await this.getPopulation(true);
      const data = await response.json();
      this.globalCases = data;
      this.globalCases.data.forEach((oneDataDay) => {
        this.settings.chartOptions.data.datasets[0].data
          .push({
            x: new Date(oneDataDay.date),
            y: oneDataDay[`${(isLastDayMode ? 'new_' : '')}${this.currentCaseType.key}`] * (isPer100kMode ? this.settings.precision / gloPop : 1),
          });
      });
      return Promise.resolve(true);
    }
    return Promise.reject(response.status);
  }

  async calcChartByCountry(isLastDayMode, isPer100kMode) {
    const responseCountries = await fetch(this.settings.API.countrySlug);
    const dataCountries = await responseCountries.json();
    const slug = dataCountries.filter((country) => country.ISO2 === this.dataSource)[0].Slug;

    const response = await fetch(`https://api.covid19api.com/country/${slug}/status/${this.currentCaseType.key}`);
    if (response.ok) {
      const data = await response.json();
      this.casesByCountry = data;
      const popuation = await this.getPopulation(false);
      this.casesByCountry.forEach(async (oneDataDay, index, array) => {
        let valueForChart = (isLastDayMode
          ? (oneDataDay.Cases - (index > 0 ? array[index - 1].Cases : 0))
          : oneDataDay.Cases);
        if (isPer100kMode) {
          valueForChart *= this.settings.precision / popuation;
        }
        this.settings.chartOptions.data.datasets[0].data
          .push({
            x: new Date(oneDataDay.Date),
            y: valueForChart,
          });
      });
      return Promise.resolve(true);
    }
    return Promise.reject(response.status);
  }

  async updateDataSet() {
    let result;
    this.settings.chartOptions.data.datasets[0].label = `${this.currentCaseType.type}: ${this.currentDataType.type}`.toUpperCase();
    this.settings.chartOptions.data.datasets[0].data = [];
    this.settings.chartOptions.data.labels = [];
    this.settings.chartOptions.data.datasets[0].borderColor = this.currentCaseType.color;
    const isLastDayMode = (
      this.currentDataType === this.settings.dataTypes.lastDay
      || this.currentDataType === this.settings.dataTypes.lastDayComparative);
    const isPer100kMode = (this.currentDataType === this.settings.dataTypes.totalComparative
      || this.currentDataType === this.settings.dataTypes.lastDayComparative);
    if (this.dataSource === null) {
      result = await this.calcGlobalChart(isLastDayMode, isPer100kMode);
    } else {
      result = await this.calcChartByCountry(isLastDayMode, isPer100kMode);
    }
    return result;
  }

  async render() {
    await this.updateDataSet();
    await this.myChart.update();
  }
}
