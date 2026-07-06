import styles from './ProjectCard.module.css';
import type { Project } from '../hooks/useGithubRepos';

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  return (
    <article className={styles.card}>
      <a className={styles.clickArea} href={project.html_url} target="_blank" rel="noreferrer">
        <div className={styles.topRow}>
          <h3>{project.title}</h3>
          {project.featured && <span className={styles.badge}>Featured</span>}
        </div>

        <p className={styles.description}>
          {project.description || 'No description provided.'}
        </p>

        <div className={styles.tags}>
          {project.stack.map((item) => (
            <span key={item} className={styles.tag}>
              {item}
            </span>
          ))}
        </div>

        <div className={styles.actions}>
          <span className={styles.meta}>
            Updated {new Date(project.updated_at).toLocaleDateString()}
          </span>
          <div className={styles.buttons}>
            <span className={styles.button}>GitHub</span>
            {project.homepage ? <span className={styles.buttonGhost}>Live Demo</span> : null}
          </div>
        </div>
      </a>
    </article>
  );
}