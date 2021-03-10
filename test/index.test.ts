import * as virtualBackground from '../src/index';

describe('test', () => {
  it('test', () => {
    document.body.innerHTML = `
      <div>
        <video id='test-video'></video>
        <canvas id='test-canvus'></canvas>
        <image id='test-image'></image>
      </div>
    `;
    const video = document.getElementById('test-video') as HTMLVideoElement;
    const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
    const image = document.getElementById('test-image') as HTMLImageElement;
  });
});
