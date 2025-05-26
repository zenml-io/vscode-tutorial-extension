# Tagging - Keep Runs Organized

Learn how to use tags to organize and categorize your pipeline runs.

## What you'll learn

- How to add simple tags to pipelines
- How to use exclusive tags that automatically move to the latest run
- How to query runs by their tags

## The Code

This pipeline demonstrates both simple and exclusive tagging:

```python
@pipeline(tags=["tutorial", Tag(name="latest_demo", exclusive=True)])
def tagged_pipeline():
    report_tags()
```

## Key Concepts

- **Simple tags** help categorize runs (like "tutorial", "experiment")
- **Exclusive tags** automatically move to the newest run, keeping dashboards tidy
- **Tag queries** let you find specific runs easily
- **Run organization** becomes crucial as projects grow

## Try it yourself

Run this pipeline multiple times and watch how the exclusive tag automatically moves to the latest run!