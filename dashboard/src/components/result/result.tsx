import { useLocation, useParams } from "react-router-dom";
import { Center, Button, Box, Spinner } from "@chakra-ui/react";
import { useRef, useState, useCallback, useEffect } from "react";
import * as htmlToImage from "html-to-image";

import configData from "../../config/app_config.json";
import householdData from "../../config/household.json";
import pmJson from "../../config/都道府県市区町村.json";
import { Benefit } from "./benefit";
import { Loan } from "./loan";
import { useCalculate } from "../../hooks/calculate";

const createFileName = (extension: string = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }

  return `${names.join("")}.${extension}`;
};

export const Result = () => {
  /*
  const location = useLocation();
  const { result, currentDate } = location.state as {
    result: any;
    currentDate: string;
  };
  */

  // 日付は「YYYY-MM-DD」の桁数フォーマットでないとOpenFisca APIが正常動作しない
  const currentDate = `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${new Date().getDate().toString().padStart(2, "0")}`;

  const [decodedHousehold, setDecodedHousehold] = useState<any>({
    世帯員: { あなた: {} },
    世帯: { 世帯1: {} },
  });

  interface pmType {
    [key: string]: string[];
  }
  const pmObj = { ...pmJson } as pmType;
  const prefectureArray = Object.keys(pmObj);

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

  const { encodedHousehold } = useParams();
  const [result, calculate] = useCalculate();

  useEffect(() => {
    if (encodedHousehold) {
      const household = decodeURL(encodedHousehold);
      calculate(household);
    }
  }, []);

  const divRef = useRef<HTMLDivElement | null>(null);
  const [loadingScreenshotDownload, setLoadingScreenshotDownload] =
    useState(false);

  const takeScreenShot = async (
    node: HTMLDivElement | null
  ): Promise<string> => {
    setLoadingScreenshotDownload(true);
    if (!node) {
      throw new Error("Invalid element reference.");
    }
    const dataURI = await htmlToImage.toJpeg(node, {
      backgroundColor: "#C4F1F9",
    });
    return dataURI;
  };

  const download = (
    image: string,
    {
      name = "お金サポート_結果",
      extension = "jpg",
    }: { name?: string; extension?: string } = {}
  ): void => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
    setLoadingScreenshotDownload(false);
  };

  const downloadScreenshot = (): void => {
    if (divRef.current) {
      takeScreenShot(divRef.current).then(download);
    }
  };

  return (
    <div ref={divRef}>
      <Center
        fontSize={configData.style.subTitleFontSize}
        fontWeight="medium"
        mt={2}
        mb={2}
      >
        {configData.result.topDescription}
      </Center>
      {/* <Box>{encodedHousehold}</Box> */}

      {!result && (
        <Center>
          <Spinner mt={5} mb={5} thickness="4px" size="xl" color="cyan.600" />
        </Center>
      )}

      {result && (
        <>
          <Benefit result={result} currentDate={currentDate} />
          <Loan result={result} currentDate={currentDate} />
        </>
      )}

      <Center pr={4} pl={4} pb={4}>
        <Button
          onClick={downloadScreenshot}
          loadingText={"読み込み中..."}
          isLoading={loadingScreenshotDownload}
          as="button"
          fontSize={configData.style.subTitleFontSize}
          borderRadius="xl"
          height="2em"
          width="100%"
          bg="gray.500"
          color="white"
          _hover={{ bg: "gray.600" }}
        >
          {configData.result.screenshotButtonText}
        </Button>
      </Center>

      <Center pr={4} pl={4} pb={4}>
        {configData.result.questionnaireDescription[0]}
      </Center>

      <Center pr={4} pl={4} pb={4}>
        {/* When returning to this calculation result page from the questionnaire form on a PC browser (Chrome, Edge) deployed by Netlify, it will be 404, so open it in a new tab */}
        <Button
          as="a"
          href={configData.URL.questionnaire_form}
          fontSize={configData.style.subTitleFontSize}
          borderRadius="xl"
          height="2em"
          width="100%"
          bg="cyan.600"
          color="white"
          _hover={{ bg: "cyan.700" }}
          target="_blank"
          rel="noopener noreferrer"
        >
          アンケートに答える
        </Button>
      </Center>
    </div>
  );
};
