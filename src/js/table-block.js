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
    controlsWrapper: 'chart-block--controlsWrapper',
  },
};
// TODO функции ниже перенести в разделяемый с chart-block модуль

function getObjByProperty(obj, propertyName, typeName) {
  return Object.values(obj).filter((value) => value[propertyName] === typeName)[0];
}

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

function setLabel($FormElement, labelText) {
  const $label = document.createElement('label');
  $label.innerText = labelText;
  $label.appendChild($FormElement);
  return $label;
}

function setOptionsSelected(newValue, $Select) {
  const newSelectedElement = [].filter.call($Select.childNodes,
    (option) => option.value === newValue);
  if (!newSelectedElement[0].selected) {
    newSelectedElement[0].selected = true;
  }
}

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
    $UL.textContent = `${this.currentDataType.type}`;
    const dataSource = (this.dataSource === null ? this.globalCases : getObjByProperty(this.casesByCountry, 'alpha2Code', this.dataSource));

    Object.values(this.settings.caseTypes).forEach((value) => {
      const $LI = document.createElement('li');
      $LI.textContent = `${value.type}: ${dataSource[this.currentDataType.key][value.type]}`;
      $UL.appendChild($LI);
    });
    this.tableListWrapper.appendChild($UL);
  }
}
