// End-to-end check of an MCP URL, the way an MCP client connects:
// 401 challenge -> resource metadata -> auth server metadata -> client
// registration (DCR) -> sign-in -> authorize -> consent -> token -> tools.
// Then a second user checks the member rules: live for everyone signed in,
// draft and writes for members, member changes for admins.
//
//   node scripts/smoke.mjs [mcp-url]
//
// SMOKE_EMAIL / SMOKE_PASSWORD: an admin of the project (locally the dev
// account dev@headcode.local). SMOKE_GUEST_EMAIL: a second account with a
// verified address. Accounts are created if sign-up is open. Defaults are for
// local development only.
import { createHash, randomBytes } from "node:crypto";

const mcpUrl = process.argv[2] ?? "http://localhost:3080/p/demo/mcp";
const email = process.env.SMOKE_EMAIL ?? "dev@headcode.local";
const guestEmail = process.env.SMOKE_GUEST_EMAIL ?? "guest@headcode.local";
const password = process.env.SMOKE_PASSWORD ?? "headcode-dev";
const redirectUri = "http://127.0.0.1:9999/callback";

const timings = {};
const step = async (name, fn) => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    timings[name] = Math.round(performance.now() - start);
  }
};
const check = (ok, message) => {
  if (!ok) throw new Error(message);
  console.log(`ok  ${message}`);
};
const b64url = (buffer) => buffer.toString("base64url");
const decode = (part) => JSON.parse(Buffer.from(part, "base64url").toString());

// 1. Without a token: 401 with RFC 9728 resource metadata.
const challenge = await step("challenge", () =>
  fetch(mcpUrl, { method: "POST", body: "{}" }),
);
// Without WWW-Authenticate, MCP clients fall back to the well-known URL
// (RFC 9728 path insertion), as this check does.
const wwwAuthenticate = challenge.headers.get("www-authenticate");
const { origin, pathname } = new URL(mcpUrl);
const metadataUrl =
  wwwAuthenticate?.match(/resource_metadata="([^"]+)"/)?.[1] ??
  `${origin}/.well-known/oauth-protected-resource${pathname}`;
check(
  challenge.status === 401,
  `401 (${wwwAuthenticate ? "with resource_metadata" : "WWW-Authenticate missing, well-known fallback"})`,
);

const resource = await step("resource metadata", () =>
  fetch(metadataUrl).then((r) => r.json()),
);
check(resource.resource === mcpUrl, `resource is ${mcpUrl}`);
const issuer = new URL(resource.authorization_servers[0]);
const server = await step("auth server metadata", () =>
  fetch(
    `${issuer.origin}/.well-known/oauth-authorization-server${issuer.pathname}`,
  ).then((r) => r.json()),
);
check(server.issuer === issuer.href, `issuer ${server.issuer}`);

// 2. Register a public client (DCR).
const client = await step("register", () =>
  fetch(server.registration_endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "Headcode smoke test",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  }).then((r) => r.json()),
);
check(client.client_id, "client registered");

// 3. Sign in (or sign up), authorize with PKCE, accept consent, get a token.
const authBase = issuer.href.replace(/\/$/, "");
const post = (path, body) =>
  fetch(`${authBase}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: issuer.origin },
    body: JSON.stringify(body),
  });

async function signIn(email, label) {
  let session = await step(`${label} sign-in`, () =>
    post("/sign-in/email", { email, password }),
  );
  if (!session.ok)
    session = await step(`${label} sign-up`, () =>
      post("/sign-up/email", { email, password, name: email }),
    );
  const cookie = session.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  check(session.ok && cookie, `signed in as ${email}`);

  const verifier = b64url(randomBytes(32));
  const authorize = new URL(server.authorization_endpoint);
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: client.client_id,
    redirect_uri: redirectUri,
    scope: resource.scopes_supported.join(" "),
    state: "smoke",
    code_challenge: b64url(createHash("sha256").update(verifier).digest()),
    code_challenge_method: "S256",
    resource: mcpUrl,
  });
  let location = await step(`${label} authorize`, () =>
    fetch(authorize, { headers: { cookie }, redirect: "manual" }).then(
      // Better Auth answers fetch requests with { redirect, url } instead of 302.
      async (r) => r.headers.get("location") ?? (await r.json()).url,
    ),
  );
  if (location && new URL(location, issuer).pathname === "/consent") {
    const consent = await step(`${label} consent`, () =>
      fetch(`${authBase}/oauth2/consent`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: issuer.origin,
          cookie,
        },
        body: JSON.stringify({
          accept: true,
          oauth_query: new URL(location, issuer).search.slice(1),
        }),
      }).then((r) => r.json()),
    );
    location = consent.url;
  }
  const code = location && new URL(location).searchParams.get("code");
  if (!code) console.log("redirect:", location);
  check(code, "authorization code");

  const token = await step(`${label} token`, () =>
    fetch(server.token_endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: client.client_id,
        code_verifier: verifier,
        resource: mcpUrl,
      }),
    }).then((r) => r.json()),
  );
  const [header, payload] = (token.access_token ?? "").split(".");
  check(
    header &&
      decode(header).typ === "at+jwt" &&
      [decode(payload).aud].flat().includes(mcpUrl),
    `JWT access token (${decode(header).alg}) for ${decode(payload).aud}`,
  );
  return token.access_token;
}

// 4. MCP tools with a token.
let id = 0;
const rpc = (token, url, method, params) =>
  fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
// Resolves to the tool result, or to { refused: message } when the tool says no.
const call = async (token, name, args = {}) => {
  const response = await step(`tools/call ${name}`, () =>
    rpc(token, mcpUrl, "tools/call", { name, arguments: args }).then((r) =>
      r.json(),
    ),
  );
  if (response.error) return { refused: response.error.message };
  if (response.result?.isError)
    return { refused: JSON.stringify(response.result.content) };
  return response.result.structuredContent;
};

const admin = await signIn(email, "admin");
const init = await step("initialize", () =>
  rpc(admin, mcpUrl, "initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "smoke", version: "1" },
  }).then((r) => r.json()),
);
check(init.result?.serverInfo, `initialize: ${init.result?.serverInfo?.name}`);
const tools = await step("tools/list", () =>
  rpc(admin, mcpUrl, "tools/list", {}).then((r) => r.json()),
);
check(
  tools.result?.tools?.length === 6,
  `tools: ${tools.result?.tools?.map((t) => t.name).join(", ")}`,
);
const live = await call(admin, "entries_list", { version: "live" });
check(live.entries?.length > 0, `live has ${live.entries?.length} page(s)`);
const stamp = new Date().toISOString();
await call(admin, "entry_update", {
  path: "/smoke",
  version: "draft",
  data: { title: "Smoke", stamp },
});
const draft = await call(admin, "entry_get", {
  path: "/smoke",
  version: "draft",
});
check(draft.data?.stamp === stamp, "draft write and read back");
const liveSmoke = await call(admin, "entry_get", {
  path: "/smoke",
  version: "live",
});
check(liveSmoke.refused, "draft write did not touch live");

// 5. Member rules with a second account.
await call(admin, "member_revoke", { email: guestEmail }); // left over from a failed run
const guest = await signIn(guestEmail, "guest");
const guestLive = await call(guest, "entries_list", { version: "live" });
check(guestLive.entries?.length > 0, "guest reads live");
check(
  (await call(guest, "entry_get", { path: "/smoke", version: "draft" }))
    .refused,
  "guest cannot read draft",
);
check(
  (
    await call(guest, "entry_update", {
      path: "/smoke",
      version: "draft",
      data: {},
    })
  ).refused,
  "guest cannot write",
);
check(
  (await call(guest, "member_grant", { email: guestEmail, role: "admin" }))
    .refused,
  "guest cannot grant",
);
await call(admin, "member_grant", { email: guestEmail, role: "editor" });
const invited = await call(guest, "entry_get", {
  path: "/smoke",
  version: "draft",
});
check(invited.data?.stamp === stamp, "invited editor reads draft");
const members = await call(admin, "members_list");
check(
  members.members?.some((m) => m.email === guestEmail && m.joined),
  `members: ${members.members?.map((m) => `${m.email} (${m.role})`).join(", ")}`,
);
check(
  (await call(guest, "member_revoke", { email })).refused,
  "editor cannot revoke",
);
await call(admin, "member_revoke", { email: guestEmail });
check(
  (await call(guest, "entry_get", { path: "/smoke", version: "draft" }))
    .refused,
  "revoked guest cannot read draft",
);
check(
  (await call(admin, "member_revoke", { email })).refused,
  "last admin cannot be removed",
);

// 6. The token is bound to this project's URL.
const other = mcpUrl.replace(/\/p\/[^/]+\/mcp$/, "/p/other/mcp");
const wrongAudience = await rpc(admin, other, "tools/list", {});
check(wrongAudience.status === 401, "token rejected for another project");

console.log("\ntimings (ms):", timings);
