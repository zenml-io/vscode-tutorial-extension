## What you'll learn

- How to add parameters to steps and pipelines
- How to provide default values for parameters
- How to override parameters when running pipelines

## The Code

This pipeline demonstrates configurable behavior:

```python
@step
def multiply(number: int, factor: int = 2) -> Annotated[int, "product"]:
    return number * factor

@pipeline
def param_pipeline(number: int = 3, factor: int = 2):
    multiply(number=number, factor=factor)
```

## Key Concepts

- **Step parameters** make individual steps configurable
- **Pipeline parameters** control the entire workflow
- **Default values** provide sensible defaults while allowing customization
- **Runtime configuration** lets you change behavior without modifying code

## Try it yourself

Run this pipeline to see how parameters control the multiplication operation!
