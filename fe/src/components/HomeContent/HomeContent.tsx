import { useState } from 'react'
import { Button } from '../Button'
import { Link } from 'react-router-dom';
import { InitService } from '../../services/InitService';



export const HomeContent = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');

    const handleInitialization = async () => {
        setLoading(true);
        setMessage('');

        try {
            const { rbac, rtk } = await InitService.initAllDemo();

            if (rbac.ok && rtk.ok) {
                setMessage('✅ All demo data initialized successfully!');
            } else {
                setMessage('⚠️ Some initialization failed. Check console for details.');
            }
        } catch (error) {
            console.error('Initialization error:', error);
            setMessage(`❌ Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="p-6 space-y-4">
            <div className="space-y-2">
                <Button
                    onClick={handleInitialization}
                    disabled={loading}
                >
                    {loading ? 'Initializing...' : 'Initialize Demo Data (RBAC + RTK)'}
                </Button>

                {message && (
                    <div className={`text-sm p-2 rounded ${message.includes('✅') ? 'text-green-700 bg-green-100' :
                        message.includes('⚠️') ? 'text-yellow-700 bg-yellow-100' :
                            'text-red-700 bg-red-100'
                        }`}>
                        {message}
                    </div>
                )}
            </div>

            <div>
                <Link
                    to="/api-docs"
                    className="text-blue-600 hover:text-blue-800 underline"
                >
                    📚 View API Documentation
                </Link>
            </div>
        </div>
    );
}