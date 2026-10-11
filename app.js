```javascript
"use strict";

// Supabase configuration
const SUPABASE_URL = "https://egyxjmhggzrobmtcnpfc.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneXhqbWhnZ3pyb2JtdGNucGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTM4ODgsImV4cCI6MjEwNzI4OTg4OH0.Ikl3vd35Mx3PYx794gNvO1nhaCtx5phT-RTfVgddTiU";

// Page elements
const locationBtn = document.getElementById("locationBtn");
const statusEl = document.getElementById("status");
const detailsEl = document.getElementById("details");

function showStatus(message, type = "info") {
  if (!statusEl) {
    console.error("Element #status was not found in index.html");
    return;
  }

  statusEl.textContent = message;
  statusEl.className = "status " + type;
}

function isSupabaseConfigured() {
  return (
    SUPABASE_URL === "https://egyxjmhggzrobmtcnpfc.supabase.co" &&
    SUPABASE_ANON_KEY.trim().length > 0
  );
}

function getCurrentPosition() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject({ code: "UNSUPPORTED" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  });
}

function readableLocationError(error) {
  if (error.code === "UNSUPPORTED") {
    return "المتصفح لا يدعم تحديد الموقع.";
  }

  if (error.code === 1) {
    return "لم تسمح بالوصول إلى الموقع. فعّل إذن الموقع من إعدادات المتصفح.";
  }

  if (error.code === 2) {
    return "تعذّر تحديد الموقع. تأكد من تشغيل خدمات الموقع وحاول مرة أخرى.";
  }

  if (error.code === 3) {
    return "استغرق تحديد الموقع وقتًا طويلًا. حاول مرة أخرى.";
  }

  return "حدث خطأ أثناء تحديد الموقع.";
}

async function saveLocation(coords) {
  const response = await fetch(
    SUPABASE_URL + "/rest/v1/locations",
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        device: navigator.userAgent
      })
    }
  );

  if (!response.ok) {
    const detail = await response.text();

    console.error(
      "Supabase error:",
      response.status,
      detail
    );

    throw new Error(
      "فشل حفظ الموقع (HTTP " + response.status + "). راجع Console وإعدادات Supabase."
    );
  }
}

if (!locationBtn) {
  console.error("Element #locationBtn was not found in index.html");
} else {
  locationBtn.addEventListener("click", async function () {
    if (detailsEl) {
      detailsEl.classList.add("hidden");
    }

    if (!isSupabaseConfigured()) {
      showStatus("راجع إعدادات Supabase داخل ملف app.js.", "error");
      return;
    }

    if (!window.isSecureContext) {
      showStatus("يجب فتح الموقع عبر HTTPS.", "error");
      return;
    }

    locationBtn.disabled = true;
    locationBtn.textContent = "جارٍ تحديد موقعك...";

    showStatus("اسمح للمتصفح بالوصول إلى موقعك.", "info");

    try {
      const position = await getCurrentPosition();
      const coords = position.coords;

      const latitudeEl = document.getElementById("latitude");
      const longitudeEl = document.getElementById("longitude");
      const accuracyEl = document.getElementById("accuracy");
      const mapLinkEl = document.getElementById("mapLink");

      if (latitudeEl) {
        latitudeEl.textContent = coords.latitude.toFixed(6);
      }

      if (longitudeEl) {
        longitudeEl.textContent = coords.longitude.toFixed(6);
      }

      if (accuracyEl) {
        accuracyEl.textContent = Number.isFinite(coords.accuracy)
          ? "حوالي " + Math.round(coords.accuracy) + " متر"
          : "غير متاحة";
      }

      if (mapLinkEl) {
        mapLinkEl.href =
          "https://www.google.com/maps?q=" +
          coords.latitude +
          "," +
          coords.longitude;
      }

      showStatus("تم تحديد الموقع. جارٍ تسجيله...", "info");

      await saveLocation(coords);

      if (detailsEl) {
        detailsEl.classList.remove("hidden");
      }

      showStatus("تم تسجيل موقعك بنجاح.", "success");

    } catch (error) {
      console.error(error);

      const message =
        error && typeof error.code === "number"
          ? readableLocationError(error)
          : error.message || "حدث خطأ غير متوقع.";

      showStatus("فشل التسجيل: " + message, "error");

    } finally {
      locationBtn.disabled = false;
      locationBtn.textContent = "تسجيل موقعي الآن";
    }
  });
}
```
