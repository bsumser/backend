import { getCardByName } from '../models/cardModel.js';

export async function getCardArtAll(names) {
  if (process.env.NODE_ENV === 'test') {
    console.log('✅ Using mocked card data in test');
    return names.map(name => ({
      name,
      image_url: `https://fakeurl.test/${encodeURIComponent(name)}.jpg`
    }));
  }

  const results = await Promise.all(names.map(name => getCardByName(name)));
  return results.filter(Boolean);
}