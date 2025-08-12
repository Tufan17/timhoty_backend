module.exports = {
    apps: [
      {
        name: "uygunusec",
        script: "src/server.ts",
        node_args: "--import tsx",
        exec_mode: "fork",
        watch: false
      }
    ]
  };
  