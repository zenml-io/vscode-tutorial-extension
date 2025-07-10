from zenml.client import Client
from zenml.config.global_config import GlobalConfiguration
from zenml.logger import get_logger

logger = get_logger(__name__)


def log_dashboard_urls(pipeline_name: str):
    """Log dashboard URLs for pipeline completion with standard formatting."""
    import os
    
    client = Client()
    store_info = GlobalConfiguration().zen_store.get_store_info()

    workspace_name = store_info.metadata.get("workspace_name")
    project_name = client.active_project.name

    # Handle None workspace_name by using "default" as fallback
    if workspace_name is None:
        workspace_name = "default"

    # Determine base URL based on environment
    is_codespace = os.environ.get("CODESPACES") == "true"
    is_tutorial_enabled = os.environ.get("ZENML_ENABLE_TUTORIAL") == "true"
    is_remote = os.environ.get("VSCODE_REMOTE_NAME") is not None
    
    if is_codespace or is_tutorial_enabled or is_remote:
        dashboard_base = "https://cloud.zenml.io"
    else:
        dashboard_base = "http://127.0.0.1:8237"

    run = client.get_pipeline(pipeline_name).last_run
    base_url = f"{dashboard_base}/workspaces/{workspace_name}/projects/{project_name}"
    dashboard_url = f"{base_url}/runs/{run.id}"

    logger.info("\n" + "=" * 60)
    logger.info("✅ Pipeline execution complete!")
    logger.info(f"🌐 View pipeline in dashboard: {base_url}/pipelines/{pipeline_name}")
    logger.info(f"🌐 View this run: {dashboard_url}")
    logger.info(f"🌐 View all artifacts: {base_url}/artifacts")
    logger.info("=" * 60)
    # Print dashboard URL for VSCode extension to capture
    print(f"DASHBOARD_URL:{dashboard_url}")
