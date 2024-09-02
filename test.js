const path = require("node:path");
const { Logger, LogConfig } = require("./index");

async function initialize_logger() {
  let logger = Logger.with_config(
    LogConfig.from_file(path.join(__dirname, "config.json"))
  );
  await logger.init();

  return logger;
}
async function main() {
  let logger = await initialize_logger();
  setInterval(() => {
    logger.critical("This is critical");
  }, 20);
}

main();
