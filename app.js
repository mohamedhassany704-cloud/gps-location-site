/*
  إعداد مرة واحدة:
  1) ضع رابط مشروع Supabase في SUPABASE_URL.
  2) ضع مفتاح anon / publishable في SUPABASE_ANON_KEY.
  لا تضع service_role key في هذا الملف مطلقًا.
*/
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY";

const locationBtn = document.getElementById("locationBtn");
const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");

function showStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

function isSupabaseConfigured() {
  return SUPABASE_URL.startsWith("https://egyxjmhggzrobmtcnpfc.supabase.co") &&
    !SUPABASE_URL.includes("YOUR_PROJECT_REF") &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes("sb_publishable_DEQ2OgyCEeY5VpB4BW_pnA_RK278chu");
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject({ code: "UNSUPPORTED" });
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });
  });
}

function readableLocationError(error) {
  if (error.code === "UNSUPPORTED") return "المتصفح لا يدعم تحديد الموقع.";
  if (error.code === 1) return "لم تسمح بالوصول إلى الموقع. اسمح بإذن الموقع من إعدادات المتصفح ثم حاول مرة أخرى.";
  if (error.code === 2) return "تعذّر تحديد الموقع. تأكد من تشغيل خدمات الموقع GPS وحاول في مكان مفتوح.";
  if (error.code === 3) return "استغرق تحديد الموقع وقتًا طويلًا. حاول مرة أخرى.";
  return "حدث خطأ أثناء تحديد الموقع. حاول مرة أخرى.";
}

async function saveLocation(coords) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      device: navigator.userAgent
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase insert error:", response.status, detail);
    throw new Error("تعذّر حفظ الموقع في قاعدة البيانات. راجع إعدادات Supabase وRLS.");
  }
}

locationBtn.addEventListener("click", async () => {
  detailsEl.classList.add("hidden");

  if (!isSupabaseConfigured()) {
    showStatus("قبل الاستخدام، أدخل رابط مشروع Supabase ومفتاح anon/publishable داخل ملف app.js.", "error");
    return;
  }

  if (!window.isSecureContext) {
    showStatus("يجب فتح الموقع عبر HTTPS حتى يعمل تحديد الموقع. GitHub Pages يوفر HTTPS.", "error");
    return;
  }

  locationBtn.disabled = true;
  locationBtn.textContent = "جارٍ تحديد موقعك...";
  showStatus("اسمح للمتصفح بالوصول إلى موقعك عند ظهور الطلب.", "info");

  try {
    const position = await getCurrentPosition();
    const coords = position.coords;

    document.getElementById("latitude").textContent = coords.latitude.toFixed(6);
    document.getElementById("longitude").textContent = coords.longitude.toFixed(6);
    document.getElementById("accuracy").textContent =
      Number.isFinite(coords.accuracy) ? `حوالي ${Math.round(coords.accuracy)} متر` : "غير متاحة";
    document.getElementById("mapLink").href =
      `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;

    showStatus("تم تحديد الموقع. جارٍ تسجيله...", "info");
    await saveLocation(coords);

    detailsEl.classList.remove("hidden");
    showStatus("✅ تم تسجيل موقعك بنجاح.", "success");
  } catch (error) {
    console.error(error);
    const message = error && typeof error.code === "number"
      ? readableLocationError(error)
      : (error.message || "حدث خطأ غير متوقع أثناء التسجيل.");
    showStatus(`❌ ${message}`, "error");
  } finally {
    locationBtn.disabled = false;
    locationBtn.textContent = "تسجيل موقعي الآن";
  }
});
