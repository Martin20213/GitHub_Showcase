import { useEffect, useMemo, useState } from 'react';
import config from '../projects.config.json';

type GithubRepo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  updated_at: string;
  homepage: string | null;
  fork?: boolean;
  owner?: {
    login: string;
  };
};

type ProjectOverride = {
  visible?: boolean;
  title?: string;
  description?: string;
  stack?: string[];
  featured?: boolean;
  order?: number;
};

export type Project = {
  id: number;
  name: string;
  title: string;
  description: string;
  html_url: string;
  homepage: string;
  language: string;
  updated_at: string;
  stack: string[];
  featured: boolean;
  order: number;
};

type LanguagesResponse = Record<string, number>;

const projectsConfig = config as Record<string, ProjectOverride>;

const USERNAME = import.meta.env.VITE_GITHUB_USERNAME || 'octocat';
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {})
    }
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function fetchLanguages(owner: string, repo: string): Promise<string[]> {
  const data = await fetchJson<LanguagesResponse>(
    `https://api.github.com/repos/${owner}/${repo}/languages`
  );

  if (!data) return [];

  return Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language);
}

async function normalizeRepo(repo: GithubRepo): Promise<Project | null> {
  const override = projectsConfig[repo.name] || {};
  if (override.visible === false) return null;

  const owner = repo.owner?.login || USERNAME;

  const languages = override.stack?.length ? [] : await fetchLanguages(owner, repo.name);

  const stack =
    Array.isArray(override.stack) && override.stack.length
      ? override.stack
      : languages.length
        ? languages
        : [repo.language].filter(Boolean) as string[];

  return {
    id: repo.id,
    name: repo.name,
    title: override.title || repo.name,
    description: override.description || repo.description || '',
    html_url: repo.html_url,
    homepage: repo.homepage || '',
    language: repo.language || '',
    updated_at: repo.updated_at,
    stack,
    featured: Boolean(override.featured),
    order: Number.isFinite(override.order) ? (override.order as number) : 9999
  };
}

export function useGithubRepos() {
  const [repos, setRepos] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const data = await fetchJson<GithubRepo[]>(
          `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`
        );

        if (!data) {
          throw new Error('GitHub API request failed');
        }

        const visibleRepos = data.filter((repo) => !repo.fork);
        const normalized = await Promise.all(visibleRepos.map(normalizeRepo));
        const filtered = normalized.filter((repo): repo is Project => repo !== null);

        if (!cancelled) setRepos(filtered);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load repositories');
          setRepos([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => ({ repos, loading, error, username: USERNAME }), [repos, loading, error]);
};
