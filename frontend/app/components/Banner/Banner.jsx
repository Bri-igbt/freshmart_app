"use client";

import Link from "next/link";
import { bannerData, BannerCluster } from "./bannerData.js";
import { bannerStyles as s } from "@/app/assets/dummyStyles.js";
import {
  ArrowRight,
  BadgePercent,
  Leaf,
  Sparkles,
  Truck,
  Star,
} from "lucide-react";

const iconMap = {
  Leaf,
  BadgePercent,
  Truck,
};

const Banner = () => {
  const [primaryButton, secondaryButton] = bannerData.buttons;

  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.innerContainer}>
          <div
            className="absolute inset-0"
            style={s.decorGradient1}
            aria-hidden="true"
          />
          <div
            className="absolute inset-0"
            style={s.decorGradient2}
            aria-hidden="true"
          />

          <div className={s.gridContainer}>
            <div className={s.leftColumn}>
              <div className={s.badge}>
                <Sparkles className={s.iconSmall} />
                {bannerData.badge}
              </div>

              <div className={s.headingWrapper}>
                <h1 className={s.heading}>
                  {bannerData.heading.line1}{" "}
                  <span className={s.headingHighlight}>
                    {bannerData.heading.line2}
                  </span>
                </h1>

                <p className={s.description}>{bannerData.description}</p>
              </div>

              <div className={s.buttonsWrapper}>
                <Link
                  href={primaryButton.href || "/#products"}
                  className={s.primaryButton}
                >
                  {primaryButton.label}
                  <ArrowRight className={s.iconSmall} />
                </Link>

                <Link
                  href={secondaryButton.href || "/#products"}
                  className={s.secondaryButton}
                >
                  <Leaf className={s.iconSmall} />
                  {secondaryButton.label}
                </Link>
              </div>

              <div className={s.cardsContainer}>
                {bannerData.cards.map((item) => {
                  const Icon = iconMap[item.icon];

                  return (
                    <div key={item.title} className={s.card}>
                      {Icon && <Icon className={s.cardIcon} />}
                      <p className={s.cardTitle}>{item.title}</p>
                      <p className={s.cardText}>{item.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className={s.trustMessage}>
                <Star className={s.starIcon} />
                <span>Trusted by hundreds of happy customers</span>
              </div>
            </div>

            <div className={s.rightColumn}>
              <BannerCluster images={bannerData.images} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;