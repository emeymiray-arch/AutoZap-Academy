/**
 * Module 2 content seed — «Продукт AutoZap»
 * Safe to re-run: upserts by module/lesson slug.
 */
import type { PrismaClient } from "@prisma/client";
import {
  assessmentContentSchema,
  lessonContentSchema,
  type AssessmentContent,
  type LessonContent,
} from "../src/lib/lesson-content";

const LESSONS: Array<{
  slug: string;
  title: string;
  estimatedMinutes: number;
  content: LessonContent;
}> = [
  {
    slug: "lesson-1",
    title: "Маркетплейс автозапчастей",
    estimatedMinutes: 10,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Маркетплейс автозапчастей",
        subtitle: "Единая площадка для представления товаров магазинов и поставщиков.",
      },
      {
        type: "paragraph",
        body: "Маркетплейс автозапчастей — одно из основных направлений AutoZap. Он позволяет представлять товары магазинов и поставщиков на единой площадке.",
      },
      {
        type: "paragraph",
        body: "Пользователи могут искать необходимые запчасти, изучать доступные предложения и выбирать подходящие варианты.",
      },
      {
        type: "bulletList",
        title: "Основные возможности направления",
        items: [
          "Поиск запчастей по VIN-коду и артикулу",
          "Поиск деталей по фотографии, если функция доступна",
          "Просмотр товарных предложений",
          "Сравнение цен и условий покупки",
          "Представление ассортимента магазинов и поставщиков",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Кому полезно",
        body: "Для магазинов это дополнительный канал продаж и возможность расширить аудиторию. Для покупателей — более удобный способ поиска необходимых комплектующих.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l1-kc-1",
        question: "Магазин спрашивает: «Зачем нам маркетплейс, если у нас уже есть свой сайт?» Что точнее?",
        options: [
          {
            id: "a",
            label:
              "Маркетплейс нужен в основном покупателям для поиска по VIN; магазину от размещения ассортимента пользы мало",
          },
          {
            id: "b",
            label:
              "Свой сайт и маркетплейс решают разные задачи: на площадке магазин получает дополнительный канал и аудиторию рядом с другими предложениями",
          },
          {
            id: "c",
            label:
              "После подключения к маркетплейсу свой сайт обычно отключают — иначе ассортимент дублируется",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Маркетплейс — дополнительный канал продаж и охват, а не замена собственного сайта.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Маркетплейс — одно из основных направлений AutoZap",
          "Поиск по VIN, артикулу и при наличии — по фото",
          "Магазинам — канал продаж, покупателям — удобный поиск",
        ],
      },
    ]),
  },
  {
    slug: "lesson-2",
    title: "Работа с поставщиками и производителями",
    estimatedMinutes: 10,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Работа с поставщиками и производителями",
        subtitle: "Расширение ассортимента и дополнительные источники поставок.",
      },
      {
        type: "paragraph",
        body: "AutoZap развивает направление сотрудничества с поставщиками и производителями автомобильных комплектующих из России и других стран, включая Китай, Южную Корею и Японию.",
      },
      {
        type: "paragraph",
        body: "Это направление позволяет расширять ассортимент и искать дополнительные источники поставок.",
      },
      {
        type: "bulletList",
        title: "Работа может включать",
        items: [
          "Поиск потенциальных поставщиков",
          "Сотрудничество с производителями и дистрибьюторами",
          "Расширение товарного ассортимента",
          "Организацию взаимодействия между поставщиками и покупателями",
          "Развитие новых каналов реализации продукции",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "На что смотреть при выборе поставщика",
        body: "При выборе поставщика важно учитывать качество товаров, условия сотрудничества, наличие документов и надёжность поставок.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l2-kc-1",
        question: "Клиент хочет «самого дешёвого поставщика из Азии». Как корректнее ответить?",
        options: [
          {
            id: "a",
            label:
              "Цена — главный фильтр: если позиция дешевле рынка, документы и качество можно проверить уже после первой отгрузки",
          },
          {
            id: "b",
            label:
              "Страна происхождения важнее цены: поставщики из Японии и Кореи почти всегда надёжнее китайских",
          },
          {
            id: "c",
            label:
              "Цену смотрим вместе с качеством, условиями, документами и стабильностью поставок — иначе дешёвая партия может обернуться срывом",
          },
        ],
        correctOptionId: "c",
        explanation:
          "Низкая цена без проверки качества, документов и надёжности — слабый критерий выбора.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Поставщики и производители — из России и других стран",
          "Цель — расширять ассортимент и каналы поставок",
          "Проверяйте качество, условия, документы и надёжность",
        ],
      },
    ]),
  },
  {
    slug: "lesson-3",
    title: "Международные поставки и логистика",
    estimatedMinutes: 11,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Международные поставки и логистика",
        subtitle: "Не только покупка, но и доставка получателю.",
      },
      {
        type: "paragraph",
        body: "Международные закупки требуют организации не только самой покупки, но и доставки товара получателю.",
      },
      {
        type: "paragraph",
        body: "В рамках соответствующих услуг AutoZap может помогать организовывать логистику и сопровождение поставок.",
      },
      {
        type: "bulletList",
        title: "Основные процессы",
        items: [
          "Организация доставки товаров",
          "Координация перевозки между участниками сделки",
          "Сопровождение экспортных и импортных процедур",
          "Таможенное оформление в рамках доступных услуг",
          "Организация расчётов в рублях и юанях, если это предусмотрено конкретной схемой сотрудничества",
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "Важно помнить",
        body: "Конкретные условия зависят от маршрута, товара, контрагентов и выбранной модели поставки.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l3-kc-1",
        question: "Клиент говорит: «Мы уже нашли товар за рубежом — осталось только оплатить». Что упустить нельзя?",
        options: [
          {
            id: "a",
            label:
              "После оплаты логистика и таможня обычно стандартны и мало зависят от маршрута и товара",
          },
          {
            id: "b",
            label:
              "Покупка — только часть процесса: нужны доставка, координация, оформление и расчёты по конкретной схеме; условия заранее не «одинаковые для всех»",
          },
          {
            id: "c",
            label:
              "Если контрагент найден самостоятельно, AutoZap к логистике и оформлению уже не подключается",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Международная сделка включает доставку и оформление; детали зависят от маршрута, товара и модели сотрудничества.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Международные закупки = покупка + доставка + оформление",
          "AutoZap может помогать с логистикой и сопровождением",
          "Условия зависят от маршрута, товара и модели поставки",
        ],
      },
    ]),
  },
  {
    slug: "lesson-4",
    title: "Финансирование закупок для магазинов",
    estimatedMinutes: 10,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Финансирование закупок для магазинов",
        subtitle: "Поддержка магазинов при расширении ассортимента.",
      },
      {
        type: "paragraph",
        body: "AutoZap развивает направление поддержки магазинов, которым необходимо расширять ассортимент, но собственных средств на закупку может быть недостаточно.",
      },
      {
        type: "paragraph",
        body: "Одна из рассматриваемых моделей предусматривает закупку автозапчастей компанией с последующей выплатой средств магазином на согласованных условиях.",
      },
      {
        type: "paragraph",
        body: "Это позволяет подходящему магазину рассмотреть возможность расширения товарного предложения без полной первоначальной оплаты закупки исключительно из собственных средств.",
      },
      {
        type: "callout",
        tone: "warn",
        title: "Перед сделкой",
        body: "Перед заключением сделки необходимо согласовать сумму, сроки, порядок выплат и ответственность сторон. Возможность финансирования определяется условиями конкретной программы и одобрением сделки.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l4-kc-1",
        question: "Магазин: «Значит, AutoZap просто закупит нам товар, а мы потом отдадим?» Как ответить точнее?",
        options: [
          {
            id: "a",
            label:
              "Да, по одной из моделей компания может закупить товар, а магазин выплачивает на согласованных условиях — но только после одобрения и фиксации суммы, сроков и ответственности",
          },
          {
            id: "b",
            label:
              "Да, для любого магазина это работает автоматически: сначала отгрузка, условия выплат подписывают потом",
          },
          {
            id: "c",
            label:
              "Нет: финансирование закупок означает, что магазин сразу платит полную сумму, а AutoZap лишь подбирает поставщика",
          },
        ],
        correctOptionId: "a",
        explanation:
          "Модель «закупка компанией → выплаты магазином» существует, но без согласования и одобрения её нельзя обещать.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Помогает магазинам расширять ассортимент при нехватке оборотных средств",
          "Модель: закупка компанией → выплаты магазином на условиях",
          "Нужны согласование условий и одобрение по программе",
        ],
      },
    ]),
  },
  {
    slug: "lesson-5",
    title: "Покупка автомобиля в рассрочку",
    estimatedMinutes: 9,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Покупка автомобиля в рассрочку",
        subtitle: "Отдельное направление с другой логикой, чем финансирование закупок.",
      },
      {
        type: "paragraph",
        body: "Ещё одно направление AutoZap связано с приобретением автомобилей в рассрочку.",
      },
      {
        type: "paragraph",
        body: "В рамках соответствующей модели продавец может получить полную оплату после выполнения условий сделки, а покупатель — выплачивать стоимость автомобиля частями по согласованному графику.",
      },
      {
        type: "paragraph",
        body: "Процесс предполагает выбор автомобиля, согласование условий, необходимые проверки и оформление документов.",
      },
      {
        type: "callout",
        tone: "info",
        title: "Доступность",
        body: "Доступность рассрочки, порядок оплаты и требования к участникам определяются условиями конкретной программы.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l5-kc-1",
        question: "Клиент путает рассрочку на авто и финансирование закупок. Какая формулировка точнее?",
        options: [
          {
            id: "a",
            label:
              "В обоих случаях AutoZap сначала держит товар на складе, а участник потом выкупает его частями по одному графику",
          },
          {
            id: "b",
            label:
              "Рассрочка на авто — для сделки купли-продажи машины (продавец получает полную сумму, покупатель — график); финансирование закупок — поддержка магазина при расширении ассортимента",
          },
          {
            id: "c",
            label:
              "Разница только в сумме: до порога — рассрочка на авто, выше — финансирование закупок магазина",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Это разные продукты с разной логикой участников, а не «один инструмент с разным лимитом».",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Продавец получает полную оплату по условиям сделки",
          "Покупатель выплачивает стоимость частями",
          "Условия и доступность задаются конкретной программой",
        ],
      },
    ]),
  },
  {
    slug: "lesson-6",
    title: "Автосервисы и мастера",
    estimatedMinutes: 9,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Автосервисы и мастера",
        subtitle: "Связь автовладельцев с сервисами и специалистами.",
      },
      {
        type: "paragraph",
        body: "Направление автосервисов помогает связывать автовладельцев с организациями и специалистами, предоставляющими услуги по обслуживанию и ремонту автомобилей.",
      },
      {
        type: "paragraph",
        body: "В зависимости от доступных функций пользователи могут искать сервисы, знакомиться с перечнем услуг, местоположением и рейтингом.",
      },
      {
        type: "callout",
        tone: "ok",
        title: "Для сервисов и для клиента",
        body: "Для автосервисов это возможность представить свои услуги и привлечь дополнительную аудиторию. Связь между поиском запчастей и поиском сервиса позволяет пользователю последовательно решать задачи по ремонту автомобиля.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l6-kc-1",
        question: "Автовладелец нашёл нужную деталь. Зачем в продукте ещё направление автосервисов?",
        options: [
          {
            id: "a",
            label:
              "Чтобы после выбора запчасти можно было подобрать сервис или мастера и закрыть ремонт в одном сценарии",
          },
          {
            id: "b",
            label:
              "Автосервисы нужны только магазинам: автовладелец на маркетплейсе сервисы не ищет",
          },
          {
            id: "c",
            label:
              "Направление сервисов заменяет каталог запчастей — деталь подбирает уже мастер на месте",
          },
        ],
        correctOptionId: "a",
        explanation:
          "Запчасти и сервис дополняют друг друга: поиск детали и поиск исполнителя ремонта связаны.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Связывает автовладельцев с сервисами и мастерами",
          "Поиск по услугам, локации и рейтингу — если функции доступны",
          "Дополняет поиск запчастей в сценарии ремонта",
        ],
      },
    ]),
  },
  {
    slug: "lesson-7",
    title: "Дополнительные сервисы для автовладельцев",
    estimatedMinutes: 10,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Дополнительные сервисы для автовладельцев",
        subtitle: "Страхование, ИИ-помощник и другие цифровые инструменты.",
      },
      {
        type: "paragraph",
        body: "Помимо поиска запчастей и автосервисов, AutoZap развивает дополнительные цифровые направления.",
      },
      {
        type: "bulletList",
        title: "К ним относятся",
        items: [
          "Онлайн-страхование — возможность ознакомиться с доступными страховыми предложениями и воспользоваться услугой оформления, если она подключена",
          "ИИ-помощник — предварительный разбор описанных симптомов неисправности и возможных причин проблемы",
          "Дополнительные автомобильные сервисы — инструменты, упрощающие поиск и решение повседневных задач автовладельца",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        title: "Ограничения",
        body: "ИИ-помощник не заменяет профессиональную диагностику. Доступность остальных сервисов зависит от их фактического запуска и подключения партнёров.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l7-kc-1",
        question: "Клиент: «ИИ написал причину поломки — можно сразу заказывать работу?» Как ответить?",
        options: [
          {
            id: "a",
            label:
              "Да: разбор симптомов ИИ считается достаточным основанием для ремонта без проверки на сервисе",
          },
          {
            id: "b",
            label:
              "ИИ даёт предварительный ориентир по симптомам; окончательную диагностику всё равно делает специалист",
          },
          {
            id: "c",
            label:
              "ИИ-помощник предназначен только менеджерам для скриптов продаж, автовладельцу им пользоваться не стоит",
          },
        ],
        correctOptionId: "b",
        explanation:
          "ИИ — предварительный разбор, не замена профессиональной диагностики.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Страхование, ИИ-помощник и другие сервисы — дополнительные направления",
          "ИИ не заменяет диагностику",
          "Доступность зависит от запуска и партнёров",
        ],
      },
    ]),
  },
  {
    slug: "lesson-8",
    title: "Как связаны направления AutoZap",
    estimatedMinutes: 11,
    content: lessonContentSchema.parse([
      {
        type: "hero",
        title: "Как связаны направления AutoZap",
        subtitle: "Отдельные инструменты работают в общем процессе.",
      },
      {
        type: "paragraph",
        body: "Различные направления продукта могут дополнять друг друга.",
      },
      {
        type: "paragraph",
        body: "Например, магазин размещает ассортимент на маркетплейсе, расширяет список поставщиков и при необходимости рассматривает возможности финансирования закупок. Если товар приобретается за рубежом, дополнительно организуются доставка и необходимые процедуры оформления.",
      },
      {
        type: "paragraph",
        body: "Автовладелец, в свою очередь, может искать запчасти, подбирать автосервис и пользоваться дополнительными автомобильными услугами.",
      },
      {
        type: "callout",
        tone: "ok",
        title: "Для менеджера",
        body: "Таким образом, отдельные инструменты AutoZap могут работать в рамках общего процесса, помогая участникам решать связанные задачи. При этом менеджер должен знать, какие функции уже доступны, какие предоставляются через партнёров, а какие ещё находятся в разработке.",
      },
      {
        type: "scenarioChoice",
        id: "m2-l8-sc-1",
        prompt:
          "Магазин: «Хотим и продавать у вас, и возить часть позиций из Китая». Какой ответ сильнее?",
        options: [
          {
            id: "a",
            label:
              "Подключим витрину сейчас, а про импорт лучше не говорить на первом созвоне — иначе клиент уйдёт в детали логистики",
            qualityAz: 1,
          },
          {
            id: "b",
            label:
              "Можно совместить: продажи на маркетплейсе и отдельно закупку/логистику; если нужно — обсудим финансирование. Условия каждой части согласуем отдельно",
            qualityAz: 2,
          },
          {
            id: "c",
            label:
              "При подключении к маркетплейсу импорт и финансирование уже входят в пакет на единых типовых условиях",
            qualityAz: 0,
          },
        ],
        correctOptionId: "b",
        passOptionIds: ["a", "b"],
        explanation:
          "Сильнее показать связку и разделить условия. Умолчать о релевантном запросе — слабее; обещать «всё в пакете» — хуже.",
      },
      {
        type: "knowledgeCheck",
        id: "m2-l8-kc-1",
        question: "Перед презентацией клиенту менеджер сверяет статус функций. Зачем?",
        options: [
          {
            id: "a",
            label:
              "Чтобы обещать только то, что уже доступно или идёт через партнёров, и не выдавать разработку за готовый сервис",
          },
          {
            id: "b",
            label:
              "Чтобы в разговоре опираться только на слайды конкурентов — так проще сравнить цены",
          },
          {
            id: "c",
            label:
              "Чтобы сократить презентацию до маркетплейса: остальные направления клиенту лучше не показывать",
          },
        ],
        correctOptionId: "a",
        explanation:
          "Нужно различать: доступно / через партнёров / в разработке — иначе легко пообещать лишнее.",
        required: true,
      },
      {
        type: "summary",
        title: "Коротко",
        items: [
          "Направления дополняют друг друга в сценариях магазина и автовладельца",
          "Международные закупки связываются с логистикой и оформлением",
          "Менеджер различает: доступно / через партнёров / в разработке",
        ],
      },
    ]),
  },
];

const ASSESSMENT: AssessmentContent = assessmentContentSchema.parse([
  {
    type: "mcq",
    id: "m2-a-mcq-1",
    prompt:
      "Магазин хочет «просто больше покупателей». Какое направление продукта ближе всего к этой формулировке?",
    options: [
      {
        id: "a",
        label: "Финансирование закупок — оно само по себе приводит розничный трафик на точку",
      },
      {
        id: "b",
        label: "Рассрочка на автомобиль — через неё магазины запчастей обычно набирают аудиторию",
      },
      {
        id: "c",
        label:
          "Маркетплейс — дополнительный канал, где ассортимент видят пользователи площадки",
      },
    ],
    correctOptionId: "c",
    points: 1,
  },
  {
    type: "mcq",
    id: "m2-a-mcq-2",
    prompt: "Почему нельзя смешивать в одном обещании «финансирование закупок» и «рассрочку на авто»?",
    options: [
      {
        id: "a",
        label:
          "Потому что это разные модели: одна — про поддержку магазина с ассортиментом, другая — про покупку автомобиля частями",
      },
      {
        id: "b",
        label: "Потому что обе услуги запрещено упоминать на первом касании с клиентом",
      },
      {
        id: "c",
        label: "Потому что они отличаются только названием в презентации, а выплаты устроены одинаково",
      },
    ],
    correctOptionId: "a",
    points: 1,
  },
  {
    type: "matching",
    id: "m2-a-match-1",
    prompt: "Сопоставьте запрос клиента и направление, о котором стоит говорить в первую очередь",
    pairs: [
      {
        left: "«Хотим витрину и сравнение предложений»",
        right: "Маркетплейс",
      },
      {
        left: "«Нашли товар за рубежом, нужна доставка и оформление»",
        right: "Международная логистика",
      },
      {
        left: "«По симптомам подскажите, куда смотреть — не вместо СТО»",
        right: "ИИ-помощник",
      },
    ],
    points: 2,
  },
  {
    type: "scenario",
    id: "m2-a-sc-1",
    prompt:
      "Магазин: «Ассортимент надо расширить, своих денег мало, часть позиций — из Китая». Какой ответ уместнее?",
    options: [
      {
        id: "a",
        label:
          "Сфокусироваться только на витрине маркетплейса: закупки и логистику лучше отложить, пока не вырастут продажи",
      },
      {
        id: "b",
        label:
          "Разобрать связку поставщиков и международной поставки; если уместно — финансирование. Подчеркнуть, что сумма, сроки и одобрение согласуются отдельно",
      },
      {
        id: "c",
        label:
          "Сразу назвать типовой срок одобрения финансирования и фиксированную стоимость логистики «как у прошлых клиентов»",
      },
    ],
    correctOptionId: "b",
    explanation:
      "Запрос прямо про связку направлений. Фиксированные обещания до согласования — ошибка; игнор логистики/финансов — слабее.",
    points: 2,
  },
  {
    type: "findError",
    id: "m2-a-err-1",
    prompt: "Какая фраза менеджера звучит уверенно, но по смыслу слабее остальных?",
    statements: [
      {
        id: "s1",
        label:
          "«Перед презентацией сверю, что уже в продукте, что через партнёров, а что ещё в разработке»",
      },
      {
        id: "s2",
        label:
          "«ИИ по симптомам уже ставит диагноз — на СТО можно ехать только за заменой детали»",
      },
      {
        id: "s3",
        label:
          "«По импорту условия зависят от маршрута, товара и схемы — без деталей не зафиксирую срок»",
      },
    ],
    incorrectStatementId: "s2",
    explanation:
      "ИИ даёт предварительный разбор и не заменяет диагностику специалиста.",
    points: 2,
  },
  {
    type: "freeText",
    id: "m2-a-ft-1",
    prompt:
      "Клиент-магазин хочет и продавать на площадке, и закупать часть позиций за рубежом при нехватке оборотных средств. Опишите, какие направления продукта вы свяжете и что обязательно уточните перед обещаниями. 5–8 предложений.",
    hint: "Без выдуманных цифр и гарантий одобрения. Куратор проверит связку направлений и осторожность формулировок.",
    curatorReviewed: true,
  },
]);

export async function seedModule2Content(prisma: PrismaClient) {
  const module2 = await prisma.module.findFirst({
    where: { slug: "module-2" },
    include: { lessons: { orderBy: { position: "asc" } }, assignments: true, course: true },
  });
  if (!module2) {
    throw new Error("Module module-2 not found — run full seed first");
  }

  await prisma.module.update({
    where: { id: module2.id },
    data: {
      title: "Продукт AutoZap",
      description:
        "Направления продукта: маркетплейс, поставщики, логистика, финансы, автосервисы и дополнительные сервисы.",
      status: "PUBLISHED",
    },
  });

  for (let i = 0; i < LESSONS.length; i++) {
    const lessonDef = LESSONS[i];
    const existing = module2.lessons.find((l) => l.slug === lessonDef.slug);
    if (existing) {
      await prisma.lesson.update({
        where: { id: existing.id },
        data: {
          title: lessonDef.title,
          position: i + 1,
          estimatedMinutes: lessonDef.estimatedMinutes,
          content: lessonDef.content,
          status: "PUBLISHED",
        },
      });
    } else {
      await prisma.lesson.create({
        data: {
          moduleId: module2.id,
          slug: lessonDef.slug,
          title: lessonDef.title,
          position: i + 1,
          estimatedMinutes: lessonDef.estimatedMinutes,
          content: lessonDef.content,
          status: "PUBLISHED",
        },
      });
    }
  }

  const keepSlugs = new Set(LESSONS.map((l) => l.slug));
  for (const lesson of module2.lessons) {
    if (!keepSlugs.has(lesson.slug)) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { status: "DRAFT" },
      });
    }
  }

  await prisma.moduleAssessment.upsert({
    where: { moduleId: module2.id },
    create: {
      moduleId: module2.id,
      title: "Финальная проверка — Модуль 2",
      passScore: 70,
      content: ASSESSMENT,
    },
    update: {
      title: "Финальная проверка — Модуль 2",
      passScore: 70,
      content: ASSESSMENT,
    },
  });

  let assignment = module2.assignments[0];
  if (assignment) {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: {
        title: "Объясни своими словами — Модуль 2",
        description:
          "Свободный ответ из финальной проверки. Куратор проверяет понимание направлений продукта AutoZap и их связки.",
      },
    });
  } else {
    assignment = await prisma.assignment.create({
      data: {
        moduleId: module2.id,
        title: "Объясни своими словами — Модуль 2",
        description:
          "Свободный ответ из финальной проверки. Куратор проверяет понимание направлений продукта AutoZap и их связки.",
      },
    });
  }

  const existingQuiz = await prisma.quiz.findFirst({ where: { moduleId: module2.id } });
  if (!existingQuiz) {
    await prisma.quiz.create({
      data: {
        moduleId: module2.id,
        title: "Тест — Модуль 2",
      },
    });
  }

  const LESSON_AZ = 5;
  const CLEAN_BONUS_AZ = 1;
  const QUALITY_CAP_AZ = 2;
  const ASSIGNMENT_MAX_AZ = 10;
  const ASSIGNMENT_RANGES = [
    { label: "Слабо", minAz: 3, maxAz: 4, criteria: "Ответ есть, но поверхностно", sortOrder: 0 },
    { label: "Средне", minAz: 5, maxAz: 7, criteria: "Основные направления поняты", sortOrder: 1 },
    {
      label: "Хорошо",
      minAz: 8,
      maxAz: 10,
      criteria: "Понимает направления и их связку для магазина и автовладельца",
      sortOrder: 2,
    },
  ];

  const qualityLessonSlugs = new Set(["lesson-4", "lesson-5", "lesson-8"]);

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const { AZService } = await import("../server/az/az-service");
  const az = new AZService(prisma);
  const lessons = await prisma.lesson.findMany({
    where: { moduleId: module2.id, status: "PUBLISHED" },
    orderBy: { position: "asc" },
  });

  async function ensureRule(params: {
    actionType: "LESSON_COMPLETED" | "CUSTOM" | "ASSIGNMENT_REVIEWED";
    scopeType: "LESSON" | "MODULE";
    lessonId?: string;
    name: string;
    maxAz: number;
    allowsPartial?: boolean;
    qualityDependent?: boolean;
    qualityRanges?: typeof ASSIGNMENT_RANGES;
  }) {
    const existing = await prisma.azRewardRule.findFirst({
      where: {
        actionType: params.actionType,
        active: true,
        ...(params.lessonId ? { lessonId: params.lessonId } : { moduleId: module2.id, lessonId: null }),
        ...(params.actionType === "CUSTOM" && params.lessonId ? { name: params.name } : {}),
      },
      include: { versions: { where: { active: true }, orderBy: { version: "desc" }, take: 1 } },
    });

    if (!existing) {
      await az.createRewardRule({
        actionType: params.actionType,
        scopeType: params.scopeType,
        courseId: module2.courseId,
        moduleId: module2.id,
        lessonId: params.lessonId,
        name: params.name,
        maxAz: params.maxAz,
        allowsPartial: params.allowsPartial ?? false,
        allowsRepeat: false,
        qualityDependent: params.qualityDependent ?? false,
        qualityRanges: params.qualityRanges,
        createdById: admin?.id,
      });
      return;
    }

    if (existing.versions[0]?.maxAz !== params.maxAz) {
      await az.publishRewardRuleVersion({
        ruleId: existing.id,
        maxAz: params.maxAz,
        allowsPartial: params.allowsPartial ?? false,
        allowsRepeat: false,
        qualityDependent: params.qualityDependent ?? false,
        qualityRanges: params.qualityRanges,
        applyMode: "FUTURE_ONLY",
        createdById: admin?.id,
        note: "Module 2 earning model sync",
      });
    }
  }

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    if ((lesson.estimatedMinutes ?? 0) <= 5) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { estimatedMinutes: 6 },
      });
    }

    await ensureRule({
      actionType: "LESSON_COMPLETED",
      scopeType: "LESSON",
      lessonId: lesson.id,
      name: `Module 2 / Lesson ${i + 1} completion`,
      maxAz: LESSON_AZ,
    });

    const bonusCap = qualityLessonSlugs.has(lesson.slug)
      ? CLEAN_BONUS_AZ + QUALITY_CAP_AZ
      : CLEAN_BONUS_AZ;
    await ensureRule({
      actionType: "CUSTOM",
      scopeType: "LESSON",
      lessonId: lesson.id,
      name: `Module 2 / Lesson ${i + 1} clean & quality`,
      maxAz: bonusCap,
      allowsPartial: true,
    });
  }

  await ensureRule({
    actionType: "ASSIGNMENT_REVIEWED",
    scopeType: "MODULE",
    name: "Module 2 practice assignment",
    maxAz: ASSIGNMENT_MAX_AZ,
    allowsPartial: true,
    qualityDependent: true,
    qualityRanges: ASSIGNMENT_RANGES,
  });

  return {
    moduleId: module2.id,
    lessons: LESSONS.length,
    lessonAz: LESSON_AZ,
    cleanBonus: CLEAN_BONUS_AZ,
    qualityCap: QUALITY_CAP_AZ,
    assignmentAz: "3-10",
  };
}

export async function runSeedModule2Standalone() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const result = await seedModule2Content(prisma);
    console.log("Module 2 content seeded:", result);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirect =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("seed-module2.ts") || process.argv[1].endsWith("seed-module2.js"));

if (isDirect) {
  runSeedModule2Standalone().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
