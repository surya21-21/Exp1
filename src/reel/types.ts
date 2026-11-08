export type Word = {text: string; start: number; end: number; key?: boolean};

export type CaptionLine = {start: number; end: number; text: string; words?: Word[]};

export type Repo = {
  full: string;
  owner: string;
  name: string;
  description: string;
  stars: number | null;
  forks: number | null;
  language: string | null;
  openIssues: number | null;
  index: number;
  replaces: string;
  price: number | null;
};

export type SectionType = "hook" | "repo" | "text" | "cta";

export type Section = {
  type: SectionType;
  start: number;
  end: number;
  text: string;
  keywords: string[];
  arg?: string;
  repo?: Repo;
};

export type ReelProps = {
  accent: string;
  sections: Section[];
  captions: CaptionLine[];
  totalMonthly: number;
  repoCount: number;
  ctaKeyword: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
};
