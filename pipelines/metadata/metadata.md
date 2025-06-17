## What you'll learn

- How to use `log_metadata()` to record key information
- How metadata appears in the ZenML dashboard
- When and why to log metadata

## The Code

This pipeline shows how to log metadata:

```python
@step
def compute_accuracy() -> Annotated[float, "accuracy_metric"]:
    acc = 0.93
    log_metadata({"accuracy": acc})
    return acc
```

## Key Concepts

- **Metadata logging** captures important metrics and information
- **Dashboard integration** makes metadata visible in the ZenML UI
- **Searchable records** help you compare runs and track progress
- **Structured data** can include metrics, descriptions, and other key facts

## Try it yourself

Run this pipeline and check the ZenML dashboard to see the metadata card!
