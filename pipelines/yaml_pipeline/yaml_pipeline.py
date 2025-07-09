from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger

try:
    from utils import log_dashboard_urls  # type: ignore
except ImportError:
    log_dashboard_urls = lambda name: print(f"📊 Pipeline '{name}' completed!")

logger = get_logger(__name__)


@step
def greet(name: str) -> Annotated[str, "greeting"]:
    logger.info(f"Greeting step executing with name: {name}")
    greeting = f"Hello, {name}!"
    logger.info(f"Generated greeting: {greeting}")
    return greeting


@pipeline
def yaml_pipeline(name: str = "world"):
    greet(name=name)


if __name__ == "__main__":
    logger.info("Starting YAML-configured pipeline")
    # run exactly with the YAML you wrote
    run = yaml_pipeline.with_options(
        config_path="pipelines/yaml_pipeline/my_run.yaml"
    )()

    # fetch artifact afterwards so users see something in the console
    msg = run.steps["greet"].outputs["greeting"][0].load()
    logger.info(f"▶︎ Pipeline result: {msg}")

    log_dashboard_urls("yaml_pipeline")
