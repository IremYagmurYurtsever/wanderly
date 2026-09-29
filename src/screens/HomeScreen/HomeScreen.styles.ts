export { palette } from '../../theme/tokens';

export const styles = {
  page: 'flex-1 bg-[#F8F7F2]',
  content: 'px-[22px] pb-6',
  row: 'flex-row items-center',
  between: 'flex-row items-center justify-between',
  label: 'font-manrope-semibold text-[9px] tracking-[1.4px] text-[#8B9389]',
  body: 'font-manrope text-[12px] text-[#203E35]',
  small: 'font-manrope text-[10px] text-[#8B9389]',
  title: 'font-garamond text-[25px] text-[#203E35]',
  card: 'rounded-[23px] border border-[#ECEDE5] bg-[#FEFDFA] p-[18px]',
  field:
    'flex-row items-center gap-[10px] rounded-[14px] border border-[#E7E8DF] bg-white px-3 py-[11px]',
  button:
    'min-h-[49px] flex-row items-center justify-center gap-2 rounded-[13px] bg-[#203E35] px-[17px]',
  buttonText: 'font-manrope-semibold text-[11px] text-white',
  input: 'min-w-0 p-0 font-manrope text-[12px] text-[#203E35]',
  section: 'mt-[25px]',
  iconCircle: 'h-[34px] w-[34px] items-center justify-center rounded-[17px] bg-[#EFF0E9]',
} as const;
