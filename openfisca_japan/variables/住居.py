"""
This file defines variables for the modelled legislation.

A variable is a property of an Entity such as a 人物, a 世帯…

See https://openfisca.org/doc/key-concepts/variables.html
"""

from functools import cache
import json

# Import from openfisca-core the Python objects used to code the legislation in OpenFisca
from openfisca_core.periods import DAY
from openfisca_core.variables import Variable
# Import the Entities specifically defined for this tax and benefit system
from openfisca_japan.entities import 世帯


@cache
def 市区町村級地区分():
    """
    jsonファイルから値を取得
    """
    with open("openfisca_japan/assets/市区町村級地区分.json") as f:
        return json.load(f)
"""
@cache
def 能登半島地震災害救助法適用市区町村():
    """
    # jsonファイルから値を取得
    """
    with open("openfisca_japan/assets/能登半島地震災害救助法適用市区町村.json") as f:
        return json.load(f)
"""

class 居住都道府県(Variable):
    value_type = str
    entity = 世帯
    label = "居住都道府県"
    definition_period = DAY
    default_value = "北海道"


class 居住市区町村(Variable):
    value_type = str
    entity = 世帯
    label = "居住市区町村"
    definition_period = DAY
    default_value = "その他"


class 居住級地区分1(Variable):
    # m級地-n のとき m を返す
    value_type = int
    entity = 世帯
    label = "居住級地区分1"
    definition_period = DAY
    reference = "https://best-selection.co.jp/media/wp-content/uploads/2021/03/seikatsuhogo-kyuchi2022.pdf"

    def formula(対象世帯, 対象期間, _parameters):
        居住都道府県 = 対象世帯("居住都道府県", 対象期間)
        居住市区町村 = 対象世帯("居住市区町村", 対象期間)
        # NOTE: 市区町村級地区分()[都道府県][市区町村][0] が級地区分1を表す
        return [市区町村級地区分()[都道府県][市区町村][0] if 市区町村 in 市区町村級地区分()[都道府県] else 3
                for 都道府県, 市区町村 in zip(居住都道府県, 居住市区町村)]


class 居住級地区分2(Variable):
    # m級地-n のとき n を返す
    value_type = int
    entity = 世帯
    label = "居住級地区分2"
    definition_period = DAY
    reference = "https://best-selection.co.jp/media/wp-content/uploads/2021/03/seikatsuhogo-kyuchi2022.pdf"

    def formula(対象世帯, 対象期間, parameters):
        居住都道府県 = 対象世帯("居住都道府県", 対象期間)
        居住市区町村 = 対象世帯("居住市区町村", 対象期間)
        # NOTE: 市区町村級地区分()[都道府県][市区町村][1] が級地区分2を表す
        return [市区町村級地区分()[都道府県][市区町村][1] if 市区町村 in 市区町村級地区分()[都道府県] else 2
                for 都道府県, 市区町村 in zip(居住都道府県, 居住市区町村)]

"""
class 災害救助法の適用地域である(Variable):
    value_type = bool
    entity = 世帯
    label = "災害救助法の適用地域である"
    definition_period = DAY
    reference = "" # TODO: 要確認

    def formula(対象世帯, 対象期間, _parameters):
        居住都道府県 = 対象世帯("居住都道府県", 対象期間)
        居住市区町村 = 対象世帯("居住市区町村", 対象期間)
        return [能登半島地震災害救助法適用市区町村()[都道府県][市区町村] if 都道府県 in 能登半島地震災害救助法適用市区町村() and 市区町村 in 能登半島地震災害救助法適用市区町村()[都道府県]: else False
                for 都道府県, 市区町村 in zip(居住都道府県, 居住市区町村)]
"""