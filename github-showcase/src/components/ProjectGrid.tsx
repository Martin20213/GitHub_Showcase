import ProjectCard from './ProjectCard';
import styles from './ProjectGrid.module.css';
import type { Project } from '../hooks/useGithubRepos';

type Props = {
  title: string;
  projects: Project[];
  variant?: 'default' | 'recent';
};

export default function ProjectGrid({ title, projects, variant='default' }: Props) {
  if (!projects.length) return null;

  return (
    <section className={`project-grid ${variant === 'recent' ? 'project-grid--recent' : ''}`}>
      <h2>{title}</h2>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}