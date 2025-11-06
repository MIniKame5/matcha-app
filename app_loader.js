/**
 * =========================================================================
 * MATCH A P P S L O A D E R
 * アプリケーション一覧のデータ定義ファイル
 *
 * 🚨 注意: このファイルにJSON/JavaScriptの文法エラーがあると、
 * アプリ一覧画面がフリーズして「アプリを読み込み中...」から進まなくなります。
 * =========================================================================
 */

// 🚨 修正後の新しいベースURL (https://app.matcha-kame.com/apps/) を定数として定義！
// URLの末尾には "/" が付いていることを確認！
const BASE_URL = "https://app.matcha-kame.com/apps/";

// アプリケーションの定義リスト (RAW DATA)
// 🚨 修正: ユーザーが不要なアプリを削除し、残った3つを定義！
const RAW_APP_DATA = [
    {
        id: "meal_planner",
        title: "AI献立プランナー",
        icon: "🍽️",
        description: "AIがあなたの冷蔵庫に合わせて献立を提案するよ！"
    },
    {
        id: "chat_app",
        title: "かめっせーじ",
        icon: "💬",
        description: "友達や家族とリアルタイムで会話を楽しもう！※開発中"
    },
    {
        id: "todo_list",
        title: "シンプルToDoリスト",
        icon: "✅",
        description: "今日のタスクをサクッと管理！忘れ物なし！※開発中"
    }
];

// IDを使って新しいフォルダ構成に合わせてpathプロパティを動的に生成する！
// 🚀 新しいパス形式: apps/{アプリID}/{アプリID}.index
const APP_DATA = RAW_APP_DATA.map(app => ({
    ...app,
    path: BASE_URL + app.id + '/' + app.id + '.html'
}));

// このファイルにはアプリケーションリストのデータのみを定義し、
// ロジックはindex.html側で処理するぜ！

