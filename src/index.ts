import * as model from './model';
import {ImageType} from './types';
import {getInputSize, drawToFill} from './util';

interface VirtualBackgroundParams {
  inputImage: ImageType,
  inputBackground: HTMLImageElement,
  outputCanvas: HTMLCanvasElement,
  segmentationThreshold?: number,
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
  context.drawImage(params.inputBackground, 0, 0);
  const imageData = context.getImageData(0, 0, width, height).data;
  const mask = await model.personMask(params.inputImage, params.segmentationThreshold);
  for (var i = 3, len = imageData.length; i < len; i = i + 4) {
    imageData[i] = mask[i];
  }
  context.putImageData(new ImageData(imageData, width, height), 0, 0);

  // Paint the background image
  context.globalCompositeOperation = "destination-atop";
  drawToFill(context, params.inputBackground);

  // Restore to the initial context state
  context.restore();
}
