const fs = require("node:fs/promises");
const path = require("node:path");
const { LogConfig } = require("./config/log-config");
const { LogLevel } = require("./utils/log-level");
const { check_and_create_dir, get_caller_info } = require("./utils/helpers");
class Logger {
  /**
   * @type {LogConfig}
   */
  #config;

  /**
   * @type {fs.FileHandle}
   */
  #log_file_handle;

  /**
   * @returns {Logger} A new instance of Logger with default config.
   */
  static with_defaults() {
    return new Logger();
  }

  /**
   *
   * @param {LogConfig} log_config
   * @returns {Logger} A new instance of Logger with the given config.
   */
  static with_config(log_config) {
    return new Logger(log_config);
  }
  /**
   * @param {LogConfig} log_config
   */
  constructor(log_config) {
    log_config = log_config || LogConfig.with_defaults();
    LogConfig.assert(log_config);
    this.#config = log_config;
  }

  async init() {
    const log_dir_path = check_and_create_dir("logs");

    const file_name =
      this.#config.file_prefix +
      new Date().toISOString().replace(/[\.:]+/, "-") +
      ".log";

    this.#log_file_handle = await fs.open(
      path.join(log_dir_path, file_name),
      "a+"
    );
  }

  /**
   * Checks if the current log file needs to be rolled over.
   */
  async #rolling_check() {
    const { size_threshold, time_threshold } = this.#config.rolling_config;
    console.log(size_threshold, time_threshold);
    const { size, birthtimeMs } = await this.#log_file_handle.stat();
    const current_time = new Date().getTime();

    if (
      size >= size_threshold ||
      current_time - birthtimeMs >= time_threshold * 1000
    ) {
      await this.#log_file_handle.close();
      await this.init();
    }
  }

  async #log(message, log_level) {
    if (log_level < this.#config.level || !this.#log_file_handle.fd) {
      return;
    }

    const date_iso = new Date().toISOString();
    const log_level_string = LogLevel.to_string(log_level);

    const log_message = `[${date_iso}] [${log_level_string}]: ${get_caller_info()} ${message}\n`;
    await this.#log_file_handle.write(log_message);
    await this.#rolling_check();
  }

  debug(message) {
    this.#log(message, LogLevel.Debug);
  }

  info(message) {
    this.#log(message, LogLevel.Info);
  }

  warn(message) {
    this.#log(message, LogLevel.Warn);
  }

  error(message) {
    this.#log(message, LogLevel.Error);
  }

  critical(message) {
    this.#log(message, LogLevel.Critical);
  }
}

module.exports = { Logger };
