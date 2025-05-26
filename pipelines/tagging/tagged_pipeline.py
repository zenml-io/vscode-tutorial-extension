"""
Run this file two or three times. Notice how the exclusive tag 'latest_demo'
always ends up on the **newest** run only.
"""

from zenml import Tag, get_step_context, pipeline, step
from zenml.client import Client
from zenml.logger import get_logger

logger = get_logger(__name__)
EXCLUSIVE = "latest_demo"


@step
def report_tags() -> None:
    ctx = get_step_context()
    run = ctx.pipeline_run
    logger.info(f"▶︎ THIS run: {run.name}")
    logger.info(f"   tags: {run.tags}")

    newer_runs = (
        Client()
        .list_pipeline_runs(name=run.pipeline.name, tags=[f"equals:{EXCLUSIVE}"])
        .items
    )
    logger.info(
        f"   runs currently carrying exclusive tag '{EXCLUSIVE}': {len(newer_runs)}"
    )

    logger.info(f"\n▶︎ THIS run: {run.name}")
    logger.info(f"   tags: {run.tags}")


@pipeline(tags=["tutorial", Tag(name=EXCLUSIVE, exclusive=True)])
def tagged_pipeline():
    report_tags()


if __name__ == "__main__":
    logger.info("Starting tagged pipeline demonstration")
    tagged_pipeline()
    logger.info("Run again to watch the exclusive tag move ➡︎")
