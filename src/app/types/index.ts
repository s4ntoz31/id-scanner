export type Step = 
  | 'landing'
  | 'front-work'
  | 'back-work'
  | 'signature-work'
  | 'preview';

export interface Point {
  x: number;
  y: number;
}

export type CornerId = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

export interface CropData {
  corners: [Point, Point, Point, Point];
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
}

export const STEP_ORDER: Step[] = [
  'landing',
  'front-work',
  'back-work',
  'signature-work',
  'preview',
];

export const STEP_LABELS: Record<Step, { title: string; subtitle: string }> = {
  'landing': { 
    title: '', 
    subtitle: '' 
  },
  'front-work': { 
    title: 'Front Side', 
    subtitle: 'Upload, crop, and rotate the front of your ID' 
  },
  'back-work': { 
    title: 'Back Side', 
    subtitle: 'Upload, crop, and rotate the back of your ID' 
  },
  'signature-work': {
    title: 'Add Signature',
    subtitle: 'Upload, crop, rotate, and remove background'
  },
  'preview': { 
    title: 'A4 Preview', 
    subtitle: 'Review and download your printable document' 
  },
};