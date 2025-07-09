from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


@step
def multiply(number: int, factor: int = 2) -> Annotated[int, "product"]:
    logger.info(f"Multiplying {number} by {factor}")
    result = number * factor
    logger.info(f"Result: {result}")
    return result


@pipeline
def param_pipeline(number: int = 3, factor: int = 2):
    multiply(number=number, factor=factor)


if __name__ == "__main__":
    logger.info("Starting parameterized pipeline")
    run = param_pipeline(number=5, factor=10)
    result = run.steps["multiply"].outputs["product"][0].load()
    logger.info(f"▶︎ Pipeline result: 5 × 10 = {result}")

    log_dashboard_urls("param_pipeline")
