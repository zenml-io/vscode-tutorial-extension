# YAML Config - Separate Configuration from Code

Learn how to externalize configuration using YAML files, keeping your code clean and enabling easy parameter management.

## What you'll learn

- How to create YAML configuration files for pipelines
- How to run pipelines with external configuration
- When and why to separate config from code

## The Code

This tutorial requires two files:

**my_run.yaml**:
```yaml
parameters:
  name: "ZenML Community 👋"
```

**Pipeline code**:
```python
@pipeline
def yaml_pipeline(name: str = "world"):
    greet(name=name)

# Run with external config
run = yaml_pipeline.with_options(config_path="my_run.yaml")()
```

## Key Concepts

- **External configuration** keeps code and settings separate
- **Environment-specific configs** enable dev/staging/prod workflows
- **Version control** for configurations alongside code
- **Team collaboration** through shared configuration files

## Try it yourself

Run this pipeline to see how YAML configuration overrides the default parameters!