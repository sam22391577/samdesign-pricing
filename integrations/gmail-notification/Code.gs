const NOTIFICATION_RECIPIENT_PROPERTY = "NOTIFICATION_RECIPIENT";
const ALLOWED_ADMIN_URL = /^https:\/\/samdesign-questionnaire\.samdesign-studio\.workers\.dev\/admin\/inquiries\//;

function doPost(event) {
  try {
    const notificationRecipient = PropertiesService.getScriptProperties().getProperty(NOTIFICATION_RECIPIENT_PROPERTY);
    if (!notificationRecipient) {
      return jsonResponse({ ok: false, error: "Notification recipient is not configured." });
    }

    const payload = JSON.parse(event && event.postData ? event.postData.contents : "{}");
    if (!payload.id || !payload.clientName || !ALLOWED_ADMIN_URL.test(String(payload.adminUrl || ""))) {
      return jsonResponse({ ok: false, error: "Invalid notification payload." });
    }

    const services = Array.isArray(payload.services) ? payload.services.filter(Boolean) : [];
    const submittedAt = Utilities.formatDate(new Date(payload.submittedAt), "Asia/Taipei", "yyyy/MM/dd HH:mm");
    const estimate = formatCurrency(payload.estimateLow) + " ～ " + formatCurrency(payload.estimateHigh);
    const subject = "【新報價需求】" + payload.clientName + (services.length ? "｜" + services.join("、") : "");
    const rows = [
      ["需求編號", payload.id],
      ["客戶", payload.clientName],
      ["品牌／公司", payload.company || "未填寫"],
      ["合作方式", payload.projectType || "未填寫"],
      ["服務項目", services.join("、") || "未填寫"],
      ["網站初估", estimate],
      ["送出時間", submittedAt],
    ];
    const plainText = [
      "Sam Design Studio 有新的報價需求。",
      "",
      ...rows.map(function(row) { return row[0] + "：" + row[1]; }),
      "",
      "聯絡方式與完整需求請至私人後台查看：",
      payload.adminUrl,
    ].join("\n");
    const htmlRows = rows.map(function(row) {
      return '<tr><th style="padding:8px 12px;text-align:left;color:#75675c;background:#f6f1eb;border-bottom:1px solid #e7ded5;">' + escapeHtml(row[0]) + '</th><td style="padding:8px 12px;color:#3f3934;border-bottom:1px solid #e7ded5;">' + escapeHtml(row[1]) + '</td></tr>';
    }).join("");
    const htmlBody = '<div style="font-family:Arial,Noto Sans TC,sans-serif;color:#3f3934;line-height:1.7;">' +
      '<h2 style="margin:0 0 16px;color:#514235;">Sam Design Studio 有新的報價需求</h2>' +
      '<table style="width:100%;max-width:640px;border-collapse:collapse;border:1px solid #e7ded5;">' + htmlRows + '</table>' +
      '<p style="margin:18px 0 10px;color:#6f6258;">聯絡方式與完整需求請至私人後台查看。</p>' +
      '<p><a href="' + escapeHtml(payload.adminUrl) + '" style="display:inline-block;padding:10px 16px;border-radius:8px;color:#ffffff;background:#514235;text-decoration:none;">開啟客戶需求</a></p>' +
      '</div>';

    MailApp.sendEmail({
      to: notificationRecipient,
      subject: subject,
      body: plainText,
      htmlBody: htmlBody,
      name: "Sam Design Studio 需求通知",
    });
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return "NT$" + Math.max(0, Math.round(amount)).toLocaleString("en-US");
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
