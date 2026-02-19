declare module 'omggif' {
  export class GifReader {
    constructor(data: number[] | Uint8Array);
    width: number;
    height: number;
    numFrames(): number;
    frameInfo(frameIndex: number): {
      x: number;
      y: number;
      width: number;
      height: number;
      delay: number;
      disposal: number;
      has_local_palette: boolean;
      palette_offset: number | null;
      data_offset: number;
      data_length: number;
      transparent_index: number | null;
      interlaced: boolean;
    };
    decodeAndBlitFrameRGBA(frameIndex: number, pixels: Uint8ClampedArray): void;
  }
}
