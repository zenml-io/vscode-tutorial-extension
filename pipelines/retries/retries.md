# Retries & Hooks - Robust Pipelines

Learn how to build resilient pipelines that can handle failures gracefully with automatic retries and hooks.

## What you'll learn

- How to configure automatic retries for flaky steps
- How to use failure hooks for custom error handling
- How to build robust pipelines that recover from transient failures

## The Code

This pipeline demonstrates retries and failure hooks:

```python
@step(
    retry=StepRetryConfig(max_retries=3, delay=1, backoff=2),
    on_failure=failure_hook,
)
def flaky() -> Annotated[str, "result"]:
    if random.random() < 0.5:
        raise RuntimeError("intermittent error")
    return "All good!"
```

## Key Concepts

- **Automatic retries** handle transient failures without manual intervention
- **Exponential backoff** prevents overwhelming external services
- **Failure hooks** allow custom error handling and notification
- **Robust design** makes pipelines suitable for production environments

## Try it yourself

Run this pipeline multiple times! Sometimes it succeeds immediately, sometimes it needs retries to handle the random failures.