## What you'll learn

- How to enable caching on steps
- When cache hits occur vs cache misses
- How caching speeds up iterative development

## The Code

This pipeline demonstrates caching with a slow step:

```python
@step(enable_cache=True)
def slow_step() -> Annotated[int, "answer"]:
    time.sleep(3)  # Simulates expensive computation
    return 42
```

## Key Concepts

- **Cache hits** occur when inputs and code haven't changed
- **Smart invalidation** ensures you get fresh results when needed
- **Development speed** improves dramatically with caching
- **Resource efficiency** reduces computational waste

## Try it yourself

Run this pipeline twice! The first run takes ~3 seconds, the second is instant
thanks to caching.
