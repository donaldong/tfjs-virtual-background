import * as tf from '@tensorflow/tfjs';
import {ImageType} from './types';
import {getInputSize, padAndResizeTo, scaleAndCropToInputTensorShape, toMaskTensor} from './util';

// The pre-trained Mobilenets checkpoints were published with the 128x128 //
// input resolution
const MODEL_RESOLUTION: [number, number] = [128, 128];
const APPLY_SIGMOID_ACTIVATION = true;
let MODEL: any = null;

function preprocessInput(input: tf.Tensor3D): tf.Tensor3D {
  // Normalize the pixels [0, 255] to be between [-1, 1].
  return tf.tidy(() => tf.sub(tf.div(input, 127.5), 1.0));
}

function predict(input: tf.Tensor3D) {
  return tf.tidy(() => {
    const asFloat = preprocessInput(tf.cast(input, 'float32'));
    const asBatch = tf.expandDims(asFloat, 0);
    const result = MODEL.predict(asBatch) as tf.Tensor4D;
    const [mask,] = tf.split(result.squeeze(), 2, 2)
    return mask as tf.Tensor3D;
  });
}

export async function init(modelUrl: string) {
  if (MODEL === null) {
    // Initialize the model globally
    MODEL = await tf.loadGraphModel(modelUrl);
  }

  return MODEL;
}

export function segmentPersonActivation(input: ImageType, segmentationThreshold = 0.5) : tf.Tensor2D {
  const [height, width] = getInputSize(input);
  const {resized, padding} = padAndResizeTo(input, MODEL_RESOLUTION);
  const segmentation = tf.tidy(() => {
    const segmentLogits = predict(resized);
    const [resizedHeight, resizedWidth] = resized.shape;

    const scaledSegmentScores = scaleAndCropToInputTensorShape(
        segmentLogits, [height, width], [resizedHeight, resizedWidth],
        [[padding.top, padding.bottom], [padding.left, padding.right]],
        APPLY_SIGMOID_ACTIVATION);

    return toMaskTensor(tf.squeeze(scaledSegmentScores), segmentationThreshold);
  });
  resized.dispose();
  return segmentation;
}

// The flattened Uint8Array of segmentation data. 0 means the pixel belongs to a
// person and 1 means the pixel doesn't belong to a person. The size of the
// array is equal to `height` x `width` in row-major order.
export async function personMask(input: ImageType, segmentationThreshold = 0.5) {
  if (MODEL === null) {
    throw new Error('error: Model has not been initialized');
  }

  const segmentation = segmentPersonActivation(input, segmentationThreshold);
  const mask = await segmentation.data() as Uint8Array;
  segmentation.dispose();

  return mask;
}
