import base64
import io

import matplotlib.pyplot as plt
import pandas as pd
from typing_extensions import Annotated
from zenml import pipeline, step
from zenml.logger import get_logger
from zenml.types import HTMLString

logger = get_logger(__name__)


@step
def load_iris() -> Annotated[pd.DataFrame, "iris_df"]:
    logger.info("Loading Iris dataset")
    from sklearn.datasets import load_iris

    df = load_iris(as_frame=True).frame
    logger.info(f"Loaded dataset with {len(df)} rows and {len(df.columns)} columns")
    return df


@step
def scatter(df: pd.DataFrame) -> Annotated[HTMLString, "scatter_plot"]:
    logger.info("Creating scatter plot visualization")
    fig, ax = plt.subplots()
    ax.scatter(
        df["sepal length (cm)"], df["petal length (cm)"], c=df["target"], alpha=0.7
    )
    ax.set_xlabel("Sepal Length (cm)")
    ax.set_ylabel("Petal Length (cm)")
    ax.set_title("Iris Dataset Scatter Plot")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    img = base64.b64encode(buf.getvalue()).decode()
    html = f"<img src='data:image/png;base64,{img}' style='max-width:100%'>"
    logger.info("Scatter plot visualization created successfully")
    return HTMLString(html)


@pipeline(tags=["visual-demo"])
def viz_pipeline():
    df = load_iris()
    scatter(df)


if __name__ == "__main__":
    logger.info("Starting visualization pipeline")
    viz_pipeline()
    logger.info("Pipeline completed - check dashboard for visualizations")
    logger.info("▶︎ Two visual cards now appear in the run-detail page.")
