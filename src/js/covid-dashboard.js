import ApiGateway from './api-gateway';
import ChartBlock from './chart-block';
import GlobalCasesBlock from './global-cases-block';
import MapBlock from './map-block';
import ListBlock from './list-block';

const settings = {
  mainContainerCSSClass: 'main-container',
  containerCSSClass: 'container',
  globalCasesCSSClass: 'global-cases-block',
  listBlockCSSClass: 'list-block',
  mapBlockCSSClass: 'map-block',
  tableBlockCSSClass: 'table-block',
  chartBlockCSSClass: 'chart-block',
  defaultOptions: { caseType: 'confirmed', dataType: 'lastDay' },
};

export default class CovidDashboard {
  constructor() {
    this.settings = settings;
    this.blocks = [];

    // first column
    this.$globalCases = document.createElement('div');
    this.$globalCases.classList.add(this.settings.globalCasesCSSClass);
    this.$list = document.createElement('div');
    this.$list.classList.add(this.settings.listBlockCSSClass);
    this.$firstContainer = document.createElement('div');
    this.$firstContainer.classList.add(this.settings.containerCSSClass);
    this.$firstContainer.appendChild(this.$globalCases);
    this.$firstContainer.appendChild(this.$list);

    // second column
    this.$mapBlock = document.createElement('div');
    this.$mapBlock.id = 'covid-map';
    this.$mapBlock.classList.add(this.settings.mapBlockCSSClass);

    // third column
    this.$tableBlock = document.createElement('div');
    this.$tableBlock.classList.add(this.settings.tableBlockCSSClass);
    this.$chartBlock = document.createElement('div');
    this.$chartBlock.classList.add(this.settings.chartBlockCSSClass);
    this.$thirdContainer = document.createElement('div');
    this.$thirdContainer.classList.add(this.settings.containerCSSClass);
    this.$thirdContainer.appendChild(this.$tableBlock);
    this.$thirdContainer.appendChild(this.$chartBlock);

    this.$mainContainer = document.createElement('div');
    this.$mainContainer.classList.add(this.settings.mainContainerCSSClass);
    this.$mainContainer.appendChild(this.$firstContainer);
    this.$mainContainer.appendChild(this.$mapBlock);
    this.$mainContainer.appendChild(this.$thirdContainer);

    this.selectCountry = (alpha2Code) => {
      this.blocks.forEach((block) => {
        if (typeof block.selectCountry === 'function') {
          block.selectCountry(alpha2Code);
        }
      });
    };

    this.selectType = ({ dataType, caseType }) => {
      this.blocks.forEach((block) => {
        if (typeof block.selectType === 'function') {
          block.selectType({ dataType, caseType });
        }
      });
    };

    this.apiGateway = new ApiGateway();
    this.apiGateway.fetchAndReloadAllData().then(() => {
      const globalCasesBlock = new GlobalCasesBlock({
        globalCases: this.apiGateway.globalCases,
        htmlContainer: this.$globalCases,
        options: this.settings.defaultOptions,
      });
      const mapBlock = new MapBlock({
        casesByCountry: this.apiGateway.casesByCountry,
        globalCases: this.apiGateway.globalCases,
        htmlContainer: this.$mapBlock,
        options: this.settings.defaultOptions,
        selectCountryCallback: this.selectCountry,
        selectTypeCallback: this.selectType,
      });
      const chartBlock = new ChartBlock({
        casesByCountry: this.apiGateway.casesByCountry,
        globalCases: this.apiGateway.globalCases,
        htmlContainer: this.$chartBlock,
        options: this.settings.defaultOptions,
        selectCountryCallback: this.selectCountry,
        selectTypeCallback: this.selectType,
      });
      const listBlock = new ListBlock({
        htmlContainer: this.$list,
        casesByCountry: this.apiGateway.casesByCountry,
        globalCases: this.apiGateway.globalCases,
        selectCountryCallback: this.selectCountry,
      });
      this.blocks.push(globalCasesBlock, mapBlock, chartBlock, listBlock);
    });

    // auto-sync
    const ONE_HOUR_IN_MILLISECONDS = 36e5;
    const reloadDataAndRenderBlocks = () => {
      this.apiGateway.fetchAndReloadAllData().then(() => {
        this.blocks.forEach((block) => block.render());
      });
    };
    setInterval(reloadDataAndRenderBlocks, ONE_HOUR_IN_MILLISECONDS);
  }

  get htmlFragment() {
    const $fragment = document.createDocumentFragment();
    $fragment.appendChild(this.$mainContainer);
    return $fragment;
  }
}
