import { prisma } from "@/lib/db";

export interface StarterManga {
  anilistId: number;
  title: string;
  genres: string;
  coverUrl: string;
  synopsis: string;
  publicationStatus: string;
  readingStatus: string;
  rating: number;
  authors: string;
  publishedFrom: string;
  publishedTo: string;
  chapters: number | null;
  volumes: number | null;
  malScore: number;
  siteUrl: string;
  categoryNames: string[];
}

export const STARTER_CATEGORIES = [
  { name: "Peak Mainstream", color: "#E8C77E" },
  { name: "Recommended", color: "#60A5FA" },
  { name: "Masterpiece", color: "#F472B6" },
  { name: "Currently Bingeing", color: "#34D399" },
];

export const STARTER_MANGA: StarterManga[] = [
  {
    anilistId: 172619,
    title: "The Extra’s Academy Survival Guide",
    genres: "Action, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx172619-LSoXY45QAas4.jpg",
    synopsis: "Ed Rothstaylor is a third-rate villain in a game, disowned by his family and kicked out of the dormitory for his misdeeds. One day, our main character wakes up as this very Ed, and realizes he must earn a scholarship so he can graduate and be set for life.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 9,
    authors: "Green Kyrin",
    publishedFrom: "December 28, 2023",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.2,
    siteUrl: "https://anilist.co/manga/172619",
    categoryNames: ["Peak Mainstream", "Currently Bingeing"],
  },
  {
    anilistId: 119257,
    title: "Omniscient Reader",
    genres: "Action, Adventure, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg",
    synopsis: "Back then, Dok-Ja had no idea. He had no idea his favorite web novel 'Three Ways to Survive the Apocalypse' was going to come to life, and that he would become the only person to know how the world was going to end.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 10,
    authors: "sing N song, Sleepy-C, UMI",
    publishedFrom: "May 26, 2020",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.8,
    siteUrl: "https://anilist.co/manga/119257",
    categoryNames: ["Masterpiece", "Peak Mainstream"],
  },
  {
    anilistId: 118586,
    title: "Sousou no Frieren",
    genres: "Adventure, Drama, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx118586-CXKgWikBFQgS.jpg",
    synopsis: "The adventure is over but life goes on for an elf mage just beginning to learn what living is all about. Elf mage Frieren and her courageous fellow adventurers have defeated the Demon King and brought peace to the land.",
    publicationStatus: "RELEASING",
    readingStatus: "completed",
    rating: 10,
    authors: "Kanehito Yamada, Tsukasa Abe",
    publishedFrom: "April 28, 2020",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.9,
    siteUrl: "https://anilist.co/manga/118586",
    categoryNames: ["Masterpiece", "Recommended"],
  },
  {
    anilistId: 105398,
    title: "Solo Leveling",
    genres: "Action, Adventure, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg",
    synopsis: "10 years ago, after 'the Gate' that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as 'Hunters'.",
    publicationStatus: "FINISHED",
    readingStatus: "completed",
    rating: 9,
    authors: "Chugong, DUBU",
    publishedFrom: "March 4, 2018",
    publishedTo: "December 29, 2021",
    chapters: 179,
    volumes: 14,
    malScore: 8.7,
    siteUrl: "https://anilist.co/manga/105398",
    categoryNames: ["Peak Mainstream"],
  },
  {
    anilistId: 86082,
    title: "Dungeon Meshi",
    genres: "Adventure, Comedy, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86082-MXizJxzbijdd.jpg",
    synopsis: "What do you get when you cross dungeon adventures and food manga? You get Delicious in Dungeon, where we find our troupe of adventurers on a mission to save their lost teammate while figuring out how to survive on the food that the dungeon provides.",
    publicationStatus: "FINISHED",
    readingStatus: "completed",
    rating: 10,
    authors: "Ryoko Kui",
    publishedFrom: "February 15, 2014",
    publishedTo: "September 15, 2023",
    chapters: 97,
    volumes: 14,
    malScore: 8.9,
    siteUrl: "https://anilist.co/manga/86082",
    categoryNames: ["Masterpiece", "Recommended"],
  },
  {
    anilistId: 106758,
    title: "The Eminence in Shadow",
    genres: "Action, Comedy, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106758-jtXpQYQqyNJv.jpg",
    synopsis: "Just as everyone has had childhood dreams of becoming a superhero, Cid Kagenou dreams of becoming a mastermind operating from the shadows.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 8,
    authors: "Daisuke Aizawa, Anri Sakano",
    publishedFrom: "December 26, 2018",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.1,
    siteUrl: "https://anilist.co/manga/106758",
    categoryNames: ["Recommended"],
  },
  {
    anilistId: 105778,
    title: "Chainsaw Man",
    genres: "Action, Comedy, Drama, Horror, Supernatural",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png",
    synopsis: "Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 9,
    authors: "Tatsuki Fujimoto",
    publishedFrom: "December 3, 2018",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.6,
    siteUrl: "https://anilist.co/manga/105778",
    categoryNames: ["Peak Mainstream"],
  },
  {
    anilistId: 30002,
    title: "Berserk",
    genres: "Action, Adventure, Drama, Fantasy, Horror, Psychological",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg",
    synopsis: "Guts, a man who calls himself 'The Black Swordsman', looks upon his days serving as the member of a group of mercenaries, the Band of the Hawk, and the terrifying journey of vengeance that follows.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 10,
    authors: "Kentaro Miura, Studio Gaga",
    publishedFrom: "August 25, 1989",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 9.4,
    siteUrl: "https://anilist.co/manga/30002",
    categoryNames: ["Masterpiece"],
  },
  {
    anilistId: 101517,
    title: "Jujutsu Kaisen",
    genres: "Action, Drama, Supernatural",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg",
    synopsis: "Although Yuji Itadori looks like your average teenager, his immense physical strength is something to behold! Every sports club wants him to join, but Itadori would rather hang out with the school outcasts in the Occult Club.",
    publicationStatus: "FINISHED",
    readingStatus: "completed",
    rating: 8,
    authors: "Gege Akutami",
    publishedFrom: "March 5, 2018",
    publishedTo: "September 30, 2024",
    chapters: 271,
    volumes: 30,
    malScore: 8.4,
    siteUrl: "https://anilist.co/manga/101517",
    categoryNames: ["Peak Mainstream"],
  },
  {
    anilistId: 108556,
    title: "SPY x FAMILY",
    genres: "Action, Comedy, Supernatural",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx108556-NHjkz0BNJhLx.jpg",
    synopsis: "Master spy Twilight is the best at what he does when it comes to going undercover on dangerous missions in the name of a better world. But when he receives the ultimate impossible assignment—get married and have a kid—he may finally be in over his head!",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 9,
    authors: "Tatsuya Endou",
    publishedFrom: "March 25, 2019",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.6,
    siteUrl: "https://anilist.co/manga/108556",
    categoryNames: ["Recommended"],
  },
  {
    anilistId: 159441,
    title: "Pick Me Up",
    genres: "Action, Adventure, Fantasy",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx159441-9W8201jAT9Yv.jpg",
    synopsis: "In the impossibly difficult mobile gacha game 'Pick Me Up', master ranker Loki wakes up as a 1-star disposable hero Han Yslat inside the game world. To survive, he must climb the 100-floor Master Tower.",
    publicationStatus: "RELEASING",
    readingStatus: "reading",
    rating: 9,
    authors: "Hermit, Ntree",
    publishedFrom: "December 27, 2022",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.4,
    siteUrl: "https://anilist.co/manga/159441",
    categoryNames: ["Currently Bingeing", "Recommended"],
  },
  {
    anilistId: 106130,
    title: "Blue Lock",
    genres: "Action, Drama, Sports",
    coverUrl: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx106130-yPNeuSu75ey1.jpg",
    synopsis: "After a disastrous defeat at the 2018 World Cup, Japan's team struggles to regroup. But what's missing? An absolute Ace Striker, who can guide them to the win. The Japan Football Union is hell-bent on creating a striker who hungers for goals.",
    publicationStatus: "RELEASING",
    readingStatus: "planning",
    rating: 8,
    authors: "Muneyuki Kaneshiro, Yuusuke Nomura",
    publishedFrom: "August 1, 2018",
    publishedTo: "Unknown",
    chapters: null,
    volumes: null,
    malScore: 8.3,
    siteUrl: "https://anilist.co/manga/106130",
    categoryNames: ["Recommended"],
  },
];

/**
 * Seeds the starter dataset for a brand new session ID if it has 0 manga.
 */
export async function seedStarterLibraryIfEmpty(sessionId: string): Promise<void> {
  if (!sessionId) return;

  const count = await prisma.manga.count({
    where: { sessionId },
  });

  if (count > 0) return;

  // 1. Create categories for this session
  const categoryMap = new Map<string, number>();
  for (const cat of STARTER_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: {
        sessionId_name: {
          sessionId,
          name: cat.name,
        },
      },
      update: {},
      create: {
        sessionId,
        name: cat.name,
        color: cat.color,
      },
    });
    categoryMap.set(cat.name, created.id);
  }

  // 2. Insert starter manga
  for (const item of STARTER_MANGA) {
    const categoryConnect = item.categoryNames
      .map((name) => categoryMap.get(name))
      .filter((id): id is number => id !== undefined)
      .map((id) => ({ id }));

    await prisma.manga.create({
      data: {
        sessionId,
        anilistId: item.anilistId,
        title: item.title,
        genres: item.genres,
        coverUrl: item.coverUrl,
        synopsis: item.synopsis,
        publicationStatus: item.publicationStatus,
        readingStatus: item.readingStatus,
        rating: item.rating,
        authors: item.authors,
        publishedFrom: item.publishedFrom,
        publishedTo: item.publishedTo,
        chapters: item.chapters,
        volumes: item.volumes,
        malScore: item.malScore,
        siteUrl: item.siteUrl,
        categories: {
          connect: categoryConnect,
        },
      },
    });
  }
}
