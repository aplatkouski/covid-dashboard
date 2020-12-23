// https://raw.githubusercontent.com/ptma/Leaflet.Legend/master/src/leaflet.legend.js
// eslint-disable-next-line max-classes-per-file
import L from 'leaflet';

class LegendSymbol {
  constructor(control, container, legend) {
    this.control = control;
    this.container = container;
    this.legend = legend;
    this.width = this.control.options.symbolWidth;
    this.height = this.control.options.symbolHeight;
  }
}

class GeometricSymbol extends LegendSymbol {
  constructor(control, container, legend) {
    super(control, container, legend);

    this.canvas = this.buildCanvas();
    if (this.drawSymbol) this.drawSymbol();
    this.style();
  }

  buildCanvas() {
    const canvas = L.DomUtil.create('canvas', null, this.container);
    canvas.height = this.control.options.symbolHeight;
    canvas.width = this.control.options.symbolWidth;
    return canvas;
  }

  // eslint-disable-next-line class-methods-use-this
  drawSymbol() {}

  style() {
    // eslint-disable-next-line no-multi-assign
    const ctx = (this.ctx = this.canvas.getContext('2d'));
    if (this.legend.fill || this.legend.fillColor) {
      ctx.globalAlpha = this.legend.fillOpacity || 1;
      ctx.fillStyle = this.legend.fillColor || this.legend.color;
      ctx.fill(this.legend.fillRule || 'evenodd');
    }

    if (this.legend.stroke || this.legend.color) {
      if (this.legend.dashArray) ctx.setLineDash(this.legend.dashArray || []);
      ctx.globalAlpha = this.legend.opacity || 1.0;
      ctx.lineWidth = this.legend.weight || 2;
      ctx.strokeStyle = this.legend.color || '#38f';
      ctx.lineCap = this.legend.lineCap || 'round';
      ctx.lineJoin = this.legend.lineJoin || 'round';
      ctx.stroke();
    }
  }

  // eslint-disable-next-line class-methods-use-this
  rescale() {}

  // eslint-disable-next-line class-methods-use-this
  center() {}
}

class CircleSymbol extends GeometricSymbol {
  drawSymbol() {
    // eslint-disable-next-line no-multi-assign
    const ctx = (this.ctx = this.canvas.getContext('2d'));

    const { legend } = this;
    const lineWeight = legend.weight || 3;

    const centerX = this.control.options.symbolWidth / 2;
    const centerY = this.control.options.symbolHeight / 2;
    const maxRadius = Math.min(centerX, centerY) - lineWeight;
    let radius = maxRadius;
    if (legend.radius) {
      radius = Math.min(legend.radius, maxRadius);
    }

    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
  }
}

L.Control.Legend = L.Control.extend({
  options: {
    position: 'topleft',
    title: 'Legend',
    legends: [],
    symbolWidth: 24,
    symbolHeight: 24,
    opacity: 1.0,
    column: 1,
    collapsed: false,
  },

  initialize(options) {
    L.Util.setOptions(this, options);
    this.legendSymbols = [];
    this.buildContainer();
  },

  onAdd(map) {
    this.map = map;
    this.initLayout();
    return this.container;
  },

  buildContainer() {
    this.container = L.DomUtil.create('div',
      'leaflet-legend leaflet-bar leaflet-control');
    this.container.style.backgroundColor = `rgba(255,255,255, ${
      this.options.opacity})`;

    this.contents = L.DomUtil.create('section',
      'leaflet-legend-contents', this.container);
    this.link = L.DomUtil.create('a', 'leaflet-legend-toggle',
      this.container);
    this.link.title = 'Legend';
    this.link.href = '#';

    const title = L.DomUtil.create('h3', 'leaflet-legend-title',
      this.contents);
    title.innerText = this.options.title || 'Legend';

    const len = this.options.legends.length;
    const colSize = Math.ceil(len / this.options.column);
    let legendContainer = this.contents;
    for (let i = 0; i < len; i += 1) {
      if (i % colSize === 0) {
        legendContainer = L.DomUtil.create('div',
          'leaflet-legend-column', this.contents);
      }
      const legend = this.options.legends[i];
      this.buildLegendItems(legendContainer, legend);
    }
  },

  buildLegendItems(legendContainer, legend) {
    const legendItemDiv = L.DomUtil.create('div', 'leaflet-legend-item',
      legendContainer);
    if (legend.inactive) {
      L.DomUtil.addClass(legendItemDiv, 'leaflet-legend-item-inactive');
    }
    const symbolContainer = L.DomUtil.create('i', null, legendItemDiv);

    let legendSymbol;
    if (legend.type === 'circle') {
      legendSymbol = new CircleSymbol(this, symbolContainer, legend);
    } else {
      L.DomUtil.remove(legendItemDiv);
      return;
    }
    this.legendSymbols.push(legendSymbol);

    symbolContainer.style.width = `${this.options.symbolWidth}px`;
    symbolContainer.style.height = `${this.options.symbolHeight}px`;

    const legendLabel = L.DomUtil.create('span', null, legendItemDiv);
    legendLabel.innerText = legend.label;
    if (legend.layers) {
      L.DomUtil.addClass(legendItemDiv, 'leaflet-legend-item-clickable');
      L.DomEvent.on(
        legendItemDiv,
        'click',
        () => {
          this.toggleLegend.call(this, legendItemDiv, legend.layers);
        },
        this,
      );
    }
  },

  initLayout() {
    L.DomEvent.disableClickPropagation(this.container);
    L.DomEvent.disableScrollPropagation(this.container);

    if (this.options.collapsed) {
      this.map.on('click', this.collapse, this);

      L.DomEvent.on(
        this.container,
        {
          mouseenter: this.expand,
          mouseleave: this.collapse,
        },
        this,
      );
    } else {
      this.expand();
    }
  },

  toggleLegend(legendDiv, layers) {
    if (L.DomUtil.hasClass(legendDiv, 'leaflet-legend-item-inactive')) {
      L.DomUtil.removeClass(legendDiv, 'leaflet-legend-item-inactive');
      if (Array.isArray(layers)) {
        layers.forEach((layer) => this.map.addLayer(layer));
      } else {
        this.map.addLayer(layers);
      }
    } else {
      L.DomUtil.addClass(legendDiv, 'leaflet-legend-item-inactive');
      if (Array.isArray(layers)) {
        layers.forEach((layer) => this.map.removeLayer(layer));
      } else {
        this.map.removeLayer(layers);
      }
    }
  },

  expand() {
    this.link.style.display = 'none';
    L.DomUtil.addClass(this.container, 'leaflet-legend-expanded');
    // eslint-disable-next-line no-restricted-syntax
    for (const legendSymbol of this.legendSymbols) {
      legendSymbol.rescale();
    }
    return this;
  },

  collapse() {
    this.link.style.display = 'block';
    L.DomUtil.removeClass(this.container, 'leaflet-legend-expanded');
    return this;
  },

  redraw() {
    L.DomUtil.empty(this.contents);
    this.buildLegendItems();
  },
});

// eslint-disable-next-line no-multi-assign
L.control.legend = L.control.Legend = (options) => new L.Control.Legend(options);
