const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN as string;
const TIKTOK_SESSION = import.meta.env.VITE_TIKTOK_SESSION as string;
const ACTOR_ID = 'clockworks~tiktok-scraper';
const CACHE_KEY = 'tiktok_manager_data';
const CACHE_TTL = 3600 * 1000; // 1 hour

export interface TikTokVideo {
  id: string;
  text: string;
  createTimeISO: string;
  playCount: number;
  diggCount: number;
  shareCount: number;
  commentCount: number;
  collectCount: number;
  repostCount: number;
  webVideoUrl: string;
  videoMeta: {
    height: number;
    width: number;
    duration: number;
    coverUrl: string;
  };
  hashtags: { name: string }[];
  isAd: boolean;
  isPinned: boolean;
  isSlideshow: boolean;
  musicMeta: {
    musicName: string;
    musicAuthor: string;
    musicOriginal: boolean;
  };
}

export interface TikTokProfile {
  fans: number;
  heart: number;
  video: number;
  following: number;
  nickName: string;
  signature: string;
  bioLink: string;
  avatar: string;
}

export interface TikTokData {
  profile: TikTokProfile;
  videos: TikTokVideo[];
  fetchedAt: string;
}

function getCached(): TikTokData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: TikTokData & { cachedAt: number } = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setCache(data: TikTokData): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: Date.now() }));
}

// ─── Seed data — toutes les 9 vidéos scrapées le 22/03/2026 ──────────────────
const SEED_DATA: TikTokData = {
  profile: {
    fans: 335,
    heart: 37600,
    video: 9,
    following: 11,
    nickName: 'Tattoo Vision',
    signature: "J'ai enfin mis le lien du site\nArrêtez de me demander 😭",
    bioLink: 'tattoovisionapp.com',
    avatar: '',
  },
  videos: [
    {
      id: '7609729092702719264',
      text: 'Je suis allé trop loin non ?😭😂 #tattoo #prankvideo',
      createTimeISO: '2026-02-22T16:35:40.000Z',
      playCount: 458600,
      diggCount: 31000,
      shareCount: 2911,
      commentCount: 345,
      collectCount: 2252,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7609729092702719264',
      videoMeta: { height: 1024, width: 576, duration: 130, coverUrl: '' },
      hashtags: [{ name: 'tattoo' }, { name: 'prankvideo' }],
      isAd: true,
      isPinned: true,
      isSlideshow: false,
      musicMeta: { musicName: 'Mozart/Requiem "Lacrimosa"', musicAuthor: 'Mint', musicOriginal: false },
    },
    {
      id: '7610078223904345377',
      text: 'update: je suis viré 😭 #tatouage #prankvideo #humour',
      createTimeISO: '2026-02-23T15:10:30.000Z',
      playCount: 167400,
      diggCount: 4640,
      shareCount: 344,
      commentCount: 74,
      collectCount: 393,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7610078223904345377',
      videoMeta: { height: 1024, width: 576, duration: 66, coverUrl: '' },
      hashtags: [{ name: 'tatouage' }, { name: 'prankvideo' }, { name: 'humour' }],
      isAd: false,
      isPinned: true,
      isSlideshow: false,
      musicMeta: { musicName: 'Mozart/Requiem "Lacrimosa"', musicAuthor: 'Mint', musicOriginal: false },
    },
    {
      id: '7609214734159596822',
      text: 'On est 2 à avoir ce tatouage maintenant 😎 #tattoo #tatouage',
      createTimeISO: '2026-02-21T07:19:39.000Z',
      playCount: 37000,
      diggCount: 1238,
      shareCount: 59,
      commentCount: 15,
      collectCount: 417,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7609214734159596822',
      videoMeta: { height: 1024, width: 576, duration: 68, coverUrl: '' },
      hashtags: [{ name: 'tattoo' }, { name: 'tatouage' }],
      isAd: false,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'original sound', musicAuthor: 'rm.', musicOriginal: true },
    },
    {
      id: '7611187672748510496',
      text: 'MAIS ELLE A PRIER POUR MOI ?😭😭 #prank #tatouage',
      createTimeISO: '2026-02-26T14:55:36.000Z',
      playCount: 6712,
      diggCount: 372,
      shareCount: 23,
      commentCount: 16,
      collectCount: 28,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7611187672748510496',
      videoMeta: { height: 1024, width: 576, duration: 132, coverUrl: '' },
      hashtags: [{ name: 'prank' }, { name: 'tatouage' }],
      isAd: false,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'Mozart/Requiem "Lacrimosa"', musicAuthor: 'Mint', musicOriginal: false },
    },
    {
      id: '7610500555143712033',
      text: 'nannnn je suis allé beaucoup trop loin 😭😭😂 #tatouage #prankvideo',
      createTimeISO: '2026-02-24T18:29:16.000Z',
      playCount: 2504,
      diggCount: 111,
      shareCount: 8,
      commentCount: 4,
      collectCount: 10,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7610500555143712033',
      videoMeta: { height: 1024, width: 576, duration: 124, coverUrl: '' },
      hashtags: [{ name: 'tatouage' }, { name: 'prankvideo' }],
      isAd: false,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'Mozart/Requiem "Lacrimosa"', musicAuthor: 'Mint', musicOriginal: false },
    },
    {
      id: '7612961334891760928',
      text: 'je devrais faire quoi comme prochain tatouage ? #tatouage',
      createTimeISO: '2026-03-03T09:38:43.000Z',
      playCount: 1701,
      diggCount: 78,
      shareCount: 8,
      commentCount: 1,
      collectCount: 11,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7612961334891760928',
      videoMeta: { height: 0, width: 0, duration: 0, coverUrl: '' },
      hashtags: [{ name: 'tatouage' }],
      isAd: false,
      isPinned: false,
      isSlideshow: true,
      musicMeta: { musicName: 'original sound', musicAuthor: 'Dxrm', musicOriginal: true },
    },
    {
      id: '7612627439914585377',
      text: 'Fait ça avant de faire un tatouage ! #tatouage',
      createTimeISO: '2026-03-02T12:02:49.000Z',
      playCount: 1602,
      diggCount: 75,
      shareCount: 3,
      commentCount: 2,
      collectCount: 24,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7612627439914585377',
      videoMeta: { height: 1024, width: 576, duration: 23, coverUrl: '' },
      hashtags: [{ name: 'tatouage' }],
      isAd: true,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'Mozart/Requiem "Lacrimosa"', musicAuthor: 'Mint', musicOriginal: false },
    },
    {
      id: '7612215489930005793',
      text: 'je fais quoi comme prochain tatouage ?😂😭 #prankvideo #tattoo',
      createTimeISO: '2026-03-01T09:24:13.000Z',
      playCount: 1289,
      diggCount: 68,
      shareCount: 0,
      commentCount: 2,
      collectCount: 11,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7612215489930005793',
      videoMeta: { height: 1024, width: 576, duration: 25, coverUrl: '' },
      hashtags: [{ name: 'prankvideo' }, { name: 'tattoo' }],
      isAd: false,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'original sound', musicAuthor: 'Dxrm', musicOriginal: true },
    },
    {
      id: '7608867636260359446',
      text: 'Ne montrez pas ça aux tatoueurs 👹 #tatouage #tattoo #tattooideas #CapCut',
      createTimeISO: '2026-02-20T08:52:39.000Z',
      playCount: 1118,
      diggCount: 22,
      shareCount: 0,
      commentCount: 0,
      collectCount: 4,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7608867636260359446',
      videoMeta: { height: 1024, width: 576, duration: 32, coverUrl: '' },
      hashtags: [{ name: 'tatouage' }, { name: 'tattoo' }, { name: 'tattooideas' }, { name: 'capcut' }],
      isAd: true,
      isPinned: false,
      isSlideshow: false,
      musicMeta: { musicName: 'original sound', musicAuthor: 'enthusiast', musicOriginal: true },
    },
  ],
  fetchedAt: '2026-03-22T06:12:58.000Z',
};

export async function fetchTikTokData(forceRefresh = false): Promise<TikTokData> {
  if (!forceRefresh) {
    const cached = getCached();
    if (cached) return cached;
  }

  try {
    // Start the scraper run with session cookie for full access
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: ['kali.aitools'],
          resultsPerPage: 100,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
          cookie: TIKTOK_SESSION ? `sessionid=${TIKTOK_SESSION}` : undefined,
        }),
      }
    );
    const runJson = await res.json();
    const runId: string = runJson.data.id;
    const datasetId: string = runJson.data.defaultDatasetId;

    // Poll for completion
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
      );
      const statusJson = await statusRes.json();
      const status: string = statusJson.data.status;
      if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') break;
    }

    // Fetch dataset
    const itemsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&limit=200`
    );
    const rawItems: any[] = await itemsRes.json();

    if (!rawItems.length) {
      const existing = getCached();
      return existing ?? SEED_DATA;
    }

    // Normalise items shape
    const items: TikTokVideo[] = rawItems.map((item) => ({
      id: item.id,
      text: item.text ?? '',
      createTimeISO: item.createTimeISO ?? new Date(item.createTime * 1000).toISOString(),
      playCount: item.playCount ?? 0,
      diggCount: item.diggCount ?? 0,
      shareCount: item.shareCount ?? 0,
      commentCount: item.commentCount ?? 0,
      collectCount: item.collectCount ?? 0,
      repostCount: item.repostCount ?? 0,
      webVideoUrl: item.webVideoUrl ?? '',
      videoMeta: {
        height: item.videoMeta?.height ?? 0,
        width: item.videoMeta?.width ?? 0,
        duration: item.videoMeta?.duration ?? 0,
        coverUrl: item.videoMeta?.coverUrl ?? '',
      },
      hashtags: item.hashtags ?? [],
      isAd: item.isAd ?? false,
      isPinned: item.isPinned ?? false,
      isSlideshow: item.isSlideshow ?? false,
      musicMeta: {
        musicName: item.musicMeta?.musicName ?? '',
        musicAuthor: item.musicMeta?.musicAuthor ?? '',
        musicOriginal: item.musicMeta?.musicOriginal ?? false,
      },
    }));

    // Extract profile
    const firstItem = rawItems[0];
    const profile: TikTokProfile = {
      fans: firstItem.authorMeta?.fans ?? SEED_DATA.profile.fans,
      heart: firstItem.authorMeta?.heart ?? SEED_DATA.profile.heart,
      video: firstItem.authorMeta?.video ?? SEED_DATA.profile.video,
      following: firstItem.authorMeta?.following ?? SEED_DATA.profile.following,
      nickName: firstItem.authorMeta?.nickName ?? SEED_DATA.profile.nickName,
      signature: firstItem.authorMeta?.signature ?? SEED_DATA.profile.signature,
      bioLink: firstItem.authorMeta?.bioLink ?? SEED_DATA.profile.bioLink,
      avatar: firstItem.authorMeta?.avatar ?? '',
    };

    // Merge with seed to never lose videos
    const newIds = new Set(items.map((v) => v.id));
    const merged = [
      ...items,
      ...SEED_DATA.videos.filter((v) => !newIds.has(v.id)),
    ];

    const data: TikTokData = { profile, videos: merged, fetchedAt: new Date().toISOString() };
    setCache(data);
    return data;
  } catch (err) {
    console.error('[Apify] Error fetching TikTok data:', err);
    const cached = getCached();
    return cached ?? SEED_DATA;
  }
}

export function getSeedData(): TikTokData {
  const cached = getCached();
  return cached ?? SEED_DATA;
}
