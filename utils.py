from zenml.client import Client
from zenml.config.global_config import GlobalConfiguration
from zenml.logger import get_logger

logger = get_logger(__name__)


def log_dashboard_urls(pipeline_name: str):
    """Log dashboard URLs for pipeline completion with standard formatting."""
    client = Client()
    store_info = GlobalConfiguration().zen_store.get_store_info()

    workspace_name = store_info.metadata.get("workspace_name")
    project_name = client.active_project.name

    run = client.get_pipeline(pipeline_name).last_run
    base_url = (
        f"https://cloud.zenml.io/workspaces/{workspace_name}/projects/{project_name}"
    )
    dashboard_url = f"{base_url}/runs/{run.id}"

    logger.info("\n" + "=" * 50)
    logger.info("✅ Pipeline execution complete!")
    logger.info(f"🌐 View pipeline in dashboard: {base_url}/pipelines/{pipeline_name}")
    logger.info(f"🌐 View this run: {dashboard_url}")
    logger.info(f"🌐 View all artifacts: {base_url}/artifacts")
    logger.info("=" * 50)
