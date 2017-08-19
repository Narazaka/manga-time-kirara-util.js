/** まんがタイムきらら公式サイト新刊情報 */

/** */

import * as client from "cheerio-httpcli";

/** 購入用URL */
export interface BuyUrl {
    "amazon": string;
    "e-hon": string;
    "honya-club": string;
    "楽天ブックス": string;
    "7-net": string;
}

/** 単行本情報 */
export class ComicInformation {
    /** 大きい表紙画像 (要fetchDetail) */
    largeImageUrl?: string;
    /** ISBN (要fetchDetail) */
    isbn?: string;
    /** ちょい読みURL (要fetchDetail/発売後) */
    previewUrl?: string;
    /** 購入用URL (要fetchDetail) */
    buyUrl?: BuyUrl;

    constructor(
        /** タイトル */
        public title: string,
        /** 作者 */
        public author: string,
        /** 説明 */
        public description: string,
        /** 詳細ページURL */
        public detailUrl: string,
        /** 小さい表紙画像 */
        public normalImageUrl: string,
        /** 発売日 */
        public date: Date,
        /** 価格(円/税抜) */
        public price: number,
    ) { }

    /** 詳細ページにある情報を取得 */
    async fetchDetail() {
        const { $ } = await client.fetch(this.detailUrl);
        const $introduction = $(".introduction");
        this.largeImageUrl = $introduction.find(".intro-left img").url() as string;
        this.isbn = $introduction.find(".isbn").text().replace(/[^\d-]/g, "");
        this.buyUrl = {} as BuyUrl;
        $introduction.find(".buy option").each((_, option) => {
            const $option = $(option);
            const url = $option.attr("value");
            if (url && url.trim().length) (this.buyUrl as any)[$option.text().trim()] = url;
        });
        this.previewUrl = $introduction.find(".choiyomi .read a").url() as string;
    }
}

/** 新刊情報一覧を取得 */
export async function fetchComicInformations() {
    const { $ } = await client.fetch("http://www.dokidokivisual.com/comics/");
    const comicInformations: ComicInformation[] = [];
    $(".monthly .item").each((_, elem) => {
        const $elem = $(elem);
        const title = $elem.find("h3").text();
        const author = $elem.find("h3 + p").text();
        const description = $elem.find(".desc").text().trim();
        const detailUrl = $elem.find(".photo a").url() as string;
        const normalImageUrl = $elem.find(".photo img").url() as string;
        const infoTxt = $($elem.find("p").toArray().find((e) => $(e).text().startsWith("発売日"))).text();
        const [__, year, month, mday, priceStr] = infoTxt.match(/^.*?:\D*?(\d+)\D*?(\d+)\D*(\d+).*?定価.*?(\d+)/) as RegExpMatchArray;
        const date = new Date(Number(year), Number(month) - 1, Number(mday));
        const price = Number(priceStr);
        comicInformations.push(new ComicInformation(title, author, description, detailUrl, normalImageUrl, date, price));
    });
    return comicInformations;
}
