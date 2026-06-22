var EMBED_BASE = "https://www.gandhijay.com/yt-embed.html?id=";
var QUOTE_API_URL = "https://type.fit/api/quotes";

(function () {
  var params = new URLSearchParams(location.search);
  var blockedUrl = params.get("url") || "Unknown";
  document.getElementById("blockedUrl").textContent = "Blocked: " + blockedUrl;

  chrome.storage.sync.get("extensionData", function (result) {
    var data = result.extensionData || {};

    var theme = data.theme || "terminal";
    document.documentElement.setAttribute("data-theme", theme);
    if (window.__reinitParticles) {
      window.__reinitParticles();
    }

    var videoIds =
      data.youtubeVideoIds?.length ? data.youtubeVideoIds : ["dQw4w9WgXcQ"];

    var videoId = videoIds[Math.floor(Math.random() * videoIds.length)];

    document.getElementById("videoWrapper").innerHTML =
      '<iframe src="' + EMBED_BASE + videoId +
      '" title="Blocked page video" allow="autoplay; encrypted-media" allowfullscreen></iframe>';

    var quotes = data.quotes?.length ? data.quotes : ["Stay focused."];

    function showLocalQuote() {
      var quote = quotes[Math.floor(Math.random() * quotes.length)];
      document.getElementById("quoteText").textContent = quote;
    }

    if (!data.disableApiQuotes) {
      var QUOTE_CACHE_KEY = "quoteCache";
      var CACHE_MAX = 50;
      var CACHE_REFILL_AT = 8;

      chrome.storage.local.get(QUOTE_CACHE_KEY, function (result) {
        var cache = result[QUOTE_CACHE_KEY] || { pool: [] };
        var fetchedThisPage = false;

        function fetchAndRefill(callback) {
          if (fetchedThisPage) {
            if (callback) callback();
            return;
          }
          fetchedThisPage = true;
          fetch(QUOTE_API_URL)
            .then(function (res) {
              if (!res.ok) throw new Error("HTTP " + res.status);
              return res.json();
            })
            .then(function (list) {
              if (list && list.length > 0) {
                for (var i = list.length - 1; i > 0; i--) {
                  var j = Math.floor(Math.random() * (i + 1));
                  var tmp = list[i];
                  list[i] = list[j];
                  list[j] = tmp;
                }
                cache.pool = list.slice(0, CACHE_MAX);
                chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });
              }
              if (callback) callback();
            })
            .catch(function () {
              if (callback) callback();
            });
        }

        function showFromPool() {
          if (cache.pool.length > 0) {
            var q = cache.pool.shift();
            var text = q.text || "Stay focused.";
            var author = q.author ? " — " + q.author : "";
            document.getElementById("quoteText").textContent = text + author;
            chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });
          } else {
            showLocalQuote();
          }
        }

        if (cache.pool.length < CACHE_REFILL_AT) {
          fetchAndRefill(showFromPool);
        } else {
          showFromPool();
        }
      });
    } else {
      showLocalQuote();
    }
  });
})();
