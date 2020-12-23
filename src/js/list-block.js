import { createSelectElement } from './tools';

const settings = {
  caseTypes: {
    confirmed: {
      type: 'confirmed',
      key: 'confirmed',
    },
    deaths: { type: 'deaths', key: 'deaths', color: 'rgba(194, 54, 54, 1)' },
    recovered: {
      type: 'recovered',
      key: 'recovered',
    },
  },
  dataTypes: {
    total: { type: 'total cases', key: 'total' },
    totalComparative: { type: 'total cases per 100k', key: 'totalComparative' },
    lastDay: { type: 'last day cases', key: 'lastDay' },
    lastDayComparative: {
      type: 'last day cases per 100k',
      key: 'lastDayComparative',
    },
  },
};

function createItem(type, className, text) {
  const element = document.createElement(type);
  element.className = className;
  element.innerText = (text !== undefined) ? text : '';
  return element;
}

function createArr(a) {
  const arrFromObj = Object.values(a);
  const res = [];
  for (let i = 0; i < arrFromObj.length; i += 1) {
    const countryObj = {
      name: arrFromObj[i].name,
      'confirmed-total': arrFromObj[i].total.confirmed,
      'deaths-total': arrFromObj[i].total.deaths,
      'recovered-total': arrFromObj[i].total.recovered,
      'confirmed-lastDay': arrFromObj[i].lastDay.confirmed,
      'deaths-lastDay': arrFromObj[i].lastDay.deaths,
      'recovered-lastDay': arrFromObj[i].lastDay.recovered,
      'confirmed-totalComparative': arrFromObj[i].totalComparative.confirmed,
      'deaths-totalComparative': arrFromObj[i].totalComparative.deaths,
      'recovered-totalComparative': arrFromObj[i].totalComparative.recovered,
      'confirmed-lastDayComparative': arrFromObj[i].lastDayComparative.confirmed,
      'deaths-lastDayComparative': arrFromObj[i].lastDayComparative.deaths,
      'recovered-lastDayComparative': arrFromObj[i].lastDayComparative.recovered,
      alpha2Code: arrFromObj[i].alpha2Code,
      flagUrl: arrFromObj[i].flagUrl,
    };
    res.push(countryObj);
  }
  return res;
}

function createListItem(country, number, flag) {
  const listItem = createItem('div', 'list-item');
  const cardInfo = createItem('div', 'card-info', `${number}`);
  const cardCountry = createItem('div', 'card-country-name', `${country}`);
  const cardFlag = createItem('div', 'card-flag');
  cardFlag.style.backgroundImage = `url(${flag})`;
  listItem.append(cardInfo, cardCountry, cardFlag);
  return listItem;
}

function search() {
  const input = document.querySelector('.search-input');
  const filter = input.value.toUpperCase();
  const li = document.querySelectorAll('.list-item');
  const names = document.querySelectorAll('.card-country-name');

  for (let i = 0; i < names.length; i += 1) {
    const cardText = names[i].innerText.toUpperCase();
    if (cardText.indexOf(filter) > -1) {
      li[i].style.display = '';
    } else {
      li[i].style.display = 'none';
    }
  }
}

function createSearchBar() {
  const searchBar = createItem('div', 'search-bar');
  const searchInput = createItem('input', 'search-input');
  searchInput.addEventListener('keyup', search);
  searchInput.type = 'text';
  searchInput.placeholder = 'Search...';
  searchBar.append(searchInput);
  return searchBar;
}

function createListItems(arr, param) {
  const listItems = createItem('ul', 'list-items');
  for (let i = 0; i < arr.length; i += 1) {
    const listItem = createListItem(arr[i].name, arr[i][param], arr[i].flagUrl);
    if (arr[i].name.length > 30) {
      listItem.classList.add('list-item-big');
    }
    listItems.append(listItem);
  }
  return listItems;
}

function sortArr(arr, param) {
  return arr.sort((a, b) => (a[param] < b[param] ? 1 : -1));
}

function changeList(param) {
  const listToRemove = document.querySelector('.list-items');
  if (listToRemove) {
    listToRemove.remove();
  }
  const obj = JSON.parse(localStorage.getItem('countries'));
  const arr = createArr(obj);
  const currentArr = sortArr(arr, param);
  const listItems = createListItems(currentArr, param);
  const list = document.querySelector('.list');
  list.append(listItems);
}

export default class ListBlock {
  constructor({
    casesByCountry,
    htmlContainer: $mainContainer,
    options = {
      caseType: 'confirmed',
      dataType: 'total',
    },
    selectTypeCallback,
  }) {
    this.settings = settings;
    this.options = options;
    this.casesByCountry = casesByCountry;
    this.currentCaseType = this.settings.caseTypes[options.caseType];
    this.currentDataType = this.settings.dataTypes[options.dataType];
    this.$mainContainer = $mainContainer;
    this.casesByCountry = casesByCountry;
    this.options = options;
    this.settings = settings;
    this.selectTypeCallback = selectTypeCallback;
    this.arr = createArr(this.casesByCountry);
    const listWrapper = this.createListWrapper();
    this.$mainContainer.append(listWrapper);
  }

  createListWrapper() {
    const wrapper = createItem('div', 'list-wrapper');
    this.controlsWrapper = document.createElement('div');
    this.controlsWrapper.classList.add('control-wrapper');
    this.$caseTypeSelector = createSelectElement(
      this.settings.caseTypes,
      this.currentCaseType.type,
    );
    this.$dataTypeSelector = createSelectElement(
      this.settings.dataTypes,
      this.currentDataType.type,
    );

    this.updateButton = document.createElement('button');
    this.updateButton.innerText = 'Update List';
    this.updateButton.addEventListener(
      'click', (e) => this.eventHandler(e),
    );
    this.controlsWrapper.append(this.$caseTypeSelector, this.$dataTypeSelector, this.updateButton);
    const searchBar = createSearchBar();
    const list = createItem('div', 'list');
    const currentArr = sortArr(this.arr, 'confirmed-total');
    const listItems = createListItems(currentArr, 'confirmed-total');
    list.append(listItems);
    wrapper.append(this.controlsWrapper, searchBar, list);
    document.body.append(wrapper);
    return wrapper;
  }

  eventHandler() {
    const parameter = `${this.$caseTypeSelector.value}-${this.$dataTypeSelector.value}`;
    changeList(parameter);
  }
}
