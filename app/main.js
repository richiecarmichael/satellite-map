define(["require", "exports", "tslib", "esri/support/actions/ActionButton", "esri/Camera", "esri/Map", "esri/widgets/Expand", "esri/views/layers/support/FeatureFilter", "esri/layers/FeatureLayer", "esri/layers/support/Field", "esri/Graphic", "esri/Ground", "esri/widgets/Home", "esri/layers/support/LabelClass", "esri/widgets/Popup", "esri/PopupTemplate", "esri/tasks/support/Query", "esri/request", "node_modules/satellite.js/dist/satellite.min.js", "esri/views/SceneView", "esri/widgets/Slider", "esri/TimeExtent", "esri/symbols", "esri/geometry", "esri/renderers"], function (require, exports, tslib_1, ActionButton_1, Camera_1, Map_1, Expand_1, FeatureFilter_1, FeatureLayer_1, Field_1, Graphic_1, Ground_1, Home_1, LabelClass_1, Popup_1, PopupTemplate_1, Query_1, request_1, satellite_min_js_1, SceneView_1, Slider_1, TimeExtent_1, symbols_1, geometry_1, renderers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ActionButton_1 = tslib_1.__importDefault(ActionButton_1);
    Camera_1 = tslib_1.__importDefault(Camera_1);
    Map_1 = tslib_1.__importDefault(Map_1);
    Expand_1 = tslib_1.__importDefault(Expand_1);
    FeatureFilter_1 = tslib_1.__importDefault(FeatureFilter_1);
    FeatureLayer_1 = tslib_1.__importDefault(FeatureLayer_1);
    Field_1 = tslib_1.__importDefault(Field_1);
    Graphic_1 = tslib_1.__importDefault(Graphic_1);
    Ground_1 = tslib_1.__importDefault(Ground_1);
    Home_1 = tslib_1.__importDefault(Home_1);
    LabelClass_1 = tslib_1.__importDefault(LabelClass_1);
    Popup_1 = tslib_1.__importDefault(Popup_1);
    PopupTemplate_1 = tslib_1.__importDefault(PopupTemplate_1);
    Query_1 = tslib_1.__importDefault(Query_1);
    request_1 = tslib_1.__importDefault(request_1);
    satellite_min_js_1 = tslib_1.__importDefault(satellite_min_js_1);
    SceneView_1 = tslib_1.__importDefault(SceneView_1);
    Slider_1 = tslib_1.__importDefault(Slider_1);
    TimeExtent_1 = tslib_1.__importDefault(TimeExtent_1);
    const GPS = [
        24876,
        25933,
        26360,
        26407,
        27663,
        27704,
        28129,
        28190,
        28474,
        28874,
        29486,
        29601,
        32260,
        32384,
        32711,
        35752,
        36585,
        37753,
        38833,
        39166,
        39533,
        39741,
        40105,
        40294,
        40534,
        40730,
        41019,
        41328,
        40730,
        44506,
        45854 // USA-304 (NAVSTAR 79)
    ];
    const GLONASS = [
        32276,
        32275,
        32393,
        32395,
        36111,
        36400,
        36402,
        36401,
        37139,
        37869,
        37867,
        37868,
        39155,
        39620,
        40001,
        40315,
        41330,
        41554,
        42939,
        43508,
        43687,
        44299,
        44850,
        45358 // Kosmos 2545
    ];
    const INMARSAT = [
        8697,
        8882,
        9478,
        20918,
        21149,
        21814,
        21940,
        23839,
        24307,
        24674,
        24819,
        25153,
        28628,
        28899,
        33278,
        39476,
        40384,
        40882,
        42698,
        44801 // INMARSAT GX5
    ];
    const LANDSAT = [
        6126,
        7615,
        10702,
        13367,
        14780,
        25682,
        39084 // Landsat 8
    ];
    const DIGITALGLOBE = [
        25919,
        33331,
        32060,
        35946,
        40115,
        41848 // WorldView-4
    ];
    const FENGUYIN_DEBRIS = "FENGYUN 1C DEB";
    const ISS = 25544;
    const VANGUARD_1 = 5;
    const LOW_ORBIT = 2000;
    const GEOSYNCHRONOUS_ORBIT = 35786;
    const geosyncMin = GEOSYNCHRONOUS_ORBIT * 0.98;
    const geosyncMax = GEOSYNCHRONOUS_ORBIT * 1.02;
    const NASA_SATELLITE_DATABASE = 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id='; // use International id
    const N2YO_SATELLITE_DATABASE = 'https://www.n2yo.com/satellite/?s='; // use NORAD id
    const satelliteRenderer = new renderers_1.SimpleRenderer({
        label: "Satellites",
        symbol: new symbols_1.PointSymbol3D({
            symbolLayers: [
                new symbols_1.IconSymbol3DLayer({
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
    const countryRenderer = new renderers_1.UniqueValueRenderer({
        field: "country",
        defaultSymbol: new symbols_1.PointSymbol3D({
            symbolLayers: [
                new symbols_1.IconSymbol3DLayer({
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
                symbol: new symbols_1.PointSymbol3D({
                    symbolLayers: [
                        new symbols_1.IconSymbol3DLayer({
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
                symbol: new symbols_1.PointSymbol3D({
                    symbolLayers: [
                        new symbols_1.IconSymbol3DLayer({
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
                symbol: new symbols_1.PointSymbol3D({
                    symbolLayers: [
                        new symbols_1.IconSymbol3DLayer({
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
    const junkRenderer = new renderers_1.UniqueValueRenderer({
        valueExpression: "When(Find('DEB', $feature.name) != -1, 'debris', Find('R/B', $feature.name) != -1, 'rocket-booster', null)",
        defaultSymbol: new symbols_1.PointSymbol3D({
            symbolLayers: [
                new symbols_1.IconSymbol3DLayer({
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
                symbol: new symbols_1.PointSymbol3D({
                    symbolLayers: [
                        new symbols_1.IconSymbol3DLayer({
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
                symbol: new symbols_1.PointSymbol3D({
                    symbolLayers: [
                        new symbols_1.IconSymbol3DLayer({
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
    const themes = new Map();
    themes.set("low", {
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
        filter: new FeatureFilter_1.default({
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
    let start; // Start time and camera position for spinning.
    let timeout; // Timeout for auto-spinning.
    let satelliteCount;
    const view = new SceneView_1.default({
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
        map: new Map_1.default({
            basemap: "satellite",
            ground: new Ground_1.default()
        }),
        popup: new Popup_1.default({
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
        const attributes = view.popup.selectedFeature.attributes;
        const { int, norad } = attributes;
        switch (event.action.id) {
            case "nasa":
                window.open(`${NASA_SATELLITE_DATABASE}${int}`);
                break;
            case "n2yo":
                window.open(`${N2YO_SATELLITE_DATABASE}${norad}`);
                break;
        }
    });
    const expand = new Expand_1.default({
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
                }
                else {
                    element.classList.add("is-hidden");
                }
            });
        }
    });
    view.ui.add(new Home_1.default({ view }), "top-left");
    view.ui.add(expand, "bottom-left");
    view.ui.add("tools", "top-left");
    Promise.all([loadSatellites(), loadMetadata()]).then(([source, collection]) => {
        satelliteCount = source.length;
        const satelliteGraphics = source.map((s, oid) => {
            const { norad, satrec } = s;
            const metadata = collection[norad];
            const coordinate = getSatelliteLocation(satrec, NOW);
            if (!coordinate) {
                return;
            }
            const geometry = new geometry_1.Point(coordinate);
            const attributes = Object.assign({ oid,
                norad }, metadata);
            return new Graphic_1.default({
                attributes,
                geometry
            });
        }).filter((f) => f);
        const orbitGraphics = source.map((s, oid) => {
            const { norad, satrec } = s;
            const metadata = collection[norad];
            if (!metadata) {
                return;
            }
            const { period } = metadata;
            const coordinates = getOrbit(satrec, period, NOW);
            const attributes = Object.assign({ oid,
                norad }, metadata);
            const orbit = new Graphic_1.default({
                attributes,
                geometry: new geometry_1.Polyline({
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
                new ActionButton_1.default({
                    id: "nasa",
                    title: "Nasa",
                    className: "esri-icon-link"
                }),
                new ActionButton_1.default({
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
        const spatialReference = geometry_1.SpatialReference.WebMercator;
        const labelingInfo = [
            new LabelClass_1.default({
                labelExpressionInfo: {
                    expression: "$feature.name"
                },
                labelPlacement: "above-center",
                symbol: new symbols_1.LabelSymbol3D({
                    symbolLayers: [
                        new symbols_1.TextSymbol3DLayer({
                            material: {
                                color: [255, 255, 255, 1]
                            },
                            size: 10
                        })
                    ]
                })
            })
        ];
        const orbitRenderer = new renderers_1.SimpleRenderer({
            label: "Satellite Orbit",
            symbol: new symbols_1.LineSymbol3D({
                symbolLayers: [
                    new symbols_1.LineSymbol3DLayer({
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
            new FeatureLayer_1.default({
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
            new FeatureLayer_1.default({
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
    const sliderLaunch = new Slider_1.default({
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
        values: [1950, 2025],
        visibleElements: {
            labels: true,
            rangeLabels: false
        },
        labelFormatFunction: (value, type) => {
            switch (type) {
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
    function getOrbit(satrec, period, start) {
        const SEGMENTS = 100;
        const milliseconds = period * 60000 / SEGMENTS;
        const vertices = [];
        for (let i = 0; i <= SEGMENTS; i++) {
            const date = new Date(start.getTime() + i * milliseconds);
            const satelliteLocation = getSatelliteLocation(satrec, date);
            if (!satelliteLocation) {
                continue;
            }
            vertices.push(satelliteLocation);
        }
        return vertices;
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
                const norad = Number.parseInt(satrec.satnum, 10);
                satellites.push({
                    norad,
                    satrec
                });
            }
            return satellites;
        });
    }
    function spin(timestamp) {
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
            const camera = new Camera_1.default({
                heading,
                tilt,
                position: new geometry_1.Point({
                    longitude: newLongitude - remainder,
                    latitude,
                    z
                })
            });
            view.set({
                camera
            });
        }
        requestAnimationFrame(spin);
    }
    function startSpinning() {
        if (view.interacting) {
            startSpinTimer();
            return;
        }
        start = {
            animationFrame: requestAnimationFrame(spin)
        };
    }
    function startSpinTimer() {
        stopSpinning();
        if (timeout != undefined) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            startSpinning();
        }, 3000);
    }
    function stopSpinning() {
        if (start) {
            cancelAnimationFrame(start.animationFrame);
            start = null;
        }
    }
    function updateLayers() {
        const value = document.querySelectorAll("input[name='theme']:checked").item(0).getAttribute("value");
        const theme = themes.get(value);
        const { filter } = theme;
        sliderLaunch.disabled = value !== "date";
        ["satellite", "orbit"].forEach((id) => {
            view.whenLayerView(view.map.findLayerById(id)).then((featureLayerView) => {
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
                        featureLayerView.filter = new FeatureFilter_1.default({
                            timeExtent: new TimeExtent_1.default({
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
    function updateCounter() {
        view.whenLayerView(view.map.findLayerById("satellite")).then((featureLayerView) => {
            var _a, _b;
            const query = new Query_1.default({
                timeExtent: (_a = featureLayerView.filter) === null || _a === void 0 ? void 0 : _a.timeExtent,
                where: (_b = featureLayerView.filter) === null || _b === void 0 ? void 0 : _b.where
            });
            featureLayerView.layer.queryFeatureCount(query).then((count) => {
                document.getElementById("counter").innerText = `${numberFormatter.format(count)}/${numberFormatter.format(satelliteCount)}`;
            });
        });
    }
});
//# sourceMappingURL=main.js.map