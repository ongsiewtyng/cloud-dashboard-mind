import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const CONFIG_COLLECTION = 'config';
const SIMULATION_DOC = 'simulation';

export interface SimulationConfig {
  isEnabled: boolean;
  lastUpdated: string;
}

export async function getSimulationConfig(): Promise<SimulationConfig> {
  const docRef = doc(db, CONFIG_COLLECTION, SIMULATION_DOC);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    const defaultConfig: SimulationConfig = {
      isEnabled: false,
      lastUpdated: new Date().toISOString()
    };
    await setDoc(docRef, defaultConfig);
    return defaultConfig;
  }
  
  return docSnap.data() as SimulationConfig;
}

export async function updateSimulationConfig(isEnabled: boolean): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, SIMULATION_DOC);
  await setDoc(docRef, {
    isEnabled,
    lastUpdated: new Date().toISOString()
  });
}

export function subscribeToSimulationConfig(callback: (config: SimulationConfig) => void): () => void {
  const docRef = doc(db, CONFIG_COLLECTION, SIMULATION_DOC);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as SimulationConfig);
    }
  });
} 