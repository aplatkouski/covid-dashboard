const settings = {
  countriesAPI: 'https://restcountries.eu/rest/v2/all?fields=name;alpha2Code;alpha3Code;population;latlng;flag',
  countriesStorageKey: 'cached-country-data',
  covidAPI: 'https://api.covid19api.com/summary',
  covidStorageKey: 'cached-covid-data',
  flagAPI: 'https://www.countryflags.io',
  flagIconSize: 24,
  flagStyle: 'flat',
  comparativeRatio: 100000,
  precision: 100,
  flagIconCSSClass: 'flag-icon',
};

export default class ApiGateway {
  constructor() {
    this.settings = settings;
    this[Symbol.for('countries')] = JSON.parse(
      localStorage.getItem('countries'),
    ) || {};
    this[Symbol.for('date')] = JSON.parse(localStorage.getItem('date'))
      ? new Date(JSON.parse(localStorage.getItem('date')))
      : undefined;
    this[Symbol.for('global')] = JSON.parse(localStorage.getItem('global'))
      || {};

    ['lastDay', 'lastDayComparative', 'total', 'totalComparative'].forEach(
      (dataType) => {
        if (!{}.hasOwnProperty.call(this[Symbol.for('global')], dataType)) {
          this[Symbol.for('global')][dataType] = {
            confirmed: 0,
            deaths: 0,
            recovered: 0,
          };
        }
      },
    );
  }

  get isOutdated() {
    const ONE_HOUR_IN_MILLISECONDS = 36e5;
    return (!this[Symbol.for('date')]
      || (Date.now() - this[Symbol.for('date')].getTime()
        > ONE_HOUR_IN_MILLISECONDS));
  }

  fetchAndReloadAllData() {
    if (!this.isOutdated) {
      return Promise.resolve();
    }
    return this.fetchCovidData()
      .then(() => this.fetchCountriesData())
      .then(() => this.reloadDateCovidData())
      .then(() => this.reloadCovidData())
      .then(() => this.reloadCountriesData())
      .then(() => this.assignComparativeDataToAllCountries())
      .then(() => this.reloadGlobalCovidData())
      .then(() => this.cacheData());
  }

  get casesByCountry() {
    if (this.isOutdated) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('countries')];
  }

  get lastUpdatedAtDate() {
    if (this.isOutdated) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('date')];
  }

  get globalCases() {
    if (this.isOutdated) {
      this.fetchAndReloadAllData();
    }
    return this[Symbol.for('global')];
  }

  fetchCovidData() {
    return fetch(this.settings.covidAPI)
      .then((response) => response.json())
      .then((data) => {
        this[Symbol.for(this.settings.covidStorageKey)] = data;
        if (data.Message) {
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
        return Promise.resolve(
          this[Symbol.for(this.settings.countriesStorageKey)],
        );
      });
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
              alpha3Code,
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
                alpha3Code: alpha3Code.toUpperCase(),
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
    ['lastDay', 'total'].forEach((dataType) => {
      ['confirmed', 'deaths', 'recovered'].forEach((caseType) => {
        this[Symbol.for('global')][dataType][caseType] = Object.values(
          this[Symbol.for('countries')],
        )
          .map((country) => country[dataType][caseType])
          .reduce((acc, cur) => acc + cur);
      });
    });

    this[Symbol.for('global')].population = Object.values(this[Symbol.for('countries')])
      .map((country) => country.population)
      .reduce((acc, cur) => acc + cur);

    return this.assignComparativeData(this[Symbol.for('global')]);
  }

  async assignComparativeData(country) {
    const getComparative = (value) => Math.round(
      (value / (country.population / this.settings.comparativeRatio))
      * this.settings.precision,
    ) / this.settings.precision;

    Object.assign(country, {
      totalComparative: {
        confirmed: getComparative(country.total.confirmed),
        deaths: getComparative(country.total.deaths),
        recovered: getComparative(country.total.recovered),
      },
      lastDayComparative: {
        confirmed: getComparative(country.lastDay.confirmed),
        deaths: getComparative(country.lastDay.deaths),
        recovered: getComparative(country.lastDay.recovered),
      },
    });
    return Promise.resolve(country);
  }

  assignComparativeDataToAllCountries() {
    return Promise.all(
      Object.keys(this[Symbol.for('countries')]).map(async (key) => {
        const country = this[Symbol.for('countries')][key];
        return this.assignComparativeData(country);
      }),
    );
  }

  cacheData() {
    localStorage.setItem('countries',
      JSON.stringify(this[Symbol.for('countries')]));
    localStorage.setItem('date', JSON.stringify(this[Symbol.for('date')]));
    localStorage.setItem('global', JSON.stringify(this[Symbol.for('global')]));
  }
}
