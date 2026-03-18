const http = require("http");

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin() {
  console.log("🧪 Testando Login + API Access...\n");

  // 1. Login
  console.log("1️⃣ Fazendo login...");
  const loginRes = await makeRequest(
    {
      hostname: "localhost",
      port: 3000,
      path: "/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
    {
      email: "admin@cerionuniplus.com.br",
      password: "SuperAdmin@2026",
    }
  );

  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Response:`, JSON.stringify(loginRes.data, null, 2));

  if (loginRes.status !== 200 || !loginRes.data.token) {
    console.error("❌ Login falhou!");
    process.exit(1);
  }

  const token = loginRes.data.token;
  console.log(`   ✅ Token obtido: ${token.substring(0, 20)}...\n`);

  // 2. Acessar /api/unidades
  console.log("2️⃣ Tentando acessar /api/unidades com token...");
  const unidadesRes = await makeRequest({
    hostname: "localhost",
    port: 3000,
    path: "/api/unidades",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  console.log(`   Status: ${unidadesRes.status}`);
  console.log(`   Response:`, JSON.stringify(unidadesRes.data, null, 2));

  if (unidadesRes.status === 403) {
    console.error("❌ Acesso negado (403)!");
    process.exit(1);
  } else if (unidadesRes.status === 200) {
    console.log("✅ Sucesso! Conseguiu acessar /api/unidades!");
  }

  process.exit(0);
}

testLogin().catch(console.error);
