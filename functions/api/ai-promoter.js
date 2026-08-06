function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "authorization, content-type, x-webhook-token, x-uap-event",
      "access-control-allow-methods": "GET, POST, OPTIONS"
    }
  });
}

function getToken(request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (
    authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-webhook-token") || ""
  ).trim();
}

function safeText(value, maxLength = 100000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers":
          "authorization, content-type, x-webhook-token, x-uap-event",
        "access-control-allow-methods":
          "GET, POST, OPTIONS"
      }
    });
  }

  if (request.method === "GET") {
    return json({
      ok: true,
      service:
        "MerrickasCoin AI Promoter Connector",
      status: "online"
    });
  }

  if (request.method !== "POST") {
    return json(
      {
        ok: false,
        error: "Method not allowed."
      },
      405
    );
  }

  try {
    const expectedToken = String(
      env.AI_PROMOTER_WEBHOOK_TOKEN || ""
    ).trim();

    if (!expectedToken) {
      return json(
        {
          ok: false,
          error:
            "AI_PROMOTER_WEBHOOK_TOKEN is not configured."
        },
        500
      );
    }

    const receivedToken = getToken(request);

    if (
      !receivedToken ||
      receivedToken !== expectedToken
    ) {
      return json(
        {
          ok: false,
          error: "Unauthorized webhook request."
        },
        401
      );
    }

    let payload = {};

    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const event = safeText(
      payload.event ||
        payload.type ||
        payload.action ||
        request.headers.get("x-uap-event"),
      100
    ).toLowerCase();

    /*
     * Accept every normal connection-test format.
     */
    if (
      event === "connection_test" ||
      event === "test_connection" ||
      event === "connection-test" ||
      event === "ping"
    ) {
      return json({
        ok: true,
        connected: true,
        accepted: true,
        event: "connection_test",
        service:
          "MerrickasCoin AI Promoter Connector",
        message:
          "Secure webhook connection verified."
      });
    }

    const title = safeText(
      payload.title ||
        payload.name ||
        payload.subject,
      500
    );

    const content = safeText(
      payload.content ||
        payload.body ||
        payload.article ||
        payload.description,
      200000
    );

    if (!title && !content) {
      return json(
        {
          ok: false,
          error:
            "The request must include a title or content.",
          receivedEvent: event || null
        },
        400
      );
    }

    /*
     * The connector currently receives approved content
     * safely. It does not automatically alter index.html.
     * Publishing logic can be added separately after testing.
     */
    return json({
      ok: true,
      accepted: true,
      connected: true,
      receivedAt: new Date().toISOString(),
      title: title || "Untitled draft",
      message:
        "Approved AI Promoter content was securely received."
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected connector error."
      },
      500
    );
  }
}
