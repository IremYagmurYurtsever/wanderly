import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { formatDate, type JournalEntry } from '../JournalScreen.data';
import { palette, styles } from '../JournalScreen.styles';

type JournalCardProps = {
  entry: JournalEntry;
  liked: boolean;
  ready: boolean;
  onLike: () => void;
  onShare: () => void;
  onPhoto: (photo: ImageSourcePropType) => void;
  onOpen: () => void;
  onEdit: () => void;
};

export function JournalCard({
  entry,
  liked,
  ready,
  onLike,
  onShare,
  onPhoto,
  onOpen,
  onEdit,
}: JournalCardProps) {
  return (
    <View className={styles.card}>
      <View className={[styles.between, '!flex-wrap'].filter(Boolean).join(' ')}>
        <View className={styles.row}>
          <View className={styles.dot} />
          <Text className={[styles.label, '!text-[7px]'].filter(Boolean).join(' ')}>
            {entry.city.toLocaleUpperCase('tr-TR')} ·{' '}
            {formatDate(entry.date).toLocaleUpperCase('tr-TR')}
          </Text>
        </View>
        <Text className={[styles.small, '!text-[7px]'].filter(Boolean).join(' ')}>
          {entry.placeName || 'Kendi notun'}
        </Text>
      </View>
      <Text accessibilityRole="header" className={styles.cardTitle}>
        {entry.title}
      </Text>
      <Text className={styles.cardText} numberOfLines={4}>
        {entry.text}
      </Text>
      <Pressable accessibilityRole="button" onPress={onOpen} className="self-start py-2">
        <Text className="font-manrope-semibold text-[10px] text-[#203E35]">Anıyı oku →</Text>
      </Pressable>
      {entry.photos.length > 0 && (
        <View className={styles.photos}>
          {entry.photos.map((photo, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`${entry.title}, ${index + 1}. fotoğrafı büyüt`}
              onPress={() => onPhoto(photo)}
              className={styles.photo}
            >
              <Image source={photo} className={styles.image} resizeMode="cover" />
              {index === entry.photos.length - 1 && (
                <View
                  className={[
                    [styles.row, styles.photoCount].filter(Boolean).join(' '),
                    '!gap-[3px]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Feather name="image" size={9} color={palette.ink} />
                  <Text className={[styles.label, '!tracking-0'].filter(Boolean).join(' ')}>
                    {entry.photos.length}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
      <View className={[styles.between, styles.cardFooter].filter(Boolean).join(' ')}>
        <View className={styles.mood}>
          <Feather name="edit-3" size={10} color={palette.coral} />
          <Text
            className={[styles.small, 'shrink !text-[#8B8E6D] !text-[8px]']
              .filter(Boolean)
              .join(' ')}
          >
            {entry.placeName || 'Sana ait bir an'}
          </Text>
        </View>
        <View className={[styles.row, '!gap-0'].filter(Boolean).join(' ')}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${entry.title}: düzenle veya sil`}
            onPress={onEdit}
            className={styles.icon}
          >
            <Feather name="edit-3" size={15} color={palette.green} />
          </Pressable>
          <Pressable
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel={`${entry.title}: ${liked ? 'beğeniyi kaldır' : 'beğen'}`}
            accessibilityState={{ selected: liked, disabled: !ready }}
            onPress={onLike}
            className={`${styles.icon} ${liked ? '!bg-[#F9E7DE]' : ''}`}
          >
            <Feather name="heart" size={16} color={liked ? palette.coral : '#A1A89D'} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${entry.title}: paylaş`}
            onPress={onShare}
            className={styles.icon}
          >
            <Feather name="share-2" size={15} color="#9FA799" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
