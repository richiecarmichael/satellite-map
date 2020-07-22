define(["require", "exports", "tslib", "esri/support/actions/ActionButton", "esri/Camera", "esri/Map", "esri/layers/FeatureLayer", "esri/layers/support/Field", "esri/Graphic", "esri/Ground", "esri/widgets/Home", "esri/symbols/IconSymbol3DLayer", "esri/geometry/Point", "esri/symbols/PointSymbol3D", "esri/geometry/Polyline", "esri/widgets/Popup", "esri/PopupTemplate", "esri/tasks/support/Query", "esri/request", "node_modules/satellite.js/dist/satellite.min.js", "esri/views/SceneView", "esri/symbols/SimpleLineSymbol", "esri/renderers/SimpleRenderer", "esri/widgets/Slider", "esri/geometry/SpatialReference", "esri/TimeExtent"], function (require, exports, tslib_1, ActionButton_1, Camera_1, Map_1, FeatureLayer_1, Field_1, Graphic_1, Ground_1, Home_1, IconSymbol3DLayer_1, Point_1, PointSymbol3D_1, Polyline_1, Popup_1, PopupTemplate_1, Query_1, request_1, satellite_min_js_1, SceneView_1, SimpleLineSymbol_1, SimpleRenderer_1, Slider_1, SpatialReference_1, TimeExtent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ActionButton_1 = tslib_1.__importDefault(ActionButton_1);
    Camera_1 = tslib_1.__importDefault(Camera_1);
    Map_1 = tslib_1.__importDefault(Map_1);
    FeatureLayer_1 = tslib_1.__importDefault(FeatureLayer_1);
    Field_1 = tslib_1.__importDefault(Field_1);
    Graphic_1 = tslib_1.__importDefault(Graphic_1);
    Ground_1 = tslib_1.__importDefault(Ground_1);
    Home_1 = tslib_1.__importDefault(Home_1);
    IconSymbol3DLayer_1 = tslib_1.__importDefault(IconSymbol3DLayer_1);
    Point_1 = tslib_1.__importDefault(Point_1);
    PointSymbol3D_1 = tslib_1.__importDefault(PointSymbol3D_1);
    Polyline_1 = tslib_1.__importDefault(Polyline_1);
    Popup_1 = tslib_1.__importDefault(Popup_1);
    PopupTemplate_1 = tslib_1.__importDefault(PopupTemplate_1);
    Query_1 = tslib_1.__importDefault(Query_1);
    request_1 = tslib_1.__importDefault(request_1);
    satellite_min_js_1 = tslib_1.__importDefault(satellite_min_js_1);
    SceneView_1 = tslib_1.__importDefault(SceneView_1);
    SimpleLineSymbol_1 = tslib_1.__importDefault(SimpleLineSymbol_1);
    SimpleRenderer_1 = tslib_1.__importDefault(SimpleRenderer_1);
    Slider_1 = tslib_1.__importDefault(Slider_1);
    SpatialReference_1 = tslib_1.__importDefault(SpatialReference_1);
    TimeExtent_1 = tslib_1.__importDefault(TimeExtent_1);
    const TLE = 'data/tle.20200714.txt';
    const OIO = 'data/oio.20200714.txt';
    const NOW = new Date();
    let start; // Start time and camera position for spinning.
    let timeout; // Timeout for auto-spinning.
    let satelliteLayerView;
    let highlight;
    let pauseEvents = false;
    let satelliteCount;
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
    view.ui.add(new Home_1.default({ view }), "top-left");
    view.popup.on("trigger-action", (event) => {
        switch (event.action.id) {
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
    const sliderLaunch = new Slider_1.default({
        container: "sliderLaunch",
        min: 1950,
        max: 2025,
        values: [1950, 2025],
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
            switch (type) {
                case "tick":
                    const twoDigitYear = value.toString().substring(2);
                    return `'${twoDigitYear}`;
                case "value":
                    return `${value}`;
            }
        }
    });
    const sliderPeriod = new Slider_1.default({
        container: "sliderPeriod",
        min: 0,
        max: 5,
        values: [0, 5],
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
            switch (type) {
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
    const sliderInclination = new Slider_1.default({
        container: "sliderInclination",
        min: 0,
        max: 160,
        values: [0, 160],
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
            switch (type) {
                case "tick":
                case "value":
                    return `${value}°`;
            }
        }
    });
    const sliderApogee = new Slider_1.default({
        container: "sliderApogee",
        min: 0,
        max: 5,
        values: [0, 5],
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
            switch (type) {
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
    const sliderPerigee = new Slider_1.default({
        container: "sliderPerigee",
        min: 0,
        max: 5,
        values: [0, 5],
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
            switch (type) {
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
    Promise.all([loadSatellites(), loadMetadata()]).then(([source, collection]) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        satelliteCount = source.length;
        clearSatelliteCounter();
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
                new ActionButton_1.default({
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
            spatialReference,
            timeInfo: {
                startField: "launch"
            }
        });
        map.add(satelliteLayer);
        satelliteLayerView = yield view.whenLayerView(satelliteLayer);
    }));
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
    function startSpinTimer() {
        stopSpinning();
        if (timeout != undefined) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            startSpinning();
        }, 3000);
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
    function stopSpinning() {
        if (start) {
            cancelAnimationFrame(start.animationFrame);
            start = null;
        }
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
            const rotate = 1 * diff / 1000; // 1 degree per second rotation
            const { heading, tilt, position: { longitude, latitude, z } } = start.camera;
            const newLongitude = longitude + rotate;
            const remainder = newLongitude > 360 ? newLongitude % 360 : 0;
            const camera = new Camera_1.default({
                heading,
                tilt,
                position: new Point_1.default({
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
    function clearSelection() {
        highlight === null || highlight === void 0 ? void 0 : highlight.remove();
        pauseUIEvents();
        document.getElementById("country-all").checked = true;
        document.getElementById("type-all").checked = true;
        document.getElementById("size-all").checked = true;
        resetSlider(sliderLaunch);
        resetSlider(sliderPeriod);
        resetSlider(sliderInclination);
        resetSlider(sliderApogee);
        resetSlider(sliderPerigee);
        resumeUIEvents();
        clearSatelliteCounter();
    }
    function clearSatelliteCounter() {
        document.getElementById("counter").innerText = `${satelliteCount} Satellites Loaded`;
    }
    function updateSatelliteCounter(count) {
        document.getElementById("counter").innerText = `${count} of ${satelliteCount} Satellites Found`;
    }
    function isSliderMaximized(slider) {
        return slider.values[0] === slider.min && slider.values[1] === slider.max;
    }
    function resetSlider(slider) {
        if (!isSliderMaximized(slider)) {
            slider.values = [
                slider.min,
                slider.max
            ];
        }
    }
    function pauseUIEvents() {
        pauseEvents = true;
    }
    function resumeUIEvents() {
        pauseEvents = false;
    }
    function updateSelection() {
        if (pauseEvents) {
            return;
        }
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
            isSliderMaximized(sliderPerigee)) {
            clearSelection();
            return;
        }
        let where = "";
        if (country !== "ALL") {
            where += `country='${country}'`;
        }
        if (type !== "ALL") {
            if (where !== "") {
                where += " AND ";
            }
            where += type === "JUNK" ? `(name LIKE '%DEB%' OR name LIKE '%R/B%')` : `(name NOT LIKE '%DEB%' AND name NOT LIKE '%R/B%')`;
        }
        if (size !== "ALL") {
            if (where !== "") {
                where += " AND ";
            }
            where += `size='${size}'`;
        }
        let timeExtent = null;
        if (!isSliderMaximized(sliderLaunch)) {
            timeExtent = new TimeExtent_1.default({
                start: new Date(sliderLaunch.values[0], 0, 1),
                end: new Date(sliderLaunch.values[1], 0, 1),
            });
        }
        if (!isSliderMaximized(sliderPeriod)) {
            if (where !== "") {
                where += " AND ";
            }
            const period = new Map([
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
            if (where !== "") {
                where += " AND ";
            }
            const from = sliderInclination.values[0];
            const to = sliderInclination.values[1];
            where += `(inclination BETWEEN ${from} AND ${to})`;
        }
        if (!isSliderMaximized(sliderApogee)) {
            if (where !== "") {
                where += " AND ";
            }
            const apogee = new Map([
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
            if (where !== "") {
                where += " AND ";
            }
            const perigee = new Map([
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
        const query = new Query_1.default({
            timeExtent,
            where
        });
        const { layer } = satelliteLayerView;
        layer.queryFeatures(query).then((featureSet) => {
            highlight === null || highlight === void 0 ? void 0 : highlight.remove();
            highlight = satelliteLayerView.highlight(featureSet.features);
        });
        layer.queryFeatureCount(query).then((count) => {
            updateSatelliteCounter(count);
        });
    }
});
//# sourceMappingURL=main.js.map