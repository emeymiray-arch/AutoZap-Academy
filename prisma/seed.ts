import { PrismaClient } from "@prisma/client";
import { AZService } from "../server/az/az-service";
import { hashPassword } from "../server/auth/password";
import { seedModule1Content } from "./seed-module1";
import { seedModule2Content } from "./seed-module2";

const prisma = new PrismaClient();

async function main() {
  await prisma.chatMessage.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.activityAward.deleteMany();
  await prisma.activityVote.deleteMany();
  await prisma.activityReply.deleteMany();
  await prisma.activityPost.deleteMany();
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
  await prisma.assessmentAttempt.deleteMany();
  await prisma.moduleAssessment.deleteMany();
  await prisma.lessonProgress.deleteMany();
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
      nickname: "admin",
      role: "ADMIN",
      passwordHash: hashPassword("Admin123!"),
      consentAcceptedAt: new Date(),
      mustChangePassword: false,
    },
  });

  const student = await prisma.user.create({
    data: {
      id: process.env.DEMO_STUDENT_ID ?? "student-demo-001",
      email: "ivan@autozap.academy",
      name: "Иван",
      nickname: "ivan",
      role: "STUDENT",
      passwordHash: hashPassword("Student123!"),
      consentAcceptedAt: new Date(),
      mustChangePassword: false,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      id: "student-demo-002",
      email: "maria@autozap.academy",
      name: "Мария",
      nickname: "maria",
      role: "STUDENT",
      passwordHash: hashPassword("Student123!"),
      consentAcceptedAt: new Date(),
      mustChangePassword: false,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      id: "student-demo-003",
      email: "alex@autozap.academy",
      name: "Алекс",
      nickname: "alex",
      role: "STUDENT",
      passwordHash: hashPassword("Student123!"),
      consentAcceptedAt: new Date(),
      mustChangePassword: false,
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
        description:
          i === 0
            ? "Целостное понимание продукта, возможностей, аудитории и ценности для бизнеса."
            : i === 1
              ? "Направления продукта: маркетплейс, поставщики, логистика, финансы, автосервисы и дополнительные сервисы."
              : "Контент будет добавлен командой AutoZap.",
        position: i + 1,
        status: "PUBLISHED",
      },
    });
    modules.push(mod);
  }

  const module1 = modules[0];
  const lessonTitles = [
    "Что такое AutoZap",
    "Как устроен AutoZap и какие возможности он предоставляет",
    "Для кого существует AutoZap",
    "Как работает AutoZap",
    "Что получает магазин, подключаясь к AutoZap",
    "Как AutoZap помогает с поставками из Китая",
    "Какие финансовые возможности предоставляет AutoZap",
    "Как менеджеру выявлять потребности и презентовать AutoZap",
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
      title: "Объясни своими словами — Модуль 1",
      description:
        "Свободный ответ из финальной проверки модуля. Куратор проверяет понимание AutoZap как автомобильного маркетплейса с торговыми, логистическими и финансовыми возможностями.",
    },
  });

  await prisma.quiz.create({
    data: {
      moduleId: module1.id,
      title: "Тест — Модуль 1",
    },
  });

  await seedModule1Content(prisma);
  await seedModule2Content(prisma);

  const az = new AZService(prisma);

  // Levels — configurable, not hardcoded in domain logic beyond seed defaults
  await az.createLevelRule({ slug: "bronze", name: "Bronze", minAz: 0, maxAz: 100, sortOrder: 1 });
  await az.createLevelRule({ slug: "silver", name: "Silver", minAz: 100, maxAz: 300, sortOrder: 2 });
  await az.createLevelRule({ slug: "gold", name: "Gold", minAz: 300, maxAz: null, sortOrder: 3 });

  // Lesson + assignment AZ defaults are owned by seedModule1Content (+5 / 3–10)

  // Quiz rule for module 1
  await az.createRewardRule({
    actionType: "QUIZ_COMPLETED",
    scopeType: "MODULE",
    courseId: course.id,
    moduleId: module1.id,
    name: "Module 1 quiz",
    maxAz: 10,
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
    amount: 5,
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
    amount: 5,
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
    amount: 10,
    reason: "Тест пройден",
    idempotencyKey: `seed:quiz:${student3.id}:mod1`,
    courseId: course.id,
    moduleId: module1.id,
  });

  await az.recalculateLevel(student.id);
  await az.recalculateLevel(student2.id);
  await az.recalculateLevel(student3.id);

  await prisma.newsPost.create({
    data: {
      authorId: admin.id,
      title: "Добро пожаловать в AutoZap Academy",
      body: "Следите за новостями здесь. Вопросы — на доске активности. Админ всегда в закрепе в чатах.",
    },
  });

  console.log("Seed complete:", {
    admin: admin.email,
    adminPassword: "Admin123!",
    student: student.email,
    studentPassword: "Student123!",
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
