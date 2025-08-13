module.exports = {
    apps: [
      {
        name: "timhoty",
        script: "src/server.ts",
        node_args: "--import tsx",
        exec_mode: "fork",
        watch: false
      }
    ]
  };
  