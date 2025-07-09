## What you'll learn

- How to create parallel processing patterns
- How to dynamically generate multiple steps
- How to collect and aggregate results from parallel execution

## The Code

This pipeline demonstrates fan-out and fan-in patterns:

```python
@pipeline(enable_cache=False)
def fan_pipeline(parallel: int = 4):
    base = load_message()
    after = [shout(base, id=f"shout_{i}") for i in range(parallel)]
    combine(step_prefix="shout_", output_name="shout", after=after)
```

## Key Concepts

- **Fan-out** splits work across multiple parallel steps
- **Dynamic step generation** creates steps programmatically
- **Fan-in** collects and aggregates results from parallel execution
- **Scalable patterns** handle varying workloads efficiently

## Try it yourself

Run this pipeline to see how it processes data in parallel across multiple
steps, then combines the results!
