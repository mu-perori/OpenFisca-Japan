import { useContext, useEffect, useState, useCallback } from "react";
import { Box, Center, Button } from "@chakra-ui/react";

import configData from "../../config/app_config.json";
import householdData from "../../config/household.json";
import pmJson from "../../config/都道府県市区町村.json";
import { useCalculate } from "../../hooks/calculate";
import { FormYou } from "./you";
import { FormSpouse } from "./spouse";
import { FormChildren } from "./children";
import { useValidate } from "../../hooks/validate";
import { ShowAlertMessageContext } from "../../contexts/ShowAlertMessageContext";
import { useNavigate } from "react-router-dom";
import { CurrentDateContext } from "../../contexts/CurrentDateContext";
import { FormParents } from "./parents";
import { HouseholdContext } from "../../contexts/HouseholdContext";
import { useInitHousehold } from "../../hooks/initHousehold";

export const FormContent = () => {
  const [result, calculate] = useCalculate();
  const [ShowAlertMessage, setShowAlertMessage] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const validated = useValidate();
  const navigate = useNavigate();
  const currentDate = useContext(CurrentDateContext);
  const { household, setHousehold } = useContext(HouseholdContext);
  const [urlMade, setUrlMade] = useState("");

  const initHousehold = useInitHousehold(currentDate);
  const [decodedHousehold, setDecodedHousehold] = useState<any>({
    世帯員: { あなた: {} },
    世帯: { 世帯1: {} },
  });

  interface pmType {
    [key: string]: string[];
  }
  const pmObj = { ...pmJson } as pmType;
  const prefectureArray = Object.keys(pmObj);

  useEffect(() => {
    if (showResult && result) {
      // HACK: レスポンスを受け取ってからページ遷移（クリック時点で遷移するとresultの更新が反映されない）
      navigate("/result", {
        state: {
          result: result,
          currentDate: currentDate,
        },
      });
    }
  }, [result]);

  const encodeURL = useCallback(() => {
    console.log(household);

    let mem_arr = ["あなた"];
    if ("配偶者一覧" in household.世帯.世帯1) {
      mem_arr = mem_arr.concat(household.世帯.世帯1["配偶者一覧"]);
    }
    if ("子一覧" in household.世帯.世帯1) {
      mem_arr = mem_arr.concat(household.世帯.世帯1["子一覧"]);
    }
    if ("親一覧" in household.世帯.世帯1) {
      mem_arr = mem_arr.concat(household.世帯.世帯1["親一覧"]);
    }
    // console.log(mem_arr);
    let url = "mem";

    for (const mem of mem_arr) {
      if (mem === "あなた") {
        url += "_yo";
      } else if (mem === "配偶者") {
        url += "_sp";
      } else if (mem.substring(0, 1) === "子") {
        url += `_ch${mem.substring(3)}`;
      } else if (mem.substring(0, 1) === "親") {
        url += `_pa${mem.substring(1)}`;
      }
      for (let i in householdData.世帯員) {
        let memberKey = householdData.世帯員[i];
        if (memberKey in household.世帯員[mem]) {
          const memberVal = household.世帯員[mem][memberKey];
          if (
            memberKey === "誕生年月日" ||
            memberKey === "身体障害者手帳交付年月日"
          ) {
            if (memberVal.ETERNITY) {
              url += `_${i}-${memberVal.ETERNITY.replace(/-/g, "")}`;
            }
          } else if (memberKey === "収入") {
            if (memberVal[currentDate]) {
              url += `_${i}-${memberVal[currentDate]}`;
            }
          } else if (memberKey === "学生") {
            if (memberVal[currentDate]) {
              url += `_${i}-1`;
            }
          } else if (memberVal.ETERNITY !== "無") {
            // console.log(memberKey);
            // console.log(memberVal);
            if (
              memberVal.ETERNITY === "有" ||
              memberVal.ETERNITY === "A" ||
              memberVal.ETERNITY.substring(0, 1) === "一"
            ) {
              url += `_${i}-1`;
            } else if (
              memberVal.ETERNITY === "B" ||
              memberVal.ETERNITY.substring(0, 1) === "二"
            ) {
              url += `_${i}-2`;
            } else if (memberVal.ETERNITY.substring(0, 1) === "三") {
              url += `_${i}-3`;
            } else if (memberVal.ETERNITY.substring(0, 1) === "四") {
              url += `_${i}-4`;
            } else if (memberVal.ETERNITY.substring(0, 1) === "五") {
              url += `_${i}-5`;
            } else if (memberVal.ETERNITY.substring(0, 1) === "六") {
              url += `_${i}-6`;
            } else if (memberVal.ETERNITY.substring(0, 1) === "七") {
              url += `_${i}-7`;
            }
          }
        }
      }
    }

    url += "_gro";

    for (let i in householdData.世帯) {
      let memberKey = householdData.世帯[i];
      if (memberKey in household.世帯.世帯1) {
        if (memberKey === "自分一覧" || memberKey === "配偶者一覧") {
          url += `_${i}-1`;
        } else if (memberKey === "子一覧" || memberKey === "親一覧") {
          url += `_${i}-${household.世帯.世帯1[memberKey].length}`;
        } else if (memberKey === "居住都道府県") {
          url =
            url +
            `_${i}-${prefectureArray.indexOf(
              household.世帯.世帯1[memberKey][currentDate]
            )}`;
        } else if (memberKey === "居住市区町村") {
          const municipalityArray =
            pmObj[household.世帯.世帯1["居住都道府県"][currentDate]];
          // console.log(municipalityArray);
          // console.log(household.世帯.世帯1["居住都道府県"][currentDate]);
          url =
            url +
            `_${i}-${municipalityArray.indexOf(
              household.世帯.世帯1[memberKey][currentDate]
            )}`;
        } else if (household.世帯.世帯1[memberKey][currentDate]) {
          url += `_${i}-1`;
        }
      }
    }

    url += "_sei";
    for (let i in householdData.制度) {
      let memberKey = householdData.制度[i];
      if (memberKey in household.世帯.世帯1) {
        url += `_${i}`;
      }
    }
    console.log(url);

    setUrlMade(url);
    return url;
  }, []);

  // URLをデコードしhouseholdを作成
  const decodeURL = useCallback((url: string) => {
    console.log(url);
    const newHousehold = { ...decodedHousehold };
    let groupIdx = url.indexOf("_gro");
    let seidoIdx = url.indexOf("_sei");
    let memberUrl = url.slice(4, groupIdx);
    let groupUrl = url.slice(groupIdx + 5, seidoIdx);
    let seidoUrl = url.slice(seidoIdx + 5);
    console.log(memberUrl);
    console.log(groupUrl);
    console.log(seidoUrl);

    let groupArr = groupUrl.split("_");
    let seidoArr = seidoUrl.split("_");

    let spouseExists = false;
    let childrenNum = 0;
    let parentsNum = 0;

    // 世帯情報を復元
    for (let groupInfo of groupArr) {
      let groupItem = groupInfo.split("-");
      let groupKey = Number(groupItem[0]);
      let groupVal = Number(groupItem[1]);

      if (groupKey === 0) {
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = ["あなた"];
      } else if (groupKey === 1) {
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = ["配偶者"];
        spouseExists = true;
      } else if (groupKey === 2) {
        childrenNum = groupVal;
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = [
          ...Array(groupVal),
        ].map((_, i) => `子ども${i}`);
      } else if (groupKey === 3) {
        parentsNum = groupVal;
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = [
          ...Array(groupVal),
        ].map((_, i) => `親${i}`);
      } else if (groupKey === 4) {
        let prefecture = prefectureArray[groupVal];
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = {
          [currentDate]: prefecture,
        };
      } else if (groupKey === 5) {
        let prefecture = newHousehold.世帯.世帯1["居住都道府県"][currentDate];
        const municipality = pmObj[prefecture][groupVal];
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = {
          [currentDate]: municipality,
        };
      } else if (groupKey === 6) {
        newHousehold.世帯.世帯1[householdData.世帯[groupKey]] = {
          [currentDate]: true,
        };
      }
    }

    // 制度情報を復元
    for (let seidoIdx of seidoArr) {
      newHousehold.世帯.世帯1[householdData.制度[Number(seidoIdx)]] = {
        [currentDate]: null,
      };
    }

    // 世帯員情報を復元
    let memberObj: any = {};
    if (spouseExists) {
      memberObj["あなた"] = memberUrl
        .slice(3, memberUrl.indexOf("_sp"))
        .split("_");
    } else if (childrenNum > 0) {
      memberObj["あなた"] = memberUrl
        .slice(3, memberUrl.indexOf("_ch"))
        .split("_");
    } else if (parentsNum > 0) {
      memberObj["あなた"] = memberUrl
        .slice(3, memberUrl.indexOf("_pa"))
        .split("_");
    } else {
      memberObj["あなた"] = memberUrl.slice(3).split("_");
    }

    if (spouseExists) {
      let spouseIdx = memberUrl.indexOf("_sp") + 4;
      if (childrenNum > 0) {
        memberObj["配偶者"] = memberUrl
          .slice(spouseIdx, memberUrl.indexOf("_ch"))
          .split("_");
      } else if (parentsNum > 0) {
        memberObj["配偶者"] = memberUrl
          .slice(spouseIdx, memberUrl.indexOf("_pa"))
          .split("_");
      } else {
        memberObj["配偶者"] = memberUrl.slice(spouseIdx).split("_");
      }
    }

    let childrenArr = [];
    if (childrenNum > 0) {
      let childrenIdx = memberUrl.indexOf("_ch") + 3;
      if (parentsNum > 0) {
        childrenArr = memberUrl
          .slice(childrenIdx, memberUrl.indexOf("_pa"))
          .split("_ch");
      } else {
        childrenArr = memberUrl.slice(childrenIdx).split("_ch");
      }
      for (let childInfo of childrenArr) {
        let childArr = childInfo.split("_");
        memberObj[`子ども${childArr[0]}`] = childArr.slice(1);
      }
    }

    let parentsArr = [];
    if (parentsNum > 0) {
      let parentsIdx = memberUrl.indexOf("_ch") + 3;
      if (parentsNum > 0) {
        parentsArr = memberUrl
          .slice(parentsIdx, memberUrl.indexOf("_pa"))
          .split("_ch");
      } else {
        parentsArr = memberUrl.slice(parentsIdx).split("_ch");
      }
      for (let parentInfo of parentsArr) {
        let parentArr = parentInfo.split("_");
        memberObj[`親${parentArr[0]}`] = parentArr.slice(1);
      }
    }

    for (let member of Object.keys(memberObj)) {
      newHousehold.世帯員[member] = {};
      let memberArr = memberObj[member];

      for (let memberInfo of memberArr) {
        let memberItem = memberInfo.split("-");
        let memberIdx = Number(memberItem[0]);
        let memberVal = memberItem[1];
        // console.log(memberItem);

        let memberInfoName = householdData.世帯員[memberIdx];
        let householdMem = {};
        if (
          memberInfoName === "誕生年月日" ||
          memberInfoName === "身体障害者手帳交付年月日"
        ) {
          householdMem = {
            ETERNITY: `${memberVal.slice(0, 4)}-${memberVal.slice(
              4,
              6
            )}-${memberVal.slice(6, 8)}`,
          };
        } else if (memberInfoName === "収入") {
          householdMem = {
            [currentDate]: Number(memberVal),
          };
        } else if (memberInfoName === "学生") {
          householdMem = {
            [currentDate]: true,
          };
        } else if (
          // memberInfoName === "身体障害者手帳等級認定" || // TODO: 交付年月日をなくす
          memberInfoName === "精神障害者保健福祉手帳等級"
        ) {
          if (memberVal === "1") {
            householdMem = { [currentDate]: "一級" };
          } else if (memberVal === "2") {
            householdMem = { [currentDate]: "二級" };
          } else if (memberVal === "3") {
            householdMem = { [currentDate]: "三級" };
          } else if (memberVal === "4") {
            householdMem = { [currentDate]: "四級" };
          } else if (memberVal === "5") {
            householdMem = { [currentDate]: "五級" };
          } else if (memberVal === "6") {
            householdMem = { [currentDate]: "六級" };
          } else if (memberVal === "7") {
            householdMem = { [currentDate]: "七級" };
          }
        } else if (memberInfoName === "愛の手帳等級") {
          if (memberVal === "1") {
            householdMem = { [currentDate]: "一度" };
          } else if (memberVal === "2") {
            householdMem = { [currentDate]: "二度" };
          } else if (memberVal === "3") {
            householdMem = { [currentDate]: "三度" };
          } else if (memberVal === "4") {
            householdMem = { [currentDate]: "四度" };
          }
        } else if (memberInfoName === "療育手帳等級") {
          if (memberVal === "1") {
            householdMem = { [currentDate]: "A" };
          } else if (memberVal === "2") {
            householdMem = { [currentDate]: "B" };
          }
        } else if (
          memberInfoName === "内部障害" ||
          memberInfoName === "脳性まひ_進行性筋萎縮症"
        ) {
          householdMem = { [currentDate]: "有" };
        }

        newHousehold.世帯員[member][memberInfoName] = householdMem;
      }
    }

    console.log(newHousehold);

    setDecodedHousehold(newHousehold);
    return newHousehold;
  }, []);

  return (
    <ShowAlertMessageContext.Provider value={ShowAlertMessage}>
      <div>
        <Center
          fontSize={configData.style.subTitleFontSize}
          fontWeight="medium"
          mt={2}
          mb={2}
        >
          {configData.calculationForm.topDescription}
        </Center>

        <form>
          <FormYou />
          <FormSpouse />
          <FormChildren />
          <FormParents />
        </form>

        <Center pr={4} pl={4} pb={4}>
          <Button
            isLoading={loading}
            loadingText="計算する"
            fontSize={configData.style.subTitleFontSize}
            borderRadius="xl"
            height="2em"
            width="100%"
            bg="cyan.600"
            color="white"
            _hover={{ bg: "cyan.700" }}
            onClick={() => {
              // 必須項目が入力されていない場合、結果は表示されずトップへ戻る
              if (!validated) {
                setShowAlertMessage(true);
                scrollTo(0, 0);
                return;
              }
              let url = encodeURL();
              let household = decodeURL(url);
              setLoading(true);
              calculate(household);
              setShowResult(true);
            }}
          >
            計算する
          </Button>
        </Center>
      </div>
    </ShowAlertMessageContext.Provider>
  );
};
