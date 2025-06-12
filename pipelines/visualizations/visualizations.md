## What you'll learn

- How ZenML automatically visualizes common data types
- How to create custom HTML visualizations
- How visualizations enhance pipeline observability

## The Code

This pipeline creates both automatic and custom visualizations:

```python
@step
def scatter(df: pd.DataFrame) -> Annotated[HTMLString, "scatter_plot"]:
    fig, ax = plt.subplots()
    ax.scatter(df["sepal length (cm)"], df["petal length (cm)"],
               c=df["target"], alpha=.7)
    # Convert to HTML for dashboard display
    html = f"<img src='data:image/png;base64,{img}' style='max-width:100%'>"
    return HTMLString(html)
```

## Key Concepts

- **Automatic visualizations** work out-of-the-box for DataFrames and arrays
- **Custom visualizations** give you full control over presentation
- **HTMLString type** lets you embed rich content in the dashboard
- **Dashboard integration** makes results easily shareable

## Try it yourself

Run this pipeline and check the dashboard to see both the automatic DataFrame
visualization and the custom scatter plot!
