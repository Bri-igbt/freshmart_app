"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories } from "@/app/api/api.js";
import { productsPageStyles as s } from "@/app/assets/dummyStyles.js";
import Image from "next/image";

const ProductPage = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getCategories();
        setCategories(data.categories);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section id="products" className={s.section}>
      <div
        style={s.gradientBackground}
        className="pointer-events-none absolute inset-0"
      />

      <div className={s.innerContainer}>
        <div className={s.grid}>
          {categories.map((category, index) => (
            <Link
              key={category._id}
              href={`/product/${encodeURIComponent(category.categoryName)}`}
              className={s.categoryLink}
              style={{
                animation: `fadeup 0.6s ease both`,
                animationDelay: `${index * 60}ms`,
              }}
            >
              <Image
                src={category.image?.url}
                className={s.categoryImage}
                alt="image"
                width={100}
                height={100}
              />

              <h3 className={s.categoryName}>{category.categoryName}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductPage
