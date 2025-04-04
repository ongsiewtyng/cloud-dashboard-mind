
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { getSimulationConfig, updateSimulationConfig, subscribeToSimulationConfig } from '@/lib/config-service';

export default function SimulationControl() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load
    getSimulationConfig().then((config) => {
      setIsEnabled(config.isEnabled);
      setLastUpdated(config.lastUpdated);
      setIsLoading(false);
    });

    // Subscribe to changes
    const unsubscribe = subscribeToSimulationConfig((config) => {
      setIsEnabled(config.isEnabled);
      setLastUpdated(config.lastUpdated);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (checked: boolean) => {
    try {
      await updateSimulationConfig(checked);
      setIsEnabled(checked);
    } catch (error) {
      console.error('Error updating simulation config:', error);
      // Revert the toggle if there's an error
      setIsEnabled(!checked);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Background Simulation</h3>
          <p className="text-sm text-gray-500">
            Enable/disable automatic machine status simulation
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
      <div className="mt-2">
        <p className="text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500">
          Operating hours: 8:00 AM - 5:00 PM
        </p>
      </div>
    </div>
  );
} 
