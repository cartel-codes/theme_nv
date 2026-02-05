import { PrismaClient } from '@prisma/client';

const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const defaultAdminPassword = await bcrypt.hash('admin123!', 10);
  
  await prisma.adminUser.upsert({
    where: { email: 'admin@novraux.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@novraux.com',
      password: defaultAdminPassword,
      role: 'admin',
      isActive: true,
    },
  });

  console.log('Created default admin user: admin@novraux.com / admin123!');

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

  // Create products (limited edition focus)
  const products = [
    {
      name: 'N°01 Atelier Blazer',
      slug: 'n01-atelier-blazer',
      description: 'The cornerstone of the N°01 collection. A perfectly tailored oversized blazer in 100% fine Italian wool. Each piece is hand-numbered 1 to 100.',
      price: 450.00,
      imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
      categoryId: clothing.id,
    },
    {
      name: 'Linen Drape Shirt',
      slug: 'linen-drape-shirt',
      description: 'Effortless silk-linen blend with a relaxed editorial silhouette. Designed for seasonless elegance.',
      price: 220.00,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
      categoryId: clothing.id,
    },
    {
      name: 'Sculptural Trousers',
      slug: 'sculptural-trousers',
      description: 'High-waisted with deep pleats, creating a sharp yet fluid movement. A limited series of 50 pieces.',
      price: 320.00,
      imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
      categoryId: clothing.id,
    },
    {
      name: 'The Muse Bag',
      slug: 'the-muse-bag',
      description: 'Hand-stitched calfskin leather in a structural minimalist form. A true collector\'s piece.',
      price: 850.00,
      imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800',
      categoryId: accessories.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  // Create blog posts (Phase 1 SEO Strategy)
  const posts = [
    {
      title: 'Why Limited Edition Fashion is the Future of Sustainable Luxury',
      slug: 'why-limited-edition-fashion-is-future-sustainable-luxury',
      excerpt: 'In an era of overproduction, intentional scarcity is the ultimate declaration of quality and ethics.',
      content: 'True luxury shouldn\'t be mass-produced. When we talk about limited edition fashion, we are talking about a return to the values of the atelier.\n\n**Intentional Scarcity.** By producing only 100 pieces of each design, we ensure that every garment is treated as a work of art rather than a commodity.\n\n**Waste Reduction.** Mass production leads to massive unsold inventory. Our model ensures that every piece we create has a home, minimizing our environmental footprint.\n\n**The Collector\'s Mindset.** Owning a numbered piece creates a different relationship between the wearer and the garment. It becomes a part of one\'s personal archive.',
      imageUrl: 'https://images.unsplash.com/photo-1537832816519-689ad163238b?w=1000',
      publishedAt: new Date('2024-02-01'),
    },
    {
      title: 'The Casablanca Atelier: Where Modern Minimalism Meets Traditional Craft',
      slug: 'casablanca-atelier-modern-minimalism-traditional-craft',
      excerpt: 'A behind-the-scenes look at our production process, from hand-drawn sketches to the final hand-numbered tag.',
      content: 'Novraux is rooted in the vibrant energy of Casablanca. Here, we blend the sharp lines of modern minimalism with the deep expertise of local artisans.\n\n**Design First.** Every piece begins as a reflection on form and function. We don\'t follow trends; we build silhouettes that are designed to last decades.\n\n**The Human Touch.** Our artisans are the heartbeat of the brand. Their skilled hands ensure that every seam is perfect, every detail considered.\n\n**A New Chapter.** We are not just making clothes; we are defining a new architectural language for the modern wardrobe.',
      imageUrl: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1000',
      publishedAt: new Date('2024-02-03'),
    },
    {
      title: 'Building a Capsule Wardrobe with Limited Edition Pieces',
      slug: 'building-capsule-wardrobe-limited-edition-pieces',
      excerpt: 'How to curate an intentional wardrobe that feels personal, unique, and timeless.',
      content: 'A capsule wardrobe is a powerful tool for clarity. But to make it truly yours, it needs pieces that tell a story.\n\n**Start with Architecture.** Look for silhouettes that define your presence. An oversized blazer, a sharp pair of trousers—these are your anchors.\n\n**Invest in Rarity.** Including limited edition pieces in your capsule ensures that your "uniform" isn\'t a copy of everyone else\'s.\n\n**Longevity Above All.** When you know there are only 100 of your coat in existence, you tend to care for it differently. That care is the ultimate form of style.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000',
      publishedAt: new Date('2024-02-04'),
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: post,
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
