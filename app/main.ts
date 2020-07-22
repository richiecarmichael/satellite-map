import ActionButton from "esri/support/actions/ActionButton";
import Camera from "esri/Camera";
import EsriMap from "esri/Map";
import FeatureLayer from "esri/layers/FeatureLayer";
import FeatureLayerView from "esri/views/layers/FeatureLayerView";
import Field from "esri/layers/support/Field"
import Graphic from "esri/Graphic";
import Ground from "esri/Ground";
import Home from "esri/widgets/Home";
import IconSymbol3DLayer from "esri/symbols/IconSymbol3DLayer";
import Point from "esri/geometry/Point";
import PointSymbol3D from "esri/symbols/PointSymbol3D"
import Polyline from "esri/geometry/Polyline";
import Popup from "esri/widgets/Popup";
import PopupTemplate from "esri/PopupTemplate";
import Query from "esri/tasks/support/Query";
import Request from "esri/request";
import Satellite from "node_modules/satellite.js/dist/satellite.min.js";
import SceneView from "esri/views/SceneView";
import SimpleLineSymbol from "esri/symbols/SimpleLineSymbol";
import SimpleRenderer from "esri/renderers/SimpleRenderer";
import Slider from "esri/widgets/Slider";
import SpatialReference from "esri/geometry/SpatialReference";
import TimeExtent from "esri/TimeExtent";

interface metadata {
  /*
   * Apogee
   * Point in the orbit where an Earth satellite is farthest from the Earth. Units are kilometers.
   */
  apogee: number;
  /*
   * Country
   * The nation or group that has responsibility for an object
   */
  country: string;
  /*
   * Inclination
   * 
   */
  inclination: number;
  /*
   * International Designator (or COSPAR ID)
   * International identifier assigned to artificial objects in space.[1] It consists of the launch year,
   * a three-digit incrementing launch number of that year and up to a three-letter code representing the
   * sequential identifier of a piece in a launch. In TLE format the first two digits of the year and the
   * dash are dropped.[2]
   */
  int: string;
  /*
   * Satellite Name
   */
  name: string;
  /*
   * Launch Date
   */
  launch: number;
  /*
   * Perigee
   * Point in the orbit where an Earth satellite is closest to the Earth. Units are kilometers.
   */
  perigee: number;
  /*
   * Orbital Period
   * The number of minutes an object takes to make one full orbit.
   */
  period: number;
  /*
   * Size
   * The Radar Cross Section (RCS) of the orbital object.
   * SMALL (< 0.1m2), MEDIUM (0.1m2 – 1m2), LARGE (>1m2)
   */
  size: string;
}

interface attributes extends metadata {
  /*
   * Object Id
   * Sequential unique identifier used by the layer.
   */
  oid: number;
  /*
   * NORAD ID
   * Sequential five-digit number assigned by USSTRATCOM (United States Strategic Command) in
   * order of discovery to all artificial objects in Earth orbit and space probes launched from
   * Earth.
   * https://en.wikipedia.org/wiki/Satellite_Catalog_Number
   */
  norad: number;
}

interface indexedMetadata {
  [ norad: number ] : metadata
}

interface indexedSatelliteEphemeris {
  [ oid: number ] : satrec
}

interface coordinate {
  x: number;
  y: number;
  z: number;
}

interface start {
  animationFrame: number;
  timestamp?: DOMHighResTimeStamp;
  camera?: Camera;
}

const TLE = 'data/tle.20200714.txt';
const OIO = 'data/oio.20200714.txt';
const NOW = new Date();

let start: start;        // Start time and camera position for spinning.
let timeout: number;     // Timeout for auto-spinning.
let satelliteLayerView: FeatureLayerView;
let highlight: any;
let pauseEvents: boolean = false;
let satelliteCount: number;

const ephemeris: indexedSatelliteEphemeris = {};

const map = new EsriMap({
  basemap: "satellite",
  ground: new Ground()
});

const popup = new Popup({
  collapseEnabled: true,
  dockEnabled: false,
  dockOptions: {
    buttonEnabled: true
  }
});

const view = new SceneView({
  alphaCompositingEnabled: true,
  camera: {
    position: {
      x: 0,
      y: 20, 
      z: 1e8
    },
    heading: 0,
    tilt: 0
  },
  constraints: {
    altitude: {
      min: 1e6,
      max: 2e8
    },
    clipDistance: {
      mode: "manual",
      near: 1e5,
      far: 3e8
    }
  },
  container: "viewDiv",
  environment: {
    background: {
      type: "color",
      color: [0, 0, 0, 1]
    },
    starsEnabled: false,
    atmosphereEnabled: false,
    lighting: {
      cameraTrackingEnabled: false,
      directShadowsEnabled: false
    }
  },
  map,
  padding: {
    right: 325
  },
  popup,
  qualityProfile: "high"
});

view.when(() => {
  startSpinning();
  document.getElementById("menu").classList.remove("is-hidden");
});
view.on(["pointer-down", "pointer-move", "key-down", "mouse-wheel"], () => {
  startSpinTimer();
});

view.ui.add(new Home({ view }), "top-left");

view.popup.on("trigger-action", (event) => {
  switch(event.action.id) {
    case "orbit":
      hideOrbit();
      showOrbit(view.popup.selectedFeature);
      break;
  }
});

view.popup.watch("visible", (visible) => {
  if (!visible) {
    hideOrbit();
  }
});

const sliderLaunch = new Slider({
  container: "sliderLaunch",
  min: 1950,
  max: 2025,
  values: [ 1950, 2025 ],
  snapOnClickEnabled: true,
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
  steps: 1,
  tickConfigs: [{
    mode: "position",
    values: [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020],
    labelsVisible: true
  }],
  labelFormatFunction: (value, type) => {
    switch(type) {
      case "tick":
        const twoDigitYear = value.toString().substring(2);
        return `'${twoDigitYear}`;
      case "value":
        return `${value}`;
    }
  }
});

const sliderPeriod = new Slider({
  container: "sliderPeriod",
  min: 0,
  max: 5,
  values: [ 0, 5 ],
  snapOnClickEnabled: true,
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
  steps: 1,
  tickConfigs: [{
    mode: "position",
    values: [0, 1, 2, 3, 4, 5],
    labelsVisible: true
  }],
  labelFormatFunction: (value, type) => {
    switch(type) {
      case "tick":
      case "value":
        switch (value) {
          case 0:
            return "0";
          case 1:
            return "100";
          case 2:
            return "200";
          case 3:
            return "1K";
          case 4:
            return "10K";
          case 5:
            return "60K";
        }
    }
  }
});

const sliderInclination = new Slider({
  container: "sliderInclination",
  min: 0,
  max: 160,
  values: [ 0, 160 ],
  snapOnClickEnabled: true,
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
  steps: 1,
  tickConfigs: [{
    mode: "position",
    values: [0, 30, 60, 90, 120, 150],
    labelsVisible: true
  }],
  labelFormatFunction: (value, type) => {
    switch(type) {
      case "tick":
      case "value":
        return `${value}°`;
    }
  }
});

const sliderApogee = new Slider({
  container: "sliderApogee",
  min: 0,
  max: 5,
  values: [ 0, 5 ],
  snapOnClickEnabled: true,
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
  steps: 1,
  tickConfigs: [{
    mode: "position",
    values: [0, 1, 2, 3, 4, 5],
    labelsVisible: true
  }],
  labelFormatFunction: (value, type) => {
    switch(type) {
      case "tick":
      case "value":
        switch (value) {
          case 0:
            return "0";
          case 1:
            return "1K";
          case 2:
            return "2K";
          case 3:
            return "5K";
          case 4:
            return "10K";
          case 5:
            return "600K";
        }
    }
  }
});

const sliderPerigee = new Slider({
  container: "sliderPerigee",
  min: 0,
  max: 5,
  values: [ 0, 5 ],
  snapOnClickEnabled: true,
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
  steps: 1,
  tickConfigs: [{
    mode: "position",
    values: [0, 1, 2, 3, 4, 5],
    labelsVisible: true
  }],
  labelFormatFunction: (value, type) => {
    switch(type) {
      case "tick":
      case "value":
        switch (value) {
          case 0:
            return "0";
          case 1:
            return "1K";
          case 2:
            return "2K";
          case 3:
            return "5K";
          case 4:
            return "10K";
          case 5:
            return "600K";
        }
    }
  }
});

function hideOrbit(): void {
  view.graphics.removeAll();
}

function showOrbit(satellite: Graphic): void {
  const attributes: attributes = satellite.attributes;
  const { oid, period } = attributes;
  const satrec = ephemeris[oid];

  const SEGMENTS = 100;
  const milliseconds = period * 60000 / SEGMENTS;
  
  const vertices: coordinate[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const date = new Date(NOW.getTime() + i * milliseconds);
    const satelliteLocation = getSatelliteLocation(satrec, date);
    if (!satelliteLocation) { continue; }
    vertices.push(satelliteLocation);
  }

  const orbit = new Graphic({
    geometry: new Polyline({
      paths: [
        vertices.map((coordinate) => [coordinate.x, coordinate.y, coordinate.z ])
      ]
    }),
    symbol: new SimpleLineSymbol({
      color: "white",
      width: 1
    })
  });

  view.graphics.add(orbit);
}

Promise.all([loadSatellites(), loadMetadata()]).then(async ([source, collection]) => {
  satelliteCount = source.length;
  clearSatelliteCounter();

  source.forEach((graphic) => {
    const attributes: attributes = graphic.attributes;
    const { norad } = attributes;
    const metadata = collection[norad];
    graphic.attributes = {
      ...attributes,
      ...metadata
    };
  });

  const fields = [
    new Field({
      name: "oid",
      type: "oid"
    }),
    new Field({
      name: "norad",
      type: "integer"
    }),
    new Field({
      name: "apogee",
      type: "integer"
    }),
    new Field({
      name: "country",
      type: "string"
    }),
    new Field({
      name: "inclination",
      type: "single"
    }),
    new Field({
      name: "int",
      type: "string"
    }),
    new Field({
      name: "name",
      type: "string"
    }),
    new Field({
      name: "launch",
      type: "date"
    }),
    new Field({
      name: "perigee",
      type: "integer"
    }),
    new Field({
      name: "period",
      type: "single"
    }),
    new Field({
      name: "size",
      type: "string"
    })
  ];

  const popupTemplate = new PopupTemplate({
    actions: [
      new ActionButton({
        id: "orbit",
        title: "Orbit",
        className: "esri-icon-rotate"
      })
    ],
    overwriteActions: true,
    title: "{name}",
    content: [{
      type: "fields",
      fieldInfos: [
        {
          fieldName: "norad",
          label: "NORAD"
        },
        {
          fieldName: "int",
          label: "COSPAR"
        },
        {
          fieldName: "country",
          label: "Country"
        },
        {
          fieldName: "period",
          label: "Period (min)",
          format: {
            digitSeparator: true,
            places: 0
          }
        },
        {
          fieldName: "inclination",
          label: "Inclination (°)",
          format: {
            digitSeparator: false,
            places: 2
          }
        },
        {
          fieldName: "apogee",
          label: "Apogee (km)",
          format: {
            digitSeparator: true,
            places: 0
          }
        },
        {
          fieldName: "perigee",
          label: "Perigee (km)",
          format: {
            digitSeparator: true,
            places: 0
          }
        },
        {
          fieldName: "size",
          label: "Size"
        },
        {
          fieldName: "launch",
          label: "Launch",
          format: {
            dateFormat: "short-date"
          }
        }
      ]
    }]
  });

  const renderer = new SimpleRenderer({
    label: "Satellites",
    symbol: new PointSymbol3D({
      symbolLayers: [
        new IconSymbol3DLayer({
          size: 1.5,
          resource: {
            primitive: "square"
          },
          material: {
            color: "white"
          },
          outline: null
        })
      ]
    })
  });

  const spatialReference = SpatialReference.WebMercator;

  const satelliteLayer = new FeatureLayer({
    id: "satellite",
    copyright: "space-track.org",
    fields,  
    geometryType: "point",
    objectIdField: "oid",
    popupTemplate,
    renderer,
    source,
    spatialReference,
    timeInfo: {
      startField: "launch"
    }
  });

  map.add(satelliteLayer);

  satelliteLayerView = await view.whenLayerView(satelliteLayer);
});

function loadSatellites(): Promise<Graphic[]> {
  const options: any = {
    responseType: "text"
  };
  return Request(TLE, options).then((response) => {
    const data: string = response.data;
    const lines = data.split("\n");
    const count = (lines.length - (lines.length % 2)) / 2;
    const satellites: Graphic[] = [];
    for (let i = 0; i < count; i++) {
      const line1 = lines[i * 2 + 0];
      const line2 = lines[i * 2 + 1];
      if (!line1 || !line2) { continue; }

      const satrec = Satellite.twoline2satrec(line1, line2);;
      if (!satrec) { continue; }

      const satelliteLocation = getSatelliteLocation(satrec, NOW);
      if (!satelliteLocation) { continue; }

      const oid = i + 1;
      const norad = Number.parseInt(satrec.satnum, 10);
      const graphic = new Graphic ({
        attributes: {
          oid,
          norad
        },
        geometry: new Point(satelliteLocation)
      });

      ephemeris[oid] = satrec;
      satellites.push(graphic);
    }
    return satellites;
  });
}

function getSatelliteLocation(satrec: satrec, date: Date): coordinate {
  const propagation = Satellite.propagate(satrec, date);
  const position = propagation?.position;
  if (!position || Number.isNaN(position.x) || Number.isNaN(position.y) || Number.isNaN(position.z)) {
    return null;
  }

  const gmst = Satellite.gstime(NOW);
  const geographic = Satellite.eciToGeodetic(position, gmst);
  const { longitude, latitude, height } = geographic;

  const x = Satellite.radiansToDegrees(longitude);
  const y = Satellite.radiansToDegrees(latitude);
  const z = height * 1000;
  return { x, y, z };
}

function loadMetadata(): Promise<indexedMetadata> {
  const options: any = {
    responseType: "text"
  };
  return Request(OIO, options).then((response) => {
    const collection: indexedMetadata = {};

    const data: string = response.data;
    const lines = data.split("\n");
    lines.forEach((line) => {
      const items = line.split(",");
      const norad = Number(items[2]);
      collection[norad] = {
        int: items[0],
        name: items[1],
        country: items[3],
        period: Number(items[4]),
        inclination: Number(items[5]),
        apogee: Number(items[6]),
        perigee: Number(items[7]),
        size: items[8],
        launch: new Date(items[10]).getTime()
      };
    });

    return collection;
  });
}

function startSpinTimer(): void {
  stopSpinning();
  if (timeout != undefined) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(() => {
    startSpinning();
  }, 3000);
}

function startSpinning(): void {
  if (view.interacting) {
    startSpinTimer();
    return;
  }
  start = {
    animationFrame: requestAnimationFrame(spin)
  };
}

function stopSpinning(): void {
  if (start) {
    cancelAnimationFrame(start.animationFrame);
    start = null;
  }
}

function spin(timestamp: DOMHighResTimeStamp): void {
  if (!start) {
    return;
  }
  if (start.timestamp === undefined) {
    start.timestamp = timestamp;
    start.camera = view.camera.clone();
  }
  if (view.viewingMode === "global") {
    const diff = timestamp - start.timestamp;
    const rotate = 1 * diff / 1000; // 1 degree per second rotation

    const { heading, tilt, position: { longitude, latitude, z } } = start.camera;
    const newLongitude = longitude + rotate;
    const remainder = newLongitude > 360 ? newLongitude % 360 : 0;
    
    const camera = new Camera({
      heading,
      tilt,
      position: new Point({
        longitude: newLongitude - remainder,
        latitude,
        z
      })
    });
    view.set({
      camera
    });
  }

  requestAnimationFrame(spin)
}

document.getElementById("reset").addEventListener("click", () => {
  clearSelection();
});

document.querySelectorAll("#menu .radio-group .radio-group-input").forEach((element) => {
  element.addEventListener("click", () => {
    updateSelection();
  });
});

sliderLaunch.watch("values", () => updateSelection());
sliderPeriod.watch("values", () => updateSelection());
sliderInclination.watch("values", () => updateSelection());
sliderApogee.watch("values", () => updateSelection());
sliderPerigee.watch("values", () => updateSelection());

function clearSelection(): void {
  highlight?.remove();

  pauseUIEvents();

  (<HTMLInputElement>document.getElementById("country-all")).checked = true;
  (<HTMLInputElement>document.getElementById("type-all")).checked = true;
  (<HTMLInputElement>document.getElementById("size-all")).checked = true;

  resetSlider(sliderLaunch);
  resetSlider(sliderPeriod);
  resetSlider(sliderInclination);
  resetSlider(sliderApogee);
  resetSlider(sliderPerigee);

  resumeUIEvents();

  clearSatelliteCounter();
}

function clearSatelliteCounter(): void {
  document.getElementById("counter").innerText = `${satelliteCount} Satellites Loaded`;
}

function updateSatelliteCounter(count: number): void {
  document.getElementById("counter").innerText = `${count} of ${satelliteCount} Satellites Found`;
}

function isSliderMaximized(slider: Slider): boolean {
  return slider.values[0] === slider.min && slider.values[1] === slider.max
}

function resetSlider(slider: Slider): void {
  if (!isSliderMaximized(slider)) {
    slider.values = [
      slider.min,
      slider.max
    ];
  }
}

function pauseUIEvents(): void {
  pauseEvents = true;
}
function resumeUIEvents(): void {
  pauseEvents = false;
}

function updateSelection(): void {
  if (pauseEvents) { return; }

  const country = document.querySelectorAll("#menu .radio-group .radio-group-input[name='country']:checked").item(0).getAttribute("data-country");
  const type = document.querySelectorAll("#menu .radio-group .radio-group-input[name='type']:checked").item(0).getAttribute("data-type");
  const size = document.querySelectorAll("#menu .radio-group .radio-group-input[name='size']:checked").item(0).getAttribute("data-size");

  if (country === "ALL" &&
      type === "ALL" &&
      size === "ALL" &&
      isSliderMaximized(sliderLaunch) &&
      isSliderMaximized(sliderPeriod) &&
      isSliderMaximized(sliderInclination) &&
      isSliderMaximized(sliderApogee) &&
      isSliderMaximized(sliderPerigee)
    ) {
    clearSelection();
    return;
  }

  let where = "";
  if (country !== "ALL") {
    where += `country='${country}'`;
  }
  if (type !== "ALL") {
    if (where !== "") { where += " AND "; }
    where += type === "JUNK" ? `(name LIKE '%DEB%' OR name LIKE '%R/B%')` : `(name NOT LIKE '%DEB%' AND name NOT LIKE '%R/B%')`;
  }
  if (size !== "ALL") {
    if (where !== "") { where += " AND "; }
    where += `size='${size}'`;
  }

  let timeExtent: TimeExtent = null;
  if (!isSliderMaximized(sliderLaunch)) {
    timeExtent = new TimeExtent({
      start: new Date(sliderLaunch.values[0], 0, 1),
      end: new Date(sliderLaunch.values[1], 0, 1),
    })
  }

  if (!isSliderMaximized(sliderPeriod)) {
    if (where !== "") { where += " AND "; }
    const period = new Map<number, number>([
      [0, 0],
      [1, 100],
      [2, 200],
      [3, 1000],
      [4, 10000],
      [5, 60000]
    ]);
    const from = period.get(sliderPeriod.values[0]);
    const to = period.get(sliderPeriod.values[1]);
    where += `(period BETWEEN ${from} AND ${to})`;
  }

  if (!isSliderMaximized(sliderInclination)) {
    if (where !== "") { where += " AND "; }
    const from = sliderInclination.values[0];
    const to = sliderInclination.values[1];
    where += `(inclination BETWEEN ${from} AND ${to})`;
  }

  if (!isSliderMaximized(sliderApogee)) {
    if (where !== "") { where += " AND "; }
    const apogee = new Map<number, number>([
      [0, 0],
      [1, 1000],
      [2, 2000],
      [3, 5000],
      [4, 100000],
      [5, 600000]
    ]);
    const from = apogee.get(sliderApogee.values[0]);
    const to = apogee.get(sliderApogee.values[1]);
    where += `(apogee BETWEEN ${from} AND ${to})`;
  }

  if (!isSliderMaximized(sliderPerigee)) {
    if (where !== "") { where += " AND "; }
    const perigee = new Map<number, number>([
      [0, 0],
      [1, 1000],
      [2, 2000],
      [3, 5000],
      [4, 100000],
      [5, 600000]
    ]);
    const from = perigee.get(sliderPerigee.values[0]);
    const to = perigee.get(sliderPerigee.values[1]);
    where += `(perigee BETWEEN ${from} AND ${to})`;
  }

  const query = new Query({
    timeExtent,
    where
  });

  const { layer } = satelliteLayerView;
  layer.queryFeatures(query).then((featureSet) => {
    highlight?.remove();
    highlight = satelliteLayerView.highlight(featureSet.features);
  });

  layer.queryFeatureCount(query).then((count) => {
    updateSatelliteCounter(count);
  });
}
