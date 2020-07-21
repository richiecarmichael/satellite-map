declare module "node_modules/satellite.js/dist/satellite.min.js" {
  export function eciToGeodetic(eci: eci, gmst: gmst): geographic;
  export function gstime(date: Date): gmst;
  export function propagate(satrec: satrec, date: Date): propagation;
  export function radiansToDegrees(radians: number): number;
  export function twoline2satrec(line1: string, line2: string): satrec;
}

interface gmst {

}

interface satrec {
  satnum: string;
}

interface geographic {
  latitude: number;
  longitude: number;
  height: number;
}

interface propagation {
  position: eci;
  vector: eci;
}

interface eci {
  x: number;
  y: number;
  z: number;
}

