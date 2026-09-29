import Feather from '@expo/vector-icons/Feather';
import { Alert, Linking, Pressable } from 'react-native';
import { googleMapsPlaceUrl } from '../mapLinks';
import { palette } from '../ExploreScreen.styles';

type Props = {
  title: string;
  address: string;
  mapsUrl?: string;
};

export function MapLocationLink({ title, address, mapsUrl }: Props) {
  async function open() {
    try {
      await Linking.openURL(googleMapsPlaceUrl(mapsUrl, `${title}, ${address}`));
    } catch {
      Alert.alert('Harita açılamadı', 'Lütfen daha sonra tekrar dene.');
    }
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${title} konumunu Google Maps'te aç`}
      hitSlop={8}
      onPress={open}
      className="w-[24px] h-[24px] items-center justify-center"
    >
      <Feather name="map-pin" size={15} color={palette.green} />
    </Pressable>
  );
}
