import * as virtualBackground from '../src/index';

describe('test', () => {
  it('test', () => {
    document.body.innerHTML = `
      <video id='test-video'></video>
    `;
    const video = document.getElementById('test-video') as HTMLVideoElement;
    console.log(video);
  });
});
