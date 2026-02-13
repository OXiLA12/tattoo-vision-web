export interface ImageData {
    url: string;
    width: number;
    height: number;
    colorSpace?: string;
    data?: Uint8ClampedArray;
}

export interface TattooTransform {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
}
