import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppModal } from './AppModal';
import type { Country } from '../repositories/googlePlaces';

type Props = {
  visible: boolean;
  countries: Country[];
  onClose: () => void;
  onSelect: (country: Country) => void;
};

export function TripCountryPicker({ visible, countries, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const visibleCountries = countries.filter((country) =>
    country.label.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR')),
  );
  return (
    <AppModal visible={visible} title="Ülke seç" onClose={onClose}>
      <TextInput
        accessibilityLabel="Ülke ara"
        value={query}
        onChangeText={setQuery}
        placeholder="Ülke ara"
        className="mb-3 rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[12px] text-[#203E35]"
      />
      <View className="gap-2">
        {visibleCountries.map((country) => (
          <Pressable
            key={country.code}
            accessibilityRole="button"
            onPress={() => {
              onSelect(country);
              onClose();
              setQuery('');
            }}
            className="min-h-11 flex-row items-center justify-between rounded-xl bg-white px-4"
          >
            <Text className="font-manrope text-[12px] text-[#203E35]">{country.label}</Text>
            <Text className="font-manrope text-[10px] text-[#8B9389]">{country.code}</Text>
          </Pressable>
        ))}
        {!visibleCountries.length && (
          <Text className="font-manrope text-[11px] text-[#778078]">Ülke bulunamadı.</Text>
        )}
      </View>
    </AppModal>
  );
}
