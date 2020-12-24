import {
  getObjByProperty, createSelectElement, setLabel, setOptionsSelected,
} from './tools';

const settings = {
  caseTypes: {
    confirmed: {
      type: 'confirmed',
      key: 'confirmed',
      color: 'rgba(215, 217, 52, 1)',
    },
    deaths: {
      type: 'deaths',
      key: 'deaths',
      color: 'rgba(194, 54, 54, 1)',
    },
    recovered: {
      type: 'recovered',
      key: 'recovered',
      color: 'rgba(63, 203, 35, 1)',
    },
  },
  dataTypes: {
    lastDay: {
      type: 'last day cases',
      key: 'lastDay',
    },
    lastDayComparative: {
      type: 'last day cases per 100k',
      key: 'lastDayComparative',
    },
    total: {
      type: 'total cases',
      key: 'total',
    },
    totalComparative: {
      type: 'total cases per 100k',
      key: 'totalComparative',
    },
  },
  CSSClass: {
    tableWrapper: '',
    controlsWrapper: 'table-block-controls-wrapper',
  },
};
export default class TableBlock {
  constructor({
    htmlContainer: $htmlContainer,
    casesByCountry,
    globalCases,
    options = {
      dataType: 'lastDay',
      caseType: 'confirmed',
    },
    selectTypeCallback,
  }) {
    this.settings = settings;
    this.options = options;
    this.selectTypeCallback = selectTypeCallback;
    this.casesByCountry = casesByCountry;
    this.globalCases = globalCases;
    this.currentDataType = this.settings.dataTypes[options.dataType];
    this.dataSource = null;

    this.controlsWrapper = document.createElement('div');
    this.controlsWrapper.classList.add(this.settings.CSSClass.controlsWrapper);
    this.$dataTypeSelector = createSelectElement(
      this.settings.dataTypes,
      this.currentDataType.type,
    );
    this.$dataTypeSelector.addEventListener(
      'change',
      (e) => this.eventHandler(e),
    );
    this.tableListWrapper = document.createElement('div');

    this.$documentFragment = document.createDocumentFragment();
    this.$documentFragment.appendChild(this.controlsWrapper);
    this.controlsWrapper.appendChild(setLabel(this.$dataTypeSelector, 'Data types:'));
    this.$documentFragment.appendChild(this.tableListWrapper);
    $htmlContainer.appendChild(this.$documentFragment);
    this.render();
  }

  eventHandler(e) {
    if (e.target === this.$dataTypeSelector) {
      this.setOptionsDataType = e.target.value;
    }
  }

  set setOptionsDataType(dataType) {
    this.options.dataType = dataType;
    this.selectTypeCallback(this.options);
  }

  selectType({ dataType, caseType }) {
    this.currentDataType = getObjByProperty(
      this.settings.dataTypes, 'key', dataType,
    );

    setOptionsSelected(dataType, this.$dataTypeSelector);

    this.options.dataType = dataType;
    this.options.caseType = caseType;
    this.render();
  }

  selectCountry(newDataSource) {
    this.dataSource = newDataSource;
    this.render();
  }

  render() {
    while (this.tableListWrapper.firstChild) {
      this.tableListWrapper.removeChild(this.tableListWrapper.firstChild);
    }

    const $UL = document.createElement('ul');
    // $UL.textContent = `${this.currentDataType.type}`;
    const dataSource = (this.dataSource === null ? this.globalCases : getObjByProperty(this.casesByCountry, 'alpha2Code', this.dataSource));

    Object.values(this.settings.caseTypes).forEach((value) => {
      const $LI = document.createElement('li');
      $LI.textContent = `${value.type}: ${dataSource[this.currentDataType.key][value.type]}`;
      $UL.appendChild($LI);
    });
    this.tableListWrapper.appendChild($UL);
  }
}
