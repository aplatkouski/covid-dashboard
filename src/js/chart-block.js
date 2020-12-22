import Chart from 'chart.js';

const CHART_DATA_TYPES = {
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
};

const CHART_TYPES = {
  lastDay: { type: 'last day cases', key: 'lastDay' },
  lastDayComparative: {
    type: 'last day cases per 100k',
    key: 'lastDayComparative',
  },
  total: { type: 'total cases', key: 'total' },
  totalComparative: { type: 'total cases per 100k', key: 'totalComparative' },
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
    this.casesByCountry = casesByCountry;
    this.globalCases = globalCases;
    this.selectCountryCallback = selectCountryCallback;
    this.chartDataType = CHART_DATA_TYPES.confirmed;
    this.chartType = CHART_TYPES.lastDay;
    this.dataSource = null;
    this.getObjByProperty = (obj, propertyName, typeName) => Object.values(obj)
      .filter((value) => value[propertyName] === typeName)[0];
    this.$documentFragment = document.createDocumentFragment();
    this.$chartCanvas = document.createElement('canvas');
    this.$documentFragment.appendChild(this.$chartCanvas);
    this.chartDataTypeSelector = createSelectElement(CHART_DATA_TYPES,
      this.chartDataType.type);
    this.chartDataTypeSelector.addEventListener('change',
      (e) => this.eventHandler(e));
    this.$documentFragment.appendChild(this.chartDataTypeSelector);
    this.chartTypeSelector = createSelectElement(CHART_TYPES,
      this.chartType.type);
    this.chartTypeSelector.addEventListener('change',
      (e) => this.eventHandler(e));
    this.$documentFragment.appendChild(this.chartTypeSelector);
    $htmlContainer.appendChild(this.$documentFragment);
    this.$chart = this.$chartCanvas.getContext('2d');
    this.chartOptions = {
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
    };
    this.myChart = new Chart(this.$chart, this.chartOptions);
    this.render();
    // setTimeout(() => {
    //   this.updateDataSet();
    // }, 5000);
  }

  set setchartDataType(dataType) {
    this.chartDataType = this.getObjByProperty(CHART_DATA_TYPES, 'key',
      dataType);
  }

  set setchartType(chartType) {
    this.chartType = this.getObjByProperty(CHART_TYPES, 'key', chartType);
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
      this.chartOptions.data.datasets[0].data
        .push(source[this.chartType.key][this.chartDataType.key]
          * (i === 1 ? 1 : Math.random()));
      this.chartOptions.data.labels.push(`${i}.12.2020`);
    }
  }

  updateDataSet() {
    // this.setchartDataType = 'deaths';
    // this.setchartType = 'last day cases per 100k';
    // this.dataSource = null;
    this.chartOptions.data.datasets[0].label = `${this.chartDataType.type}: ${this.chartType.type}`;
    this.chartOptions.data.datasets[0].data = [];
    this.chartOptions.data.labels = [];
    this.chartOptions.data.datasets[0].borderColor = this.chartDataType.color;
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
