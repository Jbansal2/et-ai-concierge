import time
import logging

logger = logging.getLogger(__name__)

def with_retry(func, retries: int = 3, delay: float = 1.0, fallback=None):
    """
    Retry wrapper for agent calls.
    Retries on failure with exponential backoff.
    Returns fallback value if all retries fail.
    """
    last_error = None

    for attempt in range(retries):
        try:
            result = func()
            if attempt > 0:
                logger.info(f"Succeeded on attempt {attempt + 1}")
            return result
        except Exception as e:
            last_error = e
            wait = delay * (2 ** attempt)  # exponential backoff
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait}s...")
            if attempt < retries - 1:
                time.sleep(wait)

    logger.error(f"All {retries} attempts failed. Last error: {last_error}")
    return fallback() if callable(fallback) else fallback