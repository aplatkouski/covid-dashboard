import typeDescription from './type-description';

export default class GlobalCasesBlock {
  constructor({
    globalCases,
    htmlContainer: $mainContainer,
    options = {
      dataType: 'total',
      caseType: 'lastDay',
    },
  }) {
    this.$mainContainer = $mainContainer;
    this.globalCasesData = globalCases;
    this.options = options;

    this.$mainContainer.innerHTML = `<h2 title="${
      typeDescription[this.options.dataType][this.options.caseType]
    }">${
      this.globalCasesData[this.options.dataType][this.options.caseType]
    }</h2>`;
  }

  selectType({ dataType, caseType }) {
    this.options.dateType = dataType;
    this.options.caseType = caseType;
    this.$mainContainer.innerHTML = `<h2 title="${
      typeDescription[this.options.dataType][this.options.caseType]
    }">${
      this.globalCasesData[this.options.dataType][this.options.caseType]
    }</h2>`;
  }

  render() {
    this.$mainContainer.innerHTML = `<h2 title="${
      typeDescription[this.options.dataType][this.options.caseType]
    }">${
      this.globalCasesData[this.options.dataType][this.options.caseType]
    }</h2>`;
  }
}
