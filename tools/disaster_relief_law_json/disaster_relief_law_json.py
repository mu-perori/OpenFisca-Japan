"""
能登半島地震の災害救助法が適用された自治体のリスト(JSON)を作成
"""

import json
import logging
import pandas as pd
from pandas import DataFrame

def export_json(file_name, output_dict):
    """
    jsonファイルに出力
    """
    with open(file_name, "w") as f:
        json.dump(output_dict, f, indent=2, ensure_ascii=False)

# ファイルパス
RESULT = "write/能登半島自信災害救助法適用市区町村"


pref_list = ["新潟県", "富山県", "石川県", "福井県"]

munic_dict = {}
munic_dict["新潟県"] = "新潟市、長岡市、三条市、柏崎市、加茂市、見附市、燕市、糸魚川市、妙高市、五泉市、上越市、佐渡市、南魚沼市、出雲崎町".split("、")

munic_dict["富山県"] = "富山市、高岡市、氷見市、滑川市、黒部市、砺波市、小矢部市、南砺市、射水市、舟橋村、上市町、立山町、朝日町".split("、")

munic_dict["石川県"] = "金沢市、七尾市、小松市、輪島市、珠洲市、加賀市、羽咋市、かほく市、白山市、能美市、津幡町、内灘町、志賀町、宝達志水町、中能登町、穴水町、能登町".split("、")

munic_dict["福井県"] = "福井市、あわら市、坂井市".split("、")

output_json = {}

for i in range(len(pref_list)):
    pref_name = pref_list[i]
    output_json[pref_name] = {}

    for munic in munic_dict[pref_name]:
        output_json[pref_name][munic] = True
    
    logging.info(f"{output_json[pref_name]}\n")

# 能登半島自信災害救助法適用市区町村.jsonを出力
export_json(f"{RESULT}.json", output_json)
