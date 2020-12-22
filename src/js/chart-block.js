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
  dataTypes: {
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
  chartTypes: {
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
    selectCountryCallback,
  }) {
    this.settings = settings;
    this.casesByCountry = casesByCountry;
    this.globalCases = globalCases;
    this.selectCountryCallback = selectCountryCallback;
    this.chartDataType = this.settings.dataTypes.confirmed;
    this.chartType = this.settings.chartTypes.lastDay;
    this.dataSource = null;

    this.getObjByProperty = (obj, propertyName, typeName) => Object.values(obj)
      .filter((value) => value[propertyName] === typeName)[0];

    this.$chartCanvas = document.createElement('canvas');
    this.chartDataTypeSelector = createSelectElement(
      this.settings.dataTypes,
      this.chartDataType.type,
    );
    this.chartDataTypeSelector.addEventListener('change',
      (e) => this.eventHandler(e));
    this.chartTypeSelector = createSelectElement(
      this.settings.chartTypes,
      this.chartType.type,
    );
    this.chartTypeSelector.addEventListener('change',
      (e) => this.eventHandler(e));

    this.$documentFragment = document.createDocumentFragment();
    this.$documentFragment.appendChild(this.$chartCanvas);
    this.$documentFragment.appendChild(this.chartDataTypeSelector);
    this.$documentFragment.appendChild(this.chartTypeSelector);
    $htmlContainer.appendChild(this.$documentFragment);

    this.$chart = this.$chartCanvas.getContext('2d');
    this.myChart = new Chart(this.$chart, this.settings.chartOptions);
    this.render();
    // setTimeout(() => {
    //   this.updateDataSet();
    // }, 5000);
  }

  set setchartDataType(dataType) {
    this.chartDataType = this.getObjByProperty(
      this.settings.dataTypes, 'key', dataType,
    );
  }

  set setchartType(chartType) {
    this.chartType = this.getObjByProperty(
      this.settings.chartTypes, 'key', chartType,
    );
  }

  eventHandler(e) {
    if (e.target === this.chartDataTypeSelector) {
      this.setchartDataType = e.target.value;
    }
    if (e.target === this.chartTypeSelector) {
      this.setchartType = e.target.value;
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
        .push(source[this.chartType.key][this.chartDataType.key]
          * (i === 1 ? 1 : Math.random()));
      this.settings.chartOptions.data.labels.push(`${i}.12.2020`);
    }
  }

  updateDataSet() {
    // this.setchartDataType = 'deaths';
    // this.setchartType = 'last day cases per 100k';
    // this.dataSource = null;
    this.settings.chartOptions.data.datasets[0].label = `${this.chartDataType.type}: ${this.chartType.type}`;
    this.settings.chartOptions.data.datasets[0].data = [];
    this.settings.chartOptions.data.labels = [];
    this.settings.chartOptions.data.datasets[0].borderColor = this.chartDataType.color;
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
