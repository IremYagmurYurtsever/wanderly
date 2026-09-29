import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import Feather from '@expo/vector-icons/Feather';
import '../../../components/calendarLocale';
import { todayIso } from '../../../models/tripDates';
import { formatDate } from '../JournalScreen.data';

type Props = {
  tripName: string;
  placeName?: string;
  initialDate?: string;
  dates: string[];
  onClose: () => void;
  onSelect: (date: string) => void;
};

export function JournalDatePicker({
  tripName,
  placeName,
  initialDate,
  dates,
  onClose,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState(initialDate || todayIso());
  useEffect(() => setSelected(initialDate || todayIso()), [initialDate, placeName]);
  const markedDates: Record<
    string,
    { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }
  > = Object.fromEntries(dates.map((date) => [date, { marked: true, dotColor: '#B66A50' }]));
  markedDates[selected] = { ...markedDates[selected], selected: true, selectedColor: '#526A50' };

  return (
    <View className="mb-5 rounded-2xl border border-[#DCE5D9] bg-[#F1F5EC] p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text accessibilityRole="header" className="font-garamond text-[25px] text-[#203E35]">
          Günlük günü seç
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tarih seçimini kapat"
          onPress={onClose}
          className="h-10 w-10 items-center justify-center"
        >
          <Feather name="x" size={18} color="#203E35" />
        </Pressable>
      </View>
      <Text className="mb-4 font-manrope text-[11px] leading-5 text-[#66756A]">
        {placeName
          ? `${placeName} anısını ${tripName} günlüğünde hangi güne eklemek istersin?`
          : `${tripName} günlüğünde yazmak istediğin günü seç.`}{' '}
        O günün eski yazıları korunur.
      </Text>
      {dates.length > 0 && (
        <View className="mb-5">
          <Text className="mb-2 font-manrope-semibold text-[10px] text-[#203E35]">
            YAZDIĞIN GÜNLER
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {dates.slice(0, 6).map((date) => (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`${formatDate(date)} gününe ekle`}
                onPress={() => onSelect(date)}
                className="min-h-10 justify-center rounded-full bg-[#E9EEE4] px-3"
              >
                <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                  {formatDate(date)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Text className="mb-2 font-manrope-semibold text-[10px] text-[#203E35]">
        TAKVİMDEN BAŞKA BİR GÜN SEÇ
      </Text>
      <Calendar
        current={selected}
        onDayPress={(day: DateData) => setSelected(day.dateString)}
        markedDates={markedDates}
        enableSwipeMonths
        theme={{
          calendarBackground: '#F8F7F2',
          todayTextColor: '#B66A50',
          arrowColor: '#203E35',
          monthTextColor: '#203E35',
          selectedDayBackgroundColor: '#526A50',
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelect(selected)}
        className="mt-4 min-h-12 items-center justify-center rounded-xl bg-[#203E35]"
      >
        <Text className="font-manrope-semibold text-[11px] text-white">
          {formatDate(selected)} gününe ekle
        </Text>
      </Pressable>
    </View>
  );
}
