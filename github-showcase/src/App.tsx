import { useMemo, useState } from 'react';
import { useGithubRepos } from './hooks/useGithubRepos';
import Hero from './components/Hero';
import ProjectGrid from './components/ProjectGrid';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import './styles/global.css';

const FILTERS = ['All', 'PHP', 'JavaScript', 'TypeScript', 'C#'] as const;

export default function App() {
  const { repos, loading, error, username } = useGithubRepos();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const { featured, recent, all } = useMemo(() => {
    const matchesFilter = (project: (typeof repos)[number]) => {
      if (filter === 'All') return true;
      return [project.language, ...project.stack].some(
        (x) => x && x.toLowerCase() === filter.toLowerCase()
      );
    };

    const visible = repos
      .filter(matchesFilter)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

    return {
      featured: visible.filter((p) => p.featured),
      recent: visible.slice(0, 3),
      all: visible
    };
  }, [repos, filter]);

  return (
    <main className="app-shell">
      <div className="app-container">
        <Hero />
        <AboutSection />
        <section className="toolbar">
          <div>
            <h2>Projects</h2>
            <p>Browse featured work and the full repository list.</p>
          </div>
          <div className="filters" role="tablist" aria-label="Project filters">
            {FILTERS.map((item) => (
              <button
                key={item}
                className={item === filter ? 'filter active' : 'filter'}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <section className="skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="skeleton-card" key={i} />
            ))}
          </section>
        )}

        {error && <div className="error">GitHub data could not be loaded: {error}</div>}

        {!loading && !error && (
          <>
            <ProjectGrid title="Featured Projects" projects={featured} />
            <ProjectGrid title="Recent Projects" projects={recent} variant="recent" />
            <ProjectGrid title="All Projects" projects={all} />
          </>
        )}

        <Footer username={username} />
      </div>
    </main>
  );
}