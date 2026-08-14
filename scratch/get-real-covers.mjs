const ids = [
  172901, // The Extra's Academy Survival Guide
  119257, // Omniscient Reader
  118586, // Sousou no Frieren
  105398, // Solo Leveling
  86082,  // Dungeon Meshi
  105808, // The Eminence in Shadow
  105778, // Chainsaw Man
  30002,  // Berserk
  101517, // Jujutsu Kaisen
  108556, // Spy x Family
  159265, // Pick Me Up, Infinite Gacha
  106130, // Blue Lock
];

const query = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 20) {
    media(id_in: $ids, type: MANGA) {
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
}
`;

async function fetchRealCovers() {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables: { ids } }),
  });

  const json = await res.json();
  console.log(JSON.stringify(json.data.Page.media, null, 2));
}

fetchRealCovers().catch(console.error);
