
import ActionToggle from "esri/support/actions/ActionToggle";
import FeatureLayer from "esri/layers/FeatureLayer";
import Field from "esri/layers/support/Field"
import Graphic from "esri/Graphic";
import Ground from "esri/Ground";
import Home from "esri/widgets/Home";
import IconSymbol3DLayer from "esri/symbols/IconSymbol3DLayer";
import Map from "esri/Map";
import Point from "esri/geometry/Point";
import PointSymbol3D from "esri/symbols/PointSymbol3D"
import Polyline from "esri/geometry/Polyline";
import Popup from "esri/widgets/Popup";
import PopupTemplate from "esri/PopupTemplate";
import Request from "esri/request";
import Satellite from "node_modules/satellite.js/dist/satellite.min.js";
import SceneView from "esri/views/SceneView";
import SimpleRenderer from "esri/renderers/SimpleRenderer";
import SpatialReference from "esri/geometry/SpatialReference";
import SimpleLineSymbol from "esri/symbols/SimpleLineSymbol";

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

const TLE = 'data/tle.20200714.txt';
const OIO = 'data/oio.20200714.txt';
const NOW = new Date();

const ephemeris: indexedSatelliteEphemeris = {};

const map = new Map({
  basemap: "satellite",
  ground: new Ground()
});

const popup = new Popup({
  collapseEnabled: true,
  dockEnabled: false,
  dockOptions: {
    buttonEnabled: true
  }
})

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
  popup,
  qualityProfile: "high"
});

view.ui.add(new Home({ view }), "top-left");
view.ui.add("menu", "top-right");
document.getElementById("menu").classList.remove("is-hidden");

view.popup.on("trigger-action", (event) => {
  switch(event.action.id) {
    case "orbit":
      hideOrbit();
      if ((<ActionToggle>event.action).value){
        showOrbit(view.popup.selectedFeature);
      }
      break;
  }
});

view.popup.watch("visible", (visible) => {
  if (!visible) {
    hideOrbit();
  }
});

function hideOrbit(){
  view.graphics.removeAll();
}

function showOrbit(satellite: Graphic) {
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

Promise.all([loadSatellites(), loadMetadata()]).then(([source, collection]) => {
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
      new ActionToggle({
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
    spatialReference
  });

  map.add(satelliteLayer);
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
