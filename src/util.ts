import * as tf from '@tensorflow/tfjs';
import {ImageType, Padding} from './types';

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

export function toInputTensor(input: ImageType | tf.Tensor) {
  return input instanceof tf.Tensor ? input : tf.browser.fromPixels(input);
}

export function padAndResizeTo(input: ImageType, [targetH, targetW]: [number, number]): {resized: tf.Tensor3D, padding: Padding} {
  const [height, width] = getInputSize(input);
  const targetAspect = targetW / targetH;
  const aspect = width / height;
  let [padT, padB, padL, padR] = [0, 0, 0, 0];
  if (aspect < targetAspect) {
    // pads the width
    padT = 0;
    padB = 0;
    padL = Math.round(0.5 * (targetAspect * height - width));
    padR = Math.round(0.5 * (targetAspect * height - width));
  } else {
    // pads the height
    padT = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
    padB = Math.round(0.5 * ((1.0 / targetAspect) * width - height));
    padL = 0;
    padR = 0;
  }

  const resized: tf.Tensor3D = tf.tidy(() => {
    let imageTensor = toInputTensor(input) as any;
    imageTensor = tf.pad3d(imageTensor, [[padT, padB], [padL, padR], [0, 0]]);

    return tf.image.resizeBilinear(imageTensor, [targetH, targetW]);
  });

  return {resized, padding: {top: padT, left: padL, right: padR, bottom: padB}};
}

export function removePaddingAndResizeBack(
  resizedAndPadded: tf.Tensor3D,
  [originalHeight, originalWidth]: [number, number],
  [[padT, padB], [padL, padR]]: [[number, number], [number, number]]):
  tf.Tensor3D {
return tf.tidy(() => {
  const batchedImage: tf.Tensor4D = tf.expandDims(resizedAndPadded);
  return tf.squeeze(tf.image
      .cropAndResize(
          batchedImage, [[
            padT / (originalHeight + padT + padB - 1.0),
            padL / (originalWidth + padL + padR - 1.0),
            (padT + originalHeight - 1.0) /
                (originalHeight + padT + padB - 1.0),
            (padL + originalWidth - 1.0) / (originalWidth + padL + padR - 1.0)
          ]],
          [0], [originalHeight, originalWidth]), [0]);
});
}

export function scaleAndCropToInputTensorShape(
  tensor: tf.Tensor3D,
  [inputTensorHeight, inputTensorWidth]: [number, number],
  [resizedAndPaddedHeight, resizedAndPaddedWidth]: [number, number],
  [[padT, padB], [padL, padR]]: [[number, number], [number, number]],
  applySigmoidActivation = false): tf.Tensor3D {
return tf.tidy(() => {
  let inResizedAndPadded: tf.Tensor3D = tf.image.resizeBilinear(tensor,
      [resizedAndPaddedHeight, resizedAndPaddedWidth], true);

  if (applySigmoidActivation) {
    inResizedAndPadded = tf.sigmoid(inResizedAndPadded);
  }

  return removePaddingAndResizeBack(
      inResizedAndPadded, [inputTensorHeight, inputTensorWidth],
      [[padT, padB], [padL, padR]]);
});
}

export function toMaskTensor(
  segmentScores: tf.Tensor2D, threshold: number): tf.Tensor2D {
return tf.tidy(
    () =>
        (tf.cast(tf.greater(
            segmentScores, tf.scalar(threshold)), 'int32') as tf.Tensor2D));
}
