import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, CalendarDays, Sparkles, Users } from 'lucide-react';
import { Logo } from './Logo';

interface HeroCivicSceneProps {
  imageUrl?: string;
  title: string;
  date: string;
}

const STORY_TITLE_LIMIT = 84;

const getStoryTitle = (title: string) => {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();

  if (normalizedTitle.length <= STORY_TITLE_LIMIT) return normalizedTitle;

  return `${normalizedTitle.slice(0, STORY_TITLE_LIMIT - 1).trimEnd()}…`;
};

export const HeroCivicScene: React.FC<HeroCivicSceneProps> = ({ imageUrl, title, date }) => {
  const shouldReduceMotion = useReducedMotion();
  const storyTitle = getStoryTitle(title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 34, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`hero-scene ${shouldReduceMotion ? 'hero-scene--still' : ''}`}
      aria-label="Sorotan kegiatan Karang Taruna"
      role="img"
    >
      <div className="hero-scene__halo" aria-hidden="true" />
      <div className="hero-scene__world" aria-hidden="true">
        <div className="hero-scene__orbit hero-scene__orbit--one" />
        <div className="hero-scene__orbit hero-scene__orbit--two" />
        <div className="hero-scene__platform" />

        <div className="hero-scene__frame hero-scene__frame--rear" />
        <div className="hero-scene__story">
          <div className="hero-scene__story-image">
            {imageUrl ? <img src={imageUrl} alt="" /> : <div className="hero-scene__image-fallback" />}
            <div className="hero-scene__image-overlay" />
          </div>
          <div className="hero-scene__story-meta">
            <span className="hero-scene__tag"><Activity /> Kegiatan terkini</span>
            <strong title={title} aria-label={title}>{storyTitle}</strong>
            <span className="hero-scene__story-date"><CalendarDays /> {date}</span>
          </div>
        </div>

        <div className="hero-scene__brand">
          <Logo variant="white" size="md" className="h-7 w-auto" />
          <span>RW 07</span>
        </div>
        <div className="hero-scene__token hero-scene__token--people"><Users /><span>PEMUDA</span></div>
        <div className="hero-scene__token hero-scene__token--spark"><Sparkles /><span>BERGERAK</span></div>
        <div className="hero-scene__token hero-scene__token--link"><ArrowUpRight /><span>2026</span></div>
      </div>
    </motion.div>
  );
};
