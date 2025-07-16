import { useState } from 'react'
import { Button } from '../Button'
import { Link } from 'react-router-dom';
import { InitService } from '../../services/InitService';
import { useProgressTracking } from '../../hooks/useProgressTracking';
import { ProgressTracker } from '../ProgressTracker/ProgressTracker';

export const HomeContent = () => {
    const [loadingStates, setLoadingStates] = useState({
        rbac: false,
        rtk: false,
        admin: false,
        stress: false
    });
    const [messages, setMessages] = useState<{ [key: string]: string }>({});
    const { progress, isTracking, error, startTracking, stopTracking } = useProgressTracking();

    const updateLoadingState = (key: string, loading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [key]: loading }));
    };

    const updateMessage = (key: string, message: string) => {
        setMessages(prev => ({ ...prev, [key]: message }));
    };

    const handleRbacDemo = async () => {
        updateLoadingState('rbac', true);
        updateMessage('rbac', '');

        try {
            const result = await InitService.initRbacDemo();
            if (result.ok) {
                updateMessage('rbac', '✅ RBAC demo data initialized successfully!');
            } else {
                updateMessage('rbac', '⚠️ RBAC initialization failed. Check console for details.');
            }
        } catch (error) {
            console.error('RBAC initialization error:', error);
            updateMessage('rbac', `❌ RBAC initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            updateLoadingState('rbac', false);
        }
    };

    const handleRtkDemo = async () => {
        updateLoadingState('rtk', true);
        updateMessage('rtk', '');

        try {
            const result = await InitService.initRtkDemo();
            if (result.ok) {
                updateMessage('rtk', '✅ RTK demo data initialized successfully!');
            } else {
                updateMessage('rtk', '⚠️ RTK initialization failed. Check console for details.');
            }
        } catch (error) {
            console.error('RTK initialization error:', error);
            updateMessage('rtk', `❌ RTK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            updateLoadingState('rtk', false);
        }
    };

    const handleCreateAdminUser = async () => {
        updateLoadingState('admin', true);
        updateMessage('admin', '');

        try {
            const result = await InitService.createAdminUser();
            if (result.ok) {
                updateMessage('admin', '✅ Admin user created successfully!');
            } else {
                updateMessage('admin', '⚠️ Admin user creation failed. Check console for details.');
            }
        } catch (error) {
            console.error('Admin user creation error:', error);
            updateMessage('admin', `❌ Admin user creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            updateLoadingState('admin', false);
        }
    };

    const handleStressTestData = async () => {
        updateLoadingState('stress', true);
        updateMessage('stress', '');

        try {
            const result = await InitService.createStressTestData();
            if (result.ok) {
                updateMessage('stress', `✅ Stress test data creation started! Task ID: ${result.taskId}`);
                // 開始 SSE 進度追蹤
                startTracking(result.taskId);
            } else {
                updateMessage('stress', '⚠️ Stress test data creation failed. Check console for details.');
            }
        } catch (error) {
            console.error('Stress test data creation error:', error);
            updateMessage('stress', `❌ Stress test data creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            updateLoadingState('stress', false);
        }
    };

    const renderMessage = (key: string) => {
        const message = messages[key];
        if (!message) return null;

        return (
            <div className={`text-sm p-2 rounded mt-2 ${
                message.includes('✅') ? 'text-green-700 bg-green-100' :
                message.includes('⚠️') ? 'text-yellow-700 bg-yellow-100' :
                'text-red-700 bg-red-100'
            }`}>
                {message}
            </div>
        );
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Button
                        onClick={handleRbacDemo}
                        disabled={loadingStates.rbac}
                        className="w-full"
                    >
                        {loadingStates.rbac ? 'Initializing...' : 'Initialize RBAC Demo'}
                    </Button>
                    {renderMessage('rbac')}
                </div>

                <div className="space-y-2">
                    <Button
                        onClick={handleRtkDemo}
                        disabled={loadingStates.rtk}
                        className="w-full"
                    >
                        {loadingStates.rtk ? 'Initializing...' : 'Initialize RTK Demo'}
                    </Button>
                    {renderMessage('rtk')}
                </div>

                <div className="space-y-2">
                    <Button
                        onClick={handleCreateAdminUser}
                        disabled={loadingStates.admin}
                        className="w-full"
                    >
                        {loadingStates.admin ? 'Creating...' : 'Create Admin User'}
                    </Button>
                    {renderMessage('admin')}
                </div>

                <div className="space-y-2">
                    <Button
                        onClick={handleStressTestData}
                        disabled={loadingStates.stress || isTracking}
                        className="w-full"
                    >
                        {loadingStates.stress ? 'Starting...' : 
                         isTracking ? 'Tracking Progress...' : 
                         'Create Stress Test Data'}
                    </Button>
                    {renderMessage('stress')}
                </div>
            </div>

            {/* SSE 進度追蹤組件 */}
            <ProgressTracker
                progress={progress}
                isTracking={isTracking}
                error={error}
                onCancel={stopTracking}
            />

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