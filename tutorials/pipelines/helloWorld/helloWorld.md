# Hello World - Steps & Pipelines

Welcome to your first ZenML pipeline! This tutorial introduces the fundamental concepts of **steps** and **pipelines**.

## What you'll learn

- How to create a ZenML step using the `@step` decorator
- How to create a pipeline using the `@pipeline` decorator  
- How to run a pipeline and access its outputs

## The Code

Let's look at the simplest possible ZenML pipeline:

```python
@step
def say_hello() -> str:
    return "Hello World!"

@pipeline
def hello_pipeline():
    say_hello()
```

## Key Concepts

- **Steps** are individual functions decorated with `@step` that perform specific tasks
- **Pipelines** are workflows that connect and orchestrate multiple steps
- **Outputs** from steps can be retrieved and used after pipeline execution

## Try it yourself

Click the **Run Pipeline** button to execute your first ZenML pipeline and see the output!