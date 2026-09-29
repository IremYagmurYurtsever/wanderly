import { useStoredSelection } from '../../hooks/useStoredSelection';
import { storageKeys } from '../../storage';

export function useSavedPlaces() {
  return useStoredSelection(storageKeys.savedPlaces);
}
