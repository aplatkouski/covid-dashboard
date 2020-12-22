export default class GlobalCasesBlock {
  constructor({
    casesByCountry,
    globalCases,
    htmlContainer: $mainContainer,
    options = {
      group: 'total',
      subGroup: 'confirmed',
    },
  }) {
    this.$mainContainer = $mainContainer;
    this.globalCasesData = globalCases;
    this.casesByCountry = casesByCountry;
    this.options = options;

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
