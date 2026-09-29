import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { Keyboard, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import type { HomeBottomBarProps, HomeTab } from './HomeBottomBar.types';
import { styles } from './HomeBottomBar.styles';

const tabs: { title: HomeTab; icon: ComponentProps<typeof Feather>['name'] }[] = [
  { title: 'Ana Sayfa', icon: 'home' },
  { title: 'Gezilerim', icon: 'map' },
  { title: 'Keşfet', icon: 'compass' },
  { title: 'Günlüğüm', icon: 'book-open' },
  { title: 'Profil', icon: 'user' },
];

// Place after the screen's flex: 1 content. This footer owns the bottom safe area;
// the parent SafeAreaView should omit its bottom edge to avoid double padding.
export function HomeBottomBar({ activeTab, onSelect }: HomeBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(windowWidth);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const ios = Platform.OS === 'ios';
  const sideGap = ios ? 12 : 0;
  const sideInset = Math.max(insets.left, insets.right);
  const width = Math.min(containerWidth, windowWidth) - sideInset * 2 - sideGap * 2;
  const compact = width < 350;

  if (keyboardVisible) return null;

  return (
    <View
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      className={styles.container}
      style={{
        paddingLeft: sideInset + sideGap,
        paddingRight: sideInset + sideGap,
        paddingTop: ios ? 8 : 0,
        paddingBottom: ios ? Math.max(insets.bottom, 12) : 0,
      }}
    >
      <View
        className={`${styles.bar} ${ios ? styles.ios : styles.android}`}
        style={!ios ? { paddingBottom: Math.max(insets.bottom, 8) } : undefined}
      >
        {tabs.map(({ title, icon }) => {
          const selected = title === activeTab;
          return (
            <View key={title} className="min-w-0 flex-1 basis-0 items-center">
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={title}
                accessibilityState={{ selected }}
                onPress={() => onSelect(title)}
                className={styles.tab}
              >
                <View
                  className={`${styles.icon} ${compact ? '!w-10' : ''} ${selected ? styles.selected : ''}`}
                >
                  <Feather
                    name={icon}
                    size={compact ? 18 : 20}
                    color={selected ? '#49644F' : '#9A9E91'}
                  />
                </View>
                <Text
                  className={`${styles.label} ${compact ? '!text-[8px]' : ''} ${selected ? styles.activeLabel : ''}`}
                >
                  {title}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
