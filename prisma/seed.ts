import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
    },
  });

  const accessories = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: {},
    create: {
      name: 'Accessories',
      slug: 'accessories',
    },
  });

  // Create products (fashion-focused)
  const products = [
    {
      name: 'Oversized Wool Blazer',
      slug: 'oversized-wool-blazer',
      description: 'Timeless oversized blazer in premium Italian wool. Sharp tailoring meets relaxed silhouette.',
      price: 289.99,
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
      categoryId: clothing.id,
    },
    {
      name: 'Cashmere Turtleneck',
      slug: 'cashmere-turtleneck',
      description: 'Luxurious cashmere knit. Soft, warm, and effortlessly elegant.',
      price: 189.99,
      imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600',
      categoryId: clothing.id,
    },
    {
      name: 'Tailored Trousers',
      slug: 'tailored-trousers',
      description: 'High-waisted tailored trousers. Clean lines, refined fit.',
      price: 159.99,
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
      categoryId: clothing.id,
    },
    {
      name: 'Leather Crossbody Bag',
      slug: 'leather-crossbody-bag',
      description: 'Handcrafted leather crossbody. Minimal design, maximum impact.',
      price: 249.99,
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
      categoryId: accessories.id,
    },
    {
      name: 'Silk Scarf',
      slug: 'silk-scarf',
      description: 'Printed silk scarf. A declaration of elegance.',
      price: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600',
      categoryId: accessories.id,
    },
    {
      name: 'Minimalist Watch',
      slug: 'minimalist-watch',
      description: 'Swiss movement, leather strap. Understated luxury.',
      price: 349.99,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
      categoryId: accessories.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Create blog posts (SEO content)
  const posts = [
    {
      title: 'The Art of Minimalist Dressing',
      slug: 'art-of-minimalist-dressing',
      excerpt: 'Less is more. How to build a capsule wardrobe that speaks volumes through restraint.',
      content: 'Minimalist dressing is not about owning fewer things—it\'s about owning the right things. Pieces that transcend seasons, that work together, that require no second thought. Here we explore the principles of a refined, intentional wardrobe.\n\n**Quality over quantity.** Invest in fabrics that age with grace: wool, cashmere, silk, leather. These materials tell a story. Fast fashion tells a different one.\n\n**Neutral foundations.** Black, white, cream, charcoal. These are your canvas. From here, you add one accent—a gold watch, a silk scarf—and the look is complete.\n\n**Tailoring matters.** The difference between ordinary and extraordinary often comes down to fit. A well-tailored blazer, trousers that hit the ankle just so—these details compound.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
      publishedAt: new Date('2025-01-15'),
    },
    {
      title: 'Why Craftsmanship Still Matters in Fashion',
      slug: 'why-craftsmanship-matters',
      excerpt: 'In a world of mass production, the handmade and the considered stand apart.',
      content: 'Craftsmanship is the soul of luxury. It\'s the hours spent on a single seam, the choice of a specific thread, the hand-finishing that no machine can replicate.\n\n**Heritage techniques.** Many of the world\'s finest garments are still made using methods passed down through generations. This isn\'t nostalgia—it\'s because these techniques produce results that modern shortcuts cannot.\n\n**The human touch.** When you hold a piece that was made by hand, you feel the intention. Every stitch was a decision. Every cut was considered.\n\n**Sustainability through longevity.** The most sustainable garment is one you wear for decades. Craftsmanship creates pieces built to last.',
      imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
      publishedAt: new Date('2025-01-10'),
    },
    {
      title: 'Building Your Signature Style',
      slug: 'building-signature-style',
      excerpt: 'How to develop a personal aesthetic that feels authentic and effortless.',
      content: 'Signature style isn\'t about following trends. It\'s about knowing what works for you and refining it over time.\n\n**Start with your lifestyle.** What do you actually wear? What makes you feel confident? Audit your closet with honesty.\n\n**Identify your uniform.** Many of the most stylish people have a formula. Steve Jobs had his black turtleneck. Find yours—perhaps it\'s blazers and tailored trousers, or clean knits and dark denim.\n\n**Edit ruthlessly.** If it doesn\'t fit, doesn\'t flatter, or doesn\'t bring joy—let it go. A curated wardrobe is a calm mind.',
      imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
      publishedAt: new Date('2025-01-05'),
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
