from zenml import pipeline, step
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


@step
def say_hello() -> str:
    logger.info("Executing say_hello step")
    return "Hello World!"


@pipeline
def hello_pipeline():
    say_hello()


if __name__ == "__main__":
    run = hello_pipeline()
    out = run.steps["say_hello"].outputs["output"][0].load()
    logger.info(f"▶︎ Step returned: {out}")

    log_dashboard_urls("hello_pipeline")
