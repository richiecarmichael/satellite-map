import ActionButton from "esri/support/actions/ActionButton";
import Camera from "esri/Camera";
import EsriMap from "esri/Map";
import Expand from "esri/widgets/Expand";
import FeatureFilter from "esri/views/layers/support/FeatureFilter";
import FeatureLayer from "esri/layers/FeatureLayer";
import FeatureLayerView from "esri/views/layers/FeatureLayerView";
import Field from "esri/layers/support/Field"
import Graphic from "esri/Graphic";
import Ground from "esri/Ground";
import Home from "esri/widgets/Home";
import LabelClass from "esri/layers/support/LabelClass";
import Popup from "esri/widgets/Popup";
import PopupTemplate from "esri/PopupTemplate";
import Query from "esri/tasks/support/Query";
import Request from "esri/request";
import Satellite from "node_modules/satellite.js/dist/satellite.min.js";
import SceneView from "esri/views/SceneView";
import Slider from "esri/widgets/Slider";
import TimeExtent from "esri/TimeExtent";
import { IconSymbol3DLayer, PointSymbol3D, LabelSymbol3D, LineSymbol3D, LineSymbol3DLayer, TextSymbol3DLayer } from "esri/symbols"
import { Point, Polyline, SpatialReference } from "esri/geometry";
import { Renderer, SimpleRenderer, UniqueValueRenderer } from 'esri/renderers';

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

interface coordinate {
  x: number;
  y: number;
  z: number;
}

interface indexedMetadata {
  [ norad: number ] : metadata
}

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

interface Layers {
  filter: FeatureFilter,
  orbit: Omit<LayerProps, "labelsVisible" | "renderer">
  satellite: LayerProps
}

interface LayerProps {
  labelsVisible: boolean,
  renderer: Renderer;
  visible: boolean
}

interface satellite {
  norad: number;
  satrec: satrec;
}

interface start {
  animationFrame: number;
  timestamp?: DOMHighResTimeStamp;
  camera?: Camera;
}

const GPS = [
  24876, // USA-132
  25933, // USA-145
  26360, // USA-150
  26407, // USA-151
  27663, // USA-166
  27704, // USA-168
  28129, // USA-175
  28190, // USA-177
  28474, // USA-180
  28874, // USA-183
  29486, // USA-190
  29601, // USA-192
  32260, // USA-196
  32384, // USA-199
  32711, // USA-201
  35752, // USA-206
  36585, // USA-213
  37753, // USA-232
  38833, // USA-239
  39166, // USA-242
  39533, // USA-248
  39741, // USA-251
  40105, // USA-256
  40294, // USA-258
  40534, // USA-260
  40730, // USA-262
  41019, // USA-265
  41328, // USA-266
  40730, // USA-289
  44506, // USA-293 (NAVSTAR 78)
  45854  // USA-304 (NAVSTAR 79)
];
const GLONASS = [
  32276, // Kosmos 2432
  32275, // Kosmos 2433
  32393, // Kosmos 2434
  32395, // Kosmos 2436
  36111, // Kosmos 2456
  36400, // Kosmos 2459
  36402, // Kosmos 2460
  36401, // Kosmos 2461
  37139, // Kosmos 2464
  37869, // Kosmos 2475
  37867, // Kosmos 2476
  37868, // Kosmos 2477
  39155, // Kosmos 2485
  39620, // Kosmos 2494
  40001, // Kosmos 2500
  40315, // Kosmos 2501
  41330, // Kosmos 2514
  41554, // Kosmos 2516
  42939, // Kosmos 2522
  43508, // Kosmos 2527
  43687, // Kosmos 2529
  44299, // Kosmos 2534
  44850, // Kosmos 2544
  45358  // Kosmos 2545
];
const INMARSAT = [
  8697, // Marisat 1
  8882, // Marisat 2
  9478, // Marisat 3
  20918, // INMARSAT 2-F1
  21149, // INMARSAT 2-F2
  21814, // INMARSAT 2-F3
  21940, // INMARSAT 2-F4
  23839, // INMARSAT 3-F1
  24307, // INMARSAT 3-F2
  24674, // INMARSAT 3-F3
  24819, // INMARSAT 3-F4
  25153, // INMARSAT 3-F5
  28628, // INMARSAT 4-F1
  28899, // INMARSAT 4-F2
  33278, // INMARSAT 4-F3
  39476, // INMARSAT 5-F1
  40384, // INMARSAT 5-F2
  40882, // INMARSAT 5-F3
  42698, // INMARSAT 5-F4
  44801  // INMARSAT GX5
];
const LANDSAT = [
  6126,  // Landsat 1
  7615,  // Landsat 2
  10702, // Landsat 3
  13367, // Landsat 4
  14780, // Landsat 5
  25682, // Landsat 7
  39084  // Landsat 8
];
const DIGITALGLOBE = [
  25919, // IKONOS
  33331, // GeoEye-1
  32060, // WorldView-1
  35946, // WorldView-2
  40115, // WorldView-3
  41848  // WorldView-4
];
const FENGUYIN_DEBRIS = "FENGYUN 1C DEB";
const ISS = 25544;
const VANGUARD_1 = 5;

const LOW_ORBIT = 2000;
const GEOSYNCHRONOUS_ORBIT = 35786;
const geosyncMin = GEOSYNCHRONOUS_ORBIT * 0.98;
const geosyncMax = GEOSYNCHRONOUS_ORBIT * 1.02;

const NASA_SATELLITE_DATABASE = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id='; // use International id
const N2YO_SATELLITE_DATABASE = 'https://www.n2yo.com/satellite/?s=';                            // use NORAD id

const satelliteRenderer = new SimpleRenderer({
  label: "Satellites",
  symbol: new PointSymbol3D({
    symbolLayers: [
      new IconSymbol3DLayer({
        size: 1.5,
        resource: {
          primitive: "square"
        },
        material: {
          color: [255, 255, 255, 0.5]
        },
        outline: null
      })
    ]
  })
});

const countryRenderer = new UniqueValueRenderer({
  field: "country",
  defaultSymbol: new PointSymbol3D({
    symbolLayers: [
      new IconSymbol3DLayer({
        size: 1.5,
        resource: {
          primitive: "square"
        },
        material: {
          color: [255, 255, 255, 0]
        },
        outline: null
      })
    ]
  }),
  uniqueValueInfos: [
    {
      value: "PRC",
      label: "China",
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            size: 1.5,
            resource: {
              primitive: "square"
            },
            material: {
              color: "yellow"
            },
            outline: null
          })
        ]
      })
    },
    {
      value: "CIS",
      label: "Russia",
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            size: 1.5,
            resource: {
              primitive: "square"
            },
            material: {
              color: "red"
            },
            outline: null
          })
        ]
      })
    },
    {
      value: "US",
      label: "United States",
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            size: 1.5,
            resource: {
              primitive: "square"
            },
            material: {
              color: "cyan"
            },
            outline: null
          })
        ]
      })
    }
  ]
});

const junkRenderer = new UniqueValueRenderer({
  valueExpression: "When(Find('DEB', $feature.name) != -1, 'debris', Find('R/B', $feature.name) != -1, 'rocket-booster', null)",
  defaultSymbol: new PointSymbol3D({
    symbolLayers: [
      new IconSymbol3DLayer({
        size: 1.5,
        resource: {
          primitive: "square"
        },
        material: {
          color: [255, 255, 255, 0]
        },
        outline: null
      })
    ]
  }),
  uniqueValueInfos: [
    {
      value: "debris",
      label: "Debris",
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            size: 1.5,
            resource: {
              primitive: "square"
            },
            material: {
              color: "cyan"
            },
            outline: null
          })
        ]
      })
    },
    {
      value: "rocket-booster",
      label: "Rocket Booster",
      symbol: new PointSymbol3D({
        symbolLayers: [
          new IconSymbol3DLayer({
            size: 1.5,
            resource: {
              primitive: "square"
            },
            material: {
              color: "red"
            },
            outline: null
          })
        ]
      })
    }
  ]
});

const themes = new Map<string, Layers>();
themes.set("low", {
  filter: new FeatureFilter({
    where: `apogee <= ${LOW_ORBIT} AND perigee <= ${LOW_ORBIT}`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("medium", {
  filter: new FeatureFilter({
    where: `(apogee >= ${LOW_ORBIT} AND apogee <= ${geosyncMin}) AND (perigee >= ${LOW_ORBIT} AND perigee <= ${geosyncMin})`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("high", {
  filter: new FeatureFilter({
    where: `apogee > ${geosyncMax} OR perigee > ${geosyncMax}`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("geosynchronous", {
  filter: new FeatureFilter({
    where: `(apogee >= ${geosyncMin} AND apogee <= ${geosyncMax}) AND (perigee >= ${geosyncMin} AND perigee <= ${geosyncMax})`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("geostationary", {
  filter: new FeatureFilter({
    where: `(apogee >= ${geosyncMin} AND apogee <= ${geosyncMax}) AND (perigee >= ${geosyncMin} AND perigee <= ${geosyncMax}) AND (inclination >= 0 AND inclination <= 1)`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("digitalglobe", {
  filter: new FeatureFilter({
    where: `norad IN (${DIGITALGLOBE.join(",")})`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("inmarsat", {
  filter: new FeatureFilter({
    where: `norad IN (${INMARSAT.join(",")})`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("glonass", {
  filter: new FeatureFilter({
    where: `norad IN (${GLONASS.join(",")})`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("gps", {
  filter: new FeatureFilter({
    where: `norad IN (${GPS.join(",")})`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("landsat", {
  filter: new FeatureFilter({
    where: `norad IN (${LANDSAT.join(",")})`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("starlink", {
  filter: new FeatureFilter({
    where: `name LIKE 'STARLINK-%'`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("country", {
  filter: new FeatureFilter({
    where: `country IN ('PRC','CIS','US')`
  }),
  satellite: {
    labelsVisible: false,
    renderer: countryRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("junk", {
  filter: new FeatureFilter({
    where: `name LIKE '%DEB%' OR name LIKE '%R/B%'`
  }),
  satellite: {
    labelsVisible: false,
    renderer: junkRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("date", {
  filter: new FeatureFilter({
    where: `(name LIKE '%DEB%' OR name LIKE '%R/B%')`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("debris", {
  filter: new FeatureFilter({
    where: `name='${FENGUYIN_DEBRIS}'`
  }),
  satellite: {
    labelsVisible: false,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: false
  }
});
themes.set("iss", {
  filter: new FeatureFilter({
    where: `norad=${ISS}`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});
themes.set("vanguard-1", {
  filter: new FeatureFilter({
    where: `norad=${VANGUARD_1}`
  }),
  satellite: {
    labelsVisible: true,
    renderer: satelliteRenderer,
    visible: true
  },
  orbit: {
    visible: true
  }
});

const TLE = 'data/tle.20200714.txt';
const OIO = 'data/oio.20200714.txt';
const NOW = new Date();
const numberFormatter = new Intl.NumberFormat();

let start: start;    // Start time and camera position for spinning.
let timeout: number; // Timeout for auto-spinning.
let satelliteCount: number;

const view = new SceneView({
  alphaCompositingEnabled: true,
  camera: {
    position: {
      x: 0,
      y: 20, 
      z: 3e8
    },
    heading: 0,
    tilt: 0
  },
  constraints: {
    altitude: {
      min: 1e6,
      max: 1e9
    },
    clipDistance: {
      mode: "manual",
      near: 1e5,
      far: 1e9 + 5e7,
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
  map: new EsriMap({
    basemap: "satellite",
    ground: new Ground()
  }),
  popup: new Popup({
    collapseEnabled: true,
    dockEnabled: false,
    dockOptions: {
      buttonEnabled: true
    }
  }),
  qualityProfile: "high"
});

view.when(() => {
  startSpinning();
  document.getElementById("content").classList.remove("esri-button--disabled");
  document.getElementById("orbit").classList.remove("esri-button--disabled");
});

view.on(["pointer-down", "pointer-move", "key-down", "mouse-wheel"], () => {
    startSpinTimer();
});

view.popup.on("trigger-action", (event) => {
  const attributes: attributes = view.popup.selectedFeature.attributes;
  const { int, norad } = attributes;

  switch(event.action.id) {
    case "nasa":
      window.open(`${NASA_SATELLITE_DATABASE}${int}`);
      break;
    case "n2yo":
      window.open(`${N2YO_SATELLITE_DATABASE}${norad}`);
      break;
  }
});

const expand = new Expand({
  content: document.getElementById("legend"),
  expandIconClass: "esri-icon-description",
  expandTooltip: "Information Panel",
  mode: "floating",
  view
});
expand.watch("expanded", (value) => {
  if (value) {
    const value = document.querySelectorAll("input[name='theme']:checked").item(0).getAttribute("value");
    document.querySelectorAll(".satellite-legend-item").forEach((element) => {
      if (element.getAttribute("data-item") === value) {
        element.classList.remove("is-hidden");
      } else {
        element.classList.add("is-hidden");
      }
    });
  }
});

view.ui.add(new Home({ view }), "top-left");
view.ui.add(expand, "bottom-left");
view.ui.add("tools", "top-left");

Promise.all([loadSatellites(), loadMetadata()]).then(([source, collection]) => {
  satelliteCount = source.length;

  const satelliteGraphics = source.map((s, oid) => {
    const { norad, satrec } = s;
    const metadata = collection[norad];
    const coordinate = getSatelliteLocation(satrec, NOW);
    if (!coordinate) { return; }
    const geometry = new Point(coordinate);

    const attributes: attributes = {
      oid,
      norad,
      ...metadata
    };

    return new Graphic({
      attributes,
      geometry
    });
  }).filter((f) => f);

  const orbitGraphics = source.map((s, oid) => {
    const { norad, satrec } = s;
    const metadata = collection[norad];
    if (!metadata) { return; }
    const { period } = metadata;

    const coordinates = getOrbit(satrec, period, NOW);

    const attributes: attributes = {
      oid,
      norad,
      ...metadata
    };
    
    const orbit = new Graphic({
      attributes,
      geometry: new Polyline({
        paths: [
          coordinates.map((coordinate) => [
            coordinate.x,
            coordinate.y,
            coordinate.z
          ])
        ]
      })
    });
    return orbit;
  }).filter((s) => s);

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
        id: "nasa",
        title: "Nasa",
        className: "esri-icon-link"
      }),
      new ActionButton({
        id: "n2yo",
        title: "N2YO",
        className: "esri-icon-link"
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

  const spatialReference = SpatialReference.WebMercator;

  const labelingInfo = [
    new LabelClass({
      labelExpressionInfo: {
        expression: "$feature.name"
      },
      labelPlacement: "above-center",
      symbol: new LabelSymbol3D({
        symbolLayers: [
          new TextSymbol3DLayer({
            material: {
              color: [255, 255, 255, 1]
            },
            size: 10
          })
        ]
      })
    })
  ];

  const orbitRenderer = new SimpleRenderer({
    label: "Satellite Orbit",
    symbol: new LineSymbol3D({
      symbolLayers: [
        new LineSymbol3DLayer({
          size: 1,
          material: {
            color: [255, 255, 255, 0.1]
          }
        })
      ]
    })
  });

  const copyright = "space-track.org";
  const objectIdField = "oid";

  view.map.addMany([
    new FeatureLayer({
      id: "satellite",
      copyright,
      fields,  
      geometryType: "point",
      labelingInfo,
      labelsVisible: false,
      objectIdField,
      popupTemplate,
      renderer: satelliteRenderer,
      source: satelliteGraphics,
      spatialReference,
      timeInfo: {
        startField: "launch"
      },
      title: "Satellites",
      visible: false
    }),
    new FeatureLayer({
      id: "orbit",
      copyright,
      fields,
      geometryType: "polyline",
      labelsVisible: false,
      objectIdField,
      popupTemplate,
      renderer: orbitRenderer,
      source: orbitGraphics,
      spatialReference,
      title: "Orbits",
      visible: false
    })
  ]);

  updateLayers();
});

const sliderLaunch = new Slider({
  container: "sliderLaunch",
  min: 1950,
  max: 2025,
  snapOnClickEnabled: true,
  steps: 1,
  tickConfigs: [{
    mode: "position",
    labelsVisible: true,
    values: [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020]
  }],
  values: [ 1950, 2025 ],
  visibleElements: {
    labels: true,
    rangeLabels: false
  },
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
sliderLaunch.watch("values", () => updateLayers());

document.querySelectorAll("input[name='theme']").forEach((element) => {
  element.addEventListener("click", () => {
    updateLayers();
  });
});

function getOrbit(satrec: satrec, period: number, start: Date): coordinate[] {
  const SEGMENTS = 100;
  const milliseconds = period * 60000 / SEGMENTS;
  
  const vertices: coordinate[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const date = new Date(start.getTime() + i * milliseconds);
    const satelliteLocation = getSatelliteLocation(satrec, date);
    if (!satelliteLocation) { continue; }
    vertices.push(satelliteLocation);
  }

  return vertices;
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

function loadSatellites(): Promise<satellite[]> {
  const options: any = {
    responseType: "text"
  };
  return Request(TLE, options).then((response) => {
    const data: string = response.data;
    const lines = data.split("\n");
    const count = (lines.length - (lines.length % 2)) / 2;
    const satellites: satellite[] = [];

    for (let i = 0; i < count; i++) {
      const line1 = lines[i * 2 + 0];
      const line2 = lines[i * 2 + 1];
      if (!line1 || !line2) { continue; }

      const satrec = Satellite.twoline2satrec(line1, line2);;
      if (!satrec) { continue; }

      const norad = Number.parseInt(satrec.satnum, 10);

      satellites.push({
        norad,
        satrec
      });
    }
    return satellites;
  });
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
    const rotate = 3 * diff / 1000; // 3 degree per second rotation

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

function startSpinning(): void {
  if (view.interacting) {
    startSpinTimer();
    return;
  }
  start = {
    animationFrame: requestAnimationFrame(spin)
  };
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

function stopSpinning(): void {
  if (start) {
    cancelAnimationFrame(start.animationFrame);
    start = null;
  }
}

function updateLayers(): void {
  const value = document.querySelectorAll("input[name='theme']:checked").item(0).getAttribute("value");
  const theme = themes.get(value);
  const { filter } = theme;

  sliderLaunch.disabled = value !== "date";

  ["satellite", "orbit"].forEach((id: "satellite" | "orbit") => {
    view.whenLayerView(view.map.findLayerById(id)).then((featureLayerView: FeatureLayerView) => {
      const { visible } = theme[id];
      featureLayerView.set({
        filter,
        visible
      });

      if (id === "satellite") {
        const { labelsVisible, renderer } = theme[id];
        featureLayerView.layer.set({
          labelsVisible,
          renderer
        });

        if (value === "date") {
          featureLayerView.filter = new FeatureFilter({
            timeExtent: new TimeExtent({
              start: new Date(sliderLaunch.values[0], 0, 1),
              end: new Date(sliderLaunch.values[1], 0, 1),
            })
          });
        }

        updateCounter();
      }
    });
  });
}

function updateCounter(): void {
  view.whenLayerView(view.map.findLayerById("satellite")).then((featureLayerView: FeatureLayerView) => {
    const query = new Query({
      timeExtent: featureLayerView.filter?.timeExtent,
      where: featureLayerView.filter?.where
    });
    featureLayerView.layer.queryFeatureCount(query).then((count) => {
      document.getElementById("counter").innerText = `${numberFormatter.format(count)}/${numberFormatter.format(satelliteCount)}`;
    });
  });
}
