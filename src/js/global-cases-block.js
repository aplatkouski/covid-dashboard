export default class GlobalCasesBlock {
  constructor({
    casesByCountry,
    globalCases,
    htmlContainer: $mainContainer,
    options = {
      dataType: 'total',
      caseType: 'lastDay',
    },
  }) {
    this.$mainContainer = $mainContainer;
    this.globalCasesData = globalCases;
    this.casesByCountry = casesByCountry;
    this.options = options;

    this.$mainContainer.innerHTML = `<h2>${
      this.globalCasesData[this.options.dataType][this.options.caseType]
    }</h2>`;
  }

  render() {
    this.$mainContainer.innerHTML = `<h2>${this.globalCasesData.total.confirmed}</h2>`;
  }
}
