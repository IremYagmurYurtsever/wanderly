import type { HomeTab } from '../../navigation/routes';
export type { HomeTab } from '../../navigation/routes';

export type HomeBottomBarProps = {
  activeTab: HomeTab;
  onSelect: (tab: HomeTab) => void;
};
