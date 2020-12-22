import Chart from 'chart.js';

const settings = {
  chartOptions: {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: '',
          borderDash: [5, 5],
          showLine: true,
          lineTension: 0,
          data: [],
          backgroundColor: 'transparent',
          borderColor: '',
          borderWidth: 3,
        },
      ],
    },
    options: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 0,
          fontColor: 'black',
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              color: 'black',
              borderDash: [1, 2],
              display: true,
            },
            scaleLabel: {
              display: true,
              labelString: 'Date',
              fontColor: 'black',
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
              labelString: 'Number of cases',
              fontColor: 'black',
            },
            ticks: {
              beginAtZero: true,
              stepSize: 50000,
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
};

function createSelectElement(optionsObj, defaultValue) {
  const $select = document.createElement('select');
  Object.values(optionsObj).forEach((value) => {
    const $option = document.createElement('option');
    $option.textContent = value.type;
    $option.value = value.key;
    $option.selected = (defaultValue === value.type);
    $select.appendChild($option);
  });
  return $select;
}

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
  }) {
    this.settings = settings;
    this.options = options;
    this.casesByCountry = casesByCountry;
    this.globalCases = globalCases;
    this.selectCountryCallback = selectCountryCallback;
    this.currentCaseType = this.settings.caseTypes[options.caseType];
    this.currentDataType = this.settings.dataTypes[options.dataType];
    this.dataSource = null;

    this.getObjByProperty = (obj, propertyName, typeName) => Object.values(obj)
      .filter((value) => value[propertyName] === typeName)[0];

    this.$chartCanvas = document.createElement('canvas');

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

    this.$documentFragment = document.createDocumentFragment();
    this.$documentFragment.appendChild(this.$chartCanvas);
    this.$documentFragment.appendChild(this.$caseTypeSelector);
    this.$documentFragment.appendChild(this.$dataTypeSelector);
    $htmlContainer.appendChild(this.$documentFragment);

    this.$chart = this.$chartCanvas.getContext('2d');
    this.myChart = new Chart(this.$chart, this.settings.chartOptions);
    this.render();
    // setTimeout(() => {
    //   this.updateDataSet();
    // }, 5000);
  }

  set setcurrentCaseType(caseType) {
    this.currentCaseType = this.getObjByProperty(
      this.settings.caseTypes, 'key', caseType,
    );
  }

  set setcurrentDataType(dataType) {
    this.currentDataType = this.getObjByProperty(
      this.settings.dataTypes, 'key', dataType,
    );
  }

  eventHandler(e) {
    if (e.target === this.$caseTypeSelector) {
      this.setcurrentCaseType = e.target.value;
    }
    if (e.target === this.$dataTypeSelector) {
      this.setcurrentDataType = e.target.value;
    }
    this.render();
  }

  selectCountry(newDataSource) {
    this.dataSource = newDataSource;
    this.render();
  }

  fillTestPoints(source) {
    for (let i = 1; i < 5; i += 1) {
      this.settings.chartOptions.data.datasets[0].data
        .push(source[this.currentDataType.key][this.currentCaseType.key]
          * (i === 1 ? 1 : Math.random()));
      this.settings.chartOptions.data.labels.push(`${i}.12.2020`);
    }
  }

  updateDataSet() {
    // this.setcurrentCaseType = 'deaths';
    // this.setcurrentDataType = 'last day cases per 100k';
    // this.dataSource = null;
    this.settings.chartOptions.data.datasets[0].label = `${this.currentCaseType.type}: ${this.currentDataType.type}`;
    this.settings.chartOptions.data.datasets[0].data = [];
    this.settings.chartOptions.data.labels = [];
    this.settings.chartOptions.data.datasets[0].borderColor = this.currentCaseType.color;
    if (this.dataSource === null) {
      this.fillTestPoints(this.globalCases);
    } else {
      const dataByCountry = this.getObjByProperty(this.casesByCountry,
        'alpha2Code', this.dataSource);
      this.fillTestPoints(dataByCountry);
    }
  }

  async render() {
    await this.updateDataSet();
    await this.myChart.update();
  }
}
