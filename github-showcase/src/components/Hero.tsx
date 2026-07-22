import styles from './Hero.module.css';
import profileImg from '../assets/profile.png';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <p className={styles.kicker}>
          Full Stack Developer • Laravel • React • AI Automation
        </p>

        <div className={styles.messageRow}>
          <div className={styles.avatarFrame}>
            <img src={profileImg} alt="Martin" className={styles.avatar} />
          </div>

          <div className={styles.bubble}>
            <h1>Hi, I'm Martin</h1>
            <p className={styles.description}>
              Full-Stack Developer passionate about building scalable web applications, clean architectures, and AI-powered solutions. I have production experience developing Laravel-based ERP systems, REST APIs, and AI integrations. I love working with Laravel, React, TypeScript, and modern development tools while continuously learning new technologies. I'm driven by solving real-world problems and building software that delivers long-term value.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div>
          <span>Backend</span>
          <strong>Laravel · PHP · MySQL · C#</strong>
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
