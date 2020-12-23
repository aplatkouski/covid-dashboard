const searchParametersArr = [
  {
    text: 'Total Cases',
    id: 'total-cases',
  },
  {
    text: 'Total Deaths',
    id: 'total-deaths',
  },
  {
    text: 'Total Recovered',
    id: 'total-recovered',
  },
  {
    text: 'Today Cases',
    id: 'today-cases',
  },
  {
    text: 'Today Deaths',
    id: 'today-deaths',
  },
  {
    text: 'Today Recovered',
    id: 'today-recovered',
  },
  {
    text: 'Total Cases per 100k',
    id: 'total-cases-100',
  },
  {
    text: 'Total Deaths per 100k',
    id: 'total-deaths-100',
  },
  {
    text: 'Total Recovered per 100k',
    id: 'total-recovered-100',
  },

  {
    text: 'Today Cases per 100k',
    id: 'today-cases-100',
  },
  {
    text: 'Today Deaths per 100k',
    id: 'today-deaths-100',
  },
  {
    text: 'Today Recovered per 100k',
    id: 'today-recovered-100',
  }];

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
      'total-cases': arrFromObj[i].total.confirmed,
      'total-deaths': arrFromObj[i].total.deaths,
      'total-recovered': arrFromObj[i].total.recovered,
      'today-cases': arrFromObj[i].lastDay.confirmed,
      'today-deaths': arrFromObj[i].lastDay.deaths,
      'today-recovered': arrFromObj[i].lastDay.recovered,
      'total-cases-100': arrFromObj[i].totalComparative.confirmed,
      'total-deaths-100': arrFromObj[i].totalComparative.deaths,
      'total-recovered-100': arrFromObj[i].totalComparative.recovered,
      'today-cases-100': arrFromObj[i].lastDayComparative.confirmed,
      'today-deaths-100': arrFromObj[i].lastDayComparative.deaths,
      'today-recovered-100': arrFromObj[i].lastDayComparative.recovered,
      alpha2Code: arrFromObj[i].alpha2Code,
      flagUrl: arrFromObj[i].flagUrl,
    };
    res.push(countryObj);
  }
  return res;
}

function adjustSearchParameters(param) {
  const searchParameters = document.querySelectorAll('.search-parameter');
  searchParameters.forEach((item) => {
    item.classList.remove('search-parameter-active');
  });
  const activeSearchParameter = document.getElementById(param);
  activeSearchParameter.classList.add('search-parameter-active');
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

function changeList(e) {
  const listToRemove = document.querySelector('.list-items');
  if (listToRemove) {
    listToRemove.remove();
  }
  const obj = JSON.parse(localStorage.getItem('countries'));
  const arr = createArr(obj);
  const { id } = e.target;
  const currentArr = sortArr(arr, id);
  adjustSearchParameters(id);
  const listItems = createListItems(currentArr, id);
  const list = document.querySelector('.list');
  list.append(listItems);
}

function createSearchParameters() {
  const searchParameters = createItem('div', 'search-parameters');
  for (let i = 0; i < searchParametersArr.length; i += 1) {
    const item = createItem('div', 'search-parameter', `${searchParametersArr[i].text}`);
    item.id = `${searchParametersArr[i].id}`;
    item.addEventListener('click', changeList);
    searchParameters.append(item);
  }
  return searchParameters;
}

export default class ListBlock {
  constructor({
    casesByCountry,
    htmlContainer: $mainContainer,
  }) {
    this.$mainContainer = $mainContainer;
    this.casesByCountry = casesByCountry;
    this.arr = createArr(this.casesByCountry);
    const listWrapper = this.createListWrapper();
    this.$mainContainer.append(listWrapper);
  }

  createListWrapper() {
    const wrapper = createItem('div', 'list-wrapper');
    const searchParameters = createSearchParameters();
    const searchBar = createSearchBar();
    const list = createItem('div', 'list');
    const currentArr = sortArr(this.arr, 'total-cases');
    const listItems = createListItems(currentArr, 'total-cases');
    list.append(listItems);
    wrapper.append(searchParameters, searchBar, list);
    document.body.append(wrapper);
    adjustSearchParameters('total-cases');
    return wrapper;
  }
}
