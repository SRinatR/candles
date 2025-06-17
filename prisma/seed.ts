import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создание пользователей
  console.log('👥 Создание пользователей...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@askim-candles.uz' },
    update: {},
    create: {
      email: 'admin@askim-candles.uz',
      name: 'Администратор',
      password: adminPassword,
      role: 'ADMIN',
      isBlocked: false
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@askim-candles.uz' },
    update: {},
    create: {
      email: 'manager@askim-candles.uz',
      name: 'Менеджер',
      password: managerPassword,
      role: 'MANAGER',
      isBlocked: false
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Тестовый пользователь',
      password: userPassword,
      role: 'USER',
      isBlocked: false
    }
  });

  console.log(`✅ Создано пользователей: ${[admin, manager, user].length}`);

  // Создание категорий
  console.log('📂 Создание категорий...');
  const categories = [
    {
      name: 'Корпоративные наборы',
      slug: 'corporate-sets',
      description: 'Эксклюзивные наборы для корпоративных клиентов.',
      image: 'https://placehold.co/400x400/F37E92/FFFFFF?text=Corporate+Sets'
    },
    {
      name: 'Свадебные комплименты',
      slug: 'wedding-favors',
      description: 'Изящные комплименты для гостей на свадьбу.',
      image: 'https://placehold.co/400x400/FFD2DA/162044?text=Wedding+Favors'
    },
    {
      name: 'Аромасвечи',
      slug: 'scented-candles',
      description: 'Ароматические свечи ручной работы с уникальными запахами.',
      image: 'https://placehold.co/400x400/162044/FFFFFF?text=Scented+Candles'
    },
    {
      name: 'Вкусный дом',
      slug: 'tasty-home',
      description: 'Товары для создания уюта и приятной атмосферы в доме.',
      image: 'https://placehold.co/400x400/B2C9ED/162044?text=Tasty+Home'
    },
    {
      name: 'Гипсовый рай',
      slug: 'gypsum-paradise',
      description: 'Элегантные изделия из гипса для декора.',
      image: 'https://placehold.co/400x400/F37E92/FFFFFF?text=Gypsum+Paradise'
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
    { name: 'Соевый воск' },
    { name: 'Пчелиный воск' },
    { name: 'Парафин' },
    { name: 'Кокосовый воск' },
    { name: 'Гипс' },
    { name: 'Керамика' },
    { name: 'Стекло' }
  ];

  const createdMaterials = [];
  for (const materialData of materials) {
    const material = await prisma.material.upsert({
      where: { name: materialData.name },
      update: {},
      create: materialData
    });
    createdMaterials.push(material);
  }

  console.log(`✅ Создано материалов: ${createdMaterials.length}`);

  // Создание ароматов
  console.log('🌸 Создание ароматов...');
  const scents = [
    { name: 'Лаванда' },
    { name: 'Ваниль' },
    { name: 'Роза' },
    { name: 'Жасмин' },
    { name: 'Сандал' },
    { name: 'Цитрус' },
    { name: 'Мята' },
    { name: 'Корица' },
    { name: 'Эвкалипт' },
    { name: 'Без аромата' }
  ];

  const createdScents = [];
  for (const scentData of scents) {
    const scent = await prisma.scent.upsert({
      where: { name: scentData.name },
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
      price: 25000,
      costPrice: 15000,
      dimensions: '8x8x10 см',
      burningTime: '40 часов',
      stock: 50,
      categoryId: createdCategories.find(c => c.slug === 'scented-candles')!.id,
      materialId: createdMaterials.find(m => m.name === 'Соевый воск')!.id,
      scentId: createdScents.find(s => s.name === 'Лаванда')!.id,
      translations: [
        {
          locale: 'uz',
          name: 'Lavanda Rohari Shami',
          description: 'Tinchlik va dam olish uchun lavanda hidli sham. Tabiiy soya mumidan tayyorlangan.'
        },
        {
          locale: 'ru',
          name: 'Свеча "Лавандовое Блаженство"',
          description: 'Ароматическая свеча с успокаивающим ароматом лаванды. Изготовлена из натурального соевого воска.'
        },
        {
          locale: 'en',
          name: 'Lavender Bliss Candle',
          description: 'Aromatic candle with calming lavender scent. Made from natural soy wax.'
        }
      ],
      images: [
        {
          url: '/products/candle1.svg',
          isMain: true,
          order: 0
        }
      ],
      attributes: [
        { key: 'Фитиль', value: 'Хлопковый' },
        { key: 'Упаковка', value: 'Подарочная коробка' }
      ]
    },
    {
      sku: 'ASKM-VAN-002',
      price: 28000,
      costPrice: 18000,
      dimensions: '9x9x11 см',
      burningTime: '45 часов',
      stock: 35,
      categoryId: createdCategories.find(c => c.slug === 'scented-candles')!.id,
      materialId: createdMaterials.find(m => m.name === 'Соевый воск')!.id,
      scentId: createdScents.find(s => s.name === 'Ваниль')!.id,
      translations: [
        {
          locale: 'uz',
          name: 'Vanil Shirinligi Shami',
          description: 'Issiq va shirinlik beruvchi vanil hidli sham. Premium sifatli soya mumidan.'
        },
        {
          locale: 'ru',
          name: 'Свеча "Ванильная Сладость"',
          description: 'Теплая и сладкая ароматическая свеча с ванилью. Премиум качество из соевого воска.'
        },
        {
          locale: 'en',
          name: 'Vanilla Sweetness Candle',
          description: 'Warm and sweet aromatic candle with vanilla scent. Premium quality soy wax.'
        }
      ],
      images: [
        {
          url: '/products/candle2.svg',
          isMain: true,
          order: 0
        }
      ],
      attributes: [
        { key: 'Фитиль', value: 'Деревянный' },
        { key: 'Упаковка', value: 'Эко-упаковка' }
      ]
    },
    {
      sku: 'ASKM-CORP-003',
      price: 150000,
      costPrice: 90000,
      dimensions: '30x20x15 см',
      burningTime: '200 часов',
      stock: 10,
      categoryId: createdCategories.find(c => c.slug === 'corporate-sets')!.id,
      materialId: createdMaterials.find(m => m.name === 'Соевый воск')!.id,
      scentId: createdScents.find(s => s.name === 'Сандал')!.id,
      translations: [
        {
          locale: 'uz',
          name: 'Korporativ Sovgalar Toplami',
          description: 'Biznes hamkorlar uchun maxsus tayyorlangan hashamatli shamlar toplami.'
        },
        {
          locale: 'ru',
          name: 'Корпоративный Набор Премиум',
          description: 'Роскошный набор свечей, специально созданный для деловых партнеров и корпоративных подарков.'
        },
        {
          locale: 'en',
          name: 'Corporate Premium Gift Set',
          description: 'Luxury candle set specially designed for business partners and corporate gifts.'
        }
      ],
      images: [
        {
          url: '/products/gypsum1.svg',
          isMain: true,
          order: 0
        }
      ],
      attributes: [
        { key: 'Количество свечей', value: '5 штук' },
        { key: 'Упаковка', value: 'Деревянная коробка' },
        { key: 'Персонализация', value: 'Возможна' }
      ]
    }
  ];

  const createdProducts = [];
  for (const productData of products) {
    const { translations, images, attributes, ...productFields } = productData;
    
    const product = await prisma.product.create({
      data: {
        ...productFields,
        translations: {
          create: translations
        },
        images: {
          create: images
        },
        attributes: {
          create: attributes
        }
      },
      include: {
        translations: true,
        images: true,
        attributes: true
      }
    });
    
    createdProducts.push(product);
  }

  console.log(`✅ Создано продуктов: ${createdProducts.length}`);

  console.log('🎉 Заполнение базы данных завершено!');
  console.log('\n📊 Статистика:');
  console.log(`👥 Пользователи: ${[admin, manager, user].length}`);
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