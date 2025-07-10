# Tutorial Pipelines

## Overview

Each pipeline adds exactly **one new concept** and the code never gets longer than ~30 lines, so folks can copy-paste and run without scrolling.

| #   | What it teaches                   | Key ZenML concept                | Copy-paste code          |
| --- | --------------------------------- | -------------------------------- | ------------------------ |
| 1   | “Hello World”                     | _Steps & Pipelines_              | see your current snippet |
| 2   | Pass data between steps           | _Typed inputs / outputs_         | `io_pipeline.py` below   |
| 3   | Make behaviour configurable       | _Step & pipeline parameters_     | `param_pipeline.py`      |
| 4   | Keep runs tidy                    | _Tags_ (both simple & exclusive) | `tagged_pipeline.py`     |
| 5   | Record useful facts               | _Metadata logging_               | `meta_pipeline.py`       |
| 6   | Save time on re-runs              | _Caching_                        | `cache_pipeline.py`      |
| 7   | Automatic & custom visualisations | Custom visualizastions           | `vis_pipeline.py`        |
| 8   | Parallel work then merge          | _Fan-out / fan-in_               | `fan_pipeline.py`        |
| 9   | Deal with hiccups                 | _Automatic retries + hooks_      | `robust_pipeline.py`     |
| 10  | Separate config from code         | _YAML run config_                | `yaml_pipeline.py`#      |

---

## 1. “Hello World”

```python
from zenml import step, pipeline, Client

@step
def say_hello() -> str:
    return "Hello World!"

@pipeline
def hello_pipeline():
    say_hello()

if __name__ == "__main__":
    run = hello_pipeline()
    out = run.steps["say_hello"].outputs["output"][0].load()
    print(f"▶︎ Step returned: {out}")
```

## 2 Step inputs and outputs `io_pipeline.py`

```python
from typing import Tuple
from typing_extensions import Annotated
from zenml import step, pipeline, Client

@step
def load_data() -> Tuple[
    Annotated[list[int],  "features"],
    Annotated[list[int],  "labels"  ]
]:
    return [1, 2, 3, 4], [1, 0, 1, 0]

@step
def count_rows(
    data: Tuple[list[int], list[int]]
) -> Annotated[int, "row_count"]:
    X, _ = data
    return len(X)

@pipeline
def io_pipeline():
    data = load_data()
    count_rows(data)

if __name__ == "__main__":
    run  = io_pipeline()
    rows = run.steps["count_rows"].outputs["row_count"][0].load()
    print(f"▶︎ rows = {rows}")
```

---

## 3 Parameterising steps & pipelines `param_pipeline.py`

```python
from typing_extensions import Annotated
from zenml import step, pipeline

@step
def multiply(number: int, factor: int = 2) -> Annotated[int, "product"]:
    return number * factor

@pipeline
def param_pipeline(number: int = 3, factor: int = 2):
    multiply(number=number, factor=factor)

if __name__ == "__main__":
    run    = param_pipeline(number=5, factor=10)
    result = run.steps["multiply"].outputs["product"][0].load()
    print(f"▶︎ 5 × 10 = {result}")

```

---

## 4 Tagging and organising `tagged_pipeline.py`

```python
"""
Run this file two or three times. Notice how the exclusive tag 'latest_demo'
always ends up on the **newest** run only.
"""
from zenml import step, pipeline, Tag, get_step_context, Client

EXCLUSIVE = "latest_demo"

@step
def report_tags() -> None:
    ctx = get_step_context()
    run = ctx.pipeline_run
    print("\n▶︎ THIS run:", run.name)
    print("   tags:", run.tags)

    newer_runs = Client().list_pipeline_runs(
        name=run.pipeline.name,
        tags=[f"equals:{EXCLUSIVE}"]
    ).items
    print(f"   runs currently carrying exclusive tag '{EXCLUSIVE}':",
          len(newer_runs))

@pipeline(tags=["tutorial", Tag(name=EXCLUSIVE, exclusive=True)])
def tagged_pipeline():
    report_tags()

if __name__ == "__main__":
    tagged_pipeline()
    print("Run again to watch the exclusive tag move ➡︎")

```

_“latest-demo”_ will automatically jump to the most recent run, keeping dashboards tidy.

---

## 5 Logging metadata `meta_pipeline.py`

```python
from typing_extensions import Annotated
from zenml import step, pipeline, log_metadata

@step
def compute_accuracy() -> Annotated[float, "accuracy_metric"]:
    acc = 0.93
    log_metadata({"accuracy": acc})
    return acc

@pipeline
def meta_pipeline():
    compute_accuracy()

if __name__ == "__main__":
    meta_pipeline()
    print("▶︎ ‘accuracy’ card appears in dashboard.")

```

---

## 6 Caching makes reruns instant `cache_pipeline.py`

```python
import time
from typing_extensions import Annotated
from zenml import step, pipeline

@step(enable_cache=True)
def slow_step() -> Annotated[int, "answer"]:
    time.sleep(3)
    return 42

@pipeline
def cache_pipeline():
    slow_step()

if __name__ == "__main__":
    cache_pipeline()   # first run ~3 s
    cache_pipeline()   # second run instant (cache hit)

```

---

## 7 Automatic & custom visualisations `viz_pipeline.py`

```python
import pandas as pd, matplotlib.pyplot as plt, base64, io
from typing_extensions import Annotated
from zenml import step, pipeline
from zenml.types import HTMLString

@step
def load_iris() -> Annotated[pd.DataFrame, "iris_df"]:
    from sklearn.datasets import load_iris
    return load_iris(as_frame=True).frame

@step
def scatter(
    df: pd.DataFrame
) -> Annotated[HTMLString, "scatter_plot"]:
    fig, ax = plt.subplots()
    ax.scatter(df["sepal length (cm)"], df["petal length (cm)"],
               c=df["target"], alpha=.7)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight")
    plt.close(fig)
    img = base64.b64encode(buf.getvalue()).decode()
    html = f"<img src='data:image/png;base64,{img}' style='max-width:100%'>"
    return HTMLString(html)

@pipeline(tags=["visual-demo"])
def viz_pipeline():
    df = load_iris()
    scatter(df)

if __name__ == "__main__":
    viz_pipeline()
    print("▶︎ Two visual cards now appear in the run-detail page.")

```

---

## 8 Fan-out / fan-in `fan_pipeline.py`

```python
"""
Shows parallel fan-out (multiple identical steps) and a fan-in step that
gathers all their outputs via the Client API.

Run it once and observe the printed summary.  Re-run: cache is OFF so you
see the steps execute every time.
"""
from typing_extensions import Annotated
from zenml import step, pipeline, get_step_context, Client

# ──────────────── 1️⃣ generator step ────────────────
@step(enable_cache=False)
def load_message() -> Annotated[str, "message"]:
    return "Hello from ZenML!"

# ──────────────── 2️⃣ fan-out processor ─────────────
@step(enable_cache=False)
def shout(text: str) -> Annotated[str, "shout"]:
    return text.upper()

# ──────────────── 3️⃣ fan-in aggregator ─────────────
@step(enable_cache=False)
def combine(prefix: str, output_name: str) -> Annotated[str, "combined"]:
    """Collects every step whose name starts with `prefix`."""
    ctx = get_step_context()
    run = Client().get_pipeline_run(ctx.pipeline_run.name)

    outs = []
    for step_name, info in run.steps.items():
        if step_name.startswith(prefix):
            outs.append(info.outputs[output_name][0].load())

    return " | ".join(outs)

# ──────────────── pipeline wiring only ─────────────
@pipeline(enable_cache=False)
def fan_pipeline(parallel: int = 4):
    base = load_message()
    after = [shout(base, id=f"shout_{i}") for i in range(parallel)]
    combine(step_prefix="shout_", output_name="shout", after=after)

# ──────────────── run & inspect ─────────────
if __name__ == "__main__":
    run = fan_pipeline(parallel=5)

    final = run.steps["combine"].outputs["combined"][0].load()
    print("\n▶︎ Fan-in result:", final)

```

---

## 9 Retries & hooks `robust_pipeline.py`

```python
"""
Demonstrates automatic retries *and* a failure hook.
Run it a few times – roughly half will need 1–2 retries.
"""
import random, time
from typing_extensions import Annotated
from zenml import step, pipeline
from zenml.config import StepRetryConfig

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
    time.sleep(0.5)          # pretend work
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
        print("▶︎ Final result:", msg)
    else:
        print("▶︎ Pipeline ended in state:", step_run.status)

```

---

## 10 Running from a YAML file (no template-generation hype) `yaml_pipeline.py`

All you really need is:

1. **Any valid ZenML run-config YAML** on disk

   (create it once by hand or in your editor), then

2. `pipeline.with_options(config_path="…")()`.

Below is a minimal example you can copy-paste.

---

### ❶ Create `my_run.yaml`

```yaml
yaml
CopyEdit
# only the bits you care about:
parameters:
  name: "ZenML Community 👋"

```

_(Put that file next to the Python script.)_

---

### ❷ Pipeline code

```python
python
CopyEdit
from typing_extensions import Annotated
from zenml import step, pipeline, Client

@step
def greet(name: str) -> Annotated[str, "greeting"]:
    return f"Hello, {name}!"

@pipeline
def yaml_pipeline(name: str = "world"):
    greet(name=name)                 # wire only – no prints

if __name__ == "__main__":
    # run exactly with the YAML you wrote
    run = yaml_pipeline.with_options(config_path="my_run.yaml")()

    # fetch artifact afterwards so users see something in the console
    msg = run.steps["greet"].outputs["greeting"][0].load()
    print("▶︎", msg)

```

Run it:

```bash
bash
CopyEdit
python yaml_pipeline.py

```

Console shows:

```
CopyEdit
▶︎ Hello, ZenML Community 👋

```

…and the ZenML dashboard records the run with the parameter coming from your YAML.
