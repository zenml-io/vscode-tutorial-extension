import time

from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger

from utils import log_dashboard_urls  # type: ignore

logger = get_logger(__name__)


@step(enable_cache=True)
def slow_step() -> Annotated[int, "answer"]:
    logger.info("🔄 Actually computing result... (sleeping 3 seconds)")
    time.sleep(3)
    return 42


@pipeline
def cache_pipeline():
    slow_step()


if __name__ == "__main__":
    logger.info("\n" + "="*60)
    logger.info(">>> RUN 1: First execution (no cache available)")
    logger.info("="*60)
    cache_pipeline()

    logger.info("\n" + "="*60)
    logger.info(">>> RUN 2: Second execution (cache should be used)")
    logger.info("="*60)
    cache_pipeline()
    
    logger.info("\n💡 Notice: The step's log message only appears in Run 1!")
    logger.info("   In Run 2, the step was skipped entirely due to caching.")

    log_dashboard_urls("cache_pipeline")
