import { NextResponse } from 'next/server';
import { getSimulationConfig } from '@/lib/config-service';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addSignalLog } from '@/lib/signal-service';
import { getRandomDowntimeReason } from '@/utils/signalUtils';

const MACHINES_COLLECTION = 'machines';

// Helper function to check if time is within bounds (8 AM to 5 PM)
function isWithinTimelineBounds(): boolean {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const startTimeMinutes = 8 * 60; // 8 AM
  const endTimeMinutes = 17 * 60; // 5 PM

  const currentTimeMinutes = currentHours * 60 + currentMinutes;
  return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
}

// Helper to get current time string in HH:MM:SS format
function getCurrentTimeString(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

export async function GET() {
  try {
    // Check if simulation is enabled
    const config = await getSimulationConfig();
    if (!config.isEnabled) {
      return NextResponse.json({ message: 'Simulation is disabled' });
    }

    // Check if we're within operating hours
    if (!isWithinTimelineBounds()) {
      return NextResponse.json({ message: 'Outside operating hours' });
    }

    // Get all machines
    const machinesSnapshot = await getDocs(collection(db, MACHINES_COLLECTION));
    const updates: Promise<any>[] = [];

    machinesSnapshot.forEach(doc => {
      const machineId = doc.id;
      
      // 5% base chance of status change per minute
      if (Math.random() < 0.05) {
        // 80% chance of going down when change occurs
        const newStatus = Math.random() < 0.8 ? "0" : "1";
        const reason = newStatus === "0" ? getRandomDowntimeReason() : "";
        
        updates.push(
          addSignalLog(machineId, newStatus, getCurrentTimeString(), reason)
        );
      }
    });

    await Promise.all(updates);

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${machinesSnapshot.size} machines` 
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Vercel cron job configuration
export const dynamic = 'force-dynamic';
export const revalidate = 0; 