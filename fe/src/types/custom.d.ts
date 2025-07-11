declare module '*.svg';
declare module '*.css';
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}
declare module '*.module.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'react/jsx-runtime';
declare module 'react/jsx-dev-runtime';

declare module 'react-dom/client';

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
