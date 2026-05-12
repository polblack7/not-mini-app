import React from "react";
import useEmblaCarousel from "embla-carousel-react";
import { OpportunityCard } from "./OpportunityCard";

const EMBLA_OPTIONS = { align: "start", containScroll: "trimSnaps", dragFree: true };

export const OpportunitiesStrip = ({ items }) => {
  const [emblaRef] = useEmblaCarousel(EMBLA_OPTIONS);

  const slides = items.length ? items : [{ id: "empty", empty: true }];

  return (
    <div className="opps-viewport" ref={emblaRef}>
      <div className="opps-container">
        {slides.map((item, i) => (
          <div className="opps-slide" key={item.id || `${item.pair}-${item.timestamp}-${i}`}>
            {item.empty ? (
              <div className="opp-card opp-card--empty">No opportunities yet.</div>
            ) : (
              <OpportunityCard item={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
