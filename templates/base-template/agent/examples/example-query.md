# Example: Dataset Summary Query

<!-- Example interactions document how the agent should behave for a given
     prompt. Replace this with queries representative of your domain. -->

## User Prompt
"Summarize the example records and tell me what stands out."

## Expected Agent Behavior
1. Load skill: `example-skill`
2. Read data files: `journey-data/example-journey/sample.csv`, `records.csv`
3. Group rows by `category` and total the `value` column
4. Flag any row whose `status` is not `active`
5. Generate an executive summary

## Expected Response Structure
```
Example Dataset Summary

Summary: The sample contains 10 records across 3 categories (operations,
analysis, support). Total value is 8,405. Two records are in "review" and
two are "closed" — the rest are active.

| Category   | Count | Total Value | Notes                  |
|------------|-------|-------------|------------------------|
| operations | 4     | 2,415       | 1 record in review     |
| analysis   | 3     | 3,690       | 1 closed               |
| support    | 3     | 2,300       | 1 review, 1 closed     |

Recommended next step: review the "Charlie" (operations) and "Golf" (support)
records that are pending review.

Source: knowledge/journey-data/example-journey/sample.csv
```
