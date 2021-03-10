
declare type ImageType = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export enum Effect {
  Bokeh,
}

export class VirtualBackground {
  constructor(source: ImageType, background: ImageType | Effect | String) {
    console.log("source", source);
    console.log("background", background);
  }
}
