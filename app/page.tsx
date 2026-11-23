"use client";

import { type CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

type Step =
  | "projectType"
  | "category"
  | "quantity"
  | "ecommerceDetails"
  | "printDetails"
  | "serviceDetails"
  | "printPurpose"
  | "printFormat"
  | "printStructure"
  | "printFold"
  | "contentStatus"
  | "imageStatus"
  | "versionCount"
  | "complexity"
  | "materials"
  | "timeline"
  | "printDeadline"
  | "sourceFile"
  | "printProduction"
  | "monthlyServices"
  | "monthlySpecifications"
  | "monthlyCadence"
  | "result";

type ProjectType = "single" | "monthly";
type Category = "ecommerce" | "print" | "other" | "mixed";
type Complexity = "simple" | "standard" | "detailed";
type Timeline = "regular";
type Materials = "ready" | "partial" | "need-help";
type PrintPurpose =
  | "promotion"
  | "product"
  | "store"
  | "event"
  | "distribution"
  | "counter"
  | "insert"
  | "direct-mail"
  | "dine-in"
  | "takeout"
  | "seasonal"
  | "other";
type PrintFormat = "a4-portrait" | "a4-landscape" | "a5-portrait" | "a5-landscape" | "custom";
type PrintStructure = "single" | "double" | "folded" | "multipage";
type PrintFold = "half" | "tri" | "accordion" | "custom";
type ContentStatus = "final" | "partial" | "need-copy";
type ImageStatus = "ready" | "need-edit" | "need-images";
type PrintPaper = "coated" | "card" | "uncoated" | "unsure";
type PrintFinish = "none" | "laminate" | "fold-cut" | "custom";
type MonthlyCadence = "weekly" | "campaign" | "flexible";

const inlineBackSteps = new Set<Step>([
  "category",
  "quantity",
  "ecommerceDetails",
  "printDetails",
  "serviceDetails",
  "printPurpose",
  "versionCount",
  "printDeadline",
  "sourceFile",
  "printProduction",
  "monthlyServices",
  "monthlySpecifications",
  "monthlyCadence",
]);

type PrintSpecification = {
  support?: boolean;
  quantity?: number;
  paper?: PrintPaper;
  finish?: PrintFinish;
};

type PrintDesignDetail = {
  purposes?: PrintPurpose[];
  format?: PrintFormat;
  structure?: PrintStructure;
  pageCount?: number;
  customPageCount?: boolean;
  fold?: PrintFold;
  contentStatus?: ContentStatus;
  imageStatus?: ImageStatus;
  versionCount?: number;
  complexity?: Complexity;
  timeline?: Timeline;
  deadline?: string;
};

type PrintDetailField =
  | "purposes"
  | "format"
  | "structure"
  | "pageCount"
  | "fold"
  | "contentStatus"
  | "imageStatus"
  | "versionCount"
  | "complexity"
  | "timeline";

type EcommerceCopyStatus = "ready" | "draft" | "need-copy";
type EcommerceAssetStatus = "ready" | "need-edit" | "need-create";

type EcommerceDesignDetail = {
  bannerExtensionCount?: number;
  placement?: string;
  size?: string;
  copyStatus?: EcommerceCopyStatus;
  assetStatus?: EcommerceAssetStatus;
  versionCount?: number;
  visualLevel?: Complexity;
  timeline?: Timeline;
};

type EcommerceDetailField =
  | "quantity"
  | "bannerExtensionCount"
  | "productCount"
  | "placement"
  | "size"
  | "copyStatus"
  | "assetStatus"
  | "versionCount"
  | "visualLevel"
  | "timeline";

type ServiceDesignDetail = {
  seriesArtwork?: "none" | "yes";
  applicationCount?: number;
  purpose?: string;
  specification?: string;
  contentStatus?: string;
  assetStatus?: string;
  complexity?: Complexity;
  timeline?: Timeline;
};

type ServiceDetailField =
  | "quantity"
  | "seriesArtwork"
  | "purpose"
  | "specification"
  | "contentStatus"
  | "assetStatus"
  | "complexity"
  | "timeline";

type Answers = {
  projectType?: ProjectType;
  category?: Category;
  serviceIds: string[];
  quantities: Record<string, number>;
  socialPostCount?: number;
  socialPostImageCounts?: Array<number | undefined>;
  productFrameProductCounts?: Array<number | undefined>;
  ecommerceDesignDetails: Record<string, EcommerceDesignDetail>;
  ecommerceDetailIndex?: number;
  serviceDesignDetails: Record<string, ServiceDesignDetail>;
  monthlyServiceDesignDetails?: Record<string, ServiceDesignDetail[]>;
  serviceDetailIndex?: number;
  sourceFileServiceIds: string[];
  sourceFileIndex?: number;
  printDesignDetails: Record<string, PrintDesignDetail>;
  monthlyPrintDesignDetails?: Record<string, PrintDesignDetail[]>;
  printDetailIndex?: number;
  complexity?: Complexity;
  materials?: Materials;
  timeline?: Timeline;
  printDeadline?: string;
  monthlySourceFileQuantities: Record<string, number>;
  printSpecifications: Record<string, PrintSpecification>;
  monthlyPlanId?: string;
  monthlyGroupCount?: number;
  monthlyCadence?: MonthlyCadence;
};

const SOCIAL_IMAGES_PER_POST_LIMIT = 10;
const BANNER_MAIN_VISUAL_LIMIT = 5;
const PHOTO_QUANTITY_LIMIT = 99;

type Service = {
  id: string;
  category: Category;
  name: string;
  description: string;
  note?: string;
  low: number;
  high: number;
  unit: string;
  pricing?: "standard" | "dm" | "card";
};

type PriceBreakdownItem = {
  label: string;
  detail: string;
  low: number;
  high: number;
};

type Message = {
  speaker: "studio" | "user";
  text: string;
};

type HistoryEntry = {
  step: Step;
  answers: Answers;
  messages: Message[];
};

type JourneySection = "cooperation" | "monthly" | "services" | "specifications" | "source" | "printing" | "delivery" | "result";

const journeySectionLabels: Record<JourneySection, string> = {
  cooperation: "合作方式",
  monthly: "月方案設定",
  services: "服務項目",
  specifications: "規格",
  source: "加購",
  printing: "加購",
  delivery: "交付節奏",
  result: "結果",
};

const singleJourneySections: JourneySection[] = ["cooperation", "services", "specifications", "source", "result"];
const monthlyJourneySections: JourneySection[] = ["cooperation", "services", "specifications", "source", "delivery", "result"];

function getJourneySection(step: Step): JourneySection {
  if (step === "projectType") return "cooperation";
  if (step === "monthlyCadence") return "delivery";
  if (["category", "monthlyServices"].includes(step)) return "services";
  if (step === "monthlySpecifications") return "specifications";
  if (step === "sourceFile") return "source";
  if (step === "printProduction") return "source";
  if (step === "result") return "result";
  return "specifications";
}

function restoreRememberedSpecifications(current: Answers, remembered?: Answers): Answers {
  if (!remembered) return current;
  const selectedServiceIds = new Set(current.serviceIds);
  const detailedServiceIds = new Set([
    ...ecommerceDetailServiceIds,
    ...detailedPrintServiceIds,
    ...serviceDetailServiceIds,
  ]);
  const quantities = { ...remembered.quantities, ...current.quantities };

  Object.keys(quantities).forEach((serviceId) => {
    if (!selectedServiceIds.has(serviceId) || (!detailedServiceIds.has(serviceId) && !(serviceId in current.quantities))) {
      delete quantities[serviceId];
    }
  });

  const ecommerceDesignDetails = Object.fromEntries(
    Object.entries({ ...remembered.ecommerceDesignDetails, ...current.ecommerceDesignDetails })
      .filter(([serviceId]) => selectedServiceIds.has(serviceId)),
  );
  const printDesignDetails = Object.fromEntries(
    Object.entries({ ...remembered.printDesignDetails, ...current.printDesignDetails })
      .filter(([serviceId]) => selectedServiceIds.has(serviceId)),
  );
  const serviceDesignDetails = Object.fromEntries(
    Object.entries({ ...remembered.serviceDesignDetails, ...current.serviceDesignDetails })
      .filter(([serviceId]) => selectedServiceIds.has(serviceId)),
  );

  return {
    ...current,
    quantities,
    socialPostCount: selectedServiceIds.has("social") ? current.socialPostCount ?? remembered.socialPostCount : undefined,
    socialPostImageCounts: selectedServiceIds.has("social")
      ? (current.socialPostImageCounts ?? remembered.socialPostImageCounts)?.map((count) =>
          count === undefined ? undefined : Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, count)))
      : undefined,
    productFrameProductCounts: selectedServiceIds.has("product-frame")
      ? current.productFrameProductCounts ?? remembered.productFrameProductCounts
      : undefined,
    ecommerceDesignDetails,
    printDesignDetails,
    serviceDesignDetails,
  };
}

const services: Service[] = [
  {
    id: "banner",
    category: "ecommerce",
    name: "網站橫幅／活動主視覺",
    description: "網站首頁、活動頁使用的橫幅圖片",
    low: 1000,
    high: 2500,
    unit: "版",
  },
  {
    id: "social",
    category: "ecommerce",
    name: "IG／FB 社群圖文",
    description: "Instagram、Facebook 貼文與限時動態",
    low: 500,
    high: 1000,
    unit: "張",
  },
  {
    id: "reel",
    category: "ecommerce",
    name: "影片封面／YouTube 縮圖",
    description: "YouTube 縮圖、Reels 與 Podcast 封面",
    low: 400,
    high: 800,
    unit: "張",
  },
  {
    id: "product-frame",
    category: "ecommerce",
    name: "商品主圖套版",
    description: "蝦皮、momo 等商品主圖套版",
    low: 450,
    high: 750,
    unit: "版",
  },
  {
    id: "resize",
    category: "other",
    name: "Resize",
    description: "同一款設計調整成不同平台尺寸",
    note: "需提供原始設計檔",
    low: 250,
    high: 500,
    unit: "張",
  },
  {
    id: "poster",
    category: "print",
    name: "活動／促銷海報",
    description: "A3 以上的活動或促銷海報",
    low: 1800,
    high: 3000,
    unit: "款",
  },
  {
    id: "dm",
    category: "print",
    name: "傳單／宣傳單",
    description: "單張派發、活動宣傳與產品介紹",
    low: 1200,
    high: 3000,
    unit: "頁",
    pricing: "dm",
  },
  {
    id: "menu",
    category: "print",
    name: "菜單設計",
    description: "餐點、價格與分類的菜單排版",
    low: 1200,
    high: 3000,
    unit: "頁",
    pricing: "dm",
  },
  {
    id: "card",
    category: "print",
    name: "名片／會員卡",
    description: "個人名片、公司名片或會員卡",
    low: 1000,
    high: 1500,
    unit: "款",
    pricing: "card",
  },
  {
    id: "photo",
    category: "other",
    name: "修圖／去背",
    description: "調色、去背、精修與圖片合成",
    low: 150,
    high: 750,
    unit: "張",
  },
  {
    id: "slides",
    category: "other",
    name: "簡報／版型模板",
    description: "簡報母片、提案與講座版型",
    low: 1000,
    high: 3000,
    unit: "版",
  },
];

const ecommerceDetailServiceIds = new Set(["banner", "social", "reel", "product-frame", "resize"]);
const lineContactUrl = "https://line.me/ti/p/th3zPeeCre";
const bannerExtensionPrice = { low: 800, high: 1200 };
const socialExtensionPrice = { low: 250, high: 500 };
const socialVolumeDiscountPercent = 5;

const summaryServiceNames: Record<string, string> = {
  banner: "網站橫幅／活動主視覺",
  social: "IG／FB 社群圖文",
  reel: "影片封面／YouTube 縮圖",
  "product-frame": "商品主圖套版",
  resize: "Resize",
  poster: "活動／促銷海報",
  dm: "傳單／宣傳單",
  menu: "菜單設計",
  card: "名片／會員卡",
  photo: "修圖／去背",
  slides: "簡報／版型模板",
};

function getSummaryServiceName(service: Service) {
  return summaryServiceNames[service.id] ?? service.name;
}

function getMonthlyPrintDetails(answers: Answers, serviceId: "dm" | "menu", quantity: number) {
  const savedDetails = answers.monthlyPrintDesignDetails?.[serviceId] ?? [];
  const legacyDetail = answers.printDesignDetails[serviceId];
  return Array.from(
    { length: Math.max(0, quantity) },
    (_, index) => savedDetails[index] ?? (index === 0 ? legacyDetail ?? {} : {}),
  );
}

function getMonthlyCardDetails(answers: Answers, quantity: number) {
  const savedDetails = answers.monthlyServiceDesignDetails?.card ?? [];
  const legacyDetail = answers.serviceDesignDetails.card;
  return Array.from(
    { length: Math.max(0, quantity) },
    (_, index) => savedDetails[index] ?? (index === 0 ? legacyDetail ?? {} : {}),
  );
}

function formatMonthlyServiceQuantity(service: Service, quantity: number, concise = false, answers?: Answers) {
  const name = concise ? getSummaryServiceName(service) : service.name;
  if (service.id === "banner") {
    const extensionCount = answers ? getBannerExtensionCount(answers) : 0;
    return `${name} ×${quantity} 版${extensionCount > 0 ? `（主視覺延伸 ${extensionCount} 張）` : ""}`;
  }
  if (service.id === "social") {
    const postCount = Math.max(1, answers?.socialPostCount ?? quantity);
    const totalImages = answers ? getSocialPricingCounts(answers).totalImages : postCount;
    return `${name} ×${postCount} 篇（共 ${totalImages} 張）`;
  }
  if (service.id === "dm" || service.id === "menu") {
    if (!answers) return `${name} ×${quantity} 項`;
    const details = getMonthlyPrintDetails(answers, service.id, quantity)
      .map((detail, index) => {
        const structure = detail.structure;
        const fold = detail.fold;
        const structureLabel = structure ? `${printStructureLabels[structure]}${fold ? `／${printFoldLabels[fold]}` : ""}` : "規格待填";
        const pageNote = structure === "multipage" ? detail.pageCount ? `${detail.pageCount} 頁` : "頁數待填" : "";
        const versionLabel = quantity > 1 ? `第 ${index + 1} 項 ` : "";
        return `${versionLabel}${[structureLabel, pageNote].filter(Boolean).join("・")}`;
      });
    if (concise) {
      const pageDetails = getMonthlyPrintDetails(answers, service.id, quantity).flatMap((detail, index) => (
        detail.structure === "multipage"
          ? [`${quantity > 1 ? `第 ${index + 1} 項 ` : ""}${detail.pageCount ? `${detail.pageCount} 頁` : "頁數待填"}`]
          : []
      ));
      return `${name} ×${quantity} 項${pageDetails.length > 0 ? `（${pageDetails.join("；")}）` : ""}`;
    }
    return `${name} ×${quantity} 項${details.length > 0 ? `（${details.join("；")}）` : ""}`;
  }
  if (service.id === "card") {
    if (concise || !answers) return `${name} ×${quantity} 款`;
    const specifications = getMonthlyCardDetails(answers, quantity).map((detail, index) => {
      const side = detail.specification === "double" ? "雙面" : detail.specification === "single" ? "單面" : "待選面數";
      return `${quantity > 1 ? `第 ${index + 1} 款` : ""}${side}`;
    });
    return `${name} ×${quantity} 款（${specifications.join("；")}）`;
  }
  if (service.id === "product-frame") {
    const framePricing = getProductFramePricingCounts(answers, quantity);
    return `${name} ×${quantity} 版（共 ${framePricing.totalProducts} 項產品）`;
  }
  return `${name} ×${quantity}`;
}

function formatLiveSummaryServiceQuantity(service: Service, quantity: number, answers: Answers) {
  if (answers.projectType === "monthly") {
    return formatMonthlyServiceQuantity(service, quantity, true, answers);
  }
  if (service.pricing === "dm") {
    return `${getSummaryServiceName(service)} ×${quantity} 頁`;
  }
  return `${getSummaryServiceName(service)} ×${quantity}`;
}

function compactSummaryServiceNames(value: string) {
  return services.reduce(
    (result, service) => result.replaceAll(service.name, getSummaryServiceName(service)),
    value,
  );
}

const monthlyPlans = [
  {
    id: "starter",
    name: "小資方案",
    description: "日常更新・3～5 組設計",
    minGroups: 3,
    maxGroups: 5,
  },
  {
    id: "light",
    name: "輕量方案",
    description: "穩定經營・6～7 組設計",
    minGroups: 6,
    maxGroups: 7,
  },
  {
    id: "standard",
    name: "標準方案",
    description: "長期配合・8～10 組設計",
    minGroups: 8,
    maxGroups: 10,
  },
];

const monthlyDiscountRates: Record<number, number> = {
  3: 0.95,
  4: 0.92,
  5: 0.92,
  6: 0.9,
  7: 0.9,
  8: 0.88,
  9: 0.88,
  10: 0.88,
};

function getMonthlyDiscountRate(groupCount: number) {
  const normalizedCount = Math.min(10, Math.max(3, Math.round(groupCount)));
  return monthlyDiscountRates[normalizedCount] ?? monthlyDiscountRates[3];
}

function formatMonthlyDiscount(rate: number) {
  const discount = Math.round(rate * 100) / 10;
  return `${Number.isInteger(discount) ? discount.toFixed(0) : discount.toFixed(1)} 折`;
}

function roundMonthlyPrice(value: number) {
  return Math.round(value / 10) * 10;
}

function getMonthlyServiceGroupCost(_service: Service) {
  return 1;
}

function formatGroupAmount(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function getMonthlyAllocatedGroups(answers: Answers) {
  return answers.serviceIds.reduce((total, serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return total;
    return total + Math.max(0, answers.quantities[serviceId] ?? 0) * getMonthlyServiceGroupCost(service);
  }, 0);
}

function getMonthlyServicePricingReference(answers: Answers, service: Service) {
  const quantity = Math.max(0, answers.quantities[service.id] ?? 0);
  const reference = { designLow: 0, designHigh: 0, addonLow: 0, addonHigh: 0 };
  if (quantity === 0) return reference;

  if (service.id === "banner") {
    const extensionCount = getBannerExtensionCount(answers);
    reference.designLow = service.low * quantity + extensionCount * bannerExtensionPrice.low;
    reference.designHigh = service.high * quantity + extensionCount * bannerExtensionPrice.high;
    return reference;
  }

  if (service.id === "product-frame") {
    const { extraProductCount } = getProductFramePricingCounts(answers, quantity);
    reference.designLow = service.low * quantity;
    reference.designHigh = service.high * quantity;
    reference.addonLow = extraProductCount * 70;
    reference.addonHigh = extraProductCount * 70;
    return reference;
  }

  if (service.id === "dm" || service.id === "menu") {
    getMonthlyPrintDetails(answers, service.id, quantity).forEach((detail) => {
      const pageCount = detail.structure === "multipage"
        ? Math.max(1, detail.pageCount ?? 1)
        : detail.structure && detail.structure !== "single" ? 2 : 1;
      const extraPageCount = Math.max(0, pageCount - 1);
      reference.designLow += service.low + extraPageCount * 600;
      reference.designHigh += service.high + extraPageCount * 800;
    });
    return reference;
  }

  if (service.id === "card") {
    getMonthlyCardDetails(answers, quantity).forEach((detail) => {
      const range = getCardRangeForSpecification(detail.specification);
      const applicationCount = Math.max(0, detail.applicationCount ?? 0);
      reference.designLow += range.low + applicationCount * 300;
      reference.designHigh += range.high + applicationCount * 300;
    });
    return reference;
  }

  if (service.id === "social") {
    const estimate = getServiceEstimate(answers, service);
    reference.designLow = estimate.baseLow;
    reference.designHigh = estimate.baseHigh;
    return reference;
  }

  reference.designLow = service.low * quantity;
  reference.designHigh = service.high * quantity;
  return reference;
}

function getMonthlyPricingReference(answers: Answers) {
  return services
    .filter((service) => answers.serviceIds.includes(service.id))
    .reduce((reference, service) => {
      const serviceReference = getMonthlyServicePricingReference(answers, service);
      reference.designLow += serviceReference.designLow;
      reference.designHigh += serviceReference.designHigh;
      reference.addonLow += serviceReference.addonLow;
      reference.addonHigh += serviceReference.addonHigh;
      return reference;
    }, { designLow: 0, designHigh: 0, addonLow: 0, addonHigh: 0 });
}

function getMonthlyDiscountedDesignRange(answers: Answers) {
  const reference = getMonthlyPricingReference(answers);
  const discountRate = getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3);
  return {
    low: roundMonthlyPrice(reference.designLow * discountRate),
    high: roundMonthlyPrice(reference.designHigh * discountRate),
  };
}

function getMonthlyDiscountSummary(answers: Answers) {
  const reference = getMonthlyPricingReference(answers);
  const discounted = getMonthlyDiscountedDesignRange(answers);
  const discountRate = getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3);
  return {
    label: `月方案優惠（${formatMonthlyDiscount(discountRate)}）`,
    detail: `單次設計費合計 ${formatPriceRange(reference.designLow, reference.designHigh)} × ${formatMonthlyDiscount(discountRate)}｜${answers.monthlyGroupCount ?? 0} 組／月`,
    ...discounted,
  };
}

function getMonthlyAddonBreakdown(answers: Answers): PriceBreakdownItem[] {
  return services
    .filter((service) => answers.serviceIds.includes(service.id))
    .flatMap((service) => {
      const reference = getMonthlyServicePricingReference(answers, service);
      if (reference.addonLow <= 0 && reference.addonHigh <= 0) return [];
      if (service.id === "product-frame") {
        const count = getMonthlyProductAddonCount(answers);
        return [{
          label: "商品主圖套版｜追加產品",
          detail: `${count} 項 × $70（不套用月方案折扣）`,
          low: reference.addonLow,
          high: reference.addonHigh,
        }];
      }
      return [];
    });
}

function getMonthlySingleReference(answers: Answers) {
  const reference = getMonthlyPricingReference(answers);
  const socialService = services.find((service) => service.id === "social");
  const hasSingleSocialVolumeDiscount = Boolean(
    socialService
    && answers.serviceIds.includes("social")
    && getSocialPricingCounts(answers).totalImages >= 10,
  );
  const socialReference = hasSingleSocialVolumeDiscount && socialService
    ? getMonthlyServicePricingReference(answers, socialService)
    : { designLow: 0, designHigh: 0 };
  const singleSocialPayableRate = (100 - socialVolumeDiscountPercent) / 100;
  return {
    low: Math.round(reference.designLow - socialReference.designLow + socialReference.designLow * singleSocialPayableRate + reference.addonLow),
    high: Math.round(reference.designHigh - socialReference.designHigh + socialReference.designHigh * singleSocialPayableRate + reference.addonHigh),
  };
}

function getMonthlyProductAddonCount(answers: Answers) {
  const frameCount = Math.max(0, answers.quantities["product-frame"] ?? 0);
  return frameCount > 0 ? getProductFramePricingCounts(answers, frameCount).extraProductCount : 0;
}

function getMonthlyComparison(answers: Answers, quote: ReturnType<typeof getQuote>) {
  const singleReference = getMonthlySingleReference(answers);
  if (singleReference.low <= 0 || quote.low <= 0) return null;
  const discountRate = getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3);
  const hasAddons = getMonthlyPricingReference(answers).addonLow > 0;
  const hasSingleSocialVolumeDiscount = answers.serviceIds.includes("social")
    && getSocialPricingCounts(answers).totalImages >= 10;
  const comparisonDetail = hasAddons
    ? "已選擇的網站主視覺延伸與宣傳單／菜單多頁會納入優惠；追加產品按單次價格另計。"
    : "依目前選取服務的單次設計費合計套用優惠；若有選擇，網站主視覺延伸及宣傳單／菜單多頁也會納入優惠計算。";
  return {
    label: `已套用月方案 ${formatMonthlyDiscount(discountRate)}`,
    detail: `${comparisonDetail}${hasSingleSocialVolumeDiscount ? "單次合計參考已套用社群圖文總圖滿 10 張的 5% 優惠；月方案仍只套用組數折扣。" : ""}`,
    tone: "monthly" as const,
    singleReference,
  };
}

const monthlyServiceGroups = [
  { key: "ecommerce" as const, label: "電商／社群設計", detail: "網站橫幅、貼文圖片、影片封面、商品主圖", serviceIds: services.filter((service) => service.category === "ecommerce").map((service) => service.id) },
  { key: "print" as const, label: "平面印刷設計", detail: "海報、宣傳單、菜單、名片", serviceIds: services.filter((service) => service.category === "print").map((service) => service.id) },
];

const monthlyCooperationNotes = [
  "月方案提供電商／平面設計服務，每月至少 3 組、最多 10 組，依單次設計費合計與組數套用 9.5 折至 8.8 折。每項服務數量計 1 組，IG／FB 社群圖文以每篇計 1 組；平面設計每月合計限 2 組，未使用組數不累積",
  "網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠；商品主圖套版追加產品按單次價格另計且不套用月方案折扣；IG／FB 社群圖文總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用",
  "正式金額依設計項目、內容複雜度與素材狀況確認；試算時先選擇交付節奏，實際交付日期於合作時確認",
  "月方案如需取消或調整，最晚於製作前 2 日告知。已開始製作的部分不予退款；僅尚未開始製作的部分可依實際進度評估退款。20% 訂金作為已排定工時費用不退，80% 尾款於交付前付清",
  "月方案原始檔可依服務與數量彈性加購，費用另行確認，暫不計入網站初估。若需代辦印刷，將於合作確認時另行估價，暫不計入網站初估",
] as const;

const singleServiceCategoryGroups = [
  { category: "ecommerce" as const, label: "電商／社群設計", detail: "網站橫幅、貼文圖片、影片封面、商品主圖" },
  { category: "print" as const, label: "平面印刷設計", detail: "海報、宣傳單、菜單、名片" },
  { category: "other" as const, label: "其他設計服務", detail: "改尺寸、修圖去背、簡報模板" },
];

const categoryLabels: Record<Category, string> = {
  ecommerce: "電商／社群設計",
  print: "平面印刷設計",
  other: "其他設計服務",
  mixed: "跨類型設計組合",
};

const complexityLabels: Record<Complexity, string> = {
  simple: "清楚簡約",
  standard: "一般品牌感",
  detailed: "精緻／高複雜度",
};

const materialLabels: Record<Materials, string> = {
  ready: "文字與圖片皆備妥",
  partial: "已有部分素材",
  "need-help": "需要協助整理",
};

const timelineLabels: Record<Timeline, string> = {
  regular: "5～10 個工作天（實際時間視當時排程及設計複雜程度而定）",
};

const timelineSummaryLabels: Record<Timeline, string> = {
  regular: "5～10 個工作天",
};

const serviceTimelineSummaryLabels: Partial<Record<string, string>> = {
  banner: "2～5 個工作天",
  social: "2～5 個工作天",
  reel: "2～5 個工作天",
  "product-frame": "2～5 個工作天",
  resize: "3～5 個工作天",
  dm: "5～7 個工作天",
  menu: "5～7 個工作天",
  card: "3～5 個工作天",
  photo: "3～5 個工作天",
  slides: "5～7 個工作天",
};

function getServiceTimelineSummary(serviceId?: string) {
  return serviceTimelineSummaryLabels[serviceId ?? ""] ?? timelineSummaryLabels.regular;
}

function getServiceTimelineLabel(serviceId?: string) {
  return `${getServiceTimelineSummary(serviceId)}（實際時間視當時排程及設計複雜程度而定）`;
}

type EcommerceOption = {
  value: string;
  label: string;
};

const ecommercePlacementOptionsByService: Record<string, EcommerceOption[]> = {
  banner: [
    { value: "homepage", label: "官網首頁／輪播" },
    { value: "campaign", label: "活動頁／登陸頁" },
    { value: "ads", label: "聯播廣告／導流素材" },
    { value: "other", label: "不確定，請協助建議" },
  ],
  social: [
    { value: "feed", label: "FB／IG 動態貼文" },
    { value: "story", label: "限時動態" },
    { value: "social-ads", label: "社群廣告" },
    { value: "other", label: "不確定，請協助建議" },
  ],
  reel: [
    { value: "ig-reel", label: "IG Reel 封面" },
    { value: "youtube", label: "YouTube 縮圖" },
    { value: "podcast", label: "Podcast 封面" },
    { value: "other", label: "不確定，請協助建議" },
  ],
  "product-frame": [
    { value: "shopee", label: "蝦皮商品頁" },
    { value: "momo", label: "momo／PChome" },
    { value: "owned-store", label: "品牌官網商店" },
    { value: "multi-store", label: "多個電商平台" },
    { value: "other", label: "不確定，請協助建議" },
  ],
  resize: [
    { value: "social-resize", label: "社群平台尺寸" },
    { value: "web-resize", label: "網站橫幅尺寸" },
    { value: "ads-resize", label: "廣告投放尺寸" },
    { value: "cross-platform", label: "跨平台延伸" },
    { value: "other", label: "不確定，請協助建議" },
  ],
};

const ecommerceSizeOptionsByService: Record<string, EcommerceOption[]> = {
  banner: [
    { value: "desktop-wide", label: "桌機橫幅" },
    { value: "mobile-wide", label: "手機橫幅" },
    { value: "desktop-mobile", label: "桌機＋手機各一尺寸" },
    { value: "custom", label: "不確定，請協助建議" },
  ],
  social: [
    { value: "1-1", label: "1:1 正方形" },
    { value: "4-5", label: "4:5 直式貼文" },
    { value: "9-16", label: "9:16 限時動態" },
    { value: "custom", label: "不確定，請協助建議" },
  ],
  reel: [
    { value: "9-16", label: "9:16 直式封面" },
    { value: "16-9", label: "16:9 橫式縮圖" },
    { value: "1-1", label: "1:1 正方形封面" },
    { value: "custom", label: "不確定，請協助建議" },
  ],
  "product-frame": [
    { value: "1-1", label: "1:1 商品主圖" },
    { value: "4-5", label: "4:5 直式商品圖" },
    { value: "marketplace", label: "依平台規範尺寸" },
    { value: "custom", label: "不確定，請協助建議" },
  ],
  resize: [
    { value: "one-size", label: "延伸 1 個新尺寸" },
    { value: "two-sizes", label: "延伸 2 個新尺寸" },
    { value: "multi-size", label: "延伸 3 個以上尺寸" },
    { value: "custom", label: "不確定，請協助建議" },
  ],
};

function getEcommercePlacementOptions(serviceId: string) {
  return ecommercePlacementOptionsByService[serviceId] ?? [{ value: "other", label: "不確定，請協助建議" }];
}

function getEcommerceSizeOptions(serviceId: string) {
  return ecommerceSizeOptionsByService[serviceId] ?? [{ value: "custom", label: "不確定，請協助建議" }];
}

function getEcommerceOptionLabel(options: EcommerceOption[], value?: string) {
  return options.find((option) => option.value === value)?.label;
}

const ecommerceCopyStatusLabels: Record<EcommerceCopyStatus, string> = {
  ready: "文字內容都準備好了",
  draft: "有草稿，還需要整理",
  "need-copy": "還沒準備好，需要協助",
};

const ecommerceAssetStatusLabels: Record<EcommerceAssetStatus, string> = {
  ready: "Logo 和圖片都準備好了",
  "need-edit": "有素材，但需要去背或修圖",
  "need-create": "還沒準備好，需要協助",
};

const ecommerceVisualLevelLabels: Record<Complexity, string> = {
  simple: "簡單清楚，沿用現有風格",
  standard: "有品牌感，重新設計主視覺",
  detailed: "精緻製作，需要合成或精修",
};

function getEcommerceVisualLevelOptions(_serviceId: string) {
  return (Object.entries(ecommerceVisualLevelLabels) as Array<[Complexity, string]>).map(([value, label]) => ({ value, label }));
}

function getEcommerceVisualLevelLabel(serviceId: string, value: Complexity) {
  return getEcommerceVisualLevelOptions(serviceId).find((option) => option.value === value)?.label ?? ecommerceVisualLevelLabels[value];
}

const ecommerceDetailFieldLabels: Record<Exclude<EcommerceDetailField, "quantity">, string> = {
  bannerExtensionCount: "主視覺延伸加購",
  productCount: "產品總數",
  placement: "這張圖要放在哪裡？",
  size: "需要什麼尺寸？",
  copyStatus: "文字內容準備好了嗎？",
  assetStatus: "Logo 和圖片準備好了嗎？",
  versionCount: "還需要幾個同版版本？",
  visualLevel: "想要多精緻？",
  timeline: "希望何時看到第一版？",
};

function getEcommerceDetailFieldLabel(service: Service, field: EcommerceDetailField) {
  if (field !== "quantity") return ecommerceDetailFieldLabels[field];
  if (service.id === "social") return "貼文篇數與每篇圖數";
  if (service.id === "product-frame") return "圖框版型數與每版產品數";
  if (service.id === "banner") return "主視覺版數";
  if (service.id === "reel") return "封面設計張數";
  if (service.id === "resize") return "尺寸延伸數";
  return `預計數量（${service.unit}）`;
}

function getMissingEcommerceDetailFields(service: Service, detail: EcommerceDesignDetail, answers: Answers): EcommerceDetailField[] {
  const missing: EcommerceDetailField[] = [];
  const quantity = answers.quantities[service.id] ?? 0;
  if (service.id === "social") {
    const postCount = answers.socialPostCount ?? 0;
    const imageCounts = answers.socialPostImageCounts ?? [];
    if (postCount < 1 || imageCounts.length < postCount || imageCounts.slice(0, postCount).some((count) => !count || count < 1 || count > SOCIAL_IMAGES_PER_POST_LIMIT)) missing.push("quantity");
  } else if (service.id === "product-frame") {
    const productCounts = answers.productFrameProductCounts ?? [];
    if (quantity < 1 || productCounts.length < quantity || productCounts.slice(0, quantity).some((count) => !count || count < 1)) missing.push("quantity");
  } else if (quantity < 1 || (service.id === "banner" && quantity > BANNER_MAIN_VISUAL_LIMIT)) {
    missing.push("quantity");
  }
  return missing;
}

type ServiceDetailOption = {
  value: string;
  label: string;
  pending?: boolean;
};

type ServiceDetailConfig = {
  quantityLabel: string;
  quantityCustom?: boolean;
  quantityOptional?: boolean;
  quantityNote?: string;
  hideQuantity?: boolean;
  purposeLabel: string;
  purposeOptions: ServiceDetailOption[];
  specificationLabel: string;
  specificationOptions: ServiceDetailOption[];
  contentLabel: string;
  contentOptions: ServiceDetailOption[];
  assetLabel: string;
  assetOptions: ServiceDetailOption[];
  complexityOptions: Array<{ value: Complexity; label: string }>;
};

const serviceDetailConfigs: Record<string, ServiceDetailConfig> = {
  poster: {
    quantityLabel: "海報設計款數",
    purposeLabel: "這張海報要用在哪裡？",
    purposeOptions: [
      { value: "event", label: "活動／展覽宣傳" },
      { value: "promotion", label: "店內促銷／新品上市" },
      { value: "display", label: "空間展示／形象佈置" },
      { value: "notice", label: "公告／資訊傳達" },
    ],
    specificationLabel: "需要什麼尺寸？",
    specificationOptions: [
      { value: "a3-portrait", label: "A3 直式" },
      { value: "a3-landscape", label: "A3 橫式" },
      { value: "a2", label: "A2 海報" },
      { value: "custom", label: "不確定，請協助建議", pending: true },
    ],
    contentLabel: "文字內容準備好了嗎？",
    contentOptions: [
      { value: "ready", label: "文字內容已定稿" },
      { value: "draft", label: "已有草稿，需要協助整理" },
      { value: "need-help", label: "需要協助發想標題與文案", pending: true },
    ],
    assetLabel: "Logo 和圖片準備好了嗎？",
    assetOptions: [
      { value: "ready", label: "Logo、照片與品牌素材齊全" },
      { value: "partial", label: "已有部分素材，需要後製" },
      { value: "need-create", label: "需要協助尋找或製作素材", pending: true },
    ],
    complexityOptions: [
      { value: "simple", label: "資訊排版為主" },
      { value: "standard", label: "建立品牌主視覺" },
      { value: "detailed", label: "多素材合成／精修" },
    ],
  },
  card: {
    quantityLabel: "同一版要套用幾位姓名？",
    quantityOptional: true,
    quantityNote: "只替換同版姓名或職稱，不重新排版，也不改尺寸；沒有可留空",
    purposeLabel: "想做哪一種卡片？",
    purposeOptions: [
      { value: "personal", label: "個人名片" },
      { value: "team", label: "企業／團隊名片" },
      { value: "member", label: "會員卡／集點卡" },
      { value: "appointment", label: "預約卡／資訊卡" },
    ],
    specificationLabel: "要做單面還是雙面？",
    specificationOptions: [
      { value: "single", label: "單面｜$1,000～1,500／款" },
      { value: "double", label: "雙面｜$1,200～2,200／款" },
    ],
    contentLabel: "姓名和聯絡資料準備好了嗎？",
    contentOptions: [
      { value: "ready", label: "所有文字資料已確認" },
      { value: "partial", label: "部分姓名／職稱尚待確認" },
      { value: "need-organize", label: "需要協助整理資訊層級", pending: true },
    ],
    assetLabel: "Logo 和品牌資料準備好了嗎？",
    assetOptions: [
      { value: "ready", label: "Logo、色彩與字體規範齊全" },
      { value: "logo-only", label: "有 Logo，尚無完整規範" },
      { value: "need-create", label: "尚無可用 Logo／識別素材", pending: true },
    ],
    complexityOptions: [
      { value: "simple", label: "資訊清楚的簡約排版" },
      { value: "standard", label: "建立品牌名片版型" },
      { value: "detailed", label: "特殊圖像與精緻編排" },
    ],
  },
  photo: {
    quantityLabel: "需要修幾張照片？",
    quantityCustom: true,
    purposeLabel: "這些照片要用在哪裡？",
    purposeOptions: [
      { value: "ecommerce", label: "電商商品圖" },
      { value: "portrait", label: "人物／形象照" },
      { value: "social", label: "社群貼文素材" },
      { value: "print", label: "印刷／廣告素材" },
    ],
    specificationLabel: "照片需要怎麼處理？",
    specificationOptions: [
      { value: "color", label: "基礎調色／明暗校正" },
      { value: "cutout", label: "去背／背景整理" },
      { value: "retouch", label: "人物或商品精修" },
      { value: "composite", label: "合成／進階修圖", pending: true },
      { value: "unsure", label: "不確定，請協助建議", pending: true },
    ],
    contentLabel: "修圖方式有說明或範例嗎？",
    contentOptions: [
      { value: "list-ready", label: "已有逐張修改清單" },
      { value: "reference", label: "有風格範例，需要協助整理" },
      { value: "need-review", label: "需要先協助檢視照片與討論", pending: true },
    ],
    assetLabel: "原始照片清楚嗎？",
    assetOptions: [
      { value: "raw", label: "RAW／高解析原檔" },
      { value: "high-res", label: "高解析 JPG／PNG" },
      { value: "mobile", label: "手機拍攝或解析度較低", pending: true },
      { value: "mixed", label: "來源與品質不一致", pending: true },
    ],
    complexityOptions: [
      { value: "simple", label: "基礎校色與統一" },
      { value: "standard", label: "逐張去背／精修" },
      { value: "detailed", label: "進階合成與細節修復" },
    ],
  },
  slides: {
    quantityLabel: "需要幾套版型？",
    hideQuantity: true,
    purposeLabel: "這份簡報要用在哪裡？",
    purposeOptions: [
      { value: "proposal", label: "提案／業務簡報" },
      { value: "report", label: "內部報告／會議" },
      { value: "course", label: "課程／講座教材" },
      { value: "event", label: "活動／公開演講" },
    ],
    specificationLabel: "需要設計到什麼程度？",
    specificationOptions: [
      { value: "polish", label: "既有簡報重新美化" },
      { value: "redesign", label: "依內容重新設計版面" },
      { value: "template", label: "建立可重複使用的母片模板" },
      { value: "data", label: "圖表／資訊視覺化為主", pending: true },
      { value: "unsure", label: "不確定，請協助建議", pending: true },
    ],
    contentLabel: "簡報內容準備好了嗎？",
    contentOptions: [
      { value: "ready", label: "文字與頁序已定稿" },
      { value: "draft", label: "已有完整初稿，仍會微調" },
      { value: "need-organize", label: "需要協助整理架構與重點", pending: true },
    ],
    assetLabel: "Logo 和圖片準備好了嗎？",
    assetOptions: [
      { value: "ready", label: "品牌模板與圖片素材齊全" },
      { value: "partial", label: "有 Logo／色彩，缺少部分圖片" },
      { value: "need-create", label: "沒有既有模板，需要從頭建立", pending: true },
    ],
    complexityOptions: [
      { value: "simple", label: "套用一致版型與字級" },
      { value: "standard", label: "逐頁重新編排與配圖" },
      { value: "detailed", label: "圖表／資訊視覺化設計" },
    ],
  },
};

const serviceDetailServiceIds = new Set(Object.keys(serviceDetailConfigs));

function getServiceDetailConfig(serviceId: string) {
  return serviceDetailConfigs[serviceId];
}

function getServiceDetailOptionLabel(options: ServiceDetailOption[], value?: string) {
  return options.find((option) => option.value === value)?.label;
}

const serviceDetailFieldLabels: Record<ServiceDetailField, string> = {
  quantity: "需要幾個？",
  seriesArtwork: "要做單款，還是同系列多款？",
  purpose: "這份設計要用在哪裡？",
  specification: "需要什麼規格？",
  contentStatus: "文字內容準備好了嗎？",
  assetStatus: "Logo 和圖片準備好了嗎？",
  complexity: "想要多精緻？",
  timeline: "希望何時看到第一版？",
};

function getMissingServiceDetailFields(service: Service, detail: ServiceDesignDetail, answers: Answers): ServiceDetailField[] {
  const missing: ServiceDetailField[] = [];
  const config = getServiceDetailConfig(service.id);
  if (service.id === "poster") {
    if (!detail.seriesArtwork || (detail.seriesArtwork === "yes" && (answers.quantities.poster ?? 1) < 2)) missing.push("seriesArtwork");
  } else if (!config?.hideQuantity && service.pricing !== "card" && (answers.quantities[service.id] ?? 0) < 1) {
    missing.push("quantity");
  }
  if (service.id === "card" && !detail.specification) missing.push("specification");
  return missing;
}

const printPurposeLabels: Record<PrintPurpose, string> = {
  promotion: "促銷／派發宣傳",
  product: "產品或服務介紹",
  store: "店內使用",
  event: "活動宣傳",
  distribution: "街頭／商圈派發",
  counter: "店內櫃檯取閱",
  insert: "包裹／報刊夾帶",
  "direct-mail": "郵寄／名單投遞",
  "dine-in": "店內用餐",
  takeout: "外帶使用",
  seasonal: "季節／活動限定菜單",
  other: "其他用途",
};

type PrintPurposeOption = {
  value: PrintPurpose;
  label: string;
  detail: string;
};

const printPurposeOptionsByService: Record<string, PrintPurposeOption[]> = {
  dm: [
    { value: "distribution", label: printPurposeLabels.distribution, detail: "人員派發、商圈或定點宣傳" },
    { value: "promotion", label: "促銷／活動宣傳", detail: "檔期、優惠、開幕或品牌活動" },
    { value: "product", label: printPurposeLabels.product, detail: "介紹產品、品牌或服務內容" },
    { value: "counter", label: printPurposeLabels.counter, detail: "放置於門市、櫃檯或公共空間" },
    { value: "insert", label: printPurposeLabels.insert, detail: "隨商品、報刊或帳單一起附送" },
    { value: "direct-mail", label: printPurposeLabels["direct-mail"], detail: "寄送給會員、潛在客戶或既有名單" },
    { value: "event", label: printPurposeLabels.event, detail: "展會、講座、開幕或活動現場" },
    { value: "other", label: printPurposeLabels.other, detail: "之後再補充實際使用情境" },
  ],
  menu: [
    { value: "dine-in", label: printPurposeLabels["dine-in"], detail: "桌上、櫃檯或店內點餐使用" },
    { value: "takeout", label: printPurposeLabels.takeout, detail: "隨餐附上或提供客人帶走" },
    { value: "seasonal", label: printPurposeLabels.seasonal, detail: "期間限定、套餐或節慶活動" },
    { value: "other", label: printPurposeLabels.other, detail: "之後再補充實際使用方式" },
  ],
};

function getPrintPurposeOptions(serviceId?: string): PrintPurposeOption[] {
  return serviceId && printPurposeOptionsByService[serviceId]
    ? printPurposeOptionsByService[serviceId]
    : [
        { value: "promotion", label: printPurposeLabels.promotion, detail: "促銷或派發宣傳" },
        { value: "product", label: printPurposeLabels.product, detail: "品牌、產品與服務資訊" },
        { value: "store", label: printPurposeLabels.store, detail: "門市、櫃檯或店內使用" },
        { value: "event", label: printPurposeLabels.event, detail: "展會、開幕、講座與活動" },
        { value: "other", label: printPurposeLabels.other, detail: "之後再補充實際使用情境" },
      ];
}

const printFormatLabels: Record<PrintFormat, string> = {
  "a4-portrait": "A4 直式",
  "a4-landscape": "A4 橫式",
  "a5-portrait": "A5 直式",
  "a5-landscape": "A5 橫式",
  custom: "不確定，請協助建議",
};

const printStructureLabels: Record<PrintStructure, string> = {
  single: "單面",
  double: "雙面",
  folded: "折頁",
  multipage: "多頁",
};

function getPrintStructureOptions(serviceId?: string): Array<[PrintStructure, string]> {
  const options = Object.entries(printStructureLabels) as Array<[PrintStructure, string]>;
  return options;
}

function requiresManualPrintPageCount(structure?: PrintStructure) {
  return structure === "multipage";
}

function getAutomaticPrintPageCount(structure?: PrintStructure) {
  return structure === "double" || structure === "folded" ? 2 : 1;
}

function getMinimumPrintPageCount(serviceId: string | undefined, structure?: PrintStructure) {
  if (structure === "multipage") return serviceId === "menu" ? 3 : 2;
  if (structure === "double" || structure === "folded") return 2;
  return 1;
}

function getMissingPrintDetailFields(
  serviceId: string | undefined,
  detail: PrintDesignDetail,
  pageCount: number,
): PrintDetailField[] {
  const missing: PrintDetailField[] = [];
  if (!detail.structure) missing.push("structure");
  const minimumPageCount = getMinimumPrintPageCount(serviceId, detail.structure);
  if (requiresManualPrintPageCount(detail.structure) && pageCount < minimumPageCount) missing.push("pageCount");
  if (detail.structure === "folded" && !detail.fold) missing.push("fold");
  return missing;
}

const printDetailFieldLabels: Record<PrintDetailField, string> = {
  purposes: "這份設計要用在哪裡？",
  format: "需要什麼尺寸？",
  structure: "要做單面、雙面、折頁還是多頁？",
  pageCount: "一共需要設計幾頁？",
  fold: "想用哪一種折法？",
  contentStatus: "文字內容準備好了嗎？",
  imageStatus: "Logo 和圖片準備好了嗎？",
  versionCount: "還需要幾個同版版本？",
  complexity: "想要多精緻？",
  timeline: "希望何時看到第一版？",
};

const printFoldLabels: Record<PrintFold, string> = {
  half: "對折",
  tri: "三折",
  accordion: "風琴折",
  custom: "不確定，請協助建議",
};

const printFoldDescriptions: Record<PrintFold, string> = {
  half: "紙張左右對折，形成 4 個版面",
  tri: "兩側依序向內收折，形成 6 個版面",
  accordion: "沿折線前後交錯，像風琴般展開",
  custom: "其他折法可在正式需求時提供參考圖",
};

const contentStatusLabels: Record<ContentStatus, string> = {
  final: "文字內容都準備好了",
  partial: "有草稿，還需要整理",
  "need-copy": "還沒準備好，需要協助",
};

const imageStatusLabels: Record<ImageStatus, string> = {
  ready: "Logo 和圖片都準備好了",
  "need-edit": "有素材，但需要去背或修圖",
  "need-images": "還沒準備好，需要協助",
};

const printPaperLabels: Record<PrintPaper, string> = {
  coated: "一般銅版紙",
  card: "厚卡紙",
  uncoated: "非塗佈紙／美術紙",
  unsure: "不確定，請協助建議",
};

const printFinishLabels: Record<PrintFinish, string> = {
  none: "不需要特殊加工",
  laminate: "霧膜／亮膜",
  "fold-cut": "折頁／特殊裁切",
  custom: "不確定，請協助建議",
};

const monthlyCadenceLabels: Record<MonthlyCadence, string> = {
  weekly: "每週固定交付",
  campaign: "活動前集中製作",
  flexible: "依當月需求彈性安排",
};

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const requiredQuantityOptions = Array.from({ length: 10 }, (_, index) => index + 1);
const requiredPageCountOptions = Array.from({ length: 9 }, (_, index) => index + 2);

const detailedPrintServiceIds = new Set(["dm", "menu"]);

function requiresInitialQuantity(service: Service) {
  return !ecommerceDetailServiceIds.has(service.id) && !detailedPrintServiceIds.has(service.id) && !serviceDetailServiceIds.has(service.id);
}

type SingleInlineQuantityConfig = {
  label: string;
  note: string;
  maximum: number;
  customInput?: boolean;
};

function getSingleInlineQuantityConfig(service: Service): SingleInlineQuantityConfig | undefined {
  switch (service.id) {
    case "banner":
      return { label: "主視覺需要幾版？", note: "延伸尺寸會在下一步另外確認", maximum: BANNER_MAIN_VISUAL_LIMIT };
    case "social":
      return { label: "預計有幾篇貼文？", note: "先以每篇 1 張預估，下一步可調整每篇圖數", maximum: 50 };
    case "reel":
      return { label: "需要幾張封面？", note: "每張封面分別計價", maximum: 50 };
    case "product-frame":
      return { label: "需要幾版圖框？", note: "每版先以 1 項產品預估，下一步可調整", maximum: 50 };
    case "resize":
      return { label: "需要延伸幾個尺寸？", note: "每個尺寸分別計價", maximum: 50 };
    case "poster":
      return { label: "需要幾款海報？", note: "下一步可確認是否為同系列", maximum: 50 };
    case "photo":
      return { label: "需要處理幾張照片？", note: "可直接輸入自訂數量", maximum: PHOTO_QUANTITY_LIMIT, customInput: true };
    default:
      return undefined;
  }
}

function getSingleDeferredQuantityNote(service: Service) {
  if (service.id === "dm" || service.id === "menu") return "下一步確認單雙面、折頁或頁數";
  if (service.id === "card") return "下一步確認單雙面與套用人數";
  if (service.id === "slides") return "下一步確認簡報需求與製作方式";
  return "下一步確認必要規格";
}

function hasDetailedPrintService(answers: Answers) {
  return answers.serviceIds.some((id) => detailedPrintServiceIds.has(id));
}

function hasSelectedPrintService(answers: Answers) {
  return services.some((service) => service.category === "print" && answers.serviceIds.includes(service.id));
}

function getSelectedServiceCategory(serviceIds: string[]): Category | undefined {
  const categories = new Set(
    services
      .filter((service) => serviceIds.includes(service.id))
      .map((service) => service.category),
  );
  if (categories.size === 0) return undefined;
  if (categories.size > 1) return "mixed";
  return categories.values().next().value;
}

function getQuestion(step: Step, answers: Answers): string {
  const selectedServices = services.filter((item) => answers.serviceIds.includes(item.id));
  const quantityServices = selectedServices.filter(requiresInitialQuantity);
  const selectedEcommerceServices = selectedServices.filter((item) => ecommerceDetailServiceIds.has(item.id));
  const selectedDetailedPrintServices = selectedServices.filter((item) => detailedPrintServiceIds.has(item.id));
  const activeEcommerceService = selectedEcommerceServices[answers.ecommerceDetailIndex ?? 0];
  const activeDetailedService = selectedDetailedPrintServices[answers.printDetailIndex ?? 0];
  const detailedName = activeDetailedService?.name ?? "這份印刷品";

  switch (step) {
    case "projectType":
      return "嗨！先從合作方式開始，這次想估算哪一種設計需求？";
    case "category":
      return "這次需要哪些設計？可複選，選好後再一起確認必要規格。";
    case "quantity":
      return quantityServices.length > 1
        ? "請分別填寫每個設計項目的預計數量。"
        : quantityServices[0]?.pricing === "card"
        ? "這個版型需要套用幾位不同姓名或職稱？"
        : `預計需要幾${quantityServices[0]?.unit ?? "件"}？`;
    case "ecommerceDetails":
      return `${activeEcommerceService?.name ?? "這項電商設計"}必要規格：只需先確認會影響價格的內容。`;
    case "printDetails":
      return `${detailedName}必要規格：只需先確認會影響價格的內容。`;
    case "serviceDetails": {
      const selectedDetailServices = selectedServices.filter((service) => serviceDetailServiceIds.has(service.id));
      const activeService = selectedDetailServices[answers.serviceDetailIndex ?? 0];
      return `${activeService?.name ?? "這項服務"}必要規格：只需先確認會影響價格的內容。`;
    }
    case "printPurpose":
      return `${detailedName}主要會用在哪裡？請選擇一個最主要的用途，答案只會套用於${detailedName}。`;
    case "printFormat":
      return `${detailedName}的成品尺寸與方向是什麼？`;
    case "printStructure":
      return `${detailedName}要做成單面、雙面、折頁，還是多頁？`;
    case "printFold":
      return `${detailedName}預計使用哪一種折頁方式？`;
    case "contentStatus":
      return `${detailedName}的文字、品項與價格是否已經定稿？`;
    case "imageStatus":
      return `${detailedName}使用的照片或圖片準備得如何？`;
    case "versionCount":
      return `${detailedName}若需要同版換文字或圖片，請填寫版本數量；沒有可留空。不同語言、分店、價格或活動內容都算不同版本，不包含重新排版或改尺寸。`;
    case "complexity":
      return answers.projectType === "monthly"
        ? "每月設計的平均複雜度，比較接近哪一種？"
        : activeDetailedService
        ? `${detailedName}期待的視覺複雜度比較接近哪一種？`
        : "期待的視覺複雜度比較接近哪一種？";
    case "materials":
      return answers.projectType === "monthly"
        ? "每月會使用的文字、Logo 與圖片等素材，通常準備得如何？"
        : "目前文字、Logo 與圖片等素材準備得如何？";
    case "timeline":
      return activeDetailedService
        ? `${detailedName}希望何時收到設計初稿？`
        : "希望何時收到設計初稿？";
    case "printDeadline":
      return activeDetailedService
        ? `${detailedName}最晚希望何時收到可送印的完稿檔？若需代辦印刷，成品到貨日會另行確認。`
        : "最晚希望何時收到可送印的完稿檔？若需代辦印刷，成品到貨日會另行確認。";
    case "sourceFile":
      return answers.projectType === "monthly"
        ? hasSelectedPrintService(answers)
          ? "還需要可編輯原始檔或印刷協助嗎？不需要可直接繼續。"
          : "還需要可編輯原始檔嗎？不需要可直接繼續。"
        : hasSelectedPrintService(answers)
        ? "最後確認：需要可編輯原始檔或印刷協助嗎？不需要可直接完成試算。"
        : "最後確認：需要可編輯原始檔嗎？不需要可直接完成試算。";
    case "printProduction":
      return "哪些平面印刷項目需要協助確認規格與代辦送印？可一次複選；印量、紙張與加工皆可稍後確認。";
    case "monthlyServices":
      return "每個月固定會需要哪些設計？可複選，選好後直接調整每月次數。";
    case "monthlySpecifications":
      return "接下來只確認會影響價格的內容。";
    case "monthlyCadence":
      return "最後一題：你希望每月怎麼安排交付？";
    case "result":
      return "初步試算完成了！以下是依目前需求整理的費用區間。";
  }
}

type SpecificationDestination = {
  step: Step;
  patch: Partial<Answers>;
};

function getSelectedSpecificationServices(answers: Answers) {
  return services.filter((service) => (
    answers.serviceIds.includes(service.id)
    && (ecommerceDetailServiceIds.has(service.id) || detailedPrintServiceIds.has(service.id) || serviceDetailServiceIds.has(service.id))
  ));
}

function isSpecificationCompleteForAnswers(answers: Answers, service: Service) {
  if (ecommerceDetailServiceIds.has(service.id)) {
    return getMissingEcommerceDetailFields(service, answers.ecommerceDesignDetails[service.id] ?? {}, answers).length === 0;
  }
  if (detailedPrintServiceIds.has(service.id)) {
    return getMissingPrintDetailFields(
      service.id,
      answers.printDesignDetails[service.id] ?? {},
      Math.max(0, answers.quantities[service.id] ?? 0),
    ).length === 0;
  }
  if (serviceDetailServiceIds.has(service.id)) {
    return getMissingServiceDetailFields(service, answers.serviceDesignDetails[service.id] ?? {}, answers).length === 0;
  }
  return true;
}

function getSpecificationDestination(answers: Answers, service?: Service): SpecificationDestination {
  if (!service) {
    return {
      step: "sourceFile",
      patch: { ecommerceDetailIndex: undefined, printDetailIndex: undefined, serviceDetailIndex: undefined, sourceFileIndex: 0 },
    };
  }
  if (ecommerceDetailServiceIds.has(service.id)) {
    const index = services.filter((item) => answers.serviceIds.includes(item.id) && ecommerceDetailServiceIds.has(item.id)).findIndex((item) => item.id === service.id);
    return { step: "ecommerceDetails", patch: { ecommerceDetailIndex: Math.max(0, index), printDetailIndex: undefined, serviceDetailIndex: undefined } };
  }
  if (detailedPrintServiceIds.has(service.id)) {
    const index = services.filter((item) => answers.serviceIds.includes(item.id) && detailedPrintServiceIds.has(item.id)).findIndex((item) => item.id === service.id);
    return { step: "printDetails", patch: { ecommerceDetailIndex: undefined, printDetailIndex: Math.max(0, index), serviceDetailIndex: undefined } };
  }
  const index = services.filter((item) => answers.serviceIds.includes(item.id) && serviceDetailServiceIds.has(item.id)).findIndex((item) => item.id === service.id);
  return { step: "serviceDetails", patch: { ecommerceDetailIndex: undefined, printDetailIndex: undefined, serviceDetailIndex: Math.max(0, index) } };
}

function getFirstIncompleteSpecificationDestination(answers: Answers) {
  const target = getSelectedSpecificationServices(answers).find((service) => !isSpecificationCompleteForAnswers(answers, service));
  return getSpecificationDestination(answers, target);
}

function getNextIncompleteSpecificationDestination(answers: Answers, currentServiceId: string) {
  const selected = getSelectedSpecificationServices(answers);
  const currentIndex = selected.findIndex((service) => service.id === currentServiceId);
  const candidates = currentIndex >= 0
    ? [...selected.slice(currentIndex + 1), ...selected.slice(0, currentIndex)]
    : selected;
  const target = candidates.find((service) => !isSpecificationCompleteForAnswers(answers, service));
  return getSpecificationDestination(answers, target);
}

function nextAfterComplexity(answers: Answers): Step {
  return hasDetailedPrintService(answers) ? "timeline" : "materials";
}

function nextAfterTimeline(answers: Answers): Step {
  return hasSelectedPrintService(answers) ? "printDeadline" : "sourceFile";
}

function getMonthlyPlanForCount(groupCount: number) {
  if (groupCount <= 5) return monthlyPlans.find((item) => item.id === "starter");
  if (groupCount <= 7) return monthlyPlans.find((item) => item.id === "light");
  return monthlyPlans.find((item) => item.id === "standard");
}

function getPendingEstimateItems(answers: Answers) {
  const items: string[] = [];
  services
    .filter((service) => answers.serviceIds.includes(service.id) && ecommerceDetailServiceIds.has(service.id))
    .forEach((service) => {
      const detail = answers.ecommerceDesignDetails[service.id] ?? {};
      if (detail.size === "custom") items.push(`${service.name}自訂尺寸`);
      if (detail.copyStatus === "need-copy") items.push(`${service.name}標題／CTA 文案協助`);
      if (detail.assetStatus === "need-edit") items.push(`${service.name}素材去背／修圖數量`);
      if (detail.assetStatus === "need-create") items.push(`${service.name}素材建立、尋找與授權`);
      if ((detail.versionCount ?? 0) > 0) items.push(`${service.name}同版版本 ×${detail.versionCount}（只換文字或圖片）`);
    });
  services
    .filter((service) => answers.serviceIds.includes(service.id) && detailedPrintServiceIds.has(service.id))
    .forEach((service) => {
      const quantity = Math.max(0, answers.quantities[service.id] ?? 0);
      const details = answers.projectType === "monthly" && (service.id === "dm" || service.id === "menu")
        ? getMonthlyPrintDetails(answers, service.id, quantity)
        : [answers.printDesignDetails[service.id] ?? {}];
      details.forEach((detail, index) => {
        const prefix = details.length > 1 ? `${service.name}第 ${index + 1} 項` : service.name;
        if (detail.format === "custom") items.push(`${prefix}自訂尺寸`);
        if (detail.contentStatus === "need-copy") items.push(`${prefix}文案整理`);
        if (detail.imageStatus === "need-edit") items.push(`${prefix}圖片後製數量`);
        if (detail.imageStatus === "need-images") items.push(`${prefix}圖片尋找、製作與授權`);
        if ((detail.versionCount ?? 0) > 0) items.push(`${prefix}同版版本 ×${detail.versionCount}（只換文字或圖片）`);
        if (detail.fold === "custom") items.push(`${prefix}特殊折法`);
      });
    });
  services
    .filter((service) => answers.serviceIds.includes(service.id) && serviceDetailServiceIds.has(service.id))
    .forEach((service) => {
      const config = getServiceDetailConfig(service.id);
      if (!config) return;
      const quantity = Math.max(0, answers.quantities[service.id] ?? 0);
      const details = answers.projectType === "monthly" && service.id === "card"
        ? getMonthlyCardDetails(answers, quantity)
        : [answers.serviceDesignDetails[service.id] ?? {}];
      details.forEach((detail, index) => {
        const prefix = details.length > 1 ? `${service.name}第 ${index + 1} 款` : service.name;
        const pendingOptions = [
          config.specificationOptions.find((option) => option.value === detail.specification),
          config.contentOptions.find((option) => option.value === detail.contentStatus),
          config.assetOptions.find((option) => option.value === detail.assetStatus),
        ].filter((option): option is ServiceDetailOption => Boolean(option?.pending));
        pendingOptions.forEach((option) => items.push(`${prefix}：${option.label}`));
      });
    });
  if (answers.projectType === "single" && answers.serviceIds.includes("resize") && answers.ecommerceDesignDetails.resize?.assetStatus !== "ready") {
    items.push("Resize：可編輯原始檔是否能使用");
  }
  if (answers.projectType === "monthly") {
    const sourceFileSelections = getMonthlySourceFileSelections(answers);
    if (sourceFileSelections.length > 0) {
      items.push(`月方案原始檔加購（${sourceFileSelections.map(({ service, quantity }) => `${service.name} ×${quantity}`).join("、")}）：費用另行確認`);
    }
    const printProductionServices = services.filter((service) => (
      service.category === "print"
      && answers.serviceIds.includes(service.id)
      && answers.printSpecifications[service.id]?.support
    ));
    if (printProductionServices.length > 0) {
      items.push(`代辦印刷（${printProductionServices.map((service) => service.name).join("、")}）：費用另行估價`);
    }
  }
  return Array.from(new Set(items));
}

function formatPriceRange(low: number, high: number) {
  return low === high ? currency.format(low) : `${currency.format(low)}～${currency.format(high)}`;
}

function parseOptionalPositiveInteger(rawValue: string) {
  const value = Math.round(Number(rawValue));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function getBannerExtensionCount(answers: Answers) {
  return Math.max(0, answers.ecommerceDesignDetails.banner?.bannerExtensionCount ?? 0);
}

function getServiceUnit(service: Service, _answers?: Answers) {
  return service.unit;
}

function getServiceDisplayPrice(service: Service) {
  if (service.id === "banner") {
    return `${formatPriceRange(service.low, service.high)}／版｜主視覺延伸加購 +${formatPriceRange(bannerExtensionPrice.low, bannerExtensionPrice.high)}／張`;
  }
  if (service.id === "social") {
    return `${formatPriceRange(service.low, service.high)}／張｜同篇貼文，第 2 張起 +${formatPriceRange(socialExtensionPrice.low, socialExtensionPrice.high)}／張`;
  }
  if (service.id === "product-frame") {
    return `${formatPriceRange(service.low, service.high)}／版｜圖框含 1 項產品，每追加 1 項產品／+$70`;
  }
  if (service.id === "dm" || service.id === "menu") {
    const firstUnitLabel = service.id === "dm" ? "基本設計（第 1 面／頁）" : "首版（第 1 頁）";
    return `${formatPriceRange(service.low, service.high)}／${firstUnitLabel}｜第 2 頁起 ${formatPriceRange(600, 800)}／頁`;
  }
  if (service.id === "card") {
    return `單面 ${formatPriceRange(1000, 1500)}／款｜雙面 ${formatPriceRange(1200, 2200)}／款`;
  }
  return `${formatPriceRange(service.low, service.high)}／${service.unit}`;
}

function formatServiceQuantity(service: Service, quantity?: number, answers?: Answers) {
  if (!quantity) return service.name;
  return `${service.name} ×${quantity} ${getServiceUnit(service, answers)}`;
}

function formatPdfServiceQuantity(service: Service, quantity?: number, answers?: Answers) {
  const normalizedQuantity = Math.max(1, quantity ?? 1);
  return `${normalizedQuantity} ${getServiceUnit(service, answers)}`;
}

function getCardRangeForSpecification(specification?: string) {
  return specification === "double"
    ? { low: 1200, high: 2200 }
    : { low: 1000, high: 1500 };
}

function getCardBaseRange(answers: Answers) {
  return getCardRangeForSpecification(answers.serviceDesignDetails.card?.specification);
}

function formatExtensionSummary(count: number) {
  return `同版版本 ×${count}（只換文字或圖片，不含重排或改尺寸）`;
}

function getSocialPricingCounts(answers: Answers) {
  const postCount = Math.max(1, answers.socialPostCount ?? 1);
  const imageCounts = Array.from(
    { length: postCount },
    (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, answers.socialPostImageCounts?.[index] ?? 1)),
  );
  const totalImages = imageCounts.reduce((sum, count) => sum + count, 0);
  const extensionCount = imageCounts.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  return { postCount, imageCounts, totalImages, extensionCount };
}

function getProductFramePricingCounts(answers?: Answers, frameCountOverride?: number) {
  const frameCount = Math.max(1, frameCountOverride ?? answers?.quantities["product-frame"] ?? 1);
  const productCounts = Array.from(
    { length: frameCount },
    (_, index) => Math.max(1, answers?.productFrameProductCounts?.[index] ?? 1),
  );
  const totalProducts = productCounts.reduce((sum, count) => sum + count, 0);
  const extraProductCount = productCounts.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  return { frameCount, productCounts, totalProducts, extraProductCount };
}

function getServiceEstimate(answers: Answers, service: Service) {
  const socialPricing = service.id === "social" ? getSocialPricingCounts(answers) : undefined;
  const quantity = socialPricing?.totalImages ?? Math.max(1, answers.quantities[service.id] || 1);
  let baseLow = 0;
  let baseHigh = 0;

  if (service.id === "social") {
    const primaryCount = socialPricing?.postCount ?? 1;
    const extensionCount = socialPricing?.extensionCount ?? 0;
    baseLow = service.low * primaryCount + extensionCount * socialExtensionPrice.low;
    baseHigh = service.high * primaryCount + extensionCount * socialExtensionPrice.high;
  } else if (service.id === "product-frame") {
    const { extraProductCount } = getProductFramePricingCounts(answers, quantity);
    baseLow = service.low * quantity + extraProductCount * 70;
    baseHigh = service.high * quantity + extraProductCount * 70;
  } else if (service.pricing === "dm") {
    baseLow = service.low + Math.max(0, quantity - 1) * 600;
    baseHigh = service.high + Math.max(0, quantity - 1) * 800;
  } else if (service.pricing === "card") {
    const cardBaseRange = getCardBaseRange(answers);
    baseLow = cardBaseRange.low + Math.max(0, quantity - 1) * 300;
    baseHigh = cardBaseRange.high + Math.max(0, quantity - 1) * 300;
  } else {
    baseLow = service.low * quantity;
    baseHigh = service.high * quantity;
  }

  if (answers.projectType === "single" && service.id === "social" && quantity >= 10) {
    const payableRate = (100 - socialVolumeDiscountPercent) / 100;
    baseLow *= payableRate;
    baseHigh *= payableRate;
  }

  const bannerExtensionCount = service.id === "banner" ? getBannerExtensionCount(answers) : 0;
  const addonLow = bannerExtensionCount * bannerExtensionPrice.low;
  const addonHigh = bannerExtensionCount * bannerExtensionPrice.high;

  const sourceFileBaseLow = service.id === "product-frame" ? service.low * quantity : baseLow;
  const sourceFileBaseHigh = service.id === "product-frame" ? service.high * quantity : baseHigh;
  const sourceLow = answers.sourceFileServiceIds.includes(service.id) ? sourceFileBaseLow * 0.5 : 0;
  const sourceHigh = answers.sourceFileServiceIds.includes(service.id) ? sourceFileBaseHigh * 0.5 : 0;
  const printLow = answers.projectType === "single" && answers.printSpecifications[service.id]?.support ? baseLow * 0.15 : 0;
  const printHigh = answers.projectType === "single" && answers.printSpecifications[service.id]?.support ? baseHigh * 0.15 : 0;
  return {
    quantity,
    baseLow,
    baseHigh,
    sourceLow,
    sourceHigh,
    printLow,
    printHigh,
    addonLow,
    addonHigh,
    totalLow: baseLow + addonLow + sourceLow + printLow,
    totalHigh: baseHigh + addonHigh + sourceHigh + printHigh,
  };
}

function getSourceFilePriceBasis(service: Service, quantity = 1) {
  return service.id === "product-frame"
    ? `商品主圖版型 ${Math.max(1, quantity)} 版 × 每版設計費 × 50%（不含追加產品）`
    : service.id === "banner"
      ? "網站橫幅基本設計費 × 50%（不含主視覺延伸加購）"
    : "該項設計費 × 50%";
}

function getServicePriceBasis(answers: Answers, service: Service) {
  const estimate = getServiceEstimate(answers, service);
  const quantity = estimate.quantity;
  if (service.id === "social") {
    const socialPricing = getSocialPricingCounts(answers);
    const parts = [`每篇首張，共 ${socialPricing.postCount} 張 × ${formatPriceRange(service.low, service.high)}／張`];
    if (socialPricing.extensionCount > 0) {
      parts.push(`同篇延伸 ${socialPricing.extensionCount} 張 × ${formatPriceRange(socialExtensionPrice.low, socialExtensionPrice.high)}／張`);
    }
    if (answers.projectType === "single" && quantity >= 10) parts.push("總圖滿 10 張，設計費套用 9.5 折（僅適用單次服務）");
    return parts.join("；");
  }
  if (service.id === "product-frame") {
    const { extraProductCount } = getProductFramePricingCounts(answers, quantity);
    return [
      `商品主圖版型 ${quantity} 版 × ${formatPriceRange(service.low, service.high)}／版`,
      extraProductCount > 0 ? `追加產品 ${extraProductCount} 項 × $70` : "每版含 1 項產品",
    ].join("；");
  }
  if (service.id === "banner") {
    return `網站橫幅基本設計：${quantity} 版 × ${formatPriceRange(service.low, service.high)}／版`;
  }
  if (service.pricing === "dm") {
    const extraPageCount = Math.max(0, quantity - 1);
    const firstUnitLabel = service.id === "dm" ? "第 1 面／頁" : "第 1 頁";
    return [
      `${firstUnitLabel} × ${formatPriceRange(service.low, service.high)}`,
      ...(extraPageCount > 0 ? [`第 2 頁起 ${extraPageCount} 頁 × ${formatPriceRange(600, 800)}／頁`] : []),
    ].join("；");
  }
  if (service.pricing === "card") {
    const extraCardCount = Math.max(0, quantity - 1);
    const cardBaseRange = getCardBaseRange(answers);
    return [
      `${answers.serviceDesignDetails.card?.specification === "double" ? "雙面" : "單面"}首款 × ${formatPriceRange(cardBaseRange.low, cardBaseRange.high)}`,
      ...(extraCardCount > 0 ? [`延伸版本 ${extraCardCount} 款 × $300`] : []),
    ].join("；");
  }
  return `${quantity} ${service.unit} × ${formatPriceRange(service.low, service.high)}／${service.unit}`;
}

function hasCompletedSinglePricingInputs(answers: Answers) {
  if (answers.projectType !== "single" || answers.serviceIds.length === 0) return false;
  return services
    .filter((service) => answers.serviceIds.includes(service.id))
    .every((service) => {
      if (ecommerceDetailServiceIds.has(service.id)) {
        return getMissingEcommerceDetailFields(service, answers.ecommerceDesignDetails[service.id] ?? {}, answers).length === 0;
      }
      if (detailedPrintServiceIds.has(service.id)) {
        return getMissingPrintDetailFields(
          service.id,
          answers.printDesignDetails[service.id] ?? {},
          Math.max(0, answers.quantities[service.id] ?? 0),
        ).length === 0;
      }
      if (serviceDetailServiceIds.has(service.id)) {
        return getMissingServiceDetailFields(service, answers.serviceDesignDetails[service.id] ?? {}, answers).length === 0;
      }
      return Math.max(0, answers.quantities[service.id] ?? 0) > 0;
    });
}

function getMonthlySourceFileSelections(answers: Answers) {
  return services
    .filter((service) => (
      answers.serviceIds.includes(service.id)
      && (answers.quantities[service.id] ?? 0) > 0
      && (answers.monthlySourceFileQuantities[service.id] ?? 0) > 0
    ))
    .map((service) => ({
      service,
      quantity: Math.min(
        Math.max(0, answers.quantities[service.id] ?? 0),
        Math.max(0, answers.monthlySourceFileQuantities[service.id] ?? 0),
      ),
    }));
}

function getQuote(answers: Answers) {
  let baseLow = 0;
  let baseHigh = 0;
  let addonLow = 0;
  let addonHigh = 0;
  let sourceLow = 0;
  let sourceHigh = 0;
  let printLow = 0;
  let printHigh = 0;
  let baseNote = "";
  let monthlyBaseTarget: number | undefined;
  const serviceBreakdown: PriceBreakdownItem[] = [];

  if (answers.projectType === "monthly") {
    const plan = monthlyPlans.find((item) => item.id === answers.monthlyPlanId);
    if (plan) {
      const groupCount = Math.min(10, Math.max(3, answers.monthlyGroupCount ?? plan.minGroups));
      const monthlyReference = getMonthlyPricingReference(answers);
      const discountedDesign = getMonthlyDiscountedDesignRange(answers);
      const discountedDesignLow = discountedDesign.low;
      const discountedDesignHigh = Math.max(discountedDesignLow, discountedDesign.high);
      baseLow = discountedDesignLow;
      baseHigh = discountedDesignHigh;
      addonLow = monthlyReference.addonLow;
      addonHigh = monthlyReference.addonHigh;
      const materialPosition = answers.materials === "ready" ? 0.2 : answers.materials === "need-help" ? 0.85 : 0.5;
      const monthlyPosition = Math.min(1, Math.max(0, materialPosition));
      const combinedLow = baseLow + addonLow;
      const combinedHigh = baseHigh + addonHigh;
      monthlyBaseTarget = Math.round(combinedLow + (combinedHigh - combinedLow) * monthlyPosition);
      baseNote = `${plan.name}／${groupCount} 組／月`;
    }
  } else {
    const selectedServices = services.filter((item) => answers.serviceIds.includes(item.id));
    const notes: string[] = [];
    selectedServices.forEach((service) => {
      const estimate = getServiceEstimate(answers, service);
      const { quantity } = estimate;
      const socialPricing = service.id === "social" ? getSocialPricingCounts(answers) : undefined;
      baseLow += estimate.baseLow;
      baseHigh += estimate.baseHigh;
      addonLow += estimate.addonLow;
      addonHigh += estimate.addonHigh;
      sourceLow += estimate.sourceLow;
      sourceHigh += estimate.sourceHigh;
      printLow += estimate.printLow;
      printHigh += estimate.printHigh;
      serviceBreakdown.push({
        label: `${service.name}｜設計費`,
        detail: getServicePriceBasis(answers, service),
        low: Math.round(estimate.baseLow),
        high: Math.round(estimate.baseHigh),
      });
      if (estimate.addonLow > 0) {
        const extensionCount = getBannerExtensionCount(answers);
        serviceBreakdown.push({
          label: `${service.name}｜主視覺延伸加購`,
          detail: `${extensionCount} 張 × ${formatPriceRange(bannerExtensionPrice.low, bannerExtensionPrice.high)}／張`,
          low: Math.round(estimate.addonLow),
          high: Math.round(estimate.addonHigh),
        });
      }
      if (estimate.sourceLow > 0) {
        serviceBreakdown.push({
          label: `${service.name}｜原始檔加購`,
          detail: getSourceFilePriceBasis(service, quantity),
          low: Math.round(estimate.sourceLow),
          high: Math.round(estimate.sourceHigh),
        });
      }
      if (estimate.printLow > 0) {
        serviceBreakdown.push({
          label: `${service.name}｜印刷代辦服務費`,
          detail: "該項設計費 × 15%（不含印刷與運送）",
          low: Math.round(estimate.printLow),
          high: Math.round(estimate.printHigh),
        });
      }
      if (service.id === "social") {
        notes.push(`${formatServiceQuantity(service, quantity, answers)}（${socialPricing?.postCount ?? 1} 篇貼文、每篇首張共 ${socialPricing?.postCount ?? 1} 張、同篇後續 ${socialPricing?.extensionCount ?? 0} 張${quantity >= 10 ? "・9.5 折" : ""}）`);
      } else if (service.id === "product-frame") {
        const framePricing = getProductFramePricingCounts(answers, quantity);
        notes.push(`${formatServiceQuantity(service, quantity, answers)}（共 ${framePricing.totalProducts} 項產品）`);
      } else {
        notes.push(formatServiceQuantity(service, quantity, answers));
      }
    });
    baseNote = notes.join("・");
  }

  const low = Math.round(baseLow + addonLow + sourceLow + printLow);
  const high = Math.round(baseHigh + addonHigh + sourceHigh + printHigh);
  const monthlyDiscountSummary = answers.projectType === "monthly" ? getMonthlyDiscountSummary(answers) : undefined;
  const monthlyAddonBreakdown = answers.projectType === "monthly" ? getMonthlyAddonBreakdown(answers) : [];
  const monthlyServiceBreakdown = answers.projectType === "monthly"
    ? services
        .filter((service) => answers.serviceIds.includes(service.id) && (answers.quantities[service.id] ?? 0) > 0)
        .flatMap((service) => {
          const reference = getMonthlyServicePricingReference(answers, service);
          const designFeeRow = {
            label: `${service.name}｜單次設計費`,
            detail: formatMonthlyServiceQuantity(service, answers.quantities[service.id] ?? 0, true, answers),
            low: Math.round(reference.designLow),
            high: Math.round(reference.designHigh),
          };
          const serviceAddonRows = monthlyAddonBreakdown.filter((item) => item.label.startsWith(`${service.name}｜`));
          return [designFeeRow, ...serviceAddonRows];
        })
    : [];
  const breakdown = answers.projectType === "monthly"
    ? [
        ...monthlyServiceBreakdown,
        {
          label: monthlyDiscountSummary?.label ?? "月方案優惠",
          detail: monthlyDiscountSummary?.detail ?? "依所選服務套用月方案優惠",
          low: monthlyDiscountSummary?.low ?? 0,
          high: monthlyDiscountSummary?.high ?? 0,
        },
      ]
    : serviceBreakdown;

  const selectedComplexities = [
    ...Object.values(answers.printDesignDetails).map((detail) => detail.complexity),
    ...Object.values(answers.ecommerceDesignDetails).map((detail) => detail.visualLevel),
    ...Object.values(answers.serviceDesignDetails).map((detail) => detail.complexity),
  ]
    .filter((value): value is Complexity => Boolean(value));
  const complexityPositions = selectedComplexities.map((value) => value === "simple" ? 0.2 : value === "detailed" ? 0.85 : 0.5);
  const targetPosition = answers.complexity
    ? (answers.complexity === "simple" ? 0.2 : answers.complexity === "detailed" ? 0.85 : 0.5)
    : complexityPositions.length > 0
      ? complexityPositions.reduce((sum, value) => sum + value, 0) / complexityPositions.length
      : 0.5;
  const target = answers.projectType === "monthly" && monthlyBaseTarget !== undefined
    ? Math.round(monthlyBaseTarget)
    : Math.round(low + (high - low) * targetPosition);

  return { low, high, target, baseNote, breakdown };
}

function getMonthlyLivePreviewQuote(answers: Answers) {
  if (answers.projectType !== "monthly" || answers.serviceIds.length === 0) return getQuote(answers);
  if (answers.monthlyPlanId && answers.monthlyGroupCount) return getQuote(answers);

  const allocatedGroupCount = getMonthlyAllocatedGroups(answers);
  const roundedGroupCount = Math.round(allocatedGroupCount);
  const allocationIsWhole = Math.abs(allocatedGroupCount - roundedGroupCount) < 0.001;
  const printGroupCount = answers.serviceIds.reduce((total, serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service || service.category !== "print") return total;
    return total + Math.max(0, answers.quantities[serviceId] ?? 0) * getMonthlyServiceGroupCost(service);
  }, 0);
  const previewPlan = allocationIsWhole
    && roundedGroupCount >= 3
    && roundedGroupCount <= 10
    && printGroupCount <= 2
      ? getMonthlyPlanForCount(roundedGroupCount)
      : undefined;

  if (previewPlan) {
    return getQuote({
      ...answers,
      monthlyGroupCount: roundedGroupCount,
      monthlyPlanId: previewPlan.id,
    });
  }

  const reference = getMonthlyPricingReference(answers);
  const low = Math.round(reference.designLow + reference.addonLow);
  const high = Math.round(reference.designHigh + reference.addonHigh);
  const breakdown = services
    .filter((service) => answers.serviceIds.includes(service.id) && (answers.quantities[service.id] ?? 0) > 0)
    .flatMap((service) => {
      const serviceReference = getMonthlyServicePricingReference(answers, service);
      const rows: PriceBreakdownItem[] = [{
        label: `${service.name}｜基礎設計費`,
        detail: formatMonthlyServiceQuantity(service, answers.quantities[service.id] ?? 0, true, answers),
        low: Math.round(serviceReference.designLow),
        high: Math.round(serviceReference.designHigh),
      }];
      if (serviceReference.addonLow > 0 || serviceReference.addonHigh > 0) {
        rows.push({
          label: `${service.name}｜加購`,
          detail: "依目前選擇數量初估",
          low: Math.round(serviceReference.addonLow),
          high: Math.round(serviceReference.addonHigh),
        });
      }
      return rows;
    });
  const baseNote = roundedGroupCount < 3
    ? `已選 ${formatGroupAmount(allocatedGroupCount)} 組｜滿 3 組後套用月方案優惠`
    : roundedGroupCount > 10
      ? `已選 ${formatGroupAmount(allocatedGroupCount)} 組｜超過月方案上限`
      : "依目前選擇數量顯示基礎初估";

  return {
    low,
    high,
    target: Math.round(low + (high - low) * 0.5),
    baseNote,
    breakdown,
  };
}

function getSingleScheduleSummary(answers: Answers) {
  if (answers.serviceIds.length === 0) return "—";
  const schedules = new Map<string, string[]>();
  answers.serviceIds.forEach((serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    const schedule = getServiceTimelineSummary(serviceId);
    schedules.set(schedule, [...(schedules.get(schedule) ?? []), getSummaryServiceName(service)]);
  });
  if (schedules.size === 1) return schedules.keys().next().value ?? timelineSummaryLabels.regular;
  return Array.from(schedules, ([schedule, names]) => `${names.join("、")} ${schedule}`).join("；");
}

function OptionButton({
  label,
  detail,
  note,
  price,
  schedule,
  onClick,
  selected = false,
  multiple = false,
}: {
  label: string;
  detail?: string;
  note?: string;
  price?: string;
  schedule?: string;
  onClick: () => void;
  selected?: boolean;
  multiple?: boolean;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  function handleClick() {
    if (multiple || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClick();
      return;
    }
    if (isConfirming) return;
    setIsConfirming(true);
    window.setTimeout(onClick, 40);
  }

  return (
    <button
      className={`choice${selected || isConfirming ? " selected" : ""}${isConfirming ? " is-confirming" : ""}`}
      type="button"
      disabled={isConfirming}
      onClick={handleClick}
      aria-busy={isConfirming || undefined}
      aria-pressed={multiple ? selected : undefined}
    >
      <span className="choice-copy">
        <span className="choice-title-row">
          <strong>{label}</strong>
          {schedule && <em className="choice-schedule">約 {schedule}</em>}
        </span>
        {detail && <small>{detail}</small>}
        {note && <small className="choice-requirement"><span>檔案需求</span>{note}</small>}
        {price && <em className="choice-price">{price}</em>}
      </span>
      <span className="choice-arrow" aria-hidden="true">
        {multiple ? (selected ? "✓" : "+") : isConfirming ? "✓" : "→"}
      </span>
    </button>
  );
}

function FoldDiagram({ fold }: { fold: PrintFold }) {
  if (fold === "custom") {
    return <span className="fold-diagram fold-diagram-custom" aria-hidden="true"><b>?</b></span>;
  }
  const panelCount = fold === "half" ? 2 : fold === "tri" ? 3 : 4;
  return (
    <span className={`fold-diagram fold-diagram-${fold}`} aria-hidden="true">
      <span className="fold-paper" style={{ "--fold-panels": panelCount } as CSSProperties}>
        {Array.from({ length: panelCount }, (_, index) => <i key={index} />)}
      </span>
    </span>
  );
}

function FoldChoice({
  fold,
  label,
  selected = false,
  onClick,
}: {
  fold: PrintFold;
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`fold-choice${selected ? " selected" : ""}`} type="button" aria-pressed={selected} onClick={onClick}>
      <FoldDiagram fold={fold} />
      <strong>{label}</strong>
      <small>{printFoldDescriptions[fold]}</small>
    </button>
  );
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let currentLine = "";
  Array.from(text).forEach((character) => {
    if (character === "\n") {
      lines.push(currentLine);
      currentLine = "";
      return;
    }
    const candidate = currentLine + character;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = candidate;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}

function loadPdfContactQrCode() {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("無法載入 LINE 聯絡 QR Code"));
    image.src = "/assets/embedded/87272102c4a651a7.webp";
  });
}

function drawPdfLogoWatermark(context: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
  context.save();
  context.globalAlpha = 0.08;
  context.fillStyle = "#806957";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '700 220px Georgia, "Noto Serif TC", serif';
  context.fillText("SA", canvasWidth / 2, canvasHeight / 2 - 42);
  context.font = '600 44px Georgia, "Noto Serif TC", serif';
  context.fillText("DESIGN", canvasWidth / 2, canvasHeight / 2 + 112);
  context.restore();
}

function createPdfFromJpegs(pages: Array<{ jpegBytes: Uint8Array; imageWidth: number; imageHeight: number; textLines: string[] }>) {
  if (pages.length === 0) throw new Error("估價單沒有可輸出的頁面");
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let size = 0;
  const append = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    chunks.push(bytes);
    size += bytes.length;
  };
  const startObject = (id: number) => {
    offsets[id] = size;
    append(`${id} 0 obj\n`);
  };
  const toUtf16Hex = (value: string) => Array.from(value.replaceAll("\n", " "))
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 32;
      if (codePoint <= 0xffff) return codePoint.toString(16).padStart(4, "0");
      const adjusted = codePoint - 0x10000;
      const high = 0xd800 + (adjusted >> 10);
      const low = 0xdc00 + (adjusted & 0x3ff);
      return `${high.toString(16).padStart(4, "0")}${low.toString(16).padStart(4, "0")}`;
    })
    .join("");

  append("%PDF-1.4\n% Sam Design Studio estimate\n");
  startObject(1);
  append("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  startObject(2);
  const pageObjectIds = pages.map((_, index) => 7 + index * 3);
  append(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);
  startObject(3);
  append("<< /Type /Font /Subtype /Type0 /BaseFont /NotoSansCJKtc-Regular /Encoding /Identity-H /DescendantFonts [4 0 R] /ToUnicode 6 0 R >>\nendobj\n");
  startObject(4);
  append("<< /Type /Font /Subtype /CIDFontType2 /BaseFont /NotoSansCJKtc-Regular /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor 5 0 R /DW 1000 /CIDToGIDMap /Identity >>\nendobj\n");
  startObject(5);
  append("<< /Type /FontDescriptor /FontName /NotoSansCJKtc-Regular /Flags 4 /FontBBox [0 -250 1000 1000] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 700 /StemV 80 >>\nendobj\n");
  const toUnicodeCmap = encoder.encode("/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n");
  startObject(6);
  append(`<< /Length ${toUnicodeCmap.length} >>\nstream\n`);
  append(toUnicodeCmap);
  append("endstream\nendobj\n");
  pages.forEach((page, index) => {
    const pageId = pageObjectIds[index];
    const imageId = pageId + 1;
    const contentId = pageId + 2;
    startObject(pageId);
    append(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imageId} 0 R >> /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`);
    startObject(imageId);
    append(`<< /Type /XObject /Subtype /Image /Width ${page.imageWidth} /Height ${page.imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`);
    append(page.jpegBytes);
    append("\nendstream\nendobj\n");
    const textLayer = page.textLines
      .filter(Boolean)
      .map((line, lineIndex) => {
        const column = Math.floor(lineIndex / 70);
        const row = lineIndex % 70;
        return `1 0 0 1 ${36 + column * 180} ${805 - row * 11} Tm\n<${toUtf16Hex(line)}> Tj`;
      })
      .join("\n");
    const content = encoder.encode(`q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\nBT\n/F1 8 Tf\n3 Tr\n${textLayer}\nET\n`);
    startObject(contentId);
    append(`<< /Length ${content.length} >>\nstream\n`);
    append(content);
    append("endstream\nendobj\n");
  });
  const objectCount = 6 + pages.length * 3;
  const xrefOffset = size;
  append(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= objectCount; id += 1) {
    append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  append(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const pdfBytes = new Uint8Array(size);
  let position = 0;
  chunks.forEach((chunk) => {
    pdfBytes.set(chunk, position);
    position += chunk.length;
  });
  return new Blob([pdfBytes.buffer], { type: "application/pdf" });
}

export default function Home() {
  const [step, setStep] = useState<Step>("projectType");
  const [answers, setAnswers] = useState<Answers>({ serviceIds: [], quantities: {}, ecommerceDesignDetails: {}, serviceDesignDetails: {}, sourceFileServiceIds: [], printDesignDetails: {}, printSpecifications: {}, monthlySourceFileQuantities: {} });
  const [messages, setMessages] = useState<Message[]>([
    {
      speaker: "studio",
      text: "歡迎來到 Sam Design Studio，我會用幾個簡單問題幫你整理需求。",
    },
  ]);
  const [journeyTimeline, setJourneyTimeline] = useState<HistoryEntry[]>([]);
  const [journeyPosition, setJourneyPosition] = useState(0);
  const history = journeyTimeline.slice(0, journeyPosition);
  const [journeyFlow, setJourneyFlow] = useState<ProjectType>();
  const [journeySnapshots, setJourneySnapshots] = useState<Partial<Record<JourneySection, HistoryEntry>>>({});
  const [inputValue, setInputValue] = useState("");
  const [ecommerceDetailErrors, setEcommerceDetailErrors] = useState<EcommerceDetailField[]>([]);
  const [printDetailErrors, setPrintDetailErrors] = useState<PrintDetailField[]>([]);
  const [serviceDetailErrors, setServiceDetailErrors] = useState<ServiceDetailField[]>([]);
  const [expandedServiceCategory, setExpandedServiceCategory] = useState<"ecommerce" | "print" | "other" | null>(null);
  const [activeMonthlySpecificationServiceId, setActiveMonthlySpecificationServiceId] = useState<string>();
  const [isMobileSummaryExpanded, setIsMobileSummaryExpanded] = useState(false);
  const [inquirySubmitState, setInquirySubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [inquirySubmitMessage, setInquirySubmitMessage] = useState("");
  const [lineCopyState, setLineCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "back">("forward");
  const [isStepExiting, setIsStepExiting] = useState(false);
  const [isMonthlySpecificationAdvancing, setIsMonthlySpecificationAdvancing] = useState(false);
  const [isSingleSpecificationAdvancing, setIsSingleSpecificationAdvancing] = useState(false);
  const [confirmedSingleServiceIds, setConfirmedSingleServiceIds] = useState<string[]>([]);
  const [showQuoteUpdated, setShowQuoteUpdated] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const currentQuestionRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const ecommerceDetailsRef = useRef<HTMLDivElement>(null);
  const printDetailsRef = useRef<HTMLDivElement>(null);
  const serviceDetailsRef = useRef<HTMLDivElement>(null);
  const journeyNavListRef = useRef<HTMLDivElement>(null);
  const specificationSwitcherListRef = useRef<HTMLDivElement>(null);
  const lastQuoteSignatureRef = useRef("");
  const incomingServiceHandledRef = useRef(false);
  const stepTransitionTimerRef = useRef<number | undefined>(undefined);
  const monthlySpecificationTimerRef = useRef<number | undefined>(undefined);
  const singleSpecificationTimerRef = useRef<number | undefined>(undefined);
  const stepTransitionLockedRef = useRef(false);
  const journeyDragRef = useRef({ active: false, pointerId: -1, startX: 0, scrollLeft: 0, moved: false });
  const specificationSwitcherDragRef = useRef({ active: false, pointerId: -1, startX: 0, scrollLeft: 0, moved: false });

  useEffect(() => () => {
    if (stepTransitionTimerRef.current !== undefined) window.clearTimeout(stepTransitionTimerRef.current);
    if (monthlySpecificationTimerRef.current !== undefined) window.clearTimeout(monthlySpecificationTimerRef.current);
    if (singleSpecificationTimerRef.current !== undefined) window.clearTimeout(singleSpecificationTimerRef.current);
  }, []);

  useEffect(() => {
    if (incomingServiceHandledRef.current) return;
    incomingServiceHandledRef.current = true;

    const searchParams = new URLSearchParams(window.location.search);
    const serviceId = searchParams.get("service");
    const normalizedServiceId = serviceId === "flyer" ? "dm" : serviceId;
    const requestedMode = searchParams.get("mode");
    const emptyAnswers: Answers = {
      serviceIds: [],
      quantities: {},
      ecommerceDesignDetails: {},
      serviceDesignDetails: {},
      sourceFileServiceIds: [],
      printDesignDetails: {},
      printSpecifications: {},
      monthlySourceFileQuantities: {},
    };
    const welcomeMessages: Message[] = [
      {
        speaker: "studio",
        text: "歡迎來到 Sam Design Studio，我會用幾個簡單問題幫你整理需求。",
      },
    ];
    const scrollToCurrentQuestion = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const question = currentQuestionRef.current;
          if (!question) return;
          const questionRect = question.getBoundingClientRect();
          const isVisible = questionRect.top >= 88 && questionRect.bottom <= window.innerHeight - 20;
          if (isVisible) return;
          question.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            block: "center",
            inline: "nearest",
          });
        });
      });
    };

    if (requestedMode === "monthly") {
      const monthlyAnswers: Answers = { ...emptyAnswers, projectType: "monthly" };
      const monthlyMessages: Message[] = [
        ...welcomeMessages,
        { speaker: "studio", text: getQuestion("projectType", emptyAnswers) },
        { speaker: "user", text: "月方案" },
      ];
      const cooperationEntry: HistoryEntry = {
        step: "projectType",
        answers: monthlyAnswers,
        messages: welcomeMessages,
      };
      const monthlyEntry: HistoryEntry = {
        step: "monthlyServices",
        answers: monthlyAnswers,
        messages: monthlyMessages,
      };

      setAnswers(monthlyAnswers);
      setMessages(monthlyMessages);
      setStep("monthlyServices");
      setJourneyTimeline([cooperationEntry, monthlyEntry]);
      setJourneyPosition(1);
      setJourneyFlow("monthly");
      setJourneySnapshots({ cooperation: cooperationEntry, services: monthlyEntry });
      setExpandedServiceCategory(null);
      setActiveMonthlySpecificationServiceId(undefined);
      setTransitionDirection("forward");
      scrollToCurrentQuestion();
      return;
    }

    const service = services.find((item) => item.id === normalizedServiceId);
    if (!service || service.category === "mixed") return;

    let specificationStep: Step;
    let activeIndex: Partial<Answers>;
    if (ecommerceDetailServiceIds.has(service.id)) {
      specificationStep = "ecommerceDetails";
      activeIndex = { ecommerceDetailIndex: 0 };
    } else if (detailedPrintServiceIds.has(service.id)) {
      specificationStep = "printDetails";
      activeIndex = { printDetailIndex: 0 };
    } else if (serviceDetailServiceIds.has(service.id)) {
      specificationStep = "serviceDetails";
      activeIndex = { serviceDetailIndex: 0 };
    } else {
      return;
    }

    const cooperationAnswers: Answers = { ...emptyAnswers, projectType: "single" };
    const specificationAnswers: Answers = {
      ...cooperationAnswers,
      ...activeIndex,
      category: service.category,
      serviceIds: [service.id],
      quantities: service.id === "poster" ? { poster: 1 } : {},
    };
    const serviceMessages: Message[] = [
      ...welcomeMessages,
      { speaker: "studio", text: getQuestion("projectType", emptyAnswers) },
      { speaker: "user", text: "單次設計" },
    ];
    const specificationMessages: Message[] = [
      ...serviceMessages,
      { speaker: "studio", text: getQuestion("category", cooperationAnswers) },
      { speaker: "user", text: service.name },
    ];
    const cooperationEntry: HistoryEntry = {
      step: "projectType",
      answers: cooperationAnswers,
      messages: welcomeMessages,
    };
    const serviceEntry: HistoryEntry = {
      step: "category",
      answers: specificationAnswers,
      messages: serviceMessages,
    };
    const specificationEntry: HistoryEntry = {
      step: specificationStep,
      answers: specificationAnswers,
      messages: specificationMessages,
    };

    setAnswers(specificationAnswers);
    setMessages(specificationMessages);
    setStep(specificationStep);
    setJourneyTimeline([cooperationEntry, serviceEntry, specificationEntry]);
    setJourneyPosition(2);
    setJourneyFlow("single");
    setJourneySnapshots({
      cooperation: cooperationEntry,
      services: serviceEntry,
      specifications: specificationEntry,
    });
    setExpandedServiceCategory(service.category);
    setTransitionDirection("forward");
    scrollToCurrentQuestion();
  }, []);

  const selectedServices = services.filter((item) => answers.serviceIds.includes(item.id));
  const activeMonthlySpecificationService = selectedServices.find((item) => item.id === activeMonthlySpecificationServiceId) ?? selectedServices[0];
  const activeMonthlySpecificationIndex = activeMonthlySpecificationService
    ? selectedServices.findIndex((item) => item.id === activeMonthlySpecificationService.id)
    : -1;
  const initialQuantityServices = selectedServices.filter(requiresInitialQuantity);
  const selectedEcommerceServices = selectedServices.filter((item) => ecommerceDetailServiceIds.has(item.id));
  const selectedPrintServices = selectedServices.filter((item) => item.category === "print");
  const monthlyPrintGroupCount = selectedPrintServices.reduce(
    (total, item) => total + Math.max(0, answers.quantities[item.id] ?? 0) * getMonthlyServiceGroupCost(item),
    0,
  );
  const selectedDetailedPrintServices = selectedServices.filter((item) => detailedPrintServiceIds.has(item.id));
  const selectedServiceDetailServices = selectedServices.filter((item) => serviceDetailServiceIds.has(item.id));
  const specificationServices = getSelectedSpecificationServices(answers);
  const singleServicesMissingQuantity = answers.projectType === "single"
    ? selectedServices.filter((service) => {
        if (!getSingleInlineQuantityConfig(service)) return false;
        if (service.id === "social") return (answers.socialPostCount ?? 0) < 1;
        return (answers.quantities[service.id] ?? 0) < 1;
      })
    : [];
  const singleSelectionReady = selectedServices.length > 0 && singleServicesMissingQuantity.length === 0;
  const singleSelectedSummary = selectedServices.map((service) => service.name).join("、");
  const activeEcommerceService = selectedEcommerceServices[answers.ecommerceDetailIndex ?? 0];
  const activeDetailedService = selectedDetailedPrintServices[answers.printDetailIndex ?? 0];
  const activeServiceDetailService = selectedServiceDetailServices[answers.serviceDetailIndex ?? 0];
  const getSpecificationPositionLabel = (serviceId: string) => {
    const index = specificationServices.findIndex((item) => item.id === serviceId);
    return index >= 0 ? `第 ${index + 1} 項／共 ${specificationServices.length} 項` : `共 ${specificationServices.length} 項`;
  };
  const plan = monthlyPlans.find((item) => item.id === answers.monthlyPlanId);
  const monthlyAllocatedGroupCount = answers.projectType === "monthly"
    ? getMonthlyAllocatedGroups(answers)
    : 0;
  const monthlyMinimumGroupCount = 3;
  const monthlyTargetGroupCount = answers.monthlyGroupCount ?? 0;
  const monthlyAllocationIsWhole = Math.abs(monthlyAllocatedGroupCount - Math.round(monthlyAllocatedGroupCount)) < 0.001;
  const monthlyPreviewPlan = monthlyAllocationIsWhole
    && monthlyAllocatedGroupCount >= monthlyMinimumGroupCount
    && monthlyAllocatedGroupCount <= 10
    && monthlyPrintGroupCount <= 2
      ? getMonthlyPlanForCount(Math.round(monthlyAllocatedGroupCount))
      : undefined;
  const monthlyMissingDetailLabels = [
    ...(answers.serviceIds.includes("social") && (answers.quantities.social ?? 0) > 0
      && (!answers.socialPostCount || (answers.socialPostImageCounts?.length ?? 0) !== answers.socialPostCount)
      ? ["IG／FB 貼文篇數與圖片數"] : []),
    ...(answers.serviceIds.includes("product-frame") && (answers.quantities["product-frame"] ?? 0) > 0
      && ((answers.productFrameProductCounts?.length ?? 0) !== (answers.quantities["product-frame"] ?? 0)
        || answers.productFrameProductCounts?.some((count) => !count || count < 1))
      ? ["商品主圖每版產品數"] : []),
    ...(answers.serviceIds.includes("card") && (answers.quantities.card ?? 0) > 0
      ? getMonthlyCardDetails(answers, answers.quantities.card ?? 0).flatMap((detail, index) => (
          ["single", "double"].includes(detail.specification ?? "")
            ? []
            : [(answers.quantities.card ?? 0) > 1 ? `名片／會員卡第 ${index + 1} 款單面或雙面` : "名片／會員卡單面或雙面"]
        ))
      : []),
    ...(answers.serviceIds.includes("poster") && (answers.quantities.poster ?? 0) > 0
      && (!answers.serviceDesignDetails.poster?.seriesArtwork
        || (answers.serviceDesignDetails.poster.seriesArtwork === "yes" && (answers.quantities.poster ?? 0) < 2)
        || (answers.serviceDesignDetails.poster.seriesArtwork === "none" && (answers.quantities.poster ?? 0) !== 1))
      ? ["活動／促銷海報單款或系列稿"] : []),
    ...selectedServices
      .filter((item): item is Service & { id: "dm" | "menu" } => item.id === "dm" || item.id === "menu")
      .flatMap((item) => {
        const quantity = Math.max(0, answers.quantities[item.id] ?? 0);
        return getMonthlyPrintDetails(answers, item.id, quantity).flatMap((detail, index) => {
          const prefix = quantity > 1 ? `${item.name}第 ${index + 1} 項` : item.name;
          return [
            ...(!detail.structure ? [`${prefix}成品結構`] : []),
            ...(detail.structure === "folded" && !detail.fold ? [`${prefix}折頁方式`] : []),
            ...(detail.structure === "multipage" && (detail.pageCount ?? 0) < getMinimumPrintPageCount(item.id, detail.structure) ? [`${prefix}總設計頁數`] : []),
          ];
        });
      }),
  ];
  const isMonthlySpecificationServiceComplete = (service: Service) => {
    const quantity = Math.max(0, answers.quantities[service.id] ?? 0);
    if (quantity < 1) return false;
    if (service.id === "social") {
      const postCount = Math.max(0, answers.socialPostCount ?? 0);
      return postCount === quantity
        && (answers.socialPostImageCounts?.length ?? 0) === postCount
        && (answers.socialPostImageCounts?.every((count) => Boolean(count && count >= 1)) ?? false);
    }
    if (service.id === "product-frame") {
      return (answers.productFrameProductCounts?.length ?? 0) === quantity
        && (answers.productFrameProductCounts?.every((count) => Boolean(count && count >= 1)) ?? false);
    }
    if (service.id === "card") {
      return getMonthlyCardDetails(answers, quantity).every((detail) => ["single", "double"].includes(detail.specification ?? ""));
    }
    if (service.id === "poster") {
      const seriesArtwork = answers.serviceDesignDetails.poster?.seriesArtwork;
      return seriesArtwork === "yes" ? quantity >= 2 : seriesArtwork === "none" && quantity === 1;
    }
    if (service.id === "dm" || service.id === "menu") {
      return getMonthlyPrintDetails(answers, service.id, quantity).every((detail) => (
        Boolean(detail.structure)
        && (detail.structure !== "folded" || Boolean(detail.fold))
        && (detail.structure !== "multipage" || (detail.pageCount ?? 0) >= getMinimumPrintPageCount(service.id, detail.structure))
      ));
    }
    return true;
  };
  const monthlyCompletedSpecificationCount = selectedServices.filter(isMonthlySpecificationServiceComplete).length;
  const monthlyServiceSpecificationsComplete = selectedServices.length > 0
    && selectedServices.every(isMonthlySpecificationServiceComplete);
  const monthlyDistributionComplete = Boolean(
    plan
    && monthlyAllocationIsWhole
    && monthlyAllocatedGroupCount >= monthlyMinimumGroupCount
    && monthlyAllocatedGroupCount <= 10
    && monthlyPrintGroupCount <= 2
    && monthlyTargetGroupCount === Math.round(monthlyAllocatedGroupCount)
    && monthlyMissingDetailLabels.length === 0,
  );
  const monthlyQuantityComplete = Boolean(
    selectedServices.length > 0
    && selectedServices.every((service) => (answers.quantities[service.id] ?? 0) >= 1)
  );
  const monthlyRulesComplete = Boolean(
    monthlyQuantityComplete
    && monthlyAllocationIsWhole
    && monthlyAllocatedGroupCount >= monthlyMinimumGroupCount
    && monthlyAllocatedGroupCount <= 10
    && monthlyPrintGroupCount <= 2,
  );
  const monthlySpecificationsComplete = Boolean(
    monthlyRulesComplete
    && monthlyServiceSpecificationsComplete
    && monthlyMissingDetailLabels.length === 0,
  );
  const monthlySourceFileSelections = getMonthlySourceFileSelections(answers);
  const monthlySourceFileCount = monthlySourceFileSelections.reduce((sum, item) => sum + item.quantity, 0);
  const monthlyPrintProductionServices = answers.projectType === "monthly"
    ? selectedPrintServices.filter((service) => answers.printSpecifications[service.id]?.support)
    : [];
  const summaryServiceItems = selectedServices.map((item) => {
    const quantity = answers.quantities[item.id];
    if (!quantity) return getSummaryServiceName(item);
    return formatLiveSummaryServiceQuantity(item, quantity, answers);
  });
  const quote = useMemo(
    () => answers.projectType === "monthly" ? getMonthlyLivePreviewQuote(answers) : getQuote(answers),
    [answers],
  );
  const monthlyComparison = useMemo(
    () => answers.projectType === "monthly" && monthlyDistributionComplete ? getMonthlyComparison(answers, quote) : null,
    [answers, monthlyDistributionComplete, quote],
  );
  const monthlyReferenceBreakdown = answers.projectType === "monthly"
    ? quote.breakdown.filter((item) => !item.label.startsWith("月方案優惠"))
        .map((item) => {
          const hasSingleSocialVolumeDiscount = answers.serviceIds.includes("social")
            && getSocialPricingCounts(answers).totalImages >= 10;
          if (!hasSingleSocialVolumeDiscount || !item.label.startsWith("IG／FB 社群圖文｜單次設計費")) return item;
          const payableRate = (100 - socialVolumeDiscountPercent) / 100;
          return {
            ...item,
            detail: `${item.detail}｜單次滿 10 張已套用 5% 優惠`,
            low: Math.round(item.low * payableRate),
            high: Math.round(item.high * payableRate),
          };
        })
    : [];
  const monthlySavings = monthlyComparison
    ? {
        low: Math.max(0, monthlyComparison.singleReference.low - quote.low),
        high: Math.max(0, monthlyComparison.singleReference.high - quote.high),
      }
    : null;
  const monthlySavingsLabel = monthlySavings
    ? monthlySavings.low > 0 || monthlySavings.high > 0
      ? `約省 ${formatPriceRange(monthlySavings.low, monthlySavings.high)}`
      : "與單次優惠後相近"
    : "";
  const quoteReady = answers.projectType === "monthly"
    ? Boolean(plan && answers.monthlyGroupCount)
    : hasCompletedSinglePricingInputs(answers);
  const hasVisibleEstimate = answers.projectType === "monthly"
    ? selectedServices.length > 0
    : selectedServices.length > 0;
  const pendingEstimateItems = useMemo(() => getPendingEstimateItems(answers), [answers]);
  const hasPrintProductionCosts = answers.projectType === "single"
    && Object.values(answers.printSpecifications).some((specification) => specification.support);
  const quoteSignature = hasVisibleEstimate && quote.low > 0
    ? [quote.low, quote.high, ...summaryServiceItems, ...quote.breakdown.map((item) => `${item.label}:${item.detail}:${item.low}-${item.high}`)].join("|")
    : "";

  useEffect(() => {
    if (!quoteSignature) {
      lastQuoteSignatureRef.current = "";
      setShowQuoteUpdated(false);
      return;
    }
    if (lastQuoteSignatureRef.current === quoteSignature) return;
    lastQuoteSignatureRef.current = quoteSignature;
    setShowQuoteUpdated(true);
    const timer = window.setTimeout(() => setShowQuoteUpdated(false), 1200);
    return () => window.clearTimeout(timer);
  }, [quoteSignature]);
  const journeySteps = useMemo(() => {
    const flow = answers.projectType ?? journeyFlow;
    const sections = flow === "monthly"
      ? monthlyJourneySections
      : flow === "single"
      ? singleJourneySections
      : (["cooperation"] as JourneySection[]);
    const currentSection = getJourneySection(step);
    const hasConfirmedServices = currentSection !== "services" && selectedServices.length > 0;
    return sections.map((section) => ({
      section,
      label: flow === "monthly"
        ? section === "services"
          ? "每月項目"
          : section === "specifications"
          ? "數量與規格"
          : section === "source"
          ? "加購需求"
          : section === "result"
          ? "試算結果"
          : journeySectionLabels[section]
        : journeySectionLabels[section],
      available: journeyTimeline.some((entry) => getJourneySection(entry.step) === section),
      current: section === currentSection,
      skipped: section === "printing" && flow === "single" && hasConfirmedServices && selectedPrintServices.length === 0,
    }));
  }, [answers.projectType, journeyFlow, journeyTimeline, selectedPrintServices.length, selectedServices.length, step]);

  const progress = (() => {
    if (step === "result") return 100;
    if (answers.projectType === "monthly") {
      const monthlyProgress: Partial<Record<Step, number>> = {
        projectType: 0,
        monthlyServices: 28,
        monthlySpecifications: 58,
        sourceFile: 80,
        monthlyCadence: 92,
      };
      return monthlyProgress[step] ?? 40;
    }
    const singleProgress: Partial<Record<Step, number>> = {
      projectType: 0,
      category: 18,
      quantity: 30,
      sourceFile: 78,
      printProduction: 90,
    };
    if (step === "ecommerceDetails") {
      const index = answers.ecommerceDetailIndex ?? 0;
      return 35 + Math.round((index / Math.max(1, selectedEcommerceServices.length)) * 10);
    }
    if (step === "printDetails") {
      const index = answers.printDetailIndex ?? 0;
      return 48 + Math.round((index / Math.max(1, selectedDetailedPrintServices.length)) * 10);
    }
    if (step === "serviceDetails") {
      const index = answers.serviceDetailIndex ?? 0;
      return 60 + Math.round((index / Math.max(1, selectedServiceDetailServices.length)) * 8);
    }
    if (step === "printProduction") return 84;
    return singleProgress[step] ?? 65;
  })();

  useEffect(() => {
    const longFormSteps = new Set<Step>(["ecommerceDetails", "printDetails", "serviceDetails", "printProduction", "monthlyServices", "monthlySpecifications"]);
    const frame = requestAnimationFrame(() => {
      const chatBody = chatBodyRef.current;
      if (!chatBody) return;
      const target = longFormSteps.has(step) ? currentQuestionRef.current : chatEndRef.current;
      if (!target) return;
      const chatRect = chatBody.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const inset = 10;
      const isVisible = targetRect.top >= chatRect.top + inset && targetRect.bottom <= chatRect.bottom - inset;
      if (isVisible) return;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetTop = longFormSteps.has(step)
        ? chatBody.scrollTop + targetRect.top - chatRect.top - inset
        : chatBody.scrollTop + targetRect.bottom - chatRect.bottom + inset;
      chatBody.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, step]);

  useEffect(() => {
    const list = journeyNavListRef.current;
    const currentStep = list?.querySelector<HTMLButtonElement>(".journey-nav-button.is-current");
    if (!list || !currentStep) return;
    const centeredLeft = currentStep.offsetLeft - (list.clientWidth - currentStep.offsetWidth) / 2;
    list.scrollTo({
      left: Math.max(0, centeredLeft),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [journeySteps]);

  function runStepTransition(direction: "forward" | "back", update: () => void) {
    if (stepTransitionLockedRef.current) return;
    setTransitionDirection(direction);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update();
      return;
    }
    stepTransitionLockedRef.current = true;
    setIsStepExiting(true);
    const exitDuration = direction === "forward" ? 100 : 260;
    stepTransitionTimerRef.current = window.setTimeout(() => {
      update();
      setIsStepExiting(false);
      stepTransitionLockedRef.current = false;
      stepTransitionTimerRef.current = undefined;
    }, exitDuration);
  }

  function move(next: Step, patch: Partial<Answers>, userText: string, options?: { instant?: boolean }) {
    const selectedProjectType = patch.projectType ?? answers.projectType;
    const currentSnapshot: HistoryEntry = { step, answers: { ...answers }, messages: [...messages] };
    const currentSection = getJourneySection(step);
    const nextSection = getJourneySection(next);
    const patchedAnswers = { ...answers, ...patch };
    const nextAnswers = nextSection === "specifications"
      ? restoreRememberedSpecifications(patchedAnswers, journeySnapshots.specifications?.answers)
      : patchedAnswers;
    const nextMessages: Message[] = [
      ...messages,
      { speaker: "studio", text: getQuestion(step, answers) },
      { speaker: "user", text: userText },
    ];
    const destinationSnapshot: HistoryEntry = { step: next, answers: nextAnswers, messages: nextMessages };
    const applyMove = () => {
      if (step === "projectType" && selectedProjectType) setJourneyFlow(selectedProjectType);
      setJourneyTimeline((current) => {
        const updated = current.length > 0
          ? current.slice(0, journeyPosition + 1)
          : [currentSnapshot];
        updated[journeyPosition] = currentSnapshot;
        updated.push(destinationSnapshot);
        return updated;
      });
      setJourneyPosition(journeyPosition + 1);
      setJourneySnapshots((current) => {
        if (step === "projectType" && selectedProjectType) {
          return {
            cooperation: { ...currentSnapshot, answers: nextAnswers },
            [nextSection]: destinationSnapshot,
          };
        }
        const updated = { ...current };
        if (currentSection === nextSection) {
          if (!updated[currentSection]) updated[currentSection] = currentSnapshot;
        } else {
          const sectionStart = updated[currentSection] ?? currentSnapshot;
          updated[currentSection] = { ...sectionStart, answers: nextAnswers };
          if (!updated[nextSection]) updated[nextSection] = destinationSnapshot;
        }
        return updated;
      });
      setMessages(nextMessages);
      setAnswers(nextAnswers);
      setStep(next);
      setInputValue("");
      setEcommerceDetailErrors([]);
      setPrintDetailErrors([]);
      setServiceDetailErrors([]);
    };
    if (options?.instant) applyMove();
    else runStepTransition("forward", applyMove);
  }

  function goBack() {
    const previous = journeyTimeline[journeyPosition - 1];
    if (!previous) return;
    const currentSnapshot: HistoryEntry = { step, answers: { ...answers }, messages: [...messages] };
    runStepTransition("back", () => {
      setJourneyTimeline((current) => {
        const updated = [...current];
        updated[journeyPosition] = currentSnapshot;
        return updated;
      });
      setJourneySnapshots((current) => {
        const currentSection = getJourneySection(step);
        const rememberedAnswers = currentSection === "specifications"
          ? restoreRememberedSpecifications(currentSnapshot.answers, current[currentSection]?.answers)
          : currentSnapshot.answers;
        return {
          ...current,
          [currentSection]: { ...currentSnapshot, answers: rememberedAnswers },
        };
      });
      setStep(previous.step);
      setAnswers(previous.answers);
      setMessages(previous.messages);
      setJourneyPosition(journeyPosition - 1);
      setInputValue("");
      setEcommerceDetailErrors([]);
      setPrintDetailErrors([]);
      setServiceDetailErrors([]);
    });
  }

  function switchSpecificationService(serviceId: string) {
    const ecommerceIndex = selectedEcommerceServices.findIndex((service) => service.id === serviceId);
    const printIndex = selectedDetailedPrintServices.findIndex((service) => service.id === serviceId);
    const serviceIndex = selectedServiceDetailServices.findIndex((service) => service.id === serviceId);
    let targetStep: Step | undefined;
    let nextAnswers = answers;

    if (ecommerceIndex >= 0) {
      targetStep = "ecommerceDetails";
      nextAnswers = { ...answers, ecommerceDetailIndex: ecommerceIndex };
    } else if (printIndex >= 0) {
      targetStep = "printDetails";
      nextAnswers = { ...answers, printDetailIndex: printIndex };
    } else if (serviceIndex >= 0) {
      targetStep = "serviceDetails";
      nextAnswers = { ...answers, serviceDetailIndex: serviceIndex };
    }

    if (!targetStep) return;
    runStepTransition("forward", () => {
      setAnswers(nextAnswers);
      setStep(targetStep);
      setEcommerceDetailErrors([]);
      setPrintDetailErrors([]);
      setServiceDetailErrors([]);
    });
  }

  function isSpecificationServiceComplete(service: Service) {
    return confirmedSingleServiceIds.includes(service.id) && isSpecificationCompleteForAnswers(answers, service);
  }

  function getNextSingleSpecificationDestination(
    currentServiceId: string,
    nextAnswers: Answers = answers,
    confirmedIds: string[] = confirmedSingleServiceIds,
  ) {
    const selected = getSelectedSpecificationServices(nextAnswers);
    const currentIndex = selected.findIndex((service) => service.id === currentServiceId);
    const candidates = currentIndex >= 0
      ? [...selected.slice(currentIndex + 1), ...selected.slice(0, currentIndex)]
      : selected;
    const target = candidates.find((service) => !confirmedIds.includes(service.id));
    return getSpecificationDestination(nextAnswers, target);
  }

  function advanceSingleSpecification(
    currentServiceId: string,
    destination: SpecificationDestination,
    patch: Partial<Answers>,
    userText: string,
  ) {
    const nextConfirmedIds = Array.from(new Set([...confirmedSingleServiceIds, currentServiceId]));
    const applyDestination = () => {
      setConfirmedSingleServiceIds(nextConfirmedIds);
      move(destination.step, { ...destination.patch, ...patch }, userText, { instant: true });
      setIsSingleSpecificationAdvancing(false);
      singleSpecificationTimerRef.current = undefined;
      window.requestAnimationFrame(() => currentQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyDestination();
      return;
    }
    setConfirmedSingleServiceIds(nextConfirmedIds);
    setIsSingleSpecificationAdvancing(true);
    singleSpecificationTimerRef.current = window.setTimeout(applyDestination, 170);
  }

  function renderSpecificationServiceSwitcher(activeServiceId?: string) {
    if (answers.projectType !== "single" || specificationServices.length < 2) return null;
    const completedCount = specificationServices.filter(isSpecificationServiceComplete).length;
    return (
      <div className={`specification-switcher${activeServiceId ? "" : " is-result"}`}>
        <div>
          <strong>選擇要調整的服務項目</strong>
          <small>{completedCount}／{specificationServices.length} 項已完成</small>
        </div>
        <div
          className="specification-switcher-list"
          role="group"
          aria-label="選擇要調整的服務項目"
          ref={specificationSwitcherListRef}
          onPointerDown={startSpecificationSwitcherDrag}
          onPointerMove={moveSpecificationSwitcherDrag}
          onPointerUp={endSpecificationSwitcherDrag}
          onPointerCancel={cancelSpecificationSwitcherDrag}
          onClickCapture={(event) => {
            if (!specificationSwitcherDragRef.current.moved) return;
            event.preventDefault();
            event.stopPropagation();
            specificationSwitcherDragRef.current.moved = false;
          }}
        >
          {specificationServices.map((service) => {
            const isComplete = isSpecificationServiceComplete(service);
            return (
              <button
                className={`${service.id === activeServiceId ? "is-active" : ""}${isComplete ? " is-complete" : ""}`.trim() || undefined}
                type="button"
                key={service.id}
                aria-pressed={service.id === activeServiceId}
                onClick={() => switchSpecificationService(service.id)}
              >
                <span>{service.name}</span>
                <small>{isComplete ? "✓ 已完成" : "待填寫"}</small>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMonthlySpecificationServiceSwitcher(activeServiceId?: string) {
    if (answers.projectType !== "monthly" || selectedServices.length < 2) return null;
    return (
      <div className="specification-switcher">
        <div>
          <strong>選擇要調整的服務項目</strong>
          <small>{monthlyCompletedSpecificationCount}／{selectedServices.length} 項已完成</small>
        </div>
        <div
          className="specification-switcher-list"
          role="group"
          aria-label="選擇要調整的月方案服務項目"
          ref={specificationSwitcherListRef}
          onPointerDown={startSpecificationSwitcherDrag}
          onPointerMove={moveSpecificationSwitcherDrag}
          onPointerUp={endSpecificationSwitcherDrag}
          onPointerCancel={cancelSpecificationSwitcherDrag}
          onClickCapture={(event) => {
            if (!specificationSwitcherDragRef.current.moved) return;
            event.preventDefault();
            event.stopPropagation();
            specificationSwitcherDragRef.current.moved = false;
          }}
        >
          {selectedServices.map((service) => {
            const isComplete = isMonthlySpecificationServiceComplete(service);
            return (
              <button
                className={`${service.id === activeServiceId ? "is-active" : ""}${isComplete ? " is-complete" : ""}`.trim() || undefined}
                type="button"
                key={service.id}
                aria-pressed={service.id === activeServiceId}
                onClick={() => setActiveMonthlySpecificationServiceId(service.id)}
              >
                <span>{service.name}</span>
                <small>{isComplete ? "✓ 已完成" : "待填寫"}</small>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function advanceMonthlySpecification() {
    if (!activeMonthlySpecificationService || isMonthlySpecificationAdvancing) return;
    const isLastService = activeMonthlySpecificationIndex === selectedServices.length - 1;
    if (isLastService) {
      confirmMonthlyServices();
      return;
    }
    const showNextService = () => {
      setActiveMonthlySpecificationServiceId(selectedServices[activeMonthlySpecificationIndex + 1]?.id);
      setIsMonthlySpecificationAdvancing(false);
      monthlySpecificationTimerRef.current = undefined;
      window.requestAnimationFrame(() => currentQuestionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showNextService();
      return;
    }
    setIsMonthlySpecificationAdvancing(true);
    monthlySpecificationTimerRef.current = window.setTimeout(showNextService, 170);
  }

  function renderSharedScheduleNote(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    const excludesPrintingTime = service?.category === "print";
    return (
      <div className="shared-schedule-note" role="note">
        <span>此項服務排程</span>
        <strong>{getServiceTimelineSummary(serviceId)}{excludesPrintingTime ? "（不含印刷時間）" : ""}</strong>
        <small>實際時間視當時排程及設計複雜程度而定</small>
      </div>
    );
  }

  function jumpToJourneySection(section: JourneySection) {
    const targetTimelineIndex = journeyTimeline.findIndex((entry) => getJourneySection(entry.step) === section);
    const target = journeySnapshots[section] ?? journeyTimeline[targetTimelineIndex];
    if (!target || targetTimelineIndex < 0 || section === getJourneySection(step)) return;
    const direction = targetTimelineIndex < journeyPosition ? "back" : "forward";
    const currentSnapshot: HistoryEntry = { step, answers: { ...answers }, messages: [...messages] };
    const currentSection = getJourneySection(step);
    const firstSelectedCategory = services.find((service) => target.answers.serviceIds.includes(service.id))?.category;
    runStepTransition(direction, () => {
      setJourneySnapshots((current) => {
        const sectionStart = current[currentSection]
          ?? journeyTimeline.find((entry) => getJourneySection(entry.step) === currentSection)
          ?? currentSnapshot;
        const rememberedAnswers = currentSection === "specifications"
          ? restoreRememberedSpecifications(currentSnapshot.answers, sectionStart.answers)
          : currentSnapshot.answers;
        return {
          ...current,
          [currentSection]: { ...sectionStart, answers: rememberedAnswers },
        };
      });
      setJourneyTimeline((current) => {
        const updated = [...current];
        updated[journeyPosition] = currentSnapshot;
        return updated;
      });
      setJourneyPosition(targetTimelineIndex);
      setStep(target.step);
      setAnswers(target.answers);
      setMessages(target.messages);
      setInputValue("");
      setEcommerceDetailErrors([]);
      setPrintDetailErrors([]);
      setServiceDetailErrors([]);
      setExpandedServiceCategory(
        firstSelectedCategory === "ecommerce" || firstSelectedCategory === "print" || firstSelectedCategory === "other"
          ? firstSelectedCategory
          : null,
      );
    });
  }

  function startJourneyDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const list = journeyNavListRef.current;
    if (!list) return;
    journeyDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: list.scrollLeft,
      moved: false,
    };
  }

  function moveJourneyDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = journeyNavListRef.current;
    const drag = journeyDragRef.current;
    if (!list || !drag.active || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      list.setPointerCapture(event.pointerId);
    }
    list.classList.add("is-dragging");
    list.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  }

  function endJourneyDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = journeyNavListRef.current;
    const drag = journeyDragRef.current;
    if (!list || !drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId);
    list.classList.remove("is-dragging");
    if (drag.moved) window.setTimeout(() => { journeyDragRef.current.moved = false; }, 0);
  }

  function cancelJourneyDrag(event: ReactPointerEvent<HTMLDivElement>) {
    endJourneyDrag(event);
    journeyDragRef.current.moved = false;
  }

  function startSpecificationSwitcherDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const list = specificationSwitcherListRef.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    specificationSwitcherDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: list.scrollLeft,
      moved: false,
    };
  }

  function moveSpecificationSwitcherDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = specificationSwitcherListRef.current;
    const drag = specificationSwitcherDragRef.current;
    if (!list || !drag.active || drag.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(distance) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      list.setPointerCapture(event.pointerId);
    }
    list.classList.add("is-dragging");
    list.scrollLeft = drag.scrollLeft - distance;
    event.preventDefault();
  }

  function endSpecificationSwitcherDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const list = specificationSwitcherListRef.current;
    const drag = specificationSwitcherDragRef.current;
    if (!list || !drag.active || drag.pointerId !== event.pointerId) return;
    drag.active = false;
    if (list.hasPointerCapture(event.pointerId)) list.releasePointerCapture(event.pointerId);
    list.classList.remove("is-dragging");
    if (drag.moved) window.setTimeout(() => { specificationSwitcherDragRef.current.moved = false; }, 0);
  }

  function cancelSpecificationSwitcherDrag(event: ReactPointerEvent<HTMLDivElement>) {
    endSpecificationSwitcherDrag(event);
    specificationSwitcherDragRef.current.moved = false;
  }

  function restart() {
    runStepTransition("back", () => {
      setStep("projectType");
      setIsMobileSummaryExpanded(false);
      setAnswers({ serviceIds: [], quantities: {}, ecommerceDesignDetails: {}, serviceDesignDetails: {}, sourceFileServiceIds: [], printDesignDetails: {}, printSpecifications: {}, monthlySourceFileQuantities: {} });
      setMessages([
        {
          speaker: "studio",
          text: "沒問題，我們重新估算一次。依照需求逐步選擇，就能重新整理預算範圍。",
        },
      ]);
      setJourneyTimeline([]);
      setJourneyPosition(0);
      setJourneyFlow(undefined);
      setJourneySnapshots({});
      setInputValue("");
      setEcommerceDetailErrors([]);
      setPrintDetailErrors([]);
      setServiceDetailErrors([]);
      setExpandedServiceCategory(null);
      setActiveMonthlySpecificationServiceId(undefined);
      setIsMonthlySpecificationAdvancing(false);
      setIsSingleSpecificationAdvancing(false);
      setConfirmedSingleServiceIds([]);
      setInquirySubmitState("idle");
      setInquirySubmitMessage("");
      setLineCopyState("idle");
    });
  }

  function toggleService(serviceId: string) {
    setConfirmedSingleServiceIds((current) => current.filter((id) => id !== serviceId));
    setAnswers((current) => {
      const isSelected = current.serviceIds.includes(serviceId);
      const serviceIds = isSelected
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId];
      const toggledService = services.find((service) => service.id === serviceId);
      const quantities = { ...current.quantities };
      if (isSelected) {
        delete quantities[serviceId];
      } else if (toggledService && (getSingleInlineQuantityConfig(toggledService) || requiresInitialQuantity(toggledService) || toggledService.id === "poster")) {
        quantities[serviceId] = 1;
      }
      const keepsDetailedPrintQuestions = serviceIds.some((id) => detailedPrintServiceIds.has(id));
      const printSpecifications = Object.fromEntries(
        Object.entries(current.printSpecifications).filter(([id]) => serviceIds.includes(id)),
      );
      const printDesignDetails = Object.fromEntries(
        Object.entries(current.printDesignDetails).filter(([id]) => serviceIds.includes(id) && detailedPrintServiceIds.has(id)),
      );
      const ecommerceDesignDetails = Object.fromEntries(
        Object.entries(current.ecommerceDesignDetails).filter(([id]) => serviceIds.includes(id)),
      );
      const serviceDesignDetails = Object.fromEntries(
        Object.entries(current.serviceDesignDetails).filter(([id]) => serviceIds.includes(id) && serviceDetailServiceIds.has(id)),
      );
      const socialPostCount = serviceIds.includes("social")
        ? Math.max(1, current.socialPostCount ?? 1)
        : undefined;
      const socialPostImageCounts = socialPostCount
        ? Array.from(
            { length: socialPostCount },
            (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[index] ?? 1)),
          )
        : undefined;
      if (socialPostImageCounts) quantities.social = socialPostImageCounts.reduce((sum, count) => sum + count, 0);
      const productFrameQuantity = serviceIds.includes("product-frame")
        ? Math.max(1, quantities["product-frame"] ?? 1)
        : 0;
      const productFrameProductCounts = productFrameQuantity
        ? Array.from(
            { length: productFrameQuantity },
            (_, index) => Math.max(1, current.productFrameProductCounts?.[index] ?? 1),
          )
        : undefined;
      return {
        ...current,
        category: getSelectedServiceCategory(serviceIds),
        serviceIds,
        quantities,
        socialPostCount,
        socialPostImageCounts,
        productFrameProductCounts,
        ecommerceDesignDetails,
        ecommerceDetailIndex: undefined,
        serviceDesignDetails,
        serviceDetailIndex: undefined,
        printDesignDetails,
        printDetailIndex: undefined,
        printSpecifications,
        sourceFileIndex: undefined,
        sourceFileServiceIds: current.sourceFileServiceIds.filter((id) => serviceIds.includes(id)),
        ...(!serviceIds.some((id) => ecommerceDetailServiceIds.has(id)) ? { ecommerceDesignDetails: {} } : {}),
        ...(!keepsDetailedPrintQuestions ? { printDesignDetails: {} } : {}),
      };
    });
  }

  function adjustSingleServiceQuantity(serviceId: string, change: -1 | 1) {
    setConfirmedSingleServiceIds((current) => current.filter((id) => id !== serviceId));
    setAnswers((current) => {
      const service = services.find((item) => item.id === serviceId);
      const config = service ? getSingleInlineQuantityConfig(service) : undefined;
      if (!service || !config || !current.serviceIds.includes(serviceId)) return current;

      if (serviceId === "social") {
        const currentPostCount = Math.max(1, current.socialPostCount ?? 1);
        if (change < 0 && currentPostCount <= 1) return current;
        if (change > 0 && currentPostCount >= config.maximum) return current;
        const currentImageCounts = Array.from(
          { length: currentPostCount },
          (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[index] ?? 1)),
        );
        const socialPostImageCounts = change > 0 ? [...currentImageCounts, 1] : currentImageCounts.slice(0, -1);
        const socialPostCount = socialPostImageCounts.length;
        return {
          ...current,
          socialPostCount,
          socialPostImageCounts,
          quantities: {
            ...current.quantities,
            social: socialPostImageCounts.reduce((sum, count) => sum + count, 0),
          },
        };
      }

      const currentQuantity = Math.max(1, current.quantities[serviceId] ?? 1);
      if (change < 0 && currentQuantity <= 1) return current;
      if (change > 0 && currentQuantity >= config.maximum) return current;
      const nextQuantity = Math.min(config.maximum, Math.max(1, currentQuantity + change));
      const quantities = { ...current.quantities, [serviceId]: nextQuantity };
      const productFrameProductCounts = serviceId === "product-frame"
        ? Array.from(
            { length: nextQuantity },
            (_, index) => Math.max(1, current.productFrameProductCounts?.[index] ?? 1),
          )
        : current.productFrameProductCounts;
      const serviceDesignDetails = serviceId === "poster"
        ? {
            ...current.serviceDesignDetails,
            poster: {
              ...current.serviceDesignDetails.poster,
              seriesArtwork: nextQuantity > 1 ? "yes" as const : "none" as const,
            },
          }
        : current.serviceDesignDetails;
      return { ...current, quantities, productFrameProductCounts, serviceDesignDetails };
    });
  }

  function setSingleServiceQuantity(serviceId: string, rawValue: string) {
    setConfirmedSingleServiceIds((current) => current.filter((id) => id !== serviceId));
    setAnswers((current) => {
      const service = services.find((item) => item.id === serviceId);
      const config = service ? getSingleInlineQuantityConfig(service) : undefined;
      if (!service || !config?.customInput || !current.serviceIds.includes(serviceId)) return current;
      const parsedValue = parseOptionalPositiveInteger(rawValue);
      const quantities = { ...current.quantities };
      if (parsedValue) quantities[serviceId] = Math.min(config.maximum, parsedValue);
      else delete quantities[serviceId];
      return { ...current, quantities };
    });
  }

  function toggleMonthlyService(serviceId: string) {
    setAnswers((current) => {
      const service = services.find((item) => item.id === serviceId);
      if (!service || service.category === "other") return current;

      const isSelected = current.serviceIds.includes(serviceId);
      const serviceIds = isSelected
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId];
      const quantities = { ...current.quantities };
      const ecommerceDesignDetails = { ...current.ecommerceDesignDetails };
      const serviceDesignDetails = { ...current.serviceDesignDetails };
      const monthlyServiceDesignDetails = { ...(current.monthlyServiceDesignDetails ?? {}) };
      const printDesignDetails = { ...current.printDesignDetails };
      const monthlyPrintDesignDetails = { ...(current.monthlyPrintDesignDetails ?? {}) };
      const printSpecifications = { ...current.printSpecifications };

      if (isSelected) {
        delete quantities[serviceId];
        delete ecommerceDesignDetails[serviceId];
        delete serviceDesignDetails[serviceId];
        delete monthlyServiceDesignDetails[serviceId];
        delete printDesignDetails[serviceId];
        delete monthlyPrintDesignDetails[serviceId];
        delete printSpecifications[serviceId];
      } else {
        quantities[serviceId] = Math.max(1, current.quantities[serviceId] ?? 1);
        if (serviceId === "banner" && ecommerceDesignDetails.banner?.bannerExtensionCount === undefined) {
          ecommerceDesignDetails.banner = {
            ...ecommerceDesignDetails.banner,
            bannerExtensionCount: 0,
          };
        }
      }

      const socialPostCount = serviceIds.includes("social")
        ? Math.max(1, current.socialPostCount ?? quantities.social ?? 1)
        : undefined;
      const socialPostImageCounts = socialPostCount
        ? Array.from(
            { length: socialPostCount },
            (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[index] ?? 1)),
          )
        : undefined;
      if (socialPostCount) quantities.social = socialPostCount;

      const productFrameQuantity = serviceIds.includes("product-frame")
        ? Math.max(1, quantities["product-frame"] ?? 1)
        : 0;
      const productFrameProductCounts = productFrameQuantity
        ? Array.from(
            { length: productFrameQuantity },
            (_, index) => Math.max(1, current.productFrameProductCounts?.[index] ?? 1),
          )
        : undefined;

      return {
        ...current,
        category: getSelectedServiceCategory(serviceIds),
        serviceIds,
        quantities,
        socialPostCount,
        socialPostImageCounts,
        productFrameProductCounts,
        ecommerceDesignDetails,
        serviceDesignDetails,
        monthlyServiceDesignDetails,
        printDesignDetails,
        monthlyPrintDesignDetails,
        printSpecifications,
        sourceFileServiceIds: current.sourceFileServiceIds.filter((id) => serviceIds.includes(id)),
        monthlySourceFileQuantities: Object.fromEntries(
          Object.entries(current.monthlySourceFileQuantities).filter(([id]) => serviceIds.includes(id)),
        ),
        monthlyGroupCount: undefined,
        monthlyPlanId: undefined,
      };
    });
  }

  function adjustMonthlyServiceQuantity(serviceId: string, change: -1 | 1) {
    setAnswers((current) => {
      const service = services.find((item) => item.id === serviceId);
      if (!service || service.category === "other") return current;
      const currentQuantity = Math.max(0, current.quantities[serviceId] ?? 0);
      const maximum = service.id === "banner" ? BANNER_MAIN_VISUAL_LIMIT : service.category === "print" ? 2 : 10;
      if (change < 0 && currentQuantity <= 1) return current;
      if (change > 0 && currentQuantity >= maximum) return current;

      if (serviceId === "social") {
        const currentPostCount = Math.max(0, current.socialPostCount ?? 0);
        const currentImageCounts = Array.from(
          { length: currentPostCount },
          (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[index] ?? 1)),
        );
        const nextImageCounts = change > 0 ? [...currentImageCounts, 1] : currentImageCounts.slice(0, -1);
        const nextPostCount = nextImageCounts.length;
        const quantities = { ...current.quantities };
        if (nextPostCount > 0) quantities.social = nextPostCount;
        else delete quantities.social;
        const serviceIds = nextPostCount > 0
          ? Array.from(new Set([...current.serviceIds, serviceId]))
          : current.serviceIds.filter((id) => id !== serviceId);
        return {
          ...current,
          serviceIds,
          quantities,
          socialPostCount: nextPostCount || undefined,
          socialPostImageCounts: nextPostCount ? nextImageCounts : undefined,
          monthlyGroupCount: undefined,
          monthlyPlanId: undefined,
        };
      }

      if (serviceId === "product-frame") {
        const currentProductCounts = Array.from(
          { length: currentQuantity },
          (_, index) => Math.max(1, current.productFrameProductCounts?.[index] ?? 1),
        );
        const nextProductCounts = change > 0 ? [...currentProductCounts, 1] : currentProductCounts.slice(0, -1);
        const nextQuantity = nextProductCounts.length;
        const quantities = { ...current.quantities };
        if (nextQuantity > 0) quantities[serviceId] = nextQuantity;
        else delete quantities[serviceId];
        const serviceIds = nextQuantity > 0
          ? Array.from(new Set([...current.serviceIds, serviceId]))
          : current.serviceIds.filter((id) => id !== serviceId);
        return {
          ...current,
          serviceIds,
          quantities,
          productFrameProductCounts: nextQuantity ? nextProductCounts : undefined,
          monthlyGroupCount: undefined,
          monthlyPlanId: undefined,
        };
      }

      const nextQuantity = change > 0
        ? Math.min(maximum, currentQuantity + 1)
        : Math.max(1, currentQuantity - 1);
      if (nextQuantity === currentQuantity) return current;
      const quantities = { ...current.quantities };
      if (nextQuantity > 0) quantities[serviceId] = nextQuantity;
      else delete quantities[serviceId];
      const serviceIds = nextQuantity > 0
        ? Array.from(new Set([...current.serviceIds, serviceId]))
        : current.serviceIds.filter((id) => id !== serviceId);
      const serviceDesignDetails = { ...current.serviceDesignDetails };
      if (nextQuantity === 0 && serviceId === "card") delete serviceDesignDetails.card;
      if (serviceId === "poster") {
        serviceDesignDetails.poster = {
          ...serviceDesignDetails.poster,
          seriesArtwork: nextQuantity > 1 ? "yes" : "none",
        };
      }
      const monthlyServiceDesignDetails = { ...current.monthlyServiceDesignDetails };
      if (nextQuantity === 0 && serviceId === "card") delete monthlyServiceDesignDetails.card;
      const printDesignDetails = { ...current.printDesignDetails };
      if (nextQuantity === 0 && (serviceId === "dm" || serviceId === "menu")) delete printDesignDetails[serviceId];
      const monthlyPrintDesignDetails = { ...current.monthlyPrintDesignDetails };
      if (nextQuantity === 0 && (serviceId === "dm" || serviceId === "menu")) delete monthlyPrintDesignDetails[serviceId];
      const ecommerceDesignDetails = { ...current.ecommerceDesignDetails };
      if (nextQuantity === 0 && serviceId === "banner") delete ecommerceDesignDetails.banner;
      if (nextQuantity > 0 && serviceId === "banner" && ecommerceDesignDetails.banner?.bannerExtensionCount === undefined) {
        ecommerceDesignDetails.banner = {
          ...ecommerceDesignDetails.banner,
          bannerExtensionCount: 0,
        };
      }
      return {
        ...current,
        serviceIds,
        quantities,
        serviceDesignDetails,
        monthlyServiceDesignDetails,
        printDesignDetails,
        monthlyPrintDesignDetails,
        ecommerceDesignDetails,
        monthlyGroupCount: undefined,
        monthlyPlanId: undefined,
      };
    });
  }

  function toggleMonthlySourceFile(serviceId: string) {
    setAnswers((current) => {
      const maximum = Math.max(0, current.quantities[serviceId] ?? 0);
      if (maximum < 1) return current;
      const monthlySourceFileQuantities = { ...current.monthlySourceFileQuantities };
      if ((monthlySourceFileQuantities[serviceId] ?? 0) > 0) delete monthlySourceFileQuantities[serviceId];
      else monthlySourceFileQuantities[serviceId] = 1;
      return { ...current, monthlySourceFileQuantities };
    });
  }

  function adjustMonthlySocialImageCount(index: number, change: -1 | 1) {
    setAnswers((current) => {
      const postCount = Math.max(0, current.socialPostCount ?? 0);
      if (postCount === 0 || index < 0 || index >= postCount) return current;
      const imageCounts = Array.from(
        { length: postCount },
        (_, itemIndex) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[itemIndex] ?? 1)),
      );
      const currentCount = imageCounts[index];
      if (change < 0 && currentCount <= 1) return current;
      imageCounts[index] = Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, currentCount + change));
      return { ...current, socialPostImageCounts: imageCounts };
    });
  }

  function updateMonthlyBannerExtensionCount(rawValue: string) {
    setAnswers((current) => ({
      ...current,
      ecommerceDesignDetails: {
        ...current.ecommerceDesignDetails,
        banner: {
          ...current.ecommerceDesignDetails.banner,
          bannerExtensionCount: rawValue === "" ? undefined : Math.max(0, Math.round(Number(rawValue))),
        },
      },
    }));
  }

  function updateMonthlyEcommerceDetail(serviceId: string, patch: Partial<EcommerceDesignDetail>) {
    setAnswers((current) => ({
      ...current,
      ecommerceDesignDetails: {
        ...current.ecommerceDesignDetails,
        [serviceId]: {
          ...current.ecommerceDesignDetails[serviceId],
          ...patch,
        },
      },
    }));
  }

  function updateMonthlyPosterDetail(patch: Partial<ServiceDesignDetail>) {
    setAnswers((current) => ({
      ...current,
      serviceDesignDetails: {
        ...current.serviceDesignDetails,
        poster: {
          ...current.serviceDesignDetails.poster,
          ...patch,
        },
      },
    }));
  }

  function updateMonthlyPosterSeriesArtwork(value: "none" | "yes") {
    setAnswers((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        poster: value === "yes" ? 2 : 1,
      },
      serviceDesignDetails: {
        ...current.serviceDesignDetails,
        poster: {
          ...current.serviceDesignDetails.poster,
          seriesArtwork: value,
        },
      },
      monthlyGroupCount: undefined,
      monthlyPlanId: undefined,
    }));
  }

  function adjustMonthlyProductFrameProductCount(index: number, change: -1 | 1) {
    setAnswers((current) => {
      const frameCount = Math.max(0, current.quantities["product-frame"] ?? 0);
      if (frameCount === 0 || index < 0 || index >= frameCount) return current;
      const productFrameProductCounts: Array<number | undefined> = Array.from(
        { length: frameCount },
        (_, itemIndex) => Math.max(1, current.productFrameProductCounts?.[itemIndex] ?? 1),
      );
      const currentCount = productFrameProductCounts[index] ?? 1;
      if (change < 0 && currentCount <= 1) return current;
      productFrameProductCounts[index] = Math.min(99, Math.max(1, currentCount + change));
      return { ...current, productFrameProductCounts };
    });
  }

  function updateMonthlyCardSide(index: number, specification: "single" | "double") {
    setAnswers((current) => {
      const quantity = Math.max(0, current.quantities.card ?? 0);
      if (index < 0 || index >= quantity) return current;
      const details = getMonthlyCardDetails(current, quantity);
      details[index] = { ...details[index], specification };
      return {
        ...current,
        monthlyServiceDesignDetails: {
          ...current.monthlyServiceDesignDetails,
          card: details,
        },
      };
    });
  }

  function updateMonthlyCardDetail(index: number, patch: Partial<ServiceDesignDetail>) {
    setAnswers((current) => {
      const quantity = Math.max(0, current.quantities.card ?? 0);
      if (index < 0 || index >= quantity) return current;
      const details = getMonthlyCardDetails(current, quantity);
      details[index] = { ...details[index], ...patch };
      return {
        ...current,
        monthlyServiceDesignDetails: {
          ...current.monthlyServiceDesignDetails,
          card: details,
        },
      };
    });
  }

  function updateMonthlyPrintDetail(serviceId: "dm" | "menu", index: number, patch: Partial<PrintDesignDetail>) {
    setAnswers((current) => {
      const quantity = Math.max(0, current.quantities[serviceId] ?? 0);
      if (index < 0 || index >= quantity) return current;
      const details = getMonthlyPrintDetails(current, serviceId, quantity);
      details[index] = { ...details[index], ...patch };
      return {
        ...current,
        monthlyPrintDesignDetails: {
          ...current.monthlyPrintDesignDetails,
          [serviceId]: details,
        },
      };
    });
  }

  function selectMonthlyPrintPurpose(serviceId: "dm" | "menu", index: number, purpose: PrintPurpose) {
    updateMonthlyPrintDetail(serviceId, index, { purposes: [purpose] });
  }

  function applyMonthlyPrintCommonSettings(serviceId: "dm" | "menu", index: number) {
    updateMonthlyPrintDetail(serviceId, index, {
      format: "a4-portrait",
      structure: "single",
      pageCount: undefined,
      customPageCount: undefined,
      fold: undefined,
      contentStatus: "final",
      imageStatus: "ready",
      versionCount: undefined,
      complexity: "standard",
    });
  }

  function confirmMonthlyServiceSelection() {
    if (!monthlyRulesComplete) return;
    const firstSelectedService = selectedServices[0];
    setActiveMonthlySpecificationServiceId(firstSelectedService?.id);
    if (firstSelectedService && firstSelectedService.category !== "mixed") {
      setExpandedServiceCategory(firstSelectedService.category);
    }
    move(
      "monthlySpecifications",
      {},
      `已選 ${selectedServices.length} 項服務，接著確認數量與規格`,
    );
  }

  function confirmMonthlyServices() {
    if (!monthlySpecificationsComplete) return;
    const monthlyGroupCount = Math.round(monthlyAllocatedGroupCount);
    const matchedPlan = getMonthlyPlanForCount(monthlyGroupCount);
    if (!matchedPlan) return;
    move(
      "sourceFile",
      { monthlyGroupCount, monthlyPlanId: matchedPlan.id, monthlySourceFileQuantities: {} },
      `${matchedPlan.name}・${monthlyGroupCount} 組／月；本月服務：${selectedServices.map((item) => formatMonthlyServiceQuantity(item, answers.quantities[item.id] ?? 0, false, answers)).join("、")}`,
    );
  }

  function adjustMonthlySourceFileQuantity(serviceId: string, change: -1 | 1) {
    setAnswers((current) => {
      const maximum = Math.max(0, current.quantities[serviceId] ?? 0);
      if (maximum < 1) return current;
      const currentQuantity = Math.max(0, current.monthlySourceFileQuantities[serviceId] ?? 0);
      const nextQuantity = Math.min(maximum, Math.max(0, currentQuantity + change));
      if (nextQuantity === currentQuantity) return current;
      const monthlySourceFileQuantities = { ...current.monthlySourceFileQuantities };
      if (nextQuantity > 0) monthlySourceFileQuantities[serviceId] = nextQuantity;
      else delete monthlySourceFileQuantities[serviceId];
      return { ...current, monthlySourceFileQuantities };
    });
  }

  function confirmMonthlySourceFiles() {
    const selections = getMonthlySourceFileSelections(answers);
    const printSpecifications = Object.fromEntries(
      selectedPrintServices.map((service) => {
        const specification = answers.printSpecifications[service.id];
        return [service.id, specification?.support ? { ...specification, support: true } : { support: false } satisfies PrintSpecification];
      }),
    );
    const printNames = selectedPrintServices
      .filter((service) => printSpecifications[service.id]?.support)
      .map((service) => service.name);
    const summary = [
      selections.length > 0 ? `原始檔：${selections.map(({ service, quantity }) => `${service.name} ×${quantity}`).join("、")}` : "",
      printNames.length > 0 ? `代辦印刷：${printNames.join("、")}` : "",
    ].filter(Boolean).join("；");
    move(
      "monthlyCadence",
      { monthlySourceFileQuantities: selections.length > 0 ? answers.monthlySourceFileQuantities : {}, printSpecifications },
      summary || "不需要其他加購",
    );
  }

  function beginServiceQuestions() {
    const userText = selectedServices.map((item) => item.name).join("、");
    if (initialQuantityServices.length > 0) {
      move("quantity", {}, userText);
      return;
    }
    const nextService = specificationServices.find((service) => !confirmedSingleServiceIds.includes(service.id));
    const destination = getSpecificationDestination(answers, nextService);
    move(destination.step, destination.patch, userText);
  }

  function toggleSourceFile(serviceId: string) {
    setAnswers((current) => ({
      ...current,
      sourceFileServiceIds: current.sourceFileServiceIds.includes(serviceId)
        ? current.sourceFileServiceIds.filter((id) => id !== serviceId)
        : [...current.sourceFileServiceIds, serviceId],
    }));
  }

  function submitNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedValue = inputValue.replace(/,/g, "").trim();
    if (step === "versionCount" && activeDetailedService && !normalizedValue) {
      move("complexity", {
        printDesignDetails: {
          ...answers.printDesignDetails,
          [activeDetailedService.id]: {
            ...answers.printDesignDetails[activeDetailedService.id],
            versionCount: undefined,
          },
        },
      }, `${activeDetailedService.name}：無延伸版本`);
      return;
    }
    const value = Number(normalizedValue);
    if (!Number.isFinite(value) || value <= 0) return;

    if (step === "versionCount" && activeDetailedService) {
      const versionCount = Math.max(1, Math.round(value));
      move("complexity", {
        printDesignDetails: {
          ...answers.printDesignDetails,
          [activeDetailedService.id]: {
            ...answers.printDesignDetails[activeDetailedService.id],
            versionCount,
          },
        },
      }, `${activeDetailedService.name}：${versionCount} 個同版版本（只換文字或圖片，不重新排版或改尺寸）`);
    }
  }

  function updateActiveEcommerceDetail(patch: Partial<EcommerceDesignDetail>) {
    if (!activeEcommerceService) return;
    const updatedFields = new Set(Object.keys(patch));
    setEcommerceDetailErrors((current) => current.filter((field) => !updatedFields.has(field)));
    setAnswers((current) => ({
      ...current,
      ecommerceDesignDetails: {
        ...current.ecommerceDesignDetails,
        [activeEcommerceService.id]: {
          ...current.ecommerceDesignDetails[activeEcommerceService.id],
          ...patch,
        },
      },
    }));
  }

  function updateActiveEcommerceQuantity(rawValue: string) {
    if (!activeEcommerceService) return;
    setEcommerceDetailErrors((current) => current.filter((field) => field !== "quantity" && field !== "productCount"));
    setAnswers((current) => {
      const quantities = { ...current.quantities };
      if (rawValue) {
        const maximum = activeEcommerceService.id === "banner" ? BANNER_MAIN_VISUAL_LIMIT : 999;
        quantities[activeEcommerceService.id] = Math.min(maximum, Math.max(0, Math.round(Number(rawValue))));
      } else {
        delete quantities[activeEcommerceService.id];
      }
      if (activeEcommerceService.id !== "product-frame") return { ...current, quantities };
      const frameCount = quantities["product-frame"] ?? 0;
      const productFrameProductCounts = frameCount > 0
        ? Array.from({ length: frameCount }, (_, index) => current.productFrameProductCounts?.[index] ?? 1)
        : undefined;
      return { ...current, quantities, productFrameProductCounts };
    });
  }

  function updateSocialPostCount(rawValue: string) {
    setEcommerceDetailErrors((current) => current.filter((field) => field !== "quantity"));
    setAnswers((current) => {
      const socialPostCount = rawValue ? Math.min(50, Math.max(1, Math.round(Number(rawValue)))) : undefined;
      const socialPostImageCounts = socialPostCount
        ? Array.from({ length: socialPostCount }, (_, index) => Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, current.socialPostImageCounts?.[index] ?? 1)))
        : undefined;
      const quantities = { ...current.quantities };
      const totalImages = socialPostImageCounts?.reduce<number>((sum, count) => sum + (count ?? 0), 0) ?? 0;
      if (totalImages > 0) quantities.social = totalImages;
      else delete quantities.social;
      return { ...current, socialPostCount, socialPostImageCounts, quantities };
    });
  }

  function updateSocialPostImageCount(index: number, rawValue: string) {
    setEcommerceDetailErrors((current) => current.filter((field) => field !== "quantity"));
    setAnswers((current) => {
      const postCount = current.socialPostCount ?? 0;
      const socialPostImageCounts = Array.from({ length: postCount }, (_, itemIndex) => current.socialPostImageCounts?.[itemIndex]);
      socialPostImageCounts[index] = rawValue ? Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, Math.round(Number(rawValue)))) : undefined;
      const quantities = { ...current.quantities };
      const totalImages = socialPostImageCounts.reduce<number>((sum, count) => sum + (count ?? 1), 0);
      if (totalImages > 0) quantities.social = totalImages;
      else delete quantities.social;
      return { ...current, socialPostImageCounts, quantities };
    });
  }

  function updateProductFrameProductCount(index: number, rawValue: string) {
    setEcommerceDetailErrors((current) => current.filter((field) => field !== "quantity"));
    setAnswers((current) => {
      const frameCount = Math.max(0, current.quantities["product-frame"] ?? 0);
      const productFrameProductCounts: Array<number | undefined> = Array.from(
        { length: frameCount },
        (_, itemIndex) => current.productFrameProductCounts?.[itemIndex] ?? 1,
      );
      productFrameProductCounts[index] = rawValue ? Math.min(99, Math.max(1, Math.round(Number(rawValue)))) : undefined;
      return {
        ...current,
        productFrameProductCounts,
      };
    });
  }

  function applyCommonEcommerceSettings() {
    if (!activeEcommerceService) return;
    updateActiveEcommerceDetail({
      placement: getEcommercePlacementOptions(activeEcommerceService.id)[0]?.value,
      size: getEcommerceSizeOptions(activeEcommerceService.id)[0]?.value,
      copyStatus: "ready",
      assetStatus: "ready",
      visualLevel: "standard",
      timeline: "regular",
    });
  }

  function confirmEcommerceDetails() {
    if (!activeEcommerceService) return;
    const detail = answers.ecommerceDesignDetails[activeEcommerceService.id] ?? {};
    const missingFields = getMissingEcommerceDetailFields(activeEcommerceService, detail, answers);
    if (missingFields.length > 0) {
      setEcommerceDetailErrors(missingFields);
      requestAnimationFrame(() => {
        const firstInvalidField = ecommerceDetailsRef.current?.querySelector<HTMLElement>(`[data-field="${missingFields[0]}"]`);
        firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidField?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
      });
      return;
    }
    setEcommerceDetailErrors([]);
    const confirmedIds = Array.from(new Set([...confirmedSingleServiceIds, activeEcommerceService.id]));
    const destination = getNextSingleSpecificationDestination(activeEcommerceService.id, answers, confirmedIds);
    advanceSingleSpecification(activeEcommerceService.id, destination, {}, `${activeEcommerceService.name}規格已完成`);
  }

  function updateActivePrintDetail(patch: Partial<PrintDesignDetail>) {
    if (!activeDetailedService) return;
    const serviceId = activeDetailedService.id;
    const updatedFields = new Set(Object.keys(patch));
    if (updatedFields.has("structure")) updatedFields.add("pageCount");
    setPrintDetailErrors((current) => current.filter((field) => !updatedFields.has(field)));
    setAnswers((current) => {
      const quantities = { ...current.quantities };
      if (patch.structure) {
        const previousStructure = current.printDesignDetails[serviceId]?.structure;
        if (requiresManualPrintPageCount(patch.structure)) {
          if (previousStructure !== patch.structure) delete quantities[serviceId];
        } else {
          quantities[serviceId] = getAutomaticPrintPageCount(patch.structure);
        }
      }
      return {
        ...current,
        quantities,
        printDesignDetails: {
          ...current.printDesignDetails,
          [serviceId]: {
            ...current.printDesignDetails[serviceId],
            ...patch,
          },
        },
      };
    });
  }

  function updateActivePrintPageCount(rawValue: string) {
    if (!activeDetailedService) return;
    setPrintDetailErrors((current) => current.filter((field) => field !== "pageCount"));
    setAnswers((current) => {
      const quantities = { ...current.quantities };
      if (rawValue) {
        quantities[activeDetailedService.id] = Math.max(0, Math.round(Number(rawValue)));
      } else {
        delete quantities[activeDetailedService.id];
      }
      return { ...current, quantities };
    });
  }

  function applyCommonPrintSettings() {
    updateActivePrintDetail({
      format: "a4-portrait",
      structure: "single",
      customPageCount: undefined,
      fold: undefined,
      contentStatus: "final",
      imageStatus: "ready",
      versionCount: undefined,
      complexity: "standard",
      timeline: "regular",
    });
  }

  function copyPreviousPrintSettings() {
    const currentIndex = answers.printDetailIndex ?? 0;
    const previousService = selectedDetailedPrintServices[currentIndex - 1];
    if (!previousService) return;
    const previousDetail = answers.printDesignDetails[previousService.id] ?? {};
    const previousPageCount = Math.max(0, answers.quantities[previousService.id] ?? 0);
    updateActivePrintDetail({
      format: previousDetail.format,
      structure: previousDetail.structure,
      customPageCount: previousDetail.customPageCount,
      fold: previousDetail.fold,
      contentStatus: previousDetail.contentStatus,
      imageStatus: previousDetail.imageStatus,
      versionCount: previousDetail.versionCount,
      complexity: previousDetail.complexity,
      timeline: previousDetail.timeline,
      deadline: previousDetail.deadline,
    });
    if (requiresManualPrintPageCount(previousDetail.structure)) {
      updateActivePrintPageCount(previousPageCount > 0 ? String(previousPageCount) : "");
    }
  }

  function confirmPrintDetails() {
    if (!activeDetailedService) return;
    const detail = answers.printDesignDetails[activeDetailedService.id] ?? {};
    const storedPageCount = Math.max(0, answers.quantities[activeDetailedService.id] ?? 0);
    const missingFields = getMissingPrintDetailFields(activeDetailedService.id, detail, storedPageCount);
    if (missingFields.length > 0) {
      setPrintDetailErrors(missingFields);
      requestAnimationFrame(() => {
        const firstInvalidField = printDetailsRef.current?.querySelector<HTMLElement>(`[data-field="${missingFields[0]}"]`);
        firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidField?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
      });
      return;
    }
    setPrintDetailErrors([]);
    const acceptsPageCount = requiresManualPrintPageCount(detail.structure);
    const minimumPageCount = getMinimumPrintPageCount(activeDetailedService.id, detail.structure);
    const adjustedPageCount = acceptsPageCount
      ? Math.max(storedPageCount, minimumPageCount)
      : getAutomaticPrintPageCount(detail.structure);
    const nextAnswers = adjustedPageCount === storedPageCount
      ? answers
      : { ...answers, quantities: { ...answers.quantities, [activeDetailedService.id]: adjustedPageCount } };
    const confirmedIds = Array.from(new Set([...confirmedSingleServiceIds, activeDetailedService.id]));
    const destination = getNextSingleSpecificationDestination(activeDetailedService.id, nextAnswers, confirmedIds);
    advanceSingleSpecification(activeDetailedService.id, destination, {
      quantities: nextAnswers.quantities,
    }, `${activeDetailedService.name}規格已完成${acceptsPageCount && adjustedPageCount !== storedPageCount ? `，頁數調整為 ${adjustedPageCount} 頁` : ""}`);
  }

  function updateActiveServiceDetail(patch: Partial<ServiceDesignDetail>) {
    if (!activeServiceDetailService) return;
    const updatedFields = new Set(Object.keys(patch));
    setServiceDetailErrors((current) => current.filter((field) => !updatedFields.has(field)));
    setAnswers((current) => ({
      ...current,
      serviceDesignDetails: {
        ...current.serviceDesignDetails,
        [activeServiceDetailService.id]: {
          ...current.serviceDesignDetails[activeServiceDetailService.id],
          ...patch,
        },
      },
    }));
  }

  function updateActiveServiceQuantity(rawValue: string) {
    if (!activeServiceDetailService) return;
    setServiceDetailErrors((current) => current.filter((field) => field !== "quantity"));
    setAnswers((current) => {
      const quantities = { ...current.quantities };
      if (activeServiceDetailService.pricing === "card") {
        quantities[activeServiceDetailService.id] = (parseOptionalPositiveInteger(rawValue) ?? 0) + 1;
      } else if (rawValue) {
        const maximum = activeServiceDetailService.id === "photo" ? PHOTO_QUANTITY_LIMIT : 999;
        quantities[activeServiceDetailService.id] = Math.min(maximum, Math.max(0, Math.round(Number(rawValue))));
      } else {
        delete quantities[activeServiceDetailService.id];
      }
      return { ...current, quantities };
    });
  }

  function updatePosterSeriesArtwork(seriesArtwork: "none" | "yes") {
    setServiceDetailErrors((current) => current.filter((field) => field !== "seriesArtwork"));
    setAnswers((current) => ({
      ...current,
      quantities: {
        ...current.quantities,
        poster: seriesArtwork === "none" ? 1 : Math.max(1, current.quantities.poster ?? 1),
      },
      serviceDesignDetails: {
        ...current.serviceDesignDetails,
        poster: {
          ...current.serviceDesignDetails.poster,
          seriesArtwork,
        },
      },
    }));
  }

  function updatePosterSeriesCount(rawValue: string) {
    const seriesCount = Math.max(0, Math.round(Number(rawValue)));
    setServiceDetailErrors((current) => current.filter((field) => field !== "seriesArtwork"));
    setAnswers((current) => ({
      ...current,
      quantities: { ...current.quantities, poster: seriesCount + 1 },
    }));
  }

  function applyCommonServiceSettings() {
    if (!activeServiceDetailService) return;
    const config = getServiceDetailConfig(activeServiceDetailService.id);
    if (!config) return;
    updateActiveServiceDetail({
      purpose: config.purposeOptions[0]?.value,
      specification: config.specificationOptions[0]?.value,
      contentStatus: config.contentOptions[0]?.value,
      assetStatus: config.assetOptions[0]?.value,
      complexity: "standard",
      timeline: "regular",
    });
  }

  function confirmServiceDetails() {
    if (!activeServiceDetailService) return;
    const detail = answers.serviceDesignDetails[activeServiceDetailService.id] ?? {};
    const missingFields = getMissingServiceDetailFields(activeServiceDetailService, detail, answers);
    if (missingFields.length > 0) {
      setServiceDetailErrors(missingFields);
      requestAnimationFrame(() => {
        const firstInvalidField = serviceDetailsRef.current?.querySelector<HTMLElement>(`[data-field="${missingFields[0]}"]`);
        firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstInvalidField?.querySelector<HTMLElement>("input, select")?.focus({ preventScroll: true });
      });
      return;
    }
    setServiceDetailErrors([]);
    const confirmedIds = Array.from(new Set([...confirmedSingleServiceIds, activeServiceDetailService.id]));
    const destination = getNextSingleSpecificationDestination(activeServiceDetailService.id, answers, confirmedIds);
    advanceSingleSpecification(activeServiceDetailService.id, destination, {}, `${activeServiceDetailService.name}規格已完成`);
  }

  function togglePrintProduction(serviceId: string) {
    setAnswers((current) => ({
      ...current,
      printSpecifications: {
        ...current.printSpecifications,
        [serviceId]: current.printSpecifications[serviceId]?.support
          ? { support: false }
          : { ...current.printSpecifications[serviceId], support: true },
      },
    }));
  }

  function updatePrintProduction(serviceId: string, patch: Partial<PrintSpecification>) {
    setAnswers((current) => ({
      ...current,
      printSpecifications: {
        ...current.printSpecifications,
        [serviceId]: {
          ...current.printSpecifications[serviceId],
          support: true,
          ...patch,
        },
      },
    }));
  }

  function confirmPrintProduction() {
    const printSpecifications = Object.fromEntries(
      selectedPrintServices.map((service) => {
        const specification = answers.printSpecifications[service.id];
        return [service.id, specification?.support ? { ...specification, support: true } : { support: false } satisfies PrintSpecification];
      }),
    );
    const supportedNames = selectedPrintServices
      .filter((service) => printSpecifications[service.id]?.support)
      .map((service) => service.name);
    move("result", { printSpecifications }, supportedNames.length > 0 ? `${supportedNames.join("、")}需要代辦印刷` : "所有印刷品皆不需要代辦印刷");
  }

  function confirmSingleAddOns() {
    const printSpecifications = Object.fromEntries(
      selectedPrintServices.map((service) => {
        const specification = answers.printSpecifications[service.id];
        return [service.id, specification?.support ? { ...specification, support: true } : { support: false } satisfies PrintSpecification];
      }),
    );
    const sourceNames = selectedServices
      .filter((service) => answers.sourceFileServiceIds.includes(service.id))
      .map((service) => service.name);
    const printNames = selectedPrintServices
      .filter((service) => printSpecifications[service.id]?.support)
      .map((service) => service.name);
    const summary = [
      sourceNames.length > 0 ? `原始檔：${sourceNames.join("、")}` : "",
      printNames.length > 0 ? `代辦印刷：${printNames.join("、")}` : "",
    ].filter(Boolean).join("；");
    move("result", { printSpecifications }, summary || "不需要其他加購");
  }

  function selectPrintPurpose(value: PrintPurpose) {
    if (!activeDetailedService) return;
    setPrintDetailErrors((current) => current.filter((field) => field !== "purposes"));
    setAnswers((current) => ({
      ...current,
      printDesignDetails: {
        ...current.printDesignDetails,
        [activeDetailedService.id]: {
          ...current.printDesignDetails[activeDetailedService.id],
          purposes: [value],
        },
      },
    }));
  }

  function confirmPrintPurposes() {
    if (!activeDetailedService) return;
    const purposes = answers.printDesignDetails[activeDetailedService.id]?.purposes ?? [];
    if (purposes.length === 0) return;
    move("printFormat", {}, `${activeDetailedService.name}：${purposes.map((purpose) => printPurposeLabels[purpose]).join("、")}`);
  }

  function selectPrintFormat(value: PrintFormat, label: string) {
    if (!activeDetailedService) return;
    move("printStructure", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          format: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function selectPrintStructure(value: PrintStructure, label: string) {
    if (!activeDetailedService) return;
    const storedPageCount = Math.max(1, answers.quantities[activeDetailedService.id] ?? 1);
    const minimumPageCount = getMinimumPrintPageCount(activeDetailedService.id, value);
    const acceptsPageCount = requiresManualPrintPageCount(value);
    const adjustedPageCount = acceptsPageCount
      ? Math.max(storedPageCount, minimumPageCount)
      : getAutomaticPrintPageCount(value);
    move(value === "folded" ? "printFold" : "contentStatus", {
      quantities: adjustedPageCount === storedPageCount
        ? answers.quantities
        : { ...answers.quantities, [activeDetailedService.id]: adjustedPageCount },
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          structure: value,
          fold: undefined,
        },
      },
    }, `${activeDetailedService.name}：${label}${acceptsPageCount && adjustedPageCount !== storedPageCount ? `（頁數調整為 ${adjustedPageCount} 頁）` : ""}`);
  }

  function selectPrintFold(value: PrintFold, label: string) {
    if (!activeDetailedService) return;
    move("contentStatus", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          fold: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function selectContentStatus(value: ContentStatus, label: string) {
    if (!activeDetailedService) return;
    move("imageStatus", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          contentStatus: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function selectImageStatus(value: ImageStatus, label: string) {
    if (!activeDetailedService) return;
    move("versionCount", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          imageStatus: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function selectComplexity(value: Complexity, label: string) {
    if (!activeDetailedService) {
      move(nextAfterComplexity(answers), { complexity: value }, label);
      return;
    }
    move("timeline", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          complexity: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function selectMaterials(value: Materials) {
    move(answers.projectType === "monthly" ? "monthlyServices" : "timeline", { materials: value }, materialLabels[value]);
  }

  function selectTimeline(value: Timeline, label: string) {
    if (!activeDetailedService) {
      move(nextAfterTimeline(answers), { timeline: value }, label);
      return;
    }
    move("printDeadline", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          timeline: value,
        },
      },
    }, `${activeDetailedService.name}：${label}`);
  }

  function submitPrintDeadline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputValue) return;
    completePrintDeadline(inputValue);
  }

  function completePrintDeadline(deadline?: string) {
    if (!activeDetailedService) {
      move("sourceFile", { printDeadline: deadline }, deadline ? deadline.replaceAll("-", "/") : "尚未確定期限");
      return;
    }
    const currentIndex = answers.printDetailIndex ?? 0;
    const nextIndex = currentIndex + 1;
    const hasNextService = Boolean(selectedDetailedPrintServices[nextIndex]);
    move(hasNextService ? "printPurpose" : "sourceFile", {
      printDesignDetails: {
        ...answers.printDesignDetails,
        [activeDetailedService.id]: {
          ...answers.printDesignDetails[activeDetailedService.id],
          deadline,
        },
      },
      printDetailIndex: hasNextService ? nextIndex : undefined,
      sourceFileIndex: hasNextService ? undefined : 0,
    }, `${activeDetailedService.name}：${deadline ? deadline.replaceAll("-", "/") : "尚未確定期限"}`);
  }

  function submitQuantities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (initialQuantityServices.length === 0 || initialQuantityServices.some((item) => (answers.quantities[item.id] || 0) < 1)) return;
    const quantitySummary = initialQuantityServices
      .map((item) => formatServiceQuantity(item, answers.quantities[item.id], answers))
      .join("、");
    const destination = getFirstIncompleteSpecificationDestination(answers);
    move(destination.step, destination.patch, quantitySummary);
  }

  const summaryLines = useMemo(() => {
    const lines = ["【Sam Design Studio｜網站試算需求】"];
    if (answers.projectType === "monthly" && plan) {
      lines.push(`方案：${plan.name}`);
      if (answers.monthlyGroupCount) lines.push(`月量：${answers.monthlyGroupCount} 組`);
      if (answers.monthlyCadence) lines.push(`交付：${monthlyCadenceLabels[answers.monthlyCadence]}`);
      if (answers.materials) lines.push(`素材：${materialLabels[answers.materials]}`);
      if (selectedServices.length > 0) lines.push(`項目：${selectedServices.map((item) => formatMonthlyServiceQuantity(item, answers.quantities[item.id] ?? 0, false, answers)).join("、")}`);
      if (answers.serviceIds.includes("banner")) {
        const count = getBannerExtensionCount(answers);
        lines.push(`網站主視覺延伸加購：${count > 0 ? `${count} 張` : "不加購"}`);
      }
      selectedEcommerceServices.forEach((service) => {
        const detail = answers.ecommerceDesignDetails[service.id] ?? {};
        const placement = getEcommerceOptionLabel(getEcommercePlacementOptions(service.id), detail.placement);
        const size = getEcommerceOptionLabel(getEcommerceSizeOptions(service.id), detail.size);
        if (placement) lines.push(`${service.name}用途：${placement}`);
        if (size) lines.push(`${service.name}規格：版位 ${size}`);
        const content = [
          detail.copyStatus ? ecommerceCopyStatusLabels[detail.copyStatus] : undefined,
          detail.assetStatus ? `素材狀況 ${ecommerceAssetStatusLabels[detail.assetStatus]}` : undefined,
          detail.versionCount ? formatExtensionSummary(detail.versionCount) : undefined,
        ].filter(Boolean);
        if (content.length > 0) lines.push(`${service.name}內容：${content.join("／")}`);
        if (detail.visualLevel) lines.push(`${service.name}視覺：${getEcommerceVisualLevelLabel(service.id, detail.visualLevel)}`);
      });
      if (answers.serviceIds.includes("poster")) {
        const service = services.find((item) => item.id === "poster");
        const config = getServiceDetailConfig("poster");
        const detail = answers.serviceDesignDetails.poster ?? {};
        if (service && config) {
          const purpose = getServiceDetailOptionLabel(config.purposeOptions, detail.purpose);
          if (purpose) lines.push(`${service.name}用途：${purpose}`);
          const specification = getServiceDetailOptionLabel(config.specificationOptions, detail.specification);
          const series = detail.seriesArtwork === "yes" ? `同系列共 ${answers.quantities.poster ?? 0} 款` : "單款";
          lines.push(`${service.name}規格：${[specification, series].filter(Boolean).join("／")}`);
          const contentStatus = getServiceDetailOptionLabel(config.contentOptions, detail.contentStatus);
          const assetStatus = getServiceDetailOptionLabel(config.assetOptions, detail.assetStatus);
          const content = [contentStatus, assetStatus ? `素材狀況 ${assetStatus}` : undefined].filter(Boolean);
          if (content.length > 0) lines.push(`${service.name}內容：${content.join("／")}`);
          const complexity = config.complexityOptions.find((option) => option.value === detail.complexity)?.label;
          if (complexity) lines.push(`${service.name}視覺：${complexity}`);
        }
      }
      if (answers.serviceIds.includes("card")) {
        const service = services.find((item) => item.id === "card");
        const config = getServiceDetailConfig("card");
        const quantity = Math.max(0, answers.quantities.card ?? 0);
        if (service && config) {
          getMonthlyCardDetails(answers, quantity).forEach((detail, index) => {
            const prefix = quantity > 1 ? `${service.name}第 ${index + 1} 款` : service.name;
            const side = detail.specification === "double" ? "雙面" : detail.specification === "single" ? "單面" : "待確認";
            const application = (detail.applicationCount ?? 0) > 0 ? `同版套用 ${detail.applicationCount} 位` : undefined;
            lines.push(`${prefix}規格：${[side, application].filter(Boolean).join("／")}`);
            const purpose = getServiceDetailOptionLabel(config.purposeOptions, detail.purpose);
            if (purpose) lines.push(`${prefix}用途：${purpose}`);
            const contentStatus = getServiceDetailOptionLabel(config.contentOptions, detail.contentStatus);
            const assetStatus = getServiceDetailOptionLabel(config.assetOptions, detail.assetStatus);
            const content = [contentStatus, assetStatus ? `素材狀況 ${assetStatus}` : undefined].filter(Boolean);
            if (content.length > 0) lines.push(`${prefix}內容：${content.join("／")}`);
            const complexity = config.complexityOptions.find((option) => option.value === detail.complexity)?.label;
            if (complexity) lines.push(`${prefix}視覺：${complexity}`);
          });
        }
      }
      (["dm", "menu"] as const).forEach((serviceId) => {
        if (!answers.serviceIds.includes(serviceId)) return;
        const service = services.find((item) => item.id === serviceId);
        if (!service) return;
        const quantity = Math.max(0, answers.quantities[serviceId] ?? 0);
        getMonthlyPrintDetails(answers, serviceId, quantity).forEach((detail, index) => {
          const prefix = quantity > 1 ? `${service.name}第 ${index + 1} 項` : service.name;
          if (detail.purposes && detail.purposes.length > 0) lines.push(`${prefix}用途：${detail.purposes.map((purpose) => printPurposeLabels[purpose]).join("、")}`);
          const structure = [
            detail.structure ? printStructureLabels[detail.structure] : undefined,
            detail.fold ? printFoldLabels[detail.fold] : undefined,
          ].filter(Boolean).join("／");
          const specification = [
            detail.format ? `尺寸 ${printFormatLabels[detail.format]}` : undefined,
            structure
              ? detail.structure === "multipage" && detail.pageCount
                ? `${structure}・${detail.pageCount} 頁`
                : structure
              : undefined,
          ].filter(Boolean);
          if (specification.length > 0) lines.push(`${prefix}規格：${specification.join("／")}`);
          const content = [
            detail.contentStatus ? contentStatusLabels[detail.contentStatus] : undefined,
            detail.imageStatus ? `素材狀況 ${imageStatusLabels[detail.imageStatus]}` : undefined,
            detail.versionCount ? formatExtensionSummary(detail.versionCount) : undefined,
          ].filter(Boolean);
          if (content.length > 0) lines.push(`${prefix}內容：${content.join("／")}`);
          const schedule = [
            detail.complexity ? complexityLabels[detail.complexity] : undefined,
            detail.deadline ? `完稿 ${detail.deadline.replaceAll("-", "/")}` : undefined,
          ].filter(Boolean);
          if (schedule.length > 0) lines.push(`${prefix}視覺／完稿：${schedule.join("／")}`);
        });
      });
      lines.push(`方案規則：${monthlyCooperationNotes[0]}`);
      lines.push(`優惠幅度：單次設計費合計（含網站主視覺延伸與宣傳單／菜單多頁）× ${formatMonthlyDiscount(getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3))}；追加產品按單次價格另計；社群圖文總圖滿 10 張的 5% 優惠不適用月方案`);
      lines.push(`特殊計價：${monthlyCooperationNotes[1]}`);
      lines.push(`另行確認：${monthlyCooperationNotes[4]}`);
      lines.push("合作重點：每組含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 $300 起／次。月方案如需取消或調整，最晚於製作前 2 日告知；已開始製作的部分不予退款，僅尚未開始製作的部分可依實際進度評估退款。20% 訂金不退");
    } else {
      if (answers.category) lines.push(`類別：${categoryLabels[answers.category]}`);
      if (selectedServices.length > 0) {
        lines.push(`項目：${selectedServices.map((item) => formatServiceQuantity(item, answers.quantities[item.id], answers)).join("、")}`);
      }
      if (answers.serviceIds.includes("social")) {
        const socialPricing = getSocialPricingCounts(answers);
        const postBreakdown = socialPricing.imageCounts
          .map((count, index) => `第 ${index + 1} 篇 ${count} 張`)
          .join("、");
        lines.push(`IG／FB 社群圖文：${postBreakdown}／共 ${socialPricing.totalImages} 張（延伸 ${socialPricing.extensionCount} 張）${socialPricing.totalImages >= 10 ? "／9.5 折" : ""}`);
      }
      if (answers.serviceIds.includes("product-frame")) {
        const frameCount = answers.quantities["product-frame"] ?? 0;
        const framePricing = getProductFramePricingCounts(answers, frameCount);
        const frameBreakdown = framePricing.productCounts.map((count, index) => `第 ${index + 1} 版 ${count} 項`).join("、");
        lines.push(`商品主圖套版：${frameBreakdown}／共 ${framePricing.totalProducts} 項產品`);
      }
      selectedEcommerceServices.forEach((service) => {
        const detail = answers.ecommerceDesignDetails[service.id] ?? {};
        if (service.id === "banner") {
          const count = getBannerExtensionCount(answers);
          lines.push(`${service.name}主視覺延伸加購：${count > 0 ? `${count} 張` : "不加購"}`);
        }
        const placement = getEcommerceOptionLabel(getEcommercePlacementOptions(service.id), detail.placement);
        const size = getEcommerceOptionLabel(getEcommerceSizeOptions(service.id), detail.size);
        if (placement) lines.push(`${service.name}用途：${placement}`);
        if (size) lines.push(`${service.name}規格：版位 ${size}`);
        const content = [
          detail.copyStatus ? ecommerceCopyStatusLabels[detail.copyStatus] : undefined,
          detail.assetStatus ? `素材狀況 ${ecommerceAssetStatusLabels[detail.assetStatus]}` : undefined,
          detail.versionCount ? formatExtensionSummary(detail.versionCount) : undefined,
        ].filter(Boolean);
        if (content.length > 0) lines.push(`${service.name}內容：${content.join("／")}`);
        const schedule = [
          detail.visualLevel ? getEcommerceVisualLevelLabel(service.id, detail.visualLevel) : undefined,
          getServiceTimelineLabel(service.id),
        ].filter(Boolean);
        if (schedule.length > 0) lines.push(`${service.name}視覺／排程：${schedule.join("／")}`);
      });
      selectedDetailedPrintServices.forEach((service) => {
        const detail = answers.printDesignDetails[service.id] ?? {};
        const structure = [
          detail.structure ? printStructureLabels[detail.structure] : undefined,
          detail.fold ? printFoldLabels[detail.fold] : undefined,
        ].filter(Boolean).join("／");
        if (detail.purposes && detail.purposes.length > 0) lines.push(`${service.name}用途：${detail.purposes.map((purpose) => printPurposeLabels[purpose]).join("、")}`);
        const specification = [
          detail.format ? `尺寸 ${printFormatLabels[detail.format]}` : undefined,
          structure
            ? detail.structure === "multipage" && (answers.quantities[service.id] ?? 0) > 0
              ? `${structure}・${answers.quantities[service.id]} 頁`
              : structure
            : undefined,
        ].filter(Boolean);
        if (specification.length > 0) lines.push(`${service.name}規格：${specification.join("／")}`);
        const content = [
          detail.contentStatus ? contentStatusLabels[detail.contentStatus] : undefined,
          detail.imageStatus ? `素材狀況 ${imageStatusLabels[detail.imageStatus]}` : undefined,
          detail.versionCount ? formatExtensionSummary(detail.versionCount) : undefined,
        ].filter(Boolean);
        if (content.length > 0) lines.push(`${service.name}內容：${content.join("／")}`);
        const schedule = [
          detail.complexity ? complexityLabels[detail.complexity] : undefined,
          getServiceTimelineLabel(service.id),
          detail.deadline ? `完稿 ${detail.deadline.replaceAll("-", "/")}` : undefined,
        ].filter(Boolean);
        if (schedule.length > 0) lines.push(`${service.name}視覺／排程：${schedule.join("／")}`);
      });
      selectedServiceDetailServices.forEach((service) => {
        const detail = answers.serviceDesignDetails[service.id] ?? {};
        const config = getServiceDetailConfig(service.id);
        if (!config) return;
        if (answers.projectType === "monthly" && service.id === "card") {
          const quantity = Math.max(0, answers.quantities.card ?? 0);
          getMonthlyCardDetails(answers, quantity).forEach((monthlyCardDetail, index) => {
            const side = monthlyCardDetail.specification === "double" ? "雙面" : monthlyCardDetail.specification === "single" ? "單面" : "待確認";
            const prefix = quantity > 1 ? `${service.name}第 ${index + 1} 款` : service.name;
            lines.push(`${prefix}規格：${side}`);
          });
          return;
        }
        const purpose = getServiceDetailOptionLabel(config.purposeOptions, detail.purpose);
        if (purpose) lines.push(`${service.name}用途：${purpose}`);
        const extensionCount = Math.max(0, (answers.quantities[service.id] ?? 1) - 1);
        const quantityDescription = config.hideQuantity
          ? undefined
          : service.id === "poster"
          ? detail.seriesArtwork === "yes"
            ? `系列稿 ${extensionCount} 款（共 ${answers.quantities.poster ?? 1} 款）`
            : "無系列稿（共 1 款）"
          : service.pricing === "card"
          ? undefined
          : `${config.quantityLabel} ${answers.quantities[service.id] ?? 0}`;
        const specification = getServiceDetailOptionLabel(config.specificationOptions, detail.specification);
        const specifications = [specification, quantityDescription].filter(Boolean);
        if (specifications.length > 0) lines.push(`${service.name}規格：${specifications.join("／")}`);
        if (service.pricing === "card" && extensionCount > 0) lines.push(`${service.name}延伸版本：${formatExtensionSummary(extensionCount)}`);
        const contentStatus = getServiceDetailOptionLabel(config.contentOptions, detail.contentStatus);
        const assetStatus = getServiceDetailOptionLabel(config.assetOptions, detail.assetStatus);
        const content = [contentStatus, assetStatus ? `素材狀況 ${assetStatus}` : undefined].filter(Boolean);
        if (content.length > 0) lines.push(`${service.name}內容：${content.join("／")}`);
        const complexity = config.complexityOptions.find((option) => option.value === detail.complexity)?.label;
        const schedule = [complexity, getServiceTimelineLabel(service.id)].filter(Boolean);
        if (schedule.length > 0) lines.push(`${service.name}視覺／排程：${schedule.join("／")}`);
      });
      selectedPrintServices.forEach((service) => {
        const specification = answers.printSpecifications[service.id] ?? {};
        if (specification.support !== undefined) {
          if (specification.support) {
            const printSpecification = [
              specification.quantity ? `印量 ${specification.quantity} 份` : undefined,
              specification.paper ? printPaperLabels[specification.paper] : undefined,
              specification.finish ? printFinishLabels[specification.finish] : undefined,
            ].filter(Boolean);
            lines.push(`${service.name}印刷：需要代辦；${printSpecification.length > 0 ? printSpecification.join("；") : "規格待確認"}`);
          } else {
            lines.push(`${service.name}印刷：不需要代辦`);
          }
        }
      });
    }
    if (answers.projectType === "monthly") {
      const monthlySourceFileSelections = getMonthlySourceFileSelections(answers);
      lines.push(`原始檔：${monthlySourceFileSelections.length > 0
        ? monthlySourceFileSelections.map(({ service, quantity }) => `${service.name} ×${quantity}`).join("、")
        : "不需要"}`);
    } else if (answers.projectType === "single" && step === "result") {
      if (hasDetailedPrintService(answers)) {
        selectedServices.forEach((service) => {
          lines.push(`${service.name}原始檔：${answers.sourceFileServiceIds.includes(service.id) ? "需要" : "不需要"}`);
        });
      } else {
        const sourceFileServices = selectedServices.filter((item) => answers.sourceFileServiceIds.includes(item.id));
        lines.push(`原始檔：${sourceFileServices.length > 0 ? sourceFileServices.map((item) => item.name).join("、") : "不需要"}`);
      }
    }
    if (answers.projectType !== "monthly") {
      lines.push("合作重點：每案含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 $300 起／次。單次服務確認合作並支付訂金後，如取消合作，20% 訂金不予退還");
      lines.push("付款方式：20% 訂金、80% 尾款");
    }
    if (quote.low > 0) {
      quote.breakdown.forEach((item) => lines.push(`${item.label}：${item.detail}\n${formatPriceRange(item.low, item.high)}`));
      lines.push(`${hasPrintProductionCosts ? "設計與代辦初估（不含印刷／運送）" : "網站初估總額"}：${formatPriceRange(quote.low, quote.high)}`);
    }
    if (answers.projectType === "monthly" && monthlyComparison) {
      lines.push(`單次委託參考：${formatPriceRange(monthlyComparison.singleReference.low, monthlyComparison.singleReference.high)}`);
      lines.push(`方案比較：${monthlyComparison.label}；${monthlyComparison.detail}`);
    }
    if (hasPrintProductionCosts) lines.push("未含費用：印刷品製作費、運送費（實報實銷）");
    if (pendingEstimateItems.length > 0) lines.push(`待確認費用：${pendingEstimateItems.join("、")}`);
    lines.push("想進一步確認正式報價與可安排檔期，謝謝！");
    return lines;
  }, [answers, hasPrintProductionCosts, monthlyComparison, pendingEstimateItems, plan, quote, selectedDetailedPrintServices, selectedEcommerceServices, selectedPrintServices, selectedServiceDetailServices, selectedServices, step]);

  const lineInquirySummaryLines = useMemo(() => {
    const isMonthly = answers.projectType === "monthly";
    const lines = [
      isMonthly
        ? "您好，我想詢問月方案的正式報價與檔期。"
        : "您好，我想詢問正式報價與檔期。",
      "",
      `合作方式：${isMonthly ? "月方案" : "單次設計"}`,
    ];

    if (isMonthly && plan) {
      lines.push(`方案：${plan.name}${answers.monthlyGroupCount ? `・每月 ${answers.monthlyGroupCount} 組` : ""}`);
    }

    if (selectedServices.length > 0) {
      const serviceSummary = selectedServices.map((service) => (
        isMonthly
          ? formatMonthlyServiceQuantity(service, answers.quantities[service.id] ?? 0, false, answers)
          : formatServiceQuantity(service, answers.quantities[service.id], answers)
      )).join("、");
      lines.push(`需求：${serviceSummary}`);
    }

    selectedServices.forEach((service) => {
      const detailParts = summaryLines.flatMap((line) => {
        const divider = line.indexOf("：");
        if (divider < 0) return [];
        const label = line.slice(0, divider);
        if (!label.startsWith(service.name)) return [];
        const shortLabel = label.endsWith("用途")
          ? "用途"
          : label.endsWith("規格")
            ? "規格"
            : label.endsWith("內容")
              ? "內容"
              : undefined;
        if (!shortLabel) return [];
        return [`${shortLabel} ${line.slice(divider + 1).replaceAll("\n", "／")}`];
      }).slice(0, 3);
      if (detailParts.length > 0) {
        lines.push(`${selectedServices.length === 1 ? "需求重點" : service.name}：${detailParts.join("；")}`);
      }
    });

    if (isMonthly && answers.monthlyCadence) {
      lines.push(`交付：${monthlyCadenceLabels[answers.monthlyCadence]}`);
    } else if (!isMonthly) {
      const schedules = Array.from(new Set(selectedServices
        .map((service) => getServiceTimelineLabel(service.id).replace(/（實際時間.*）$/, "").trim())
        .filter(Boolean)));
      if (schedules.length > 0) lines.push(`交期：約 ${schedules.join("／")}`);
    }

    if (answers.materials) lines.push(`素材：${materialLabels[answers.materials]}`);

    const addOns: string[] = [];
    const bannerExtensionCount = answers.serviceIds.includes("banner") ? getBannerExtensionCount(answers) : 0;
    if (bannerExtensionCount > 0) addOns.push(`網站主視覺延伸 ${bannerExtensionCount} 張`);
    if (isMonthly) {
      getMonthlySourceFileSelections(answers).forEach(({ service, quantity }) => addOns.push(`${service.name}原始檔 ×${quantity}`));
    } else {
      selectedServices
        .filter((service) => answers.sourceFileServiceIds.includes(service.id))
        .forEach((service) => addOns.push(`${service.name}原始檔`));
    }
    selectedPrintServices
      .filter((service) => answers.printSpecifications[service.id]?.support)
      .forEach((service) => addOns.push(`${service.name}代辦印刷`));
    if (addOns.length > 0) lines.push(`加購：${addOns.join("、")}`);

    if (quote.low > 0) lines.push(`初估：${formatPriceRange(quote.low, quote.high)}`);

    const followUpItems = [
      ...(hasPrintProductionCosts ? ["印刷品製作費與運送費"] : []),
      ...pendingEstimateItems,
    ];
    if (followUpItems.length > 0) lines.push(`另需確認：${Array.from(new Set(followUpItems)).join("、")}`);

    lines.push("", isMonthly ? "請協助確認正式價格與合作安排，謝謝！" : "請協助確認正式價格與可安排時間，謝謝！");
    return lines;
  }, [answers, hasPrintProductionCosts, pendingEstimateItems, plan, quote, selectedPrintServices, selectedServices, summaryLines]);

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setInquirySubmitState("submitting");
    setInquirySubmitMessage("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientName: formData.get("clientName"),
          company: formData.get("company"),
          contact: formData.get("contact"),
          website: formData.get("website"),
          projectType: answers.projectType === "monthly" ? "月方案" : "單次設計",
          services: selectedServices.map((service) => service.name),
          estimateLow: quote.low,
          estimateHigh: quote.high,
          summary: summaryLines,
          answers,
        }),
      });
      const payload = await response.json() as { inquiry?: { id?: string }; error?: string };
      if (!response.ok) throw new Error(payload.error || "送出失敗，請稍後再試。");
      setInquirySubmitState("success");
      setInquirySubmitMessage(payload.inquiry?.id ? `需求編號 ${payload.inquiry.id}` : "已收到你的需求");
      form.reset();
    } catch (error) {
      setInquirySubmitState("error");
      setInquirySubmitMessage(error instanceof Error ? error.message : "送出失敗，請稍後再試。");
    }
  }

  async function copyLineInquirySummary() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(lineInquirySummaryLines.join("\n"));
      setLineCopyState("copied");
    } catch {
      setLineCopyState("failed");
    }
  }

  async function downloadEstimate() {
    const now = new Date();
    const issuedAt = new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const fileDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const referenceTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Taipei",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now).replaceAll(":", "");
    const estimateReference = `SAM-${fileDate.replaceAll("-", "")}-${referenceTime}`;
    const validUntilDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const validUntil = new Intl.DateTimeFormat("zh-TW", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(validUntilDate);
    type EstimateRow = { label: string; value: string; qrCode?: boolean };
    const parseEstimateLine = (line: string): EstimateRow => {
      const divider = line.indexOf("：");
      const rawLabel = divider >= 0 ? line.slice(0, divider) : "需求內容";
      const rawValue = divider >= 0 ? line.slice(divider + 1) : line;
      if (rawLabel.startsWith("原始檔加購｜")) {
        return {
          label: "原始檔加購",
          value: `${rawLabel.slice("原始檔加購｜".length)}\n${rawValue}`,
        };
      }
      const serviceNamePrefix = selectedServices
        .map((service) => service.name)
        .sort((left, right) => right.length - left.length)
        .find((serviceName) => rawLabel.startsWith(serviceName));
      const conciseLabel = serviceNamePrefix
        ? rawLabel.slice(serviceNamePrefix.length).trim() || "數量明細"
        : rawLabel;
      const normalizedLabel = conciseLabel.endsWith("｜設計費")
        ? "小計"
        : conciseLabel === "視覺／排程"
          ? "交期"
        : conciseLabel === "視覺／完稿"
          ? "完稿"
        : conciseLabel.includes("｜主視覺延伸加購")
          ? "主視覺延伸加購"
        : conciseLabel === "月方案優惠設計費"
          ? "優惠設計費"
        : conciseLabel === "月方案規格"
          ? "規格"
        : conciseLabel.includes("｜原始檔加購")
            ? "原始檔加購\n（設計費 +50%）"
            : conciseLabel.includes("｜印刷代辦服務費")
              ? "印刷代辦服務費"
              : conciseLabel.endsWith("原始檔")
                ? "原始檔"
                : conciseLabel;
      const normalizedValue = normalizedLabel === "交期"
        ? rawValue.replace(/（實際時間.*）$/, "").trim()
        : rawValue;
      return {
        label: normalizedLabel === "原始檔加購（設計費 +50%）" ? "原始檔加購\n（設計費 +50%）" : normalizedLabel,
        value: normalizedValue,
      };
    };
    const isOmittablePdfRow = (row: EstimateRow) => (
      (row.label === "原始檔" && row.value.trim() === "不需要")
      || (row.label.includes("印刷") && row.value.includes("不需要代辦"))
    );
    const pdfSummaryLines = summaryLines.slice(1, -1);
    const sharedDetailLabels = new Set(["視覺需求", "素材狀況", "交期", "印刷完稿期限"]);
    const sharedDetailRows = pdfSummaryLines
      .filter((line) => sharedDetailLabels.has(line.slice(0, line.indexOf("："))))
      .map(parseEstimateLine);
    const buildServiceCalculationValue = (service: Service) => {
      const estimate = getServiceEstimate(answers, service);
      const quantity = estimate.quantity;
      const baseLines: string[] = [];
      if (service.id === "social") {
        const socialPricing = getSocialPricingCounts(answers);
        const postCount = socialPricing.postCount;
        const extensionCount = socialPricing.extensionCount;
        baseLines.push(`每篇首張 ×${postCount}：${formatPriceRange(service.low * postCount, service.high * postCount)}`);
        if (extensionCount > 0) baseLines.push(`同篇延伸 ×${extensionCount}：${formatPriceRange(extensionCount * socialExtensionPrice.low, extensionCount * socialExtensionPrice.high)}`);
        baseLines.push(`小計${quantity >= 10 ? "（滿 10 張 9.5 折後）" : ""}：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      } else if (service.id === "banner") {
        const extensionCount = getBannerExtensionCount(answers);
        baseLines.push(`網站橫幅基本設計 ×${quantity}：${formatPriceRange(service.low * quantity, service.high * quantity)}`);
        if (extensionCount > 0) baseLines.push(`主視覺延伸加購 ×${extensionCount}：${formatPriceRange(estimate.addonLow, estimate.addonHigh)}`);
        baseLines.push(`小計：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      } else if (service.id === "product-frame") {
        const { extraProductCount } = getProductFramePricingCounts(answers, quantity);
        baseLines.push(`商品主圖版型 ×${quantity}：${formatPriceRange(service.low * quantity, service.high * quantity)}`);
        if (extraProductCount > 0) baseLines.push(`追加產品 ×${extraProductCount}（每項 $70）：${currency.format(extraProductCount * 70)}`);
        baseLines.push(`小計：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      } else if (service.pricing === "dm") {
        const extraPageCount = Math.max(0, quantity - 1);
        baseLines.push(`${service.id === "dm" ? "第 1 面／頁" : "第 1 頁"}：${formatPriceRange(service.low, service.high)}`);
        if (extraPageCount > 0) baseLines.push(`第 2 ${service.unit}起 ×${extraPageCount}：${formatPriceRange(extraPageCount * 600, extraPageCount * 800)}`);
        baseLines.push(`小計：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      } else if (service.pricing === "card") {
        const extraCardCount = Math.max(0, quantity - 1);
        const cardBaseRange = getCardBaseRange(answers);
        baseLines.push(`${answers.serviceDesignDetails.card?.specification === "double" ? "雙面" : "單面"}首款：${formatPriceRange(cardBaseRange.low, cardBaseRange.high)}`);
        if (extraCardCount > 0) baseLines.push(`追加套版 ×${extraCardCount}（每款 $300）：${currency.format(extraCardCount * 300)}`);
        baseLines.push(`小計：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      } else {
        baseLines.push(getServicePriceBasis(answers, service));
        baseLines.push(`小計：${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`);
      }
      const hasPriceAdjustments = estimate.addonLow > 0 || estimate.sourceLow > 0 || estimate.printLow > 0;
      const costLines = [
        ...baseLines,
        ...(estimate.sourceLow > 0 ? [`原始檔加購：${getSourceFilePriceBasis(service, quantity)} = ${formatPriceRange(Math.round(estimate.sourceLow), Math.round(estimate.sourceHigh))}`] : []),
        ...(estimate.printLow > 0 ? [`印刷代辦服務費：設計費 × 15% = ${formatPriceRange(Math.round(estimate.printLow), Math.round(estimate.printHigh))}`] : []),
        ...(hasPriceAdjustments ? [`本項小計：${formatPriceRange(Math.round(estimate.totalLow), Math.round(estimate.totalHigh))}`] : []),
      ];
      return costLines.join("\n");
    };
    const allItemsCalculationRows: EstimateRow[] = [
      ...selectedServices.map((service, serviceIndex) => ({
        label: `項次 ${serviceIndex + 1}`,
        value: `${service.name}｜${formatPdfServiceQuantity(service, answers.quantities[service.id], answers)}\n${buildServiceCalculationValue(service)}`,
      })),
      ...(hasPrintProductionCosts ? [{ label: "未含費用", value: "印刷品製作費、運送費（實報實銷）" }] : []),
      ...(pendingEstimateItems.length > 0 ? [{ label: "待確認", value: pendingEstimateItems.join("、") }] : []),
    ];
    const singlePdfTermsRows: EstimateRow[] = [
      {
        label: "合作重點",
        value: "每案含 3 次細節修改；更換整體方向或超過次數將另行報價。\n確認合作後如取消，20% 訂金不退。",
      },
      { label: "付款方式", value: "20% 訂金、80% 尾款" },
    ];
    const monthlyPdfDiscountRate = getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3);
    const monthlyPdfReference = getMonthlyPricingReference(answers);
    const monthlyPdfDiscountSummary = getMonthlyDiscountSummary(answers);
    const monthlyPdfAddonRows = getMonthlyAddonBreakdown(answers);
    const monthlyPdfExcludedLabels = new Set([
      "方案規則",
      "優惠幅度",
      "特殊計價",
      "正式確認",
      "另行確認",
      "取消與付款",
      "原始檔加購",
      "網站主視覺延伸加購",
      "待確認費用",
      "修改",
      "合作重點",
      "網站初估總額",
      "單次委託參考",
      "方案比較",
      ...quote.breakdown.map((item) => item.label),
    ]);
    const isMonthlyServiceDetailLine = (line: string) => selectedServices.some((service) =>
      line.startsWith(`${service.name}用途：`)
      || line.startsWith(`${service.name}規格：`)
      || line.startsWith(`${service.name}內容：`)
      || line.startsWith(`${service.name}視覺／排程：`)
      || line.startsWith(`${service.name}視覺／完稿：`)
      || line.startsWith(`${service.name}第 `),
    );
    const monthlyPdfCoreRows = pdfSummaryLines
      .filter((line) => {
        const divider = line.indexOf("：");
        const label = divider >= 0 ? line.slice(0, divider) : line;
        return label !== "項目" && label !== "原始檔" && !monthlyPdfExcludedLabels.has(label) && !isMonthlyServiceDetailLine(line);
      })
      .map(parseEstimateLine);
    const monthlyPdfServiceRows: EstimateRow[] = selectedServices.flatMap((service, serviceIndex) => {
      const reference = getMonthlyServicePricingReference(answers, service);
      const quantity = answers.quantities[service.id] ?? 0;
      const detailRows = pdfSummaryLines
        .filter((line) => isMonthlyServiceDetailLine(line) && line.startsWith(service.name))
        .map((line) => {
          const row = parseEstimateLine(line);
          return { ...row, label: `項次 ${serviceIndex + 1}・${row.label}` };
        });
      const addonRows = monthlyPdfAddonRows
        .filter((item) => item.label.startsWith(`${service.name}｜`))
        .map((item) => ({
          label: item.label.replace(`${service.name}｜`, `項次 ${serviceIndex + 1}・`),
          value: `${item.detail}\n${formatPriceRange(item.low, item.high)}`,
        }));
      return [
        {
          label: `項次 ${serviceIndex + 1}`,
          value: `${formatMonthlyServiceQuantity(service, quantity, false, answers)}\n單次設計費參考：${formatPriceRange(reference.designLow, reference.designHigh)}`,
        },
        ...detailRows,
        ...addonRows,
      ];
    });
    const monthlyPdfSourceRows = pdfSummaryLines
      .filter((line) => line.startsWith("原始檔：") && !line.endsWith("不需要"))
      .map(parseEstimateLine);
    const monthlyPdfDetailRows: EstimateRow[] = [
      ...monthlyPdfCoreRows,
      ...monthlyPdfServiceRows,
      ...monthlyPdfSourceRows,
      {
        label: "優惠計算",
        value: `單次設計費 ${formatPriceRange(monthlyPdfReference.designLow, monthlyPdfReference.designHigh)} × ${formatMonthlyDiscount(monthlyPdfDiscountRate)}\n優惠後 ${formatPriceRange(monthlyPdfDiscountSummary.low, monthlyPdfDiscountSummary.high)}\n月方案不再套用社群圖文滿 10 張優惠。`,
      },
    ];
    const monthlyPdfTermsRows: EstimateRow[] = [
      {
        label: "合作重點",
        value: [
          ...(selectedServices.some((service) => service.category === "print") ? ["平面設計每月最多 2 組，未使用組數不累積。"] : []),
          "每組含 3 次細節修改；更換整體方向或超過次數將另行報價。",
          "取消或調整請於製作前 2 日告知；已開始製作的部分不退款。",
          "原始檔與代辦印刷費用另計。",
        ].join("\n"),
      },
      { label: "付款方式", value: "20% 訂金、80% 尾款" },
    ];
    const singlePdfExcludedLabels = new Set(["類別", "合作重點", "付款方式", "網站初估總額", "設計與代辦初估（不含印刷／運送）"]);
    const singlePdfRows = pdfSummaryLines
      .filter((line) => {
        const divider = line.indexOf("：");
        const label = divider >= 0 ? line.slice(0, divider) : line;
        return !singlePdfExcludedLabels.has(label);
      })
      .map(parseEstimateLine)
      .filter((row) => !isOmittablePdfRow(row));
    const singleServiceRow = singlePdfRows.find((row) => row.label === "項目");
    const singleScheduleRow = singlePdfRows.find((row) => row.label === "交期");
    const singleCompactRows: EstimateRow[] = [
      ...(singleServiceRow ? [{
        label: "服務項目",
        value: `${singleServiceRow.value}${singleScheduleRow ? `\n交期：約 ${singleScheduleRow.value}` : ""}`,
      }] : []),
      ...singlePdfRows.filter((row) => row !== singleServiceRow && row !== singleScheduleRow),
    ];
    const detailRowGroups: Array<{ title: string; rows: EstimateRow[] }> = answers.projectType === "monthly"
      ? [{ title: "月方案需求與估價", rows: monthlyPdfDetailRows }]
      : answers.projectType === "single" && selectedServices.length > 1
      ? [
          { title: "全部項目初估計算明細", rows: allItemsCalculationRows },
          ...selectedServices.map((service, serviceIndex) => {
            const estimate = getServiceEstimate(answers, service);
            const serviceLines = pdfSummaryLines.filter((line) =>
              line.startsWith(`${service.name}用途：`)
              || line.startsWith(`${service.name}規格：`)
              || line.startsWith(`${service.name}延伸版本：`)
              || line.startsWith(`${service.name}內容：`)
              || line.startsWith(`${service.name}視覺／排程：`)
              || line.startsWith(`${service.name}印刷：`)
              || (service.id === "social" && line.startsWith("IG／FB 社群圖文："))
              || (service.id === "product-frame" && line.startsWith("商品主圖套版：")),
            );
            const serviceRows: EstimateRow[] = [
              { label: `項次 ${serviceIndex + 1}`, value: formatPdfServiceQuantity(service, answers.quantities[service.id], answers) },
              ...sharedDetailRows,
              ...serviceLines.map(parseEstimateLine).filter((row) => !isOmittablePdfRow(row)),
            ];
            serviceRows.push({
              label: "小計",
              value: `${getServicePriceBasis(answers, service)}\n${formatPriceRange(Math.round(estimate.baseLow), Math.round(estimate.baseHigh))}`,
            });
            if (estimate.addonLow > 0) {
              serviceRows.push({ label: "主視覺延伸加購", value: `${getBannerExtensionCount(answers)} 張 × ${formatPriceRange(bannerExtensionPrice.low, bannerExtensionPrice.high)}／張\n${formatPriceRange(Math.round(estimate.addonLow), Math.round(estimate.addonHigh))}` });
            }
            if (estimate.sourceLow > 0) {
              serviceRows.push({ label: "原始檔加購\n（設計費 +50%）", value: `${getSourceFilePriceBasis(service, estimate.quantity)}\n${formatPriceRange(Math.round(estimate.sourceLow), Math.round(estimate.sourceHigh))}` });
            }
            if (estimate.printLow > 0) {
              serviceRows.push({ label: "印刷代辦服務費\n（設計費 +15%）", value: `該項設計費 × 15%\n${formatPriceRange(Math.round(estimate.printLow), Math.round(estimate.printHigh))}` });
              serviceRows.push({ label: "未含費用", value: "印刷品製作費、運送費（實報實銷）" });
            }
            if (estimate.addonLow > 0 || estimate.sourceLow > 0 || estimate.printLow > 0) {
              serviceRows.push({ label: "本項初估", value: formatPriceRange(Math.round(estimate.totalLow), Math.round(estimate.totalHigh)) });
            }
            const servicePendingItems = pendingEstimateItems.filter((item) => item.startsWith(service.name));
            if (servicePendingItems.length > 0) {
              serviceRows.push({ label: "待確認", value: servicePendingItems.join("、") });
            }
            return { title: service.name, rows: serviceRows };
          }),
        ]
      : [{
          title: "需求明細",
          rows: singleCompactRows,
        }];
    const estimateNotice = "此為初估，正式費用以確認需求後的報價單為準。";
    const rowGroups: Array<{ title: string; rows: EstimateRow[] }> = [
      ...detailRowGroups,
      {
        title: "合作與聯絡",
        rows: [
          ...(answers.projectType === "monthly" ? monthlyPdfTermsRows : singlePdfTermsRows),
          { label: "有效期限", value: validUntil },
          { label: "聯絡方式", value: "掃描 QR Code\n確認正式報價與可安排檔期", qrCode: true },
          { label: "說明", value: estimateNotice },
        ],
      },
    ];
    await document.fonts.ready;
    const contactQrCode = await loadPdfContactQrCode();
    const pageCanvases: HTMLCanvasElement[] = [];
    const pageTextLayers: string[][] = [];
    const drawRoundedRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      fillStyle: string,
      strokeStyle?: string,
    ) => {
      context.beginPath();
      context.roundRect(x, y, width, height, radius);
      context.fillStyle = fillStyle;
      context.fill();
      if (strokeStyle) {
        context.strokeStyle = strokeStyle;
        context.lineWidth = 1;
        context.stroke();
      }
    };
    const createEstimatePage = (pageTitle = "需求明細（續）", isFirstPage = false) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1240;
      canvas.height = 1754;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("無法產生估價單頁面");
      context.fillStyle = "#fbfaf8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#403128";
      context.fillRect(0, 0, canvas.width, 18);
      context.textBaseline = "alphabetic";

      context.strokeStyle = "#9d806c";
      context.lineWidth = 2;
      context.beginPath();
      context.arc(105, 94, 43, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = "#403128";
      context.font = '44px Georgia, "Noto Serif TC", serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("S", 105, 96);
      context.textBaseline = "alphabetic";
      context.textAlign = "left";
      context.fillStyle = "#403128";
      context.font = '700 30px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      context.fillText("SAM", 176, 86);
      context.fillStyle = "#8a7565";
      context.font = '18px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      context.fillText("DESIGN STUDIO", 176, 121);
      context.textAlign = "right";
      context.fillStyle = "#403128";
      context.font = '600 16px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      context.fillText(estimateReference, 1160, 76);
      context.fillStyle = "#8a7565";
      context.font = '15px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      context.fillText(`估價日期 ${issuedAt}`, 1160, 108);
      context.fillText(`有效至 ${validUntil}`, 1160, 136);
      context.strokeStyle = "#dfd4cb";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(64, 176);
      context.lineTo(1176, 176);
      context.stroke();

      const totalPanelTop = 210;
      if (isFirstPage) {
        drawRoundedRect(context, 64, totalPanelTop, 1112, 128, 18, "#eee3da", "#d6c3b5");
        context.fillStyle = "#806957";
        context.textAlign = "left";
        context.font = '600 18px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
        context.fillText(hasPrintProductionCosts ? "初估總額（不含印刷、運送）" : "初估總額", 92, totalPanelTop + 38);
        context.fillStyle = "#403128";
        context.font = '700 46px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
        context.fillText(formatPriceRange(quote.low, quote.high), 92, totalPanelTop + 94);
        context.textAlign = "right";
        context.fillStyle = "#8a7565";
        context.font = '600 17px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
        context.fillText(answers.projectType === "monthly" ? "月方案優惠後" : `單次服務・${selectedServices.length} 項`, 1146, totalPanelTop + 43);
        context.font = '500 15px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
        context.fillText("網站初估・正式金額於確認需求後提供", 1146, totalPanelTop + 82);
        context.textAlign = "left";
      }

      const bodyTop = isFirstPage ? 426 : 318;

      drawRoundedRect(context, 64, bodyTop - 64, 1112, 52, 14, "#f1e8e0");
      context.fillStyle = "#403128";
      context.textAlign = "left";
      context.font = '700 21px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      context.fillText(pageTitle, 88, bodyTop - 30);
      return {
        canvas,
        context,
        bodyTop,
        textLines: ["Sam Design Studio", estimateReference, pageTitle, `估價日期 ${issuedAt}`, `有效至 ${validUntil}`],
      };
    };

    let currentPage = createEstimatePage(rowGroups[0]?.title, true);
    pageCanvases.push(currentPage.canvas);
    pageTextLayers.push(currentPage.textLines);
    let context = currentPage.context;
    let y = currentPage.bodyTop;
    const bodyBottom = 1510;
    const rowFontSize = 19;
    const rowLineHeight = 31;
    const minimumRowHeight = 66;

    const measureEstimateRow = (targetContext: CanvasRenderingContext2D, row: EstimateRow) => {
      targetContext.font = `600 ${rowFontSize}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif`;
      const labelLines = wrapCanvasText(targetContext, row.label, 220);
      targetContext.font = `500 ${rowFontSize}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif`;
      const valueLines = wrapCanvasText(targetContext, row.value, 790);
      const textRowHeight = Math.max(minimumRowHeight, Math.max(labelLines.length, valueLines.length) * rowLineHeight + 38);
      const rowHeight = row.qrCode ? Math.max(176, textRowHeight) : textRowHeight;
      return { labelLines, valueLines, rowHeight };
    };

    const drawInlineGroupHeader = (targetContext: CanvasRenderingContext2D, title: string, top: number) => {
      drawRoundedRect(targetContext, 64, top, 1112, 52, 14, "#f1e8e0");
      targetContext.fillStyle = "#403128";
      targetContext.textAlign = "left";
      targetContext.font = '700 21px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      targetContext.fillText(title, 88, top + 34);
    };

    rowGroups.forEach((group, groupIndex) => {
      if (groupIndex > 0) {
        const firstRowHeight = group.rows[0] ? measureEstimateRow(context, group.rows[0]).rowHeight : minimumRowHeight;
        const inlineHeaderHeight = 76;
        if (y + inlineHeaderHeight + firstRowHeight > bodyBottom) {
          currentPage = createEstimatePage(group.title);
          pageCanvases.push(currentPage.canvas);
          pageTextLayers.push(currentPage.textLines);
          context = currentPage.context;
          y = currentPage.bodyTop;
        } else {
          y += 20;
          drawInlineGroupHeader(context, group.title, y);
          currentPage.textLines.push(group.title);
          y += inlineHeaderHeight;
        }
      }
      group.rows.forEach((row) => {
        let { labelLines, valueLines, rowHeight } = measureEstimateRow(context, row);

        if (y + rowHeight > bodyBottom) {
          currentPage = createEstimatePage(`${group.title}（續）`);
          pageCanvases.push(currentPage.canvas);
          pageTextLayers.push(currentPage.textLines);
          context = currentPage.context;
          y = currentPage.bodyTop;
          ({ labelLines, valueLines, rowHeight } = measureEstimateRow(context, row));
        }

        const isTotalRow = row.label.includes("總額") || row.label.includes("本項初估");
        const isPriceRow = row.label.includes("優惠") || row.label.includes("本項初估");
        const isNoticeRow = row.label.includes("未含") || row.label.includes("待確認");
        const isTermsRow = row.label.includes("合作重點") || row.label.includes("付款") || row.label.includes("有效期限") || row.label.includes("聯絡") || row.label === "說明";
        const rowFill = isTotalRow ? "#e6d8cd" : isPriceRow ? "#f1e8e0" : isNoticeRow ? "#fbf4ec" : isTermsRow ? "#f8f4f0" : "#ffffff";
        drawRoundedRect(context, 64, y, 1112, rowHeight, isTotalRow ? 16 : 10, rowFill, "#e3d7ce");
        context.fillStyle = isTotalRow ? "#d9c6b8" : isPriceRow ? "#e7d8cc" : "#f5eee8";
        context.fillRect(65, y + 1, 260, rowHeight - 2);
        context.strokeStyle = "#e3d7ce";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(325, y + 1);
        context.lineTo(325, y + rowHeight - 1);
        context.stroke();
        const textTop = y + 34;
        context.fillStyle = isTotalRow || isPriceRow ? "#765f50" : "#806957";
        context.font = `600 ${rowFontSize}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif`;
        labelLines.forEach((line, lineIndex) => context.fillText(line, 86, textTop + lineIndex * rowLineHeight));
        context.fillStyle = "#322821";
        context.font = `${isTotalRow || isPriceRow ? "650" : "500"} ${rowFontSize}px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif`;
        if (row.qrCode) {
          const qrSize = 132;
          const qrLeft = 346;
          const qrTop = y + (rowHeight - qrSize) / 2;
          context.fillStyle = "#ffffff";
          context.fillRect(qrLeft - 5, qrTop - 5, qrSize + 10, qrSize + 10);
          context.imageSmoothingEnabled = false;
          context.drawImage(contactQrCode, qrLeft, qrTop, qrSize, qrSize);
          context.imageSmoothingEnabled = true;
          context.fillStyle = "#322821";
          valueLines.forEach((line, lineIndex) => context.fillText(line, 514, y + 73 + lineIndex * rowLineHeight));
        } else {
          valueLines.forEach((line, lineIndex) => {
            const isStandalonePrice = /^\$[\d,]+(?:～\$[\d,]+)?$/.test(line.trim());
            context.textAlign = isStandalonePrice ? "right" : "left";
            context.fillText(line, isStandalonePrice ? 1140 : 354, textTop + lineIndex * rowLineHeight);
          });
        }
        context.textAlign = "left";
        currentPage.textLines.push(row.label, row.value);
        y += rowHeight + 12;
      });
    });

    pageCanvases.forEach((canvas, index) => {
      const footerContext = canvas.getContext("2d");
      if (!footerContext) return;
      drawPdfLogoWatermark(footerContext, canvas.width, canvas.height);
      footerContext.fillStyle = "#8a7a6e";
      footerContext.font = '17px -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif';
      footerContext.textAlign = "left";
      footerContext.fillText("Sam Design Studio｜設計服務與報價諮詢", 64, 1690);
      footerContext.textAlign = "center";
      footerContext.fillText(`第 ${index + 1}／${pageCanvases.length} 頁`, 620, 1690);
    });

    const pdfPages = await Promise.all(pageCanvases.map(async (canvas, pageIndex) => {
      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("無法產生估價單")), "image/jpeg", 0.94);
      });
      return {
        jpegBytes: new Uint8Array(await jpegBlob.arrayBuffer()),
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        textLines: pageTextLayers[pageIndex] ?? [],
      };
    }));
    const pdfBlob = createPdfFromJpegs(pdfPages);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sam-Design-Studio-估價單-${estimateReference}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderControls() {
    switch (step) {
      case "projectType":
        return (
          <div className="choices two-columns">
            <OptionButton
              label="單次設計"
              detail="一張、一次活動或單一專案"
              onClick={() => {
                setExpandedServiceCategory(null);
                setActiveMonthlySpecificationServiceId(undefined);
                setConfirmedSingleServiceIds([]);
                setIsSingleSpecificationAdvancing(false);
                move("category", { projectType: "single", category: undefined, serviceIds: [], quantities: {}, socialPostCount: undefined, socialPostImageCounts: undefined, productFrameProductCounts: undefined, ecommerceDesignDetails: {}, ecommerceDetailIndex: undefined, serviceDesignDetails: {}, monthlyServiceDesignDetails: {}, serviceDetailIndex: undefined, sourceFileServiceIds: [], sourceFileIndex: undefined, printDesignDetails: {}, monthlyPrintDesignDetails: {}, printDetailIndex: undefined, printSpecifications: {}, monthlySourceFileQuantities: {} }, "單次設計");
              }}
            />
            <OptionButton
              label="月方案"
              detail="每月固定更新、長期配合"
              onClick={() => {
                setExpandedServiceCategory(null);
                setActiveMonthlySpecificationServiceId(undefined);
                setConfirmedSingleServiceIds([]);
                setIsSingleSpecificationAdvancing(false);
                move("monthlyServices", { projectType: "monthly", category: undefined, serviceIds: [], quantities: {}, socialPostCount: undefined, socialPostImageCounts: undefined, productFrameProductCounts: undefined, ecommerceDesignDetails: {}, serviceDesignDetails: {}, monthlyServiceDesignDetails: {}, printDesignDetails: {}, monthlyPrintDesignDetails: {}, sourceFileServiceIds: [], monthlySourceFileQuantities: {}, monthlyGroupCount: undefined, monthlyPlanId: undefined }, "月方案");
              }}
            />
          </div>
        );
      case "category":
        return (
          <div className="multi-select-wrap">
            <div className={`single-selection-status${singleSelectionReady ? " is-complete" : ""}`} aria-live="polite">
              <span>已選 <strong>{selectedServices.length}</strong> 項服務</span>
              <small>{selectedServices.length > 0 ? singleSelectedSummary : "先選擇一項服務，即時摘要會同步顯示初估"}</small>
            </div>
            <div className="service-category-list">
              {singleServiceCategoryGroups.map((group) => {
                const isExpanded = expandedServiceCategory === group.category;
                const selectedCount = services.filter((item) => item.category === group.category && answers.serviceIds.includes(item.id)).length;
                return (
                  <section className={`service-category-panel${isExpanded ? " is-open" : ""}`} key={group.category}>
                    <button
                      className="service-category-trigger"
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={`service-list-${group.category}`}
                      onClick={() => setExpandedServiceCategory(isExpanded ? null : group.category)}
                    >
                      <span className="service-category-copy">
                        <strong>{group.label}</strong>
                        <small>{group.detail}</small>
                      </span>
                      <span className="service-category-status">
                        {selectedCount > 0 ? `已選 ${selectedCount} 項` : isExpanded ? "收合" : "查看項目"}
                        <span className="service-category-chevron" aria-hidden="true">⌄</span>
                      </span>
                    </button>
                    <div
                      className={`service-category-reveal${isExpanded ? " is-open" : ""}`}
                      id={`service-list-${group.category}`}
                      aria-hidden={!isExpanded}
                      inert={!isExpanded}
                    >
                      <div className="service-category-reveal-inner">
                        <div className="choices service-choices service-category-items">
                          {services
                            .filter((item) => item.category === group.category)
                            .map((item) => {
                              const isSelected = answers.serviceIds.includes(item.id);
                              const quantityConfig = getSingleInlineQuantityConfig(item);
                              const quantity = item.id === "social"
                                ? Math.max(1, answers.socialPostCount ?? 1)
                                : Math.max(1, answers.quantities[item.id] ?? 1);
                              return (
                                <div className={`single-service-picker${isSelected ? " is-selected" : ""}`} key={item.id}>
                                  <OptionButton
                                    label={item.name}
                                    detail={item.description}
                                    note={item.note}
                                    price={getServiceDisplayPrice(item)}
                                    schedule={getServiceTimelineSummary(item.id)}
                                    selected={isSelected}
                                    multiple
                                    onClick={() => toggleService(item.id)}
                                  />
                                  {isSelected && (
                                    <div className="single-service-picker-quantity">
                                      {quantityConfig ? (
                                        <>
                                          <span><strong>{quantityConfig.label}</strong><small>{quantityConfig.note}</small></span>
                                          {quantityConfig.customInput ? (
                                            <label className="single-custom-quantity">
                                              <input
                                                aria-label={`${item.name}自訂數量`}
                                                inputMode="numeric"
                                                type="number"
                                                min="1"
                                                max={quantityConfig.maximum}
                                                placeholder="輸入張數"
                                                value={answers.quantities[item.id] ?? ""}
                                                onChange={(event) => setSingleServiceQuantity(item.id, event.target.value)}
                                              />
                                              <span>張</span>
                                            </label>
                                          ) : (
                                            <span className="monthly-quantity-stepper">
                                              <button type="button" aria-label={`減少 ${item.name} 數量`} disabled={quantity <= 1} onClick={() => adjustSingleServiceQuantity(item.id, -1)}>−</button>
                                              <output aria-label={`${item.name}目前數量`}>{quantity}</output>
                                              <button type="button" aria-label={`增加 ${item.name} 數量`} disabled={quantity >= quantityConfig.maximum} onClick={() => adjustSingleServiceQuantity(item.id, 1)}>＋</button>
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="single-service-deferred"><strong>基本數量與規格</strong><small>{getSingleDeferredQuantityNote(item)}</small></span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
            <div className="multi-select-footer">
              <span>{selectedServices.length === 0
                ? "請先展開一個類別選擇服務"
                : !singleSelectionReady
                  ? `請先設定 ${singleServicesMissingQuantity.map((service) => service.name).join("、")} 的基本數量`
                  : `已選 ${selectedServices.length} 項，下一步只確認會影響價格的內容`}</span>
              <div className="multi-select-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button
                  className="send-button"
                  type="button"
                  disabled={!singleSelectionReady}
                  onClick={beginServiceQuestions}
                >
                  開始確認需求 →
                </button>
              </div>
            </div>
          </div>
        );
      case "quantity":
        return (
          <form className="quantity-form" onSubmit={submitQuantities}>
            <div className="quantity-list">
              {initialQuantityServices.map((item, index) => (
                <label className="quantity-item" key={item.id}>
                  <span>{item.name}</span>
                  <span className="quantity-input-wrap">
                    <select
                      autoFocus={index === 0}
                      value={answers.quantities[item.id] || ""}
                      onChange={(event) => setAnswers((current) => ({
                        ...current,
                        quantities: {
                          ...current.quantities,
                          [item.id]: Math.max(0, Math.round(Number(event.target.value))),
                        },
                      }))}
                    >
                      <option value="" disabled>請選擇</option>
                      {requiredQuantityOptions.map((count) => <option key={count} value={count}>{count}</option>)}
                    </select>
                    <span>{item.unit}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="standalone-actions">
              <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
              <button className="send-button quantity-submit" type="submit" disabled={initialQuantityServices.length === 0 || initialQuantityServices.some((item) => (answers.quantities[item.id] || 0) < 1)}>
                繼續 →
              </button>
            </div>
          </form>
        );
      case "ecommerceDetails": {
        if (!activeEcommerceService) return null;
        const detail = answers.ecommerceDesignDetails[activeEcommerceService.id] ?? {};
        const placementOptions = getEcommercePlacementOptions(activeEcommerceService.id);
        const sizeOptions = getEcommerceSizeOptions(activeEcommerceService.id);
        const activeUnit = getServiceUnit(activeEcommerceService, answers);
        const missingFields = getMissingEcommerceDetailFields(activeEcommerceService, detail, answers);
        const isComplete = missingFields.length === 0;
        const hasError = (field: EcommerceDetailField) => ecommerceDetailErrors.includes(field);
        const fieldClassName = (field: EcommerceDetailField) => `compact-field${hasError(field) ? " has-error" : ""}`;
        const errorMessage = (field: EcommerceDetailField) => hasError(field) ? <small className="field-error">請填寫此欄位</small> : null;
        const isLastSingleSpecification = getNextSingleSpecificationDestination(activeEcommerceService.id, answers, Array.from(new Set([...confirmedSingleServiceIds, activeEcommerceService.id]))).step === "sourceFile";
        return (
          <div className={`compact-card specification-card single-specification-card${isSingleSpecificationAdvancing ? " is-collapsing" : ""}`} ref={ecommerceDetailsRef}>
            <div className="compact-card-heading">
              <div>
                <strong>{activeEcommerceService.name}必要規格</strong>
                <span>{getSpecificationPositionLabel(activeEcommerceService.id)}</span>
              </div>
            </div>

            {renderSpecificationServiceSwitcher(activeEcommerceService.id)}
            {renderSharedScheduleNote(activeEcommerceService.id)}

            <fieldset className="compact-section compact-section-primary">
              <legend>先確認這些</legend>
              <div className="compact-grid">
                {activeEcommerceService.id === "social" ? (
                  <div className={`${fieldClassName("quantity")} compact-field-wide`} data-field="quantity">
                    <span>貼文篇數</span>
                    <input aria-label="貼文篇數" aria-invalid={hasError("quantity")} inputMode="numeric" type="number" min="1" max="50" value={answers.socialPostCount ?? ""} onChange={(event) => updateSocialPostCount(event.target.value)} />
                    {(answers.socialPostCount ?? 0) > 0 && (
                      <div className="social-post-counts">
                        {Array.from({ length: answers.socialPostCount ?? 0 }, (_, index) => (
                          <label key={index}>
                            <span>第 {index + 1} 篇貼文</span>
                            <span className="social-post-input"><input aria-label={`第 ${index + 1} 篇貼文圖片張數`} inputMode="numeric" type="number" min="1" max={SOCIAL_IMAGES_PER_POST_LIMIT} value={answers.socialPostImageCounts?.[index] ?? ""} onChange={(event) => updateSocialPostImageCount(index, event.target.value)} /><em>張圖</em></span>
                          </label>
                        ))}
                      </div>
                    )}
                    <small className="compact-note">先填篇數，再填每篇圖數；每篇最多 10 張圖，第 2 張起採延伸價，總圖 10 張以上 9.5 折。</small>
                    {errorMessage("quantity")}
                  </div>
                ) : activeEcommerceService.id === "product-frame" ? (
                  <div className={`${fieldClassName("quantity")} compact-field-wide`} data-field="quantity">
                    <span>圖框版型數</span>
                    <input aria-label="圖框版型數" aria-invalid={hasError("quantity")} inputMode="numeric" type="number" min="1" max="50" value={answers.quantities[activeEcommerceService.id] ?? ""} onChange={(event) => updateActiveEcommerceQuantity(event.target.value)} />
                    {(answers.quantities["product-frame"] ?? 0) > 0 && (
                      <div className="social-post-counts product-frame-product-counts">
                        {Array.from({ length: answers.quantities["product-frame"] ?? 0 }, (_, index) => (
                          <label key={index}>
                            <span>第 {index + 1} 版圖框</span>
                            <span className="social-post-input"><input aria-label={`第 ${index + 1} 版圖框產品數量`} inputMode="numeric" type="number" min="1" max="99" value={answers.productFrameProductCounts?.[index] ?? ""} onChange={(event) => updateProductFrameProductCount(index, event.target.value)} /><em>項產品</em></span>
                          </label>
                        ))}
                      </div>
                    )}
                    <small className="compact-note">先填版型數，再填每版套用的產品數；每版含 1 項產品，每追加 1 項／+$70。</small>
                    {errorMessage("quantity")}
                  </div>
                ) : (
                  <label className={fieldClassName("quantity")} data-field="quantity"><span>{getEcommerceDetailFieldLabel(activeEcommerceService, "quantity")}</span>{activeEcommerceService.id === "reel" ? <input aria-invalid={hasError("quantity")} inputMode="numeric" type="number" min="1" max="999" value={answers.quantities[activeEcommerceService.id] ?? ""} onChange={(event) => updateActiveEcommerceQuantity(event.target.value)} /> : <select aria-invalid={hasError("quantity")} value={answers.quantities[activeEcommerceService.id] ?? ""} onChange={(event) => updateActiveEcommerceQuantity(event.target.value)}><option value="" disabled>請選擇</option>{(activeEcommerceService.id === "banner" ? requiredQuantityOptions.slice(0, BANNER_MAIN_VISUAL_LIMIT) : requiredQuantityOptions).map((count) => <option key={count} value={count}>{count} {activeUnit}</option>)}</select>}{errorMessage("quantity")}</label>
                )}
                {activeEcommerceService.id === "banner" && (
                  <div className="compact-field compact-field-wide" data-field="bannerExtensionCount">
                    <span>主視覺延伸加購 <small>（選填）</small></span>
                    <label className="banner-extension-quantity">
                      <span>延伸張數</span>
                      <select aria-label="主視覺延伸張數" value={(detail.bannerExtensionCount ?? 0) > 0 ? detail.bannerExtensionCount : ""} onChange={(event) => updateActiveEcommerceDetail({ bannerExtensionCount: event.target.value ? Math.max(1, Math.round(Number(event.target.value))) : undefined })}>
                        <option value="">不需要則免填</option>
                        {requiredQuantityOptions.map((count) => <option key={count} value={count}>{count} 張</option>)}
                      </select>
                    </label>
                    <small className="compact-note">不需要可以留空；加購會沿用這次主視覺，做成不同尺寸的系列稿，不是重新設計。</small>
                  </div>
                )}
              </div>
            </fieldset>

            <details className="optional-details">
              <summary><span>其他細節可稍後確認</span><small>平台、尺寸、素材與製作方式（選填）</small></summary>
              <div className="optional-details-body">
                <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                <div className="compact-helpers"><button type="button" onClick={applyCommonEcommerceSettings}>快速填入：素材都準備好了</button></div>
                <fieldset className={`compact-section${hasError("placement") ? " has-error" : ""}`} data-field="placement">
                  <legend>這張圖要放在哪裡？</legend>
                  <div className="compact-purpose-grid">
                    {placementOptions.map((option) => (
                      <label className={`compact-check${detail.placement === option.value ? " selected" : ""}`} key={option.value}>
                        <input type="radio" name={`ecommerce-placement-${activeEcommerceService.id}`} checked={detail.placement === option.value} onChange={() => updateActiveEcommerceDetail({ placement: option.value })} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="compact-grid">
                  <label className={fieldClassName("size")} data-field="size"><span>需要什麼尺寸？</span><select value={detail.size ?? ""} onChange={(event) => updateActiveEcommerceDetail({ size: event.target.value })}><option value="">稍後確認</option>{sizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className={fieldClassName("copyStatus")} data-field="copyStatus"><span>文字內容準備好了嗎？</span><select value={detail.copyStatus ?? ""} onChange={(event) => updateActiveEcommerceDetail({ copyStatus: event.target.value as EcommerceCopyStatus })}><option value="">稍後確認</option>{(Object.entries(ecommerceCopyStatusLabels) as [EcommerceCopyStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className={fieldClassName("assetStatus")} data-field="assetStatus"><span>Logo 和圖片準備好了嗎？</span><select value={detail.assetStatus ?? ""} onChange={(event) => updateActiveEcommerceDetail({ assetStatus: event.target.value as EcommerceAssetStatus })}><option value="">稍後確認</option>{(Object.entries(ecommerceAssetStatusLabels) as [EcommerceAssetStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  {activeEcommerceService.id !== "banner" && <label className={fieldClassName("versionCount")} data-field="versionCount"><span>還需要幾個同版版本？ <small>只換文字或圖片</small></span><input type="number" min="0" max="99" placeholder="沒有就留空" value={detail.versionCount ?? ""} onChange={(event) => updateActiveEcommerceDetail({ versionCount: parseOptionalPositiveInteger(event.target.value) })} /></label>}
                  <label className={fieldClassName("visualLevel")} data-field="visualLevel"><span>想要多精緻？</span><select value={detail.visualLevel ?? ""} onChange={(event) => updateActiveEcommerceDetail({ visualLevel: event.target.value as Complexity })}><option value="">稍後確認</option>{getEcommerceVisualLevelOptions(activeEcommerceService.id).map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
                </div>
              </div>
            </details>

            <div className="compact-card-footer">
              <span>{ecommerceDetailErrors.length > 0 ? `請補填：${ecommerceDetailErrors.map((field) => getEcommerceDetailFieldLabel(activeEcommerceService, field)).join("、")}` : isComplete ? "必填已完成" : "請完成必填欄位"}</span>
              <div className="compact-card-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="button" disabled={isSingleSpecificationAdvancing} onClick={confirmEcommerceDetails}>{isLastSingleSpecification ? "確認規格與加購 →" : "完成這項，下一項 →"}</button>
              </div>
            </div>
          </div>
        );
      }
      case "printDetails": {
        if (!activeDetailedService) return null;
        const detail = answers.printDesignDetails[activeDetailedService.id] ?? {};
        const purposeOptions = getPrintPurposeOptions(activeDetailedService.id);
        const selectedPurposes = detail.purposes ?? [];
        const acceptsPageCount = requiresManualPrintPageCount(detail.structure);
        const minimumPageCount = getMinimumPrintPageCount(activeDetailedService.id, detail.structure);
        const pageCount = Math.max(0, answers.quantities[activeDetailedService.id] ?? 0);
        const missingFields = getMissingPrintDetailFields(activeDetailedService.id, detail, pageCount);
        const isComplete = missingFields.length === 0;
        const hasError = (field: PrintDetailField) => printDetailErrors.includes(field);
        const fieldClassName = (field: PrintDetailField) => `compact-field${hasError(field) ? " has-error" : ""}`;
        const errorMessage = (field: PrintDetailField) => hasError(field) ? <small className="field-error">請填寫此欄位</small> : null;
        const isLastSingleSpecification = getNextSingleSpecificationDestination(activeDetailedService.id, answers, Array.from(new Set([...confirmedSingleServiceIds, activeDetailedService.id]))).step === "sourceFile";
        return (
          <div className={`compact-card specification-card single-specification-card${isSingleSpecificationAdvancing ? " is-collapsing" : ""}`} ref={printDetailsRef}>
            <div className="compact-card-heading">
              <div>
                <strong>{activeDetailedService.name}必要規格</strong>
                <span>{getSpecificationPositionLabel(activeDetailedService.id)}</span>
              </div>
              <div className="compact-helpers">
                {(answers.printDetailIndex ?? 0) > 0 && <button type="button" onClick={copyPreviousPrintSettings}>沿用上一項規格</button>}
                <button type="button" onClick={applyCommonPrintSettings}>套用常見尺寸</button>
              </div>
            </div>

            {renderSpecificationServiceSwitcher(activeDetailedService.id)}
            {renderSharedScheduleNote(activeDetailedService.id)}

            <fieldset className="compact-section compact-section-primary">
              <legend>先確認這些</legend>
              <div className="compact-grid">
                <label className={fieldClassName("structure")} data-field="structure"><span>要做單面、雙面、折頁還是多頁？</span><select aria-invalid={hasError("structure")} value={detail.structure ?? ""} onChange={(event) => updateActivePrintDetail({ structure: event.target.value as PrintStructure, customPageCount: event.target.value === "multipage" ? detail.customPageCount : undefined, fold: event.target.value === "folded" ? detail.fold : undefined })}><option value="" disabled>請選擇</option>{getPrintStructureOptions(activeDetailedService.id).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{errorMessage("structure")}</label>
                {acceptsPageCount && (
                  <label className={fieldClassName("pageCount")} data-field="pageCount">
                    <span>一共需要設計幾頁？ <small>含封面、封底</small></span>
                    <select
                      aria-invalid={hasError("pageCount")}
                      value={detail.customPageCount || (answers.quantities[activeDetailedService.id] ?? 0) > 10 ? "custom" : answers.quantities[activeDetailedService.id] ?? ""}
                      onChange={(event) => {
                        if (event.target.value === "custom") {
                          updateActivePrintDetail({ customPageCount: true });
                          updateActivePrintPageCount("");
                          return;
                        }
                        updateActivePrintDetail({ customPageCount: undefined });
                        updateActivePrintPageCount(event.target.value);
                      }}
                    >
                      <option value="" disabled>請選擇</option>
                      {requiredPageCountOptions.filter((count) => count >= minimumPageCount).map((count) => <option key={count} value={count}>{count} 頁</option>)}
                      <option value="custom">自訂頁數</option>
                    </select>
                    {(detail.customPageCount || (answers.quantities[activeDetailedService.id] ?? 0) > 10) && (
                      <input
                        className="custom-page-count-input"
                        aria-label="自訂總設計頁數"
                        aria-invalid={hasError("pageCount")}
                        inputMode="numeric"
                        type="number"
                        min={minimumPageCount}
                        max="999"
                        placeholder="請輸入實際頁數"
                        value={answers.quantities[activeDetailedService.id] ?? ""}
                        onChange={(event) => updateActivePrintPageCount(event.target.value)}
                      />
                    )}
                    {errorMessage("pageCount")}
                  </label>
                )}
                {detail.structure === "folded" && (
                  <div className={`${fieldClassName("fold")} compact-field-wide`} data-field="fold">
                    <span>想用哪一種折法？ <small>點選圖例</small></span>
                    <div className="fold-option-grid" aria-label="折頁方式示意圖">
                      {(Object.entries(printFoldLabels) as [PrintFold, string][]).map(([value, label]) => (
                        <FoldChoice key={value} fold={value} label={label} selected={detail.fold === value} onClick={() => updateActivePrintDetail({ fold: value })} />
                      ))}
                    </div>
                    {errorMessage("fold")}
                  </div>
                )}
              </div>
            </fieldset>

            <details className="optional-details">
              <summary><span>其他細節可稍後確認</span><small>用途、尺寸、素材與完成時間（選填）</small></summary>
              <div className="optional-details-body">
                <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                <fieldset className={`compact-section${hasError("purposes") ? " has-error" : ""}`} data-field="purposes">
                  <legend>這份設計要用在哪裡？</legend>
                  <div className="compact-purpose-grid">
                    {purposeOptions.map((option) => (
                      <label className={`compact-check${selectedPurposes.includes(option.value) ? " selected" : ""}`} key={option.value}>
                        <input type="radio" name={`purpose-${activeDetailedService.id}`} checked={selectedPurposes.includes(option.value)} onChange={() => selectPrintPurpose(option.value)} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="compact-grid">
                  <label className={fieldClassName("format")} data-field="format"><span>需要什麼尺寸？</span><select value={detail.format ?? ""} onChange={(event) => updateActivePrintDetail({ format: event.target.value as PrintFormat })}><option value="">稍後確認</option>{(Object.entries(printFormatLabels) as [PrintFormat, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className={fieldClassName("contentStatus")} data-field="contentStatus"><span>文字內容準備好了嗎？</span><select value={detail.contentStatus ?? ""} onChange={(event) => updateActivePrintDetail({ contentStatus: event.target.value as ContentStatus })}><option value="">稍後確認</option>{(Object.entries(contentStatusLabels) as [ContentStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className={fieldClassName("imageStatus")} data-field="imageStatus"><span>Logo 和圖片準備好了嗎？</span><select value={detail.imageStatus ?? ""} onChange={(event) => updateActivePrintDetail({ imageStatus: event.target.value as ImageStatus })}><option value="">稍後確認</option>{(Object.entries(imageStatusLabels) as [ImageStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className={fieldClassName("versionCount")} data-field="versionCount"><span>還需要幾個同版版本？ <small>只換文字或圖片</small></span><input type="number" min="0" max="99" placeholder="沒有就留空" value={detail.versionCount ?? ""} onChange={(event) => updateActivePrintDetail({ versionCount: parseOptionalPositiveInteger(event.target.value) })} /></label>
                  <label className={fieldClassName("complexity")} data-field="complexity"><span>想要多精緻？</span><select value={detail.complexity ?? ""} onChange={(event) => updateActivePrintDetail({ complexity: event.target.value as Complexity })}><option value="">稍後確認</option>{(Object.entries(complexityLabels) as [Complexity, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                  <label className="compact-field"><span>希望什麼時候完成？</span><input type="date" value={detail.deadline ?? ""} onChange={(event) => updateActivePrintDetail({ deadline: event.target.value || undefined })} /></label>
                </div>
              </div>
            </details>

            <div className="compact-card-footer">
              <span>{printDetailErrors.length > 0 ? `請補填：${printDetailErrors.map((field) => printDetailFieldLabels[field]).join("、")}` : isComplete ? "必填已完成" : "請完成必填欄位"}</span>
              <div className="compact-card-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="button" disabled={isSingleSpecificationAdvancing} onClick={confirmPrintDetails}>{isLastSingleSpecification ? "確認規格與加購 →" : "完成這項，下一項 →"}</button>
              </div>
            </div>
          </div>
        );
      }
      case "serviceDetails": {
        if (!activeServiceDetailService) return null;
        const config = getServiceDetailConfig(activeServiceDetailService.id);
        if (!config) return null;
        const detail = answers.serviceDesignDetails[activeServiceDetailService.id] ?? {};
        const isOptionalQuantity = Boolean(config.quantityOptional);
        const displayedQuantity = isOptionalQuantity
          ? Math.max(0, (answers.quantities[activeServiceDetailService.id] ?? 1) - 1) || ""
          : answers.quantities[activeServiceDetailService.id] ?? "";
        const posterSeriesCount = activeServiceDetailService.id === "poster"
          ? Math.max(0, (answers.quantities.poster ?? 1) - 1) || ""
          : "";
        const missingFields = getMissingServiceDetailFields(activeServiceDetailService, detail, answers);
        const isComplete = missingFields.length === 0;
        const hasError = (field: ServiceDetailField) => serviceDetailErrors.includes(field);
        const fieldClassName = (field: ServiceDetailField) => `compact-field${hasError(field) ? " has-error" : ""}`;
        const errorMessage = (field: ServiceDetailField) => hasError(field) ? <small className="field-error">請填寫此欄位</small> : null;
        const isLastSingleSpecification = getNextSingleSpecificationDestination(activeServiceDetailService.id, answers, Array.from(new Set([...confirmedSingleServiceIds, activeServiceDetailService.id]))).step === "sourceFile";
        return (
          <div className={`compact-card specification-card single-specification-card${isSingleSpecificationAdvancing ? " is-collapsing" : ""}`} ref={serviceDetailsRef}>
            <div className="compact-card-heading">
              <div>
                <strong>{activeServiceDetailService.name}必要規格</strong>
                <span>{getSpecificationPositionLabel(activeServiceDetailService.id)}</span>
              </div>
            </div>

            {renderSpecificationServiceSwitcher(activeServiceDetailService.id)}
            {renderSharedScheduleNote(activeServiceDetailService.id)}

            <fieldset className="compact-section compact-section-primary">
              <legend>先確認這些</legend>
              <div className={`compact-grid${activeServiceDetailService.id === "card" ? " card-required-grid" : ""}`}>
                {activeServiceDetailService.id === "poster" && <div className={fieldClassName("seriesArtwork")} data-field="seriesArtwork"><span>要做單款，還是同系列多款？</span><select aria-invalid={hasError("seriesArtwork")} aria-label="海報款數" value={detail.seriesArtwork ?? ""} onChange={(event) => updatePosterSeriesArtwork(event.target.value as "none" | "yes")}><option value="" disabled>請選擇</option><option value="none">只做 1 款</option><option value="yes">同系列做多款</option></select>{detail.seriesArtwork === "yes" && <><span>還要延伸幾款？</span><select aria-invalid={hasError("seriesArtwork")} aria-label="系列海報延伸款數" value={posterSeriesCount} onChange={(event) => updatePosterSeriesCount(event.target.value)}><option value="" disabled>請選擇</option>{requiredQuantityOptions.slice(0, 9).map((count) => <option key={count} value={count}>再做 {count} 款（共 {count + 1} 款）</option>)}</select></>}{errorMessage("seriesArtwork")}</div>}
                {!config.hideQuantity && activeServiceDetailService.id !== "card" && activeServiceDetailService.id !== "poster" && <label className={fieldClassName("quantity")} data-field="quantity"><span>{config.quantityLabel} {config.quantityNote && <small>（{config.quantityNote}）</small>}</span>{config.quantityCustom ? <input aria-label={`${activeServiceDetailService.name}自訂數量`} aria-invalid={hasError("quantity")} inputMode="numeric" type="number" min="1" max={PHOTO_QUANTITY_LIMIT} placeholder="輸入數量" value={displayedQuantity} onChange={(event) => updateActiveServiceQuantity(event.target.value)} /> : config.quantityOptional ? <input aria-invalid={hasError("quantity")} inputMode="numeric" type="number" min="0" max="999" placeholder="無則留空" value={displayedQuantity} onChange={(event) => updateActiveServiceQuantity(event.target.value)} /> : <select aria-invalid={hasError("quantity")} value={displayedQuantity} onChange={(event) => updateActiveServiceQuantity(event.target.value)}><option value="" disabled>請選擇</option>{requiredQuantityOptions.map((count) => <option key={count} value={count}>{count} {activeServiceDetailService.unit}</option>)}</select>}{errorMessage("quantity")}</label>}
                {activeServiceDetailService.id === "card" && <label className={fieldClassName("specification")} data-field="specification"><span>{config.specificationLabel}</span><select aria-invalid={hasError("specification")} value={detail.specification ?? ""} onChange={(event) => updateActiveServiceDetail({ specification: event.target.value })}><option value="" disabled>請選擇</option>{config.specificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{errorMessage("specification")}</label>}
              </div>
            </fieldset>

            <details className="optional-details">
              <summary><span>其他細節可稍後確認</span><small>用途、素材與製作方式（選填）</small></summary>
              <div className="optional-details-body">
                <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                <div className="compact-helpers"><button type="button" onClick={applyCommonServiceSettings}>{activeServiceDetailService.id === "photo" ? "快速填入常見修圖設定" : "快速填入常見設定"}</button></div>
                <fieldset className={`compact-section${hasError("purpose") ? " has-error" : ""}`} data-field="purpose">
                  <legend>{config.purposeLabel}（單選）</legend>
                  <div className="compact-purpose-grid">
                    {config.purposeOptions.map((option) => (
                      <label className={`compact-check${detail.purpose === option.value ? " selected" : ""}`} key={option.value}>
                        <input type="radio" name={`service-purpose-${activeServiceDetailService.id}`} checked={detail.purpose === option.value} onChange={() => updateActiveServiceDetail({ purpose: option.value })} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="compact-grid">
                  {activeServiceDetailService.id === "card" && <label className="compact-field"><span>{config.quantityLabel} {config.quantityNote && <small>（{config.quantityNote}）</small>}</span><input inputMode="numeric" type="number" min="0" max="999" placeholder="無則留空" value={displayedQuantity} onChange={(event) => updateActiveServiceQuantity(event.target.value)} /></label>}
                  {activeServiceDetailService.id !== "card" && <label className={fieldClassName("specification")} data-field="specification"><span>{config.specificationLabel}</span><select value={detail.specification ?? ""} onChange={(event) => updateActiveServiceDetail({ specification: event.target.value })}><option value="">稍後確認</option>{config.specificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
                  <label className={fieldClassName("contentStatus")} data-field="contentStatus"><span>{config.contentLabel}</span><select value={detail.contentStatus ?? ""} onChange={(event) => updateActiveServiceDetail({ contentStatus: event.target.value })}><option value="">稍後確認</option>{config.contentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className={fieldClassName("assetStatus")} data-field="assetStatus"><span>{config.assetLabel}</span><select value={detail.assetStatus ?? ""} onChange={(event) => updateActiveServiceDetail({ assetStatus: event.target.value })}><option value="">稍後確認</option>{config.assetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className={fieldClassName("complexity")} data-field="complexity"><span>想要多精緻？</span><select value={detail.complexity ?? ""} onChange={(event) => updateActiveServiceDetail({ complexity: event.target.value as Complexity })}><option value="">稍後確認</option>{config.complexityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                </div>
              </div>
            </details>

            <div className="compact-card-footer">
              <span>{serviceDetailErrors.length > 0 ? `請補填：${serviceDetailErrors.map((field) => serviceDetailFieldLabels[field]).join("、")}` : isComplete ? "必填已完成" : "請完成必填欄位"}</span>
              <div className="compact-card-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="button" disabled={isSingleSpecificationAdvancing} onClick={confirmServiceDetails}>{isLastSingleSpecification ? "確認規格與加購 →" : "完成這項，下一項 →"}</button>
              </div>
            </div>
          </div>
        );
      }
      case "printPurpose": {
        const selectedPurposes = activeDetailedService
          ? answers.printDesignDetails[activeDetailedService.id]?.purposes ?? []
          : [];
        return (
          <div className="multi-select-wrap">
            <div className="choices">
              {getPrintPurposeOptions(activeDetailedService?.id).map((option) => (
                <OptionButton
                  key={option.value}
                  label={option.label}
                  detail={option.detail}
                  selected={selectedPurposes.includes(option.value)}
                  onClick={() => selectPrintPurpose(option.value)}
                />
              ))}
            </div>
            <div className="multi-select-footer">
              <span>{selectedPurposes.length > 0 ? "已選擇主要用途" : "請選擇 1 項主要用途"}</span>
              <div className="multi-select-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="button" disabled={selectedPurposes.length === 0} onClick={confirmPrintPurposes}>
                  確認用途 →
                </button>
              </div>
            </div>
          </div>
        );
      }
      case "printFormat":
        return (
          <div className="choices">
            {(Object.entries(printFormatLabels) as [PrintFormat, string][]).map(([value, label]) => (
              <OptionButton key={value} label={label} onClick={() => selectPrintFormat(value, label)} />
            ))}
          </div>
        );
      case "printStructure":
        return (
          <div className="choices two-columns">
            {getPrintStructureOptions(activeDetailedService?.id).map(([value, label]) => (
              <OptionButton
                key={value}
                label={label}
                detail={value === "single" ? "單一面設計" : value === "double" ? "正反兩面" : value === "folded" ? "含折線與分區編排" : "多頁編排"}
                onClick={() => selectPrintStructure(value, label)}
              />
            ))}
          </div>
        );
      case "printFold":
        return (
          <div className="fold-option-grid fold-option-grid-conversation" aria-label="折頁方式示意圖">
            {(Object.entries(printFoldLabels) as [PrintFold, string][]).map(([value, label]) => (
              <FoldChoice key={value} fold={value} label={label} onClick={() => selectPrintFold(value, label)} />
            ))}
          </div>
        );
      case "contentStatus":
        return (
          <div className="choices">
            <OptionButton label="已定稿" detail="內容可直接排版" onClick={() => selectContentStatus("final", contentStatusLabels.final)} />
            <OptionButton label="已有內容，仍需整理" detail="分類、順序或少量文字待確認" onClick={() => selectContentStatus("partial", contentStatusLabels.partial)} />
            <OptionButton label="需要協助文案整理" detail="需協助濃縮、改寫或建立資訊層級" onClick={() => selectContentStatus("need-copy", contentStatusLabels["need-copy"])} />
          </div>
        );
      case "imageStatus":
        return (
          <div className="choices">
            <OptionButton label="圖片皆已備妥" detail="照片解析度足夠，可直接使用" onClick={() => selectImageStatus("ready", imageStatusLabels.ready)} />
            <OptionButton label="需要去背／調色／修圖" detail="已有圖片，但需要後製整理" onClick={() => selectImageStatus("need-edit", imageStatusLabels["need-edit"])} />
            <OptionButton label="需要協助尋找或製作圖片" detail="尚無合適圖片，需另外確認來源與授權" onClick={() => selectImageStatus("need-images", imageStatusLabels["need-images"])} />
          </div>
        );
      case "versionCount":
        return (
          <form className="number-form" onSubmit={submitNumber}>
            <label>
              <span className="sr-only">延伸版本</span>
              <input autoFocus inputMode="numeric" min="0" max="99" placeholder="無則留空" type="number" value={inputValue} onChange={(event) => setInputValue(parseOptionalPositiveInteger(event.target.value)?.toString() ?? "")} />
              <span className="input-unit">個延伸版本</span>
            </label>
            <div className="number-form-actions">
              <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
              <button className="send-button" type="submit" disabled={Boolean(inputValue) && Number(inputValue) <= 0}>繼續 →</button>
            </div>
          </form>
        );
      case "complexity":
        return (
          <div className="choices">
            <OptionButton label="清楚簡約" detail="資訊單純、留白與基本編排" onClick={() => selectComplexity("simple", complexityLabels.simple)} />
            <OptionButton label="一般品牌感" detail="兼顧品牌風格與資訊層次" onClick={() => selectComplexity("standard", complexityLabels.standard)} />
            <OptionButton label="精緻／高複雜度" detail="多素材、合成或細節較多" onClick={() => selectComplexity("detailed", complexityLabels.detailed)} />
          </div>
        );
      case "materials":
        return (
          <div className="choices">
            <OptionButton label="文字與圖片皆備妥" detail="可直接進入設計排程" onClick={() => selectMaterials("ready")} />
            <OptionButton label="已有部分素材" detail="仍有少量內容待整理" onClick={() => selectMaterials("partial")} />
            <OptionButton label="需要協助整理" detail="希望一起確認素材需求" onClick={() => selectMaterials("need-help")} />
          </div>
        );
      case "timeline": {
        const timelineServiceId = activeEcommerceService?.id ?? activeDetailedService?.id ?? activeServiceDetailService?.id;
        return (
          <div className="choices">
            <OptionButton label={getServiceTimelineSummary(timelineServiceId)} detail="實際時間視當時排程及設計複雜程度而定" onClick={() => selectTimeline("regular", getServiceTimelineLabel(timelineServiceId))} />
          </div>
        );
      }
      case "printDeadline":
        return (
          <div className="budget-controls">
            <form className="number-form" onSubmit={submitPrintDeadline}>
              <label>
                <span className="sr-only">印刷完稿期限</span>
                <input autoFocus type="date" value={inputValue} onChange={(event) => setInputValue(event.target.value)} />
              </label>
              <div className="number-form-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="submit" disabled={!inputValue}>繼續 →</button>
              </div>
            </form>
            <button className="skip-button" type="button" onClick={() => completePrintDeadline(undefined)}>尚未確定期限</button>
          </div>
        );
      case "monthlyServices":
      case "monthlySpecifications": {
        const isMonthlySpecificationStep = step === "monthlySpecifications";
        if (!isMonthlySpecificationStep) {
          const monthlySelectionStatus = answers.serviceIds.length === 0
            ? "先選一項服務，系統會自動計算月方案組數"
            : monthlyPrintGroupCount > 2
            ? `平面設計已選 ${formatGroupAmount(monthlyPrintGroupCount)} 組，月方案最多 2 組；其他需求可另做單次估價`
            : monthlyAllocatedGroupCount > 10
            ? `目前超過 10 組，請減少 ${formatGroupAmount(monthlyAllocatedGroupCount - 10)} 組`
            : monthlyAllocatedGroupCount < monthlyMinimumGroupCount
            ? `目前 ${formatGroupAmount(monthlyAllocatedGroupCount)} 組，再 ${formatGroupAmount(monthlyMinimumGroupCount - monthlyAllocatedGroupCount)} 組即可使用月方案`
            : monthlyPreviewPlan
            ? `目前符合${monthlyPreviewPlan.name}・${formatMonthlyDiscount(getMonthlyDiscountRate(Math.round(monthlyAllocatedGroupCount)))}`
            : "請確認每項服務數量";
          return (
            <div className="multi-select-wrap monthly-service-selector">
              <div className={`monthly-allocation-status monthly-selection-status${monthlyRulesComplete ? " is-complete" : ""}`} aria-live="polite">
                <span>每月 <strong>{formatGroupAmount(monthlyAllocatedGroupCount)}</strong> 組</span>
                <span>{monthlySelectionStatus}</span>
              </div>
              <div className="monthly-plan-progress" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, monthlyAllocatedGroupCount / 10 * 100))}%` }} />
              </div>
              <div className="service-category-list">
                {monthlyServiceGroups.map((group) => {
                  const isExpanded = expandedServiceCategory === group.key;
                  const selectedCount = group.serviceIds.filter((serviceId) => answers.serviceIds.includes(serviceId)).length;
                  return (
                    <section className={`service-category-panel${isExpanded ? " is-open" : ""}`} key={group.key}>
                      <button
                        className="service-category-trigger"
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`monthly-service-list-${group.key}`}
                        onClick={() => setExpandedServiceCategory(isExpanded ? null : group.key)}
                      >
                        <span className="service-category-copy">
                          <strong>{group.label}</strong>
                          <small>{group.detail}</small>
                        </span>
                        <span className="service-category-status">
                          {selectedCount > 0 ? `已選 ${selectedCount} 項` : isExpanded ? "收合" : "查看項目"}
                          <span className="service-category-chevron" aria-hidden="true">⌄</span>
                        </span>
                      </button>
                      <div
                        className={`service-category-reveal${isExpanded ? " is-open" : ""}`}
                        id={`monthly-service-list-${group.key}`}
                        aria-hidden={!isExpanded}
                        inert={!isExpanded}
                      >
                        <div className="service-category-reveal-inner">
                          <div className="choices service-choices service-category-items">
                            {services
                              .filter((item) => group.serviceIds.includes(item.id))
                              .map((item) => {
                                const isSelected = answers.serviceIds.includes(item.id);
                                const quantity = Math.max(0, answers.quantities[item.id] ?? 0);
                                const maximumQuantity = item.id === "banner" ? BANNER_MAIN_VISUAL_LIMIT : item.category === "print" ? 2 : 10;
                                const unitHint = item.id === "social"
                                  ? "每 1 篇貼文計為 1 組"
                                  : `每 1 ${item.unit}計為 1 組${item.category === "print" ? "，平面設計每月最多 2 組" : ""}`;
                                return (
                                  <div className={`monthly-service-picker${isSelected ? " is-selected" : ""}`} key={item.id}>
                                    <OptionButton
                                      label={item.name}
                                      detail={item.description}
                                      note={item.note}
                                      price={getServiceDisplayPrice(item)}
                                      selected={isSelected}
                                      multiple
                                      onClick={() => toggleMonthlyService(item.id)}
                                    />
                                    {isSelected && (
                                      <div className="monthly-service-picker-quantity">
                                        <span><strong>這項每月大約需要幾次？</strong><small>{unitHint}</small></span>
                                        <span className="monthly-quantity-stepper">
                                          <button type="button" aria-label={`減少 ${item.name}數量`} disabled={quantity <= 1} onClick={() => adjustMonthlyServiceQuantity(item.id, -1)}>−</button>
                                          <output aria-label={`${item.name}目前數量`}>{quantity}</output>
                                          <button type="button" aria-label={`增加 ${item.name}數量`} disabled={quantity >= maximumQuantity} onClick={() => adjustMonthlyServiceQuantity(item.id, 1)}>＋</button>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="multi-select-footer">
                <span>{monthlySelectionStatus}</span>
                <div className="multi-select-actions">
                  <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                  <button className="send-button" type="button" disabled={!monthlyRulesComplete} onClick={confirmMonthlyServiceSelection}>確認數量與項目 →</button>
                </div>
              </div>
            </div>
          );
        }
        if (!activeMonthlySpecificationService) return null;
        const activeMonthlyServiceComplete = isMonthlySpecificationServiceComplete(activeMonthlySpecificationService);
        const isLastMonthlySpecification = activeMonthlySpecificationIndex === selectedServices.length - 1;
        return (
          <div className="monthly-services-wrap">
            <div
              className={`compact-card specification-card monthly-specification-card${isMonthlySpecificationAdvancing ? " is-collapsing" : ""}`}
              key={activeMonthlySpecificationService.id}
            >
              <div className="compact-card-heading">
                <div>
                  <strong>{activeMonthlySpecificationService.name}必要規格</strong>
                  <span>第 {activeMonthlySpecificationIndex + 1} 項／共 {selectedServices.length} 項</span>
                </div>
              </div>
              {renderMonthlySpecificationServiceSwitcher(activeMonthlySpecificationService.id)}
              <details className="optional-details monthly-pricing-rules">
                <summary>查看計價規則</summary>
                <p>每項服務數量計 1 組，IG／FB 社群圖文以每篇計 1 組；每月至少 3 組、最多 10 組，平面設計每月合計限 2 組。網站主視覺延伸與宣傳單／菜單多頁套用月方案優惠；商品主圖追加產品按單次價格另計，不套用月方案折扣。</p>
              </details>
              <div className={`monthly-allocation-status${monthlySpecificationsComplete ? " is-complete" : ""}`} aria-live="polite">
                <span>已選 <strong>{formatGroupAmount(monthlyAllocatedGroupCount)}</strong> 組</span>
                <span>{monthlyMissingDetailLabels.length > 0
                  ? `待填：${monthlyMissingDetailLabels.join("、")}`
                  : !monthlyQuantityComplete
                  ? "請設定每項服務數量"
                  : monthlyAllocatedGroupCount < monthlyMinimumGroupCount
                  ? `尚差 ${formatGroupAmount(monthlyMinimumGroupCount - monthlyAllocatedGroupCount)} 組，月方案至少需 ${monthlyMinimumGroupCount} 組`
                  : monthlyAllocatedGroupCount > 10
                  ? `目前超過 10 組，請減少 ${formatGroupAmount(monthlyAllocatedGroupCount - 10)} 組`
                  : monthlyPrintGroupCount > 2
                  ? `平面設計目前 ${formatGroupAmount(monthlyPrintGroupCount)} 組，月方案上限為 2 組`
                  : "規格完成，下一步評估適用方案"}</span>
              </div>
              {monthlyPreviewPlan && (
                <div className="monthly-plan-preview" aria-label="目前適用月方案">
                  <span>目前適用</span>
                  <strong>{monthlyPreviewPlan.name}・{formatMonthlyDiscount(getMonthlyDiscountRate(Math.round(monthlyAllocatedGroupCount)))}</strong>
                  <small>完成必填規格後，系統會依這個方案試算</small>
                </div>
              )}
              <div className="service-category-list monthly-service-category-list">
                {monthlyServiceGroups
                  .filter((group) => group.serviceIds.includes(activeMonthlySpecificationService.id))
                  .map((group) => {
                  const isExpanded = true;
                  const selectedGroupCount = group.serviceIds.filter((serviceId) => answers.serviceIds.includes(serviceId)).length;
                  return (
                    <section className={`service-category-panel${isExpanded ? " is-open" : ""}`} key={group.key}>
                      <button
                        className="service-category-trigger"
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`monthly-service-list-${group.key}`}
                        onClick={() => setExpandedServiceCategory(isExpanded ? null : group.key)}
                      >
                        <span className="service-category-copy">
                          <strong>{group.label}</strong>
                          <small>{group.detail}</small>
                        </span>
                        <span className="service-category-status">
                          {isExpanded ? "收合規格" : `填寫 ${selectedGroupCount} 項規格`}
                          <span className="service-category-chevron" aria-hidden="true">⌄</span>
                        </span>
                      </button>
                      <div
                        className={`service-category-reveal${isExpanded ? " is-open" : ""}`}
                        id={`monthly-service-list-${group.key}`}
                        aria-hidden={!isExpanded}
                        inert={!isExpanded}
                      >
                        <div className="service-category-reveal-inner">
                          <div className="service-category-items monthly-service-category-items">
                            {group.key === "print" && monthlyPrintGroupCount > 2 && (
                              <p className="monthly-print-limit-note">平面設計目前超過月方案 2 組上限，請調整數量；追加需求可改以單次服務估價。</p>
                            )}
                            <div className="monthly-service-quantity-list">
                      {services
                        .filter((item) => item.id === activeMonthlySpecificationService.id)
                        .map((item) => {
                          const quantity = Math.max(0, answers.quantities[item.id] ?? 0);
                          const maximumQuantity = item.id === "banner" ? BANNER_MAIN_VISUAL_LIMIT : item.category === "print" ? 2 : 10;
                          const maximumReached = quantity >= maximumQuantity;
                          const socialPostCount = item.id === "social" ? Math.max(0, answers.socialPostCount ?? 0) : 0;
                          const displayQuantity = item.id === "social" ? socialPostCount : quantity;
                          const socialPricing = item.id === "social" && quantity > 0
                            ? getSocialPricingCounts(answers)
                            : undefined;
                          const productFramePricing = item.id === "product-frame"
                            ? getProductFramePricingCounts(answers, quantity)
                            : undefined;
                          const monthlyPrintServiceId = item.id === "dm" || item.id === "menu" ? item.id : undefined;
                          const monthlyPrintDetails = monthlyPrintServiceId
                            ? getMonthlyPrintDetails(answers, monthlyPrintServiceId, quantity)
                            : [];
                          const monthlyCardDetails = item.id === "card"
                            ? getMonthlyCardDetails(answers, quantity)
                            : [];
                          const ecommerceDetail = answers.ecommerceDesignDetails[item.id] ?? {};
                          const ecommercePlacementOptions = ecommerceDetailServiceIds.has(item.id) ? getEcommercePlacementOptions(item.id) : [];
                          const ecommerceSizeOptions = ecommerceDetailServiceIds.has(item.id) ? getEcommerceSizeOptions(item.id) : [];
                          const serviceDetail = answers.serviceDesignDetails[item.id] ?? {};
                          const serviceConfig = getServiceDetailConfig(item.id);
                          return (
                            <div className={`monthly-service-block${quantity > 0 ? " is-selected" : ""}`} key={item.id}>
                              <div className={`choice monthly-service-quantity monthly-service-choice${quantity > 0 ? " selected is-selected" : ""}`}>
                                <span className="monthly-service-copy">
                                  <strong>{item.name}</strong>
                                  <small>{item.description}</small>
                                  {item.id === "social" && quantity > 0 && (
                                    <small className="monthly-service-selection-summary">已選 {socialPostCount} 篇貼文／共 {socialPricing?.totalImages ?? socialPostCount} 張</small>
                                  )}
                                  {item.id === "product-frame" && quantity > 0 && (
                                    <small className="monthly-service-selection-summary">已選 {quantity} 版圖框／共 {productFramePricing?.totalProducts ?? quantity} 項產品</small>
                                  )}
                                  <em className="choice-price">單次價格參考：{getServiceDisplayPrice(item)}</em>
                                </span>
                                <span className="monthly-quantity-stepper">
                                  <button type="button" aria-label={`減少 ${item.name}${item.id === "social" ? "貼文篇" : ""}數量`} disabled={quantity <= 1} onClick={() => adjustMonthlyServiceQuantity(item.id, -1)}>−</button>
                                  <output aria-label={`${item.name}${item.id === "social" ? "貼文篇" : ""}目前數量`}>{displayQuantity}</output>
                                  <button type="button" aria-label={`增加 ${item.name}${item.id === "social" ? "貼文篇" : ""}數量`} disabled={maximumReached} onClick={() => adjustMonthlyServiceQuantity(item.id, 1)}>＋</button>
                                </span>
                              </div>

                              {isMonthlySpecificationStep && item.id === "banner" && quantity > 0 && (
                                <div className="monthly-service-options compact-field compact-field-wide banner-extension-option">
                                  <span>主視覺延伸加購 <small>（選填）</small></span>
                                  <label className="banner-extension-quantity">
                                    <span>延伸張數</span>
                                    <select aria-label="月方案主視覺延伸張數" value={(ecommerceDetail.bannerExtensionCount ?? 0) > 0 ? ecommerceDetail.bannerExtensionCount : ""} onChange={(event) => updateMonthlyBannerExtensionCount(event.target.value)}>
                                      <option value="">不需要則免填</option>
                                      {requiredQuantityOptions.map((count) => <option key={count} value={count}>{count} 張</option>)}
                                    </select>
                                  </label>
                                  <small className="compact-note">不需要可以留空；加購會沿用這次主視覺，做成不同尺寸的系列稿，不是重新設計。</small>
                                </div>
                              )}

                              {isMonthlySpecificationStep && item.id === "social" && quantity > 0 && (
                                <div className="monthly-service-options">
                                  <strong className="monthly-special-heading">每篇貼文需要幾張圖？</strong>
                                  {Array.from({ length: socialPostCount }, (_, index) => {
                                    const imageCount = Math.min(SOCIAL_IMAGES_PER_POST_LIMIT, Math.max(1, answers.socialPostImageCounts?.[index] ?? 1));
                                    return (
                                      <div className="monthly-social-post-row" key={index}>
                                        <span>第 {index + 1} 篇</span>
                                        <span className="monthly-quantity-stepper">
                                          <button type="button" aria-label={`減少第 ${index + 1} 篇圖片張數`} disabled={imageCount <= 1} onClick={() => adjustMonthlySocialImageCount(index, -1)}>−</button>
                                          <output aria-label={`第 ${index + 1} 篇目前圖片張數`}>{imageCount}</output>
                                          <button type="button" aria-label={`增加第 ${index + 1} 篇圖片張數`} disabled={imageCount >= SOCIAL_IMAGES_PER_POST_LIMIT} onClick={() => adjustMonthlySocialImageCount(index, 1)}>＋</button>
                                        </span>
                                      </div>
                                    );
                                  })}
                                  <small>每篇計 1 組，篇內張數不增加組數；每篇最多 10 張。同篇第 2 張起 $250～$500／張；總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用。</small>
                                </div>
                              )}

                              {isMonthlySpecificationStep && item.id === "product-frame" && quantity > 0 && (
                                <div className="monthly-service-options">
                                  <strong className="monthly-special-heading">每版圖框需要套用幾項產品？</strong>
                                  {Array.from({ length: quantity }, (_, index) => {
                                    const productCount = Math.max(1, answers.productFrameProductCounts?.[index] ?? 1);
                                    return (
                                      <div className="monthly-social-post-row" key={index}>
                                        <span>第 {index + 1} 版</span>
                                        <span className="monthly-quantity-stepper">
                                          <button type="button" aria-label={`減少第 ${index + 1} 版圖框產品數量`} disabled={productCount <= 1} onClick={() => adjustMonthlyProductFrameProductCount(index, -1)}>−</button>
                                          <output aria-label={`第 ${index + 1} 版圖框目前產品數量`}>{productCount}</output>
                                          <button type="button" aria-label={`增加第 ${index + 1} 版圖框產品數量`} disabled={productCount >= 99} onClick={() => adjustMonthlyProductFrameProductCount(index, 1)}>＋</button>
                                        </span>
                                      </div>
                                    );
                                  })}
                                  <small>每版含 1 項產品；每追加 1 項 +$70，不增加月方案組數，亦不套用月方案折扣。</small>
                                </div>
                              )}

                              {isMonthlySpecificationStep && ecommerceDetailServiceIds.has(item.id) && quantity > 0 && (
                                <details className="optional-details monthly-service-options monthly-ecommerce-optional">
                                  <summary><span>其他細節可稍後確認</span><small>平台、尺寸、素材與製作方式（選填）</small></summary>
                                  <div className="optional-details-body">
                                    <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                                    <fieldset className="compact-section">
                                      <legend>這張圖要放在哪裡？</legend>
                                      <div className="compact-purpose-grid">
                                        {ecommercePlacementOptions.map((option) => (
                                          <label className={`compact-check${ecommerceDetail.placement === option.value ? " selected" : ""}`} key={option.value}>
                                            <input type="radio" name={`monthly-ecommerce-placement-${item.id}`} checked={ecommerceDetail.placement === option.value} onChange={() => updateMonthlyEcommerceDetail(item.id, { placement: option.value })} />
                                            <span>{option.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </fieldset>
                                    <div className="compact-grid">
                                      <label className="compact-field"><span>需要什麼尺寸？</span><select value={ecommerceDetail.size ?? ""} onChange={(event) => updateMonthlyEcommerceDetail(item.id, { size: event.target.value || undefined })}><option value="">稍後確認</option>{ecommerceSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                      <label className="compact-field"><span>文字內容準備好了嗎？</span><select value={ecommerceDetail.copyStatus ?? ""} onChange={(event) => updateMonthlyEcommerceDetail(item.id, { copyStatus: event.target.value ? event.target.value as EcommerceCopyStatus : undefined })}><option value="">稍後確認</option>{(Object.entries(ecommerceCopyStatusLabels) as [EcommerceCopyStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                      <label className="compact-field"><span>Logo 和圖片準備好了嗎？</span><select value={ecommerceDetail.assetStatus ?? ""} onChange={(event) => updateMonthlyEcommerceDetail(item.id, { assetStatus: event.target.value ? event.target.value as EcommerceAssetStatus : undefined })}><option value="">稍後確認</option>{(Object.entries(ecommerceAssetStatusLabels) as [EcommerceAssetStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                      {item.id !== "banner" && <label className="compact-field"><span>還需要幾個同版版本？ <small>只換文字或圖片</small></span><input type="number" min="0" max="99" placeholder="沒有就留空" value={ecommerceDetail.versionCount ?? ""} onChange={(event) => updateMonthlyEcommerceDetail(item.id, { versionCount: parseOptionalPositiveInteger(event.target.value) })} /></label>}
                                      <label className="compact-field"><span>想要多精緻？</span><select value={ecommerceDetail.visualLevel ?? ""} onChange={(event) => updateMonthlyEcommerceDetail(item.id, { visualLevel: event.target.value ? event.target.value as Complexity : undefined })}><option value="">稍後確認</option>{getEcommerceVisualLevelOptions(item.id).map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
                                    </div>
                                  </div>
                                </details>
                              )}

                              {isMonthlySpecificationStep && item.id === "poster" && quantity > 0 && serviceConfig && (
                                <div className="monthly-service-options monthly-poster-spec">
                                  <div className="compact-grid">
                                    <label className="compact-field">
                                      <span>要做單款，還是同系列多款？ <small>（必填）</small></span>
                                      <select aria-invalid={!serviceDetail.seriesArtwork} value={serviceDetail.seriesArtwork ?? ""} onChange={(event) => updateMonthlyPosterSeriesArtwork(event.target.value as "none" | "yes")}>
                                        <option value="" disabled>請選擇</option>
                                        <option value="none">只做 1 款</option>
                                        <option value="yes">同系列做多款</option>
                                      </select>
                                    </label>
                                    {serviceDetail.seriesArtwork === "yes" && (
                                      <label className="compact-field">
                                        <span>還要延伸幾款？</span>
                                        <select aria-label="月方案系列海報延伸款數" value={Math.max(1, quantity - 1)} onChange={() => updateMonthlyPosterSeriesArtwork("yes")}>
                                          <option value="1">再做 1 款（共 2 款）</option>
                                        </select>
                                      </label>
                                    )}
                                  </div>
                                  <details className="optional-details">
                                    <summary><span>其他細節可稍後確認</span><small>用途、素材與製作方式（選填）</small></summary>
                                    <div className="optional-details-body">
                                      <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                                      <fieldset className="compact-section">
                                        <legend>{serviceConfig.purposeLabel}（單選）</legend>
                                        <div className="compact-purpose-grid">
                                          {serviceConfig.purposeOptions.map((option) => (
                                            <label className={`compact-check${serviceDetail.purpose === option.value ? " selected" : ""}`} key={option.value}>
                                              <input type="radio" name="monthly-service-purpose-poster" checked={serviceDetail.purpose === option.value} onChange={() => updateMonthlyPosterDetail({ purpose: option.value })} />
                                              <span>{option.label}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </fieldset>
                                      <div className="compact-grid">
                                        <label className="compact-field"><span>{serviceConfig.specificationLabel}</span><select value={serviceDetail.specification ?? ""} onChange={(event) => updateMonthlyPosterDetail({ specification: event.target.value || undefined })}><option value="">稍後確認</option>{serviceConfig.specificationOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                        <label className="compact-field"><span>{serviceConfig.contentLabel}</span><select value={serviceDetail.contentStatus ?? ""} onChange={(event) => updateMonthlyPosterDetail({ contentStatus: event.target.value || undefined })}><option value="">稍後確認</option>{serviceConfig.contentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                        <label className="compact-field"><span>{serviceConfig.assetLabel}</span><select value={serviceDetail.assetStatus ?? ""} onChange={(event) => updateMonthlyPosterDetail({ assetStatus: event.target.value || undefined })}><option value="">稍後確認</option>{serviceConfig.assetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                        <label className="compact-field"><span>想要多精緻？</span><select value={serviceDetail.complexity ?? ""} onChange={(event) => updateMonthlyPosterDetail({ complexity: event.target.value ? event.target.value as Complexity : undefined })}><option value="">稍後確認</option>{serviceConfig.complexityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              )}

                              {isMonthlySpecificationStep && item.id === "card" && quantity > 0 && (
                                <div className="monthly-service-options monthly-card-versions">
                                  <strong className="monthly-special-heading">名片／會員卡規格</strong>
                                  {quantity > 1 && <small>已選 {quantity} 款，請分別選擇每款的規格。</small>}
                                  <div className="monthly-print-version-list">
                                    {monthlyCardDetails.map((monthlyCardDetail, versionIndex) => (
                                      <section className="monthly-print-version monthly-card-side" key={`card-${versionIndex}`}>
                                        <label>
                                          <span><strong>{quantity > 1 ? `第 ${versionIndex + 1} 款規格` : "選擇單面或雙面"}</strong><small>每款依所選單面或雙面價格納入月方案優惠。</small></span>
                                          <select aria-label={`月方案名片／會員卡第${versionIndex + 1}款單面或雙面`} value={monthlyCardDetail.specification ?? ""} onChange={(event) => updateMonthlyCardSide(versionIndex, event.target.value as "single" | "double")}>
                                            <option value="" disabled>請選擇</option>
                                            <option value="single">單面｜$1,000～1,500／款</option>
                                            <option value="double">雙面｜$1,200～2,200／款</option>
                                          </select>
                                        </label>
                                        {serviceConfig && (
                                          <details className="optional-details monthly-card-optional">
                                            <summary><span>其他細節可稍後確認</span><small>用途、素材與製作方式（選填）</small></summary>
                                            <div className="optional-details-body">
                                              <p className="optional-details-intro">不確定也沒關係，先跳過不會影響送出；後續會再確認。</p>
                                              <fieldset className="compact-section">
                                                <legend>{serviceConfig.purposeLabel}（單選）</legend>
                                                <div className="compact-purpose-grid">
                                                  {serviceConfig.purposeOptions.map((option) => (
                                                    <label className={`compact-check${monthlyCardDetail.purpose === option.value ? " selected" : ""}`} key={option.value}>
                                                      <input type="radio" name={`monthly-service-purpose-card-${versionIndex}`} checked={monthlyCardDetail.purpose === option.value} onChange={() => updateMonthlyCardDetail(versionIndex, { purpose: option.value })} />
                                                      <span>{option.label}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              </fieldset>
                                              <div className="compact-grid">
                                                <label className="compact-field"><span>{serviceConfig.quantityLabel} {serviceConfig.quantityNote && <small>（{serviceConfig.quantityNote}）</small>}</span><input inputMode="numeric" type="number" min="0" max="999" placeholder="無則留空" value={monthlyCardDetail.applicationCount ?? ""} onChange={(event) => updateMonthlyCardDetail(versionIndex, { applicationCount: parseOptionalPositiveInteger(event.target.value) })} /></label>
                                                <label className="compact-field"><span>{serviceConfig.contentLabel}</span><select value={monthlyCardDetail.contentStatus ?? ""} onChange={(event) => updateMonthlyCardDetail(versionIndex, { contentStatus: event.target.value || undefined })}><option value="">稍後確認</option>{serviceConfig.contentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                                <label className="compact-field"><span>{serviceConfig.assetLabel}</span><select value={monthlyCardDetail.assetStatus ?? ""} onChange={(event) => updateMonthlyCardDetail(versionIndex, { assetStatus: event.target.value || undefined })}><option value="">稍後確認</option>{serviceConfig.assetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                                <label className="compact-field"><span>想要多精緻？</span><select value={monthlyCardDetail.complexity ?? ""} onChange={(event) => updateMonthlyCardDetail(versionIndex, { complexity: event.target.value ? event.target.value as Complexity : undefined })}><option value="">稍後確認</option>{serviceConfig.complexityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                                              </div>
                                            </div>
                                          </details>
                                        )}
                                      </section>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {isMonthlySpecificationStep && monthlyPrintServiceId && quantity > 0 && (
                                <div className="monthly-service-options monthly-print-spec">
                                  <strong className="monthly-special-heading">{item.name}規格</strong>
                                  {quantity > 1 && <small>已選 {quantity} 項，請分別填寫每個版本的規格。</small>}
                                  <div className="monthly-print-version-list">
                                    {monthlyPrintDetails.map((monthlyPrintDetail, versionIndex) => {
                                      const minimumPageCount = getMinimumPrintPageCount(monthlyPrintServiceId, monthlyPrintDetail.structure);
                                      return (
                                      <section className="monthly-print-version" key={`${monthlyPrintServiceId}-${versionIndex}`}>
                                        <div className="monthly-print-spec-heading">
                                          <strong>{quantity > 1 ? `第 ${versionIndex + 1} 項規格` : "規格選擇"}</strong>
                                          <button type="button" onClick={() => applyMonthlyPrintCommonSettings(monthlyPrintServiceId, versionIndex)}>套用常見尺寸</button>
                                        </div>
                                        <div className="monthly-print-spec-grid">
                                          <label>
                                            <span>要做單面、雙面、折頁還是多頁？ <small>（必填）</small></span>
                                            <select aria-invalid={!monthlyPrintDetail.structure} aria-label={`月方案${item.name}第${versionIndex + 1}項成品結構`} value={monthlyPrintDetail.structure ?? ""} onChange={(event) => {
                                              const structure = event.target.value as PrintStructure;
                                              updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, {
                                                structure,
                                                pageCount: structure === "multipage" ? monthlyPrintDetail.pageCount : undefined,
                                                customPageCount: structure === "multipage" ? monthlyPrintDetail.customPageCount : undefined,
                                                fold: structure === "folded" ? monthlyPrintDetail.fold : undefined,
                                              });
                                            }}>
                                              <option value="" disabled>請選擇</option>
                                              {getPrintStructureOptions(monthlyPrintServiceId).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                            </select>
                                          </label>
                                          {monthlyPrintDetail.structure === "multipage" && (
                                            <label>
                                              <span>一共需要設計幾頁？ <small>含封面、封底</small></span>
                                              <select
                                                aria-invalid={(monthlyPrintDetail.pageCount ?? 0) < minimumPageCount}
                                                aria-label={`月方案${item.name}第${versionIndex + 1}項總設計頁數`}
                                                value={monthlyPrintDetail.customPageCount || (monthlyPrintDetail.pageCount ?? 0) > 10 ? "custom" : monthlyPrintDetail.pageCount ?? ""}
                                                onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, event.target.value === "custom"
                                                  ? { pageCount: undefined, customPageCount: true }
                                                  : { pageCount: parseOptionalPositiveInteger(event.target.value), customPageCount: undefined })}
                                              >
                                                <option value="" disabled>請選擇</option>
                                                {requiredPageCountOptions.filter((count) => count >= minimumPageCount).map((count) => <option key={count} value={count}>{count} 頁</option>)}
                                                <option value="custom">自訂頁數</option>
                                              </select>
                                              {(monthlyPrintDetail.customPageCount || (monthlyPrintDetail.pageCount ?? 0) > 10) && (
                                                <input
                                                  className="custom-page-count-input"
                                                  aria-label={`月方案${item.name}第${versionIndex + 1}項自訂總設計頁數`}
                                                  aria-invalid={(monthlyPrintDetail.pageCount ?? 0) < minimumPageCount}
                                                  inputMode="numeric"
                                                  type="number"
                                                  min={minimumPageCount}
                                                  max="999"
                                                  placeholder="請輸入實際頁數"
                                                  value={monthlyPrintDetail.pageCount ?? ""}
                                                  onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { pageCount: parseOptionalPositiveInteger(event.target.value), customPageCount: true })}
                                                />
                                              )}
                                            </label>
                                          )}
                                        </div>

                                        {monthlyPrintDetail.structure === "folded" && (
                                          <div className="monthly-fold-options">
                                            <span>想用哪一種折法？ <small>（必填，點選圖例）</small></span>
                                            <div className="fold-option-grid" aria-label={`月方案${item.name}第${versionIndex + 1}項折頁方式`}>
                                              {(Object.entries(printFoldLabels) as [PrintFold, string][]).map(([value, label]) => (
                                                <FoldChoice key={value} fold={value} label={label} selected={monthlyPrintDetail.fold === value} onClick={() => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { fold: value })} />
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {monthlyPrintDetail.structure === "multipage" && (
                                          <small className="monthly-print-page-note">頁數不增加月方案組數；第 2 頁起依追加頁價格計算，並套用月方案優惠。</small>
                                        )}

                                        <details className="optional-details monthly-print-optional">
                                          <summary><span>其他細節可稍後確認</span><small>用途、尺寸、素材與完成時間（選填）</small></summary>
                                          <div className="optional-details-body">
                                            <fieldset className="compact-section">
                                              <legend>這份設計要用在哪裡？</legend>
                                              <div className="compact-purpose-grid">
                                                {getPrintPurposeOptions(monthlyPrintServiceId).map((option) => (
                                                  <label className={`compact-check${monthlyPrintDetail.purposes?.includes(option.value) ? " selected" : ""}`} key={option.value}>
                                                    <input type="radio" name={`monthly-${monthlyPrintServiceId}-${versionIndex}-purpose`} checked={monthlyPrintDetail.purposes?.includes(option.value) ?? false} onChange={() => selectMonthlyPrintPurpose(monthlyPrintServiceId, versionIndex, option.value)} />
                                                    <span>{option.label}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </fieldset>
                                            <div className="compact-grid">
                                              <label className="compact-field"><span>需要什麼尺寸？</span><select aria-label={`月方案${item.name}第${versionIndex + 1}項尺寸與方向`} value={monthlyPrintDetail.format ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { format: event.target.value ? event.target.value as PrintFormat : undefined })}><option value="">稍後確認</option>{(Object.entries(printFormatLabels) as [PrintFormat, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                              <label className="compact-field"><span>文字內容準備好了嗎？</span><select value={monthlyPrintDetail.contentStatus ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { contentStatus: event.target.value ? event.target.value as ContentStatus : undefined })}><option value="">稍後確認</option>{(Object.entries(contentStatusLabels) as [ContentStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                              <label className="compact-field"><span>Logo 和圖片準備好了嗎？</span><select value={monthlyPrintDetail.imageStatus ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { imageStatus: event.target.value ? event.target.value as ImageStatus : undefined })}><option value="">稍後確認</option>{(Object.entries(imageStatusLabels) as [ImageStatus, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                              <label className="compact-field"><span>還需要幾個同版版本？ <small>只換文字或圖片</small></span><input type="number" min="0" max="99" placeholder="沒有就留空" value={monthlyPrintDetail.versionCount ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { versionCount: parseOptionalPositiveInteger(event.target.value) })} /></label>
                                              <label className="compact-field"><span>想要多精緻？</span><select value={monthlyPrintDetail.complexity ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { complexity: event.target.value ? event.target.value as Complexity : undefined })}><option value="">稍後確認</option>{(Object.entries(complexityLabels) as [Complexity, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                                              <label className="compact-field"><span>希望什麼時候完成？</span><input type="date" value={monthlyPrintDetail.deadline ?? ""} onChange={(event) => updateMonthlyPrintDetail(monthlyPrintServiceId, versionIndex, { deadline: event.target.value || undefined })} /></label>
                                            </div>
                                          </div>
                                        </details>
                                      </section>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="compact-card-footer">
                <span>{!activeMonthlyServiceComplete
                  ? "請完成此項必填欄位"
                  : !isLastMonthlySpecification
                  ? "此項必填已完成"
                  : monthlyMissingDetailLabels.length > 0
                  ? `待填：${monthlyMissingDetailLabels.join("、")}`
                  : monthlyAllocatedGroupCount < monthlyMinimumGroupCount
                  ? `月方案至少需 ${monthlyMinimumGroupCount} 組`
                  : monthlyAllocatedGroupCount > 10
                  ? "月方案最多 10 組"
                  : monthlyPrintGroupCount > 2
                  ? "平面設計每月最多 2 組"
                  : "可評估適用月方案"}</span>
                <div className="compact-card-actions">
                  <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                  <button
                    className="send-button"
                    type="button"
                    disabled={isMonthlySpecificationAdvancing || (isLastMonthlySpecification ? !monthlySpecificationsComplete : !activeMonthlyServiceComplete)}
                    onClick={advanceMonthlySpecification}
                  >
                    {isLastMonthlySpecification ? "確認方案與加購 →" : "完成這項 →"}
                  </button>
                </div>
              </div>
              {monthlyComparison && monthlyDistributionComplete && (
                <details className="result-disclosure monthly-selection-disclosure">
                  <summary>查看單次與月方案價格比較</summary>
                  <section className={`monthly-comparison is-${monthlyComparison.tone}`} aria-label="單次與月方案比較">
                    <div><span>單次委託參考</span><strong>{formatPriceRange(monthlyComparison.singleReference.low, monthlyComparison.singleReference.high)}</strong></div>
                    <div><span>月方案初估</span><strong>{formatPriceRange(quote.low, quote.high)}</strong></div>
                    <p><b>{monthlyComparison.label}</b>{monthlyComparison.detail}</p>
                    <small>原始檔另行確認；代辦印刷於合作確認時另行估價，均不計入網站初估。</small>
                  </section>
                </details>
              )}
            </div>
            {plan && (
              <details className="result-disclosure monthly-plan-disclosure">
                <summary>查看 {plan.name} 規格</summary>
                <section className="matched-plan-card" aria-label="自動帶入月方案規格">
                  <div className="matched-plan-heading">
                    <span>依服務自動帶入</span>
                    <strong>{plan.name}</strong>
                  </div>
                  <dl className="matched-plan-specs">
                    <div>
                      <dt>每月數量</dt>
                      <dd>{answers.monthlyGroupCount} 組／月</dd>
                    </div>
                    <div>
                      <dt>計算方式</dt>
                      <dd>依單次設計費合計</dd>
                    </div>
                    <div>
                      <dt>服務範圍</dt>
                      <dd>依總組數分配各項數量</dd>
                    </div>
                    <div>
                      <dt>交付安排</dt>
                      <dd>{answers.monthlyCadence ? monthlyCadenceLabels[answers.monthlyCadence] : "可於排程前確認"}</dd>
                    </div>
                  </dl>
                  <p>交付 JPG／PNG／PDF 完稿。平面設計每月合計限 2 組，未使用組數不累積。</p>
                  <p>單次設計費合計套用 {formatMonthlyDiscount(getMonthlyDiscountRate(answers.monthlyGroupCount ?? 3))}。社群圖文總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用。</p>
                  <p>網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠；商品主圖追加產品按單次價格另計且不套用月方案折扣；原始檔另行確認，代辦印刷於合作確認時另行估價。</p>
                </section>
              </details>
            )}
          </div>
        );
      }
      case "sourceFile":
        return answers.projectType === "monthly" ? (() => {
          const selections = getMonthlySourceFileSelections(answers);
          const selectedCount = selections.reduce((sum, item) => sum + item.quantity, 0);
          const supportedPrintServices = selectedPrintServices.filter((service) => answers.printSpecifications[service.id]?.support);
          const hasAddOns = selectedCount > 0 || supportedPrintServices.length > 0;
          return (
            <div className="multi-select-wrap add-on-selector monthly-source-selector">
              <section className="add-on-section">
                <div className="add-on-section-heading"><strong>需要可編輯的原始檔嗎？</strong><span>選填，不需要可跳過</span></div>
                <div className="choices source-file-choices">
                  {selectedServices.map((item) => {
                    const quantity = Math.max(0, answers.monthlySourceFileQuantities[item.id] ?? 0);
                    const maximum = Math.max(0, answers.quantities[item.id] ?? 0);
                    const sourceScope = item.id === "social"
                      ? `${maximum} 篇貼文（共 ${getSocialPricingCounts(answers).totalImages} 張）`
                      : item.pricing === "dm"
                        ? `${maximum} 項`
                      : `${maximum} ${item.unit}`;
                    return (
                      <div className="monthly-source-choice" key={item.id}>
                        <OptionButton
                          label={item.name}
                          detail={`本月 ${sourceScope}；費用另行確認，暫不計入網站初估`}
                          selected={quantity > 0}
                          multiple
                          onClick={() => toggleMonthlySourceFile(item.id)}
                        />
                        {quantity > 0 && maximum > 1 && (
                          <div className="monthly-source-quantity-row">
                            <span>加購份數</span>
                            <span className="monthly-quantity-stepper">
                            <button type="button" aria-label={`減少 ${item.name} 原始檔份數`} disabled={quantity === 0} onClick={() => adjustMonthlySourceFileQuantity(item.id, -1)}>−</button>
                            <output aria-label={`${item.name}原始檔目前份數`}>{quantity}</output>
                            <button type="button" aria-label={`增加 ${item.name} 原始檔份數`} disabled={quantity >= maximum} onClick={() => adjustMonthlySourceFileQuantity(item.id, 1)}>＋</button>
                          </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
              {selectedPrintServices.length > 0 && (
                <section className="add-on-section monthly-print-support">
                  <div className="add-on-section-heading"><strong>需要協助印刷嗎？</strong><span>選填，不需要可跳過</span></div>
                  <div className="choices source-file-choices">
                    {selectedPrintServices.map((service) => (
                      <OptionButton
                        key={service.id}
                        label={service.name}
                        detail="需要協助確認印刷規格與代辦送印"
                        selected={Boolean(answers.printSpecifications[service.id]?.support)}
                        multiple
                        onClick={() => togglePrintProduction(service.id)}
                      />
                    ))}
                  </div>
                  {supportedPrintServices.length > 0 && (
                    <div className="print-production-details">
                      <p className="monthly-unit-note">印量、紙張與加工皆可留空，正式合作時再確認；費用另行估價，暫不計入網站初估。</p>
                      {supportedPrintServices.map((service) => {
                        const specification = answers.printSpecifications[service.id] ?? { support: true };
                        return (
                          <section className="print-production-item" key={service.id}>
                            <div className="print-production-item-title"><strong>{service.name}</strong><span>印刷規格（選填）</span></div>
                            <div className="compact-grid">
                              <label className="compact-field"><span>預計印量</span><input type="number" min="0" max="999999" value={specification.quantity ?? ""} placeholder="例如 500；可留空" onChange={(event) => updatePrintProduction(service.id, { quantity: parseOptionalPositiveInteger(event.target.value) })} /></label>
                              <label className="compact-field"><span>紙張</span><select value={specification.paper ?? ""} onChange={(event) => updatePrintProduction(service.id, { paper: event.target.value ? event.target.value as PrintPaper : undefined })}><option value="">稍後確認</option>{(Object.entries(printPaperLabels) as [PrintPaper, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                              <label className="compact-field"><span>加工</span><select value={specification.finish ?? ""} onChange={(event) => updatePrintProduction(service.id, { finish: event.target.value ? event.target.value as PrintFinish : undefined })}><option value="">稍後確認</option>{(Object.entries(printFinishLabels) as [PrintFinish, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
              <div className="multi-select-footer source-file-footer">
                {hasAddOns && <span>{[selectedCount > 0 ? `${selectedCount} 份原始檔` : "", supportedPrintServices.length > 0 ? `${supportedPrintServices.length} 項代辦印刷` : ""].filter(Boolean).join("・")}</span>}
                <div className="multi-select-actions">
                  <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                  <button className="send-button" type="button" onClick={confirmMonthlySourceFiles}>{hasAddOns ? "確認選擇並繼續 →" : "下一步：交付節奏 →"}</button>
                </div>
              </div>
            </div>
          );
        })() : (() => {
          const supportedPrintServices = selectedPrintServices.filter((service) => answers.printSpecifications[service.id]?.support);
          const hasAddOns = answers.sourceFileServiceIds.length > 0 || supportedPrintServices.length > 0;
          return (
            <div className="multi-select-wrap add-on-selector">
              <section className="add-on-section">
                <div className="add-on-section-heading"><strong>需要可編輯的原始檔嗎？</strong><span>選填，不需要可跳過</span></div>
                <div className="choices source-file-choices">
                  {selectedServices.map((item) => (
                    <OptionButton
                      key={item.id}
                      label={item.name}
                      detail={item.id === "product-frame"
                        ? "依商品主圖版型數計算，每版設計費 +50%（不含追加產品）"
                        : "該項設計費小計 +50%"}
                      selected={answers.sourceFileServiceIds.includes(item.id)}
                      multiple
                      onClick={() => toggleSourceFile(item.id)}
                    />
                  ))}
                </div>
              </section>
              {selectedPrintServices.length > 0 && (
                <section className="add-on-section">
                  <div className="add-on-section-heading"><strong>需要協助印刷嗎？</strong><span>選填，不需要可跳過</span></div>
                  <div className="choices source-file-choices">
                    {selectedPrintServices.map((service) => (
                      <OptionButton
                        key={service.id}
                        label={service.name}
                        detail="代辦服務費為該項設計費 +15%，印刷與運送實報實銷"
                        selected={Boolean(answers.printSpecifications[service.id]?.support)}
                        multiple
                        onClick={() => togglePrintProduction(service.id)}
                      />
                    ))}
                  </div>
                  {supportedPrintServices.length > 0 && (
                    <div className="print-production-details">
                      <p className="monthly-unit-note">印量、紙張與加工皆可留空，正式合作時再確認。</p>
                      {supportedPrintServices.map((service) => {
                        const specification = answers.printSpecifications[service.id] ?? { support: true };
                        return (
                          <section className="print-production-item" key={service.id}>
                            <div className="print-production-item-title"><strong>{service.name}</strong><span>印刷規格（選填）</span></div>
                            <div className="compact-grid">
                              <label className="compact-field"><span>預計印量</span><input type="number" min="0" max="999999" value={specification.quantity ?? ""} placeholder="例如 500；可留空" onChange={(event) => updatePrintProduction(service.id, { quantity: parseOptionalPositiveInteger(event.target.value) })} /></label>
                              <label className="compact-field"><span>紙張</span><select value={specification.paper ?? ""} onChange={(event) => updatePrintProduction(service.id, { paper: event.target.value ? event.target.value as PrintPaper : undefined })}><option value="">稍後確認</option>{(Object.entries(printPaperLabels) as [PrintPaper, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                              <label className="compact-field"><span>加工</span><select value={specification.finish ?? ""} onChange={(event) => updatePrintProduction(service.id, { finish: event.target.value ? event.target.value as PrintFinish : undefined })}><option value="">稍後確認</option>{(Object.entries(printFinishLabels) as [PrintFinish, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
              <div className="multi-select-footer source-file-footer">
                <span>{hasAddOns ? "已完成加購選擇" : "不需要可直接完成試算"}</span>
                <div className="multi-select-actions">
                  <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                  <button className="send-button" type="button" onClick={confirmSingleAddOns}>{hasAddOns ? "確認加購並完成 →" : "完成試算 →"}</button>
                </div>
              </div>
            </div>
          );
        })();
      case "printProduction": {
        const supportedPrintServices = selectedPrintServices.filter((service) => answers.printSpecifications[service.id]?.support);
        return (
          <div className="multi-select-wrap print-production-selector">
            <div className="choices source-file-choices">
              {selectedPrintServices.map((service) => (
                <OptionButton
                  key={service.id}
                  label={service.name}
                  detail="代辦服務費為該項設計費 +15%，印刷與運送實報實銷"
                  selected={Boolean(answers.printSpecifications[service.id]?.support)}
                  multiple
                  onClick={() => togglePrintProduction(service.id)}
                />
              ))}
            </div>
            {supportedPrintServices.length > 0 && (
              <div className="print-production-details">
                <p className="monthly-unit-note">以下規格皆為選填，可稍後確認；目前試算只加入 15% 代辦服務費，實際印刷與運送費會分開列出。</p>
                {supportedPrintServices.map((service) => {
                  const specification = answers.printSpecifications[service.id] ?? { support: true };
                  return (
                    <section className="print-production-item" key={service.id}>
                      <div className="print-production-item-title"><strong>{service.name}</strong><span>印刷規格（選填）</span></div>
                      <div className="compact-grid">
                        <label className="compact-field"><span>預計印量（選填）</span><input type="number" min="0" max="999999" value={specification.quantity ?? ""} placeholder="例如 500；可留空" onChange={(event) => updatePrintProduction(service.id, { quantity: parseOptionalPositiveInteger(event.target.value) })} /></label>
                        <label className="compact-field"><span>紙張（選填）</span><select value={specification.paper ?? ""} onChange={(event) => updatePrintProduction(service.id, { paper: event.target.value ? event.target.value as PrintPaper : undefined })}><option value="">稍後確認</option>{(Object.entries(printPaperLabels) as [PrintPaper, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label className="compact-field"><span>加工（選填）</span><select value={specification.finish ?? ""} onChange={(event) => updatePrintProduction(service.id, { finish: event.target.value ? event.target.value as PrintFinish : undefined })}><option value="">稍後確認</option>{(Object.entries(printFinishLabels) as [PrintFinish, string][]).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
            <div className="multi-select-footer source-file-footer">
              {supportedPrintServices.length > 0 && <span>已選 {supportedPrintServices.length} 項代辦</span>}
              <div className="multi-select-actions">
                <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
                <button className="send-button" type="button" onClick={confirmPrintProduction}>{supportedPrintServices.length > 0 ? "確認選擇 →" : "全部不需要 →"}</button>
              </div>
            </div>
          </div>
        );
      }
      case "monthlyCadence":
        return (
          <div className="multi-select-wrap monthly-cadence-question">
            <div className="choices">
              <OptionButton
                label="每週固定交付"
                detail="固定節奏安排內容與出稿"
                onClick={() => move("result", { monthlyCadence: "weekly" }, monthlyCadenceLabels.weekly)}
              />
              <OptionButton
                label="活動前集中製作"
                detail="依促銷、檔期或上新時間集中安排"
                onClick={() => move("result", { monthlyCadence: "campaign" }, monthlyCadenceLabels.campaign)}
              />
              <OptionButton
                label="當月彈性安排"
                detail="確認方案後再一起排定優先順序"
                onClick={() => move("result", { monthlyCadence: "flexible" }, monthlyCadenceLabels.flexible)}
              />
            </div>
            <div className="multi-select-footer">
              <span>這是月方案送出前的最後一題</span>
              <button className="inline-back-button" type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>
            </div>
          </div>
        );
      case "result":
        return (
          <div className="result-card" aria-live="polite">
            <div className="result-kicker">{hasPrintProductionCosts ? "設計與代辦服務初估｜不含印刷、運送" : "網站初步估價"}</div>
            <div className="result-range">
              {currency.format(quote.low)} <span>～</span> {currency.format(quote.high)}
            </div>
            {answers.projectType === "monthly" && monthlyComparison ? (
              <section className="price-breakdown monthly-price-comparison" aria-label="月方案價格比較">
                <div className="price-breakdown-heading">
                  <strong>月方案價格比較</strong>
                  <span>兩筆金額不相加</span>
                </div>
                <div className="monthly-price-row is-reference">
                  <span>
                    <b>單次合計參考</b>
                    <small>比較基準，不另計</small>
                  </span>
                  <strong>{formatPriceRange(monthlyComparison.singleReference.low, monthlyComparison.singleReference.high)}</strong>
                </div>
                <div className="monthly-discount-row">
                  <span>{monthlyComparison.label}</span>
                  {monthlySavings && (
                    <strong>{monthlySavingsLabel}</strong>
                  )}
                </div>
                <details className="monthly-reference-details">
                  <summary>查看單次計價明細</summary>
                  <div className="monthly-reference-list">
                    {monthlyReferenceBreakdown.map((item) => (
                      <div className="price-breakdown-row" key={item.label}>
                        <span className="price-breakdown-copy">
                          <b>{item.label}</b>
                          <small>{item.detail}</small>
                        </span>
                        <strong>{formatPriceRange(item.low, item.high)}</strong>
                      </div>
                    ))}
                  </div>
                </details>
                <p className="monthly-comparison-note">{monthlyComparison.detail}</p>
                <p className="monthly-comparison-note">原始檔另行確認；代辦印刷於合作確認時另行估價，均不計入網站初估。</p>
              </section>
            ) : (
              <div className="price-breakdown" aria-label="費用明細">
                <div className="price-breakdown-heading">
                  <strong>費用明細</strong>
                  <span>小計</span>
                </div>
                {quote.breakdown.map((item) => (
                  <div className="price-breakdown-row" key={item.label}>
                    <span className="price-breakdown-copy">
                      <b>{item.label}</b>
                      <small>{item.detail}</small>
                    </span>
                    <strong>{formatPriceRange(item.low, item.high)}</strong>
                  </div>
                ))}
              </div>
            )}
            {hasPrintProductionCosts && (
              <div className="estimate-exclusion" role="note">
                <strong>本估價不包含印刷品製作費與運送費</strong>
                <span>目前總額只包含設計費與 15% 代辦服務費；印刷與運送將依實際廠商報價實報實銷。</span>
              </div>
            )}
            {pendingEstimateItems.length > 0 && (
              <div className="pending-estimate" role="note">
                <strong>尚有需求待確認費用</strong>
                <ul>{pendingEstimateItems.map((item) => <li key={item}>{item}</li>)}</ul>
                <span>這些項目不會未經同意直接追加，會在正式報價前先列明金額。</span>
              </div>
            )}
            <details className="result-disclosure">
              <summary>查看合作與付款重點</summary>
              <section className="quote-terms" aria-label="合作與付款重點">
                <ul>
                  {answers.projectType !== "monthly" && <li>每案含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 $300 起／次。</li>}
                  {answers.projectType !== "monthly" && <li>20% 訂金、80% 尾款；確認合作並支付訂金後，如取消合作，20% 訂金不予退還。</li>}
                  {answers.projectType === "monthly" && selectedServices.some((service) => service.category === "print") && <li>平面設計每月合計限 2 組，未使用組數不累積。</li>}
                  {answers.projectType === "monthly" && <li>每組含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 $300 起／次。</li>}
                  {answers.projectType === "monthly" && <li>20% 訂金於確認合作後支付，80% 尾款於交付前付清；月方案如需取消或調整，最晚於製作前 2 日告知。已開始製作的部分不予退款；僅尚未開始製作的部分可依實際進度評估退款，20% 訂金不退。</li>}
                  {answers.projectType === "monthly" && <li>原始檔與其他加購費用於正式報價前確認。</li>}
                  <li>第三方素材、商用授權、印刷與運送費不包含，若需要會先確認。</li>
                </ul>
              </section>
            </details>
            {renderSpecificationServiceSwitcher()}
            {inquirySubmitState === "success" ? (
              <section className="inquiry-capture" aria-labelledby="inquiry-capture-title">
                <div className="inquiry-success" role="status">
                  <span aria-hidden="true">✓</span>
                  <div>
                    <strong id="inquiry-capture-title">需求已送出，將會盡快與您聯絡</strong>
                    <small>{inquirySubmitMessage}・你仍可下載估價單留存。</small>
                  </div>
                </div>
              </section>
            ) : (
              <details className="inquiry-capture">
                <summary className="inquiry-capture-heading">
                  <div><span>正式報價</span><strong id="inquiry-capture-title">需要正式報價？留下聯絡方式</strong></div>
                  <small>通常於 3 個工作日內回覆</small>
                </summary>
                <div className="inquiry-capture-body">
                  <p>送出後會保留本次試算內容，後續將會與您聯繫。</p>
                  <form className="inquiry-form" onSubmit={submitInquiry}>
                    <label><span>姓名 *</span><input name="clientName" autoComplete="name" required maxLength={80} placeholder="怎麼稱呼你？" /></label>
                    <label><span>品牌／公司（選填）</span><input name="company" autoComplete="organization" maxLength={120} placeholder="可留空" /></label>
                    <label><span>您的聯絡方式 *</span><input name="contact" autoComplete="tel" required maxLength={180} placeholder="LINE ID、電話或其他可聯絡方式" /></label>
                    <label className="form-honeypot" aria-hidden="true"><span>網站</span><input name="website" tabIndex={-1} autoComplete="off" /></label>
                    <button type="submit" disabled={inquirySubmitState === "submitting"}>{inquirySubmitState === "submitting" ? "正在送出…" : "送出需求並保留試算 →"}</button>
                  </form>
                  {inquirySubmitState === "error" && <p className="inquiry-error" role="alert">{inquirySubmitMessage}</p>}
                </div>
              </details>
            )}
            <div className="result-actions">
              <a className="line-button" href={lineContactUrl} target="_blank" rel="noreferrer" onClick={() => { void copyLineInquirySummary(); }}>
                帶著需求與我聯繫 <span aria-hidden="true">↗</span>
              </a>
              <button className="download-button" type="button" onClick={downloadEstimate}>
                下載估價單 <span aria-hidden="true">↓</span>
              </button>
            </div>
            <p className={`line-copy-note is-${lineCopyState}`} role="status">{lineCopyState === "copied"
              ? "需求摘要已複製；進入 LINE 聊天室後請貼上。"
              : lineCopyState === "failed"
                ? "瀏覽器未允許自動複製；可返回此頁下載估價單。"
                : "點擊聯繫按鈕會先複製需求摘要；進入 LINE 聊天室後請貼上。"}</p>
            <p className="estimate-note">此為網站初估；所有待確認與未含費用都會在正式報價前先列明並取得同意，不會直接追加。</p>
          </div>
        );
    }
  }

  const usesInlineBackNavigation = inlineBackSteps.has(step);
  const stepMotionKey = [
    step,
    journeyPosition,
    answers.ecommerceDetailIndex ?? "",
    answers.printDetailIndex ?? "",
    answers.serviceDetailIndex ?? "",
    answers.sourceFileIndex ?? "",
  ].join("-");
  const completedConversationAnswers = messages.filter((message) => message.speaker === "user");
  const hasCollapsedConversationHistory = step !== "result" && completedConversationAnswers.length > 0;
  const visibleConversationMessages = hasCollapsedConversationHistory ? [] : messages;
  const latestConversationAnswer = completedConversationAnswers.at(-1)?.text ?? "";

  return (
    <main className={`site-shell${step === "result" ? " estimate-complete" : ""}`}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="返回 Design Studio 服務價目首頁">
          <span className="brand-mark">S</span>
          <span>
            <strong>SAM</strong>
            <small>DESIGN STUDIO</small>
          </span>
        </a>
        <a className="topbar-note" href="/">
          <span aria-hidden="true">←</span>
          返回設計服務價目
        </a>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <div className="eyebrow">DESIGN QUOTE CONCIERGE</div>
          <h1 aria-label="用幾個問題，找到適合你的設計預算。">
            <span className="headline-line">用幾個問題<span className="headline-punctuation">，</span></span>
            <br />
            <span className="headline-line">找到適合你的設計預算<span className="headline-punctuation">。</span></span>
          </h1>
          <p>
            從需求開始逐項確認，讓複雜的設計估價變得更清楚。
          </p>
          <div className="trust-list" aria-label="服務特色">
            <span>✓ 即時估價</span>
            <span>✓ 費用明細</span>
            <span>✓ 需求摘要</span>
          </div>
        </div>

        <div className="quote-workspace">
          <section className="chat-panel" aria-label="設計報價對話">
            <div className="chat-header">
              <div className="consultant">
                <span className="avatar">S</span>
                <span>
                  <strong>Sam 設計顧問</strong>
                  <small><i /> 線上協助中</small>
                </span>
              </div>
            </div>

            <div className="progress-wrap" aria-label={`試算進度 ${progress}%`}>
              <div className="progress-meta">
                <span>{step === "result" ? "試算完成" : "需求整理中"}</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <nav className="journey-nav" aria-label="快速跳轉試算步驟">
                <span className="journey-nav-label">步驟</span>
                <div
                  className="journey-nav-list"
                  ref={journeyNavListRef}
                  onPointerDown={startJourneyDrag}
                  onPointerMove={moveJourneyDrag}
                  onPointerUp={endJourneyDrag}
                  onPointerCancel={cancelJourneyDrag}
                  onClickCapture={(event) => {
                    if (!journeyDragRef.current.moved) return;
                    event.preventDefault();
                    event.stopPropagation();
                    journeyDragRef.current.moved = false;
                  }}
                >
                  {journeySteps.map((item, index) => (
                    <button
                      className={`journey-nav-button${item.current ? " is-current" : item.skipped ? " is-skipped" : !item.available ? " is-pending" : ""}`}
                      type="button"
                      key={item.section}
                      disabled={item.current || !item.available}
                      aria-current={item.current ? "step" : undefined}
                      aria-label={item.current ? `目前步驟：${item.label}` : item.skipped ? `不適用：${item.label}` : !item.available ? `尚未到達：${item.label}` : `前往步驟：${item.label}`}
                      onClick={() => item.available && jumpToJourneySection(item.section)}
                    >
                      <span aria-hidden="true">{item.current ? index + 1 : item.skipped ? "—" : !item.available ? index + 1 : "✓"}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
              {hasCollapsedConversationHistory && (
                <details className="conversation-history-collapse">
                  <summary>
                    <span aria-hidden="true">✓</span>
                    <strong>已完成 {completedConversationAnswers.length} 個步驟</strong>
                    <small>{latestConversationAnswer}</small>
                    <i aria-hidden="true">查看</i>
                  </summary>
                  <div className="conversation-history-answers">
                    {completedConversationAnswers.map((message, index) => (
                      <p key={`${message.text}-${index}`}><span>{index + 1}</span>{message.text}</p>
                    ))}
                  </div>
                </details>
              )}

              {visibleConversationMessages.map((message, index) => (
                <div className={`message-row ${message.speaker}`} key={`${message.text}-${index}`}>
                  {message.speaker === "studio" && <span className="mini-avatar">S</span>}
                  <div className="message-bubble">{message.text}</div>
                </div>
              ))}

              {step === "result" && (
                <div className="result-history-summary" role="status">
                  <span aria-hidden="true">✓</span>
                  <p><strong>需求已整理完成</strong><small>可使用上方步驟返回調整</small></p>
                </div>
              )}

              <div className={`message-row studio current-question step-transition is-${transitionDirection}${isStepExiting ? " is-leaving" : ""}`} key={`question-${stepMotionKey}`} ref={currentQuestionRef}>
                <span className="mini-avatar">S</span>
                <div className="message-bubble">{getQuestion(step, answers)}</div>
              </div>

              <div className={`response-area step-transition is-${transitionDirection}${history.length > 0 && !usesInlineBackNavigation && step !== "result" ? " with-back-navigation" : ""}${isStepExiting ? " is-leaving" : ""}`} key={`response-${stepMotionKey}`}>
                <div className="response-controls">{renderControls()}</div>
                {history.length > 0 && !usesInlineBackNavigation && step !== "result" && (
                  <div className="response-back-row">
                    <button className="response-back-button" type="button" onClick={goBack}>← 返回上一步</button>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </div>

            <div className="chat-footer">
              {step === "result" && <button type="button" onClick={goBack} disabled={history.length === 0}>← 返回上一步</button>}
              <button type="button" onClick={restart}>
                重新試算
              </button>
            </div>
          </section>

          <aside className={`summary-panel${isMobileSummaryExpanded ? " is-expanded" : ""}`} aria-label="即時估價摘要">
            <div className="summary-heading">
              <span>QUOTE SUMMARY</span>
              <strong>{step === "result" ? "需求摘要" : "即時摘要"}</strong>
              <small className="summary-context">
                {answers.projectType === "monthly" && monthlyAllocatedGroupCount > 0
                  ? monthlyDistributionComplete && plan
                    ? `${plan.name}・${formatGroupAmount(monthlyAllocatedGroupCount)} 組`
                    : `已選 ${formatGroupAmount(monthlyAllocatedGroupCount)} 組・待帶入方案`
                  : selectedServices.length > 0
                  ? `已選 ${selectedServices.length} 項服務`
                  : plan?.name ?? (answers.projectType === "single" ? "單次設計" : answers.projectType === "monthly" ? "月方案" : "尚未選擇服務")}
              </small>
            </div>

            <button
              className="summary-mobile-toggle"
              type="button"
              aria-expanded={isMobileSummaryExpanded}
              onClick={() => setIsMobileSummaryExpanded((current) => !current)}
            >
              <span>{isMobileSummaryExpanded ? "收合" : "明細"}</span>
              <i aria-hidden="true">{isMobileSummaryExpanded ? "↓" : "↑"}</i>
            </button>

            {step !== "result" && <div className={`live-total${showQuoteUpdated ? " is-updated" : ""}`}>
              <div className="live-total-heading">
                <span>目前初估</span>
                <span className={`quote-update-badge${showQuoteUpdated ? " is-visible" : ""}`} role="status" aria-live="polite">{showQuoteUpdated ? "已更新" : ""}</span>
              </div>
              {hasVisibleEstimate && quote.low > 0 ? (
                <strong className="quote-total-value" key={`${quote.low}-${quote.high}`}>{currency.format(quote.low)}<small> ～ {currency.format(quote.high)}</small></strong>
              ) : (
                <strong className="empty-total">選擇服務後顯示</strong>
              )}
            </div>}

            <dl className="summary-list">
              <div>
                <dt>合作方式</dt>
                <dd>{answers.projectType === "single" ? "單次設計" : answers.projectType === "monthly" ? "月方案" : "—"}</dd>
              </div>
              <div className={selectedServices.length > 0 ? "summary-services-row" : undefined}>
                <dt>項目</dt>
                <dd className={selectedServices.length > 0 ? "summary-service-items" : undefined}>
                  {selectedServices.length > 0
                    ? summaryServiceItems.map((item) => <span key={item}>{item}</span>)
                    : answers.projectType === "monthly" && plan ? "尚未選擇服務" : "—"}
                </dd>
              </div>
              {answers.projectType === "monthly" && plan && (
                <div>
                  <dt>配對方案</dt>
                  <dd>{plan.name}{answers.monthlyGroupCount ? `・${answers.monthlyGroupCount} 組／月` : ""}</dd>
                </div>
              )}
              {answers.projectType === "monthly" && monthlySourceFileCount > 0 && (
                <div>
                  <dt>原始檔</dt>
                  <dd>{monthlySourceFileCount} 份・費用另行確認</dd>
                </div>
              )}
              {answers.projectType === "monthly" && monthlyPrintProductionServices.length > 0 && (
                <div>
                  <dt>代辦印刷</dt>
                  <dd>{monthlyPrintProductionServices.map((service) => service.name).join("、")}・費用另行估價</dd>
                </div>
              )}
              <div>
                <dt>{answers.projectType === "monthly" ? "交付安排" : "交期"}</dt>
                <dd>{answers.projectType === "monthly"
                  ? answers.monthlyCadence ? monthlyCadenceLabels[answers.monthlyCadence] : "排程前確認"
                  : getSingleScheduleSummary(answers)}</dd>
              </div>
            </dl>

            {step !== "result" && hasVisibleEstimate && quote.low > 0 && (
              <div className="live-breakdown" aria-label="即時費用明細" aria-live="polite">
                <div className="live-breakdown-heading">
                  <strong>{answers.projectType === "monthly" && monthlyComparison ? "月方案價格比較" : "費用明細"}</strong>
                  <small>{answers.projectType === "monthly" && monthlyComparison
                    ? "兩筆金額不相加"
                    : quoteReady
                      ? "右側為小計"
                      : answers.projectType === "monthly"
                        ? "依目前服務與數量初估，後續規格會即時更新"
                        : "尚未完成的項目暫以 1 單位估算"}</small>
                </div>
                <div className="live-breakdown-list">
                  {answers.projectType === "monthly" && monthlyComparison ? (
                    <>
                      <div className="live-breakdown-row live-monthly-reference" style={{ "--price-row-index": 0 } as CSSProperties}>
                        <span className="live-breakdown-primary">
                          <b>單次合計參考</b>
                          <strong>{formatPriceRange(monthlyComparison.singleReference.low, monthlyComparison.singleReference.high)}</strong>
                        </span>
                        <small>比較基準，不另計</small>
                      </div>
                      <div className="live-monthly-discount" style={{ "--price-row-index": 1 } as CSSProperties}>
                        <span>{monthlyComparison.label}</span>
                        {monthlySavings && (
                          <strong>{monthlySavingsLabel}</strong>
                        )}
                      </div>
                      <div className="live-breakdown-row live-monthly-final" style={{ "--price-row-index": 2 } as CSSProperties}>
                        <span className="live-breakdown-primary">
                          <b>月方案初估</b>
                          <strong>{formatPriceRange(quote.low, quote.high)}</strong>
                        </span>
                        <small>已套用方案優惠</small>
                      </div>
                    </>
                  ) : quote.breakdown.map((item, index) => (
                    <div className="live-breakdown-row" key={`${item.label}-${item.detail}`} style={{ "--price-row-index": index } as CSSProperties}>
                      <span className="live-breakdown-primary">
                        <b>{compactSummaryServiceNames(item.label)}</b>
                        <strong>{formatPriceRange(item.low, item.high)}</strong>
                      </span>
                      <small>{item.detail}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="summary-help">
              <span aria-hidden="true">i</span>
              <p>{answers.projectType === "monthly" ? "未滿 3 組先顯示基礎初估；滿 3 組後依目前組數自動套用月方案優惠。" : "含 3 次細節修改；正式價格依需求確認。"}</p>
            </div>
          </aside>
        </div>
      </section>

      <footer>
        <p>© 2026 Sam Design Studio</p>
        <p>讓設計需求更清楚，讓合作從透明開始。</p>
      </footer>
    </main>
  );
}
