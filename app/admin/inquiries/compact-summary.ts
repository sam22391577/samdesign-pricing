const hiddenSummaryPrefixes = [
  "【Sam Design Studio｜網站試算需求】",
  "類別：",
  "方案規則：",
  "優惠幅度：",
  "特殊計價：",
  "另行確認：",
  "合作重點：",
  "付款方式：",
  "單次委託參考：",
  "方案比較：",
  "未含費用：",
  "網站初估總額：",
  "設計與代辦初估（不含印刷／運送）：",
  "預算：",
];

const groupedLabels = new Map([
  ["方案", "方案"],
  ["合作紀錄", "合作"],
  ["月量", "組數"],
  ["交付", "交付"],
]);

const overviewLabels = new Map([
  ["複雜度", "複雜度"],
  ["素材", "素材"],
]);

function splitLabel(value: string) {
  const separatorIndex = value.indexOf("：");
  if (separatorIndex < 1) return null;
  return {
    label: value.slice(0, separatorIndex).trim(),
    value: value.slice(separatorIndex + 1).trim(),
  };
}

function shortenSummaryLine(value: string) {
  return value
    .replaceAll("視覺／排程：", "排程：")
    .replaceAll("視覺／完稿：", "排程：")
    .replaceAll("主視覺延伸加購：", "延伸：")
    .replaceAll("原始檔：不需要", "原始檔：無")
    .replaceAll("印刷：不需要代辦", "印刷：不代辦")
    .replaceAll("印刷：需要代辦；", "印刷：代辦；");
}

const detailLabelPattern = /^(.*?)(主視覺延伸加購|視覺／排程|視覺／完稿|延伸版本|原始檔|用途|規格|內容|印刷)：(.+)$/;

const detailLabelNames: Record<string, string> = {
  主視覺延伸加購: "延伸",
  "視覺／排程": "排程",
  "視覺／完稿": "排程",
  延伸版本: "延伸",
  原始檔: "原始檔",
  用途: "用途",
  規格: "規格",
  內容: "內容",
  印刷: "印刷",
};

export function compactInquirySummary(items: string[]) {
  const planParts: string[] = [];
  const overviewParts: string[] = [];
  const detailLines: string[] = [];
  const serviceDetails = new Map<string, string[]>();

  items.forEach((item) => {
    if (item.includes("\n")) return;
    const normalized = item.trim().replace(/\s*\n\s*/g, "｜");
    if (!normalized || normalized === "想進一步確認正式報價與可安排檔期，謝謝！") return;
    if (hiddenSummaryPrefixes.some((prefix) => normalized.startsWith(prefix))) return;
    const pair = splitLabel(normalized);
    if (pair && groupedLabels.has(pair.label)) {
      planParts.push(`${groupedLabels.get(pair.label)} ${pair.value}`);
      return;
    }
    if (pair && overviewLabels.has(pair.label)) {
      overviewParts.push(`${overviewLabels.get(pair.label)} ${pair.value}`);
      return;
    }

    const serviceDetail = normalized.match(detailLabelPattern);
    if (serviceDetail) {
      const [, serviceName, label, detail] = serviceDetail;
      const key = serviceName.trim();
      if (key) {
        const parts = serviceDetails.get(key) ?? [];
        const compactDetail = label === "原始檔" && detail === "不需要"
          ? "無"
          : label === "印刷"
            ? detail.replace("不需要代辦", "不代辦").replace("需要代辦；", "代辦；")
            : detail;
        parts.push(`${detailLabelNames[label]} ${compactDetail}`);
        serviceDetails.set(key, parts);
        return;
      }
    }

    detailLines.push(shortenSummaryLine(normalized));
  });

  const compact = [
    planParts.length > 0 ? planParts.join("｜") : undefined,
    overviewParts.length > 0 ? `整體：${overviewParts.join("｜")}` : undefined,
    ...detailLines,
    ...Array.from(serviceDetails, ([service, details]) => `${service}：${details.join("｜")}`),
  ].filter((item): item is string => Boolean(item));

  return compact.filter((item, index) => compact.indexOf(item) === index);
}
