# 🎮 3D Web Pack — твой набор для создания крутых 3D-сайтов

Собран 14.06.2026 для работы в Claude Code. Это твой «штаб» для разработки сайтов уровня Awwwards / FWA / Codrops: 6 кастомных агентов + 4 скила + рекомендованный стек и инструменты рынка.

---

## 📦 Что установлено и куда

Всё лежит в **глобальном** `~/.claude` (`C:\Users\ivan2\.claude`), поэтому работает **в любом твоём проекте**, а не только в этой папке.

**Агенты** → `~/.claude/agents/`
**Скилы** → `~/.claude/skills/`
**Этот гайд** → в папке `3Д` (рабочий справочник).

---

## 🤖 6 агентов (вызываются автоматически по смыслу задачи, или явно)

| Агент | За что отвечает | Когда вызывать |
|---|---|---|
| **threejs-architect** | Архитектура и планирование: выбор стека, граф сцены, бюджеты FPS/ассетов, структура проекта | В начале нового сайта или фичи |
| **r3f-engineer** | Реализация сцен на React Three Fiber / Three.js: меши, свет, материалы, загрузка моделей, drei | Когда нужно писать/править 3D-код |
| **shader-artist** | Шейдеры GLSL и TSL (WebGPU): raymarching, noise, fresnel, dissolve, частицы, кастомные материалы | «Сделай эффект как…», свечения, искажения |
| **motion-choreographer** | Движение: GSAP ScrollTrigger, Lenis, drei ScrollControls, камера по скроллу, react-spring | Скролл-сторителлинг, анимация, интерактив |
| **webgl-perf-auditor** | Производительность: draw calls, инстансинг, LOD, сжатие, утечки памяти, мобилки | Тормозит, лагает, греет телефон |
| **asset-pipeline-engineer** | Пайплайн ассетов: glTF/GLB оптимизация, Draco, KTX2, gltfjsx, интеграция AI-моделей | Подготовить/сжать/подключить модель |

**Как вызвать явно:** просто попроси, например — «Используй агента `shader-artist`, сделай иридесцентный материал для сферы».
**Автоматически:** агенты подхватываются сами, когда задача совпадает с их описанием.

---

## 🛠 4 скила (запускаются как `/имя` или по описанию)

| Скил | Что делает |
|---|---|
| **scaffold-3d-site** | Создаёт новый 3D-проект с нуля (Vite/Next + R3F + drei + postprocessing + motion) |
| **optimize-3d-assets** | Сжимает модели и текстуры (gltf-transform, gltfpack, Draco, KTX2), gltfjsx |
| **add-postprocessing** | Добавляет кинематографичный пост-процесс (bloom, DOF, grain, tone mapping) |
| **scroll-3d-scene** | Подключает скролл-управление сценой (Lenis + GSAP / drei ScrollControls) |

---

## 🧱 Рекомендованный стек 2026

### Базовый рендер-слой
- **React Three Fiber (R3F)** + **@react-three/drei** — дефолт для компонентного 3D в React/Next. (~900K загрузок/нед.)
- **Three.js** — когда нужен максимальный контроль или нет React. (~3.5M загрузок/нед., индустриальный стандарт)
- **Babylon.js** — тяжёлые интерактивные приложения, встроенная физика/XR, командные редакторы.
- **PlayCanvas / Spline** — когда дизайнерам нужен визуальный редактор.
- **WebGPU** — с января 2026 это Baseline во всех основных браузерах. Three.js `WebGPURenderer` + язык шейдеров **TSL** (с авто-фолбэком на WebGL2). Для новых проектов — целься в WebGPU.

### Экосистема R3F
- `@react-three/postprocessing` — пост-эффекты
- `@react-three/rapier` — физика
- `@react-three/drei` — хелперы (Environment, OrbitControls, useGLTF, Instances, Text, Html, Detailed…)
- `leva` — GUI для подбора параметров
- `zustand` — состояние сцены
- `maath` — математика/изинги

### Анимация и движение
- **GSAP** + **ScrollTrigger** — стандарт для скролл-анимаций (с 2025 бесплатен целиком, включая плагины)
- **Lenis** — плавный скролл
- **react-spring** (@react-spring/three) — пружинная физика
- **theatre.js** — визуальный редактор таймлайнов
- **Rive / Lottie** — векторная анимация для UI-слоя

### Производительность (целься: <100 draw calls, 60fps)
- **Draco / meshopt** — сжатие геометрии
- **KTX2 / Basis** — сжатие текстур
- Инстансинг (`InstancedMesh` / `<Instances>`), `BatchedMesh`
- LOD через `<Detailed>`, `frameloop="demand"`, `<PerformanceMonitor>`, `<AdaptiveDpr>`
- Замер: `renderer.info`, **stats-gl**, drei **`<Perf>`**, Spector.js

---

## 🎨 AI-инструменты для 3D-ассетов

| Инструмент | Сильная сторона |
|---|---|
| **Meshy AI** | Лучшие PBR-текстуры, авто-риг, 500+ пресетов анимации — полный пайплайн персонажей |
| **Tripo AI** | Самая быстрая генерация (~8 сек), чистая геометрия, production-ready меши для игр/печати |
| **Rodin / Hyper3D** | Высокодетальные модели |
| **Spline AI** | Генерация сцен + визуальный редактор + экспорт в веб |
| **Poly Haven** | Бесплатные HDRI, текстуры, модели (CC0) |

Любой AI-ассет — это **сырьё**: прогоняй через `optimize-3d-assets` перед продакшеном (проверь масштаб, origin, PBR-карты).

---

## 📚 Где учиться (топ-ресурсы)

- **Three.js Journey** (Bruno Simon) — лучший платный курс по Three.js + R3F
- **Wawa Sensei** — курсы и YouTube по R3F
- **Codrops** (tympanus.net/codrops) — туториалы и демки топ-уровня
- **R3F docs** — r3f.docs.pmnd.rs
- **Three.js docs + examples** — threejs.org (300+ примеров)
- **utsubo.com/blog** — 100 советов по производительности Three.js
- Вдохновение: **Bruno Simon** (bruno-simon.com), **Apple**, **Nike**, галереи **Awwwards / FWA**

---

## 🚀 Типичный воркфлоу: от идеи до сайта

1. **Планирование** → `threejs-architect`: «Хочу сайт-портфолио с 3D-сценой и скролл-историей. Спланируй стек и архитектуру.»
2. **Старт проекта** → скил `scaffold-3d-site`
3. **Сборка сцены** → `r3f-engineer`: модели, свет, материалы
4. **Ассеты** → `asset-pipeline-engineer` + скил `optimize-3d-assets`
5. **Вид/эффекты** → `shader-artist` + скил `add-postprocessing`
6. **Движение** → `motion-choreographer` + скил `scroll-3d-scene`
7. **Полировка** → `webgl-perf-auditor`: довести до 60fps на мобилке

---

## 💬 Примеры фраз для запуска

- «Спланируй архитектуру 3D-лендинга для бренда кроссовок» → *threejs-architect*
- «/scaffold-3d-site, сделай Vite + R3F с full-пресетом»
- «Добавь в сцену иридесцентную жидкую сферу с искажением» → *shader-artist*
- «Камера должна лететь по сцене при скролле через 3 секции» → *motion-choreographer* / `/scroll-3d-scene`
- «Сайт лагает на телефоне, разберись» → *webgl-perf-auditor*
- «Сожми этот GLB на 20 МБ и подключи к сцене» → *asset-pipeline-engineer* / `/optimize-3d-assets`

---

## ℹ️ Насколько это сложно?

Короткий ответ: **порог входа средний, потолок — очень высокий, и пак закрывает почти весь путь.**

- Базовую крутящуюся сцену со светом и моделью — соберём за минуты (`scaffold-3d-site`).
- Полноценный сайт со скролл-историей, кастомными шейдерами и пост-процессом — это уже проект на дни/недели, но каждый его слой закрыт отдельным агентом, так что ты идёшь по шагам, а не тонешь.
- Самое сложное в 3D-вебе — не «нарисовать», а **удержать 60fps на мобилке**. Поэтому в паке отдельный агент только на производительность.

Тебе НЕ нужно быть экспертом в Three.js — нужно понимать, *что* ты хочешь, а *как* закроют агенты.

---

## 📁 Карта файлов пака

```
~/.claude/agents/
  threejs-architect.md
  r3f-engineer.md
  shader-artist.md
  motion-choreographer.md
  webgl-perf-auditor.md
  asset-pipeline-engineer.md

~/.claude/skills/
  scaffold-3d-site/SKILL.md
  optimize-3d-assets/SKILL.md
  add-postprocessing/SKILL.md
  scroll-3d-scene/SKILL.md

3Д/3D-WEB-PACK.md   ← этот файл
```

---

### Источники (market research, 2026)
- React Three Fiber vs Three.js 2026 — graffersid.com, creativedevjobs.com
- Three.js vs Babylon.js vs PlayCanvas — utsubo.com, pkgpulse.com
- WebGPU Baseline 2026 — vr.org, programming-helper.com
- Three.js 2026 (WebGPU/TSL) — utsubo.com/blog/threejs-2026-what-changed
- Best 3D websites 2026 — mdx.so, causeandeffectsp.com
- AI 3D генераторы — meshy.ai, tripo3d.ai, rapiddirect.com
- Производительность — utsubo.com/blog/threejs-best-practices-100-tips, Codrops
- Обучение — threejs-journey.com, wawasensei.dev, r3f.docs.pmnd.rs
