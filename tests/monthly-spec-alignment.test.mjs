import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("monthly services reuse the one-time specification choices", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const monthlyControls = source.match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";

  assert.match(monthlyControls, /月方案主視覺延伸張數[\s\S]*?<option value="">不需要則免填<\/option>/);
  assert.doesNotMatch(monthlyControls, /banner-extension-toggle/);
  assert.match(monthlyControls, /平台、尺寸、素材與製作方式（選填）/);
  assert.match(monthlyControls, /ecommercePlacementOptions\.map/);
  assert.match(monthlyControls, /ecommerceSizeOptions\.map/);
  assert.match(monthlyControls, /ecommerceCopyStatusLabels/);
  assert.match(monthlyControls, /ecommerceAssetStatusLabels/);
  assert.match(monthlyControls, /getEcommerceVisualLevelOptions\(item\.id\)/);

  assert.match(monthlyControls, /月方案系列海報延伸款數/);
  assert.match(monthlyControls, /serviceConfig\.purposeOptions\.map/);
  assert.match(monthlyControls, /serviceConfig\.specificationOptions\.map/);
  assert.match(monthlyControls, /serviceConfig\.contentOptions\.map/);
  assert.match(monthlyControls, /serviceConfig\.assetOptions\.map/);
  assert.match(monthlyControls, /serviceConfig\.complexityOptions\.map/);

  assert.match(monthlyControls, /單面｜\$1,000～1,500／款/);
  assert.match(monthlyControls, /雙面｜\$1,200～2,200／款/);
  assert.match(monthlyControls, /monthlyCardDetail\.applicationCount/);
  assert.match(source, /applicationCount \* 300/);
});

test("monthly cadence is the final standalone question and rules gate progress", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const confirmSource = source.match(/function confirmMonthlySourceFiles\(\) \{([\s\S]*?)function beginServiceQuestions/)?.[1] ?? "";
  const cadenceControl = renderControls.match(/case "monthlyCadence":([\s\S]*?)case "result":/)?.[1] ?? "";
  const monthlyControls = source.match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";

  assert.match(confirmSource, /move\(\s*"monthlyCadence"/);
  assert.match(cadenceControl, /這是月方案送出前的最後一題/);
  assert.equal(cadenceControl.match(/move\("result"/g)?.length, 3);
  assert.doesNotMatch(cadenceControl, /move\("complexity"/);
  assert.doesNotMatch(monthlyControls, /monthly-profile-optional/);

  assert.match(source, /const monthlyServiceSpecificationsComplete = selectedServices\.length > 0[\s\S]*?selectedServices\.every\(isMonthlySpecificationServiceComplete\)/);
  assert.match(source, /monthlyRulesComplete[\s\S]*?&& monthlyServiceSpecificationsComplete[\s\S]*?&& monthlyMissingDetailLabels\.length === 0/);
  assert.match(monthlyControls, /disabled=\{!monthlyRulesComplete\}/);
  assert.match(monthlyControls, /isMonthlySpecificationAdvancing \|\| \(isLastMonthlySpecification \? !monthlySpecificationsComplete : !activeMonthlyServiceComplete\)/);
  assert.match(monthlyControls, /目前.*組，再.*組即可使用月方案/);
  assert.match(monthlyControls, /平面設計已選.*月方案最多 2 組/);
  assert.match(monthlyControls, /目前符合.*formatMonthlyDiscount/);
  assert.match(monthlyControls, /這項每月大約需要幾次？/);
  assert.match(monthlyControls, /monthly-service-picker-quantity/);
  assert.match(source, /需要可編輯的原始檔嗎？/);
  assert.match(source, /需要協助印刷嗎？/);
  assert.match(source, /未滿 3 組先顯示基礎初估；滿 3 組後依目前組數自動套用月方案優惠/);
  assert.doesNotMatch(source, /monthlyProfile|monthlyFirstTime|monthlyVolume/);
});

test("monthly quantity controls stay compact without a blank side block", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const quantityRule = css.match(/\.monthly-service-picker-quantity \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const mobileRule = css.match(/@media \(max-width: 720px\) \{([\s\S]*?)@media \(prefers-reduced-motion/)?.[1] ?? "";

  assert.match(quantityRule, /display:\s*grid/);
  assert.match(quantityRule, /grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  assert.match(quantityRule, /margin:\s*-1px 0 0/);
  assert.doesNotMatch(mobileRule, /\.monthly-service-picker-quantity\s*\{[\s\S]*?flex-direction:\s*column/);
});

test("monthly result shows the website estimate only once", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const resultControl = source.match(/case "result":([\s\S]*?)const usesInlineBackNavigation/)?.[1] ?? "";

  assert.match(resultControl, /網站初步估價/);
  assert.match(resultControl, /單次合計參考/);
  assert.match(resultControl, /monthly-discount-row/);
  assert.doesNotMatch(resultControl, /monthly-price-row is-final/);
});
