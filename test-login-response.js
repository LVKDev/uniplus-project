const http = require("http");

function test() {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      const data = JSON.parse(body);
      console.log("✅ Login Response:");
      console.log(JSON.stringify(data, null, 2));
      console.log("\n📋 O que deveria estar no localStorage:");
      console.log("  token:", data.token ? data.token.substring(0, 30) + "..." : "NULL");
      console.log("  user.email:", data.user?.email || "NULL");
      console.log("  user.role:", data.user?.role || "NULL");
    });
  });

  req.write(
    JSON.stringify({
      email: "admin@cerionuniplus.com.br",
      password: "SuperAdmin@2026",
    })
  );
  req.end();
}

test();
