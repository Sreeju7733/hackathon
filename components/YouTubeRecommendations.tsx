"use client";

import { useState } from "react";
import {
  IconBrandYoutube,
  IconExternalLink,
  IconPlayerPlay,
  IconX,
} from "@tabler/icons-react";
import { getYouTubeRecommendations, type YouTubeRecommendation } from "../lib/youtube";
import type { ExplanationPlan } from "../lib/explanation";

export function YouTubeRecommendations({
  plan,
  latex,
}: {
  plan: ExplanationPlan | null;
  latex?: string;
}) {
  const recommendations = getYouTubeRecommendations(plan, latex);
  const [activeEmbedId, setActiveEmbedId] = useState<string | null>(null);

  if (!recommendations.length) return null;

  return (
    <div className="youtube-recommendations">
      <div className="youtube-header">
        <div className="youtube-title">
          <IconBrandYoutube className="youtube-icon" size={22} />
          <h4>Recommended Video Lessons</h4>
        </div>
        <span className="youtube-badge">YouTube</span>
      </div>

      <div className="youtube-grid">
        {recommendations.map((video) => {
          const isEmbedding = activeEmbedId === video.id;

          return (
            <div key={video.id} className="youtube-card">
              <div className="youtube-card-header">
                <span className="youtube-channel">{video.channel}</span>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="youtube-open-link"
                  title="Open on YouTube"
                >
                  <IconExternalLink size={14} />
                  <span>Watch on YouTube</span>
                </a>
              </div>

              <h5 className="youtube-card-title">{video.title}</h5>
              <p className="youtube-card-desc">{video.description}</p>

              {video.videoId ? (
                <div className="youtube-actions">
                  <button
                    className="youtube-embed-btn"
                    onClick={() =>
                      setActiveEmbedId(isEmbedding ? null : video.id)
                    }
                  >
                    {isEmbedding ? (
                      <>
                        <IconX size={15} /> Close Video
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay size={15} /> Play In-App
                      </>
                    )}
                  </button>
                </div>
              ) : null}

              {isEmbedding && video.videoId && (
                <div className="youtube-embed-container">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
