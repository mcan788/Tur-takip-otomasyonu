module.exports = {
  apps: [
    {
      name: "turtakip-arayuz",
      script: "node_modules/serve/build/main.js",
      args: "-s dist -l 5173",
      cwd: "C:/SUNUCU_PAKETI/TurTakip_Arayuz/client",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
