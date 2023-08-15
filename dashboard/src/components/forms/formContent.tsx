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
              navigate(`/result/${url}`);

              /*
              let household = decodeURL(url);
              setLoading(true);
              calculate(household);
              setShowResult(true);
              */
            }}
          >
            計算する
          </Button>
        </Center>
      </div>
    </ShowAlertMessageContext.Provider>
  );
};
