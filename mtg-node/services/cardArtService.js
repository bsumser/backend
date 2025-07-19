// app/services/cardArtService.js
import { getCardByName } from '../models/cardModel.js';

// Define a comprehensive mock "database" for test environment
// This should include ALL cards from your 'goodDeck' and '1 Abrade 1 Dragon\'s Fire' test cases
const mockDatabase = [
  // --- Single-Faced Cards ---
  {
    id: 1, // Dummy ID
    name: 'Abrade',
    facename: 'Abrade', // Can be the same as 'name' for single-faced, or null/undefined
    image_uris: {
      small: 'https://fakeurl.test/abrade_small.jpg',
      normal: 'https://fakeurl.test/abrade.jpg',
      large: 'https://fakeurl.test/abrade_large.jpg',
      png: 'https://fakeurl.test/abrade.png',
      art_crop: 'https://fakeurl.test/abrade_art.jpg',
      border_crop: 'https://fakeurl.test/abrade_border.jpg'
    },
    // Add any other properties your app might rely on from the DB query result
  },
  {
    id: 2,
    name: "Dragon's Fire",
    facename: "Dragon's Fire",
    image_uris: { normal: 'https://fakeurl.test/dragons_fire.jpg' },
  },
  {
    id: 3,
    name: 'Mountain',
    facename: 'Mountain',
    image_uris: { normal: 'https://fakeurl.test/mountain.jpg' },
  },
  {
    id: 4,
    name: 'Goldspan Dragon',
    facename: 'Goldspan Dragon',
    image_uris: { normal: 'https://fakeurl.test/goldspan_dragon.jpg' },
  },
  {
    id: 5,
    name: 'Hinata, Dawn-Crowned',
    facename: 'Hinata, Dawn-Crowned',
    image_uris: { normal: 'https://fakeurl.test/hinata_dawn-crowned.jpg' },
  },
  {
    id: 6,
    name: 'Expressive Iteration',
    facename: 'Expressive Iteration',
    image_uris: { normal: 'https://fakeurl.test/expressive_iteration.jpg' },
  },
  {
    id: 7,
    name: 'Flame-Blessed Bolt',
    facename: 'Flame-Blessed Bolt',
    image_uris: { normal: 'https://fakeurl.test/flame-blessed_bolt.jpg' },
  },
  {
    id: 8,
    name: 'Magma Opus',
    facename: 'Magma Opus',
    image_uris: { normal: 'https://fakeurl.test/magma_opus.jpg' },
  },
  {
    id: 9,
    name: 'Make Disappear',
    facename: 'Make Disappear',
    image_uris: { normal: 'https://fakeurl.test/make_disappear.jpg' },
  },
  {
    id: 10,
    name: 'Negate',
    facename: 'Negate',
    image_uris: { normal: 'https://fakeurl.test/negate.jpg' },
  },
  {
    id: 11,
    name: 'Valorous Stance',
    facename: 'Valorous Stance',
    image_uris: { normal: 'https://fakeurl.test/valorous_stance.jpg' },
  },
  {
    id: 12,
    name: 'Voltage Surge',
    facename: 'Voltage Surge',
    image_uris: { normal: 'https://fakeurl.test/voltage_surge.jpg' },
  },
  {
    id: 13,
    name: 'Eiganjo, Seat of the Empire',
    facename: 'Eiganjo, Seat of the Empire',
    image_uris: { normal: 'https://fakeurl.test/eiganjo_seat_of_the_empire.jpg' },
  },
  {
    id: 14,
    name: 'Hall of Storm Giants',
    facename: 'Hall of Storm Giants',
    image_uris: { normal: 'https://fakeurl.test/hall_of_storm_giants.jpg' },
  },
  {
    id: 15,
    name: 'Otawara, Soaring City',
    facename: 'Otawara, Soaring City',
    image_uris: { normal: 'https://fakeurl.test/otawara_soaring_city.jpg' },
  },
  {
    id: 16,
    name: 'Sokenzan, Crucible of Defiance',
    facename: 'Sokenzan, Crucible of Defiance',
    image_uris: { normal: 'https://fakeurl.test/sokenzan_crucible_of_defiance.jpg' },
  },
  {
    id: 17,
    name: 'Stormcarved Coast',
    facename: 'Stormcarved Coast',
    image_uris: { normal: 'https://fakeurl.test/stormcarved_coast.jpg' },
  },
  {
    id: 18,
    name: 'Sundown Pass',
    facename: 'Sundown Pass',
    image_uris: { normal: 'https://fakeurl.test/sundown_pass.jpg' },
  },

  // --- Double-Faced Cards (DFCs) ---
  {
    id: 19,
    name: 'Fable of the Mirror-Breaker // Reflection of Kiki-Jiki',
    facename: 'Fable of the Mirror-Breaker', // CRITICAL: This is what processDeck's find uses
    image_uris: { normal: 'https://fakeurl.test/fable_mirror_breaker.jpg' },
  },
  {
    id: 20,
    name: 'Hengegate Pathway // Great Hall of Starnheim',
    facename: 'Hengegate Pathway',
    image_uris: { normal: 'https://fakeurl.test/hengegate_pathway.jpg' },
  },
  {
    id: 21,
    name: 'Jwari Disruption // Geode Depository',
    facename: 'Jwari Disruption',
    image_uris: { normal: 'https://fakeurl.test/jwari_disruption.jpg' },
  },
  {
    id: 22,
    name: 'Needleverge Pathway // Pillarverge Pathway',
    facename: 'Needleverge Pathway',
    image_uris: { normal: 'https://fakeurl.test/needleverge_pathway.jpg' },
  },
  {
    id: 23,
    name: 'Riverglide Pathway // Lavaglide Pathway',
    facename: 'Riverglide Pathway',
    image_uris: { normal: 'https://fakeurl.test/riverglide_pathway.jpg' },
  },
  {
    id: 24,
    name: 'Spikefield Hazard // Spikefield Cave',
    facename: 'Spikefield Hazard',
    image_uris: { normal: 'https://fakeurl.test/spikefield_hazard.jpg' },
  },
];

export async function getCardArtAll(names) {
  if (process.env.NODE_ENV === 'test') {
    console.log('✅ Using mocked card data in test');
    console.log('DEBUG: getCardArtAll received names for lookup:', names); // IMPORTANT LOG

    const results = names.map(inputName => {
      const lowerInputName = inputName.toLowerCase();
      const foundCard = mockDatabase.find(mockCard => {
        const lowerMockFacename = mockCard.facename ? mockCard.facename.toLowerCase() : null;
        const lowerMockName = mockCard.name.toLowerCase();

        const isMatch = lowerMockFacename === lowerInputName || lowerMockName === lowerInputName;
        // console.log(`DEBUG: MOCK FIND: Input "${lowerInputName}" vs Mock { facename: "${lowerMockFacename}", name: "${lowerMockName}" }. Match: ${isMatch}`); // UNCOMMENT FOR DEEPEST DEBUG
        return isMatch;
      });

      if (!foundCard) {
        console.error(`DEBUG: getCardArtAll mock did NOT find: "${inputName}" in mockDatabase.`); // IMPORTANT LOG
      } else {
        // console.log(`DEBUG: getCardArtAll mock FOUND: "${inputName}" ->`, foundCard.name); // IMPORTANT LOG
      }

      return foundCard || null;
    }).filter(Boolean); // Crucial: filters out any nulls before returning

    console.log('DEBUG: getCardArtAll returning:', results.map(r => r.name)); // IMPORTANT LOG
    return results;
  }

  // Production code:
  const results = await Promise.all(names.map(name => getCardByName(name)));
  return results.filter(Boolean);
}