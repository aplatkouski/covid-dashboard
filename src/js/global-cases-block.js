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

    this.getContent = () => `<h2 title="${
      typeDescription[this.options.dataType][this.options.caseType]
    }">Global: ${
      this.globalCasesData[this.options.dataType][this.options.caseType]
    }</h2>`;

    this.$mainContainer.innerHTML = this.getContent();
  }

  selectType({ dataType, caseType }) {
    this.options.dateType = dataType;
    this.options.caseType = caseType;
    this.$mainContainer.innerHTML = this.getContent();
  }

  render() {
    this.$mainContainer.innerHTM = this.getContent();
  }
}
