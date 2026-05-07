export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork_url?: string;
  preview_url?: string | null;
  spotify_url?: string;
};

export type Moment = { start_ms: number; end_ms: number; label: string };

export type PreviewChip = {
  chip_id: string;
  track: Track;
  moment: Moment;
};

export type Deck = {
  deck_id: string;
  title: string;
  description: string;
  preview_chips: PreviewChip[];
};

export type QuestItem = {
  slot: 'safe' | 'stretch' | 'wildcard';
  track: Track;
  moment: Moment;
};

export type Quest = {
  quest_id: string;
  name: string;
  items: QuestItem[];
};

export type SessionStartResponse = {
  session_id: string;
  connected_spotify: boolean;
  user: null | { display_name: string; spotify_user_id: string };
}

export type SpotifyStatusResponse = {
  connected: boolean;
  user?: { display_name: string; spotify_user_id: string };
};

export type SpotifyPlaylist = {
  id: string;
  name: string;
  description?: string;
  public?: boolean;
};
