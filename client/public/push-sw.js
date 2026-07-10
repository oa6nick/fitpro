// Service worker только для push-уведомлений: навигацию SPA не перехватывает,
// кэш бандла не трогает.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "FitPro", body: event.data ? event.data.text() : "Новое уведомление" };
  }

  const title = data.title || "FitPro";
  const options = {
    body: data.body || "Новое уведомление",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.tag || "fitpro",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      // Уже открытая вкладка приложения — переиспользуем.
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
