import logging
import sys
import os

try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False


def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    logHandler = logging.StreamHandler(sys.stdout)

    if HAS_JSON_LOGGER:
        formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    else:
        formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(name)s: %(message)s')

    logHandler.setFormatter(formatter)

    if logger.hasHandlers():
        logger.handlers.clear()

    logger.addHandler(logHandler)

    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)

    fileHandler = logging.FileHandler(os.path.join(log_dir, 'app.log'), encoding='utf-8')
    fileHandler.setFormatter(formatter)
    logger.addHandler(fileHandler)

    return logger
