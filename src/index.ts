import * as model from './model';
import {ImageType} from './types';
import {getInputSize, drawToFill} from './util';

interface VirtualBackgroundParams {
  inputImage: ImageType,
  inputBackground: HTMLImageElement,
  inputPersonMask: Uint8Array,
  outputCanvas: HTMLCanvasElement,
}

export async function init(modelUrl: string) {
  model.init(modelUrl);
}

export async function segmentPerson(input: ImageType, segmentationThreshold = 0.5) {
  return await model.personMask(input, segmentationThreshold);
}

export function draw(params: VirtualBackgroundParams) {
  const canvas = params.outputCanvas;
  const mask = params.inputPersonMask;
  const [height, width] = getInputSize(params.inputImage);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  context.save();

  // Paint the person
  const imageData = context.getImageData(0, 0, width, height);
  for (let i = 0, len = mask.length; i < len; i++) {
    imageData.data[i * 4 + 3] = mask[i] === 1 ? 255 : 0;
  }
  context.putImageData(imageData, 0, 0);

  context.globalCompositeOperation = "xor";
  context.drawImage(params.inputImage, 0, 0);

  // Paint the background image
  context.globalCompositeOperation = "destination-atop";
  drawToFill(context, params.inputBackground);

  // Restore to the initial context state
  context.restore();
}
