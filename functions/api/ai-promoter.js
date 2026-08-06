function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "authorization, content-type, x-webhook-token",
      "access-control-allow-methods": "GET, POST, OPTIONS"
    }
  });
}

function getToken(request) {
  const authorization =
    request.headers.get("authorization") || "";

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return (
    request.headers.get("x-webhook-token") || ""
  ).trim();
}

export async function onRequestOptions() {
  return json({
    ok: true
  });
}

export async function onRequestGet() {
  return json({
    ok: true,
    connected: true,
    service: "MerrickasCoin AI Promoter Connector",
    message: "Secure AI Promoter endpoint is online."
  });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.AI_PROMOTER_WEBHOOK_TOKEN) {
      return json(
        {
          ok: false,
          error:
            "AI_PROMOTER_WEBHOOK_TOKEN is not configured."
        },
        500
      );
    }

    const suppliedToken = getToken(request);

    if (
      !suppliedToken ||
      suppliedToken !== env.AI_PROMOTER_WEBHOOK_TOKEN
    ) {
      return json(
        {
          ok: false,
          error: "Unauthorized webhook request."
        },
        401
      );
    }

    let payload;

    try {
      payload = await request.json();
    } catch {
      return json(
        {
          ok: false,
          error: "Request body must be valid JSON."
        },
        400
      );
    }

    const title =
      typeof payload?.title === "string"
        ? payload.title.trim()
        : "";

    const content =
      typeof payload?.content === "string"
        ? payload.content.trim()
        : "";
    if (payload?.event === "connection_test") {
  return json({
    ok: true,
    connected: true,
    accepted: true,
    service: "MerrickasCoin AI Promoter Connector",
    message: "Secure webhook connection verified."
  });
}
      return json(
        {
          ok: false,
          error:
            "The request must include a title or content."
        },
        400
      );
    }

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
            : "Unknown connector error."
      },
      500
    );
  }
}
