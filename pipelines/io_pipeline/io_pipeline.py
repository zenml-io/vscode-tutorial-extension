from typing import Tuple

from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


@step
def load_data() -> Tuple[
    Annotated[list[int], "features"], Annotated[list[int], "labels"]
]:
    logger.info("Loading sample data")
    return [1, 2, 3, 4], [1, 0, 1, 0]


@step
def count_rows(
    features: list[int], labels: list[int]
) -> Annotated[int, "row_count"]:
    logger.info(
        f"Counting rows for {len(features)} features and {len(labels)} labels"
    )
    return len(features)


@pipeline
def io_pipeline():
    features, labels = load_data()
    count_rows(features, labels)


if __name__ == "__main__":
    run = io_pipeline()
    rows = run.steps["count_rows"].outputs["row_count"][0].load()
    logger.info(f"▶︎ Pipeline completed with {rows} rows")

    log_dashboard_urls("io_pipeline")
