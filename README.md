# Satellite Map
This app shows the current **location** of more than 19,300 Earth orbiting satellites.

![](img/satellite.gif)

## Data
Satellite descriptions and [ephemeris](https://en.wikipedia.org/wiki/Ephemeris) are sourced from [Space-Tracker](https://www.space-track.org) a site maintained by the [Combined Force Space Component Command](https://www.vandenberg.af.mil/About-Us/Fact-Sheets/Display/Article/2020370/combined-force-space-component-command/). The [satellite-js](https://github.com/shashwatak/satellite-js) library is used to convert the downloaded [TLE](https://en.wikipedia.org/wiki/Two-line_element_set) file into geographic locations.

## Software
This app uses the following libraries.
* [ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/) by [Esri](https://www.esri.com/)<br/>
_Esri’s JavaScript library for mapping and analysis._
* [Calcite Web](https://esri.github.io/calcite-web/) by [Esri](https://www.esri.com/)<br/>
_A Responsive HTML, CSS, and JS Framework for Esri_
* [satellite-js](https://github.com/shashwatak/satellite-js) by [Shashwat Kandadai](https://github.com/shashwatak) and UCSC
_Modular set of functions for SGP4 and SDP4 propagation of TLEs._
