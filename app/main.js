define(["require", "exports", "tslib", "esri/support/actions/ActionToggle", "esri/layers/FeatureLayer", "esri/layers/support/Field", "esri/Graphic", "esri/Ground", "esri/widgets/Home", "esri/symbols/IconSymbol3DLayer", "esri/Map", "esri/geometry/Point", "esri/symbols/PointSymbol3D", "esri/geometry/Polyline", "esri/widgets/Popup", "esri/PopupTemplate", "esri/request", "node_modules/satellite.js/dist/satellite.min.js", "esri/views/SceneView", "esri/renderers/SimpleRenderer", "esri/geometry/SpatialReference", "esri/symbols/SimpleLineSymbol"], function (require, exports, tslib_1, ActionToggle_1, FeatureLayer_1, Field_1, Graphic_1, Ground_1, Home_1, IconSymbol3DLayer_1, Map_1, Point_1, PointSymbol3D_1, Polyline_1, Popup_1, PopupTemplate_1, request_1, satellite_min_js_1, SceneView_1, SimpleRenderer_1, SpatialReference_1, SimpleLineSymbol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ActionToggle_1 = tslib_1.__importDefault(ActionToggle_1);
    FeatureLayer_1 = tslib_1.__importDefault(FeatureLayer_1);
    Field_1 = tslib_1.__importDefault(Field_1);
    Graphic_1 = tslib_1.__importDefault(Graphic_1);
    Ground_1 = tslib_1.__importDefault(Ground_1);
    Home_1 = tslib_1.__importDefault(Home_1);
    IconSymbol3DLayer_1 = tslib_1.__importDefault(IconSymbol3DLayer_1);
    Map_1 = tslib_1.__importDefault(Map_1);
    Point_1 = tslib_1.__importDefault(Point_1);
    PointSymbol3D_1 = tslib_1.__importDefault(PointSymbol3D_1);
    Polyline_1 = tslib_1.__importDefault(Polyline_1);
    Popup_1 = tslib_1.__importDefault(Popup_1);
    PopupTemplate_1 = tslib_1.__importDefault(PopupTemplate_1);
    request_1 = tslib_1.__importDefault(request_1);
    satellite_min_js_1 = tslib_1.__importDefault(satellite_min_js_1);
    SceneView_1 = tslib_1.__importDefault(SceneView_1);
    SimpleRenderer_1 = tslib_1.__importDefault(SimpleRenderer_1);
    SpatialReference_1 = tslib_1.__importDefault(SpatialReference_1);
    SimpleLineSymbol_1 = tslib_1.__importDefault(SimpleLineSymbol_1);
    const TLE = 'data/tle.20200714.txt';
    const OIO = 'data/oio.20200714.txt';
    const NOW = new Date();
    const ephemeris = {};
    const map = new Map_1.default({
        basemap: "satellite",
        ground: new Ground_1.default()
    });
    const popup = new Popup_1.default({
        collapseEnabled: true,
        dockEnabled: false,
        dockOptions: {
            buttonEnabled: true
        }
    });
    const view = new SceneView_1.default({
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
    view.ui.add(new Home_1.default({ view }), "top-left");
    view.ui.add("menu", "top-right");
    document.getElementById("menu").classList.remove("is-hidden");
    view.popup.on("trigger-action", (event) => {
        switch (event.action.id) {
            case "orbit":
                hideOrbit();
                if (event.action.value) {
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
    function hideOrbit() {
        view.graphics.removeAll();
    }
    function showOrbit(satellite) {
        const attributes = satellite.attributes;
        const { oid, period } = attributes;
        const satrec = ephemeris[oid];
        const SEGMENTS = 100;
        const milliseconds = period * 60000 / SEGMENTS;
        const vertices = [];
        for (let i = 0; i <= SEGMENTS; i++) {
            const date = new Date(NOW.getTime() + i * milliseconds);
            const satelliteLocation = getSatelliteLocation(satrec, date);
            if (!satelliteLocation) {
                continue;
            }
            vertices.push(satelliteLocation);
        }
        const orbit = new Graphic_1.default({
            geometry: new Polyline_1.default({
                paths: [
                    vertices.map((coordinate) => [coordinate.x, coordinate.y, coordinate.z])
                ]
            }),
            symbol: new SimpleLineSymbol_1.default({
                color: "white",
                width: 1
            })
        });
        view.graphics.add(orbit);
    }
    Promise.all([loadSatellites(), loadMetadata()]).then(([source, collection]) => {
        source.forEach((graphic) => {
            const attributes = graphic.attributes;
            const { norad } = attributes;
            const metadata = collection[norad];
            graphic.attributes = Object.assign(Object.assign({}, attributes), metadata);
        });
        const fields = [
            new Field_1.default({
                name: "oid",
                type: "oid"
            }),
            new Field_1.default({
                name: "norad",
                type: "integer"
            }),
            new Field_1.default({
                name: "apogee",
                type: "integer"
            }),
            new Field_1.default({
                name: "country",
                type: "string"
            }),
            new Field_1.default({
                name: "inclination",
                type: "single"
            }),
            new Field_1.default({
                name: "int",
                type: "string"
            }),
            new Field_1.default({
                name: "name",
                type: "string"
            }),
            new Field_1.default({
                name: "launch",
                type: "date"
            }),
            new Field_1.default({
                name: "perigee",
                type: "integer"
            }),
            new Field_1.default({
                name: "period",
                type: "single"
            }),
            new Field_1.default({
                name: "size",
                type: "string"
            })
        ];
        const popupTemplate = new PopupTemplate_1.default({
            actions: [
                new ActionToggle_1.default({
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
        const renderer = new SimpleRenderer_1.default({
            label: "Satellites",
            symbol: new PointSymbol3D_1.default({
                symbolLayers: [
                    new IconSymbol3DLayer_1.default({
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
        const spatialReference = SpatialReference_1.default.WebMercator;
        const satelliteLayer = new FeatureLayer_1.default({
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
    function loadSatellites() {
        const options = {
            responseType: "text"
        };
        return request_1.default(TLE, options).then((response) => {
            const data = response.data;
            const lines = data.split("\n");
            const count = (lines.length - (lines.length % 2)) / 2;
            const satellites = [];
            for (let i = 0; i < count; i++) {
                const line1 = lines[i * 2 + 0];
                const line2 = lines[i * 2 + 1];
                if (!line1 || !line2) {
                    continue;
                }
                const satrec = satellite_min_js_1.default.twoline2satrec(line1, line2);
                ;
                if (!satrec) {
                    continue;
                }
                const satelliteLocation = getSatelliteLocation(satrec, NOW);
                if (!satelliteLocation) {
                    continue;
                }
                const oid = i + 1;
                const norad = Number.parseInt(satrec.satnum, 10);
                const graphic = new Graphic_1.default({
                    attributes: {
                        oid,
                        norad
                    },
                    geometry: new Point_1.default(satelliteLocation)
                });
                ephemeris[oid] = satrec;
                satellites.push(graphic);
            }
            return satellites;
        });
    }
    function getSatelliteLocation(satrec, date) {
        const propagation = satellite_min_js_1.default.propagate(satrec, date);
        const position = propagation === null || propagation === void 0 ? void 0 : propagation.position;
        if (!position || Number.isNaN(position.x) || Number.isNaN(position.y) || Number.isNaN(position.z)) {
            return null;
        }
        const gmst = satellite_min_js_1.default.gstime(NOW);
        const geographic = satellite_min_js_1.default.eciToGeodetic(position, gmst);
        const { longitude, latitude, height } = geographic;
        const x = satellite_min_js_1.default.radiansToDegrees(longitude);
        const y = satellite_min_js_1.default.radiansToDegrees(latitude);
        const z = height * 1000;
        return { x, y, z };
    }
    function loadMetadata() {
        const options = {
            responseType: "text"
        };
        return request_1.default(OIO, options).then((response) => {
            const collection = {};
            const data = response.data;
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
});
//# sourceMappingURL=main.js.map