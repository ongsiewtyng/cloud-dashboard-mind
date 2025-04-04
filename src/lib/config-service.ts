
import { db } from './firebase';
import { ref, get, set, onValue } from 'firebase/database';

const CONFIG_PATH = 'config';
const SIMULATION_DOC = 'simulation';

export interface SimulationConfig {
  isEnabled: boolean;
  lastUpdated: string;
}

export async function getSimulationConfig(): Promise<SimulationConfig> {
  const configRef = ref(db, `${CONFIG_PATH}/${SIMULATION_DOC}`);
  const snapshot = await get(configRef);
  
  if (!snapshot.exists()) {
    const defaultConfig: SimulationConfig = {
      isEnabled: false,
      lastUpdated: new Date().toISOString()
    };
    await set(configRef, defaultConfig);
    return defaultConfig;
  }
  
  return snapshot.val() as SimulationConfig;
}

export async function updateSimulationConfig(isEnabled: boolean): Promise<void> {
  const configRef = ref(db, `${CONFIG_PATH}/${SIMULATION_DOC}`);
  await set(configRef, {
    isEnabled,
    lastUpdated: new Date().toISOString()
  });
}

export function subscribeToSimulationConfig(callback: (config: SimulationConfig) => void): () => void {
  const configRef = ref(db, `${CONFIG_PATH}/${SIMULATION_DOC}`);
  const unsubscribe = onValue(configRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as SimulationConfig);
    }
  });
  
  return unsubscribe;
} 
