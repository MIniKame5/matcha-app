// 🚨 修正後の新しいベースURL (https://app.matcha-kame.com/apps/) を定数として定義！
const BASE_URL = "https://app.matcha-kame.com/apps/";

// アプリケーションの定義リスト (RAW DATA)
// 🚨 修正: アイコンを全てネイティブ絵文字に戻すぞ！これで可愛さが戻る！
const RAW_APP_DATA = [
    {
        id: "meal_planner",
        title: "AI献立プランナー",
        icon: "🍽️", // 復活: Utensils -> 🍽️
        description: "AIがあなたの冷蔵庫に合わせて献立を提案するよ！"
    },
    {
        id: "chat_app",
        title: "まっちゃチャット",
        icon: "💬", // 復活: MessageCircle -> 💬
        description: "友達や家族とリアルタイムで会話を楽しもう！"
    },
    {
        id: "todo_list",
        title: "シンプルToDoリスト",
        icon: "✅", // 復活: ListChecks -> ✅
        description: "今日のタスクをサクッと管理！忘れ物なし！"
    },
    {
        id: "theme_song_player",
        title: "テーマソングプレイヤー",
        icon: "🎶", // 復活: Music -> 🎶
        description: "まっちゃのテーマソングをいつでも聞けるよ！"
    },
    {
        id: "file_manager",
        title: "倉庫・ファイル管理",
        icon: "📦", // 復活: Archive -> 📦
        description: "大切なファイルをクラウドで安全に管理しよう。"
    },
    {
        id: "settings",
        title: "設定・オプション",
        icon: "⚙️", // 復活: Settings -> ⚙️
        description: "アプリ全体の動作をカスタマイズするぞ！"
    }
];

// IDを使ってBASE_URLと組み合わせ、pathプロパティを動的に生成する！
const APP_DATA = RAW_APP_DATA.map(app => ({
    ...app,
    // HTMLファイル名がIDと同じだと仮定してパスを生成するぞ！
    path: BASE_URL + app.id + '.html'
}));

// このファイルにはアプリケーションリストのデータのみを定義し、
// ロジックはindex.html側で処理するぜ！
