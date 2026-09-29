import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { palette, styles } from '../HomeScreen.styles';
import type { Currency, HomeData, HomePreferences } from '../../../models/trip';
import { exchangeRatesRepository } from '../../../repositories/exchangeRates';
import type { ExchangeRates } from '../../../models/exchangeRates';

const currencies: Currency[] = ['TRY', 'USD', 'GBP', 'JPY'];

export function CurrencyExchange({
  data,
  update,
}: {
  data: HomeData;
  update: (patch: Partial<HomePreferences>) => void;
}) {
  const [quote, setQuote] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  async function loadRates() {
    setLoading(true);
    setError(false);
    try {
      const result = await exchangeRatesRepository.load();
      if (mounted.current) setQuote(result);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    void loadRates();
    return () => {
      mounted.current = false;
    };
  }, []);

  const { amount, currency, reversed } = data;
  const setAmount = (amount: string) => update({ amount });
  const setCurrency = (currency: Currency) => update({ currency });
  const setReversed = (reversed: boolean) => update({ reversed });
  const value = Number(amount.replace(',', '.'));
  const valid = amount.trim() !== '' && Number.isFinite(value) && value >= 0;
  const referenceRate = quote?.rates[currency];
  const rate = referenceRate ? (reversed ? 1 / referenceRate : referenceRate) : null;
  const formatted =
    valid && rate !== null
      ? (value * rate).toLocaleString('tr-TR', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })
      : '—';
  return (
    <View className={styles.section}>
      <View className={[styles.between, '!mb-[11px]'].filter(Boolean).join(' ')}>
        <Text className={[styles.title, '!text-[23px]'].filter(Boolean).join(' ')}>
          Hızlı kur çevirici
        </Text>
        <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
          {quote
            ? `ECB · ${quote.date.split('-').reverse().join('.')}`
            : loading
              ? 'Kur alınıyor…'
              : 'Kur alınamadı'}
        </Text>
      </View>
      <View className={styles.card}>
        <View className={[styles.row, '!gap-[7px]'].filter(Boolean).join(' ')}>
          <View className="bg-[#F4F3EF] rounded-[14px] p-[12px] flex-1">
            <View className={styles.between}>
              <Text className={[styles.label, '!text-[7px]'].filter(Boolean).join(' ')}>TUTAR</Text>
              <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
                {reversed ? currency : 'EUR'}
              </Text>
            </View>
            <TextInput
              accessibilityLabel="Çevrilecek tutar"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              className={[styles.input, '!mt-[9px] !text-[17px]'].filter(Boolean).join(' ')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Para birimlerini ters çevir"
            onPress={() => setReversed(!reversed)}
            className="p-[4px]"
          >
            <Feather name="repeat" size={17} color={palette.green} />
          </Pressable>
          <View className="bg-[#F4F3EF] rounded-[14px] p-[12px] flex-1">
            <View className={styles.between}>
              <Text className={[styles.label, '!text-[7px]'].filter(Boolean).join(' ')}>
                KARŞILIĞI
              </Text>
              <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
                {reversed ? 'EUR' : currency}
              </Text>
            </View>
            <Text
              accessibilityLiveRegion="polite"
              className={[styles.body, '!text-[17px] !mt-[9px]'].filter(Boolean).join(' ')}
            >
              {formatted}
            </Text>
          </View>
        </View>
        <View
          className={[styles.between, '!mt-[13px] !flex-wrap !gap-[8px]'].filter(Boolean).join(' ')}
        >
          <View className={[styles.row, '!gap-[4px]'].filter(Boolean).join(' ')}>
            {currencies.map((code) => (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityState={{ selected: code === currency }}
                accessibilityLabel={`${code} kurunu seç`}
                onPress={() => setCurrency(code)}
                className={`rounded-[10px] px-[8px] py-[5px] ${code === currency ? 'bg-[#203E35]' : 'bg-[#EFF0E9]'}`}
              >
                <Text
                  className={`${styles.small} !text-[8px] ${code === currency ? '!text-white' : '!text-[#8B9389]'}`}
                >
                  {code}
                </Text>
              </Pressable>
            ))}
          </View>
          {rate !== null && (
            <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
              1 {reversed ? currency : 'EUR'} ={' '}
              {rate.toLocaleString('tr-TR', { maximumFractionDigits: 3 })}{' '}
              {reversed ? 'EUR' : currency}
            </Text>
          )}
        </View>
        <View className={[styles.between, '!mt-[8px]'].filter(Boolean).join(' ')}>
          <Text className={[styles.small, '!text-[8px] !flex-1'].filter(Boolean).join(' ')}>
            {error
              ? quote
                ? 'Güncelleme yapılamadı; son alınan kur gösteriliyor.'
                : 'Kurlar alınamadı. Bağlantını kontrol et.'
              : 'ECB referans kuru · Banka ve döviz bürosu kuru farklı olabilir.'}
          </Text>
          {error && (
            <Pressable accessibilityRole="button" onPress={() => void loadRates()}>
              <Text
                className={[styles.small, '!text-[8px] !text-[#49644F]'].filter(Boolean).join(' ')}
              >
                Tekrar dene
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
