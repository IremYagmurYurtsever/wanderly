export const styles = {
  container: 'w-full flex-shrink-0',
  bar: 'w-full flex-row items-center justify-center bg-[#FEFDFA] px-[6px] pt-2',
  android: 'border-t border-t-[#E7E8DF]',
  ios: 'rounded-[30px] border border-[#E7E8DF] pb-2 shadow-lg shadow-[#203E35]/10',
  tab: 'min-h-12 min-w-0 w-full items-center justify-center gap-[3px] py-[3px]',
  icon: 'h-[30px] w-[46px] items-center justify-center rounded-2xl',
  selected: '!bg-[#E6EDDC]',
  label: 'w-full text-center font-manrope text-[9px] text-[#8B9389]',
  activeLabel: '!font-manrope-semibold !text-[#49644F]',
} as const;
