import flowers from "@/assets/p-flowers.webp";
import saree from "@/assets/p-saree.webp";
import jewellery from "@/assets/p-jewellery.webp";
import makeup from "@/assets/p-makeup.webp";
import skincare from "@/assets/p-skincare.webp";
import shoes from "@/assets/p-shoes.webp";
import mehendi from "@/assets/p-mehendi.webp";
import wedding from "@/assets/hero-bride.webp";
import holud from "@/assets/o-holud.webp";
import reception from "@/assets/o-reception.webp";
import engagement from "@/assets/o-engagement.webp";

export const BRAND = {
  name: "SifatMart",
  tagline: "Beauty for Your Special Moments",
  owner: "Rowsan Parvin",
  location: "Saidpur, Nilphamari, Bangladesh",
  hotline: "01997974394",
  hours: "Mon – Sun | 9:00 AM – 10:00 PM",
};

export type Category = { slug: string; name: string; group: "Bridal" | "Beauty" | "Fashion"; image: string; blurb: string };
export const categories: Category[] = [
  { slug: "bridal-flower-sets", name: "Bridal Flower Sets", group: "Bridal", image: flowers, blurb: "Fresh-look floral garlands, tiaras and wrist sets." },
  { slug: "sarees-dresses", name: "Sarees & Dresses", group: "Fashion", image: saree, blurb: "Banarasi, Katan and festive sarees for every event." },
  { slug: "jewellery", name: "Jewellery", group: "Bridal", image: jewellery, blurb: "Kundan, pearl and gold-tone bridal sets." },
  { slug: "makeup-skincare", name: "Makeup & Skincare", group: "Beauty", image: makeup, blurb: "Authentic makeup and skincare essentials." },
  { slug: "bridal-shoes", name: "Bridal Shoes", group: "Fashion", image: shoes, blurb: "Embellished heels and flats for the big day." },
  { slug: "mehendi-accessories", name: "Mehendi & Accessories", group: "Bridal", image: mehendi, blurb: "Mehendi cones, bangles and finishing touches." },
];

export type Occasion = { slug: string; name: string; image: string; blurb: string };
export const occasions: Occasion[] = [
  { slug: "wedding", name: "Wedding", image: wedding, blurb: "Everything for the bride's most beautiful day." },
  { slug: "gaye-holud", name: "Gaye Holud", image: holud, blurb: "Bright yellows, marigolds and joyful details." },
  { slug: "reception", name: "Reception", image: reception, blurb: "Elegant looks for an evening to remember." },
  { slug: "engagement", name: "Engagement", image: engagement, blurb: "Delicate pieces for a promise made." },
];

export type Product = {
  slug: string; name: string; price: number; oldPrice?: number; category: string; occasions: string[];
  image: string; rating: number; reviews: number; description: string; bestSeller?: boolean; stock: number;
};

export const products: Product[] = [
  { slug: "bridal-flower-set", name: "Bridal Flower Set", price: 1850, oldPrice: 2200, category: "bridal-flower-sets", occasions: ["wedding", "reception"], image: flowers, rating: 4.8, reviews: 120, bestSeller: true, stock: 25, description: "A complete red and white rose set: hair garland plus two wrist corsages, finished with satin ribbon." },
  { slug: "red-banarasi-saree", name: "Red Banarasi Saree", price: 2450, oldPrice: 2900, category: "sarees-dresses", occasions: ["wedding"], image: saree, rating: 4.7, reviews: 98, bestSeller: true, stock: 12, description: "Rich red silk with a woven gold zari border and butti motifs. Comes with unstitched blouse piece." },
  { slug: "kundan-bridal-necklace-set", name: "Kundan Bridal Necklace Set", price: 3200, oldPrice: 3800, category: "jewellery", occasions: ["wedding", "reception"], image: jewellery, rating: 4.9, reviews: 64, bestSeller: true, stock: 8, description: "Statement kundan choker with pearl drops and matching chandelier earrings." },
  { slug: "makeup-essentials-set", name: "Makeup Essentials Set", price: 2200, category: "makeup-skincare", occasions: ["wedding", "reception", "engagement"], image: makeup, rating: 4.6, reviews: 67, bestSeller: true, stock: 30, description: "Three lipsticks, liquid foundation, pressed powder and a three-piece brush set." },
  { slug: "skincare-bundle", name: "Skincare Bundle", price: 1750, category: "makeup-skincare", occasions: ["wedding", "engagement"], image: skincare, rating: 4.7, reviews: 76, bestSeller: true, stock: 20, description: "Cleanser, toner, serum, moisturiser and night cream for glowing pre-wedding skin." },
  { slug: "embellished-bridal-heels", name: "Embellished Bridal Heels", price: 1350, oldPrice: 1600, category: "bridal-shoes", occasions: ["wedding", "reception"], image: shoes, rating: 4.5, reviews: 65, bestSeller: true, stock: 15, description: "Ivory pointed heels hand-finished with pearls, crystals and gold thread flowers." },
  { slug: "mehendi-bangle-set", name: "Mehendi & Bangle Set", price: 950, category: "mehendi-accessories", occasions: ["gaye-holud", "wedding"], image: mehendi, rating: 4.6, reviews: 41, stock: 40, description: "Six natural mehendi cones with a set of gold-tone stone bangles." },
  { slug: "marigold-holud-set", name: "Marigold Holud Flower Set", price: 1250, category: "bridal-flower-sets", occasions: ["gaye-holud"], image: holud, rating: 4.8, reviews: 52, stock: 18, description: "Marigold tiara, necklace and bracelets for a cheerful Gaye Holud look." },
  { slug: "pearl-engagement-ring", name: "Pearl Engagement Ring", price: 850, category: "jewellery", occasions: ["engagement"], image: engagement, rating: 4.7, reviews: 33, stock: 22, description: "Gold-tone ring with a lustrous faux pearl and side stones. Adjustable size." },
  { slug: "pastel-reception-lehenga", name: "Pastel Reception Lehenga", price: 5600, oldPrice: 6500, category: "sarees-dresses", occasions: ["reception", "engagement"], image: reception, rating: 4.6, reviews: 21, stock: 5, description: "Blush net lehenga with sequin and thread embroidery and a sheer dupatta." },
];

export const formatTaka = (n: number) => `৳ ${n.toLocaleString("en-IN")}`;
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getOccasion = (slug: string) => occasions.find((o) => o.slug === slug);

export const DELIVERY = { inside: 60, outside: 120 } as const;
export type DeliveryZone = keyof typeof DELIVERY;
