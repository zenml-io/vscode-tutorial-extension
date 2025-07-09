import random
import time

from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.config import StepRetryConfig
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


# ──────────────── hook functions ────────────────
def failure_hook(exc: BaseException):
    print(f"⚠️  hook: step failed with {exc!r}")


# ──────────────── flaky step with retries ─────────
@step(
    retry=StepRetryConfig(max_retries=3, delay=1, backoff=2),
    on_failure=failure_hook,
)
def flaky() -> Annotated[str, "result"]:
    if random.random() < 0.5:
        raise RuntimeError("intermittent error")
    time.sleep(0.5)  # pretend work
    return "All good!"


# ──────────────── pipeline wiring ────────────────
@pipeline
def robust_pipeline():
    flaky()


# ──────────────── run & inspect ────────────────
if __name__ == "__main__":
    run = robust_pipeline()

    step_run = run.steps["flaky"]
    if step_run.status == "COMPLETED":
        msg = step_run.outputs["result"][0].load()
        logger.info(f"▶︎ Final result: {msg}")
    else:
        logger.info(f"▶︎ Pipeline ended in state: {step_run.status}")

    log_dashboard_urls("robust_pipeline")
