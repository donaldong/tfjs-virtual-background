import {VirtualBackground} from '../src/index';

describe('test', () => {
  it('test', () => {
    document.body.innerHTML = `
      <video id='test-video'></video>
    `;
    const video = document.getElementById('test-video') as HTMLVideoElement;
    const vb = new VirtualBackground(video, video);
    console.log(vb);
  });
});
