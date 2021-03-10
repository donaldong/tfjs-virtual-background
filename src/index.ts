import * as model from './model';
import {ImageType} from './common';
import {getInputSize, drawToFill} from './util';

interface VirtualBackgroundParams {
  inputImage: ImageType,
  inputBackground: HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
}

export async function init(modelUrl: string) {
  model.init(modelUrl);
}

export async function draw(params: VirtualBackgroundParams) {
  const canvas = params.outputCanvas;
  const [height, width] = getInputSize(params.inputImage);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.save();

  // Paint the person
  model.drawMask(params.inputImage, canvas);
  context.globalCompositeOperation = "xor";
  context.drawImage(params.inputBackground, 0, 0);

  // Paint the background image
  context.globalCompositeOperation = "destination-atop";
  drawToFill(context, params.inputBackground);

  // Restore to the initial context state
  context.restore();
}
