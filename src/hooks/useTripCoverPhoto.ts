import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SavedTrip } from '../models/trip';
import { tripCoverSearch } from '../models/tripCover';
import { placePhotoRepository, type PlacePhoto } from '../repositories/placePhotos';

function fallbackImage(countryCode?: string | null): ImageSourcePropType {
  if (countryCode === 'IT') return require('../../assets/trips/rome.jpg');
  if (countryCode === 'CH') return require('../../assets/trips/alps.jpg');
  if (countryCode === 'JP') return require('../../assets/trips/kyoto.jpg');
  return require('../../assets/trips/coast.jpg');
}

export function useTripCoverPhoto(trip: SavedTrip) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [failed, setFailed] = useState(false);
  const search = tripCoverSearch(trip);
  useEffect(() => {
    setPhoto(null);
    setFailed(false);
    if (!search) return;
    let active = true;
    const controller = new AbortController();
    void placePhotoRepository
      .load(search.title, search.countryCode, controller.signal)
      .then((result) =>
        (result && /^(CC0|Public domain)/i.test(result.license)) ||
        search.title === search.fallbackTitle ||
        !active
          ? result
          : placePhotoRepository.load(search.fallbackTitle, search.countryCode, controller.signal),
      )
      .then((result) => {
        if (active)
          setPhoto(result && /^(CC0|Public domain)/i.test(result.license) ? result : null);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [search?.countryCode, search?.title, search?.fallbackTitle]);
  const currentPhoto = failed ? null : photo;
  return {
    source: currentPhoto
      ? { uri: currentPhoto.url }
      : fallbackImage(search?.countryCode ?? trip.countryCode),
    onError: () => setFailed(true),
  };
}
