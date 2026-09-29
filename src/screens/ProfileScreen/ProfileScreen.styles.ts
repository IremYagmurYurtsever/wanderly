export { palette } from '../../theme/tokens';

export const styles = {
  page: 'flex-1 bg-[#F8F7F2]',
  content: 'px-5 pb-5',
  row: 'flex-row items-center gap-2',
  between: 'flex-row items-center justify-between gap-[10px]',
  title: 'font-garamond text-[30px] text-[#203E35]',
  text: 'font-manrope text-[11px] leading-[18px] text-[#203E35]',
  small: 'font-manrope text-[9px] leading-[15px] text-[#8B9389]',
  label: 'font-manrope-semibold text-[8px] tracking-[1.1px] text-[#9C987D]',
  header: 'border-b border-b-[#E7E8DF] py-3',
  icon: 'h-9 w-9 items-center justify-center rounded-[18px] bg-[#EFF1E7]',
  hero: 'mt-[18px] items-center rounded-[24px] bg-[#EFF1E8] p-[21px]',
  portrait:
    'mb-[9px] h-[88px] w-[88px] items-center justify-center rounded-[44px] border-[4px] border-[#F9FAF2] bg-[#D6DEC6]',
  initials: 'font-garamond text-[36px] text-[#49644F]',
  portraitBadge:
    'absolute bottom-[-1px] right-[-1px] h-[25px] w-[25px] items-center justify-center rounded-[13px] border-2 border-[#EFF1E8] bg-[#203E35]',
  member:
    'mb-3 mt-[11px] flex-row items-center gap-[5px] rounded-[14px] bg-[#DFE9D5] px-3 py-[5px]',
  button: 'min-h-10 flex-row items-center justify-center gap-[7px] rounded-xl bg-[#203E35] px-4',
  buttonText: 'font-manrope-semibold text-[10px] text-white',
  section: 'mt-[26px]',
  stat: 'flex-1 items-center rounded-[14px] border border-[#EFEFE7] bg-[#FFFEFA] py-4',
  statNumber: 'font-garamond text-[35px] text-[#203E35]',
  localCard: 'mt-3 flex-row items-center gap-3 rounded-2xl bg-[#ECF1DF] p-[15px]',
  stamp: 'flex-1 rounded-2xl border border-[#ECEDE4] bg-[#FFFEFA] p-[9px]',
  stampImage: 'h-[110px] w-full rounded-[9px]',
  stampBadge: 'absolute bottom-[6px] left-[6px] rounded-[4px] bg-[#F7F5DD] px-[6px] py-[3px]',
  settings: 'mt-[13px] overflow-hidden rounded-[18px] border border-[#EFEFE7] bg-[#FFFEFA]',
  setting: 'min-h-[72px] flex-row items-center gap-[11px] border-b border-b-[#F0F0E8] p-[14px]',
  settingIcon: 'h-[34px] w-[34px] items-center justify-center rounded-xl bg-[#EFF0E7]',
  overlay: 'flex-1 justify-center bg-[#183D3866] p-[23px]',
  sheet: 'max-h-[90%] w-full max-w-[420px] self-center rounded-[24px] bg-[#FAF9F4] p-[23px]',
  input:
    'mb-[17px] mt-[7px] rounded-xl border border-[#E7E8DF] bg-white p-[13px] font-manrope text-[12px] text-[#203E35]',
  choice: 'rounded-[17px] border border-[#DDE3D2] bg-[#F2F4E9] px-[13px] py-[10px]',
} as const;
