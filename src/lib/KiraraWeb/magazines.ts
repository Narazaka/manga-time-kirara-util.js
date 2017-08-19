/** まんがタイムきらら公式サイト雑誌情報 */

/** */

import * as client from "cheerio-httpcli";

/** 雑誌の種類と雑誌の日本語名の対応 */
export const magazineType = {
    kirara: "まんがタイムきらら",
    max: "まんがタイムきららMAX",
    carat: "まんがタイムきららキャラット",
    forward: "まんがタイムきららフォワード",
    miracle: "まんがタイムきららミラク",
};

/** 雑誌の種類 */
export type MagazineType = keyof typeof magazineType;

/** 雑誌情報 */
export class MagazineInformation {
    constructor(
        /** 雑誌の種類 */
        public type: MagazineType,
        /** 大きい表紙画像 */
        public largeImageUrl: string,
        /** 掲載作品 */
        public lineup: string[],
        /** 今月の読みどころ */
        public description: string,
    ) { }

    /** 雑誌の種類の日本語文字列 */
    get typeText() {
        return magazineType[this.type];
    }

    /**
     * 雑誌情報を取得する
     * @param type 雑誌の種類
     * @param mid URLのmidパラメーター 省略した場合最新号
     */
    static async fetch(type: MagazineType, mid?: number) {
        const { $ } = await client.fetch(`http://www.dokidokivisual.com/magazine/${type}/book/index.php`, { mid });
        const largeImageUrl = $(".photo img").url()[0];
        const lineup: string[] = [];
        $(".photo .lineup li").each((_, li) => {
            const $li = $(li);
            lineup.push($li.text().trim());
        });
        const description = $("#latest-title .info").html();
        return new MagazineInformation(type, largeImageUrl, lineup, description);
    }
}

/** バックナンバーにおける雑誌情報 */
export class MagazineBackNumberInformation {
    constructor(
        /** 雑誌の種類 */
        public type: MagazineType,
        /** 年 */
        public year: number,
        /** 月 */
        public month: number,
        /** 詳細ページURL */
        public detailUrl: string,
        /** 小さい表紙画像 */
        public normalImageUrl: string,
    ) { }

    get mid() {
        return Number(this.detailUrl.match(/\d+$/)!.toString());
    }

    /** 雑誌情報を取得する */
    async magazineInformation() {
        return await MagazineInformation.fetch(this.type, this.mid);
    }
}

/**
 * 雑誌のバックナンバー一覧を取得する
 * @param type 雑誌の種類
 * @param y 年 省略した場合最新年
 */
export async function fetchMagazineBackNumber(type: MagazineType, y?: number) {
    const { $ } = await client.fetch(`http://www.dokidokivisual.com/magazine/${type}/backnumber/index.php`, { y });
    const magazineBackNumberInformations = [] as MagazineBackNumberInformation[];
    $(".lineup .extra").each((_, elem) => {
        const $elem = $(elem);
        const [__, yearStr, monthStr] = $elem.find("h3").text().match(/(\d+)\D+?(\d+)/) as RegExpMatchArray;
        const year = Number(yearStr);
        const month = Number(monthStr);
        const detailUrl = $elem.find(".r-photo a").url() as string;
        const normalImageUrl = $elem.find(".r-photo img").url() as string;
        magazineBackNumberInformations.push(new MagazineBackNumberInformation(type, year, month, detailUrl, normalImageUrl));
    });
    return magazineBackNumberInformations;
}
