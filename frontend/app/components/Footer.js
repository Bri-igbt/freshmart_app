"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getCategories } from "@/app/api/api.js";
import { footerStyles as s } from "@/app/assets/dummyStyles.js";
import freshmartLogo from "@/app/assets/freshmart-logo.svg";
import { ArrowUpRight, Mail, Phone, MapPin, Globe } from "lucide-react";

const CONTACT = {
  email: "contact@freshmart.com",
  phone: "+234 813 808 1564",
  location: "Lagos, Nigeria",
};

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/#products" },
  { label: "Hookah", href: "/hookah-products" },
  { label: "Contact", href: "/#contact" },
];

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getCategories();
        setCategories(data.categories || []);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCategories();
  }, []);

  const footerCategories = [
    { name: "All Products", href: "/#products" },
    ...categories.map((category) => ({
      name: category.categoryName,
      href: `/product/${encodeURIComponent(category.categoryName)}`,
    })),
  ];

  return (
    <footer id="contact" className={s.footer}>
      <div className="pointer-events-none absolute inset-0">
        <div className={s.decorGlow1} />
        <div className={s.decorGlow2} />
        <div className={s.decorGlow3} />
      </div>

      <div className={s.container}>
        <div className={s.grid}>
          <div className={s.brandWrapper}>
            <div className={s.brandHeader}>
              <div className={s.logoContainer}>
                <div className={s.logoDot} />
                <Image
                  src={freshmartLogo}
                  alt="FreshMart Grocery logo"
                  className={s.logoImage}
                  width={100}
                  height={100}
                />
              </div>

              <div>
                <h2 className={s.brandTitle}>
                  FreshMart <span className={s.brandHighlight}>Grocery</span>
                </h2>
              </div>
            </div>

            <p className={s.brandDescription}>
              Shop fresh items, snacks, drinks, and daily essentials in one
              place with a fast, simple, and premium shopping experience.
            </p>
          </div>

          <div>
            <h3 className={s.sectionTitle}>Quick Links</h3>
            <ul className={s.linkList}>
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className={s.linkItem}>
                    <span className={s.linkBullet} />
                    {item.label}
                    <ArrowUpRight className={s.linkArrow} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={s.categoriesTitle}>Grocery Aisles</h3>

            <div className={s.categoriesGrid}>
              {footerCategories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className={s.categoryLink}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className={s.sectionTitle}>Contact</h3>

            <div className={s.contactList}>
              <div className={s.contactItem}>
                <Mail className={s.contactIcon} />
                <span>{CONTACT.email}</span>
              </div>

              <div className={s.contactItem}>
                <Phone className={s.contactIcon} />
                <span>{CONTACT.phone}</span>
              </div>

              <div className={s.contactItem}>
                <MapPin className={s.contactIcon} />
                <span>{CONTACT.location}</span>
              </div>

              <a
                href="https://cbright.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className={s.websiteButton}
              >
                <Globe className={s.websiteIcon} />
                Visit Website
                <ArrowUpRight className={s.websiteArrow} />
              </a>
            </div>
          </div>
        </div>

        <div className={s.bottomBar}>
          <div className={s.bottomBarInner}>
            <p className={s.copyright}>
              © {new Date().getFullYear()} FreshMart. All rights reserved.
            </p>

            <div className={s.designerWrapper}>
              <span className={s.designerLabel}>Designed by</span>
              <a
                href="https://cbright.vercel.app"
                target="_blank"
                rel="noreferrer"
                className={s.designerLink}
              >
                Hexagon Digital Services
                <ArrowUpRight className={s.designerArrow} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes torchMove {
          0% { transform: translateX(-20%) translateY(0px); opacity: 0.45; }
          50% { transform: translateX(20%) translateY(8px); opacity: 0.75; }
          100% { transform: translateX(-20%) translateY(0px); opacity: 0.45; }
        }
      `}</style>

      <div className={s.glowLine} style={s.glowAnimation} />
    </footer>
  );
};

export default Footer;
