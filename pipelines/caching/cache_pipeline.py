import time

from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger

from utils import log_dashboard_urls

logger = get_logger(__name__)


@step(enable_cache=True)
def slow_step() -> Annotated[int, "answer"]:
    logger.info("Starting slow computation (3 seconds)...")
    time.sleep(3)
    logger.info("Computation completed!")
    return 42


@pipeline
def cache_pipeline():
    slow_step()


if __name__ == "__main__":
    logger.info("First run - will take ~3 seconds")
    cache_pipeline()  # first run ~3 s

    logger.info("Second run - should be instant (cache hit)")
    cache_pipeline()  # second run instant (cache hit)

    log_dashboard_urls("cache_pipeline")
