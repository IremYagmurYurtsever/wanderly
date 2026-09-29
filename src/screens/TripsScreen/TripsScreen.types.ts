import type { Screen } from '../../types';
import type { SavedTrip } from '../../models/trip';

export type TripStatus = 'ongoing' | 'upcoming' | 'past';
export type TripFilter = 'all' | TripStatus;
export type Journey = {
  id: string;
  title: string;
  location: string;
  dates: string;
  status: TripStatus;
  duration: string;
  trip: SavedTrip;
};
export type TripsScreenProps = {
  name: string;
  go: (screen: Screen) => void;
  onOpenTrip: (trip: SavedTrip) => void;
  onPlanTrip: () => void;
};
