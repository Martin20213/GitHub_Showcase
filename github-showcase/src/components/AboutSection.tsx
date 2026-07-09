import { GraduationCap, Briefcase, Bot } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './AboutSection.module.css';

type AboutBlock = {
  icon: LucideIcon;
  title: string;
  lines: string[];
};

const ABOUT_DATA: AboutBlock[] = [
  {
    icon: GraduationCap,
    title: 'Education',
    lines: [
      "Bachelor's Degree in Computer Engineering (BSc)",
      'Software Developer Vocational Qualification'
    ]
  },
  {
    icon: Briefcase,
    title: 'Experience',
    lines: [
      '~1 Year Software Development Experience in Production Environment',
      'Scrum • End-to-End Features • Bug Fixing'
    ]
  },
  {
    icon: Bot,
    title: 'AI',
    lines: [
      'IBM Artificial Intelligence Fundamentals',
      'LLM`s • RAG • Vector Databases • MCP',
      'OpenAI • Claude • n8n • Vapi AI'
    ]
  }
];

export default function AboutSection() {
  return (
    <section className={styles.about}>
      {ABOUT_DATA.map((block) => {
        const Icon = block.icon;
        return (
          <div className={styles.block} key={block.title}>
            <h3 className={styles.blockTitle}>
              <Icon size={18} strokeWidth={1.75} className={styles.icon} />
              {block.title}
            </h3>
            <ul className={styles.lines}>
              {block.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}