from typing_extensions import Annotated
from zenml import log_metadata, pipeline, step
from zenml.logger import get_logger

logger = get_logger(__name__)


@step
def compute_accuracy() -> Annotated[float, "accuracy_metric"]:
    logger.info("Computing model accuracy")
    acc = 0.93
    logger.info(f"Accuracy computed: {acc}")
    log_metadata({"accuracy": acc})
    logger.info("Accuracy metadata logged to ZenML")
    return acc


@pipeline
def meta_pipeline():
    compute_accuracy()


if __name__ == "__main__":
    logger.info("Starting metadata logging pipeline")
    meta_pipeline()
    logger.info("Pipeline completed - check dashboard for accuracy card")
