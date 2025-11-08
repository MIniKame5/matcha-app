// 🚨 修正後の新しいベースURL (https://app.matcha-kame.com/apps/) を定数として定義！
const BASE_URL = "https://app.matcha-kame.com/apps/";

// アプリケーションの定義リスト (RAW DATA)
// 🚨 修正: アイコンを全てネイティブ絵文字に戻すぞ！これで可愛さが戻る！
const RAW_APP_DATA = [
    {
        id: "meal_planner",
        title: "AI献立プランナー",
        icon: "🍽️", 
        description: "AIがあなたの冷蔵庫に合わせて献立を提案するよ！"
    },
    {
        id: "TEST",
        title: "テスト",
        icon: "📜", 
        description: "大切なファイルをクラウドで安全に管理しよう。"
    }
];

// IDを使ってBASE_URLと組み合わせ、pathプロパティを動的に生成する！
const APP_DATA = RAW_APP_DATA.map(app => ({
    ...app,
    // 🚨 修正点 ①: アプリのパスを「apps/ID/ID.html」の形式に修正するぞ！
    // 例: BASE_URL + 'meal_planner' + '/' + 'meal_planner' + '.html'
    path: BASE_URL + app.id + '/' + app.id + '.html'
}));

// このファイルにはアプリケーションリストのデータのみを定義し、
// ロジックはindex.html側で処理するぜ！