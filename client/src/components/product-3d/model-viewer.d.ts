declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      'ios-src'?: string;
      poster?: string;
      alt?: string;
      ar?: boolean;
      'ar-modes'?: string;
      'ar-scale'?: string;
      'ar-placement'?: string;
      'camera-controls'?: boolean;
      'touch-action'?: string;
      'shadow-intensity'?: string;
      'shadow-softness'?: string;
      'environment-image'?: string;
      'tone-mapping'?: string;
      reveal?: string;
      loading?: string;
      'disable-tap'?: boolean;
      'camera-orbit'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      };
      }
    }
  }
}

export {};
