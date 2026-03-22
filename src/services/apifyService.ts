const APIFY_TOKEN = import.meta.env.VITE_APIFY_TOKEN as string;
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

async function runScraper(): Promise<string> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profiles: ['kali.aitools'],
        resultsType: 'videos',
        resultsLimit: 50,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      }),
    }
  );
  const json = await res.json();
  return json.data.defaultDatasetId as string;
}

async function waitForRun(runId: string): Promise<void> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
    );
    const json = await res.json();
    const status: string = json.data.status;
    if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'ABORTED') return;
  }
}

async function fetchDataset(datasetId: string): Promise<TikTokVideo[]> {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&limit=200`
  );
  return res.json();
}

// The scraped data we already have — used as seed/fallback
const SEED_DATA: TikTokData = {
  profile: {
    fans: 335,
    heart: 37600,
    video: 9,
    following: 11,
    nickName: 'Tattoo Vision',
    signature: "J'ai enfin mis le lien du site\nArrêtez de me demander",
    bioLink: 'tattoovisionapp.com',
    avatar: '',
  },
  videos: [
    {
      id: '7609729092702719264',
      text: 'Je suis allé trop loin non ? #tattoo #prankvideo',
      createTimeISO: '2026-02-22T16:35:40.000Z',
      playCount: 458600,
      diggCount: 31000,
      shareCount: 2911,
      commentCount: 344,
      collectCount: 2252,
      repostCount: 0,
      webVideoUrl: 'https://www.tiktok.com/@kali.aitools/video/7609729092702719264',
      videoMeta: { height: 1024, width: 576, duration: 130, coverUrl: '' },
      hashtags: [{ name: 'tattoo' }, { name: 'prankvideo' }],
      isAd: true,
      isPinned: true,
      isSlideshow: false,
      musicMeta: {
        musicName: 'Mozart/Requiem "Lacrimosa"',
        musicAuthor: 'Mint',
        musicOriginal: false,
      },
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
  ],
  fetchedAt: new Date().toISOString(),
};

export async function fetchTikTokData(forceRefresh = false): Promise<TikTokData> {
  if (!forceRefresh) {
    const cached = getCached();
    if (cached) return cached;
  }

  try {
    // Start the scraper run
    const res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: ['kali.aitools'],
          resultsType: 'videos',
          resultsLimit: 50,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
        }),
      }
    );
    const runJson = await res.json();
    const runId: string = runJson.data.id;
    const datasetId: string = runJson.data.defaultDatasetId;

    // Poll for completion
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
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
    const items: TikTokVideo[] = await itemsRes.json();

    if (!items.length) {
      // Return seed + cached merged
      const existing = getCached();
      return existing ?? SEED_DATA;
    }

    // Extract profile from first item
    const firstItem = items[0] as any;
    const profile: TikTokProfile = {
      fans: firstItem.authorMeta?.fans ?? 0,
      heart: firstItem.authorMeta?.heart ?? 0,
      video: firstItem.authorMeta?.video ?? 0,
      following: firstItem.authorMeta?.following ?? 0,
      nickName: firstItem.authorMeta?.nickName ?? 'Tattoo Vision',
      signature: firstItem.authorMeta?.signature ?? '',
      bioLink: firstItem.authorMeta?.bioLink ?? 'tattoovisionapp.com',
      avatar: firstItem.authorMeta?.avatar ?? '',
    };

    // Merge with seed data to keep all known videos
    const existing = getCached();
    const allVideos = existing?.videos ?? SEED_DATA.videos;
    const newIds = new Set(items.map((v) => v.id));
    const merged = [
      ...items,
      ...allVideos.filter((v) => !newIds.has(v.id)),
    ];

    const data: TikTokData = {
      profile,
      videos: merged,
      fetchedAt: new Date().toISOString(),
    };

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
