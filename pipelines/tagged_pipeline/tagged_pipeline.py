from typing import Annotated

import pandas as pd
from zenml import ArtifactConfig, Tag, add_tags, pipeline, step
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


@step
def create_raw_data() -> Annotated[
    pd.DataFrame, ArtifactConfig(name="raw_data", tags=["raw", "input"])
]:
    """Create raw data with artifact-level tags."""
    data = pd.DataFrame(
        {
            "feature_1": [1, 2, 3, 4, 5],
            "feature_2": [10, 20, 30, 40, 50],
            "target": [0, 1, 0, 1, 0],
        }
    )
    logger.info(f"Created raw data with shape: {data.shape}")
    return data


@step
def process_data(
    raw_data: pd.DataFrame,
) -> Annotated[
    pd.DataFrame, ArtifactConfig(name="processed_data", tags=["processed"])
]:
    """Process data and add dynamic tags."""
    # Simple processing: normalize features
    processed = raw_data.copy()
    processed["feature_1"] = (
        processed["feature_1"] / processed["feature_1"].max()
    )
    processed["feature_2"] = (
        processed["feature_2"] / processed["feature_2"].max()
    )

    # Add tags dynamically within the step
    add_tags(tags=["normalized", "ready_for_training"], infer_artifact=True)

    logger.info("Processed data with normalization")
    return processed


# Pipeline with cascade tags - these will be applied to all artifacts created during execution
@pipeline(tags=["tutorial", Tag(name="experiment", cascade=True)])
def tagged_pipeline():
    """Pipeline demonstrating various artifact tagging approaches."""
    raw_data = create_raw_data()
    processed_data = process_data(raw_data)
    return processed_data


if __name__ == "__main__":
    logger.info("Starting artifact tagging demonstration")
    logger.info("This will show:")
    logger.info("  1. Artifact-level tags defined in ArtifactConfig")
    logger.info("  2. Dynamic tagging within steps using add_tags()")
    logger.info("  3. Cascade tags from pipeline applied to all artifacts")
    logger.info("  4. Filtering and querying artifacts by tags")

    # Run the pipeline
    tagged_pipeline()

    # Log dashboard URLs
    log_dashboard_urls("tagged_pipeline")
    logger.info("Run again to see how tags accumulate across multiple runs")
