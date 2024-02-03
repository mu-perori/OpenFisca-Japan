"""
市区町村データのJSONファイルに新潟、富山、石川、福井の全市町村を追加する
"""

import json
import logging
import pandas as pd

def read_json(file_name):
    """
    jsonファイルを読み込み
    """
    with open(file_name, "r") as json_open:
        json_load = json.load(json_open)
        return json_load


def export_json(file_name, output_dict):
    """
    jsonファイルに出力
    """
    with open(file_name, "w") as f:
        json.dump(output_dict, f, indent=2, ensure_ascii=False)

# ファイルパス
MUNIC_JSON_PATH = "../../dashboard/src/config/都道府県市区町村"
MUNIC_EXCEL_PATH = "read/000922974"
RESULT = "write/都道府県市区町村_アップデート後"

# ファイルの読み込み
munic_json = read_json(f"{MUNIC_JSON_PATH}.json")
munic_excel = pd.read_excel(f"{MUNIC_EXCEL_PATH}.xls",sheet_name ="R5.4.1現在の団体")

pref_list = ["新潟県", "富山県", "石川県", "福井県"]

for i in range(len(pref_list)):
    pref_name = pref_list[i]
    
    munic_df = munic_excel[munic_excel["都道府県名\n（漢字）"] == pref_name][["市区町村名\n（漢字）", "市区町村名\n（カナ）"]].sort_values("市区町村名\n（カナ）").dropna(how="all", axis="index")
    
    logging.info(f"{munic_df}\n")

    munic_json[pref_name] = munic_df["市区町村名\n（漢字）"].values.tolist()


# 都道府県市区町村.jsonを出力
export_json(f"{RESULT}.json", munic_json)
