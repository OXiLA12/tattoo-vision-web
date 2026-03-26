declare namespace JSX {
  interface IntrinsicElements {
    'ion-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      name?: string;
      src?: string;
      size?: 'small' | 'large';
      'aria-label'?: string;
      'aria-hidden'?: string;
    };
  }
}
