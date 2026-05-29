import logging
import os
from datetime import datetime

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f"backend_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_LEVEL_VALUE = getattr(logging, LOG_LEVEL, logging.INFO)

logging.basicConfig(
    level=LOG_LEVEL_VALUE,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)

def get_logger(name: str):
    return logging.getLogger(name)
