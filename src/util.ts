import {ImageType} from './common';

function getSizeFromImageLikeElement(input: HTMLImageElement | HTMLCanvasElement): [number, number] {
  if (input.offsetHeight !== 0 && input.offsetWidth !== 0) {
    return [input.offsetHeight, input.offsetWidth];
  } else if (input.height != null && input.width != null) {
    return [input.height, input.width];
  } else {
    throw new Error(
      `HTMLImageElement must have height and width attributes set.`);
  }
}

function getSizeFromVideoElement(input: HTMLVideoElement): [number, number] {
  if (input.hasAttribute('height') && input.hasAttribute('width')) {
    // Prioritizes user specified height and width.
    // We can't test the .height and .width properties directly,
    // because they evaluate to 0 if unset.
    return [input.height, input.width];
  } else {
    return [input.videoHeight, input.videoWidth];
  }
}

export function getInputSize(input: ImageType): [number, number] {
  if ((typeof (HTMLCanvasElement) !== 'undefined' &&
       input instanceof HTMLCanvasElement) ||
      (typeof (HTMLImageElement) !== 'undefined' &&
       input instanceof HTMLImageElement)) {
    return getSizeFromImageLikeElement(input);
  } else if (typeof (ImageData) !== 'undefined' && input instanceof ImageData) {
    return [input.height, input.width];
  } else if (
      typeof (HTMLVideoElement) !== 'undefined' &&
      input instanceof HTMLVideoElement) {
    return getSizeFromVideoElement(input);
  } else {
    throw new Error(`error: Unknown input type: ${input}.`);
  }
}

export function drawToFill(
  canvasContext: CanvasRenderingContext2D,
  src: HTMLImageElement,
) {
  const canvas = canvasContext.canvas;
  const srcWidth = src.width;
  const srcHeight = src.height;
  const scale = Math.max(canvas.width / srcWidth, canvas.height / srcHeight);

  canvasContext.drawImage(src, 0, 0, srcWidth * scale, srcHeight * scale);
}
