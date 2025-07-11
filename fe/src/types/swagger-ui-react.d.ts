declare module 'swagger-ui-react' {
  import React from 'react';

  interface SwaggerUIProps {
    spec?: any;
    url?: string;
    onComplete?: (system: any) => void;
    onFailure?: (error: any) => void;
    filter?: boolean | string | ((taggedOps: any, phrase: string) => any);
    layout?: string;
    plugins?: any[];
    presets?: any[];
    supportedSubmitMethods?: string[];
    queryConfigEnabled?: boolean;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelExpandDepth?: number;
    defaultModelsExpandDepth?: number;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    deepLinking?: boolean;
    showMutatedRequest?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    requestInterceptor?: (request: any) => any;
    responseInterceptor?: (response: any) => any;
  }

  const SwaggerUI: React.FC<SwaggerUIProps>;
  export default SwaggerUI;
}