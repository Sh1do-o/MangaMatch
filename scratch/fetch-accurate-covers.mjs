const titles = [
  "The Extra’s Academy Survival Guide",
  "Omniscient Reader",
  "Sousou no Frieren",
  "Solo Leveling",
  "Dungeon Meshi",
  "The Eminence in Shadow",
  "Chainsaw Man",
  "Berserk",
  "Jujutsu Kaisen",
  "SPY x FAMILY",
  "Pick Me Up, Infinite Gacha",
  "Blue Lock",
];

const searchQuery = `
query ($search: String) {
  Media(search: $search, type: MANGA) {
    id
    title {
      romaji
      english
    }
    coverImage {
      extraLarge
      large
    }
  }
}
`;

async function fetchAccurateCovers() {
  const results = [];
  for (const title of titles) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: searchQuery, variables: { search: title } }),
    });

    const json = await res.json();
    const media = json.data.Media;
    results.push({
      searchTitle: title,
      id: media.id,
      englishTitle: media.title.english || media.title.romaji,
      coverUrl: media.coverImage.extraLarge || media.coverImage.large,
    });
  }
  console.log(JSON.stringify(results, null, 2));
}

fetchAccurateCovers().catch(console.error);
