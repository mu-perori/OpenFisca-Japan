import { useContext, useState, useCallback } from "react";
import { HouseholdContext } from "../contexts/HouseholdContext";
import { APIServerURLContext } from "../contexts/APIServerURLContext";
import householdData from "../config/household.json";

export const useInitHousehold = (currentDate: string) => {
  const lastYearDate = `${new Date().getFullYear() - 1}-${(
    new Date().getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-01`;
  let household: any;
  household = { 世帯員: { あなた: {} }, 世帯: { 世帯1: {} } };
  for (let memberKey of householdData.世帯員) {
    let memberVal;
    if (memberKey === "誕生年月日") {
      memberVal = { ETERNITY: "" };
    } else if (memberKey === "収入") {
      memberVal = { [currentDate]: 0 };
    } else if (memberKey === "身体障害者手帳交付年月日") {
      memberVal = { ETERNITY: lastYearDate };
    } else if (memberKey === "学生") {
      memberVal = { [currentDate]: false };
    } else {
      memberVal = { ETERNITY: "無" };
    }
    household.世帯員.あなた[memberKey] = memberVal;
  }

  for (let memberKey of householdData.世帯) {
    let memberVal;
    if (memberKey === "自分一覧") {
      memberVal = ["あなた"];
    } else if (
      memberKey === "配偶者一覧" ||
      memberKey === "子一覧" ||
      memberKey === "親一覧"
    ) {
      continue;
    } else {
      memberVal = {
        [currentDate]: null,
      };
    }
    household.世帯.世帯1[memberKey] = memberVal;
  }

  for (let memberKey of householdData.制度) {
    // 住宅入居費は「家を借りたい」にチェックが入った時に追加
    // 東京都のみの制度は居住都道府県が東京都の場合に追加
    if (memberKey === "住宅入居費" || memberKey.slice(0, 3) === "東京都") {
      continue;
    }
    let memberVal = {
      [currentDate]: null,
    };

    household.世帯.世帯1[memberKey] = memberVal;
  }
  return household;
};
