// City centers (lat, lng) for the 23 seeded cities.
// Used to position the map when a city filter is active or for the
// "your city" default on first load.

export const CITY_CENTERS: Record<string, [number, number]> = {
  // BA
  "Sarajevo": [43.8563, 18.4131],
  "Banja Luka": [44.7722, 17.1910],
  "Mostar": [43.3438, 17.8078],
  "Tuzla": [44.5384, 18.6739],
  "Zenica": [44.2031, 17.9075],
  // RS
  "Beograd": [44.7866, 20.4489],
  "Novi Sad": [45.2671, 19.8335],
  "Niš": [43.3209, 21.8958],
  "Kragujevac": [44.0128, 20.9114],
  "Subotica": [46.1006, 19.6650],
  // HR
  "Zagreb": [45.8150, 15.9819],
  "Split": [43.5081, 16.4402],
  "Rijeka": [45.3271, 14.4422],
  "Osijek": [45.5550, 18.6955],
  "Zadar": [44.1194, 15.2314],
  // ME
  "Podgorica": [42.4304, 19.2594],
  "Nikšić": [42.7731, 18.9483],
  "Budva": [42.2911, 18.8400],
  "Bar": [42.0939, 19.1006],
  // MK
  "Skoplje": [41.9981, 21.4254],
  "Bitola": [41.0314, 21.3347],
  "Kumanovo": [42.1322, 21.7144],
  "Tetovo": [42.0103, 20.9714],
};

// Geographic center of the Balkans - used as a true fallback when no
// city is selected and user has none in profile.
export const BALKAN_CENTER: [number, number] = [44.0, 19.5];
export const BALKAN_ZOOM = 6;
export const CITY_ZOOM = 13;
