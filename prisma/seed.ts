import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создание Super Admin (единственный в системе)
  console.log('👑 Создание Super Admin...');
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@askimcandles.com' },
    update: {
      // Обновляем только пароль, если пользователь уже существует
      password: superAdminPassword,
    },
    create: {
      id: 'super-admin-001', // Фиксированный ID для Super Admin
      email: 'superadmin@askimcandles.com',
      name: 'Super Administrator',
      password: superAdminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Super Admin создан:', {
    id: superAdmin.id,
    email: superAdmin.email,
    name: superAdmin.name,
    role: superAdmin.role
  });

  // Создание тестового менеджера (можно удалить в продакшене)
  console.log('👥 Создание тестового менеджера...');
  const managerPassword = await bcrypt.hash('manager123', 10);
  
  const manager = await prisma.user.upsert({
    where: { email: 'manager@askimcandles.com' },
    update: {},
    create: {
      email: 'manager@askimcandles.com',
      name: 'Test Manager',
      password: managerPassword,
      role: 'MANAGER',
      status: 'ACTIVE'
    }
  });

  console.log('✅ Тестовый менеджер создан:', {
    id: manager.id,
    email: manager.email,
    name: manager.name,
    role: manager.role
  });

  console.log(`✅ Создано пользователей: ${[superAdmin, manager].length}`);

  // Создание категорий
  console.log('📂 Создание категорий...');
  const categories = [
    {
      name: {
        uz: 'Korporativ to\'plamlar',
        ru: 'Корпоративные наборы',
        en: 'Corporate Sets'
      },
      slug: 'corporate-sets'
    },
    {
      name: {
        uz: 'To\'y sovg\'alari',
        ru: 'Свадебные комплименты',
        en: 'Wedding Favors'
      },
      slug: 'wedding-favors'
    },
    {
      name: {
        uz: 'Xushbo\'y shamlar',
        ru: 'Аромасвечи',
        en: 'Scented Candles'
      },
      slug: 'scented-candles'
    },
    {
      name: {
        uz: 'Mazali uy',
        ru: 'Вкусный дом',
        en: 'Tasty Home'
      },
      slug: 'tasty-home'
    },
    {
      name: {
        uz: 'Gips jannat',
        ru: 'Гипсовый рай',
        en: 'Gypsum Paradise'
      },
      slug: 'gypsum-paradise'
    }
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData
    });
    createdCategories.push(category);
  }

  console.log(`✅ Создано категорий: ${createdCategories.length}`);

  // Создание материалов
  console.log('🧱 Создание материалов...');
  const materials = [
    {
      name: {
        uz: 'Soya mumi',
        ru: 'Соевый воск',
        en: 'Soy Wax'
      },
      slug: 'soy-wax'
    },
    {
      name: {
        uz: 'Ari mumi',
        ru: 'Пчелиный воск',
        en: 'Beeswax'
      },
      slug: 'beeswax'
    },
    {
      name: {
        uz: 'Parafin',
        ru: 'Парафин',
        en: 'Paraffin'
      },
      slug: 'paraffin'
    },
    {
      name: {
        uz: 'Kokos mumi',
        ru: 'Кокосовый воск',
        en: 'Coconut Wax'
      },
      slug: 'coconut-wax'
    },
    {
      name: {
        uz: 'Gips',
        ru: 'Гипс',
        en: 'Gypsum'
      },
      slug: 'gypsum'
    },
    {
      name: {
        uz: 'Keramika',
        ru: 'Керамика',
        en: 'Ceramic'
      },
      slug: 'ceramic'
    },
    {
      name: {
        uz: 'Shisha',
        ru: 'Стекло',
        en: 'Glass'
      },
      slug: 'glass'
    }
  ];

  const createdMaterials = [];
  for (const materialData of materials) {
    const material = await prisma.material.upsert({
      where: { slug: materialData.slug },
      update: {},
      create: materialData
    });
    createdMaterials.push(material);
  }

  console.log(`✅ Создано материалов: ${createdMaterials.length}`);

  // Создание ароматов
  console.log('🌸 Создание ароматов...');
  const scents = [
    {
      name: {
        uz: 'Lavanda',
        ru: 'Лаванда',
        en: 'Lavender'
      },
      slug: 'lavender'
    },
    {
      name: {
        uz: 'Vanil',
        ru: 'Ваниль',
        en: 'Vanilla'
      },
      slug: 'vanilla'
    },
    {
      name: {
        uz: 'Atirgul',
        ru: 'Роза',
        en: 'Rose'
      },
      slug: 'rose'
    },
    {
      name: {
        uz: 'Yasemin',
        ru: 'Жасмин',
        en: 'Jasmine'
      },
      slug: 'jasmine'
    },
    {
      name: {
        uz: 'Sandal',
        ru: 'Сандал',
        en: 'Sandalwood'
      },
      slug: 'sandalwood'
    },
    {
      name: {
        uz: 'Sitrus',
        ru: 'Цитрус',
        en: 'Citrus'
      },
      slug: 'citrus'
    },
    {
      name: {
        uz: 'Yalpiz',
        ru: 'Мята',
        en: 'Mint'
      },
      slug: 'mint'
    },
    {
      name: {
        uz: 'Darchini',
        ru: 'Корица',
        en: 'Cinnamon'
      },
      slug: 'cinnamon'
    },
    {
      name: {
        uz: 'Evkalipt',
        ru: 'Эвкалипт',
        en: 'Eucalyptus'
      },
      slug: 'eucalyptus'
    },
    {
      name: {
        uz: 'Hidsiz',
        ru: 'Без аромата',
        en: 'Unscented'
      },
      slug: 'unscented'
    }
  ];

  const createdScents = [];
  for (const scentData of scents) {
    const scent = await prisma.scent.upsert({
      where: { slug: scentData.slug },
      update: {},
      create: scentData
    });
    createdScents.push(scent);
  }

  console.log(`✅ Создано ароматов: ${createdScents.length}`);

  // Создание продуктов
  console.log('🕯️ Создание продуктов...');
  const products = [
    {
      sku: 'ASKM-LAV-001',
      name: {
        uz: 'Lavanda Rohari Shami',
        ru: 'Свеча "Лавандовое Блаженство"',
        en: 'Lavender Bliss Candle'
      },
      description: {
        uz: 'Tinchlik va dam olish uchun lavanda hidli sham. Tabiiy soya mumidan tayyorlangan.',
        ru: 'Ароматическая свеча с успокаивающим ароматом лаванды. Изготовлена из натурального соевого воска.',
        en: 'Aromatic candle with calming lavender scent. Made from natural soy wax.'
      },
      price: 25000,
      costPrice: 15000,
      dimensions: '8x8x10 см',
      burningTime: '40 часов',
      categoryId: createdCategories.find(c => c.slug === 'scented-candles')!.id,
      materialId: createdMaterials.find(m => m.slug === 'soy-wax')!.id,
      scentId: createdScents.find(s => s.slug === 'lavender')!.id,
      images: ['/products/candle1.svg']
    },
    {
      sku: 'ASKM-VAN-002',
      name: {
        uz: 'Vanil Shirinligi Shami',
        ru: 'Свеча "Ванильная Сладость"',
        en: 'Vanilla Sweetness Candle'
      },
      description: {
        uz: 'Issiq va shirinlik beruvchi vanil hidli sham. Premium sifatli soya mumidan.',
        ru: 'Теплая и сладкая ароматическая свеча с ванилью. Премиум качество из соевого воска.',
        en: 'Warm and sweet aromatic candle with vanilla scent. Premium quality soy wax.'
      },
      price: 28000,
      costPrice: 18000,
      dimensions: '9x9x11 см',
      burningTime: '45 часов',
      categoryId: createdCategories.find(c => c.slug === 'scented-candles')!.id,
      materialId: createdMaterials.find(m => m.slug === 'soy-wax')!.id,
      scentId: createdScents.find(s => s.slug === 'vanilla')!.id,
      images: ['/products/candle2.svg']
    },
    {
      sku: 'ASKM-CORP-003',
      name: {
        uz: 'Korporativ Sovgalar Toplami',
        ru: 'Корпоративный Набор Премиум',
        en: 'Corporate Premium Gift Set'
      },
      description: {
        uz: 'Biznes hamkorlar uchun maxsus tayyorlangan hashamatli shamlar toplami.',
        ru: 'Роскошный набор свечей, специально созданный для деловых партнеров и корпоративных подарков.',
        en: 'Luxury candle set specially designed for business partners and corporate gifts.'
      },
      price: 150000,
      costPrice: 90000,
      dimensions: '30x20x15 см',
      burningTime: '200 часов',
      categoryId: createdCategories.find(c => c.slug === 'corporate-sets')!.id,
      materialId: createdMaterials.find(m => m.slug === 'soy-wax')!.id,
      scentId: createdScents.find(s => s.slug === 'sandalwood')!.id,
      images: ['/products/gypsum1.svg']
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData
    });
    
    createdProducts.push(product);
  }

  console.log(`✅ Создано продуктов: ${createdProducts.length}`);

  console.log('🎉 Заполнение базы данных завершено!');
  console.log('\n📊 Статистика:');
  console.log(`👥 Пользователи: ${[superAdmin, manager].length}`);
  console.log(`📂 Категории: ${createdCategories.length}`);
  console.log(`🧱 Материалы: ${createdMaterials.length}`);
  console.log(`🌸 Ароматы: ${createdScents.length}`);
  console.log(`🕯️ Продукты: ${createdProducts.length}`);
  console.log('\n🔐 Тестовые аккаунты:');
  console.log('Admin: admin@askim-candles.uz / admin123');
  console.log('Manager: manager@askim-candles.uz / manager123');
  console.log('User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });