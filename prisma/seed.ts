import { PrismaClient } from "@prisma/client";
import { AZService } from "../server/az/az-service";

const prisma = new PrismaClient();

async function main() {
  await prisma.azLedgerEntry.deleteMany();
  await prisma.userAzBalance.deleteMany();
  await prisma.finalStatusAssignment.deleteMany();
  await prisma.azRecalculationJob.deleteMany();
  await prisma.azQualityRange.deleteMany();
  await prisma.azRewardRuleVersion.deleteMany();
  await prisma.azRewardRule.deleteMany();
  await prisma.azLevelRule.deleteMany();
  await prisma.rankingTieBreakRule.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  const admin = await prisma.user.create({
    data: {
      id: process.env.DEMO_ADMIN_ID ?? "admin-demo-001",
      email: "admin@autozap.academy",
      name: "Admin AutoZap",
      role: "ADMIN",
    },
  });

  const student = await prisma.user.create({
    data: {
      id: process.env.DEMO_STUDENT_ID ?? "student-demo-001",
      email: "ivan@autozap.academy",
      name: "Иван",
      role: "STUDENT",
    },
  });

  const student2 = await prisma.user.create({
    data: {
      id: "student-demo-002",
      email: "maria@autozap.academy",
      name: "Мария",
      role: "STUDENT",
    },
  });

  const student3 = await prisma.user.create({
    data: {
      id: "student-demo-003",
      email: "alex@autozap.academy",
      name: "Алекс",
      role: "STUDENT",
    },
  });

  const course = await prisma.course.create({
    data: {
      slug: "manager-program",
      title: "AutoZap Manager Program",
      description: "Контент будет добавлен командой AutoZap.",
      status: "PUBLISHED",
    },
  });

  const moduleTitles = [
    "Знакомство с AutoZap",
    "Продукт AutoZap",
    "Кто наша ЦА",
    "Поиск потенциальных клиентов и поставщиков",
    "Первый контакт",
    "Выявление потребности",
    "Презентация AutoZap",
    "Работа с возражениями",
    "Закрытие на подключение",
    "Подключение продавца",
    "Работа с каталогом",
    "Запуск магазина",
    "Сопровождение продавца",
    "CRM и рабочая система менеджера",
    "KPI и аналитика",
    "Реальные кейсы AutoZap",
    "Финальная симуляция",
    "Аттестация",
  ];

  const modules = [];
  for (let i = 0; i < moduleTitles.length; i++) {
    const mod = await prisma.module.create({
      data: {
        courseId: course.id,
        slug: `module-${i + 1}`,
        title: moduleTitles[i],
        description: "Контент будет добавлен командой AutoZap.",
        position: i + 1,
        status: i === 0 ? "PUBLISHED" : "DRAFT",
      },
    });
    modules.push(mod);
  }

  const module1 = modules[0];
  const lessonTitles = [
    "Что такое AutoZap",
    "Экосистема AutoZap",
    "Для кого существует AutoZap",
    "Как работает AutoZap",
    "Что получает магазин",
    "Что получает автовладелец",
    "Стратегия и развитие AutoZap",
  ];

  const lessons = [];
  for (let i = 0; i < lessonTitles.length; i++) {
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: module1.id,
        slug: `lesson-${i + 1}`,
        title: lessonTitles[i],
        position: i + 1,
        status: "PUBLISHED",
      },
    });
    lessons.push(lesson);
  }

  const assignment = await prisma.assignment.create({
    data: {
      moduleId: module1.id,
      title: "Практическое задание — Модуль 1",
      description: "Контент будет добавлен командой AutoZap.",
    },
  });

  await prisma.quiz.create({
    data: {
      moduleId: module1.id,
      title: "Тест — Модуль 1",
    },
  });

  const az = new AZService(prisma);

  // Levels — configurable, not hardcoded in domain logic beyond seed defaults
  await az.createLevelRule({ slug: "bronze", name: "Bronze", minAz: 0, maxAz: 100, sortOrder: 1 });
  await az.createLevelRule({ slug: "silver", name: "Silver", minAz: 100, maxAz: 300, sortOrder: 2 });
  await az.createLevelRule({ slug: "gold", name: "Gold", minAz: 300, maxAz: null, sortOrder: 3 });

  // Lesson rules — different max per lesson (proves no global LESSON_COMPLETION_AZ)
  for (let i = 0; i < lessons.length; i++) {
    const maxAz = 20 + i * 5; // 20, 25, 30...
    await az.createRewardRule({
      actionType: "LESSON_COMPLETED",
      scopeType: "LESSON",
      courseId: course.id,
      moduleId: module1.id,
      lessonId: lessons[i].id,
      name: `Module 1 / Lesson ${i + 1} completion`,
      maxAz,
      allowsPartial: false,
      allowsRepeat: false,
      qualityDependent: false,
      createdById: admin.id,
    });
  }

  // Assignment — quality-dependent, partial allowed
  await az.createRewardRule({
    actionType: "ASSIGNMENT_REVIEWED",
    scopeType: "MODULE",
    courseId: course.id,
    moduleId: module1.id,
    name: "Module 1 practice assignment",
    maxAz: 10,
    allowsPartial: true,
    allowsRepeat: false,
    qualityDependent: true,
    qualityRanges: [
      { label: "Плохо", minAz: 0, maxAz: 3, criteria: "Существенные ошибки", sortOrder: 0 },
      { label: "Средне", minAz: 4, maxAz: 7, criteria: "Основные требования выполнены", sortOrder: 1 },
      { label: "Хорошо", minAz: 8, maxAz: 10, criteria: "Полное соответствие", sortOrder: 2 },
    ],
    createdById: admin.id,
  });

  // Quiz rule for module 1
  await az.createRewardRule({
    actionType: "QUIZ_COMPLETED",
    scopeType: "MODULE",
    courseId: course.id,
    moduleId: module1.id,
    name: "Module 1 quiz",
    maxAz: 30,
    allowsPartial: true,
    allowsRepeat: true,
    qualityDependent: false,
    createdById: admin.id,
  });

  await prisma.rankingTieBreakRule.createMany({
    data: [
      { priority: 1, criterion: "TOTAL_AZ", descending: true },
      { priority: 2, criterion: "ASSIGNMENTS_AVG_AZ", descending: true },
      { priority: 3, criterion: "MODULES_COMPLETED", descending: true },
    ],
  });

  // Demo awards for student so dashboard is not empty
  await az.applyReward({
    userId: student.id,
    actionType: "LESSON_COMPLETED",
    sourceType: "lesson",
    sourceId: lessons[0].id,
    amount: 20,
    reason: "Урок завершён",
    idempotencyKey: `seed:lesson:${student.id}:${lessons[0].id}`,
    courseId: course.id,
    moduleId: module1.id,
    lessonId: lessons[0].id,
  });

  await az.applyReward({
    userId: student.id,
    actionType: "ASSIGNMENT_REVIEWED",
    sourceType: "assignment",
    sourceId: assignment.id,
    amount: 7,
    qualityLabel: "Средне",
    reason: "Выполнены основные требования, допущены ошибки.",
    idempotencyKey: `seed:assignment:${student.id}:${assignment.id}`,
    courseId: course.id,
    moduleId: module1.id,
    createdById: admin.id,
  });

  await az.applyReward({
    userId: student2.id,
    actionType: "LESSON_COMPLETED",
    sourceType: "lesson",
    sourceId: lessons[0].id,
    amount: 20,
    reason: "Урок завершён",
    idempotencyKey: `seed:lesson:${student2.id}:${lessons[0].id}`,
    courseId: course.id,
    moduleId: module1.id,
    lessonId: lessons[0].id,
  });

  await az.applyReward({
    userId: student3.id,
    actionType: "QUIZ_COMPLETED",
    sourceType: "quiz",
    sourceId: `quiz-mod1`,
    amount: 30,
    reason: "Тест пройден",
    idempotencyKey: `seed:quiz:${student3.id}:mod1`,
    courseId: course.id,
    moduleId: module1.id,
  });

  await az.recalculateLevel(student.id);
  await az.recalculateLevel(student2.id);
  await az.recalculateLevel(student3.id);

  console.log("Seed complete:", {
    admin: admin.email,
    student: student.email,
    module1: module1.title,
    lessons: lessons.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
