module.exports = {
  apps: [
    {
      name: "timhoty test api",
      script: "src/server.ts",
      node_args: "--import tsx",
      exec_mode: "fork",
      watch: false
    }
  ]
};
