# Python file for dataframe utilities and helpers for analysis
import pandas as pd

def extend_DataFrame(df, resp):
    df = pd.concat([df, pd.json_normalize(resp, ["data", "pools"])], ignore_index=True)
    return df