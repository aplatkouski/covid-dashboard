export default class GlobalCasesBlock {
  constructor($mainContainer, dataSource) {
    this.$mainContainer = $mainContainer;
    this.globalCasesData = dataSource;
    this.$mainContainer.innerHTML = `<h2>${this.globalCasesData.total.confirmed}</h2>`;
  }

  selectCountry(alpha2Code) {
    this.$mainContainer.innerHTML = `<h2>${
      this.casesByCountry[alpha2Code][this.options.group][this.options.subGroup]
    }</h2>`;
  }

  render() {
    this.$mainContainer.innerHTML = `<h2>${this.globalCasesData.total.confirmed}</h2>`;
  }
}
