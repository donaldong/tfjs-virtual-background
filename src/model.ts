import * as tf from '@tensorflow/tfjs';
import {ImageType} from './common';

// The pre-trained Mobilenets checkpoints were published with the 128x128 //
// input resolution
const MODEL_RESOLUTION: [number, number] = [128, 128];
let MODEL: any = null;

export async function init(modelUrl: string) {
  if (MODEL === null) {
    // Initialize the model globally
    MODEL = await tf.loadGraphModel(modelUrl);
  }

  return MODEL;
}

export async function drawMask(inputPixels: ImageType, canvas: HTMLCanvasElement) {
  if (MODEL === null) {
    throw new Error('error: Model has not been initialized');
  }

  tf.tidy(() => {
    let input_tensor = tf.browser.fromPixels(inputPixels);

    let tensor = tf.image.resizeBilinear(input_tensor, MODEL_RESOLUTION);

    // Rank 2 -> 3: [batch, height, width]
    tensor = tensor.expandDims(0);

    // The input images are expected to have color values in the range [0,1]
    tensor = tf.cast(tensor, 'float32');
    tensor = tensor.div(255);

    let prediction = MODEL.predict(tensor) as tf.Tensor;
    prediction = prediction.softmax();
    prediction = prediction.squeeze();
    let [, mask] = tf.split(prediction, 2, 2);

    mask = tf.image.resizeBilinear(mask, MODEL_RESOLUTION);
    tensor = mask.mul(input_tensor);
    tensor = tf.cast(tensor, 'int32');
    tf.browser.toPixels(tensor, canvas);
  });
}
