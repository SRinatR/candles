import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Создание пользователей
  console.log('👥 Создание пользователей...');
  const adminPassword = await bcrypt.hash('adminpass', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@askimcandles.com' },
    update: {},
    create: {
      email: 'admin@askimcandles.com',
      firstName: 'Store',
      lastName: 'Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isBlocked: false,
      isActive: true,
      emailVerified: new Date()
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@askimcandles.com' },
    update: {},
    create: {
      email: 'manager@askimcandles.com',
      firstName: 'Store',
      lastName: 'Manager',
      password: managerPassword,
      role: 'MANAGER',
      isBlocked: false,
      isActive: true,
      emailVerified: new Date()
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: userPassword,
      role: 'USER',
      isBlocked: false,
      isActive: true,
      emailVerified: new Date()
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
  for (let i = 0; i < products.length; i++) {
    const productData = products[i];
    const { translations, images, attributes, ...productFields } = productData;
    
    // Добавляем уникальный суффикс к SKU для избежания дублирования
    const uniqueSku = `${productFields.sku}-${Math.random().toString(36).substr(2, 9)}`;
    
    const product = await prisma.product.create({
      data: {
        ...productFields,
        sku: uniqueSku,
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

  // Создание финансовых категорий
  console.log('💰 Создание финансовых категорий...');
  console.log('DEBUG: Начинаем создание финансовых категорий');
  
  let financeCategories;
  try {
  financeCategories = await Promise.all([
    prisma.financeCategory.upsert({
      where: { name: 'Продажи' },
      update: {},
      create: {
        name: 'Продажи',
        description: 'Доходы от продажи товаров',
        type: 'INCOME'
      }
    }),
    prisma.financeCategory.upsert({
      where: { name: 'Закупки' },
      update: {},
      create: {
        name: 'Закупки',
        description: 'Расходы на закупку товаров',
        type: 'EXPENSE'
      }
    }),
    prisma.financeCategory.upsert({
      where: { name: 'Маркетинг' },
      update: {},
      create: {
        name: 'Маркетинг',
        description: 'Расходы на рекламу и маркетинг',
        type: 'EXPENSE'
      }
    }),
    prisma.financeCategory.upsert({
      where: { name: 'Операционные расходы' },
      update: {},
      create: {
        name: 'Операционные расходы',
        description: 'Общие операционные расходы',
        type: 'EXPENSE'
      }
    })
  ]);
  
  console.log('DEBUG: Финансовые категории созданы успешно');
  } catch (error) {
    console.error('ERROR: Ошибка при создании финансовых категорий:', error);
    throw error;
  }

  // Типы транзакций определены как enum в схеме Prisma
  console.log('📋 Типы транзакций используют enum из схемы...');

  // Создание тестовых заказов
  console.log('🛒 Создание тестовых заказов...');
  const testOrders = [];
  for (let i = 0; i < 10; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${i}`,
        userId: Math.random() > 0.5 ? user.id : null,
        status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'][Math.floor(Math.random() * 5)] as any,
        totalAmount: Math.floor(Math.random() * 500000) + 50000, // от 50,000 до 550,000 сум
        currency: 'UZS',
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // последние 30 дней
        items: {
          create: {
            productId: createdProducts[Math.floor(Math.random() * createdProducts.length)].id,
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 100000) + 25000,
            name: 'Test Product',
            sku: `SKU-${Date.now()}`
          }
        }
      }
    });
    testOrders.push(order);
  }

  // Создание финансовых транзакций
  console.log('💳 Создание финансовых транзакций...');
  const transactions = [];
  
  // Транзакции от заказов
  for (const order of testOrders) {
    if (order.status === 'DELIVERED') {
      const transaction = await prisma.transaction.create({
        data: {
          amount: order.totalAmount,
          description: `Доход от заказа ${order.orderNumber}`,
          date: order.createdAt,
          type: 'INCOME',
          categoryId: financeCategories.find(c => c.name === 'Продажи')!.id,
          status: 'COMPLETED',
          createdBy: admin.id,
          orderId: order.id
        }
      });
      transactions.push(transaction);
    }
  }

  // Дополнительные расходные транзакции
  const expenseTransactions = [
    {
      amount: -150000,
      description: 'Закупка воска для свечей',
      category: 'Закупки'
    },
    {
      amount: -75000,
      description: 'Реклама в Instagram',
      category: 'Маркетинг'
    },
    {
      amount: -200000,
      description: 'Аренда склада',
      category: 'Операционные расходы'
    },
    {
      amount: -50000,
      description: 'Упаковочные материалы',
      category: 'Закупки'
    },
    {
      amount: -100000,
      description: 'Реклама в Google Ads',
      category: 'Маркетинг'
    }
  ];

  for (const expense of expenseTransactions) {
    const transaction = await prisma.transaction.create({
      data: {
        amount: expense.amount,
        description: expense.description,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        type: 'EXPENSE',
        categoryId: financeCategories.find(c => c.name === expense.category)!.id,
        status: 'COMPLETED',
        createdBy: admin.id
      }
    });
    transactions.push(transaction);
  }

  // Создание финансового периода
  console.log('📅 Создание финансового периода...');
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const nextMonth = new Date(currentMonth);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const totalIncome = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = Math.abs(transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));
  
  await prisma.financePeriod.upsert({
    where: {
      startDate_endDate: {
        startDate: currentMonth,
        endDate: nextMonth
      }
    },
    update: {
      totalRevenue: totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    },
    create: {
      name: `${currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
      startDate: currentMonth,
      endDate: nextMonth,
      totalRevenue: totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    }
  });

  console.log('🎉 Заполнение базы данных завершено!');
  console.log('\n📊 Статистика:');
  console.log(`👥 Пользователи: ${[admin, manager, user].length}`);
  console.log(`📂 Категории: ${createdCategories.length}`);
  console.log(`🧱 Материалы: ${createdMaterials.length}`);
  console.log(`🌸 Ароматы: ${createdScents.length}`);
  console.log(`🕯️ Продукты: ${createdProducts.length}`);
  console.log(`🛒 Заказы: ${testOrders.length}`);
  console.log(`💰 Финансовые категории: ${financeCategories.length}`);
  console.log(`💳 Транзакции: ${transactions.length}`);
  console.log(`📅 Финансовые периоды: 1`);
  console.log('\n🔐 Тестовые аккаунты:');
  console.log('Admin: admin@askimcandles.com / adminpass');
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