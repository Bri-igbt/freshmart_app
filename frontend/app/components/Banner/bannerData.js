import C1 from "@/app/assets/C1" 
import TL1 from "@/app/assets/TL1"; 
import TR1 from "@/app/assets/TR1"; 
import LM1 from "@/app/assets/LM1"; 
import RM1 from "@/app/assets/RM1"; 
import BL1 from "@/app/assets/BL1"; 
import BR1 from "@/app/assets/BR1"; 
import Image from "next/image.js";

export const bannerData = {
  badge: "Freshness Delivered Daily",
  heading: {
    line1: "Fresh Vegetables,",
    line2: "Best Deals & Offers",
  },
  description:
    "Discover farm-fresh vegetables, healthy greens, and seasonal produce with premium quality and fast delivery.",

  buttons: [
    { label: "Shop Now", type: "primary" },
    { label: "View Fresh Picks", type: "secondary" },
  ],

  cards: [
    {
      icon: "Leaf",
      title: "100% Organic",
      text: "Clean and fresh produce",
    },
    {
      icon: "BadgePercent",
      title: "Best Offers",
      text: "Save more every week",
    },
    {
      icon: "Truck",
      title: "Fast Delivery",
      text: "Doorstep delivery service",
    },
  ],

  images: {
    center: C1,
    topLeft: TL1,
    topRight: TR1,
    leftMiddle: LM1,
    rightMiddle: RM1,
    bottomLeft: BL1,
    bottomRight: BR1,
  },
};

export const BannerLines = () => {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 520 340"
      fill="none"
    >
      <line
        x1="260"
        y1="170"
        x2="170"
        y2="60"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      <line
        x1="260"
        y1="170"
        x2="350"
        y2="60"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      <line
        x1="260"
        y1="170"
        x2="122"
        y2="208"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      <line
        x1="260"
        y1="170"
        x2="398"
        y2="208"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      <line
        x1="260"
        y1="170"
        x2="170"
        y2="272"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.4"
      />

      <line
        x1="260"
        y1="170"
        x2="350"
        y2="272"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.4"
      />
    </svg>
  );
};

export const BannerCluster = ({ images }) => {
  return (
    <div className="relative h-85 w-full max-w-130">
      <div className="absolute inset-0 animate-[spin_24s_linear_infinite]">
        <BannerLines />

        <div className="absolute left-37.5 top-5 h-14 w-14 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-16 sm:w-16">
          <Image
            src={images.topLeft}
            alt="Fresh tomatoes"
            className="h-full w-full object-cover"
            width={100}
            height={100}
          />
        </div>

        <div className="absolute right-37.5 top-5 h-14 w-14 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-16 sm:w-16">
          <Image
            src={images.topRight}
            alt="Organic carrots"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute left-20.5 top-37.5 h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-18 sm:w-18">
          <Image
            src={images.leftMiddle}
            alt="Fresh greens"
            className="h-full w-full object-cover"
            width={100}
            height={100}
          />
        </div>

        <div className="absolute right-20.5 top-37.5 h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-18 sm:w-18">
          <Image
            src={images.rightMiddle}
            alt="Vegetable bowl"
            className="h-full w-full object-cover"
            width={100}
            height={100}
          />
        </div>

        <div className="absolute left-37.5 top-63.5 h-14 w-14 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-16 sm:w-16">
          <Image
            src={images.bottomLeft}
            alt="Farm fresh produce"
            className="h-full w-full object-cover"
            width={100}
            height={100}
          />
        </div>

        <div className="absolute right-37.5 top-63.5 h-14 w-14 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-16 sm:w-16">
          <Image
            src={images.bottomRight}
            alt="Healthy vegetables"
            className="h-full w-full object-cover"
            width={100}
            height={100}
          />
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 overflow-hidden  sm:h-44 sm:w-44">
        <Image
          src={images.center}
          alt="Fresh vegetables"
          className="h-full w-full object-cover"
          width={100}
          height={100}
        />
      </div>
    </div>
  );
};

