import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar, type DateData } from 'react-native-calendars';
import { AppModal } from './AppModal';
import { formatTripDates, todayIso } from '../models/tripDates';
import './calendarLocale';

type Props = {
  visible: boolean;
  startDate: string;
  endDate: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
};

function markedRange(startDate: string, endDate: string) {
  const marked: Record<
    string,
    { startingDay?: boolean; endingDay?: boolean; color: string; textColor: string }
  > = {};
  if (!startDate) return marked;
  const last = endDate || startDate;
  let cursor = new Date(`${startDate}T12:00:00Z`).getTime();
  const end = new Date(`${last}T12:00:00Z`).getTime();
  for (let count = 0; cursor <= end && count <= 366; count++, cursor += 86400000) {
    const day = new Date(cursor).toISOString().slice(0, 10);
    marked[day] = {
      startingDay: day === startDate,
      endingDay: day === last,
      color: '#526A50',
      textColor: '#FFFFFF',
    };
  }
  return marked;
}

export function TripDatePicker({ visible, startDate, endDate, onClose, onConfirm }: Props) {
  const [departure, setDeparture] = useState(startDate);
  const [arrival, setArrival] = useState(endDate);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!visible) return;
    setDeparture(startDate);
    setArrival(endDate);
    setError('');
  }, [visible, startDate, endDate]);

  function select(day: DateData) {
    if (!departure || arrival || day.dateString < departure) {
      setDeparture(day.dateString);
      setArrival('');
    } else {
      setArrival(day.dateString);
    }
    setError('');
  }

  function confirm() {
    if (!departure || !arrival) {
      setError('Önce gidiş, ardından dönüş gününü seç.');
      return;
    }
    const duration =
      (new Date(`${arrival}T12:00:00Z`).getTime() - new Date(`${departure}T12:00:00Z`).getTime()) /
      86400000;
    if (duration > 365) {
      setError('Bir yolculuk en fazla 365 gün sürebilir.');
      return;
    }
    onConfirm(departure, arrival);
    onClose();
  }

  return (
    <AppModal visible={visible} title="Seyahat tarihleri" onClose={onClose}>
      <Text className="mb-3 font-manrope text-[11px] text-[#778078]">
        Gidiş gününü, sonra dönüş gününü seç.
      </Text>
      <Calendar
        current={departure || todayIso()}
        minDate={startDate && startDate < todayIso() ? startDate : todayIso()}
        onDayPress={select}
        markedDates={markedRange(departure, arrival)}
        markingType="period"
        enableSwipeMonths
        theme={{
          calendarBackground: '#F8F7F2',
          todayTextColor: '#B66A50',
          arrowColor: '#203E35',
          monthTextColor: '#203E35',
          selectedDayBackgroundColor: '#526A50',
        }}
      />
      <View className="mt-3 rounded-xl bg-[#EFF0E9] p-3">
        <Text className="font-manrope text-[11px] text-[#203E35]">
          {departure && arrival
            ? formatTripDates(departure, arrival)
            : departure
              ? `${departure} · Dönüş gününü seç`
              : 'Henüz tarih seçilmedi'}
        </Text>
      </View>
      {!!error && (
        <Text accessibilityRole="alert" className="mt-2 font-manrope text-[10px] text-[#A54839]">
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={confirm}
        className="mt-4 min-h-12 items-center justify-center rounded-xl bg-[#203E35]"
      >
        <Text className="font-manrope-semibold text-[11px] text-white">Tarihleri seç</Text>
      </Pressable>
    </AppModal>
  );
}
