import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = new URL("../app/page.tsx", import.meta.url);
const source = `${readFileSync(sourcePath, "utf8")}
export {
  getMonthlyDiscountedDesignRange,
  getMonthlyDiscountRate,
  getMonthlyLivePreviewQuote,
  getMonthlySingleReference,
  getQuote,
  getServiceEstimate,
  services,
};`;
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const pricingModule = { exports: {} };
new Function("require", "module", "exports", compiled)(require, pricingModule, pricingModule.exports);

const {
  getMonthlyDiscountedDesignRange,
  getMonthlyDiscountRate,
  getMonthlyLivePreviewQuote,
  getMonthlySingleReference,
  getQuote,
  getServiceEstimate,
  services,
} = pricingModule.exports;

function answers(overrides = {}) {
  return {
    projectType: "monthly",
    category: "ecommerce",
    serviceIds: [],
    quantities: {},
    ecommerceDesignDetails: {},
    printDesignDetails: {},
    monthlyPrintDesignDetails: {},
    serviceDesignDetails: {},
    monthlyServiceDesignDetails: {},
    productFrameProductCounts: [],
    sourceFileServiceIds: [],
    monthlySourceFileQuantities: {},
    printSpecifications: {},
    monthlyPlanId: "starter",
    monthlyGroupCount: 3,
    ...overrides,
  };
}

function monthlySocialAnswers(groupCount, totalImages) {
  return answers({
    serviceIds: ["social"],
    quantities: { social: groupCount },
    monthlyGroupCount: groupCount,
    socialPostCount: groupCount,
    socialPostImageCounts: [totalImages - groupCount + 1, ...Array(groupCount - 1).fill(1)],
  });
}

test("monthly group discounts match the published 3-to-10 group table", () => {
  const expectedRates = new Map([
    [3, 0.95], [4, 0.92], [5, 0.92], [6, 0.9],
    [7, 0.9], [8, 0.88], [9, 0.88], [10, 0.88],
  ]);
  for (const [groups, rate] of expectedRates) {
    assert.equal(getMonthlyDiscountRate(groups), rate);
  }
});

test("monthly live estimate appears as soon as a service is selected", () => {
  const oneSocialPost = answers({
    serviceIds: ["social"],
    quantities: { social: 1 },
    socialPostCount: 1,
    socialPostImageCounts: [1],
    monthlyPlanId: undefined,
    monthlyGroupCount: undefined,
  });
  const quote = getMonthlyLivePreviewQuote(oneSocialPost);
  assert.deepEqual([quote.low, quote.high], [500, 1000]);
  assert.match(quote.baseNote, /滿 3 組後套用月方案優惠/);
  assert.doesNotMatch(quote.breakdown.map((item) => item.label).join("|"), /月方案優惠/);
});

test("monthly live estimate applies the matching discount at three groups", () => {
  const threeSocialPosts = answers({
    serviceIds: ["social"],
    quantities: { social: 3 },
    socialPostCount: 3,
    socialPostImageCounts: [1, 1, 1],
    monthlyPlanId: undefined,
    monthlyGroupCount: undefined,
  });
  const quote = getMonthlyLivePreviewQuote(threeSocialPosts);
  assert.deepEqual([quote.low, quote.high], [1430, 2850]);
  assert.match(quote.breakdown.map((item) => item.label).join("|"), /月方案優惠（9\.5 折）/);
});

test("monthly social pricing applies only the monthly plan discount", () => {
  for (let groups = 3; groups <= 10; groups += 1) {
    const actual = getMonthlyDiscountedDesignRange(monthlySocialAnswers(groups, 10));
    const rawLow = groups * 500 + (10 - groups) * 250;
    const rawHigh = groups * 1000 + (10 - groups) * 500;
    const payableRate = getMonthlyDiscountRate(groups);
    assert.deepEqual(actual, {
      low: Math.round((rawLow * payableRate) / 10) * 10,
      high: Math.round((rawHigh * payableRate) / 10) * 10,
    });
  }
});

test("adding the tenth social image never lowers the monthly estimate", () => {
  const nine = getMonthlyDiscountedDesignRange(monthlySocialAnswers(3, 9));
  const ten = getMonthlyDiscountedDesignRange(monthlySocialAnswers(3, 10));
  const eleven = getMonthlyDiscountedDesignRange(monthlySocialAnswers(3, 11));
  assert.deepEqual(nine, { low: 2850, high: 5700 });
  assert.deepEqual(ten, { low: 3090, high: 6180 });
  assert.deepEqual(eleven, { low: 3330, high: 6650 });
  assert.ok(nine.low <= ten.low && ten.low <= eleven.low);
  assert.ok(nine.high <= ten.high && ten.high <= eleven.high);
});

test("single-order social volume discount remains 5% at 10 or more images", () => {
  const social = services.find((service) => service.id === "social");
  const estimate = (imageCounts) => getServiceEstimate(answers({
    projectType: "single",
    serviceIds: ["social"],
    quantities: { social: imageCounts.length },
    socialPostCount: imageCounts.length,
    socialPostImageCounts: imageCounts,
  }), social);
  assert.deepEqual(
    [estimate([8, 1]).baseLow, estimate([8, 1]).baseHigh],
    [2750, 5500],
  );
  assert.deepEqual(
    [estimate([9, 1]).baseLow, estimate([9, 1]).baseHigh],
    [2850, 5700],
  );
  assert.deepEqual(
    [estimate([10, 1]).baseLow, estimate([10, 1]).baseHigh],
    [3087.5, 6175],
  );
});

test("monthly comparison applies the single-order social discount to its reference", () => {
  assert.deepEqual(getMonthlySingleReference(monthlySocialAnswers(3, 9)), { low: 3000, high: 6000 });
  assert.deepEqual(getMonthlySingleReference(monthlySocialAnswers(3, 10)), { low: 3088, high: 6175 });

  const mixed = answers({
    serviceIds: ["social", "reel"],
    quantities: { social: 3, reel: 1 },
    monthlyGroupCount: 4,
    socialPostCount: 3,
    socialPostImageCounts: [8, 1, 1],
  });
  assert.deepEqual(getMonthlySingleReference(mixed), { low: 3488, high: 6975 });
});

test("mixed monthly services apply the same monthly rate to social and other design", () => {
  const mixed = answers({
    serviceIds: ["social", "reel"],
    quantities: { social: 3, reel: 1 },
    monthlyGroupCount: 4,
    socialPostCount: 3,
    socialPostImageCounts: [8, 1, 1],
  });
  assert.deepEqual(getMonthlyDiscountedDesignRange(mixed), { low: 3360, high: 6720 });
});

test("discountable extensions and undiscounted product add-ons stay separated", () => {
  const banner = answers({
    serviceIds: ["banner"],
    quantities: { banner: 3 },
    ecommerceDesignDetails: { banner: { bannerExtensionCount: 2 } },
  });
  assert.deepEqual(getMonthlyDiscountedDesignRange(banner), { low: 4370, high: 9410 });

  const productFrame = answers({
    serviceIds: ["product-frame"],
    quantities: { "product-frame": 3 },
    productFrameProductCounts: [2, 1, 2],
  });
  const quote = getQuote(productFrame);
  assert.deepEqual([quote.low, quote.high], [1420, 2280]);
});

test("monthly multi-page print pricing discounts the first page and added pages", () => {
  const print = answers({
    serviceIds: ["dm", "reel"],
    quantities: { dm: 1, reel: 2 },
    monthlyPrintDesignDetails: { dm: [{ structure: "multipage", pageCount: 5 }] },
  });
  assert.deepEqual(getMonthlyDiscountedDesignRange(print), { low: 4180, high: 7410 });
});

test("single-order source file and print-service percentages match the explanations", () => {
  const banner = services.find((service) => service.id === "banner");
  const estimate = getServiceEstimate(answers({
    projectType: "single",
    serviceIds: ["banner"],
    quantities: { banner: 2 },
    ecommerceDesignDetails: { banner: { bannerExtensionCount: 1 } },
    sourceFileServiceIds: ["banner"],
    printSpecifications: { banner: { support: true } },
  }), banner);
  assert.deepEqual(
    [estimate.baseLow, estimate.baseHigh, estimate.addonLow, estimate.addonHigh],
    [2000, 5000, 800, 1200],
  );
  assert.deepEqual([estimate.sourceLow, estimate.sourceHigh], [1000, 2500]);
  assert.deepEqual([estimate.printLow, estimate.printHigh], [300, 750]);
  assert.deepEqual([estimate.totalLow, estimate.totalHigh], [4100, 9450]);
});
