const settings = {
  countriesAPI: 'https://restcountries.eu/rest/v2/all?fields=name;alpha2Code;population;latlng;flag',
  countriesStorageKey: 'cached-country-data',
  covidAPI: 'https://api.covid19api.com/summary',
  covidStorageKey: 'cached-covid-data',
  flagAPI: 'https://www.countryflags.io',
  flagIconSize: 24,
  flagStyle: 'flat',
};

export default class ApiGateway {
  constructor() {
    this.settings = settings;
    this[Symbol.for('countries')] = JSON.parse(localStorage.getItem('countries')) || {};
    this[Symbol.for('date')] = new Date(JSON.parse(localStorage.getItem('date'))) || undefined;
    this[Symbol.for('global')] = JSON.parse(localStorage.getItem('global')) || {};
  }

  get isMoreThanHourSinceLastFetch() {
    const ONE_HOUR_IN_MILLISECONDS = 36e5;
    return (!this[Symbol.for('date')]
      || (Math.abs(Date.now() - this[Symbol.for('date')])
        > ONE_HOUR_IN_MILLISECONDS));
  }

  fetchAndReloadAllData() {
    const AUTO_RELOAD_TIMEOUT_IN_MILLISECONDS = 10000;
    return this.fetchCovidData()
      .then(() => this.fetchCountriesData())
      .then(() => this.fetchAndAssignFlags())
      .then(() => this.reloadDateCovidData())
      .then(() => this.reloadGlobalCovidData())
      .then(() => this.reloadCovidData())
      .then(() => this.reloadCountriesData())
      .then(() => this.calculateComparativeTo100ThousandPeople())
      .then(() => this.cacheData())
      .catch(() => setTimeout(this.fetchAndReloadAllData.bind(this),
        AUTO_RELOAD_TIMEOUT_IN_MILLISECONDS));
  }

  get casesByCountry() {
    if (this.isMoreThanHourSinceLastFetch) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('countries')];
  }

  get lastUpdatedAtDate() {
    if (this.isMoreThanHourSinceLastFetch) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('date')];
  }

  get globalCases() {
    if (this.isMoreThanHourSinceLastFetch) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('global')];
  }

  fetchCovidData() {
    return fetch(this.settings.covidAPI)
      .then((response) => response.json())
      .then((data) => {
        this[Symbol.for(this.settings.covidStorageKey)] = data;
        if (data?.Message) {
          return Promise.reject(data.Message);
        }
        return Promise.resolve(this[Symbol.for(this.settings.covidStorageKey)]);
      });
  }

  fetchCountriesData() {
    return fetch(this.settings.countriesAPI)
      .then((response) => response.json())
      .then((data) => {
        this[Symbol.for(this.settings.countriesStorageKey)] = data;
        return Promise.resolve(this[Symbol.for(this.settings.countriesStorageKey)]);
      });
  }

  fetchAndAssignFlags() {
    const headers = new Headers();
    const init = {
      method: 'GET',
      headers,
      mode: 'no-cors',
      cache: 'default',
    };
    return Promise.all(
      Object.keys(this[Symbol.for('countries')]).map(async (key) => {
        const country = this[Symbol.for('countries')][key];
        const $flagImage = document.createElement('img');
        $flagImage.alt = `${key} flag`;
        Object.assign(country, { flagImage: $flagImage });
        return fetch(
          `${this.settings.flagAPI}/${key}/${this.settings.flagStyle}`
          + `/${this.settings.flagIconSize}.png`,
          init,
        )
          .then((response) => response.blob())
          .then((blob) => {
            $flagImage.src = URL.createObjectURL(blob);
          });
      }),
    );
  }

  reloadCountriesData() {
    return Promise.all(
      this[Symbol.for(this.settings.countriesStorageKey)].map(
        async (country) => {
          const key = country.alpha2Code.toUpperCase();
          if (this[Symbol.for('countries')][key]) {
            const {
              name,
              alpha2Code,
              flag,
              latlng: [
                latitude,
                longitude,
              ],
              population,
            } = country;
            Object.assign(
              this[Symbol.for('countries')][key],
              {
                name,
                alpha2Code: alpha2Code.toUpperCase(),
                flagUrl: flag,
                latitude: +latitude,
                longitude: +longitude,
                population: +population,
              },
            );
          }
          return Promise.resolve({ key: this[Symbol.for('countries')][key] });
        },
      ),
    );
  }

  reloadCovidData() {
    return Promise.all(
      this[Symbol.for(this.settings.covidStorageKey)].Countries.map(
        async (country) => {
          const {
            CountryCode: alpha2Code,
            Date: date,
            NewConfirmed: newConfirmed,
            NewDeaths: newDeaths,
            NewRecovered: newRecovered,
            TotalConfirmed: totalConfirmed,
            TotalDeaths: totalDeaths,
            TotalRecovered: totalRecovered,
          } = country;
          const key = alpha2Code.toUpperCase();
          if (!this[Symbol.for('countries')][key]) {
            this[Symbol.for('countries')][key] = {};
          }
          Object.assign(this[Symbol.for('countries')][key],
            {
              lastDay: {
                confirmed: +newConfirmed,
                deaths: +newDeaths,
                recovered: +newRecovered,
              },
              total: {
                confirmed: +totalConfirmed,
                deaths: +totalDeaths,
                recovered: +totalRecovered,
              },
              date: Date.parse(date),
            });
          return Promise.resolve({ key: this[Symbol.for('countries')][key] });
        },
      ),
    );
  }

  reloadDateCovidData() {
    this[Symbol.for('date')] = Date.parse(
      this[Symbol.for(this.settings.covidStorageKey)].Date,
    );
    return Promise.resolve(this[Symbol.for('date')]);
  }

  reloadGlobalCovidData() {
    const {
      NewConfirmed: newConfirmed,
      NewDeaths: newDeaths,
      NewRecovered: newRecovered,
      TotalConfirmed: totalConfirmed,
      TotalDeaths: totalDeaths,
      TotalRecovered: totalRecovered,
    } = this[Symbol.for(this.settings.covidStorageKey)].Global;
    Object.assign(this[Symbol.for('global')], {
      lastDay: {
        confirmed: +newConfirmed,
        deaths: +newDeaths,
        recovered: +newRecovered,
      },
      total: {
        confirmed: +totalConfirmed,
        deaths: +totalDeaths,
        recovered: +totalRecovered,
      },
    });
    return Promise.resolve(this[Symbol.for('global')]);
  }

  calculateComparativeTo100ThousandPeople() {
    const precision = 100;

    const computeComparative = (value, ratio) => Math.round(
      (value / ratio) * precision,
    ) / precision;

    return Promise.all(
      Object.keys(this[Symbol.for('countries')]).map(async (key) => {
        const country = this[Symbol.for('countries')][key];
        const ratio = country.population / 100000;
        Object.assign(country,
          {
            totalComparative: {
              confirmed: computeComparative(country.total.confirmed, ratio),
              deaths: computeComparative(country.total.deaths, ratio),
              recovered: computeComparative(country.total.recovered, ratio),
            },
            lastDayComparative: {
              confirmed: computeComparative(country.lastDay.confirmed, ratio),
              deaths: computeComparative(country.lastDay.deaths, ratio),
              recovered: computeComparative(country.lastDay.recovered, ratio),
            },
          });
        return Promise.resolve({ key: country });
      }),
    );
  }

  cacheData() {
    localStorage.setItem('countries', JSON.stringify(this[Symbol.for('countries')]));
    localStorage.setItem('date', JSON.stringify(this[Symbol.for('date')]));
    localStorage.setItem('global', JSON.stringify(this[Symbol.for('global')]));
  }
}
