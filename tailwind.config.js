const { colors, fonts } = require('./src/theme/tokens.json');
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: {
    colors: { ...colors, brandGreen: colors.green },
    fontFamily: { garamond: [fonts.heading], manrope: [fonts.body], 'manrope-semibold': [fonts.semibold] },
  } },
  plugins: [],
};
