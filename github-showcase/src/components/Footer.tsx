import styles from "./Footer.module.css";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

type Props = {
  username: string;
};

export default function Footer({ username }: Props) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>{username}</p>
          <p className={styles.text}>
            GitHub-based portfolio dashboard powered by React, Vite, and GitHub API.
          </p>
        </div>

        <div className={styles.links}>
          <a
            href={`https://github.com/${username}`}
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub className={styles.icon} />
          </a>

          <a
            href="https://www.linkedin.com/in/martin-stecenk%C3%B3-83b434381/"
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedin className={styles.icon} />
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2026 {username}. All rights reserved.</span>
      </div>
    </footer>
  );
}