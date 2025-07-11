import React, { useState, useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerDocPageProps {
  className?: string;
}

const SwaggerDocPage: React.FC<SwaggerDocPageProps> = ({ className }) => {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/swagger.json`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch API documentation: ${response.status}`);
        }
        
        const swaggerSpec = await response.json();
        setSpec(swaggerSpec);
      } catch (err) {
        console.error('Error fetching Swagger spec:', err);
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      } finally {
        setLoading(false);
      }
    };

    fetchSwaggerSpec();
  }, []);

  if (loading) {
    return (
      <div className={`flex justify-center items-center min-h-96 ${className || ''}`}>
        <div className="text-lg">Loading API Documentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col justify-center items-center min-h-96 ${className || ''}`}>
        <div className="text-red-500 text-lg mb-4">Error loading API documentation</div>
        <div className="text-gray-600">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className={`flex justify-center items-center min-h-96 ${className || ''}`}>
        <div className="text-gray-500">No API documentation available</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <SwaggerUI spec={spec} />
    </div>
  );
};

export default SwaggerDocPage;