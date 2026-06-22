var EMBED_BASE = "https://www.gandhijay.com/yt-embed.html?id=";
var QUOTE_API_URLS = [
  "https://type.fit/api/quotes",
  "https://zenquotes.io/api/quotes",
];

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

      chrome.storage.local.get(QUOTE_CACHE_KEY, function (result) {
        var cache = { quotes: [], fetchedAt: 0 };
        if (result[QUOTE_CACHE_KEY]) {
          var raw = result[QUOTE_CACHE_KEY];
          if (raw.quotes) cache.quotes = raw.quotes;
          if (raw.fetchedAt) cache.fetchedAt = raw.fetchedAt;
        }
        var fetchedThisPage = false;

        function sameDay(a, b) {
          var da = new Date(a);
          var db = new Date(b);
          return (
            da.getFullYear() === db.getFullYear() &&
            da.getMonth() === db.getMonth() &&
            da.getDate() === db.getDate()
          );
        }

        function pickRandom(arr) {
          return arr[Math.floor(Math.random() * arr.length)];
        }

        function normalizeQuotes(list) {
          var out = [];
          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var text = item.text || item.q;
            var author = item.author || item.a || "";
            if (text) out.push({ text: text, author: author });
          }
          return out;
        }

        function fetchFresh(callback) {
          if (fetchedThisPage) {
            if (callback) callback();
            return;
          }
          fetchedThisPage = true;

          cache.fetchedAt = Date.now();
          chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });

          var promises = QUOTE_API_URLS.map(function (url) {
            return fetch(url)
              .then(function (res) {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.json();
              })
              .catch(function () {
                return [];
              });
          });

          Promise.allSettled(promises).then(function (results) {
            var allQuotes = [];
            for (var i = 0; i < results.length; i++) {
              if (results[i].status === "fulfilled" && results[i].value.length) {
                allQuotes = allQuotes.concat(
                  normalizeQuotes(results[i].value)
                );
              }
            }

            if (allQuotes.length > 0) {
              for (var i = allQuotes.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = allQuotes[i];
                allQuotes[i] = allQuotes[j];
                allQuotes[j] = tmp;
              }
              cache.quotes = allQuotes;
            }
            cache.fetchedAt = Date.now();
            chrome.storage.local.set({ [QUOTE_CACHE_KEY]: cache });
            if (callback) callback();
          });
        }

        function showQuote() {
          if (cache.quotes.length > 0) {
            var q = pickRandom(cache.quotes);
            var text = q.text || "Stay focused.";
            var author = q.author ? " — " + q.author : "";
            document.getElementById("quoteText").textContent = text + author;
          } else {
            showLocalQuote();
          }
        }

        if (!sameDay(cache.fetchedAt, Date.now())) {
          fetchFresh(showQuote);
        } else if (cache.quotes.length > 0) {
          showQuote();
        } else {
          showLocalQuote();
        }
      });
    } else {
      showLocalQuote();
    }
  });
})();
