import type { Notice, Screen } from '../../types';
import type { DetailPlace } from '../PlaceDetailScreen/PlaceDetailScreen';
import type { SavedTrip } from '../../models/trip';

export type HomeScreenProps = {
  name: string;
  go: (screen: Screen) => void;
  setNotice: (notice: Notice) => void;
  onOpenPlace: (place: DetailPlace) => void;
  onOpenTrip: (trip: SavedTrip) => void;
};
export type { Trip } from '../../models/trip';
