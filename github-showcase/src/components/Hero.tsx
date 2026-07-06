import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.kicker}>
          Full Stack Developer • Laravel • React • AI Automation
        </p>

        <h1>Hi, I'm Martin</h1>

        <p className={styles.description}>
          Full Stack Developer passionate about building scalable web applications,
          clean architectures and AI-powered solutions. I love working with Laravel,
          React, TypeScript and modern development tools while continuously learning
          new technologies.
        </p>
      </div>

      <div className={styles.panel}>
        <div>
          <span>Backend</span>
          <strong>Laravel · PHP · MySQL</strong>
        </div>

        <div>
          <span>Frontend</span>
          <strong>React · TypeScript · Tailwind</strong>
        </div>

        <div>
          <span>AI & Automation</span>
          <strong>OpenAI · Claude · Vapi AI · n8n </strong>
        </div>

        <div>
          <span>Tools</span>
          <strong>Git · Azure · GitHub · Cursor </strong>
        </div>
      </div>
    </section>
  );
}