// Этот файл нужно положить в репозиторий по пути: netlify/functions/notify.js
// Токен бота хранится в переменной окружения TELEGRAM_BOT_TOKEN (Netlify → Site settings → Environment variables),
// поэтому он никогда не попадает в открытый HTML-код сайта.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { statusCode: 500, body: "TELEGRAM_BOT_TOKEN не настроен" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: "Bad JSON" };
  }

  const { chatIds, message } = payload;
  if (!Array.isArray(chatIds) || !chatIds.length || !message) {
    return { statusCode: 400, body: "chatIds и message обязательны" };
  }

  const results = await Promise.allSettled(
    chatIds.map((chatId) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      })
    )
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ sent: results.filter(r => r.status === "fulfilled").length, total: chatIds.length }),
  };
};
