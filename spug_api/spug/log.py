from logging.config import dictConfig
import logging

def init_logger(logpath):
    '''初始化日志'''
    LOGGER = {
        'version': 1,
        'formatters': {
            'default': {
                'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
            }
        },
        'handlers': {
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'default',
                'filename': logpath,
                'level': 'DEBUG',
                'maxBytes': 5000000,
                'backupCount': 7,
                'delay': True
            }
        },
        'root': {
            'level': 'DEBUG',
            'handlers': ['file']
        }
    }
    dictConfig(LOGGER)
    log = logging.getLogger()
    return log

LOG = init_logger('/data/spug/spug_api/logs/debug.log')