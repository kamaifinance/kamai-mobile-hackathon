// Font family configuration for Kamai Mobile App
export const FontFamilies = {
  // Saleha font
  Saleha: 'Saleha',
  
  // Larken font variants
  Larken: {
    Regular: 'Larken Regular',
    Bold: 'Larken Bold',
    BoldItalic: 'Larken Bold Italic',
    Italic: 'Larken Italic',
    Light: 'Larken Light',
    LightItalic: 'Larken Light Italic',
    Medium: 'Larken Medium',
    MediumItalic: 'Larken Medium Italic',
    Thin: 'Larken Thin',
    ThinItalic: 'Larken Thin Italic',
  },
} as const;

// Type for font families
export type FontFamily = typeof FontFamilies;

// Helper function to get font family string
export const getFontFamily = (family: string): string => {
  return family;
}; 