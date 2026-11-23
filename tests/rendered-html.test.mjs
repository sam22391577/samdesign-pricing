import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("price site keeps print guidance inside one notes section", async () => {
  const source = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  const notesSection = source.match(/<div class="category-note reveal" data-category="ecommerce print other"[\s\S]*?<\/ul>\s*<\/div>/)?.[0] ?? "";

  assert.match(notesSection, />注意事項<\/h3>/);
  assert.match(notesSection, /以上報價僅為初估，實際收費以了解需求後之正式報價單為準/);
  assert.match(notesSection, /單次設計每案包含 3 次細節修改/);
  assert.match(notesSection, /如需協助整理文案、處理圖片或準備素材，相關費用將於正式報價前確認/);
  assert.match(notesSection, /依基本設計費的 50% 計費，網站主視覺延伸不計入原始檔費用/);
  assert.match(notesSection, /產品圖框的原始檔價格僅含第一版（不含追加產品）/);
  assert.match(notesSection, /如需代辦印刷，代辦服務費為該項設計費 15%/);
  assert.match(notesSection, /印刷品及運送產生的費用採實報實銷/);
  assert.doesNotMatch(source, /共同注意事項|>印刷相關<\/h3>/);
  assert.match(source, /試算時先選擇交付節奏，實際交付日期於合作時確認/);
  assert.match(source, /單次服務依項目約 2～10 個工作天，以試算頁顯示的時間為準/);
  assert.match(source, /單次服務每案、月方案每組皆包含 3 次細節修改/);
  assert.doesNotMatch(source, /下一次另行委託的延伸設計可討論以 8 折報價/);
  assert.equal((source.match(/class="category-note reveal"/g) ?? []).length, 1);
});

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/calculator", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("service names and specification prompts use plain progressive language", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  for (const label of [
    "網站橫幅／活動主視覺",
    "IG／FB 社群圖文",
    "影片封面／YouTube 縮圖",
    "商品主圖套版",
    "Resize",
    "活動／促銷海報",
    "傳單／宣傳單",
    "菜單設計",
    "修圖／去背",
    "簡報／版型模板",
  ]) {
    assert.match(source, new RegExp(label));
  }

  assert.match(source, /<legend>先確認這些<\/legend>/);
  assert.doesNotMatch(source, /會影響估價/);
  assert.match(source, /其他細節可稍後確認/);
  assert.match(source, /不確定，請協助建議/);
  assert.doesNotMatch(source, /可以之後再說|之後再說/);
  assert.doesNotMatch(source, /設計師/);
  assert.match(source, /這張圖要放在哪裡？/);
  assert.match(source, /文字內容準備好了嗎？/);
  assert.match(source, /Logo 和圖片準備好了嗎？/);
  assert.match(css, /\.optional-details\[open\] \.optional-details-body/);
  assert.match(css, /@keyframes optional-details-reveal/);
});

test("specification cards use the same Noto Serif TC title font", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.ok((source.match(/specification-card/g)?.length ?? 0) >= 4);
  assert.match(css, /--title-serif: "Noto Serif TC", "Songti TC", serif/);
  assert.match(css, /\.specification-card,[\s\S]*?\.specification-card select,[\s\S]*?font-family: var\(--title-serif\)/);
  assert.match(source, /className="multi-select-wrap print-production-selector"/);
  assert.match(css, /\.print-production-selector,[\s\S]*?\.print-production-details select,[\s\S]*?font-family: var\(--title-serif\)/);
});

test("service-item supporting text loads Noto Sans TC at one consistent size", async () => {
  const [layout, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /family=Noto\+Sans\+TC:wght@400;500;600;700&family=Noto\+Serif\+TC/);
  assert.match(css, /--service-small-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif/);
  assert.match(css, /\.service-category-copy small,[\s\S]*?\.service-choices \.choice \.choice-schedule,[\s\S]*?\.monthly-service-choice \.choice-price,[\s\S]*?font-family: var\(--service-small-sans\);[\s\S]*?font-size: 0\.68rem/);
});

test("specification supporting text matches the service-item font and size", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /div\.specification-card small,[\s\S]*?\.specification-card \.compact-field > span,[\s\S]*?\.specification-card \.optional-details-intro,[\s\S]*?font-family: var\(--service-small-sans\);[\s\S]*?font-size: 0\.68rem/);
});

test("specification fields use one cross-platform PingFang-like font with softer empty values", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /--specification-ui-sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif/);
  assert.match(css, /--specification-placeholder-ink: rgba\(48, 40, 33, 0\.52\)/);
  assert.match(css, /\.specification-card input,[\s\S]*?\.specification-card select,[\s\S]*?\.specification-card textarea,[\s\S]*?\.specification-card option \{[\s\S]*?font-family: var\(--specification-ui-sans\);[\s\S]*?font-weight: 500/);
  assert.match(css, /\.specification-card \.optional-details > summary small \{[\s\S]*?font-family: var\(--specification-ui-sans\);[\s\S]*?font-weight: 400/);
  assert.match(css, /\.specification-card select:has\(option:checked\[value=""\]\),[\s\S]*?\.specification-card textarea::placeholder \{[\s\S]*?color: var\(--specification-placeholder-ink\)/);
});

test("server-renders the conversational quote calculator page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>設計報價試算｜Sam Design Studio<\/title>/);
  assert.match(html, /找到適合你的設計預算/);
  assert.match(html, /Sam 設計顧問/);
  assert.match(html, /class="avatar">S<\/span>/);
  assert.match(html, /class="mini-avatar">S<\/span>/);
  assert.match(html, /返回設計服務價目/);
  assert.doesNotMatch(html, /Bono|BONO|優先排程|近期作品/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("original pricing homepage links to the calculator page", async () => {
  const [html, portfolioPage] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/作品案例.html", import.meta.url), "utf8"),
  ]);
  const monthlySection = html.match(/<section id="monthly"[\s\S]*?<!-- Process -->/)?.[0] ?? "";
  assert.match(html, /設計服務價目 · Design Studio/);
  assert.match(html, /href="\/calculator" class="btn btn-primary">立即試算<\/a>/);
  assert.match(html, /id="pricing"/);
  assert.match(html, /id="monthly"/);
  assert.match(html, /id="faq"/);
  assert.match(html, /素材與授權需要注意什麼？[\s\S]*?可以接急件嗎？[\s\S]*?目前不接受急件。單次服務依項目約 2～10 個工作天/);
  assert.match(html, /可以接急件嗎？[\s\S]*?月方案依選擇的交付節奏安排，實際日期於合作時確認/);
  assert.match(monthlySection, /<div class="section-header reveal">/);
  assert.match(monthlySection, /<div class="monthly-cooperation-note reveal"/);
  assert.doesNotMatch(html, /#monthly \.container > \.reveal\[style\]/);
  assert.match(monthlySection, /適合需要持續產出的品牌與創作者，依需求訂製您的專屬方案/);
  assert.match(monthlySection, /月方案提供電商／平面設計服務，每月至少 3 組、最多 10 組，依單次設計費合計與組數套用 9\.5 折至 8\.8 折。每項服務數量計 1 組，IG／FB 社群圖文以每篇計 1 組；平面設計每月合計限 2 組，未使用組數不累積/);
  assert.doesNotMatch(monthlySection, /月方案組數以當月使用為主|Resize、照片後製與模板設計請使用單次估價/);
  assert.match(monthlySection, /網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠；商品主圖套版追加產品按單次價格另計且不套用月方案折扣；IG／FB 社群圖文總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用/);
  assert.doesNotMatch(monthlySection, /月方案依所選服務的單次設計費合計套用 8\.8～9\.5 折/);
  assert.doesNotMatch(monthlySection, /Resize 2 張占 1 組|月方案提供[^。]*Resize 服務/);
  assert.doesNotMatch(html, /每張／版占|每張／項占/);
  assert.match(monthlySection, /class="feature-label">組數｜<\/strong>2～3 組設計[\s\S]*?class="feature-label">組數｜<\/strong>8～10 組設計/);
  assert.doesNotMatch(monthlySection, /class="feature-label">服務｜<\/strong>/);
  assert.match(monthlySection, /class="feature-label">修改｜<\/strong>每組含 3 次細節修改/);
  assert.match(html, /\.monthly-grid \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\); \}/);
  assert.doesNotMatch(monthlySection, /monthly-plan-picker|data-monthly-plan|monthly-price-breakdown|monthly-card-cta/);
  assert.doesNotMatch(html, /monthlyPriceByGroup|monthlyPlanNames|data-monthly-groups/);
  assert.match(html, /id="recent-work-title">近期作品/);
  assert.match(html, /href="作品案例\.html" class="btn btn-outline">作品案例/);
  assert.match(portfolioPage, /href="index\.html">← 返回服務價目/);
  assert.match(portfolioPage, /assets\/instagram\/elbowdao-bono-profile\.jpg/);
  assert.match(html, /class="marquee-track"/);
  assert.match(html, /assets\/portfolio\/fashion-sale-luxe\.webp/);
  assert.match(html, /requestAnimationFrame\(animateMarquee\)/);
  assert.match(html, /class="hero-secondary-links"/);
  assert.match(html, /class="hero-secondary-links"[\s\S]*?href="#pricing" class="btn btn-outline">查看服務[\s\S]*?href="#monthly"/);
  assert.match(html, /class="hero-secondary-links"[\s\S]*?href="#contact" class="btn btn-outline">與我聯絡<\/a>[\s\S]*?href="\/calculator" class="btn btn-primary">立即試算<\/a>[\s\S]*?<\/nav>/);
  assert.doesNotMatch(html, /class="cta-buttons hero-primary-actions"/);
  assert.match(html, /\.hero-secondary-links \{[\s\S]*?margin-top: 0;[\s\S]*?gap: 0\.8rem;/);
  assert.doesNotMatch(html, /\.hero-secondary-links \.btn \{[^}]*border: 0;/);
  assert.match(html, /class="cta-buttons contact-buttons">[\s\S]*?href="\/calculator" class="btn btn-primary">立即試算/);
  assert.doesNotMatch(html, /docs\.google\.com\/forms|>填寫表單</);
  assert.doesNotMatch(html, /包月張數/);
  assert.match(html, /<h3>影片／Reel 封面<\/h3>/);
  assert.match(html, /data-category="other">[\s\S]*?<h3>Resize 尺寸延伸<\/h3>/);
  assert.doesNotMatch(html, /data-category="ecommerce">[\s\S]{0,180}<h3>Resize 尺寸延伸<\/h3>/);
  assert.match(html, /網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠；商品主圖套版追加產品按單次價格另計且不套用月方案折扣，未使用組數不累積/);
  assert.match(html, /單次服務依項目約 2～10 個工作天，以試算頁顯示的時間為準/);
  assert.doesNotMatch(html, /優先約 3～5 個工作天|設計費 \+20%/);
  assert.match(html, /實際時間仍會受到當時排程、素材完整度與設計複雜度影響/);
  assert.doesNotMatch(html, /回覆速度/);
  assert.match(html, /若必要素材延遲提供，交期將順延/);
  assert.doesNotMatch(html, /若延遲提供素材或回覆，交期將順延/);
  assert.match(html, /月方案原始檔可依服務與數量彈性加購，費用另行確認，暫不計入網站初估/);
  assert.match(html, /20% 訂金作為已排定工時費用不退/);
  assert.match(html, /20% 訂金、80% 尾款/);
  assert.doesNotMatch(html, /40% 訂金|60% 尾款/);
  assert.doesNotMatch(html, /data-category="ecommerce print other"/);
  assert.match(html, /@media \(min-width: 769px\)[\s\S]*?\.hero \.container \{ text-align: center; \}/);
  assert.match(html, /\.hero h1 \{ display: block; width: fit-content; margin-left: auto; margin-right: auto; \}/);
  assert.match(html, /\.hero \.cta-buttons \{ justify-content: center; \}/);
  assert.match(html, /照片後製[\s\S]*?\$<\/span>150～750[\s\S]*?\/ 張/);
  assert.match(html, /基礎調色、去背與細節修整/);
  assert.match(html, /class="feature-label">估價｜<\/strong>依照片狀況與合成難度/);
  assert.doesNotMatch(monthlySection, /2 組 \$1,500～2,100|3 組 \$2,100～2,700|6 組 \$4,200～5,200|8 組 \$5,600～7,000/);
  assert.match(monthlySection, /9\.5 折[\s\S]*?9\.2～9\.5 折[\s\S]*?9 折[\s\S]*?8\.8 折/);
  assert.match(html, /電商商品圖框與促銷資訊套版/);
  assert.match(html, /class="feature-label">追加｜<\/strong>每增加 1 項產品 \+\$70/);
  assert.match(html, /class="feature-label">尺寸｜<\/strong>9 × 5\.4 cm（標準）/);
  assert.match(html, /<h3>模板設計<\/h3>[\s\S]*?業務簡報、講座教材與會議版型[\s\S]*?\$<\/span>1,000～3,000[\s\S]*?\/ 版/);
  assert.match(html, /<h3>大型海報<\/h3>[\s\S]*?\$<\/span>1,800～3,000[\s\S]*?\/ 款[\s\S]*?class="feature-label">尺寸｜<\/strong>A3 以上/);
  assert.doesNotMatch(html, /A3 海報|A3 尺寸\(297x420mm\)/);
  assert.match(html, /<h3>社群圖<\/h3>[\s\S]*?<p class="subtitle">FB／IG 貼文、活動與品牌宣傳視覺<\/p>/);
  assert.match(html, /<h3>網頁 Banner<\/h3>[\s\S]*?\$<\/span>1,000～2,500[\s\S]*?\/ 版[\s\S]*?加購｜<\/strong>主視覺延伸 \$800～1,200 \/ 張/);
  assert.doesNotMatch(html, /<h3>主視覺延伸設計<\/h3>|service=key-visual-extension/);
  assert.match(html, /<h3>影片／Reel 封面<\/h3>[\s\S]*?需提供標題或主視覺素材/);
  assert.match(html, /需提供定稿文案或圖片/);
  assert.doesNotMatch(html, /需提供定稿文案與圖片|需提供標題與主視覺素材/);
  assert.match(html, /<h3>社群圖<\/h3>[\s\S]*?class="feature-label">延伸｜<\/strong>同篇第 2 張起，每張 \+\$250～\$500/);
  assert.match(html, /<h3>社群圖<\/h3>[\s\S]*?class="feature-label">限制｜<\/strong>每篇貼文最多 10 張圖/);
  assert.match(html, /單次委託累計 10 張以上享 9\.5 折優惠，可包含多篇貼文/);
  assert.doesNotMatch(html, /同篇貼文同風格延伸[\s\S]*?\+\$150～\$300/);
  assert.doesNotMatch(html, /FB\s*[／/]\s*IG 社群圖/);
  assert.match(html, /<h3>傳單／DM<\/h3>[\s\S]*?1,200～3,000[\s\S]*?基本設計（第 1 面／頁）/);
  assert.doesNotMatch(html, /<h3>傳單<\/h3>|<h3>DM<\/h3>/);
  assert.match(html, /<h3>名片／會員卡<\/h3>[\s\S]*?個人名片、品牌名片與會員卡/);
  assert.match(html, /依現有設計延伸不同使用尺寸/);
  assert.equal(html.match(/可編輯原始檔為有價產品/g)?.length, 2);
  assert.equal(html.match(/依該項設計費小計 50% 計費；產品圖框不含追加產品費/g)?.length, 2);
  assert.doesNotMatch(html, /原始編輯檔/);
  assert.match(html, /<h3>傳單／DM<\/h3>[\s\S]*?第 2 頁起[\s\S]*?600～800[\s\S]*?\/ 頁/);
  assert.match(html, /<h3>菜單<\/h3>[\s\S]*?第 2 頁起[\s\S]*?600～800[\s\S]*?\/ 頁/);
  assert.equal(html.match(/首版（第 1 頁）/g)?.length, 1);
  assert.equal(html.match(/基本設計（第 1 面／頁）/g)?.length, 1);
  assert.equal(html.match(/第 2 頁起/g)?.length, 2);
  assert.doesNotMatch(html, /傳單\/DM\/菜單|同系列第二張起/);
  assert.doesNotMatch(html, /急件[^。]*加價|2 個工作天內/);
  assert.doesNotMatch(html, /20-50%/);
  assert.match(html, /本次單次服務完成後，下一次另行委託的延伸設計可討論以 8 折報價；月方案不適用/);
  assert.doesNotMatch(html, /每組設計贈送 Resize 1 張|輕量與標準方案每組設計贈送 Resize 1 張/);
  const calculatorServiceIds = [
    "banner",
    "social",
    "reel",
    "product-frame",
    "poster",
    "dm",
    "menu",
    "card",
    "resize",
    "photo",
    "slides",
  ];
  calculatorServiceIds.forEach((serviceId) => {
    assert.match(html, new RegExp(`class="service-card-cta" href="/calculator\\?service=${serviceId}"`));
  });
  assert.equal(html.match(/class="service-card-cta"/g)?.length, calculatorServiceIds.length + 4);
  assert.equal(monthlySection.match(/class="service-card-cta" href="\/calculator\?mode=monthly">前往試算/g)?.length, 4);
  assert.match(html, /\.service-card-cta \{[^}]*align-self: flex-end;[^}]*justify-content: flex-start;[^}]*gap: 0\.45rem;[^}]*width: fit-content;[^}]*border: 0;[^}]*background: transparent;/);
  assert.doesNotMatch(html, /\.service-card-cta \{[^}]*justify-content: space-between;/);
  assert.doesNotMatch(html, /\.service-card-cta \{[^}]*justify-content: center;/);
});

test("monthly calculator mirrors the homepage cooperation notes", async () => {
  const [html, source] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
  ]);
  const cooperationNotes = [
    "月方案提供電商／平面設計服務，每月至少 3 組、最多 10 組，依單次設計費合計與組數套用 9.5 折至 8.8 折。每項服務數量計 1 組，IG／FB 社群圖文以每篇計 1 組；平面設計每月合計限 2 組，未使用組數不累積",
    "網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠；商品主圖套版追加產品按單次價格另計且不套用月方案折扣；IG／FB 社群圖文總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用",
    "正式金額依設計項目、內容複雜度與素材狀況確認；試算時先選擇交付節奏，實際交付日期於合作時確認",
    "月方案如需取消或調整，最晚於製作前 2 日告知。已開始製作的部分不予退款；僅尚未開始製作的部分可依實際進度評估退款。20% 訂金作為已排定工時費用不退，80% 尾款於交付前付清",
    "月方案原始檔可依服務與數量彈性加購，費用另行確認，暫不計入網站初估。若需代辦印刷，將於合作確認時另行估價，暫不計入網站初估",
  ];

  cooperationNotes.forEach((note) => {
    assert.ok(html.includes(note));
    assert.ok(source.includes(note));
  });
  assert.match(source, /方案規則：\$\{monthlyCooperationNotes\[0\]\}/);
});

test("calculator service links preselect one service and open its specification step", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const searchParams = new URLSearchParams\(window\.location\.search\)/);
  assert.match(source, /const serviceId = searchParams\.get\("service"\)/);
  assert.match(source, /const requestedMode = searchParams\.get\("mode"\)/);
  assert.match(source, /serviceIds: \[service\.id\]/);
  assert.match(source, /specificationStep = "ecommerceDetails"/);
  assert.match(source, /specificationStep = "printDetails"/);
  assert.match(source, /specificationStep = "serviceDetails"/);
  assert.match(source, /setJourneyTimeline\(\[cooperationEntry, serviceEntry, specificationEntry\]\)/);
  assert.match(source, /setExpandedServiceCategory\(service\.category\)/);
  assert.match(source, /if \(requestedMode === "monthly"\)[\s\S]*?setStep\("monthlyServices"\)/);
  assert.match(source, /setJourneyTimeline\(\[cooperationEntry, monthlyEntry\]\)/);
  assert.match(source, /const question = currentQuestionRef\.current;[\s\S]*?if \(isVisible\) return;[\s\S]*?question\.scrollIntoView\(\{[\s\S]*?block: "center"/);
  assert.match(source, /prefers-reduced-motion: reduce/);
});

test("homepage interaction polish stays compact and motion-aware", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /class="marquee-wrapper" aria-label="近期作品輪播，可左右拖曳"/);
  assert.match(html, /const normalSpeed = -32/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.match(html, /pointerdown|pointermove|pointerup/);
  assert.match(html, /\.pricing-card:hover,[\s\S]*?\.pricing-card:focus-within \{[\s\S]*?transform: translateY\(-2px\)/);
  assert.match(html, /--motion-standard: 460ms/);
  assert.match(html, /transition-delay: var\(--reveal-delay, 0ms\)/);
  assert.match(html, /Math\.min\(index, 5\) \* 55/);
  assert.match(html, /pricingGrid\.classList\.add\('is-filtering'\)/);
  assert.match(html, /height var\(--motion-standard\) var\(--motion-ease\)/);
  assert.match(html, /const previousHeight = pricingGrid\.getBoundingClientRect\(\)\.height/);
  assert.match(html, /const nextHeight = pricingGrid\.getBoundingClientRect\(\)\.height/);
  assert.match(html, /pricingGrid\.classList\.add\('is-settling'\)/);
  assert.match(html, /@keyframes pricing-card-settle/);
  assert.match(html, /filterPricingCards\(tab\.dataset\.category, true\)/);
  assert.match(html, /marqueeWrapper\.classList\.add\('is-running'\)/);
  assert.match(html, /document\.addEventListener\('visibilitychange'/);
  assert.match(html, /const marqueeObserver = new IntersectionObserver/);
  assert.match(html, /\.hero \.container\.reveal > \* \{[\s\S]*?var\(--motion-standard\)/);
  assert.match(html, /\.faq-answer \{ display: grid; grid-template-rows: 0fr;/);
  assert.match(html, /\.hero \{ min-height: auto; padding: 3\.75rem 0 3\.5rem;/);
  assert.match(html, /font-size: clamp\(2\.85rem, 13vw, 3\.8rem\)/);
});

test("service tabs only filter one-time pricing cards", async () => {
  const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
  assert.match(html, /class="category-note reveal" data-category="ecommerce other"/);
  assert.match(html, /需請您提供文字檔、圖片（商品照、情境圖等）及其他必要品牌素材/);
  assert.match(html, /代辦服務費為該項設計費 15%/);
  assert.doesNotMatch(html, /需請您提供文字、圖片、可編輯原始檔等該項服務所需素材|酌收報價 15% 代辦費用/);
  assert.match(html, /document\.querySelectorAll\('#pricing \.pricing-card'\)/);
  assert.match(html, /document\.querySelectorAll\('#pricing \.tab'\)/);
  assert.match(html, /document\.querySelector\('#pricing \.tab\.active'\)/);
  assert.doesNotMatch(html, /document\.querySelectorAll\('\.pricing-card'\)/);
});

test("calculator uses service-specific draft schedules with a 5–10 day default", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /type Timeline = "regular"/);
  assert.match(source, /regular: "5～10 個工作天（實際時間視當時排程而定）"/);
  assert.match(source, /regular: "5～10 個工作天"/);
  assert.match(source, /serviceTimelineSummaryLabels[\s\S]*?banner: "5～7 個工作天"[\s\S]*?card: "3～5 個工作天"/);
  assert.equal(source.match(/\{renderSharedScheduleNote\(active(?:EcommerceService|DetailedService|ServiceDetailService)\.id\)\}/g)?.length, 3);
  assert.match(source, /function renderSharedScheduleNote\(serviceId: string\)[\s\S]*?此項服務初稿排程[\s\S]*?getServiceTimelineSummary\(serviceId\)[\s\S]*?實際時間視當時排程而定/);
  assert.doesNotMatch(source, /className="compact-field schedule-readonly"/);
  assert.match(source, /OptionButton label=\{getServiceTimelineSummary\(timelineServiceId\)\} detail="實際時間視當時排程而定"/);
  assert.doesNotMatch(source, /"priority"|優先排程|3～5 個工作天・設計費|設計費 \+20%/);
  assert.doesNotMatch(source, /rush|急件|2 個工作天內|近期作品|Bono|BONO/);
  assert.doesNotMatch(source, /第一版為一般排程|第一版固定為一般排程/);
  assert.match(source, /function getSingleScheduleSummary\(answers: Answers\)[\s\S]*?getServiceTimelineSummary\(serviceId\)/);
  assert.match(source, /getServiceTimelineLabel\(service\.id\)/);
  assert.match(source, /name: "照片後製",[\s\S]*?low: 150,[\s\S]*?high: 750/);
  assert.match(source, /name: "模板設計",[\s\S]*?description: "業務簡報、講座教材、會議",[\s\S]*?low: 1000,[\s\S]*?high: 3000,[\s\S]*?unit: "版"/);
  assert.match(source, /name: "大型海報",[\s\S]*?description: "A3 以上尺寸的活動宣傳、促銷海報"/);
  assert.match(source, /specificationLabel: "大型海報尺寸與方向"/);
  assert.doesNotMatch(source, /name: "A3 海報"/);
  assert.match(source, /id: "social",[\s\S]*?name: "社群圖",[\s\S]*?description: "FB／IG 貼文、活動與品牌視覺"/);
  assert.doesNotMatch(source, /name: "FB／IG 社群圖"/);
});

test("monthly plan asks client-focused recurring-work questions", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const monthlyServices = source.slice(source.indexOf("function renderControls()")).match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";
  assert.match(source, /這是第一次和 Sam Design Studio 合作嗎/);
  assert.match(source, /monthlyFirstTime/);
  assert.match(source, /monthlyGroupCount/);
  assert.match(source, /getMonthlyPlanForCount/);
  assert.match(source, /系統會依單次設計費合計自動帶入方案與優惠/);
  assert.match(source, /希望每月的設計如何安排交付/);
  assert.match(source, /每月設計的平均複雜度/);
  assert.match(source, /每月會使用的文字/);
  assert.match(source, /請確認合作紀錄，再選擇本月需要的服務與數量/);
  assert.doesNotMatch(source, /主要設計類型/);
  assert.doesNotMatch(source, /社群圖、Reel 封面、產品圖框占 1 組|Banner、平面設計占 2 組/);
  assert.match(source, /每週固定交付/);
  assert.match(source, /活動前集中製作/);
  assert.match(monthlyServices, /className="monthly-first-time-inline"/);
  assert.match(monthlyServices, /是，第一次合作/);
  assert.match(monthlyServices, /不是，之前合作過/);
  assert.match(monthlyServices, /<details className="optional-details monthly-profile-optional">/);
  assert.match(monthlyServices, /<summary>其他需求（選填）<\/summary>/);
  assert.doesNotMatch(monthlyServices, /下一步選擇每月需要的服務與數量後/);
  assert.match(source, /方案規則：\$\{monthlyCooperationNotes\[0\]\}/);
  assert.match(source, /可只加購部分項目/);
  assert.doesNotMatch(source, /monthlySourceFiles/);
  assert.match(source, /monthlySourceFileQuantities/);
  assert.match(source, /是否需要加購可編輯原始檔？不需要可直接完成試算/);
  assert.match(source, /adjustMonthlySourceFileQuantity/);
  assert.match(source, /function getMonthlySourceFileSelections/);
  assert.match(source, /answers\.serviceIds\.includes\(service\.id\)/);
  assert.match(source, /quantity: Math\.min\(/);
  assert.match(source, /請直接選擇需要原始檔的服務與數量/);
  assert.doesNotMatch(source, /未選＝不需要原始檔/);
  assert.match(source, /hasAddOns \? "確認選擇 →" : "全部不需要 →"/);
  assert.match(source, /answers\.projectType === "monthly"[\s\S]*?是否需要加購原始檔或代辦印刷？可依項目選擇/);
  assert.match(source, /monthly-print-support[\s\S]*?<strong>代辦印刷<\/strong>/);
  assert.match(source, /印量、紙張與加工於正式合作時確認，費用另行估價，暫不計入網站初估/);
  assert.match(source, /function confirmMonthlySourceFiles\(\)[\s\S]*?printSpecifications[\s\S]*?代辦印刷：\$\{printNames\.join\("、"\)\}/);
  assert.match(source, /item\.pricing === "dm"[\s\S]*?`\$\{maximum\} 項`/);
  assert.match(source, /暫不計入網站初估/);
  assert.match(source, /月方案原始檔加購（\$\{sourceFileSelections\.map/);
  assert.match(source, /）：費用另行確認/);
  assert.match(source, /月方案優惠（\$\{formatMonthlyDiscount\(discountRate\)\}）/);
  assert.match(source, /單次參考／優惠後/);
  assert.doesNotMatch(source, /目前依所選服務的單次價格合計套用月方案優惠；正式金額依內容複雜度與素材確認/);
  assert.doesNotMatch(source, /function getMonthlySourceFilePricing|function getMonthlySourceFilePriceBasis|monthlySourceTarget/);
  assert.doesNotMatch(source, /原始檔加購｜\$\{monthlySourceFileLabel\}/);
  assert.doesNotMatch(source, /整個月方案需要原始檔|月方案原始檔（基本費 \+50%）/);
});

test("completed estimate can be downloaded as a branded PDF", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /const lineContactUrl = "https:\/\/line\.me\/ti\/p\/th3zPeeCre"/);
  assert.match(source, /className="line-button" href=\{lineContactUrl\}/);
  assert.doesNotMatch(source, /line\.me\/R\/share/);
  assert.match(source, /下載估價單/);
  assert.match(source, /downloadEstimate/);
  assert.match(source, /createPdfFromJpegs/);
  assert.match(source, /%PDF-1\.4/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /\/ToUnicode 6 0 R/);
  assert.match(source, /3 Tr/);
  assert.match(source, /textLines: pageTextLayers\[pageIndex\]/);
  assert.match(source, /Sam-Design-Studio-估價單-\$\{estimateReference\}\.pdf/);
  assert.match(source, /const referenceTime = new Intl\.DateTimeFormat/);
  assert.match(source, /const estimateReference = `SAM-\$\{fileDate\.replaceAll\("-", ""\)\}-\$\{referenceTime\}`/);
  assert.match(source, /const validUntilDate = new Date\(now\.getTime\(\) \+ 14 \* 24 \* 60 \* 60 \* 1000\)/);
  assert.match(source, /label: "有效期限", value: validUntil/);
  assert.match(source, /function loadPdfContactQrCode/);
  assert.match(source, /\/assets\/embedded\/87272102c4a651a7\.webp/);
  assert.match(source, /label: "聯絡方式", value: "掃描 QR Code\\n確認正式報價與可安排檔期", qrCode: true/);
  assert.doesNotMatch(source, /label: "聯絡方式"[^\n]*lineContactUrl/);
  assert.match(source, /pageCanvases/);
  assert.match(source, /function loadPdfLogoWatermark/);
  assert.match(source, /\/assets\/brand\/sa-design-logo-square\.png/);
  assert.match(source, /function drawPdfLogoWatermark/);
  assert.match(source, /const markWidth = 810/);
  assert.match(source, /context\.globalAlpha = 0\.1/);
  assert.match(source, /const rowFontSize = 19/);
  assert.match(source, /const measureEstimateRow =/);
  assert.match(source, /Math\.max\(labelLines\.length, valueLines\.length\)/);
  assert.match(source, /const rowHeight = row\.qrCode \? Math\.max\(176, textRowHeight\) : textRowHeight/);
  assert.match(source, /context\.drawImage\(contactQrCode, qrLeft, qrTop, qrSize, qrSize\)/);
  assert.match(source, /const drawInlineGroupHeader =/);
  assert.match(source, /const inlineHeaderHeight = 76/);
  assert.match(source, /y \+ inlineHeaderHeight \+ firstRowHeight > bodyBottom/);
  assert.match(source, /currentPage = createEstimatePage\(`\$\{group\.title\}（續）`\)/);
  assert.match(source, /第 \$\{index \+ 1\}／\$\{pageCanvases\.length\} 頁/);
  assert.match(source, /const estimateNotice = "此為初估，正式費用以確認需求後的報價單為準。"/);
  assert.match(source, /const pdfSummaryLines = summaryLines[\s\S]*?\.slice\(1, -1\)/);
  assert.match(source, /const detailRowGroups: Array<\{ title: string; rows: EstimateRow\[\] \}>/);
  assert.match(source, /const rowGroups: Array<\{ title: string; rows: EstimateRow\[\] \}>/);
  assert.match(source, /title: "合作與聯絡"/);
  assert.match(source, /const isOmittablePdfRow/);
  assert.match(source, /const singleCompactRows/);
  assert.match(source, /label: "服務項目"/);
  assert.match(source, /交期：約/);
  assert.match(source, /const totalPanelTop = 210/);
  assert.match(source, /if \(isFirstPage\)/);
  assert.match(source, /let currentPage = createEstimatePage\(rowGroups\[0\]\?\.title, true\)/);
  assert.match(source, /const isTotalRow = row\.label\.includes\("總額"\) \|\| row\.label\.includes\("本項初估"\)/);
  assert.match(source, /const rowFill = isTotalRow \? "#e6d8cd"/);
  assert.match(source, /label: "說明", value: estimateNotice/);
  assert.doesNotMatch(source, /previewPdf|document\.body\.replaceChildren/);
  assert.match(source, /character === "\\n"/);
});

test("single-design services support multiple selections and per-item quantities", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /這次需要哪些設計？可複選/);
  assert.match(source, /toggleService/);
  assert.match(source, /aria-pressed/);
  assert.match(source, /single-selection-status/);
  assert.match(source, /single-service-picker-quantity/);
  assert.match(source, /function adjustSingleServiceQuantity/);
  assert.match(source, /`已選 \$\{selectedServices\.length\} 項，下一步只確認會影響價格的內容`/);
  assert.match(source, /請分別填寫每個設計項目的預計數量/);
  assert.match(source, /selectedServices\.forEach/);
  assert.match(source, /跨類型設計組合/);
  assert.match(source, /function getSelectedServiceCategory/);
  assert.match(source, /if \(categories\.size > 1\) return "mixed"/);
  assert.match(source, /電商／社群設計[\s\S]*?平面印刷設計[\s\S]*?其他設計服務/);
  assert.match(source, /hasSelectedPrintService/);
});

test("resize service clearly states that the original design file is required", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /id: "resize",[\s\S]*?note: "需提供原始設計檔"/);
  assert.match(source, /id: "resize",[\s\S]*?name: "Resize"/);
  assert.doesNotMatch(source, /name: "同款設計改尺寸"/);
  assert.match(source, /<small className="choice-requirement"><span>檔案需求<\/span>\{note\}<\/small>/);
  assert.doesNotMatch(source, /className="choice-(?:note|requirement)"備註：/);
  assert.match(source, /detail=\{item\.description\}[\s\S]*?note=\{item\.note\}/);
  assert.match(css, /\.choice \.choice-requirement \{[\s\S]*?border-radius: 999px;/);
});

test("photo retouch quantity accepts a custom number in selection and specifications", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /const PHOTO_QUANTITY_LIMIT = 99/);
  assert.match(source, /case "photo":[\s\S]*?maximum: PHOTO_QUANTITY_LIMIT, customInput: true/);
  assert.match(source, /photo: \{[\s\S]*?quantityCustom: true/);
  assert.match(source, /function setSingleServiceQuantity\(serviceId: string, rawValue: string\)/);
  assert.match(source, /aria-label=\{`\$\{item\.name\}自訂數量`\}[\s\S]*?placeholder="輸入張數"/);
  assert.match(source, /config\.quantityCustom \? <input[\s\S]*?placeholder="輸入數量"/);
  assert.match(source, /activeServiceDetailService\.id === "photo" \? PHOTO_QUANTITY_LIMIT : 999/);
  assert.match(css, /\.single-custom-quantity input \{[\s\S]*?width: 72px;[\s\S]*?min-height: 34px;/);
});

test("design categories reveal only the selected service list", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const categoryStep = renderControls.match(/case "category":([\s\S]*?)case "quantity":/)?.[1] ?? "";
  assert.match(source, /const singleServiceCategoryGroups =/);
  assert.match(source, /id: "resize",[\s\S]*?category: "other"/);
  assert.match(source, /其他設計服務", detail: "Resize、照片後製、模板設計"/);
  assert.match(source, /const ecommerceDetailServiceIds = new Set\(\["banner", "social", "reel", "product-frame", "resize"\]\)/);
  assert.match(categoryStep, /singleServiceCategoryGroups\.map/);
  assert.match(categoryStep, /aria-expanded=\{isExpanded\}/);
  assert.match(categoryStep, /onClick=\{\(\) => setExpandedServiceCategory\(isExpanded \? null : group\.category\)\}/);
  assert.match(categoryStep, /service-category-reveal\$\{isExpanded \? " is-open" : ""\}/);
  assert.match(categoryStep, /aria-hidden=\{!isExpanded\}/);
  assert.match(categoryStep, /inert=\{!isExpanded\}/);
  assert.match(categoryStep, /開始確認需求 →/);
  assert.doesNotMatch(source, /case "service":/);
  assert.match(css, /\.service-category-panel\.is-open/);
  assert.match(css, /\.service-category-trigger:focus-visible/);
  assert.match(css, /\.service-category-reveal \{[\s\S]*?grid-template-rows: 0fr;/);
  assert.match(css, /\.service-category-reveal\.is-open \{[\s\S]*?grid-template-rows: 1fr;/);
});

test("print page counts are collected inside specifications", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function requiresInitialQuantity/);
  assert.match(source, /selectedServices\.filter\(requiresInitialQuantity\)/);
  assert.match(source, /initialQuantityServices\.map/);
  assert.match(source, /function requiresManualPrintPageCount/);
  assert.match(source, /return structure === "multipage"/);
  assert.doesNotMatch(source, /serviceId === "menu" \|\| \(serviceId === "dm" && structure === "multipage"\)/);
  assert.match(source, /const acceptsPageCount = requiresManualPrintPageCount\(detail\.structure\)/);
  assert.match(source, /\{acceptsPageCount && \([\s\S]*?<label className=\{fieldClassName\("pageCount"\)\} data-field="pageCount">[\s\S]*?總設計頁數 <small>（含封面、封底）<\/small>/);
  assert.match(source, /requiredPageCountOptions\.filter\(\(count\) => count >= minimumPageCount\)\.map/);
  assert.match(source, /getMinimumPrintPageCount\(activeDetailedService\.id, detail\.structure\)/);
  assert.match(source, /getMinimumPrintPageCount\(monthlyPrintServiceId, monthlyPrintDetail\.structure\)/);
  assert.match(source, /customPageCount\?: boolean/);
  assert.match(source, /<option value="custom">自訂頁數<\/option>/);
  assert.match(source, /aria-label="自訂總設計頁數"/);
  assert.match(source, /className="custom-page-count-input"/);
  assert.doesNotMatch(source, /不含封面、封底/);
  assert.match(source, /if \(!quantity\) return service\.name/);
  assert.doesNotMatch(source, /serviceId === "flyer"[\s\S]*?value === "single" \|\| value === "double"/);
  assert.match(source, /function getAutomaticPrintPageCount/);
  assert.match(source, /function getMinimumPrintPageCount\(serviceId: string \| undefined, structure\?: PrintStructure\)/);
  assert.match(source, /structure === "multipage"\) return serviceId === "menu" \? 3 : 2/);
  assert.match(source, /if \(requiresManualPrintPageCount\(patch\.structure\)\)[\s\S]*?delete quantities\[serviceId\]/);
  assert.match(source, /getAutomaticPrintPageCount\(patch\.structure\)/);
  assert.match(source, /final: "已定稿"/);
  assert.doesNotMatch(source, /文字與價格已定稿/);
  assert.match(source, /延伸版本 <small>（同版換內容，不含重排或 Resize）<\/small>/);
  assert.doesNotMatch(source, /版本數|延伸版本數/);
});

test("required estimate quantities use dropdowns except specialized ecommerce inputs", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const ecommerceCard = source.match(/case "ecommerceDetails": \{([\s\S]*?)case "printDetails": \{/)?.[1] ?? "";
  const printCard = source.match(/case "printDetails": \{([\s\S]*?)case "serviceDetails": \{/)?.[1] ?? "";
  const serviceCard = source.match(/case "serviceDetails": \{([\s\S]*?)case "printPurpose": \{/)?.[1] ?? "";

  assert.match(source, /const requiredQuantityOptions = Array\.from\(\{ length: 10 \}/);
  assert.match(source, /const requiredPageCountOptions = Array\.from\(\{ length: 9 \}, \(_, index\) => index \+ 2\)/);
  assert.match(ecommerceCard, /activeEcommerceService\.id === "reel" \? <input[\s\S]*?: <select/);
  assert.match(ecommerceCard, /aria-label="貼文篇數"[\s\S]*?type="number"/);
  assert.match(ecommerceCard, /aria-label="圖框版型數"[\s\S]*?type="number"/);
  assert.match(printCard, /data-field="pageCount"[\s\S]*?<select/);
  assert.match(serviceCard, /config\.quantityOptional \? <input[\s\S]*?: <select/);
  assert.match(css, /\.quantity-input-wrap input,\s*\.quantity-input-wrap select/);
});

test("print specifications identify and focus missing required fields", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /type PrintDetailField/);
  assert.match(source, /getMissingPrintDetailFields/);
  assert.match(source, /const \[printDetailErrors, setPrintDetailErrors\]/);
  assert.match(source, /data-field="purposes"/);
  assert.match(source, /data-field="format"/);
  assert.match(source, /data-field="structure"/);
  assert.match(source, /data-field="contentStatus"/);
  assert.match(source, /aria-invalid=\{hasError/);
  assert.match(source, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
  assert.match(source, /focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /請填寫此欄位/);
  assert.match(source, /請補填：/);
  assert.doesNotMatch(source, /disabled=\{!isComplete\} onClick=\{confirmPrintDetails\}/);
  assert.match(css, /\.compact-section\.has-error/);
  assert.match(css, /\.compact-field\.has-error input/);
  assert.match(css, /\.field-error/);
});

test("page and version counts stay blank while poster starts from one base design", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /else if \(toggledService && \(requiresInitialQuantity\(toggledService\) \|\| toggledService\.id === "poster"\)\) \{\s*quantities\[serviceId\] = 1;/);
  assert.match(source, /return !ecommerceDetailServiceIds\.has\(service\.id\) && !detailedPrintServiceIds\.has\(service\.id\)/);
  assert.match(source, /function updateActivePrintPageCount\(rawValue: string\)/);
  assert.match(source, /delete quantities\[activeDetailedService\.id\]/);
  assert.match(source, /answers\.quantities\[activeDetailedService\.id\] \?\? ""/);
  assert.match(source, /answers\.quantities\[activeDetailedService\.id\] \?\? 0/);
  assert.match(source, /versionCount: parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.doesNotMatch(source, /if \(!detail\.versionCount\) missing\.push\("versionCount"\)/);
  assert.match(source, /versionCount: undefined/);
  assert.doesNotMatch(source, /value=\{detail\.versionCount \?\? ""\} placeholder="1"/);
  assert.match(source, /if \(!quantity\) return service\.name/);
});

test("summary and PDF use compact quantity wording", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /function formatServiceQuantity/);
  assert.match(source, /`\$\{service\.name\} ×\$\{quantity\} \$\{getServiceUnit\(service, answers\)\}`/);
  assert.match(source, /IG／FB 社群圖文：\$\{postBreakdown\}／共 \$\{socialPricing\.totalImages\} 張（延伸 \$\{socialPricing\.extensionCount\} 張）/);
  assert.match(source, /商品主圖套版：\$\{frameBreakdown\}／共 \$\{framePricing\.totalProducts\} 項產品/);
  assert.match(source, /月量：\$\{answers\.monthlyGroupCount\} 組/);
  assert.doesNotMatch(source, /lines\.push\(`數量：\$\{selectedServices/);
  assert.doesNotMatch(source, /\{quote\.baseNote && <p>/);
});

test("the combined flyer and DM service uses the same finished-product structures as menu", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /id: "flyer"[\s\S]*?name: "傳單"/);
  assert.match(source, /id: "dm"[\s\S]*?name: "傳單／DM"/);
  assert.match(source, /id: "menu"[\s\S]*?name: "菜單"/);
  assert.doesNotMatch(source, /id: "catalog"/);
  assert.doesNotMatch(source, /name: "傳單／DM／菜單"/);
  assert.match(source, /multipage: "多頁"/);
  assert.doesNotMatch(source, /if \(serviceId === "flyer"\) return options\.filter/);
  assert.doesNotMatch(source, /if \(serviceId === "dm"\)/);
  assert.doesNotMatch(source, /型錄/);
  assert.match(source, /`\$\{detailedName\}要做成單面、雙面、折頁，還是多頁？`/);
  assert.match(source, /: "多頁編排"/);
});

test("service choices show the website prices before selection", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /function getServiceDisplayPrice/);
  assert.match(source, /service\.id === "banner"/);
  assert.match(source, /主視覺延伸加購 \+\$\{formatPriceRange\(bannerExtensionPrice\.low, bannerExtensionPrice\.high\)\}／張/);
  assert.match(source, /service\.id === "social"/);
  assert.match(source, /const socialExtensionPrice = \{ low: 250, high: 500 \}/);
  assert.match(source, /同篇貼文，第 2 張起 \+\$\{formatPriceRange\(socialExtensionPrice\.low, socialExtensionPrice\.high\)\}／張/);
  assert.match(source, /service\.id === "product-frame"/);
  assert.match(source, /圖框含 1 項產品，每追加 1 項產品／\+\$70/);
  assert.match(source, /service\.id === "dm" \|\| service\.id === "menu"/);
  assert.match(source, /第 2 頁起 \$\{formatPriceRange\(600, 800\)\}／頁/);
  assert.match(source, /detail=\{item\.description\}/);
  assert.match(source, /price=\{getServiceDisplayPrice\(item\)\}/);
  assert.match(source, /<em className="choice-price">\{price\}<\/em>/);
  assert.doesNotMatch(source, /網站價格｜\{price\}|同系列第 2 頁起/);
  assert.match(css, /\.choice \.choice-price/);
});

test("the combined flyer and DM service supports single, double, folded, and multipage pricing", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const combinedService = source.match(/\{\s*id: "dm",([\s\S]*?)\n\s*\},/)?.[1] ?? "";
  assert.match(combinedService, /name: "傳單／DM"/);
  assert.match(combinedService, /unit: "頁"/);
  assert.match(combinedService, /pricing: "dm"/);
  assert.match(source, /baseLow = service\.low \+ Math\.max\(0, quantity - 1\) \* 600/);
  assert.doesNotMatch(source, /if \(serviceId === "flyer"\) return options\.filter/);
  assert.match(source, /normalizedServiceId = serviceId === "flyer" \? "dm" : serviceId/);
});

test("card single- and double-sided pricing is one service selected in specifications", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /id: "card"[\s\S]*?name: "名片／會員卡"[\s\S]*?pricing: "card"/);
  assert.match(source, /service\.id === "card"[\s\S]*?單面 \$\{formatPriceRange\(1000, 1500\)\}[\s\S]*?雙面 \$\{formatPriceRange\(1200, 2200\)\}/);
  assert.match(source, /specificationLabel: "單面／雙面"/);
  assert.match(source, /value: "single"[\s\S]*?value: "double"/);
  assert.match(source, /answers\.serviceDesignDetails\.card\?\.specification === "double"/);
  assert.match(source, /activeServiceDetailService\.id === "card" \? " card-required-grid" : ""/);
  assert.match(css, /\.card-required-grid > \.compact-field \{\s*align-content: end;\s*\}/);
  assert.doesNotMatch(source, /card-single|card-double/);
});

test("the combined flyer and DM service and menu collect production details without asking for a delivery location", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const answersType = source.match(/type Answers = \{([\s\S]*?)\n\};/)?.[1] ?? "";
  assert.match(source, /主要會用在哪裡/);
  assert.match(source, /請選擇一個最主要的用途/);
  assert.match(source, /purposes: \[value\]/);
  assert.match(source, /type="radio" name=\{`purpose-/);
  assert.doesNotMatch(source, /togglePrintPurpose|type="checkbox" checked=\{selectedPurposes/);
  assert.match(source, /printPurposeOptionsByService/);
  assert.match(source, /dm:[\s\S]*?printPurposeLabels\.distribution[\s\S]*?printPurposeLabels\["direct-mail"\]/);
  assert.match(source, /menu:[\s\S]*?printPurposeLabels\["dine-in"\]/);
  assert.match(source, /介紹產品、品牌或服務內容/);
  assert.match(source, /街頭／商圈派發|郵寄／名單投遞|店內用餐/);
  assert.doesNotMatch(source, /"delivery"|外送／線上菜單|外送平台、QR Code 或線上瀏覽/);
  assert.match(source, /getPrintPurposeOptions\(activeDetailedService\?\.id\)/);
  assert.match(source, /成品尺寸與方向/);
  assert.match(source, /單面、雙面、折頁，還是多頁/);
  assert.doesNotMatch(source, /serviceId === "catalog"|型錄會採多頁編排|較完整地介紹品牌/);
  assert.match(source, /預計使用哪一種折頁方式/);
  assert.match(source, /文字、品項與價格是否已經定稿/);
  assert.match(source, /照片或圖片準備得如何/);
  assert.match(source, /不同語言、分店、價格或活動內容/);
  assert.match(source, /最晚希望何時收到可送印的完稿檔/);
  assert.match(source, /成品到貨日會另行確認/);
  assert.match(source, /預計印量/);
  assert.match(source, /紙張/);
  assert.match(source, /加工/);
  assert.match(source, /printSpecifications/);
  assert.doesNotMatch(source, /printSpecificationIndex|activePrintService/);
  assert.match(source, /哪些平面印刷項目需要協助確認規格與代辦送印？可一次複選/);
  assert.match(source, /function togglePrintProduction\(serviceId: string\)/);
  assert.match(source, /selectedPrintServices\.map\(\(service\) =>/);
  assert.match(source, /onClick=\{\(\) => togglePrintProduction\(service\.id\)\}/);
  assert.match(source, /supportedPrintServices\.map\(\(service\) =>/);
  assert.match(source, /function updatePrintProduction\(serviceId: string, patch: Partial<PrintSpecification>\)/);
  assert.match(source, /function confirmPrintProduction\(\)[\s\S]*?move\("result"/);
  assert.match(source, /\$\{service\.name\}印刷/);
  assert.doesNotMatch(source, /hasNextPrintService \? "printSupport"|case "printSupport"|case "printQuantity"/);
  assert.doesNotMatch(source, /printQuantity\?: number|printPaper\?: PrintPaper|printFinish\?: PrintFinish/);
  assert.match(source, /printDesignDetails/);
  assert.match(source, /printDetailIndex/);
  assert.match(source, /activeDetailedService/);
  assert.match(source, /purposes\?: PrintPurpose\[\]/);
  assert.match(source, /selectPrintPurpose/);
  assert.match(source, /confirmPrintPurposes/);
  assert.match(source, /已選擇主要用途/);
  assert.match(source, /確認用途/);
  assert.match(source, /detail\.purposes\.map/);
  assert.doesNotMatch(source, /purpose\?: PrintPurpose/);
  assert.match(source, /format\?: PrintFormat/);
  assert.match(source, /structure\?: PrintStructure/);
  assert.match(source, /contentStatus\?: ContentStatus/);
  assert.match(source, /imageStatus\?: ImageStatus/);
  assert.match(source, /versionCount\?: number/);
  assert.match(source, /complexity\?: Complexity/);
  assert.match(source, /timeline\?: Timeline/);
  assert.match(source, /deadline\?: string/);
  assert.match(source, /hasNextService \? "printPurpose" : "sourceFile"/);
  assert.match(source, /const destination = getNextIncompleteSpecificationDestination\(nextAnswers, activeDetailedService\.id\)/);
  assert.match(source, /\$\{service\.name\}用途：/);
  assert.match(source, /\$\{service\.name\}規格：/);
  assert.doesNotMatch(source, /\$\{service\.name\}用途／規格/);
  assert.match(source, /\$\{service\.name\}內容/);
  assert.match(source, /detail\.imageStatus \? `素材狀況 \$\{imageStatusLabels\[detail\.imageStatus\]\}`/);
  assert.doesNotMatch(source, /／用圖 \$\{detail\.imageStatus/);
  assert.match(source, /\$\{service\.name\}視覺／排程/);
  assert.match(source, /\$\{service\.name\}原始檔/);
  assert.doesNotMatch(answersType, /printFormat\?: PrintFormat|imageStatus\?: ImageStatus/);
  assert.doesNotMatch(source, /交貨地點|送貨地點|配送地址/);
});

test("folded print specifications show clear visual fold choices", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const printFoldDescriptions: Record<PrintFold, string>/);
  assert.match(source, /紙張左右對折，形成 4 個版面/);
  assert.match(source, /兩側依序向內收折，形成 6 個版面/);
  assert.match(source, /沿折線前後交錯，像風琴般展開/);
  assert.match(source, /function FoldDiagram\(\{ fold \}: \{ fold: PrintFold \}\)/);
  assert.match(source, /function FoldChoice\(/);
  assert.match(source, /return <span className="fold-diagram fold-diagram-custom" aria-hidden="true"><b>\?<\/b><\/span>/);
  assert.match(source, /<button className=\{`fold-choice\$\{selected \? " selected" : ""\}`\} type="button"/);
  assert.match(source, /className="fold-option-grid" aria-label="折頁方式示意圖"/);
  assert.match(source, /selected=\{detail\.fold === value\}/);
  assert.match(source, /fold-option-grid fold-option-grid-conversation/);
  assert.doesNotMatch(source, /detail\.structure === "folded" && <label[\s\S]*?<select aria-invalid=\{hasError\("fold"\)\}/);
  assert.match(css, /\.fold-option-grid \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.fold-choice\.selected/);
  assert.match(css, /\.fold-diagram-accordion \.fold-paper i:nth-child\(odd\)/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.fold-option-grid \{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
  assert.doesNotMatch(source, /printFoldReferences|fold-reference-photo|fold-choice-source/);
  assert.doesNotMatch(css, /perspective: 260px|rotateX\(-12deg\)|fold-reference-photo|fold-choice-source/);
});

test("pricing additions are itemized, non-compounding, and source files are selectable per service", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /sourceFileServiceIds/);
  assert.match(source, /toggleSourceFile/);
  assert.match(source, /className="multi-select-wrap add-on-selector"/);
  assert.match(source, /<strong>需要可編輯的原始檔嗎？<\/strong>/);
  assert.match(source, /<strong>需要協助印刷嗎？<\/strong>/);
  assert.match(source, /function confirmSingleAddOns\(\)[\s\S]*?move\("result"/);
  assert.doesNotMatch(source, /move\(hasSelectedPrintService\(answers\) \? "printProduction"/);
  assert.doesNotMatch(source, /rushLow|rushHigh|急件加價/);
  assert.match(source, /printSpecifications\[service\.id\]\?\.support/);
  assert.match(source, /const printLow = answers\.projectType === "single" && answers\.printSpecifications\[service\.id\]\?\.support \? baseLow \* 0\.15 : 0/);
  assert.match(source, /const sourceFileBaseLow = service\.id === "product-frame" \? service\.low \* quantity : baseLow/);
  assert.match(source, /const sourceFileBaseHigh = service\.id === "product-frame" \? service\.high \* quantity : baseHigh/);
  assert.match(source, /商品主圖版型 \$\{Math\.max\(1, quantity\)\} 版 × 每版設計費 × 50%（不含追加產品）/);
  assert.match(source, /依商品主圖版型數計算，每版設計費 \+50%（不含追加產品）/);
  assert.doesNotMatch(source, /priorityScheduleRate|priorityLow|priorityHigh|hasPrioritySchedule|優先排程/);
  assert.match(source, /totalLow: baseLow \+ addonLow \+ sourceLow \+ printLow/);
  assert.doesNotMatch(source, /不互相疊乘|加價計算：/);
  assert.match(source, /<strong>費用明細<\/strong>/);
  assert.doesNotMatch(source, /網站初步估價明細/);
  assert.match(source, /const serviceBreakdown: PriceBreakdownItem\[\]/);
  assert.match(source, /label: `\$\{service\.name\}｜設計費`/);
  assert.match(source, /detail: getServicePriceBasis\(answers, service\)/);
  assert.match(source, /serviceBreakdown\.push\(\{[\s\S]*?label: `\$\{service\.name\}｜原始檔加購`/);
  assert.match(source, /serviceBreakdown\.push\(\{[\s\S]*?label: `\$\{service\.name\}｜印刷代辦服務費`/);
  assert.match(source, /計算依據／小計/);
  assert.match(source, /不會直接追加/);
  assert.doesNotMatch(source, /low \*= 1\.5|high \*= 1\.5|low \*= 1\.15|high \*= 1\.15/);
});

test("same-series social images and product-frame applications use extension pricing", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /socialPostCount/);
  assert.match(source, /socialPostImageCounts/);
  assert.match(source, /貼文篇數/);
  assert.match(source, /aria-label="貼文篇數"/);
  assert.match(source, /第 \$\{index \+ 1\} 篇貼文圖片張數/);
  assert.match(source, /先填篇數，再填每篇圖數；每篇最多 10 張圖，第 2 張起採延伸價/);
  assert.match(source, /const SOCIAL_IMAGES_PER_POST_LIMIT = 10/);
  assert.match(source, /max=\{SOCIAL_IMAGES_PER_POST_LIMIT\}/);
  assert.match(source, /function getSocialPricingCounts/);
  assert.match(source, /current\.socialPostImageCounts\?\.\[index\] \?\? 1/);
  assert.match(source, /const extensionCount = imageCounts\.reduce\(\(sum, count\) => sum \+ Math\.max\(0, count - 1\), 0\)/);
  assert.match(source, /const primaryCount = socialPricing\?\.postCount \?\? 1/);
  assert.match(source, /baseLow = service\.low \* primaryCount \+ extensionCount \* socialExtensionPrice\.low/);
  assert.match(source, /baseHigh = service\.high \* primaryCount \+ extensionCount \* socialExtensionPrice\.high/);
  assert.match(source, /formatPriceRange\(extensionCount \* socialExtensionPrice\.low, extensionCount \* socialExtensionPrice\.high\)/);
  assert.match(source, /每篇最多 10 張圖，第 2 張起採延伸價/);
  assert.match(source, /每篇首張 ×\$\{postCount\}/);
  assert.match(source, /同篇延伸 ×\$\{extensionCount\}/);
  assert.match(source, /總圖 10 張以上 9\.5 折/);
  assert.match(source, /baseLow \*= 0\.95/);
  assert.match(source, /baseHigh \*= 0\.95/);
  assert.match(source, /productFrameProductCounts/);
  assert.match(source, /function getProductFramePricingCounts/);
  assert.match(source, /第 \$\{index \+ 1\} 版圖框產品數量/);
  assert.match(source, /先填版型數，再填每版套用的產品數；每版含 1 項產品，每追加 1 項／\+\$70/);
  assert.match(source, /const extraProductCount = productCounts\.reduce\(\(sum, count\) => sum \+ Math\.max\(0, count - 1\), 0\)/);
  assert.match(source, /extraProductCount \* 70/);
  assert.doesNotMatch(source, /圖框[^\n]*(貼文|同篇|10 張以上)/);
});

test("ecommerce services use their own per-item specification cards", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const ecommerceCard = source.match(/case "ecommerceDetails": \{([\s\S]*?)case "printDetails": \{/)?.[1] ?? "";
  const ecommerceValidation = source.match(/function getMissingEcommerceDetailFields[\s\S]*?\{([\s\S]*?)const printPurposeLabels/)?.[1] ?? "";
  assert.match(source, /\| "ecommerceDetails"/);
  assert.match(source, /type EcommerceDesignDetail/);
  assert.match(source, /ecommerceDesignDetails: Record<string, EcommerceDesignDetail>/);
  assert.match(source, /ecommercePlacementOptionsByService/);
  assert.match(source, /ecommerceSizeOptionsByService/);
  assert.match(source, /banner:[\s\S]*?官網首頁／輪播/);
  assert.match(source, /bannerExtensionCount\?: number/);
  assert.match(source, /function getBannerExtensionCount/);
  assert.doesNotMatch(source, /const bannerDesignTypeOptions|function getBannerDesignRange|function isBannerExtension/);
  assert.doesNotMatch(source, /id: "key-visual-extension"/);
  assert.match(source, /social:[\s\S]*?FB／IG 動態貼文/);
  assert.match(source, /reel:[\s\S]*?YouTube 縮圖/);
  assert.match(source, /"product-frame":[\s\S]*?蝦皮商品頁/);
  assert.match(source, /resize:[\s\S]*?跨平台延伸/);
  assert.match(ecommerceCard, /<summary>其他需求（選填）<\/summary>/);
  assert.doesNotMatch(ecommerceCard, /compact-optional-note|補充需求（選填，可稍後補）/);
  assert.match(ecommerceCard, /使用平台／刊登位置（單選）/);
  assert.match(ecommerceCard, /getEcommerceDetailFieldLabel\(activeEcommerceService, "quantity"\)/);
  assert.match(ecommerceCard, /answers\.quantities\[activeEcommerceService\.id\]/);
  assert.match(ecommerceCard, /answers\.socialPostCount/);
  assert.match(ecommerceCard, /answers\.socialPostImageCounts/);
  assert.match(ecommerceCard, /版位尺寸／比例/);
  assert.match(ecommerceCard, /文案與 CTA/);
  assert.match(ecommerceCard, /品牌與商品素材/);
  assert.match(ecommerceCard, /延伸版本 <small>（同版換內容，不含重排或 Resize）/);
  assert.match(ecommerceCard, /placeholder="無則留空"/);
  assert.doesNotMatch(ecommerceValidation, /missing\.push\("versionCount"\)/);
  assert.doesNotMatch(ecommerceValidation, /missing\.push\("productCount"\)/);
  assert.match(ecommerceCard, /主視覺延伸加購/);
  assert.match(ecommerceCard, /是否需要主視覺延伸加購/);
  assert.match(ecommerceCard, /aria-label="是否需要主視覺延伸加購"/);
  assert.doesNotMatch(ecommerceCard, /Banner 設計類型/);
  assert.match(ecommerceCard, /視覺製作程度/);
  assert.match(ecommerceCard, /確認規格/);
  assert.doesNotMatch(ecommerceCard, /A4|成品結構|折頁|紙張|代辦印刷|printFormatLabels|printStructureLabels/);
  assert.match(ecommerceCard, /renderSharedScheduleNote\(activeEcommerceService\.id\)[\s\S]*?估價必填/);
  assert.doesNotMatch(ecommerceCard, /updateActiveEcommerceDetail\(\{ timeline:/);
  assert.doesNotMatch(ecommerceValidation, /missing\.push\("timeline"\)/);
  assert.match(source, /\$\{service\.name\}規格：版位 \$\{size\}/);
  assert.doesNotMatch(source, /\| "socialPrimaryCount"|\| "productFrameProductCount"/);
});

test("banner extension stays required and receives the monthly-plan discount", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const ecommerceCard = source.match(/case "ecommerceDetails": \{([\s\S]*?)case "printDetails": \{/)?.[1] ?? "";
  const monthlyServicesStep = source.slice(source.indexOf("function renderControls()")).match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";

  assert.match(ecommerceCard, /data-field="bannerExtensionCount"[\s\S]*?className="inline-choice-buttons"[\s\S]*?aria-label="是否需要主視覺延伸加購"/);
  assert.match(ecommerceCard, />否，不需要<\/button>[\s\S]*?>是，需要<\/button>/);
  assert.match(ecommerceCard, /主視覺延伸張數[\s\S]*?>\{count\} 張<\/option>/);
  assert.doesNotMatch(ecommerceCard, /\{count\} 張｜每張 \$800～1,200/);
  assert.match(source, /service\.id === "banner"\) return "主視覺風格"/);
  assert.match(ecommerceCard, /沿用本次主視覺，延伸不同尺寸之系列稿（非重新設計）；不同於僅調整尺寸的 Resize/);
  assert.match(monthlyServicesStep, /沿用本次主視覺，延伸不同尺寸之系列稿（非重新設計）；不同於僅調整尺寸的 Resize。依延伸張數計價並套用月方案優惠/);
  assert.match(ecommerceCard, /activeEcommerceService\.id !== "banner"[\s\S]*?延伸版本/);
  assert.match(monthlyServicesStep, /月方案是否需要 Banner 主視覺延伸加購/);
  assert.match(monthlyServicesStep, /月方案 Banner 主視覺延伸張數/);
  assert.match(monthlyServicesStep, /className="inline-choice-buttons"[\s\S]*?aria-label="月方案是否需要 Banner 主視覺延伸加購"/);
  assert.match(monthlyServicesStep, />否，不需要<\/button>[\s\S]*?>是，需要<\/button>/);
  assert.doesNotMatch(monthlyServicesStep, /\{count\} 張｜每張 \$800～1,200/);
  assert.doesNotMatch(ecommerceCard, /activeEcommerceService\.id === "banner" && value === "priority"/);
  assert.match(source, /reference\.designLow = service\.low \* quantity \+ extensionCount \* bannerExtensionPrice\.low/);
  assert.match(source, /reference\.designHigh = service\.high \* quantity \+ extensionCount \* bannerExtensionPrice\.high/);
  assert.doesNotMatch(source, /reference\.addonLow = extensionCount \* bannerExtensionPrice\.low/);
  assert.match(source, /const addonLow = bannerExtensionCount \* bannerExtensionPrice\.low/);
  assert.match(source, /totalLow: baseLow \+ addonLow \+ sourceLow \+ printLow/);
  assert.match(source, /service\.id === "banner"[\s\S]*?主視覺延伸 \$\{extensionCount\} 張/);
  assert.match(source, /Banner 基本設計費 × 50%（不含主視覺延伸加購）/);
});

test("remaining services use dedicated specification cards without copying print-design options", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const serviceCard = renderControls.match(/case "serviceDetails": \{([\s\S]*?)case "printPurpose": \{/)?.[1] ?? "";
  assert.match(source, /\| "serviceDetails"/);
  assert.match(source, /type ServiceDesignDetail/);
  assert.match(source, /serviceDesignDetails: Record<string, ServiceDesignDetail>/);
  assert.match(source, /const serviceDetailConfigs: Record<string, ServiceDetailConfig>/);
  assert.match(source, /poster:[\s\S]*?海報尺寸與方向/);
  assert.match(source, /poster: \{[\s\S]*?quantityLabel: "海報設計款數"/);
  assert.match(source, /id: "poster",[\s\S]*?unit: "款"/);
  assert.match(source, /quantities: service\.id === "poster" \? \{ poster: 1 \} : \{\}/);
  assert.match(source, /toggledService\.id === "poster"/);
  assert.match(serviceCard, /是否有系列稿[\s\S]*?沒有，僅 1 款[\s\S]*?有，需要延伸系列稿[\s\S]*?系列稿款數/);
  assert.match(source, /detail\.seriesArtwork === "yes"[\s\S]*?系列稿 \$\{extensionCount\} 款（共 \$\{answers\.quantities\.poster \?\? 1\} 款）/);
  assert.match(source, /card: \{[\s\S]*?quantityLabel: "版型套用"[\s\S]*?quantityOptional: true[\s\S]*?specificationLabel: "單面／雙面"/);
  assert.match(source, /photo: \{[\s\S]*?quantityLabel: "後製照片張數"/);
  assert.match(source, /slides: \{[\s\S]*?quantityLabel: "模板設計數"/);
  assert.match(source, /service\.id === "reel"\) return "封面設計張數"/);
  assert.match(source, /service\.id === "resize"\) return "尺寸延伸數"/);
  assert.match(source, /getEcommerceDetailFieldLabel\(activeEcommerceService, "quantity"\)/);
  assert.match(source, /單面｜\$1,000～1,500／款[\s\S]*?雙面｜\$1,200～2,200／款/);
  assert.doesNotMatch(source, /card-single|card-double/);
  assert.match(source, /photo:[\s\S]*?主要後製項目/);
  assert.match(source, /slides:[\s\S]*?需要的設計範圍/);
  assert.match(source, /slides:[\s\S]*?hideQuantity: true/);
  assert.match(source, /return `\$\{activeService\?\.name \?\? "這項服務"\}規格`/);
  assert.doesNotMatch(serviceCard, /hasRequiredServiceFields/);
  assert.match(serviceCard, /<fieldset className="compact-section">[\s\S]*?<legend>估價必填<\/legend>/);
  assert.match(serviceCard, /!config\.hideQuantity && activeServiceDetailService\.id !== "card" && activeServiceDetailService\.id !== "poster" && <label/);
  assert.match(serviceCard, /<summary>其他需求（選填）<\/summary>[\s\S]*?activeServiceDetailService\.id === "card" && <label className="compact-field"><span>\{config\.quantityLabel\}/);
  assert.match(source, /!config\?\.hideQuantity && service\.pricing !== "card"/);
  assert.match(source, /config\.hideQuantity[\s\S]*?\? undefined/);
  assert.doesNotMatch(source, /投影片頁數/);
  assert.match(serviceCard, /估價必填/);
  assert.match(serviceCard, /<summary>其他需求（選填）<\/summary>/);
  assert.doesNotMatch(serviceCard, /compact-optional-note|補充需求（選填，可稍後補）/);
  assert.match(serviceCard, /activeServiceDetailService\.id === "photo" \? "套用常見設定" : "套用常見尺寸"/);
  assert.match(serviceCard, /answers\.quantities\[activeServiceDetailService\.id\]/);
  assert.match(serviceCard, /config\.quantityOptional \? <input[\s\S]*?min="0"[\s\S]*?placeholder="無則留空"[\s\S]*?: <select/);
  assert.match(serviceCard, /requiredQuantityOptions\.map/);
  assert.match(source, /service\.pricing !== "card" && \(answers\.quantities\[service\.id\] \?\? 0\) < 1/);
  assert.match(source, /\(parseOptionalPositiveInteger\(rawValue\) \?\? 0\) \+ 1/);
  assert.match(serviceCard, /config\.purposeOptions/);
  assert.match(serviceCard, /config\.specificationOptions/);
  assert.match(serviceCard, /config\.contentOptions/);
  assert.match(serviceCard, /config\.assetOptions/);
  assert.match(serviceCard, /config\.complexityOptions/);
  assert.doesNotMatch(serviceCard, /printFormatLabels|printStructureLabels|printFoldLabels|printPaperLabels|成品結構|折頁方式|代辦送印/);
  assert.match(source, /serviceDetailsRef\.current\?\.querySelector/);
  assert.match(serviceCard, /renderSharedScheduleNote\(activeServiceDetailService\.id\)[\s\S]*?估價必填/);
  assert.doesNotMatch(serviceCard, /updateActiveServiceDetail\(\{ timeline:/);
  assert.match(source, /selectedServiceDetailServices\.forEach/);
  assert.match(source, /const detailedPrintServiceIds = new Set\(\["dm", "menu"\]\)/);
});

test("all optional numeric service fields can return to zero and clear", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const ecommerceCard = renderControls.match(/case "ecommerceDetails": \{([\s\S]*?)case "printDetails": \{/)?.[1] ?? "";
  const printCard = renderControls.match(/case "printDetails": \{([\s\S]*?)case "serviceDetails": \{/)?.[1] ?? "";

  assert.match(source, /function parseOptionalPositiveInteger\(rawValue: string\)/);
  assert.match(ecommerceCard, /延伸版本[\s\S]*?min="0"[\s\S]*?parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.match(ecommerceCard, /圖框版型數[\s\S]*?第 \$\{index \+ 1\} 版圖框產品數量[\s\S]*?min="1"/);
  assert.match(source, /function updateProductFrameProductCount\(index: number, rawValue: string\)/);
  assert.doesNotMatch(ecommerceCard, /套用產品總數|若無追加可留空/);
  assert.match(printCard, /延伸版本[\s\S]*?min="0"[\s\S]*?parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.match(renderControls, /case "versionCount":[\s\S]*?min="0"[\s\S]*?parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.match(renderControls, /預計印量（選填）[\s\S]*?min="0"[\s\S]*?parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.match(source, /\(parseOptionalPositiveInteger\(rawValue\) \?\? 0\) \+ 1/);
});

test("estimate separates excluded print costs and pending fees", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /本估價不包含印刷品製作費與運送費/);
  assert.match(source, /未含費用：印刷品製作費、運送費/);
  assert.match(source, /getPendingEstimateItems/);
  assert.match(source, /尚有需求待確認費用/);
  assert.doesNotMatch(source, /預算略低於目前推估約|預算仍在初估區間內|不建議先判定預算充足/);
  assert.match(source, /formatPriceRange/);
  assert.doesNotMatch(source, /依目前選擇，較可能落在約|className="result-target"/);
  assert.doesNotMatch(css, /\.result-target/);
});

test("questionnaire groups long print and monthly flows into compact cards", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /\| "printDetails"/);
  assert.match(source, /\| "printProduction"/);
  assert.match(source, /\| "monthlyProfile"/);
  assert.doesNotMatch(source, /完成估價必填，其他需求（選填）/);
  assert.match(source, /沿用上一項規格/);
  assert.match(source, /const previousPageCount = Math\.max\(0, answers\.quantities\[previousService\.id\]/);
  assert.match(source, /updateActivePrintPageCount\(previousPageCount > 0 \? String\(previousPageCount\) : ""\)/);
  assert.match(source, /套用常見尺寸/);
  assert.doesNotMatch(source, /套用 A4 單面常用值|套用 A4 多頁常用值|套用常用規格/);
  assert.match(source, /<summary>其他需求（選填）<\/summary>/);
  assert.doesNotMatch(source, /其餘可留空/);
  assert.doesNotMatch(source, /補充需求（選填，可稍後補）|其餘需求可選填/);
  assert.match(source, /估價必填/);
  assert.match(source, /function confirmSingleAddOns\(\)[\s\S]*?move\("result"/);
  assert.match(source, /印量、紙張與加工皆可留空，正式合作時再確認/);
  assert.match(source, /move\("monthlyServices", \{ projectType: "monthly",[\s\S]*?serviceIds: \[\],[\s\S]*?quantities: \{\}/);
  assert.match(source, /確認合作紀錄後，選擇服務與數量，系統會自動配對方案/);
  assert.doesNotMatch(source, /接著依服務數量自動帶入方案/);
  assert.match(css, /\.compact-card/);
  assert.match(css, /\.compact-grid/);
  assert.match(css, /\.compact-purpose-grid/);
});

test("questionnaire keeps core fields required and shortens repeated work", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const ecommerceValidation = source.match(/function getMissingEcommerceDetailFields[\s\S]*?\{([\s\S]*?)return missing;/)?.[1] ?? "";
  const printValidation = source.match(/function getMissingPrintDetailFields[\s\S]*?\{([\s\S]*?)return missing;/)?.[1] ?? "";
  const serviceValidation = source.match(/function getMissingServiceDetailFields[\s\S]*?\{([\s\S]*?)return missing;/)?.[1] ?? "";
  const monthlyConfirm = source.match(/function confirmMonthlyProfile\(\) \{([\s\S]*?)function selectPrintPurpose/)?.[1] ?? "";
  assert.equal(source.match(/\{renderSharedScheduleNote\(active(?:EcommerceService|DetailedService|ServiceDetailService)\.id\)\}/g)?.length, 3);
  assert.match(ecommerceValidation, /missing\.push\("quantity"\)/);
  assert.doesNotMatch(ecommerceValidation, /missing\.push\("timeline"\)/);
  assert.doesNotMatch(ecommerceValidation, /missing\.push\("placement"\)|missing\.push\("size"\)|missing\.push\("copyStatus"\)|missing\.push\("assetStatus"\)/);
  assert.match(ecommerceValidation, /service\.id === "banner" && detail\.bannerExtensionCount === undefined\) missing\.push\("bannerExtensionCount"\)/);
  assert.doesNotMatch(ecommerceValidation, /service\.id === "banner" && !detail\.visualLevel/);
  assert.match(printValidation, /missing\.push\("structure"\)/);
  assert.doesNotMatch(printValidation, /missing\.push\("timeline"\)/);
  assert.doesNotMatch(printValidation, /missing\.push\("purposes"\)|missing\.push\("format"\)|missing\.push\("contentStatus"\)|missing\.push\("imageStatus"\)|missing\.push\("complexity"\)/);
  assert.match(serviceValidation, /missing\.push\("quantity"\)/);
  assert.doesNotMatch(serviceValidation, /missing\.push\("timeline"\)/);
  assert.match(serviceValidation, /service\.id === "card" && !detail\.specification/);
  assert.doesNotMatch(serviceValidation, /missing\.push\("purpose"\)|missing\.push\("contentStatus"\)|missing\.push\("assetStatus"\)|missing\.push\("complexity"\)/);
  assert.doesNotMatch(source, /主要設計類型/);
  assert.match(source, /<summary>其他需求（選填）<\/summary>/);
  assert.match(source, /<span>交付節奏<\/span>/);
  assert.doesNotMatch(source, /平均視覺複雜度|平均素材狀況/);
  assert.match(source, /<span>素材狀況<\/span><select value=\{answers\.materials/);
  assert.doesNotMatch(monthlyConfirm, /!answers\.monthlyContent|!answers\.monthlyCadence/);
  assert.doesNotMatch(monthlyConfirm, /!answers\.complexity|!answers\.materials/);
  assert.doesNotMatch(source, /未選＝全部不需要代辦/);
  assert.match(source, /沒有加購可直接完成試算/);
  assert.doesNotMatch(source, /沿用上一項印刷需求|下一項 →.*確認印刷需求/);
  assert.match(css, /\.add-on-selector/);
  assert.match(css, /\.print-production-details/);
  assert.match(source, /const singleProgress/);
  assert.match(source, /chatBody\.scrollTo\(/);
  assert.match(css, /\.compact-optional-note/);
  assert.match(css, /\.optional-details/);
  assert.match(css, /\.service-choice-group h3/);
});

test("mobile quote summary stays visible while the customer fills the form", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /site-shell\$\{step === "result" \? " estimate-complete" : ""\}/);
  assert.match(source, /className="summary-context"/);
  assert.match(source, /className="summary-mobile-toggle"/);
  assert.match(source, /aria-expanded=\{isMobileSummaryExpanded\}/);
  assert.match(source, /已選 \$\{selectedServices\.length\} 項服務/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.summary-panel \{[\s\S]*?position: fixed;/);
  assert.match(css, /bottom: calc\(8px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /\.chat-body \{\s*padding-bottom: 104px;/);
  assert.match(css, /\.summary-panel\.is-expanded \{[\s\S]*?max-height: min\(70vh, 570px\);/);
  assert.match(css, /\.estimate-complete \.summary-panel \{\s*display: none;/);
});

test("mobile specification fields do not trigger browser focus zoom", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.chat-panel input,[\s\S]*?\.chat-panel select,[\s\S]*?\.chat-panel textarea \{[\s\S]*?font-size: 16px !important;[\s\S]*?touch-action: manipulation;/);
});

test("wide desktop calculator places its headline above a widening workspace", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media \(min-width: 1241px\)/);
  assert.match(css, /\.intro \{[\s\S]*?width: min\(1600px, calc\(100% - 96px\)\);[\s\S]*?grid-template-columns: 1fr;/);
  assert.match(css, /\.intro-copy \{[\s\S]*?width: min\(100%, 1040px\);[\s\S]*?justify-self: center;[\s\S]*?text-align: center;/);
  assert.match(css, /\.eyebrow,[\s\S]*?\.trust-list \{[\s\S]*?justify-content: center;/);
  assert.match(css, /\.quote-workspace \{[\s\S]*?width: 100%;[\s\S]*?grid-template-columns: minmax\(640px, 2\.2fr\) minmax\(300px, 0\.8fr\);/);
  assert.match(css, /@media \(min-width: 1600px\)[\s\S]*?\.intro \{[\s\S]*?width: min\(1680px, calc\(100% - 120px\)\);/);
  assert.doesNotMatch(css, /grid-template-columns: minmax\(400px, 430px\) minmax\(700px, 1fr\);/);
});

test("calculator headline uses the same loaded typeface on desktop and mobile", async () => {
  const [source, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /<h1 aria-label="用幾個問題，找到適合你的設計預算。">[\s\S]*?用幾個問題/);
  assert.match(source, /用幾個問題<span className="headline-punctuation">，<\/span>/);
  assert.match(source, /找到適合你的設計預算<span className="headline-punctuation">。<\/span>/);
  assert.match(layout, /fonts\.googleapis\.com\/css2\?family=Noto\+Serif\+TC/);
  assert.match(css, /--title-serif: "Noto Serif TC", "Songti TC", serif;/);
  const baseIntroCopy = css.match(/\.intro-copy \{([\s\S]*?)\}/)?.[1] ?? "";
  const baseHeadline = css.match(/\.intro h1 \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.doesNotMatch(baseIntroCopy, /width: 100%|justify-self/);
  assert.match(baseHeadline, /margin: 0;/);
  assert.match(baseHeadline, /font-family: var\(--title-serif\);/);
  assert.doesNotMatch(baseHeadline, /text-align/);
  assert.match(css, /\.headline-punctuation \{[\s\S]*?font-size: 0\.7em;[\s\S]*?vertical-align: 0\.08em;/);
  const mobileCss = css.slice(css.indexOf("@media (max-width: 760px)"));
  const mobileHeadline = mobileCss.match(/\.intro h1 \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.doesNotMatch(mobileHeadline, /font-family/);
});

test("specification cards place back immediately left of their next action", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /const inlineBackSteps = new Set<Step>/);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const ecommerceCard = renderControls.match(/case "ecommerceDetails": \{([\s\S]*?)case "printDetails": \{/)?.[1] ?? "";
  const printCard = renderControls.match(/case "printDetails": \{([\s\S]*?)case "serviceDetails": \{/)?.[1] ?? "";
  const serviceCard = renderControls.match(/case "serviceDetails": \{([\s\S]*?)case "printPurpose": \{/)?.[1] ?? "";
  for (const card of [ecommerceCard, printCard, serviceCard]) {
    assert.match(card, /className="compact-card-actions">[\s\S]*?← 返回上一步[\s\S]*?className="send-button"/);
  }
  assert.match(source, /const usesInlineBackNavigation = inlineBackSteps\.has\(step\)/);
  assert.match(css, /\.compact-card-actions \{[\s\S]*?display: flex;/);
  assert.match(css, /\.inline-back-button/);
});

test("choice-only questionnaire steps place back navigation below the choices", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(source, /className=\{`response-area step-transition is-\$\{transitionDirection\}\$\{history\.length > 0 && !usesInlineBackNavigation/);
  assert.match(source, /className="response-controls">\{renderControls\(\)\}<\/div>[\s\S]*?className="response-back-row"[\s\S]*?className="response-back-button"/);
  assert.match(source, /\{step === "result" && <button type="button" onClick=\{goBack\}/);
  assert.match(css, /\.response-area\.with-back-navigation \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.response-back-row \{[\s\S]*?justify-content: flex-start/);
});

test("questionnaire step navigation keeps reached sections available in both directions", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /type JourneySection = "cooperation"[\s\S]*?"result"/);
  assert.match(source, /const journeySectionLabels: Record<JourneySection, string>/);
  assert.match(source, /cooperation: "合作方式"/);
  assert.match(source, /services: "服務項目"/);
  assert.match(source, /specifications: "規格"/);
  assert.match(source, /const singleJourneySections: JourneySection\[\] = \["cooperation", "services", "specifications", "source", "result"\]/);
  assert.match(source, /const monthlyJourneySections: JourneySection\[\] = \["cooperation", "services", "source", "result"\]/);
  assert.match(source, /function getJourneySection\(step: Step\)/);
  assert.match(source, /const \[journeyTimeline, setJourneyTimeline\] = useState<HistoryEntry\[\]>\(\[\]\)/);
  assert.match(source, /const \[journeyPosition, setJourneyPosition\] = useState\(0\)/);
  assert.match(source, /const history = journeyTimeline\.slice\(0, journeyPosition\)/);
  assert.match(source, /const \[journeyFlow, setJourneyFlow\] = useState<ProjectType>\(\)/);
  assert.match(source, /const \[journeySnapshots, setJourneySnapshots\] = useState<Partial<Record<JourneySection, HistoryEntry>>>\(\{\}\)/);
  assert.match(source, /const journeySteps = useMemo\(\(\) => \{/);
  assert.match(source, /const flow = answers\.projectType \?\? journeyFlow/);
  assert.match(source, /return sections\.map\(\(section\) => \(\{/);
  assert.match(source, /available: journeyTimeline\.some\(\(entry\) => getJourneySection\(entry\.step\) === section\)/);
  assert.match(source, /if \(step === "projectType" && selectedProjectType\) setJourneyFlow\(selectedProjectType\)/);
  assert.match(source, /const destinationSnapshot: HistoryEntry = \{ step: next, answers: nextAnswers, messages: nextMessages \}/);
  assert.match(source, /current\.slice\(0, journeyPosition \+ 1\)/);
  assert.match(source, /updated\.push\(destinationSnapshot\)/);
  assert.match(source, /setJourneyPosition\(journeyPosition \+ 1\)/);
  assert.match(source, /\[nextSection\]: destinationSnapshot/);
  assert.match(source, /const previous = journeyTimeline\[journeyPosition - 1\]/);
  assert.match(source, /setJourneyPosition\(journeyPosition - 1\)/);
  assert.match(source, /setJourneyFlow\(undefined\)/);
  assert.match(source, /setJourneySnapshots\(\{\}\)/);
  assert.match(source, /setJourneyTimeline\(\[\]\)/);
  assert.match(source, /setJourneyPosition\(0\)/);
  assert.match(source, /function jumpToJourneySection\(section: JourneySection\)/);
  assert.match(source, /const targetTimelineIndex = journeyTimeline\.findIndex\(\(entry\) => getJourneySection\(entry\.step\) === section\)/);
  assert.match(source, /const target = journeySnapshots\[section\] \?\? journeyTimeline\[targetTimelineIndex\]/);
  assert.match(source, /setJourneyPosition\(targetTimelineIndex\)/);
  assert.match(source, /function restoreRememberedSpecifications\(current: Answers, remembered\?: Answers\)/);
  assert.match(source, /restoreRememberedSpecifications\(patchedAnswers, journeySnapshots\.specifications\?\.answers\)/);
  assert.match(source, /const rememberedAnswers = currentSection === "specifications"/);
  assert.match(source, /restoreRememberedSpecifications\(currentSnapshot\.answers, current\[currentSection\]\?\.answers\)/);
  assert.match(source, /\[currentSection\]: \{ \.\.\.currentSnapshot, answers: rememberedAnswers \}/);
  assert.doesNotMatch(source, /已填內容會保留，不用逐題返回/);
  assert.doesNotMatch(source, /className="time-pill"/);
  assert.doesNotMatch(source, /nextStep === "ecommerceDetails" \? \{ ecommerceDesignDetails: \{\}, ecommerceDetailIndex: 0 \}/);
  assert.doesNotMatch(source, /nextStep === "printDetails" \? \{ printDesignDetails: \{\}, printDetailIndex: 0 \}/);
  assert.doesNotMatch(source, /nextStep === "serviceDetails" \? \{ serviceDesignDetails: \{\}, serviceDetailIndex: 0 \}/);
  assert.doesNotMatch(source, /setHistory|targetHistoryIndex/);
  assert.match(source, /<nav className="journey-nav" aria-label="快速跳轉試算步驟">/);
  assert.match(source, /journeySteps\.map\(\(item, index\) =>/);
  assert.match(source, /disabled=\{item\.current \|\| !item\.available\}/);
  assert.match(source, /aria-current=\{item\.current \? "step" : undefined\}/);
  assert.match(source, /尚未到達：\$\{item\.label\}/);
  assert.match(source, /前往步驟：\$\{item\.label\}/);
  assert.match(source, /jumpToJourneySection\(item\.section\)/);
  assert.match(source, /PointerEvent as ReactPointerEvent/);
  assert.match(source, /const journeyNavListRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(source, /const journeyDragRef = useRef\(\{ active: false, pointerId: -1, startX: 0, scrollLeft: 0, moved: false \}\)/);
  assert.match(source, /function startJourneyDrag\(event: ReactPointerEvent<HTMLDivElement>\)/);
  assert.match(source, /function moveJourneyDrag\(event: ReactPointerEvent<HTMLDivElement>\)/);
  const startJourneyDrag = source.match(/function startJourneyDrag\(event: ReactPointerEvent<HTMLDivElement>\) \{([\s\S]*?)function moveJourneyDrag/)?.[1] ?? "";
  const moveJourneyDrag = source.match(/function moveJourneyDrag\(event: ReactPointerEvent<HTMLDivElement>\) \{([\s\S]*?)function endJourneyDrag/)?.[1] ?? "";
  assert.doesNotMatch(startJourneyDrag, /setPointerCapture/);
  assert.match(moveJourneyDrag, /if \(!drag\.moved\) \{[\s\S]*?drag\.moved = true;[\s\S]*?list\.setPointerCapture\(event\.pointerId\)/);
  assert.match(source, /list\.scrollLeft = drag\.scrollLeft - distance/);
  assert.match(source, /onPointerDown=\{startJourneyDrag\}/);
  assert.match(source, /onPointerMove=\{moveJourneyDrag\}/);
  assert.match(source, /onPointerUp=\{endJourneyDrag\}/);
  assert.match(source, /event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\)/);
  assert.match(css, /\.journey-nav-list \{[\s\S]*?overflow-x: auto;[\s\S]*?overflow-y: hidden;[\s\S]*?scrollbar-width: thin;/);
  assert.match(css, /\.journey-nav-list \{[\s\S]*?overscroll-behavior-y: none;[\s\S]*?touch-action: pan-x;[\s\S]*?cursor: grab;/);
  assert.match(css, /\.journey-nav-list\.is-dragging,[\s\S]*?cursor: grabbing;/);
  assert.match(css, /\.journey-nav-button\.is-current \{[\s\S]*?background: var\(--brown-dark\);/);
  assert.match(css, /\.journey-nav-button\.is-pending,[\s\S]*?\.journey-nav-button\.is-skipped \{/);
  assert.match(css, /\.journey-nav-button\.is-pending \{[\s\S]*?border-style: dashed;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.journey-nav-label \{[\s\S]*?display: none;/);
});

test("single-service specifications follow the visible service order", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const firstDestination = source.match(/function getFirstIncompleteSpecificationDestination\(answers: Answers\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const nextDestination = source.match(/function getNextIncompleteSpecificationDestination\(answers: Answers, currentServiceId: string\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const nextSingleDestination = source.match(/function getNextSingleSpecificationDestination\(([\s\S]*?)\n  \}/)?.[1] ?? "";

  assert.match(source, /function getSelectedSpecificationServices\(answers: Answers\)[\s\S]*?return services\.filter/);
  assert.match(source, /const specificationServices = getSelectedSpecificationServices\(answers\)/);
  assert.match(firstDestination, /\.find\(\(service\) => !isSpecificationCompleteForAnswers\(answers, service\)\)/);
  assert.match(nextDestination, /\.\.\.selected\.slice\(currentIndex \+ 1\), \.\.\.selected\.slice\(0, currentIndex\)/);
  assert.match(nextDestination, /candidates\.find\(\(service\) => !isSpecificationCompleteForAnswers\(answers, service\)\)/);
  assert.match(source, /function beginServiceQuestions\(\)[\s\S]*?getSpecificationDestination\(answers, nextService\)[\s\S]*?move\(destination\.step, destination\.patch, userText\)/);
  assert.match(source, /function submitQuantities\([\s\S]*?getFirstIncompleteSpecificationDestination\(answers\)[\s\S]*?move\(destination\.step, destination\.patch, quantitySummary\)/);
  assert.match(nextSingleDestination, /candidates\.find\(\(service\) => !confirmedIds\.includes\(service\.id\)\)/);
  assert.match(source, /function confirmEcommerceDetails\([\s\S]*?advanceSingleSpecification\(activeEcommerceService\.id/);
  assert.match(source, /function confirmPrintDetails\([\s\S]*?advanceSingleSpecification\(activeDetailedService\.id/);
  assert.match(source, /function confirmServiceDetails\([\s\S]*?advanceSingleSpecification\(activeServiceDetailService\.id/);
  assert.doesNotMatch(source, /function nextAfterQuantity|function nextAfterEcommerceDetails/);
});

test("category and service selection places back immediately left of confirm items", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const categoryStep = renderControls.match(/case "category":([\s\S]*?)case "quantity":/)?.[1] ?? "";
  assert.match(source, /const inlineBackSteps = new Set<Step>\(\[[\s\S]*?"category"/);
  assert.match(categoryStep, /className="multi-select-actions">[\s\S]*?← 返回上一步[\s\S]*?開始確認需求 →/);
  assert.match(css, /\.multi-select-actions \{[\s\S]*?display: flex;/);
});

test("all explicit primary actions keep back immediately to their left", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const inlineSteps = source.match(/const inlineBackSteps = new Set<Step>\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
  for (const step of [
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
    "monthlyProfile",
    "monthlyServices",
    "monthlyVolume",
  ]) {
    assert.match(inlineSteps, new RegExp(`"${step}"`));
  }
  assert.match(source, /className="number-form-actions">[\s\S]*?← 返回上一步[\s\S]*?className="send-button"/);
  assert.match(source, /className="standalone-actions">[\s\S]*?← 返回上一步[\s\S]*?繼續 →/);
  assert.match(source, /const usesInlineBackNavigation = inlineBackSteps\.has\(step\)/);
  assert.match(css, /\.number-form-actions \{[\s\S]*?display: flex;/);
  assert.match(css, /\.standalone-actions \{[\s\S]*?display: flex;/);
});

test("questionnaire omits the client budget question and finishes directly", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\| "budget"|case "budget"|設計預算（選填）|暫時不設定預算|answers\.budget|客戶預算|預算狀態/);
  assert.match(source, /function confirmMonthlySourceFiles\(\)[\s\S]*?move\("result"/);
  assert.match(source, /function confirmSingleAddOns\(\)[\s\S]*?move\("result"/);
  assert.doesNotMatch(source, /hasSelectedPrintService\(answers\) \? "printProduction" : "result"/);
});

test("monthly plans are matched after service quantities are selected", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const monthlyServices = renderControls.match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";
  const monthlyVolume = renderControls.match(/case "monthlyVolume":([\s\S]*?)case "monthlyCadence":/)?.[1] ?? "";

  assert.doesNotMatch(monthlyServices, /每月設計組數<\/span><(?:select|input)/);
  assert.match(monthlyServices, /是否首次合作/);
  assert.match(monthlyServices, /selectMonthlyFirstTime\(true\)/);
  assert.match(monthlyServices, /selectMonthlyFirstTime\(false\)/);
  assert.match(monthlyServices, /確認合作紀錄後，選擇服務與數量，系統會自動配對方案/);
  assert.doesNotMatch(monthlyServices, /autoMatchedPrice|monthlyGroupOptions/);
  assert.match(source, /function selectMonthlyFirstTime\(monthlyFirstTime: boolean\)[\s\S]*?matchMonthlyPlanToServices/);
  assert.match(monthlyVolume, /<select[\s\S]*?請選擇每月設計組數[\s\S]*?組／月/);
  assert.doesNotMatch(monthlyVolume, /type="number"/);
  assert.match(css, /\.number-form input,\s*\.number-form select/);
});

test("questionnaire buttons share the completion action proportions", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /button\.send-button,\s*button\.inline-back-button,\s*button\.response-back-button \{[\s\S]*?font-family: var\(--specification-ui-sans\);[\s\S]*?font-size: 0\.74rem;[\s\S]*?font-weight: 650;[\s\S]*?line-height: 1\.4;/);
  assert.match(css, /\.send-button \{[\s\S]*?min-height: 52px;[\s\S]*?border-radius: 11px;/);
  assert.match(css, /\.inline-back-button \{[\s\S]*?min-height: 52px;[\s\S]*?border-radius: 11px;/);
  assert.match(css, /\.response-back-button \{[\s\S]*?min-height: 52px;[\s\S]*?border-radius: 11px;/);
  assert.match(css, /\.compact-check \{[\s\S]*?min-height: 47px;[\s\S]*?border-radius: 11px;/);
  assert.doesNotMatch(css, /\.multi-select-footer \.send-button \{[^}]*min-height:/);
  assert.doesNotMatch(css, /\.compact-card-footer \.send-button \{[^}]*min-height:/);
  assert.match(css, /\.send-button,\s*\.inline-back-button,\s*\.response-back-button \{\s*min-height: 47px;/);
});

test("matched monthly plans show a compact specification summary", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const monthlyServicesStep = renderControls.match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";

  assert.match(monthlyServicesStep, /className="matched-plan-card"/);
  assert.match(monthlyServicesStep, /className="multi-select-wrap monthly-service-selector"[\s\S]*?className="matched-plan-card"/);
  assert.match(monthlyServicesStep, /依服務自動帶入[\s\S]*?\{plan\.name\}/);
  assert.match(monthlyServicesStep, /每月數量[\s\S]*?計算方式[\s\S]*?服務範圍[\s\S]*?交付安排/);
  assert.match(monthlyServicesStep, /<dd>依單次設計費合計<\/dd>/);
  assert.match(monthlyServicesStep, /交付 JPG／PNG／PDF 完稿/);
  assert.doesNotMatch(source, /includesResize|贈送.*Resize|Resize.*贈送/);
  assert.match(css, /\.matched-plan-specs \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("monthly plans allocate service quantities without exceeding plan rules", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const renderControls = source.slice(source.indexOf("function renderControls()"));
  const monthlyServicesStep = renderControls.match(/case "monthlyServices":([\s\S]*?)case "sourceFile":/)?.[1] ?? "";
  const monthlyGroups = source.match(/const monthlyServiceGroups = \[([\s\S]*?)\];/)?.[1] ?? "";
  const monthlySocialAdjustment = source.match(/function adjustMonthlySocialImageCount\([\s\S]*?\n  }\n\n  function adjustMonthlyProductFrameProductCount/)?.[0] ?? "";

  assert.match(source, /move\("monthlyServices", \{[\s\S]*?monthlyPlanId: matchedPlan\?\.id/);
  assert.match(source, /function adjustMonthlyServiceQuantity\(serviceId: string, change: -1 \| 1\)/);
  assert.doesNotMatch(source, /function getMonthlyServiceUnitNote\(service: Service\)/);
  assert.match(source, /function getMonthlyServiceGroupCost\(_service: Service\) \{\s*return 1;\s*\}/);
  assert.doesNotMatch(source, /function getMonthlyServiceGroupCost[\s\S]*?if \(service\.id === "resize"\) return 0\.5/);
  assert.doesNotMatch(source, /if \(service\.id === "banner"\) return 2/);
  assert.doesNotMatch(source, /service\.category === "print"\) return 2/);
  assert.match(source, /const maximum = service\.id === "banner" \? BANNER_MAIN_VISUAL_LIMIT : service\.category === "print" \? 2 : 10/);
  assert.match(source, /service\.category === "other"/);
  assert.match(source, /allocatedPrintGroups \+ groupCost > 2 \+ 0\.001/);
  assert.match(source, /allocated \+ groupCost > 10 \+ 0\.001/);
  assert.match(source, /function matchMonthlyPlanToServices\(answers: Answers\)/);
  assert.match(source, /const canMatchPlan = isWholeGroup && allocatedGroups >= minimumGroups && allocatedGroups <= 10/);
  assert.match(source, /return \{ \.\.\.answers, monthlyGroupCount, monthlyPlanId: matchedPlan\?\.id \}/);
  assert.match(source, /function confirmMonthlyServices\(\)[\s\S]*?if \(!monthlyDistributionComplete\) return;[\s\S]*?move\("sourceFile"/);
  assert.match(monthlyServicesStep, /monthlyServiceGroups\.map[\s\S]*?monthly-service-quantity-list/);
  assert.match(monthlyServicesStep, /service-category-list monthly-service-category-list/);
  assert.match(monthlyServicesStep, /service-category-panel/);
  assert.match(monthlyServicesStep, /monthly-service-list-\$\{group\.key\}/);
  assert.match(monthlyServicesStep, /setExpandedServiceCategory\(isExpanded \? null : group\.key\)/);
  assert.doesNotMatch(monthlyServicesStep, /monthly-category-tabs|monthlyServiceCategory/);
  assert.match(monthlyServicesStep, /choice monthly-service-quantity monthly-service-choice/);
  assert.match(monthlyServicesStep, /<small>\{item\.description\}<\/small>/);
  assert.match(monthlyServicesStep, /單次價格參考：\{getServiceDisplayPrice\(item\)\}/);
  assert.match(monthlyServicesStep, /減少 \$\{item\.name\}[\s\S]*?增加 \$\{item\.name\}/);
  assert.doesNotMatch(monthlyServicesStep, /占 \$\{groupCost\} 組|占 1 組|占 2 組/);
  assert.match(monthlyServicesStep, /平面設計每月合計限 2 組，未使用組數不累積/);
  assert.doesNotMatch(monthlyServicesStep, /Resize、照片後製與模板設計請使用單次估價/);
  assert.match(monthlyServicesStep, /blockedByPrintLimit/);
  assert.match(monthlyServicesStep, /const maximumQuantity = item\.id === "banner" \? BANNER_MAIN_VISUAL_LIMIT : item\.category === "print" \? 2 : 10/);
  assert.match(monthlyServicesStep, /const maximumReached = quantity >= maximumQuantity/);
  assert.match(source, /activeEcommerceService\.id === "banner" \? requiredQuantityOptions\.slice\(0, BANNER_MAIN_VISUAL_LIMIT\) : requiredQuantityOptions/);
  assert.match(monthlyServicesStep, /requiredPageCountOptions\.filter\(\(count\) => count >= minimumPageCount\)\.map/);
  assert.match(monthlyServicesStep, /disabled=\{answers\.monthlyFirstTime === undefined \|\| monthlyRemainingCapacity \+ 0\.001 < groupCost \|\| maximumReached \|\| blockedByPrintLimit\}/);
  assert.match(monthlyServicesStep, /disabled=\{!monthlyDistributionComplete\}[\s\S]*?確認並帶入方案 →/);
  assert.match(source, /function formatMonthlyServiceQuantity\(service: Service, quantity: number, concise = false, answers\?: Answers\)/);
  assert.match(source, /service\.id === "dm" \|\| service\.id === "menu"/);
  assert.match(source, /function getMonthlyPrintDetails\(answers: Answers, serviceId: "dm" \| "menu", quantity: number\)/);
  assert.match(source, /savedDetails\[index\] \?\? \(index === 0 \? legacyDetail \?\? \{\} : \{\}\)/);
  assert.match(source, /details\.join\("；"\)/);
  assert.doesNotMatch(source, /MonthlyServiceMode|monthlyServiceModes|updateMonthlyServiceMode|同一份多頁/);
  assert.match(source, /項目：\$\{selectedServices\.map\(\(item\) => formatMonthlyServiceQuantity/);
  assert.match(monthlyServicesStep, /每篇貼文需要幾張圖？/);
  assert.match(source, /if \(nextPostCount > 0\) quantities\.social = nextPostCount/);
  assert.match(source, /return `\$\{name\} ×\$\{postCount\} 篇（共 \$\{totalImages\} 張）`/);
  assert.match(monthlySocialAdjustment, /return \{ \.\.\.current, socialPostImageCounts: imageCounts \}/);
  assert.doesNotMatch(monthlySocialAdjustment, /getMonthlyAllocatedGroups|quantities|matchMonthlyPlanToServices/);
  assert.match(monthlyServicesStep, /篇內張數不增加月方案組數/);
  assert.match(monthlyServicesStep, /增加第 \$\{index \+ 1\} 篇圖片張數`} disabled=\{imageCount >= SOCIAL_IMAGES_PER_POST_LIMIT\}/);
  assert.match(monthlyServicesStep, /每篇最多 10 張圖並計 1 組/);
  assert.match(monthlyServicesStep, /同篇第 2 張起 \$250～\$500／張/);
  assert.match(monthlyServicesStep, /每版圖框需要套用幾項產品？/);
  assert.match(monthlyServicesStep, /第 \$\{index \+ 1\} 版圖框產品數量/);
  assert.match(monthlyServicesStep, /每版含 1 項產品；每追加 1 項 \+\$70，不增加月方案組數/);
  assert.doesNotMatch(monthlyServicesStep, /套用產品總數/);
  assert.match(source, /function getMonthlyCardDetails\(answers: Answers, quantity: number\)/);
  assert.match(monthlyServicesStep, /monthlyCardDetails\.map\(\(monthlyCardDetail, versionIndex\)/);
  assert.match(monthlyServicesStep, /已選 \{quantity\} 款，請分別選擇每款的規格/);
  assert.match(monthlyServicesStep, /月方案名片／會員卡第\$\{versionIndex \+ 1\}款單面或雙面/);
  assert.match(monthlyServicesStep, /<option value="single">單面<\/option>[\s\S]*?<option value="double">雙面<\/option>/);
  assert.doesNotMatch(monthlyServicesStep, /單面 \$1,000～\$1,500／款|雙面 \$1,200～\$2,200／款|每款 \+\$300/);
  assert.match(source, /getMonthlyCardDetails\(answers, quantity\)\.forEach\(\(detail\)/);
  assert.match(source, /reference\.designLow \+= range\.low/);
  assert.match(source, /reference\.designHigh \+= range\.high/);
  assert.match(monthlyServicesStep, /monthlyPrintServiceId = item\.id === "dm" \|\| item\.id === "menu" \? item\.id : undefined/);
  assert.match(monthlyServicesStep, /monthlyPrintDetails\.map\(\(monthlyPrintDetail, versionIndex\)/);
  assert.match(monthlyServicesStep, /已選 \{quantity\} 項，請分別填寫每個版本的規格/);
  assert.match(monthlyServicesStep, /aria-label=\{`月方案\$\{item\.name\}第\$\{versionIndex \+ 1\}項成品結構`\}/);
  assert.match(monthlyServicesStep, /getPrintStructureOptions\(monthlyPrintServiceId\)/);
  assert.match(monthlyServicesStep, /aria-label=\{`月方案\$\{item\.name\}第\$\{versionIndex \+ 1\}項折頁方式`\}/);
  assert.match(monthlyServicesStep, /aria-label=\{`月方案\$\{item\.name\}第\$\{versionIndex \+ 1\}項尺寸與方向`\}/);
  assert.doesNotMatch(monthlyServicesStep, /提供初稿排程|timelineLabels|dmDetail\.timeline/);
  assert.match(monthlyServicesStep, /FoldChoice key={value} fold={value}/);
  assert.match(monthlyServicesStep, /主要用途（單選）/);
  assert.match(monthlyServicesStep, /name=\{`monthly-\$\{monthlyPrintServiceId\}-\$\{versionIndex\}-purpose`\}/);
  assert.doesNotMatch(monthlyServicesStep, /toggleMonthlyDmPurpose|selectMonthlyDmPurpose|主要用途（可複選）/);
  assert.match(monthlyServicesStep, /文字內容[\s\S]*?素材狀況[\s\S]*?延伸版本[\s\S]*?視覺複雜度[\s\S]*?完稿期限/);
  assert.match(monthlyServicesStep, /套用常見尺寸/);
  assert.match(monthlyServicesStep, /總設計頁數 <small>（含封面、封底）<\/small>/);
  assert.match(monthlyServicesStep, /aria-label=\{`月方案\$\{item\.name\}第\$\{versionIndex \+ 1\}項總設計頁數`\}[\s\S]*?requiredPageCountOptions\.filter\(\(count\) => count >= minimumPageCount\)\.map/);
  assert.match(monthlyServicesStep, /<option value="custom">自訂頁數<\/option>/);
  assert.match(monthlyServicesStep, /aria-label=\{`月方案\$\{item\.name\}第\$\{versionIndex \+ 1\}項自訂總設計頁數`\}/);
  assert.match(monthlyServicesStep, /className="custom-page-count-input"/);
  assert.match(monthlyServicesStep, /pageCount: parseOptionalPositiveInteger\(event\.target\.value\)/);
  assert.match(monthlyServicesStep, /頁數不增加月方案組數；第 2 頁起依追加頁價格計算，並套用月方案優惠/);
  assert.match(source, /getMonthlyPrintDetails\(answers, item\.id, quantity\)\.flatMap/);
  assert.match(source, /quantity > 1 \? `\$\{item\.name\}第 \$\{index \+ 1\} 項` : item\.name/);
  assert.doesNotMatch(source, /傳單／DM提供初稿排程/);
  assert.match(source, /\(\["dm", "menu"\] as const\)\.forEach/);
  assert.match(source, /const prefix = quantity > 1 \? `\$\{service\.name\}第 \$\{index \+ 1\} 項` : service\.name/);
  assert.match(source, /`\$\{prefix\}用途：\$\{detail\.purposes/);
  assert.match(source, /`\$\{prefix\}規格：\$\{specification\.join/);
  assert.match(source, /`\$\{prefix\}內容：\$\{content\.join/);
  assert.match(source, /`\$\{prefix\}視覺／完稿：\$\{schedule\.join/);
  assert.match(source, /detail\.structure === "multipage" && detail\.pageCount[\s\S]*?`\$\{structure\}・\$\{detail\.pageCount\} 頁`/);
  assert.match(source, /monthlyMissingDetailLabels/);
  assert.match(css, /\.monthly-service-selector \{[\s\S]*?border-radius: 13px;/);
  assert.match(css, /\.monthly-quantity-stepper \{[\s\S]*?grid-template-columns: 34px 30px 34px/);
  assert.match(css, /\.monthly-print-version-list \{[\s\S]*?display: grid;/);
  assert.match(css, /\.monthly-print-version \{[\s\S]*?border-radius: 10px;/);
  assert.match(monthlyGroups, /key: "ecommerce"[\s\S]*?key: "print"/);
  assert.doesNotMatch(monthlyGroups, /key: "resize"|serviceIds: \["resize"\]/);
  assert.doesNotMatch(monthlyGroups, /key: "other"|其他設計服務/);
});

test("monthly pricing discounts the selected one-time services without discounting add-ons", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const monthlyDiscountRates:[\s\S]*?3: 0\.95[\s\S]*?4: 0\.92[\s\S]*?6: 0\.9[\s\S]*?8: 0\.88[\s\S]*?10: 0\.88/);
  assert.match(source, /function getMonthlyDiscountRate/);
  assert.match(source, /const monthlyReference = getMonthlyPricingReference\(answers\)/);
  assert.match(source, /const discountedDesign = getMonthlyDiscountedDesignRange\(answers\)/);
  assert.match(source, /const socialVolumeDiscountPercent = 5/);
  assert.doesNotMatch(source, /monthlyCombinedDiscountPercentCap|getMonthlySocialCombinedDiscountPercent|hasMonthlySocialCombinedDiscount|socialPayableRate/);
  assert.match(source, /low: roundMonthlyPrice\(reference\.designLow \* discountRate\)/);
  assert.match(source, /answers\.projectType === "single" && service\.id === "social" && quantity >= 10/);
  assert.match(source, /baseLow = discountedDesignLow/);
  assert.match(source, /addonLow = monthlyReference\.addonLow/);
  assert.match(source, /function getMonthlyPricingReference/);
  assert.match(source, /const pageCount = detail\.structure === "multipage"[\s\S]*?Math\.max\(1, detail\.pageCount \?\? 1\)/);
  assert.doesNotMatch(source, /Math\.max\(2, detail\.pageCount \?\? 2\)/);
  assert.match(source, /getMonthlyPrintDetails\(answers, service\.id, quantity\)\.forEach\(\(detail\)/);
  assert.match(source, /reference\.designLow \+= service\.low \+ extraPageCount \* 600/);
  assert.match(source, /reference\.designHigh \+= service\.high \+ extraPageCount \* 800/);
  assert.doesNotMatch(source, /reference\.addonLow \+= extraPageCount \* 600/);
  assert.doesNotMatch(source, /reference\.addonHigh \+= extraPageCount \* 800/);
  assert.match(source, /return total \+ Math\.max\(0, answers\.quantities\[serviceId\] \?\? 0\) \* getMonthlyServiceGroupCost\(service\)/);
  assert.match(source, /function getMonthlySingleReference/);
  assert.match(source, /function getMonthlyComparison/);
  assert.match(source, /singleSocialPayableRate = \(100 - socialVolumeDiscountPercent\) \/ 100/);
  assert.match(source, /單次合計參考已套用社群圖文總圖滿 10 張的 5% 優惠；月方案仍只套用組數折扣/);
  assert.match(source, /單次滿 10 張已套用 5% 優惠/);
  assert.match(source, /與單次優惠後相近/);
  assert.match(source, /商品主圖套版｜追加產品/);
  assert.doesNotMatch(source, /網頁 Banner｜主視覺延伸加購/);
  assert.doesNotMatch(source, /\$\{service\.name\}｜追加頁數/);
  assert.match(source, /網站主視覺延伸與宣傳單／菜單多頁依加價計算並套用月方案優惠/);
  assert.match(source, /const serviceAddonRows = monthlyAddonBreakdown\.filter\(\(item\) => item\.label\.startsWith\(`\$\{service\.name\}｜`\)\)/);
  assert.match(source, /return \[designFeeRow, \.\.\.serviceAddonRows\]/);
  assert.doesNotMatch(source, /\.\.\.monthlyAddonBreakdown,\n\s*\]/);
  assert.match(source, /const addonRows = monthlyPdfAddonRows[\s\S]*?item\.label\.startsWith\(`\$\{service\.name\}｜`\)/);
  assert.match(source, /label: item\.label\.replace\(`\$\{service\.name\}｜`, `項次 \$\{serviceIndex \+ 1\}・`\)/);
  assert.match(source, /不套用月方案折扣/);
  assert.match(source, /已套用月方案 \$\{formatMonthlyDiscount\(discountRate\)\}/);
  assert.match(source, /IG／FB 社群圖文總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用/);
  assert.match(source, /總圖滿 10 張的 5% 優惠僅適用單次服務，月方案不適用/);
  assert.match(source, /原始檔另行確認；代辦印刷於合作確認時另行估價，均不計入網站初估/);
  assert.match(source, /單次委託參考/);
  assert.match(source, /className=\{`monthly-comparison/);
  assert.match(css, /\.monthly-comparison \{/);
});

test("calculator and PDF state cooperation terms without tax and invoice wording", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(source, /付款方式：20% 訂金、80% 尾款/);
  assert.match(source, /每案含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 \$300 起／次/);
  assert.match(source, /每組含 3 次細節修改，不含重新設定主視覺方向；超出 3 次，費用 \$300 起／次/);
  assert.match(source, /單次服務確認合作並支付訂金後，如取消合作，20% 訂金不予退還/);
  assert.doesNotMatch(source, /進入製作後恕不退款/);
  assert.match(source, /月方案如需取消或調整，最晚於製作前 2 日告知；已開始製作的部分不予退款/);
  assert.match(source, /僅尚未開始製作的部分可依實際進度評估退款/);
  assert.match(source, /const singlePdfTermsRows:[\s\S]*?每案含 3 次細節修改；更換整體方向或超過次數將另行報價。[\s\S]*?確認合作後如取消，20% 訂金不退。[\s\S]*?label: "付款方式"/);
  assert.match(source, /const monthlyPdfTermsRows:[\s\S]*?每組含 3 次細節修改；更換整體方向或超過次數將另行報價。[\s\S]*?取消或調整請於製作前 2 日告知；已開始製作的部分不退款。[\s\S]*?原始檔與代辦印刷費用另計。[\s\S]*?label: "付款方式"/);
  assert.doesNotMatch(source, /未執行部分可評估退款|若尚未完成/);
  assert.match(source, /const pdfSummaryLines = summaryLines\.slice\(1, -1\)/);
  assert.doesNotMatch(source, /稅金與發票/);
  assert.doesNotMatch(source, /40% 訂金|60% 尾款/);
});

test("reviewed summaries and PDFs omit redundant or empty information", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(source, /monthlyContent|monthlyContentLabels|主要設計類型/);
  assert.match(source, /answers\.projectType === "monthly"[\s\S]*?"排程前確認"/);
  assert.match(source, /answers\.projectType === "monthly" && plan \? "尚未選擇服務"/);
  assert.doesNotMatch(source, /answers\.budget|<dt>預算狀態<\/dt>|客戶預算/);
  assert.match(source, /activeServiceDetailService\.id === "photo" \? "套用常見設定" : "套用常見尺寸"/);
  assert.doesNotMatch(source, /\$\{service\.name\}待確認：\$\{pending\.join\("、"\)\}/);
  assert.doesNotMatch(source, /line\.startsWith\(`\$\{service\.name\}待確認：`\)/);
  assert.doesNotMatch(source, /文案尚未確定|素材尚未確定|製作程度尚未確定|視覺尚未確定/);
  assert.match(source, /function formatExtensionSummary/);
  assert.match(source, /延伸版本 ×\$\{count\}（同版換內容；不含重排／Resize）/);
  assert.match(source, /優惠幅度：單次設計費合計（含 Banner 主視覺延伸與 DM／菜單多頁）× \$\{formatMonthlyDiscount/);
  assert.match(source, /特殊計價：\$\{monthlyCooperationNotes\[1\]\}/);
  assert.match(source, /const summaryServiceItems = selectedServices\.map/);
  assert.match(source, /function formatLiveSummaryServiceQuantity/);
  assert.match(source, /service\.pricing === "dm"[\s\S]*?×\$\{quantity\} 頁/);
  assert.match(source, /summaryServiceItems\.map\(\(item\) => <span key=\{item\}>\{item\}<\/span>\)/);
  assert.doesNotMatch(source, /贈送.*Resize|Resize.*贈送|Resize 1 張/);
  assert.match(source, /<dt>原始檔<\/dt>[\s\S]*?\{monthlySourceFileCount\} 份・費用另行確認/);
  assert.match(source, /<dt>配對方案<\/dt>[\s\S]*?plan\.name[\s\S]*?answers\.monthlyGroupCount/);
  assert.doesNotMatch(source, /<dt>方案比較<\/dt>/);
  assert.match(source, /selectedServices\.some\(\(service\) => service\.category === "print"\)[\s\S]*?平面設計每月合計限 2 組/);
  assert.match(source, /月方案原始檔加購（\$\{sourceFileSelections\.map/);
  assert.doesNotMatch(source, /折算後設計費 × 50%|全數加購合計最高/);
  assert.match(source, /紙張（選填）/);
  assert.match(source, /加工（選填）/);
  assert.doesNotMatch(source, /印量待確認|紙張待確認|加工待確認/);
  assert.match(source, /印量、紙張與加工皆可留空，正式合作時再確認/);
  assert.match(source, /確認合作紀錄後，選擇服務與數量，系統會自動配對方案/);
  assert.match(source, /<summary>查看單次與月方案比較<\/summary>/);
  assert.match(source, /<summary>查看合作與付款重點<\/summary>/);
  assert.match(source, /<summary>查看計價規則<\/summary>/);
  assert.match(source, /label: `項次 \$\{serviceIndex \+ 1\}・\$\{row\.label\}`/);
  assert.match(source, /label !== "項目" && label !== "原始檔"/);
  assert.match(source, /conciseLabel === "視覺／排程"[\s\S]*?\? "排程"/);
  assert.match(source, /`\$\{structure\}・\$\{detail\.pageCount\} 頁`/);
  assert.match(source, /specification\?\.support \? \{ \.\.\.specification, support: true \} : \{ support: false \}/);
  assert.doesNotMatch(source, /specification\.support && \(!specification\.paper \|\| !specification\.finish\)/);
  assert.match(source, /從需求開始逐項確認，讓複雜的設計估價變得更清楚。/);
  assert.doesNotMatch(source, /\d+[～~]\d+ 分鐘|單項約.*分鐘/);
  assert.match(css, /\.price-breakdown-copy \{[\s\S]*?white-space: pre-line;/);
});

test("live summary and downloaded PDF explain each price calculation", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /type PriceBreakdownItem = \{[\s\S]*?detail: string/);
  assert.match(source, /function getServicePriceBasis/);
  assert.match(source, /每篇首張，共 \$\{socialPricing\.postCount\} 張 ×/);
  assert.match(source, /追加產品 \$\{extraProductCount\} 項 × \$70/);
  assert.match(source, /該項設計費 × 50%/);
  assert.match(source, /該項設計費 × 15%/);
  assert.match(source, /className="live-breakdown" aria-label="即時費用明細" aria-live="polite"/);
  assert.match(source, /detail\.structure === "multipage"[\s\S]*?detail\.pageCount \? `\$\{detail\.pageCount\} 頁` : "頁數待填"/);
  assert.match(source, /quote\.breakdown\.map\(\(item\) => `\$\{item\.label\}:\$\{item\.detail\}/);
  assert.match(source, /右側為小計/);
  assert.match(source, /compactSummaryServiceNames\(item\.label\)/);
  assert.match(source, /<small>\{item\.detail\}<\/small>/);
  assert.match(source, /lines\.push\(`\$\{item\.label\}：\$\{item\.detail\}\\n\$\{formatPriceRange/);
  assert.match(source, /serviceRows\.push\(\{ label: "計算依據", value: getServicePriceBasis\(answers, service\) \}\)/);
  assert.match(source, /原始檔加購：\$\{getSourceFilePriceBasis\(service, quantity\)\} =/);
  assert.match(source, /印刷代辦服務費：設計費 × 15% =/);
  assert.match(css, /\.live-breakdown-list \{[\s\S]*?max-height: 178px/);
  assert.match(css, /\.summary-list,[\s\S]*?\.live-breakdown,[\s\S]*?\.summary-help/);
});

test("inquiry capture uses one required contact method and a three-day reply window", async () => {
  const [source, api, record, dashboard] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/inquiries/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/[id]/inquiry-record.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/inquiry-dashboard.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(source, /通常於 3 個工作日內回覆/);
  assert.match(source, /需求已送出，將會盡快與您聯絡/);
  assert.match(source, /送出後會保留本次試算內容，後續將會與您聯繫/);
  assert.match(source, /帶著需求與我聯繫/);
  assert.match(source, /function copyLineInquirySummary\(\)/);
  assert.match(source, /const lineInquirySummaryLines = useMemo/);
  assert.match(source, /您好，我想詢問正式報價與檔期。/);
  assert.match(source, /合作方式：\$\{isMonthly \? "月方案" : "單次設計"\}/);
  assert.match(source, /需求：\$\{serviceSummary\}/);
  assert.match(source, /交期：約 \$\{schedules\.join\("／"\)\}/);
  assert.match(source, /初估：\$\{formatPriceRange\(quote\.low, quote\.high\)\}/);
  assert.match(source, /navigator\.clipboard\.writeText\(lineInquirySummaryLines\.join\("\\n"\)\)/);
  assert.match(source, /onClick=\{\(\) => \{ void copyLineInquirySummary\(\); \}\}/);
  assert.match(source, /需求摘要已複製；進入 LINE 聊天室後請貼上/);
  assert.match(source, /點擊聯繫按鈕會先複製需求摘要；進入 LINE 聊天室後請貼上/);
  assert.doesNotMatch(source, /通常於 1 個工作日內回覆|我們會盡快與你聯絡|name="email"|Email \*/);
  assert.doesNotMatch(source, /儲存這份需求，交給我們接續確認|帶著需求前往 LINE/);
  assert.match(source, /<span>您的聯絡方式 \*<\/span><input name="contact"[\s\S]*?required/);
  assert.match(source, /品牌／公司（選填）[\s\S]*?placeholder="可留空"/);
  assert.match(api, /if \(!clientName \|\| !contact \|\| !projectType \|\| services\.length === 0\)/);
  assert.match(api, /請填寫姓名與聯絡方式，並完成需求試算/);
  assert.match(record, /const contactValue = inquiry\.contact \|\| inquiry\.email \|\| "未填寫"/);
  assert.match(record, /<span>您的聯絡方式<\/span><button className=\{`record-contact-copy[\s\S]*?<strong>\{contactValue\}<\/strong>/);
  assert.doesNotMatch(record, /其他聯絡方式|寄送 Email/);
  assert.match(dashboard, /contact: row\.contact \|\| row\.email \|\| "未填寫"/);
  assert.match(dashboard, /\["編號", "收到時間", "客戶", "品牌／公司", "聯絡方式"/);
});

test("inquiry dashboard uses task-focused groups and plain-language controls", async () => {
  const [dashboard, record, css] = await Promise.all([
    readFile(new URL("../app/admin/inquiries/inquiry-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/[id]/inquiry-record.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/inquiries.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /type StatusView = "todo" \| "active" \| "done" \| "all"/);
  assert.match(dashboard, /\{ key: "active", label: "處理中" \}/);
  assert.match(dashboard, /\{ key: "done", label: "已完成" \}/);
  assert.match(dashboard, /activeFilter === "active" && \["contacted", "quoted"\]\.includes/);
  assert.match(dashboard, /<span>收到時間<\/span><select value=\{dateFilter\}/);
  assert.match(dashboard, /<h1>客戶需求<\/h1>/);
  assert.match(dashboard, /<h2>全部需求<\/h2>/);
  assert.match(dashboard, /<th>網站初估<\/th><th>收到時間<\/th>/);
  assert.match(dashboard, />查看需求<\/button>/);
  assert.match(dashboard, />查看完整內容<\/a>/);
  assert.match(dashboard, />下載資料<\/button>/);
  assert.match(dashboard, />更新狀態<\/button>/);
  assert.doesNotMatch(dashboard, /進行中的洽談|優先層級|快速查看|開啟完整資料|匯出 CSV/);
  assert.match(record, /<span>優先順序<\/span>/);
  assert.match(record, />返回全部需求<\/a>/);
  assert.match(css, /\.response-table \{[^}]*font-size: \.875rem/);
  assert.match(css, /\.quick-detail-summary li \{[^}]*font-size: \.875rem/);
});

test("inquiry backend presents a compact working summary while preserving raw answers", async () => {
  const [compactSummary, dashboard, record] = await Promise.all([
    readFile(new URL("../app/admin/inquiries/compact-summary.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/inquiry-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/[id]/inquiry-record.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(compactSummary, /方案規則：/);
  assert.match(compactSummary, /合作重點：/);
  assert.match(compactSummary, /planParts\.join\("｜"\)/);
  assert.match(compactSummary, /replaceAll\("視覺／排程：", "排程："\)/);
  assert.match(dashboard, /compactInquirySummary\(safeStringArray\(row\.summaryJson\)\)/);
  assert.match(record, /compactInquirySummary\(parseStringArray\(inquiry\.summaryJson\)\)/);
  assert.match(record, /查看完整原始問卷資料/);
});

test("inquiry contact details support one-click copy with visible feedback", async () => {
  const [dashboard, record, css] = await Promise.all([
    readFile(new URL("../app/admin/inquiries/inquiry-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/[id]/inquiry-record.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/inquiries/inquiries.css", import.meta.url), "utf8"),
  ]);

  assert.match(dashboard, /className=\{`quick-contact-copy/);
  assert.match(dashboard, /navigator\.clipboard\.writeText\(inquiry\.contact\)/);
  assert.match(record, /className=\{`record-contact-copy/);
  assert.match(record, /navigator\.clipboard\.writeText\(contactValue\)/);
  assert.match(dashboard, /已複製/);
  assert.match(record, /已複製/);
  assert.match(css, /\.quick-contact-copy\.is-copied small/);
  assert.match(css, /\.record-contact-copy\.is-copied small/);
});

test("live summary abbreviates services and keeps every item inside its panel", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const summaryServiceNames: Record<string, string>/);
  assert.match(source, /banner: "Banner"/);
  assert.match(source, /reel: "Reel 封面"/);
  assert.match(source, /resize: "Resize"/);
  assert.match(source, /card: "名片／卡"/);
  assert.match(source, /slides: "簡報模板"/);
  assert.match(source, /className=\{selectedServices\.length > 0 \? "summary-services-row"/);
  assert.match(source, /className=\{selectedServices\.length > 0 \? "summary-service-items"/);
  assert.match(source, /className="live-breakdown-primary"/);
  assert.match(css, /\.summary-service-items \{[\s\S]*?white-space: normal !important;[\s\S]*?scrollbar-width: thin;/);
  assert.match(css, /\.summary-service-items span \{[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(css, /\.live-breakdown-primary \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.live-breakdown-row > small \{[\s\S]*?overflow-wrap: anywhere;/);
});

test("live estimate appears after service selection and multi-service specifications can switch directly", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const hasVisibleEstimate = answers\.projectType === "monthly"[\s\S]*?: selectedServices\.length > 0/);
  assert.match(source, /\{step !== "result" && hasVisibleEstimate && quote\.low > 0 && \(/);
  assert.match(source, /\{hasVisibleEstimate && quote\.low > 0 \? \(/);
  assert.match(source, /尚未完成的項目暫以 1 單位估算/);
  assert.match(source, /需求已整理完成/);
  assert.match(css, /\.estimate-complete \.chat-body > \.message-row \{[\s\S]*?display: none;/);
  assert.match(css, /\.estimate-complete \.result-history-summary \{[\s\S]*?display: flex;/);
  assert.ok(css.indexOf(".estimate-complete .chat-body > .message-row") < css.indexOf("@media (max-width: 760px)"));
  assert.ok(css.indexOf(".estimate-complete .result-history-summary") < css.indexOf("@media (max-width: 760px)"));
  assert.match(source, /選擇服務後顯示/);
  assert.match(source, /formatLiveSummaryServiceQuantity\(item, quantity, answers\)/);
  assert.match(source, /formatMonthlyServiceQuantity\(service, quantity, true, answers\)/);
  assert.match(source, /function switchSpecificationService\(serviceId: string\)/);
  assert.match(source, /targetStep = "ecommerceDetails"[\s\S]*?targetStep = "printDetails"[\s\S]*?targetStep = "serviceDetails"/);
  assert.match(source, /function renderSpecificationServiceSwitcher\(activeServiceId\?: string\)/);
  assert.match(source, /const getSpecificationPositionLabel = \(serviceId: string\)/);
  assert.match(source, /第 \$\{index \+ 1\} 項／共 \$\{specificationServices\.length\} 項/);
  assert.equal(source.match(/getSpecificationPositionLabel\(active(?:EcommerceService|DetailedService|ServiceDetailService)\.id\)/g)?.length, 3);
  assert.match(source, /aria-label="選擇要調整的服務項目"/);
  assert.match(source, /renderSpecificationServiceSwitcher\(activeEcommerceService\.id\)/);
  assert.match(source, /renderSpecificationServiceSwitcher\(activeDetailedService\.id\)/);
  assert.match(source, /renderSpecificationServiceSwitcher\(activeServiceDetailService\.id\)/);
  assert.match(source, /\{renderSpecificationServiceSwitcher\(\)\}/);
  assert.match(css, /\.specification-switcher-list \{[\s\S]*?overflow-x: auto;/);
  assert.match(css, /\.specification-switcher-list button\.is-active \{/);
});

test("calculator motion communicates navigation direction and quote updates", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const \[transitionDirection, setTransitionDirection\]/);
  assert.match(source, /function runStepTransition\(direction: "forward" \| "back", update: \(\) => void\)/);
  assert.match(source, /runStepTransition\("forward"/);
  assert.match(source, /runStepTransition\("back"/);
  assert.match(source, /const \[isStepExiting, setIsStepExiting\]/);
  assert.match(source, /const stepMotionKey =/);
  assert.match(source, /step-transition is-\$\{transitionDirection\}/);
  assert.match(css, /@keyframes stage-step-forward/);
  assert.match(css, /@keyframes stage-step-back/);
  assert.match(css, /@keyframes category-content-drop/);
  assert.match(css, /--motion-standard: 480ms/);
  assert.match(css, /\.step-transition\.is-forward \{[\s\S]*?transform-origin: top center;[\s\S]*?animation: stage-step-forward 0\.32s var\(--motion-ease\)/);
  const forwardKeyframes = css.match(/@keyframes stage-step-forward \{([\s\S]*?)\n\}/)?.[1] ?? "";
  assert.match(forwardKeyframes, /translate3d\(0, -8px, 0\)[\s\S]*?translate3d\(0, 2px, 0\)[\s\S]*?translate3d\(0, 0, 0\)/);
  assert.doesNotMatch(forwardKeyframes, /opacity|filter|scale/);
  assert.match(css, /\.step-transition\.is-forward\.is-leaving \{[\s\S]*?opacity: 1;[\s\S]*?filter: none;[\s\S]*?translate3d\(0, -8px, 0\) scaleY\(0\.04\)[\s\S]*?transition: transform 0\.1s/);
  assert.match(css, /\.response-area\.step-transition \{[\s\S]*?animation-delay: 0s/);
  assert.match(css, /\.step-transition\.is-leaving \{[\s\S]*?opacity 0\.26s ease,[\s\S]*?transform 0\.26s/);
  assert.match(css, /\.journey-nav-button\.is-current \{[\s\S]*?animation: journey-step-pop/);
  assert.match(css, /\.choice\.selected \{[\s\S]*?animation: selection-pop/);
  assert.match(source, /const \[isConfirming, setIsConfirming\] = useState\(false\)/);
  assert.match(source, /window\.setTimeout\(onClick, 40\)/);
  assert.match(source, /const exitDuration = direction === "forward" \? 100 : 260/);
  assert.match(source, /isConfirming \? "✓" : "→"/);
  assert.match(css, /\.chat-panel button:not\(:disabled\):active,[\s\S]*?scale\(0\.985\)/);
  assert.match(source, /const \[showQuoteUpdated, setShowQuoteUpdated\]/);
  assert.match(source, /quote-update-badge/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /key=\{`\$\{item\.label\}-\$\{item\.detail\}`\}/);
  assert.match(css, /\.live-breakdown-row \{[\s\S]*?animation: price-row-update/);
  assert.match(source, /--price-row-index/);
  assert.match(css, /animation-delay: calc\(var\(--price-row-index, 0\) \* 24ms\)/);
  assert.match(source, /const isVisible = targetRect\.top >= chatRect\.top \+ inset && targetRect\.bottom <= chatRect\.bottom - inset/);
  assert.match(css, /\.live-total\.is-updated::before/);
  assert.match(css, /@keyframes quote-highlight/);
  assert.match(css, /@keyframes price-roll-in/);
  assert.match(css, /@keyframes receipt-unfold/);
  assert.match(css, /@keyframes summary-content-reveal/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("single-service flow reveals quantity early and collapses directly to the next specification", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  const collapseRule = css.match(/\.single-specification-card\.is-collapsing \{([\s\S]*?)\n\}/)?.[1] ?? "";
  const arriveKeyframes = css.match(/@keyframes monthly-specification-arrive \{([\s\S]*?)\n\}/)?.[1] ?? "";

  assert.match(source, /getSingleInlineQuantityConfig/);
  assert.match(source, /singleSelectionReady/);
  assert.match(source, /disabled=\{!singleSelectionReady\}/);
  assert.match(source, /single-specification-card\$\{isSingleSpecificationAdvancing \? " is-collapsing" : ""\}/);
  assert.match(source, /window\.setTimeout\(applyDestination, 170\)/);
  assert.match(source, /完成這項，下一項 →/);
  assert.match(source, /確認規格與加購 →/);
  assert.match(collapseRule, /translateY\(-7px\) scaleY\(0\.025\)/);
  assert.doesNotMatch(collapseRule, /opacity|filter/);
  assert.doesNotMatch(arriveKeyframes, /opacity|filter/);
});

test("calculator uses compact conversation history with switchable specification progress", async () => {
  const [source, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const completedConversationAnswers = messages\.filter/);
  assert.match(source, /<details className="conversation-history-collapse">/);
  assert.match(source, /已完成 \{completedConversationAnswers\.length\} 個步驟/);
  assert.match(source, /className="conversation-history-answers"/);
  assert.match(css, /\.conversation-history-collapse summary \{[\s\S]*?grid-template-columns: 20px auto minmax\(0, 1fr\) auto;/);
  assert.match(css, /\.conversation-history-answers \{[\s\S]*?max-height: 150px;/);
  assert.match(source, /const completedCount = specificationServices\.filter\(isSpecificationServiceComplete\)\.length/);
  assert.match(source, /\{completedCount\}／\{specificationServices\.length\} 項已完成/);
  assert.match(source, /\{isComplete \? "✓ 已完成" : "待填寫"\}/);
  assert.match(css, /\.specification-switcher-list button\.is-complete:not\(\.is-active\)/);
  assert.match(source, /const centeredLeft = currentStep\.offsetLeft - \(list\.clientWidth - currentStep\.offsetWidth\) \/ 2/);
  assert.match(source, /list\.scrollTo\(\{[\s\S]*?left: Math\.max\(0, centeredLeft\)/);
  assert.ok(source.indexOf('className={`live-total') < source.indexOf('<dl className="summary-list">'));
});
