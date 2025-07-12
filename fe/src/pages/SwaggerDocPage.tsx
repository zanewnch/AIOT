import React from 'react';

interface SwaggerDocPageProps {
  className?: string;
}

const SwaggerDocPage: React.FC<SwaggerDocPageProps> = ({ className }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';
  
  return (
    <div className={`min-h-screen ${className || ''}`}>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 mb-4">
            View the interactive API documentation by visiting the Swagger UI directly.
          </p>
          <div className="space-y-4">
            <div>
              <a 
                href={`${apiBaseUrl}/api-docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Open API Documentation
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <div className="text-sm text-gray-500">
              <p>Direct links:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>
                  <a href={`${apiBaseUrl}/api-docs`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Interactive API Explorer
                  </a>
                </li>
                <li>
                  <a href={`${apiBaseUrl}/api/swagger.json`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    OpenAPI JSON Specification
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwaggerDocPage;