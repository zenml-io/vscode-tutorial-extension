# Step I/O - Typed Inputs and Outputs

Now let's learn how to pass data between steps with proper type annotations.

## What you'll learn

- How to define typed step outputs using `Annotated` types
- How to pass data from one step to another
- How to access step outputs after pipeline execution

## The Code

This pipeline shows data flowing between steps:

```python
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
```

## Key Concepts

- **Type annotations** help ZenML understand your data structures
- **Annotated types** provide semantic meaning to outputs
- **Data flow** between steps is handled automatically by ZenML
- **Output names** make it easy to retrieve specific results

## Try it yourself

Run this pipeline to see how data flows from the `load_data` step to the `count_rows` step!