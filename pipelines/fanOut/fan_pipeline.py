from typing_extensions import Annotated
from zenml import get_step_context, pipeline, step
from zenml.client import Client
from zenml.logger import get_logger

from utils import log_dashboard_urls  # type: ignore

logger = get_logger(__name__)


# ──────────────── 1️⃣ generator step ────────────────
@step(enable_cache=False)
def load_message() -> Annotated[str, "message"]:
    logger.info("Generating base message for fan-out")
    return "Hello from ZenML!"


# ──────────────── 2️⃣ fan-out processor ─────────────
@step(enable_cache=False)
def shout(text: str) -> Annotated[str, "shout"]:
    logger.info(f"Processing message: {text}")
    result = text.upper()
    logger.info(f"Processed result: {result}")
    return result


# ──────────────── 3️⃣ fan-in aggregator ─────────────
@step(enable_cache=False)
def combine() -> Annotated[str, "combined"]:
    """Collects outputs from all shout steps."""
    logger.info("Starting fan-in aggregation")
    ctx = get_step_context()
    run = Client().get_pipeline_run(ctx.pipeline_run.name)

    outs = []
    for step_name, info in run.steps.items():
        if step_name.startswith("shout"):
            output = info.outputs["shout"][0].load()
            outs.append(output)
            logger.info(f"Collected output from {step_name}: {output}")

    result = " | ".join(outs)
    logger.info(f"Fan-in aggregation complete: {result}")
    return result


# ──────────────── pipeline wiring only ─────────────
@pipeline(enable_cache=False)
def fan_pipeline(parallel: int = 4):
    base = load_message()
    after = [shout(base) for i in range(parallel)]
    combine(after=after)


# ──────────────── run & inspect ─────────────
if __name__ == "__main__":
    logger.info("Starting fan-out/fan-in pipeline")
    run = fan_pipeline(parallel=5)

    final = run.steps["combine"].outputs["combined"][0].load()
    logger.info(f"▶︎ Final fan-in result: {final}")

    log_dashboard_urls("fan_pipeline")
